const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const trafficController = require('../controllers/trafficController');
const datasetController = require('../controllers/datasetController');

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(__dirname, '../../../data/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `dataset-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  }
});

// System & Metadata
router.get('/health', trafficController.getHealth);
router.get('/filters', trafficController.getFilters);

// Dataset Studio Endpoints
router.get('/datasets', datasetController.listDatasets);
router.get('/datasets/active', datasetController.getActiveDataset);
router.post('/datasets/activate', datasetController.activateDataset);
router.post('/datasets/inspect', upload.single('file'), datasetController.inspectCsv);
router.post('/datasets/process', datasetController.processDataset);

// Traffic Patterns & Granularities
router.get('/traffic/summary', trafficController.getTrafficSummary);
router.get('/traffic/trends', trafficController.getTrafficTrends);
router.get('/traffic/hourly', trafficController.getTrafficHourly); // Honest unavailable handler
router.get('/traffic/daily', trafficController.getTrafficDaily);
router.get('/traffic/monthly', trafficController.getTrafficMonthly);
router.get('/traffic/locations', trafficController.getTrafficLocations);
router.get('/traffic/hotspots', trafficController.getTrafficHotspots);

// Analytical Domains
router.get('/incidents', trafficController.getIncidents);
router.get('/vehicles', trafficController.getVehicles);
router.get('/insights', trafficController.getInsights);

module.exports = router;

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const Dataset = require('../models/Dataset');
const TrafficRecord = require('../models/TrafficRecord');

const PYTHON_PATH = 'C:\\Users\\Ujair\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
const PIPELINE_SCRIPT = path.resolve(__dirname, '../../../analytics/pipeline.py');

// 1. GET /api/datasets
exports.listDatasets = async (req, res, next) => {
  try {
    const datasets = await Dataset.find().sort({ uploaded_at: -1 });
    res.status(200).json({
      success: true,
      data: datasets,
      meta: { count: datasets.length }
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/datasets/active
exports.getActiveDataset = async (req, res, next) => {
  try {
    let active = await Dataset.findOne({ is_active: true });
    if (!active) {
      active = await Dataset.findOne().sort({ createdAt: -1 });
      if (active) {
        active.is_active = true;
        await active.save();
      }
    }

    if (!active) {
      return res.status(404).json({
        success: false,
        error: 'No datasets found in database.'
      });
    }

    res.status(200).json({
      success: true,
      data: active
    });
  } catch (error) {
    next(error);
  }
};

// 3. POST /api/datasets/activate
exports.activateDataset = async (req, res, next) => {
  try {
    const { dataset_id } = req.body;
    if (!dataset_id) {
      return res.status(400).json({
        success: false,
        error: 'dataset_id is required in request body.'
      });
    }

    const target = await Dataset.findOne({ dataset_id });
    if (!target) {
      return res.status(404).json({
        success: false,
        error: `Dataset with ID '${dataset_id}' not found.`
      });
    }

    // Set all to false, then target to true
    await Dataset.updateMany({}, { $set: { is_active: false } });
    target.is_active = true;
    await target.save();

    res.status(200).json({
      success: true,
      message: `Active dataset switched to '${target.dataset_name}' (${target.dataset_id}).`,
      data: target
    });
  } catch (error) {
    next(error);
  }
};

// 4. POST /api/datasets/inspect (Preview uploaded CSV before PySpark processing)
exports.inspectCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No CSV file uploaded.'
      });
    }

    const filePath = req.file.path;
    const fileStats = fs.statSync(filePath);

    // Fast streaming inspection
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let headers = [];
    let rowCount = 0;
    const citiesSet = new Set();
    const areasSet = new Set();
    const vehicleTypesSet = new Set();
    let minDate = null;
    let maxDate = null;

    let cityIdx = -1;
    let areaIdx = -1;
    let dateIdx = -1;
    let vehicleIdx = -1;

    for await (const line of rl) {
      if (!line.trim()) continue;
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

      if (headers.length === 0) {
        headers = cols;
        const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[\s_]+/g, ''));
        cityIdx = lowerHeaders.findIndex(h => ['city', 'metro', 'district'].includes(h));
        areaIdx = lowerHeaders.findIndex(h => ['area', 'location', 'corridor', 'junction'].includes(h));
        dateIdx = lowerHeaders.findIndex(h => ['date', 'timestamp', 'datetime'].includes(h));
        vehicleIdx = lowerHeaders.findIndex(h => ['vehicle_type', 'vehicletype', 'vehicle', 'mode'].includes(h));
      } else {
        rowCount++;
        if (cityIdx !== -1 && cols[cityIdx]) citiesSet.add(cols[cityIdx]);
        if (areaIdx !== -1 && cols[areaIdx]) areasSet.add(cols[areaIdx]);
        if (vehicleIdx !== -1 && cols[vehicleIdx]) vehicleTypesSet.add(cols[vehicleIdx]);
        if (dateIdx !== -1 && cols[dateIdx]) {
          const d = cols[dateIdx];
          if (!minDate || d < minDate) minDate = d;
          if (!maxDate || d > maxDate) maxDate = d;
        }
      }
    }

    const detectedCities = Array.from(citiesSet);
    const detectedAreas = Array.from(areasSet);
    const detectedVehicles = Array.from(vehicleTypesSet);

    // Suggest dataset name
    const cityName = detectedCities.length > 0 ? detectedCities.join(' / ') : 'Metropolitan';
    const suggestedName = `${cityName} Traffic Pattern Analytics (${minDate && minDate.slice(0, 4) ? minDate.slice(0, 4) : '2025'})`;
    const suggestedId = `dataset_${detectedCities[0] ? detectedCities[0].toLowerCase().replace(/\s+/g, '_') : 'custom'}_${Date.now()}`;

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.originalname,
        file_size_bytes: fileStats.size,
        file_size_formatted: `${(fileStats.size / 1024).toFixed(1)} KB`,
        temp_file_path: filePath,
        record_count: rowCount,
        detected_columns: headers,
        detected_cities: detectedCities,
        detected_areas: detectedAreas,
        detected_vehicle_types: detectedVehicles,
        date_range: {
          start: minDate || 'Unknown',
          end: maxDate || 'Unknown'
        },
        suggested_name: suggestedName,
        suggested_id: suggestedId,
        available_analytics: {
          spatial_hotspots: detectedAreas.length > 0,
          temporal_patterns: !!minDate,
          vehicle_modal_split: detectedVehicles.length > 0,
          incident_surveillance: headers.some(h => /accident|crash|violation/i.test(h))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. POST /api/datasets/process (Execute PySpark on CSV and switch active dataset)
exports.processDataset = async (req, res, next) => {
  const { temp_file_path, dataset_id, dataset_name } = req.body;

  if (!temp_file_path || !fs.existsSync(temp_file_path)) {
    return res.status(400).json({
      success: false,
      error: 'Valid temp_file_path is required.'
    });
  }

  const sanitizedId = (dataset_id || `dataset_${Date.now()}`).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedName = (dataset_name || 'Dynamic Traffic Dataset').trim();

  console.log(`[DATASET PROCESS] Launching PySpark for dataset_id='${sanitizedId}' (${sanitizedName})...`);

  const args = [
    PIPELINE_SCRIPT,
    '--input-csv', temp_file_path,
    '--dataset-id', sanitizedId,
    '--dataset-name', sanitizedName
  ];

  const pyProcess = spawn(PYTHON_PATH, args, {
    cwd: path.resolve(__dirname, '../../../analytics'),
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8'
    }
  });

  let stdoutData = '';
  let stderrData = '';

  pyProcess.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
    console.log(`[PYSPARK STDOUT] ${chunk.toString().trim()}`);
  });

  pyProcess.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
    console.error(`[PYSPARK STDERR] ${chunk.toString().trim()}`);
  });

  pyProcess.on('close', async (code) => {
    if (code === 0) {
      console.log(`[DATASET PROCESS] PySpark completed successfully for '${sanitizedId}'.`);
      try {
        const activeDataset = await Dataset.findOne({ dataset_id: sanitizedId });
        return res.status(200).json({
          success: true,
          message: `PySpark successfully processed and activated dataset '${sanitizedName}'.`,
          data: activeDataset,
          output: stdoutData.split('\n').filter(l => l.includes('STAGE') || l.includes('SUCCESS') || l.includes('Rows'))
        });
      } catch (err) {
        return next(err);
      }
    } else {
      console.error(`[DATASET PROCESS] PySpark failed with exit code ${code}.`);
      console.error(`[DATASET PROCESS COMPLETE STDERR]:\n${stderrData}`);
      console.error(`[DATASET PROCESS COMPLETE STDOUT]:\n${stdoutData}`);
      return res.status(500).json({
        success: false,
        error: `PySpark processing failed with exit code ${code}. The current active dataset remains unchanged.`,
        details: stderrData || stdoutData
      });
    }
  });

  pyProcess.on('error', (err) => {
    console.error(`[DATASET PROCESS] Failed to start python process: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: `Failed to spawn PySpark pipeline: ${err.message}. The current active dataset remains unchanged.`
    });
  });
};

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes/apiRoutes');
const errorHandler = require('./src/middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Root route for sanity check
app.get('/', (req, res) => {
  res.json({
    message: 'Mumbai Traffic Pattern Analytics API is running.',
    docs: '/api/health'
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.originalUrl} not found.`,
    meta: { timestamp: new Date().toISOString() }
  });
});

// Centralized error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`[BACKEND SERVER] Server active in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[BACKEND SERVER] Health endpoint available at http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[UNHANDLED REJECTION]: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;

const mongoose = require('mongoose');

const TrafficAnalyticsSchema = new mongoose.Schema({
  dataset_id: { type: String, required: true, index: true },
  metric_type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, {
  collection: 'traffic_analytics',
  timestamps: false
});

// Compound index so each dataset has unique metric_type documents
TrafficAnalyticsSchema.index({ dataset_id: 1, metric_type: 1 }, { unique: true });

module.exports = mongoose.model('TrafficAnalytics', TrafficAnalyticsSchema);

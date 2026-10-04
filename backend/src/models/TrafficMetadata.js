const mongoose = require('mongoose');

const TrafficMetadataSchema = new mongoose.Schema({
  dataset_id: { type: String, required: true, index: true },
  pipeline_run_time: { type: String, required: true },
  dataset_name: { type: String, required: true },
  record_count: { type: Number, required: true },
  cities: [{ type: String }],
  areas: [{ type: String }],
  vehicle_types: [{ type: String }],
  date_range: {
    start: { type: String },
    end: { type: String }
  },
  capabilities: { type: mongoose.Schema.Types.Mixed },
  centroids_disclaimer: { type: String }
}, {
  collection: 'traffic_metadata',
  timestamps: false
});

module.exports = mongoose.model('TrafficMetadata', TrafficMetadataSchema);

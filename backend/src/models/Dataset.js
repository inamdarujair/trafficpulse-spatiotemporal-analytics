const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema({
  dataset_id: { type: String, required: true, unique: true, index: true },
  dataset_name: { type: String, required: true },
  filename: { type: String },
  uploaded_at: { type: Date, default: Date.now },
  record_count: { type: Number, required: true },
  date_range: {
    start: { type: String },
    end: { type: String }
  },
  cities: [{ type: String }],
  areas: [{ type: String }],
  vehicle_types: [{ type: String }],
  detected_columns: [{ type: String }],
  capabilities: { type: mongoose.Schema.Types.Mixed },
  is_active: { type: Boolean, default: false, index: true }
}, {
  collection: 'datasets',
  timestamps: true
});

module.exports = mongoose.model('Dataset', DatasetSchema);

const mongoose = require('mongoose');

const TrafficRecordSchema = new mongoose.Schema({
  dataset_id: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  city: { type: String, required: true, index: true },
  area: { type: String, required: true, index: true },
  vehicle_type: { type: String, required: true, index: true },
  vehicle_count: { type: Number, required: true },
  accidents: { type: Number, required: true },
  traffic_violations: { type: Number, required: true },
  avg_speed_kmph: { type: Number, required: true },
  congestion_level: { type: String, required: true, index: true },
  year: { type: Number },
  month: { type: Number, index: true },
  month_name: { type: String },
  day_of_week: { type: Number, index: true },
  day_name: { type: String },
  week_of_year: { type: Number },
  is_weekend: { type: Boolean }
}, {
  collection: 'traffic_records',
  timestamps: false
});

module.exports = mongoose.model('TrafficRecord', TrafficRecordSchema);

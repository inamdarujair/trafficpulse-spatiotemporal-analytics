const mongoose = require('mongoose');

const TrafficHotspotSchema = new mongoose.Schema({
  dataset_id: { type: String, required: true, index: true },
  area: { type: String, required: true, index: true },
  total_volume: { type: Number, required: true },
  avg_volume: { type: Number, required: true },
  total_accidents: { type: Number, required: true },
  total_violations: { type: Number, required: true },
  avg_speed: { type: Number, required: true },
  dominant_congestion: { type: String },
  record_count: { type: Number, required: true },
  accident_rate_per_k: { type: Number },
  violation_rate_per_k: { type: Number },
  composite_score: { type: Number, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  locality: { type: String },
  zone: { type: String },
  rank: { type: Number, required: true, index: true },
  hotspot_level: { type: String, required: true, index: true }
}, {
  collection: 'traffic_hotspots',
  timestamps: false
});

module.exports = mongoose.model('TrafficHotspot', TrafficHotspotSchema);

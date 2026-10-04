const mongoose = require('mongoose');

const TrafficInsightSchema = new mongoose.Schema({
  dataset_id: { type: String, required: true, index: true },
  generated_at: { type: String, required: true },
  facts: { type: mongoose.Schema.Types.Mixed, required: true },
  sentences: [{ type: String }],
  disclaimer: { type: String }
}, {
  collection: 'traffic_insights',
  timestamps: false
});

module.exports = mongoose.model('TrafficInsight', TrafficInsightSchema);

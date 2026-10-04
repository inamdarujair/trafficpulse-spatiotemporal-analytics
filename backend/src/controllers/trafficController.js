const TrafficRecord = require('../models/TrafficRecord');
const TrafficAnalytics = require('../models/TrafficAnalytics');
const TrafficHotspot = require('../models/TrafficHotspot');
const TrafficInsight = require('../models/TrafficInsight');
const TrafficMetadata = require('../models/TrafficMetadata');
const Dataset = require('../models/Dataset');

// Helper to resolve active dataset ID dynamically
const getActiveDatasetId = async (requestedId) => {
  if (requestedId && requestedId.trim()) return requestedId.trim();
  const active = await Dataset.findOne({ is_active: true });
  if (active) return active.dataset_id;
  const any = await Dataset.findOne().sort({ createdAt: -1 });
  return any ? any.dataset_id : 'mumbai_traffic_2025';
};

// Helper to build MongoDB query match object from request query parameters and dataset_id
const buildFilterQuery = (query, dataset_id) => {
  const filter = { dataset_id };

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = query.startDate;
    if (query.endDate) filter.date.$lte = query.endDate;
  }

  if (query.area && query.area !== 'All') {
    if (Array.isArray(query.area)) {
      filter.area = { $in: query.area };
    } else {
      filter.area = query.area;
    }
  }

  if (query.vehicleType && query.vehicleType !== 'All') {
    if (Array.isArray(query.vehicleType)) {
      filter.vehicle_type = { $in: query.vehicleType };
    } else {
      filter.vehicle_type = query.vehicleType;
    }
  }

  if (query.dayOfWeek && query.dayOfWeek !== 'All') {
    const num = parseInt(query.dayOfWeek, 10);
    if (!isNaN(num)) {
      filter.day_of_week = num;
    } else {
      filter.day_name = query.dayOfWeek;
    }
  }

  if (query.congestionLevel && query.congestionLevel !== 'All') {
    filter.congestion_level = query.congestionLevel;
  }

  return filter;
};

// Check if any query filters were passed
const hasFilters = (query) => {
  return !!(
    (query.startDate && query.startDate.trim()) ||
    (query.endDate && query.endDate.trim()) ||
    (query.area && query.area !== 'All') ||
    (query.vehicleType && query.vehicleType !== 'All') ||
    (query.dayOfWeek && query.dayOfWeek !== 'All') ||
    (query.congestionLevel && query.congestionLevel !== 'All')
  );
};

// 1. GET /api/health
exports.getHealth = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const activeDataset = await Dataset.findOne({ dataset_id });
    const recordCount = await TrafficRecord.countDocuments({ dataset_id });

    res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        database: 'Connected (MongoDB Atlas)',
        active_dataset_id: dataset_id,
        active_dataset_name: activeDataset ? activeDataset.dataset_name : 'Default',
        record_count: recordCount,
        timestamp: new Date().toISOString()
      },
      meta: { service: 'trafficpulse-api', version: '2.0.0' }
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/filters
exports.getFilters = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const meta = await TrafficMetadata.findOne({ dataset_id });
    const activeDataset = await Dataset.findOne({ dataset_id });

    const areas = await TrafficRecord.distinct('area', { dataset_id });
    const vehicleTypes = await TrafficRecord.distinct('vehicle_type', { dataset_id });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const congestionLevels = await TrafficRecord.distinct('congestion_level', { dataset_id });

    const dateStats = await TrafficRecord.aggregate([
      { $match: { dataset_id } },
      {
        $group: {
          _id: null,
          minDate: { $min: '$date' },
          maxDate: { $max: '$date' }
        }
      }
    ]);

    const dateRange = dateStats.length > 0
      ? { start: dateStats[0].minDate, end: dateStats[0].maxDate }
      : (meta ? meta.date_range : { start: '2025-01-01', end: '2025-12-31' });

    res.status(200).json({
      success: true,
      data: {
        dataset_id,
        dataset_name: activeDataset ? activeDataset.dataset_name : (meta ? meta.dataset_name : 'Traffic Dataset'),
        cities: activeDataset ? activeDataset.cities : (meta ? meta.cities : ['Metropolitan']),
        areas: areas.sort(),
        vehicleTypes: vehicleTypes.sort(),
        dayNames,
        congestionLevels: congestionLevels.sort(),
        dateRange,
        capabilities: meta ? meta.capabilities : {
          traffic_volume: true,
          temporal_daily: true,
          temporal_hourly: false,
          temporal_granularity: 'daily',
          location_area: true,
          location_city: true,
          location_gps: false,
          vehicle_analysis: true,
          accident_analysis: true,
          violation_analysis: true,
          speed_analysis: true,
          congestion_analysis: true
        },
        disclaimer: meta ? meta.centroids_disclaimer : 'Marker positions represent approximate geographic area centroids for metropolitan visualization, not measured GPS points.'
      },
      meta: { dataset_id, totalAreas: areas.length, totalVehicleTypes: vehicleTypes.length }
    });
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/traffic/summary (KPIs)
exports.getTrafficSummary = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const filter = buildFilterQuery(req.query, dataset_id);

    // If no filters, check pre-aggregated summary first
    if (!hasFilters(req.query)) {
      const cached = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'summary' });
      if (cached && cached.data) {
        return res.status(200).json({
          success: true,
          data: cached.data,
          meta: { dataset_id, source: 'pre_aggregated', filtered: false }
        });
      }
    }

    // Dynamic aggregation pipeline for filtered requests
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          total_records: { $sum: 1 },
          total_volume: { $sum: '$vehicle_count' },
          avg_vehicle_count: { $avg: '$vehicle_count' },
          total_accidents: { $sum: '$accidents' },
          total_violations: { $sum: '$traffic_violations' },
          avg_speed: { $avg: '$avg_speed_kmph' },
          start_date: { $min: '$date' },
          end_date: { $max: '$date' }
        }
      }
    ];

    const result = await TrafficRecord.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total_records: 0,
          total_volume: 0,
          avg_vehicle_count: 0,
          total_accidents: 0,
          total_violations: 0,
          avg_speed: 0,
          start_date: null,
          end_date: null
        },
        meta: { dataset_id, source: 'dynamic_aggregation', filtered: true, count: 0 }
      });
    }

    const summary = {
      total_records: result[0].total_records,
      total_volume: result[0].total_volume,
      avg_vehicle_count: Math.round(result[0].avg_vehicle_count * 100) / 100,
      total_accidents: result[0].total_accidents,
      total_violations: result[0].total_violations,
      avg_speed: Math.round(result[0].avg_speed * 100) / 100,
      start_date: result[0].start_date,
      end_date: result[0].end_date
    };

    res.status(200).json({
      success: true,
      data: summary,
      meta: { dataset_id, source: 'dynamic_aggregation', filtered: true }
    });
  } catch (error) {
    next(error);
  }
};

// 4. GET /api/traffic/trends (Daily volume trend over time)
exports.getTrafficTrends = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const filter = buildFilterQuery(req.query, dataset_id);

    if (!hasFilters(req.query)) {
      const cached = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'daily_trend' });
      if (cached && cached.data) {
        return res.status(200).json({
          success: true,
          data: cached.data,
          meta: { dataset_id, source: 'pre_aggregated', count: cached.data.length }
        });
      }
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$date',
          date: { $first: '$date' },
          day_name: { $first: '$day_name' },
          month_name: { $first: '$month_name' },
          total_volume: { $sum: '$vehicle_count' },
          avg_volume: { $avg: '$vehicle_count' },
          accidents: { $sum: '$accidents' },
          traffic_violations: { $sum: '$traffic_violations' },
          avg_speed: { $avg: '$avg_speed_kmph' },
          record_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: 1,
          day_name: 1,
          month_name: 1,
          total_volume: 1,
          avg_volume: { $round: ['$avg_volume', 2] },
          accidents: 1,
          traffic_violations: 1,
          avg_speed: { $round: ['$avg_speed', 2] },
          record_count: 1
        }
      }
    ];

    const trends = await TrafficRecord.aggregate(pipeline);
    res.status(200).json({
      success: true,
      data: trends,
      meta: { dataset_id, source: 'dynamic_aggregation', count: trends.length }
    });
  } catch (error) {
    next(error);
  }
};

// 5. GET /api/traffic/hourly (Honest handler)
exports.getTrafficHourly = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    res.status(200).json({
      success: false,
      error: 'Temporal resolution unavailable: The dataset provides daily-level observations. Hourly timestamps are not present in the underlying data.',
      meta: {
        dataset_id,
        supported_granularity: 'daily',
        unsupported_granularity: 'hourly',
        recommendation: 'Use /api/traffic/trends or /api/traffic/daily for date-level temporal patterns.'
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. GET /api/traffic/daily (Day of week distribution)
exports.getTrafficDaily = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const filter = buildFilterQuery(req.query, dataset_id);

    if (!hasFilters(req.query)) {
      const cached = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'dow_trend' });
      if (cached && cached.data) {
        return res.status(200).json({
          success: true,
          data: cached.data,
          meta: { dataset_id, source: 'pre_aggregated' }
        });
      }
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$day_of_week',
          day_of_week: { $first: '$day_of_week' },
          day_name: { $first: '$day_name' },
          total_volume: { $sum: '$vehicle_count' },
          avg_volume: { $avg: '$vehicle_count' },
          accidents: { $sum: '$accidents' },
          traffic_violations: { $sum: '$traffic_violations' },
          avg_speed: { $avg: '$avg_speed_kmph' },
          record_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          day_of_week: 1,
          day_name: 1,
          total_volume: 1,
          avg_volume: { $round: ['$avg_volume', 2] },
          accidents: 1,
          traffic_violations: 1,
          avg_speed: { $round: ['$avg_speed', 2] },
          record_count: 1
        }
      }
    ];

    const result = await TrafficRecord.aggregate(pipeline);
    res.status(200).json({
      success: true,
      data: result,
      meta: { dataset_id, source: 'dynamic_aggregation' }
    });
  } catch (error) {
    next(error);
  }
};

// 7. GET /api/traffic/monthly (Monthly distribution)
exports.getTrafficMonthly = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const filter = buildFilterQuery(req.query, dataset_id);

    if (!hasFilters(req.query)) {
      const cached = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'monthly_trend' });
      if (cached && cached.data) {
        return res.status(200).json({
          success: true,
          data: cached.data,
          meta: { dataset_id, source: 'pre_aggregated' }
        });
      }
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$month',
          month: { $first: '$month' },
          month_name: { $first: '$month_name' },
          total_volume: { $sum: '$vehicle_count' },
          avg_volume: { $avg: '$vehicle_count' },
          accidents: { $sum: '$accidents' },
          traffic_violations: { $sum: '$traffic_violations' },
          avg_speed: { $avg: '$avg_speed_kmph' },
          record_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: 1,
          month_name: 1,
          total_volume: 1,
          avg_volume: { $round: ['$avg_volume', 2] },
          accidents: 1,
          traffic_violations: 1,
          avg_speed: { $round: ['$avg_speed', 2] },
          record_count: 1
        }
      }
    ];

    const result = await TrafficRecord.aggregate(pipeline);
    res.status(200).json({
      success: true,
      data: result,
      meta: { dataset_id, source: 'dynamic_aggregation' }
    });
  } catch (error) {
    next(error);
  }
};

// 8. GET /api/traffic/locations (Area-wise metrics)
exports.getTrafficLocations = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const filter = buildFilterQuery(req.query, dataset_id);

    if (!hasFilters(req.query)) {
      const cached = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'area_metrics' });
      if (cached && cached.data) {
        return res.status(200).json({
          success: true,
          data: cached.data,
          meta: { dataset_id, source: 'pre_aggregated' }
        });
      }
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$area',
          area: { $first: '$area' },
          total_volume: { $sum: '$vehicle_count' },
          avg_volume: { $avg: '$vehicle_count' },
          total_accidents: { $sum: '$accidents' },
          total_violations: { $sum: '$traffic_violations' },
          avg_speed: { $avg: '$avg_speed_kmph' },
          record_count: { $sum: 1 }
        }
      },
      { $sort: { total_volume: -1 } },
      {
        $project: {
          _id: 0,
          area: 1,
          total_volume: 1,
          avg_volume: { $round: ['$avg_volume', 2] },
          total_accidents: 1,
          total_violations: 1,
          avg_speed: { $round: ['$avg_speed', 2] },
          record_count: 1,
          accident_rate_per_k: {
            $round: [{ $multiply: [{ $divide: ['$total_accidents', '$total_volume'] }, 1000] }, 3]
          },
          violation_rate_per_k: {
            $round: [{ $multiply: [{ $divide: ['$total_violations', '$total_volume'] }, 1000] }, 3]
          }
        }
      }
    ];

    const result = await TrafficRecord.aggregate(pipeline);
    res.status(200).json({
      success: true,
      data: result,
      meta: { dataset_id, source: 'dynamic_aggregation' }
    });
  } catch (error) {
    next(error);
  }
};

// 9. GET /api/traffic/hotspots
exports.getTrafficHotspots = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const hotspots = await TrafficHotspot.find({ dataset_id }).sort({ rank: 1 });
    const meta = await TrafficMetadata.findOne({ dataset_id });

    res.status(200).json({
      success: true,
      data: hotspots,
      meta: {
        dataset_id,
        classification_rule: 'Composite Score = 0.5 * Volume + 0.3 * Accidents + 0.2 * Violations (Min-Max Normalized). Top 34% High, Middle 33% Medium, Remainder Low.',
        disclaimer: meta ? meta.centroids_disclaimer : 'Marker positions represent approximate geographic area centroids for metropolitan visualization, not measured GPS points.'
      }
    });
  } catch (error) {
    next(error);
  }
};

// 10. GET /api/incidents
exports.getIncidents = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const byMonth = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'monthly_trend' });
    const byArea = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'area_metrics' });
    const correlations = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'correlations' });

    res.status(200).json({
      success: true,
      data: {
        byMonth: byMonth ? byMonth.data : [],
        byArea: byArea ? byArea.data : [],
        correlations: correlations ? correlations.data : {}
      },
      meta: { dataset_id, source: 'pre_aggregated' }
    });
  } catch (error) {
    next(error);
  }
};

// 11. GET /api/vehicles
exports.getVehicles = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const vehicles = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'vehicle_metrics' });
    const speedByCongestion = await TrafficAnalytics.findOne({ dataset_id, metric_type: 'congestion_metrics' });

    res.status(200).json({
      success: true,
      data: {
        vehicles: vehicles ? vehicles.data : [],
        speedByCongestion: speedByCongestion ? speedByCongestion.data : []
      },
      meta: { dataset_id, source: 'pre_aggregated' }
    });
  } catch (error) {
    next(error);
  }
};

// 12. GET /api/insights
exports.getInsights = async (req, res, next) => {
  try {
    const dataset_id = await getActiveDatasetId(req.query.dataset_id);
    const insights = await TrafficInsight.findOne({ dataset_id });

    if (!insights) {
      return res.status(200).json({
        success: true,
        data: {
          facts: {},
          sentences: [],
          disclaimer: ''
        },
        meta: { dataset_id, note: 'Insights not yet compiled for this dataset.' }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        generated_at: insights.generated_at,
        facts: insights.facts,
        sentences: insights.sentences,
        disclaimer: insights.disclaimer
      },
      meta: { dataset_id, source: 'pyspark_pipeline' }
    });
  } catch (error) {
    next(error);
  }
};

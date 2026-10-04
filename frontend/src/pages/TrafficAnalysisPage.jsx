import React, { useState, useEffect } from 'react';
import {
  Filter,
  RotateCcw,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  Car,
  AlertCircle,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { trafficApi } from '../api/trafficApi';
import { useFilters } from '../context/FilterContext';
import { KpiCard } from '../components/common/KpiCard';
import { LoadingState, ErrorState, EmptyState } from '../components/common/FeedbackStates';

export const TrafficAnalysisPage = () => {
  const { meta, activeDataset, datasetVersion } = useFilters();

  // Local filter state for this interactive page
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    area: 'All',
    vehicleType: 'All',
    dayOfWeek: 'All',
    congestionLevel: 'All'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [dowData, setDowData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [locations, setLocations] = useState([]);

  // Set initial dates and reset filters when meta or dataset changes
  useEffect(() => {
    if (meta?.dateRange) {
      const initialFilters = {
        startDate: meta.dateRange.start || '',
        endDate: meta.dateRange.end || '',
        area: 'All',
        vehicleType: 'All',
        dayOfWeek: 'All',
        congestionLevel: 'All'
      };
      setFilters(initialFilters);
      loadData(initialFilters);
    }
  }, [meta, datasetVersion]);

  const loadData = async (activeFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes, dowRes, monRes, locRes] = await Promise.all([
        trafficApi.getSummary(activeFilters),
        trafficApi.getTrends(activeFilters),
        trafficApi.getDaily(activeFilters),
        trafficApi.getMonthly(activeFilters),
        trafficApi.getLocations(activeFilters)
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (trendRes.success) setTrends(trendRes.data);
      if (dowRes.success) setDowData(dowRes.data);
      if (monRes.success) setMonthlyData(monRes.data);
      if (locRes.success) setLocations(locRes.data);
    } catch (err) {
      setError(err.message || 'Failed to update traffic analytics with current filters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
  }, [filters]);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    const initial = {
      startDate: meta?.dateRange?.start || '',
      endDate: meta?.dateRange?.end || '',
      area: 'All',
      vehicleType: 'All',
      dayOfWeek: 'All',
      congestionLevel: 'All'
    };
    setFilters(initial);
  };

  // Derive dynamic KPIs from filtered sets
  const peakDay = dowData.length > 0
    ? [...dowData].sort((a, b) => b.total_volume - a.total_volume)[0]
    : null;

  const lowestDay = dowData.length > 0
    ? [...dowData].sort((a, b) => a.total_volume - b.total_volume)[0]
    : null;

  const highestArea = locations.length > 0
    ? locations[0]
    : null;

  return (
    <div className="space-y-7 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] border border-[#BDE8DC] text-[#087F5B] text-xs font-semibold tracking-wide mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Interactive Slice & Dice</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#123B35] tracking-tight">
            Traffic Analysis & Filter Studio
          </h1>
          <p className="text-sm text-[#5B6F64] mt-1">
            Real-time multi-dimensional querying powered by MongoDB Atlas aggregation pipelines.
          </p>
        </div>
      </div>

      {/* 10. FILTER TOOLBAR (Premium styling) */}
      <div className="bg-white border border-[#E8E4DA] rounded-2xl p-5 md:p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EBF7F2] text-[#087F5B] flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#123B35]">
                Filter Dataset Records
              </span>
              <span className="text-[11px] text-[#8C9B93] ml-2 hidden sm:inline">
                (Dynamic MongoDB aggregation re-computes all analytical metrics)
              </span>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[#5B6F64] hover:text-[#123B35] font-semibold px-3 py-1.5 rounded-xl bg-[#F7F5EF] hover:bg-[#EAE5DA] border border-[#E8E4DA] transition-all focus:outline-none"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#087F5B]" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Start Date */}
          <div>
            <label htmlFor="filter-start-date" className="block text-[11px] font-semibold text-[#5B6F64] mb-1">Start Date</label>
            <input
              id="filter-start-date"
              name="startDate"
              type="date"
              value={filters.startDate}
              min={meta?.dateRange?.start || '2025-01-01'}
              max={meta?.dateRange?.end || '2025-12-31'}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full bg-[#FDFCF9] border border-[#DDD7C9] text-xs font-medium rounded-xl px-3 py-2 text-[#1A2621] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20 focus:border-[#087F5B] transition-all"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="filter-end-date" className="block text-[11px] font-semibold text-[#5B6F64] mb-1">End Date</label>
            <input
              id="filter-end-date"
              name="endDate"
              type="date"
              value={filters.endDate}
              min={meta?.dateRange?.start || '2025-01-01'}
              max={meta?.dateRange?.end || '2025-12-31'}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full bg-[#FDFCF9] border border-[#DDD7C9] text-xs font-medium rounded-xl px-3 py-2 text-[#1A2621] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20 focus:border-[#087F5B] transition-all"
            />
          </div>

          {/* Area */}
          <div>
            <label htmlFor="filter-area" className="block text-[11px] font-semibold text-[#5B6F64] mb-1">Area / Location</label>
            <select
              id="filter-area"
              name="area"
              value={filters.area}
              onChange={(e) => handleFilterChange('area', e.target.value)}
              className="w-full bg-[#FDFCF9] border border-[#DDD7C9] text-xs font-medium rounded-xl px-3 py-2 text-[#1A2621] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20 focus:border-[#087F5B] transition-all"
            >
              <option value="All">All {activeDataset?.cities?.[0] || 'Metropolitan'} Corridors</option>
              {meta?.areas?.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Type */}
          <div>
            <label htmlFor="filter-vehicle-type" className="block text-[11px] font-semibold text-[#5B6F64] mb-1">Vehicle Category</label>
            <select
              id="filter-vehicle-type"
              name="vehicleType"
              value={filters.vehicleType}
              onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
              className="w-full bg-[#FDFCF9] border border-[#DDD7C9] text-xs font-medium rounded-xl px-3 py-2 text-[#1A2621] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20 focus:border-[#087F5B] transition-all"
            >
              <option value="All">All Vehicle Types</option>
              {meta?.vehicleTypes?.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label htmlFor="filter-day-of-week" className="block text-[11px] font-semibold text-[#5B6F64] mb-1">Day of Week</label>
            <select
              id="filter-day-of-week"
              name="dayOfWeek"
              value={filters.dayOfWeek}
              onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
              className="w-full bg-[#FDFCF9] border border-[#DDD7C9] text-xs font-medium rounded-xl px-3 py-2 text-[#1A2621] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20 focus:border-[#087F5B] transition-all"
            >
              <option value="All">All Days (Mon - Sun)</option>
              {meta?.dayNames?.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Congestion Level */}
          <div>
            <label htmlFor="filter-congestion-level" className="block text-[11px] font-semibold text-[#5B6F64] mb-1">Congestion Tier</label>
            <select
              id="filter-congestion-level"
              name="congestionLevel"
              value={filters.congestionLevel}
              onChange={(e) => handleFilterChange('congestionLevel', e.target.value)}
              className="w-full bg-[#FDFCF9] border border-[#DDD7C9] text-xs font-medium rounded-xl px-3 py-2 text-[#1A2621] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20 focus:border-[#087F5B] transition-all"
            >
              <option value="All">All Severity Tiers</option>
              {meta?.congestionLevels?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Temporal Granularity Note */}
        <div className="flex items-center gap-2 pt-1 text-xs text-[#5B6F64] bg-[#F7F5EF] border border-[#E8E4DA] rounded-xl px-3.5 py-2">
          <Info className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
          <span>Note: Time-of-day / hourly filtering is unsupported as the underlying dataset provides daily-level observations.</span>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Filtering MongoDB Atlas traffic collection..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadData(filters)} />
      ) : summary?.total_records === 0 ? (
        <EmptyState
          title="No traffic records match this filter combination"
          message="Adjust date boundaries, select another area, or click Reset Filters."
        />
      ) : (
        <>
          {/* Dynamic KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Peak Traffic Period"
              value={peakDay ? peakDay.day_name : 'N/A'}
              subtitle={`${peakDay ? peakDay.total_volume?.toLocaleString() : 0} vehicles recorded`}
              icon={Calendar}
              badgeText="Filtered Peak"
              badgeType="amber"
            />
            <KpiCard
              title="Average Vehicle Count"
              value={summary?.avg_vehicle_count?.toLocaleString()}
              subtitle={`Across ${summary?.total_records} matching records`}
              icon={TrendingUp}
              badgeText="Mean Density"
              badgeType="blue"
            />
            <KpiCard
              title="Highest Traffic Area"
              value={highestArea ? highestArea.area : 'N/A'}
              subtitle={`${highestArea ? highestArea.total_volume?.toLocaleString() : 0} total flow`}
              icon={MapPin}
              badgeText="Top Corridor"
              badgeType="emerald"
            />
            <KpiCard
              title="Lowest Traffic Day"
              value={lowestDay ? lowestDay.day_name : 'N/A'}
              subtitle={`${lowestDay ? lowestDay.total_volume?.toLocaleString() : 0} vehicles recorded`}
              icon={Clock}
              badgeText="Lowest Period"
              badgeType="default"
            />
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#123B35]">Daily Traffic Flow Pattern</h3>
                  <p className="text-xs text-[#5B6F64] mt-0.5">Finest temporal granularity available in dataset</p>
                </div>
                <span className="text-[11px] font-semibold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-2.5 py-1 rounded-full">
                  Daily Flow
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emeraldFilterGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#087F5B" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#087F5B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8C9B93' }} minTickGap={30} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Volume']}
                      contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    />
                    <Area type="monotone" dataKey="total_volume" stroke="#087F5B" strokeWidth={2.5} fillOpacity={1} fill="url(#emeraldFilterGrad)" activeDot={{ r: 5, fill: '#087F5B' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of Week */}
            <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#123B35]">Traffic by Day of Week</h3>
                  <p className="text-xs text-[#5B6F64] mt-0.5">Volume distribution across days (Filtered)</p>
                </div>
                <span className="text-[11px] font-semibold text-[#2BAE9B] bg-[#E6F8F5] border border-[#B5EDE3] px-2.5 py-1 rounded-full">
                  Day Aggregation
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                    <XAxis dataKey="day_name" tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Volume']}
                      contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    />
                    <Bar dataKey="total_volume" fill="#2BAE9B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#123B35]">Monthly Traffic Distribution</h3>
                  <p className="text-xs text-[#5B6F64] mt-0.5">Month-by-month vehicular volumes</p>
                </div>
                <span className="text-[11px] font-semibold text-[#5B8DEF] bg-[#EBF2FE] border border-[#C8DCFB] px-2.5 py-1 rounded-full">
                  Monthly Aggregation
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                    <XAxis dataKey="month_name" tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Monthly Volume']}
                      contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    />
                    <Bar dataKey="total_volume" fill="#5B8DEF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Location Comparison */}
            <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#123B35]">Corridor Comparison</h3>
                  <p className="text-xs text-[#5B6F64] mt-0.5">Volume by {activeDataset?.cities?.[0] || 'metropolitan'} locality under active filters</p>
                </div>
                <span className="text-[11px] font-semibold text-[#123B35] bg-[#F7F5EF] border border-[#E8E4DA] px-2.5 py-1 rounded-full">
                  Corridor Ranks
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locations} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <YAxis dataKey="area" type="category" tick={{ fontSize: 11, fill: '#1A2621', fontWeight: 500 }} width={85} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Volume']}
                      contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    />
                    <Bar dataKey="total_volume" fill="#123B35" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

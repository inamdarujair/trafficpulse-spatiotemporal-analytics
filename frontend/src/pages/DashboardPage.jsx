import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  Calendar,
  MapPin,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { trafficApi } from '../api/trafficApi';
import { useFilters } from '../context/FilterContext';
import { KpiCard } from '../components/common/KpiCard';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

export const DashboardPage = () => {
  const { activeDataset, datasetVersion } = useFilters();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [dowData, setDowData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [insights, setInsights] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes, dowRes, locRes, insRes] = await Promise.all([
        trafficApi.getSummary(),
        trafficApi.getTrends(),
        trafficApi.getDaily(),
        trafficApi.getLocations(),
        trafficApi.getInsights()
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (trendRes.success) setTrends(trendRes.data);
      if (dowRes.success) setDowData(dowRes.data);
      if (locRes.success) setLocations(locRes.data);
      if (insRes.success) setInsights(insRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [datasetVersion]);

  const cityName = activeDataset?.cities?.[0] || 'Metropolitan';

  if (loading) return <LoadingState message={`Loading ${cityName} Traffic Intelligence...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Top locations sorted descending by total volume
  const sortedLocations = [...(locations || [])].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
  const topLocations = sortedLocations.slice(0, 5);
  const busiestCorridor = sortedLocations[0];

  // Peak Day
  const peakDay = dowData.length > 0
    ? [...dowData].sort((a, b) => b.total_volume - a.total_volume)[0]
    : null;

  // Incident Donut Data (Real values: Accidents vs Violations)
  const incidentPieData = [
    { name: 'Accidents', value: summary?.total_accidents || 0, fill: '#E97A72' },
    { name: 'Violations', value: summary?.total_violations || 0, fill: '#5B8DEF' }
  ];

  return (
    <div className="space-y-7 pb-10">
      {/* 4. DASHBOARD HERO WITH INTEGRATED REALISTIC PHOTOGRAPHY */}
      <div className="relative overflow-hidden bg-white border border-[#E8E4DA] rounded-3xl p-6 md:p-8 shadow-[0_3px_16px_-4px_rgba(20,35,28,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Heading and Editorial Context */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] border border-[#BDE8DC] text-[#087F5B] text-xs font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B] animate-pulse"></span>
              {cityName} Traffic • Traffic Pattern Analytics
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#123B35] tracking-tight leading-[1.15]">
                Traffic Intelligence Dashboard
              </h1>
              <p className="text-sm md:text-base text-[#5B6F64] font-normal leading-relaxed max-w-xl">
                End-to-End Traffic Pattern Analytics powered by Apache PySpark & MongoDB. Providing high-throughput spatial-temporal pattern mining across critical metropolitan corridors.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F7F5EF] border border-[#E8E4DA] text-xs font-medium text-[#4A5D54]">
                <Layers className="w-3.5 h-3.5 text-[#087F5B]" />
                <span>Daily Observation Granularity</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F7F5EF] border border-[#E8E4DA] text-xs font-medium text-[#4A5D54]">
                <Activity className="w-3.5 h-3.5 text-[#2BAE9B]" />
                <span>{(summary?.total_records ?? activeDataset?.record_count ?? 0).toLocaleString()} Validated Records</span>
              </div>
            </div>
          </div>

          {/* Right Column: Wide Realistic Photography with subtle overlay */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-[#E0DACE] shadow-md group">
              <img
                src="/assets/mumbai_traffic_hero.jpg"
                alt={`${cityName} Traffic Corridors`}
                className="w-full h-48 md:h-52 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#123B35]/75 via-[#123B35]/20 to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#A5E3D0] block">Corridor Surveillance</span>
                    <span className="text-xs font-medium text-white/95">
                      {busiestCorridor?.area ? `${busiestCorridor.area} & Arteries` : 'Primary Corridors & Arteries'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-white/30">
                    Live Telemetry
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. KPI CARDS ROW (5 Refined Cards with Specific Palette Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Records"
          value={summary?.total_records?.toLocaleString()}
          subtitle={`Cleaned ${cityName} records`}
          icon={FileText}
          badgeText="PySpark Verified"
          badgeType="emerald"
        />
        <KpiCard
          title="Average Vehicle Volume"
          value={summary?.avg_vehicle_count?.toLocaleString()}
          subtitle="Mean per observation"
          icon={TrendingUp}
          badgeText="Mean Density"
          badgeType="blue"
        />
        <KpiCard
          title="Peak Traffic Day"
          value={peakDay ? peakDay.day_name : '—'}
          subtitle={peakDay ? `${peakDay.total_volume?.toLocaleString()} vehicles` : 'No data'}
          icon={Calendar}
          badgeText="Peak Day"
          badgeType="amber"
        />
        <KpiCard
          title="Busiest Corridor"
          value={busiestCorridor?.area || '—'}
          subtitle={busiestCorridor ? `${busiestCorridor.total_volume?.toLocaleString()} cumulative vol` : 'No data'}
          icon={MapPin}
          badgeText="Top Corridor"
          badgeType="teal"
        />
        <KpiCard
          title="Total Incidents"
          value={((summary?.total_accidents || 0) + (summary?.total_violations || 0))?.toLocaleString()}
          subtitle={`${summary?.total_accidents?.toLocaleString() || 0} acc • ${summary?.total_violations?.toLocaleString() || 0} viol`}
          icon={AlertTriangle}
          badgeText="Enforcement"
          badgeType="coral"
        />
      </div>

      {/* 8. KEY INSIGHT BANNER */}
      {insights?.sentences && insights.sentences.length > 0 && (
        <div className="bg-gradient-to-r from-[#EBF7F2] via-[#F2FAF7] to-[#E8F8F5] border border-[#BDE8DC] rounded-2xl p-5 md:p-6 shadow-[0_2px_12px_-3px_rgba(8,127,91,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#087F5B] to-[#2BAE9B] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wider text-[#087F5B] uppercase">
                  KEY INSIGHT
                </span>
                <span className="text-xs text-[#5B6F64]">• Distributed Analytical Mining</span>
              </div>
              <h2 className="text-base font-bold text-[#123B35] leading-snug">
                {insights.sentences[0]}
              </h2>
              <p className="text-xs text-[#5B6F64] leading-relaxed">
                Computed across all {(summary?.total_records ?? activeDataset?.record_count ?? 0).toLocaleString()} partitioned records in Apache PySpark with MongoDB aggregation indexes.
              </p>
            </div>
          </div>
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087F5B] hover:bg-[#076C4D] text-white text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow shrink-0 focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30"
          >
            <span>View Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 9. CHARTS GRID (Recharts Visual Polish) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Traffic Volume Trend Over Time */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Traffic Volume Trend Over Time</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Daily vehicular throughput across {cityName} corridors ({activeDataset?.date_range?.start || '2025'} - {activeDataset?.date_range?.end || '2025'})</p>
            </div>
            <span className="text-[11px] font-semibold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-2.5 py-1 rounded-full">
              Timeline
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#087F5B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#087F5B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8C9B93' }} minTickGap={35} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Volume']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Area type="monotone" dataKey="total_volume" stroke="#087F5B" strokeWidth={2.5} fillOpacity={1} fill="url(#emeraldGradient)" activeDot={{ r: 5, fill: '#087F5B', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Traffic by Day of Week */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Traffic by Day of Week</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Aggregated weekly volume {peakDay ? `(Peak day: ${peakDay.day_name})` : ''}</p>
            </div>
            <span className="text-[11px] font-semibold text-[#2BAE9B] bg-[#E6F8F5] border border-[#B5EDE3] px-2.5 py-1 rounded-full">
              Granularity: Day
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                <XAxis dataKey="day_name" tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Total Volume']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="total_volume" fill="#2BAE9B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top Corridors by Vehicle Volume */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Top Corridors by Vehicle Volume</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Cumulative vehicular throughput in metropolitan {cityName}</p>
            </div>
            <span className="text-[11px] font-semibold text-[#4A5D54] bg-[#F7F5EF] border border-[#E8E4DA] px-2.5 py-1 rounded-full">
              Top 5 Areas
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLocations} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 11, fill: '#1A2621', fontWeight: 500 }} width={85} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Volume']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="total_volume" fill="#087F5B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Incident Distribution */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Incident Distribution</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Accidents versus recorded traffic enforcement violations</p>
            </div>
            <span className="text-[11px] font-semibold text-[#E97A72] bg-[#FDF0EF] border border-[#F9CBC7] px-2.5 py-1 rounded-full">
              Surveillance Split
            </span>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={96}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {incidentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [val.toLocaleString(), 'Incidents']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

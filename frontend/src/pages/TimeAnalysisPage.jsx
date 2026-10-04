import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  Sun,
  Moon,
  Info,
  Layers,
  CalendarDays
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
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

export const TimeAnalysisPage = () => {
  const { activeDataset, datasetVersion } = useFilters();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dowData, setDowData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dowRes, monRes, trendRes, insRes] = await Promise.all([
        trafficApi.getDaily(),
        trafficApi.getMonthly(),
        trafficApi.getTrends(),
        trafficApi.getInsights()
      ]);

      if (dowRes.success) setDowData(dowRes.data);
      if (monRes.success) setMonthlyData(monRes.data);
      if (trendRes.success) setTrends(trendRes.data);
      if (insRes.success) setInsights(insRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load temporal traffic analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [datasetVersion]);

  const cityName = activeDataset?.cities?.[0] || 'Metropolitan';

  if (loading) return <LoadingState message={`Aggregating ${cityName} Temporal Patterns...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Calculate derived values from actual data
  const peakDay = dowData.length > 0
    ? [...dowData].sort((a, b) => b.total_volume - a.total_volume)[0]
    : null;

  const leastDay = dowData.length > 0
    ? [...dowData].sort((a, b) => a.total_volume - b.total_volume)[0]
    : null;

  const peakMonth = monthlyData.length > 0
    ? [...monthlyData].sort((a, b) => b.total_volume - a.total_volume)[0]
    : null;

  const leastMonth = monthlyData.length > 0
    ? [...monthlyData].sort((a, b) => a.total_volume - b.total_volume)[0]
    : null;

  // Weekend vs Weekday calculation
  const weekendDays = ['Saturday', 'Sunday'];
  const weekendVolume = dowData
    .filter(d => weekendDays.includes(d.day_name))
    .reduce((sum, d) => sum + d.total_volume, 0);

  const weekdayVolume = dowData
    .filter(d => !weekendDays.includes(d.day_name))
    .reduce((sum, d) => sum + d.total_volume, 0);

  const totalVolume = weekendVolume + weekdayVolume;
  const weekdayPct = totalVolume > 0 ? ((weekdayVolume / totalVolume) * 100).toFixed(1) : 0;
  const weekendPct = totalVolume > 0 ? ((weekendVolume / totalVolume) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] border border-[#BDE8DC] text-[#087F5B] text-xs font-semibold tracking-wide mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Temporal Traffic Patterns</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#123B35] tracking-tight">
            Temporal Rhythm & Seasonality Analytics
          </h1>
          <p className="text-sm text-[#5B6F64] mt-1">
            Analyzing weekly volume distributions, seasonal trends, and workday versus weekend modal splits.
          </p>
        </div>
      </div>

      {/* Honest Granularity Banner */}
      <div className="bg-[#FEF5E7] border border-[#FCE1B6] text-[#6E4712] text-xs px-4 py-3 rounded-2xl flex items-start gap-3 shadow-xs">
        <Clock className="w-4 h-4 text-[#C47D1A] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#C47D1A]">Temporal Granularity Notice: </span>
          <span className="leading-relaxed">
            The dataset records traffic on a daily cadence without timestamped hourly or sub-hourly fields. All temporal metrics represent true date-level observations (day of week, month, and day-to-day progression) rather than synthetic hourly estimates.
          </span>
        </div>
      </div>

      {/* 12. TIME ANALYSIS KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Peak Day of Week"
          value={peakDay ? peakDay.day_name : '—'}
          subtitle={`${peakDay ? peakDay.total_volume?.toLocaleString() : 0} vehicles`}
          icon={Calendar}
          badgeText="Busiest Day"
          badgeType="emerald"
        />
        <KpiCard
          title="Least Busy Day"
          value={leastDay ? leastDay.day_name : '—'}
          subtitle={`${leastDay ? leastDay.total_volume?.toLocaleString() : 0} vehicles`}
          icon={Clock}
          badgeText="Lowest Day"
          badgeType="amber"
        />
        <KpiCard
          title="Busiest Month"
          value={peakMonth ? peakMonth.month_name : 'N/A'}
          subtitle={`${peakMonth ? peakMonth.total_volume?.toLocaleString() : 0} vehicles`}
          icon={TrendingUp}
          badgeText="Peak Month"
          badgeType="blue"
        />
        <KpiCard
          title="Least Busy Month"
          value={leastMonth ? leastMonth.month_name : 'N/A'}
          subtitle={`${leastMonth ? leastMonth.total_volume?.toLocaleString() : 0} vehicles`}
          icon={Calendar}
          badgeText="Lowest Month"
          badgeType="coral"
        />
        <KpiCard
          title="Weekday vs Weekend"
          value={`${weekdayPct}% / ${weekendPct}%`}
          subtitle={`${weekdayVolume.toLocaleString()} vs ${weekendVolume.toLocaleString()}`}
          icon={Layers}
          badgeText="Modal Ratio"
          badgeType="teal"
        />
      </div>

      {/* Temporal Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Pattern */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Traffic Volume by Day of Week</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Aggregated flow across weekdays and weekends</p>
            </div>
            <span className="text-[11px] font-semibold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-2.5 py-1 rounded-full">
              Weekly Rhythm
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
                <Bar dataKey="total_volume" fill="#087F5B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Traffic Distribution */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Monthly Traffic Distribution</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Seasonality and monthly volume shifts throughout 2025</p>
            </div>
            <span className="text-[11px] font-semibold text-[#2BAE9B] bg-[#E6F8F5] border border-[#B5EDE3] px-2.5 py-1 rounded-full">
              12 Months
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                <XAxis dataKey="month_name" tick={{ fontSize: 10, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Monthly Flow']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="total_volume" fill="#2BAE9B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Progression Timeline Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Daily Traffic Timeline</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Every single date-level traffic volume observation across 2025</p>
            </div>
            <span className="text-[11px] font-semibold text-[#123B35] bg-[#F7F5EF] border border-[#E8E4DA] px-2.5 py-1 rounded-full">
              Full Observation Series
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="timelineEmerald" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="total_volume" stroke="#087F5B" strokeWidth={2.5} fillOpacity={1} fill="url(#timelineEmerald)" activeDot={{ r: 5, fill: '#087F5B' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data-Driven Temporal Synthesis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#EBF2FE] text-[#3B71D9] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B71D9]">Weekday Dominance</h4>
            <p className="text-sm font-semibold text-[#123B35] mt-1 leading-snug">
              Workday traffic accounts for {weekdayPct}% of total observed vehicular movement ({weekdayVolume.toLocaleString()} vehicles), compared to {weekendPct}% during weekends ({weekendVolume.toLocaleString()} vehicles).
            </p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#EBF7F2] text-[#087F5B] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#087F5B]">Peak Congestion Window</h4>
            <p className="text-sm font-semibold text-[#123B35] mt-1 leading-snug">
              {peakDay ? `${peakDay.day_name} registers maximum weekly throughput with an average of ${peakDay.avg_volume?.toLocaleString() || 0} vehicles per recorded observation, peaking in ${peakMonth ? peakMonth.month_name : 'the observation period'}.` : 'Observation data processed via PySpark.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

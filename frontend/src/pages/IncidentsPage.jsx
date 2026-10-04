import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  MapPin,
  TrendingDown,
  TrendingUp,
  Activity,
  FileCheck2,
  Info,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart
} from 'recharts';
import { trafficApi } from '../api/trafficApi';
import { useFilters } from '../context/FilterContext';
import { KpiCard } from '../components/common/KpiCard';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

export const IncidentsPage = () => {
  const { activeDataset, datasetVersion } = useFilters();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incidentData, setIncidentData] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incRes, sumRes] = await Promise.all([
        trafficApi.getIncidents(),
        trafficApi.getSummary()
      ]);

      if (incRes.success) setIncidentData(incRes.data);
      if (sumRes.success) setSummary(sumRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load incident intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [datasetVersion]);

  const cityName = activeDataset?.cities?.[0] || 'Metropolitan';

  if (loading) return <LoadingState message={`Analyzing ${cityName} Incident & Violation Patterns...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const rawByArea = incidentData?.byArea || [];
  const byArea = rawByArea.map(item => ({
    ...item,
    accidents: item.accidents ?? item.total_accidents ?? 0,
    traffic_violations: item.traffic_violations ?? item.total_violations ?? 0
  }));
  const byMonth = incidentData?.byMonth || [];
  const correlations = incidentData?.correlations || {};

  // Highest areas
  const highestAccArea = byArea.length > 0
    ? [...byArea].sort((a, b) => b.accidents - a.accidents)[0]
    : null;

  const highestViolArea = byArea.length > 0
    ? [...byArea].sort((a, b) => b.traffic_violations - a.traffic_violations)[0]
    : null;

  return (
    <div className="space-y-7 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF0EF] border border-[#F9CBC7] text-[#D4564E] text-xs font-semibold tracking-wide mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E97A72]" />
            <span>Safety & Surveillance Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#123B35] tracking-tight">
            Incident & Traffic Enforcement Analysis
          </h1>
          <p className="text-sm text-[#5B6F64] mt-1">
            Correlating vehicular collision frequencies and camera-detected traffic infractions across metropolitan corridors.
          </p>
        </div>
      </div>

      {/* 13. KPIS (4 Editorial Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Accidents"
          value={summary?.total_accidents?.toLocaleString()}
          subtitle={`Recorded collisions across ${cityName}`}
          icon={AlertTriangle}
          badgeText="Verified Collisions"
          badgeType="coral"
        />
        <KpiCard
          title="Traffic Violations"
          value={summary?.total_violations?.toLocaleString()}
          subtitle="Citations & enforcement infractions"
          icon={ShieldAlert}
          badgeText="Enforcement"
          badgeType="amber"
        />
        <KpiCard
          title="Highest Accident Area"
          value={highestAccArea ? highestAccArea.area : 'N/A'}
          subtitle={`${highestAccArea ? highestAccArea.accidents : 0} accidents (${highestAccArea?.accident_rate_per_k || 0}/k flow)`}
          icon={MapPin}
          badgeText="Critical Corridor"
          badgeType="coral"
        />
        <KpiCard
          title="Highest Violation Area"
          value={highestViolArea ? highestViolArea.area : 'N/A'}
          subtitle={`${highestViolArea ? highestViolArea.traffic_violations?.toLocaleString() : 0} recorded violations`}
          icon={FileCheck2}
          badgeText="Max Citations"
          badgeType="amber"
        />
      </div>

      {/* Statistical Correlation Matrix */}
      <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#EBF7F2] text-[#087F5B] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B35]">
              PySpark Statistical Correlation Matrix
            </h3>
            <p className="text-xs text-[#5B6F64]">Pearson correlation coefficient (r) computed over all partitioned records</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="bg-[#F7F5EF] p-4 rounded-xl border border-[#E8E4DA]">
            <span className="text-[#5B6F64] block text-[11px] font-semibold uppercase tracking-wider">Volume vs Accidents</span>
            <span className="text-2xl font-extrabold text-[#123B35] block mt-1">
              r = {correlations.volume_vs_accidents !== undefined ? correlations.volume_vs_accidents : 'N/A'}
            </span>
            <p className="text-[11px] text-[#8C9B93] mt-1.5 leading-snug">Weak/negligible linear dependency</p>
          </div>
          <div className="bg-[#EBF7F2] p-4 rounded-xl border border-[#BDE8DC]">
            <span className="text-[#087F5B] block text-[11px] font-semibold uppercase tracking-wider">Volume vs Violations</span>
            <span className="text-2xl font-extrabold text-[#087F5B] block mt-1">
              r = {correlations.volume_vs_violations !== undefined ? correlations.volume_vs_violations : 'N/A'}
            </span>
            <p className="text-[11px] text-[#087F5B] mt-1.5 leading-snug">Positive correlation with vehicular density</p>
          </div>
          <div className="bg-[#F7F5EF] p-4 rounded-xl border border-[#E8E4DA]">
            <span className="text-[#5B6F64] block text-[11px] font-semibold uppercase tracking-wider">Volume vs Speed</span>
            <span className="text-2xl font-extrabold text-[#123B35] block mt-1">
              r = {correlations.volume_vs_speed !== undefined ? correlations.volume_vs_speed : 'N/A'}
            </span>
            <p className="text-[11px] text-[#8C9B93] mt-1.5 leading-snug">Slight positive relationship</p>
          </div>
          <div className="bg-[#F7F5EF] p-4 rounded-xl border border-[#E8E4DA]">
            <span className="text-[#5B6F64] block text-[11px] font-semibold uppercase tracking-wider">Accidents vs Violations</span>
            <span className="text-2xl font-extrabold text-[#123B35] block mt-1">
              r = {correlations.accidents_vs_violations !== undefined ? correlations.accidents_vs_violations : 'N/A'}
            </span>
            <p className="text-[11px] text-[#8C9B93] mt-1.5 leading-snug">Statistically independent in this dataset</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Incident Progression */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Monthly Incident Timeline</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Dual-axis progression of accidents and citations across 2025</p>
            </div>
            <span className="text-[11px] font-semibold text-[#E97A72] bg-[#FDF0EF] border border-[#F9CBC7] px-2.5 py-1 rounded-full">
              Timeline
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                <XAxis dataKey="month_name" tick={{ fontSize: 10, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#E97A72' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#E9A23B' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [val.toLocaleString(), name === 'accidents' ? 'Accidents' : 'Violations']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line yAxisId="left" type="monotone" dataKey="accidents" stroke="#E97A72" strokeWidth={2.5} name="Accidents" activeDot={{ r: 5, fill: '#E97A72' }} />
                <Line yAxisId="right" type="monotone" dataKey="traffic_violations" stroke="#E9A23B" strokeWidth={2.5} name="Violations" activeDot={{ r: 5, fill: '#E9A23B' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Corridor */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Accidents by Corridor</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Total recorded collisions per {cityName} locality</p>
            </div>
            <span className="text-[11px] font-semibold text-[#E97A72] bg-[#FDF0EF] border border-[#F9CBC7] px-2.5 py-1 rounded-full">
              Collision Totals
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byArea} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val) => [val.toLocaleString(), 'Accidents']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="accidents" fill="#E97A72" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations vs Traffic Volume Composed Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Traffic Volume vs Violation Rates by Corridor</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Correlating vehicular flow with violation frequency (Violations per 1k vehicles)</p>
            </div>
            <span className="text-[11px] font-semibold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-2.5 py-1 rounded-full">
              Rate per 1k Flow
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byArea} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" />
                <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} label={{ value: 'Total Volume', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#8C9B93' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#E9A23B' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} label={{ value: 'Rate / 1k vehicles', angle: 90, position: 'insideRight', fontSize: 11, fill: '#E9A23B' }} />
                <Tooltip
                  formatter={(val, name) => [name === 'total_volume' ? `${val.toLocaleString()} vol` : `${val} / 1k`, name === 'total_volume' ? 'Volume' : 'Violation Rate']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar yAxisId="left" dataKey="total_volume" fill="#087F5B" name="Vehicle Volume" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="violation_rate_per_k" stroke="#E9A23B" strokeWidth={3} name="Violations per 1k Flow" activeDot={{ r: 5, fill: '#E9A23B' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

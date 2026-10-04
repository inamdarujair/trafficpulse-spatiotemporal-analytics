import React, { useState, useEffect } from 'react';
import {
  Car,
  TrendingUp,
  Gauge,
  Layers,
  PieChart as PieIcon,
  MapPin,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

const VEHICLE_COLORS = ['#087F5B', '#2BAE9B', '#5B8DEF', '#E9A23B', '#8C82D9'];

export const VehiclesPage = () => {
  const { activeDataset, datasetVersion } = useFilters();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vehRes, sumRes] = await Promise.all([
        trafficApi.getVehicles(),
        trafficApi.getSummary()
      ]);

      if (vehRes.success) setVehicleData(vehRes.data);
      if (sumRes.success) setSummary(sumRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load vehicle analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [datasetVersion]);

  const cityName = activeDataset?.cities?.[0] || 'Metropolitan';

  if (loading) return <LoadingState message={`Aggregating ${cityName} Vehicle Categories...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const vehicles = vehicleData?.vehicles || [];
  const speedByCongestion = vehicleData?.speedByCongestion || [];

  // Dominant vehicle
  const dominantVeh = vehicles.length > 0
    ? [...vehicles].sort((a, b) => b.total_volume - a.total_volume)[0]
    : null;

  // Fastest vehicle type
  const fastestVeh = vehicles.length > 0
    ? [...vehicles].sort((a, b) => b.avg_speed - a.avg_speed)[0]
    : null;

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] border border-[#BDE8DC] text-[#087F5B] text-xs font-semibold tracking-wide mb-2">
            <Car className="w-3.5 h-3.5" />
            <span>Modal Classification</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#123B35] tracking-tight">
            Vehicle Category & Speed Dynamics
          </h1>
          <p className="text-sm text-[#5B6F64] mt-1">
            Modal composition and vehicular velocity across observed categories ({vehicles.map(v => v.vehicle_type).join(', ') || 'Active Categories'}) from MongoDB Atlas.
          </p>
        </div>
      </div>

      {/* 14. KPIS (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Vehicle Volume"
          value={summary?.total_volume?.toLocaleString()}
          subtitle={`Cumulative flow in ${cityName} corridors`}
          icon={Car}
          badgeText="Total Flow"
          badgeType="emerald"
        />
        <KpiCard
          title="Average Speed"
          value={`${summary?.avg_speed} km/h`}
          subtitle="Across all vehicle categories"
          icon={Gauge}
          badgeText="Mean Velocity"
          badgeType="blue"
        />
        <KpiCard
          title="Dominant Category"
          value={dominantVeh ? dominantVeh.vehicle_type : '—'}
          subtitle={`${dominantVeh ? dominantVeh.share_pct : 0}% modal share (${dominantVeh?.total_volume?.toLocaleString()} vol)`}
          icon={Layers}
          badgeText="Highest Volume"
          badgeType="amber"
        />
        <KpiCard
          title="Fastest Category"
          value={fastestVeh ? fastestVeh.vehicle_type : 'N/A'}
          subtitle={`Average speed: ${fastestVeh ? fastestVeh.avg_speed : 0} km/h`}
          icon={TrendingUp}
          badgeText="Top Speed"
          badgeType="teal"
        />
      </div>

      {/* Vehicle Category Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {vehicles.map((v, i) => {
          const color = VEHICLE_COLORS[i % VEHICLE_COLORS.length];
          return (
            <div
              key={v.vehicle_type}
              className="bg-white p-4 md:p-5 rounded-2xl border border-[#E8E4DA] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-[#123B35] text-sm">{v.vehicle_type}</span>
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: color }}
                ></span>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#123B35]">{v.share_pct}%</p>
                <p className="text-xs text-[#5B6F64] mt-0.5">{v.total_volume?.toLocaleString()} vehicles</p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-[#EFECE6] flex items-center justify-between text-xs text-[#5B6F64]">
                <span>Avg Speed:</span>
                <span className="font-bold text-[#123B35]">{v.avg_speed} km/h</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Modal Share */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Modal Share Distribution</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Percentage volume share by vehicle classification</p>
            </div>
            <span className="text-[11px] font-semibold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-2.5 py-1 rounded-full">
              Category Split
            </span>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicles}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={96}
                  paddingAngle={5}
                  dataKey="total_volume"
                  nameKey="vehicle_type"
                  label={({ vehicle_type, share_pct }) => `${vehicle_type}: ${share_pct}%`}
                >
                  {vehicles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Volume']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed Analysis by Congestion Level */}
        <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Velocity by Congestion Tier</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Empirical vehicular velocity across High, Medium, and Low congestion</p>
            </div>
            <span className="text-[11px] font-semibold text-[#2BAE9B] bg-[#E6F8F5] border border-[#B5EDE3] px-2.5 py-1 rounded-full">
              Speed Curve
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speedByCongestion} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                <XAxis dataKey="congestion_level" tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} domain={[0, 60]} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} km/h`, 'Avg Speed']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="avg_speed" fill="#2BAE9B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Vehicle Volumes by Category */}
        <div className="lg:col-span-2 bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#123B35]">Absolute Vehicular Volumes by Category</h3>
              <p className="text-xs text-[#5B6F64] mt-0.5">Cumulative counts observed across study duration</p>
            </div>
            <span className="text-[11px] font-semibold text-[#123B35] bg-[#F7F5EF] border border-[#E8E4DA] px-2.5 py-1 rounded-full">
              Full Aggregate
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicles} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                <XAxis dataKey="vehicle_type" tick={{ fontSize: 11, fill: '#8C9B93' }} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C9B93' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: '#E8E4DA' }} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} vehicles`, 'Volume']}
                  contentStyle={{ backgroundColor: '#123B35', borderColor: '#123B35', color: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="total_volume" fill="#123B35" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  AlertTriangle,
  Gauge,
  Layers,
  Lightbulb,
  CheckCircle,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { trafficApi } from '../api/trafficApi';
import { useFilters } from '../context/FilterContext';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

export const InsightsPage = () => {
  const { activeDataset, datasetVersion } = useFilters();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trafficApi.getInsights();
      if (res.success && res.data) {
        setInsights(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load smart insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [datasetVersion]);

  const cityName = activeDataset?.cities?.[0] || 'Metropolitan';

  if (loading) return <LoadingState message={`Synthesizing ${cityName} Analytical Insights...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchInsights} />;

  const facts = insights?.facts || {};
  const sentences = insights?.sentences || [];

  return (
    <div className="space-y-7 pb-10">
      {/* 15. EXECUTIVE REPORT HEADER WITH SKYLINE PHOTO */}
      <div className="relative overflow-hidden bg-white border border-[#E8E4DA] rounded-3xl p-6 md:p-8 shadow-[0_3px_16px_-4px_rgba(20,35,28,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] border border-[#BDE8DC] text-[#087F5B] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{cityName} PySpark Analytical Synthesis</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#123B35] tracking-tight leading-tight">
              Executive Traffic Intelligence Report
            </h1>
            <p className="text-sm md:text-base text-[#5B6F64] leading-relaxed max-w-2xl">
              Deterministic narrative compilation and multi-variable metric synthesis computed directly from Apache PySpark distributed transformations and MongoDB Atlas indexing.
            </p>
            <div className="text-xs text-[#8C9B93] pt-1">
              Generated: {insights?.generated_at ? new Date(insights.generated_at).toLocaleString() : 'Recent Pipeline Run'} • Partitioned Map-Reduce
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-2xl overflow-hidden border border-[#E0DACE] shadow-sm">
              <img
                src="/assets/mumbai_skyline.jpg"
                alt={`${cityName} Urban Infrastructure`}
                className="w-full h-40 object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6 Editorial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Peak Traffic Day */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] border-t-4 border-t-[#087F5B] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#087F5B]">
                Peak Traffic Day
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EBF7F2] text-[#087F5B] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#123B35]">{facts.peak_traffic_day}</h3>
            <p className="text-xs font-medium text-[#5B6F64] mt-1">
              {facts.peak_day_volume?.toLocaleString()} recorded vehicles
            </p>
          </div>
          <p className="text-xs text-[#5B6F64] mt-4 pt-3 border-t border-[#EFECE6] leading-relaxed">
            Highest concentration of vehicular flow observed during the weekly cadence.
          </p>
        </div>

        {/* Card 2: Busiest Corridor */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] border-t-4 border-t-[#2BAE9B] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2BAE9B]">
                Busiest Corridor
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#E6F8F5] text-[#2BAE9B] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#123B35]">{facts.busiest_area}</h3>
            <p className="text-xs font-medium text-[#5B6F64] mt-1">
              {facts.busiest_area_volume?.toLocaleString()} cumulative throughput
            </p>
          </div>
          <p className="text-xs text-[#5B6F64] mt-4 pt-3 border-t border-[#EFECE6] leading-relaxed">
            Top volume contributor in the {cityName} metropolitan network.
          </p>
        </div>

        {/* Card 3: Modal Share Leader */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] border-t-4 border-t-[#5B8DEF] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B8DEF]">
                Modal Share Leader
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EBF2FE] text-[#5B8DEF] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#123B35]">{facts.dominant_vehicle}</h3>
            <p className="text-xs font-medium text-[#5B6F64] mt-1">
              {facts.dominant_vehicle_share}% of all observed vehicles
            </p>
          </div>
          <p className="text-xs text-[#5B6F64] mt-4 pt-3 border-t border-[#EFECE6] leading-relaxed">
            Dominant transport mode across commercial and arterial routes.
          </p>
        </div>

        {/* Card 4: Critical Incident Hotspot */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] border-t-4 border-t-[#E97A72] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E97A72]">
                Highest Collision Area
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FDF0EF] text-[#E97A72] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#D4564E]">{facts.highest_accident_area}</h3>
            <p className="text-xs font-medium text-[#5B6F64] mt-1">
              {facts.highest_accidents} recorded collisions
            </p>
          </div>
          <p className="text-xs text-[#5B6F64] mt-4 pt-3 border-t border-[#EFECE6] leading-relaxed">
            Prioritized corridor for roadway engineering and traffic safety calming.
          </p>
        </div>

        {/* Card 5: Enforcement Priority */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] border-t-4 border-t-[#E9A23B] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E9A23B]">
                Highest Enforcement Area
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FEF5E7] text-[#E9A23B] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#123B35]">{facts.highest_violation_area}</h3>
            <p className="text-xs font-medium text-[#5B6F64] mt-1">
              {facts.highest_violations?.toLocaleString()} recorded violations
            </p>
          </div>
          <p className="text-xs text-[#5B6F64] mt-4 pt-3 border-t border-[#EFECE6] leading-relaxed">
            Corridor with maximal traffic policing and camera citation logs.
          </p>
        </div>

        {/* Card 6: Speed vs Congestion Impact */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E4DA] border-t-4 border-t-[#8C82D9] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C82D9]">
                Velocity Differentials
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#F4F2FC] text-[#8C82D9] flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-[#123B35]">
              {facts.fastest_area} ({facts.fastest_area_speed} km/h)
            </h3>
            <p className="text-xs font-medium text-[#5B6F64] mt-1">
              Slowest: {facts.slowest_area} ({facts.slowest_area_speed} km/h)
            </p>
          </div>
          <p className="text-xs text-[#5B6F64] mt-4 pt-3 border-t border-[#EFECE6] leading-relaxed">
            Speed differentials reflect infrastructure capacity and signal synchronization.
          </p>
        </div>
      </div>

      {/* "WHAT DOES THE DATA TELL US?" Section */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E8E4DA] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] space-y-5">
        <div className="flex items-center gap-3 border-b border-[#EFECE6] pb-4">
          <div className="w-8 h-8 rounded-xl bg-[#087F5B] text-white flex items-center justify-center font-bold shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#123B35] tracking-tight">
              WHAT DOES THE DATA TELL US?
            </h2>
            <p className="text-xs text-[#5B6F64]">
              Data-driven factual statements compiled deterministically from aggregated PySpark metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {sentences.map((sentence, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl border border-[#E8E4DA] bg-[#FDFCF9] hover:bg-[#F7F5EF] transition-all flex items-start gap-4"
            >
              <div className="w-7 h-7 rounded-xl bg-[#EBF7F2] text-[#087F5B] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#BDE8DC]">
                {index + 1}
              </div>
              <p className="text-xs md:text-sm leading-relaxed text-[#1A2621] font-medium">
                {sentence}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Big Data Engineering Note */}
      <div className="bg-[#123B35] text-[#E6F5F0] p-6 rounded-2xl text-xs space-y-2.5 shadow-md">
        <div className="flex items-center gap-2 text-[#A5E3D0] font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Big Data Pipeline Verification & Integrity Assurance</span>
        </div>
        <p className="text-[#C2E0D6] leading-relaxed text-xs">
          Every statement, ranking, and KPI above is computed through PySpark's resilient distributed dataset pipeline, validated against the raw CSV dataset, and loaded into MongoDB Atlas. No synthetic numbers, LLM hallucination, or placeholder templates are employed.
        </p>
      </div>
    </div>
  );
};

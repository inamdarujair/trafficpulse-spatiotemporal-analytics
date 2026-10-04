import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Calendar,
  MapPin,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Cpu,
  Clock,
  HardDrive
} from 'lucide-react';
import { trafficApi } from '../api/trafficApi';
import { useFilters } from '../context/FilterContext';

export const DatasetStudioPage = () => {
  const { datasets, activeDataset, switchActiveDataset, reloadDatasets } = useFilters();

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionData, setInspectionData] = useState(null);
  const [inspectError, setInspectError] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  const [switchingId, setSwitchingId] = useState(null);

  // Handle file select
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setInspectError('Please select a valid CSV file.');
      return;
    }

    setSelectedFile(file);
    setInspectError(null);
    setInspectionData(null);
    setProcessResult(null);
    setProcessError(null);

    // Inspect the file
    setInspecting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await trafficApi.inspectCsv(formData);
      if (res.success && res.data) {
        setInspectionData(res.data);
      } else {
        setInspectError(res.error || 'Failed to inspect CSV structure.');
      }
    } catch (err) {
      setInspectError(err.message || 'Inspection failed.');
    } finally {
      setInspecting(false);
    }
  };

  // Trigger PySpark processing
  const handleGenerateAnalytics = async () => {
    if (!inspectionData) return;

    setProcessing(true);
    setProcessError(null);
    setProcessResult(null);

    try {
      const res = await trafficApi.processDataset({
        temp_file_path: inspectionData.temp_file_path,
        dataset_id: inspectionData.suggested_id,
        dataset_name: inspectionData.suggested_name
      });

      if (res.success) {
        setProcessResult(res);
        // Refresh global datasets list and switch
        await reloadDatasets();
        // Clear selected file state
        setSelectedFile(null);
        setInspectionData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setProcessError(res.error || 'PySpark processing failed. Current active dataset remains unchanged.');
      }
    } catch (err) {
      setProcessError(err.message || 'Failed to execute PySpark pipeline.');
    } finally {
      setProcessing(false);
    }
  };

  // Switch to an existing dataset
  const handleSwitchDataset = async (dataset_id) => {
    setSwitchingId(dataset_id);
    try {
      await switchActiveDataset(dataset_id);
    } catch (err) {
      console.error('Failed to switch dataset:', err);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] border border-[#BDE8DC] text-[#087F5B] text-xs font-semibold tracking-wide mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Dataset Ingestion & Management</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#123B35] tracking-tight">
            Dataset Studio
          </h1>
          <p className="text-sm text-[#5B6F64] mt-1">
            Upload a new traffic dataset and regenerate the analytics workspace powered by Apache PySpark & MongoDB Atlas.
          </p>
        </div>
      </div>

      {/* Active Dataset Banner */}
      <div className="bg-white border border-[#E8E4DA] rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#087F5B] to-[#2BAE9B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#087F5B]">
                  CURRENT ACTIVE DATASET
                </span>
                <span className="text-xs text-[#8C9B93]">• {activeDataset?.dataset_id}</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#123B35] mt-0.5">
                {activeDataset?.dataset_name || 'Loading Active Dataset...'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#5B6F64]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#123B35]">
                  <Database className="w-3.5 h-3.5 text-[#087F5B]" />
                  {activeDataset?.record_count?.toLocaleString()} validated records
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2BAE9B]" />
                  Cities: {activeDataset?.cities?.join(', ') || 'Metropolitan'}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5B8DEF]" />
                  {activeDataset?.date_range?.start} to {activeDataset?.date_range?.end}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-3 py-1.5 rounded-xl">
              Live in MongoDB Atlas
            </span>
          </div>
        </div>
      </div>

      {/* Upload and Pipeline Execution Studio */}
      <div className="bg-white border border-[#E8E4DA] rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#123B35]">
            Upload Compatible Traffic CSV
          </h3>
          <p className="text-xs md:text-sm text-[#5B6F64] mt-0.5">
            Select a traffic dataset CSV file. Columns are dynamically detected and mapped for any metropolitan region.
          </p>
        </div>

        {/* Dropzone / Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#DDD7C9] hover:border-[#087F5B] bg-[#FDFCF9] hover:bg-[#F7F5EF] rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-[#EBF7F2] text-[#087F5B] flex items-center justify-center mx-auto mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
            <UploadCloud className="w-7 h-7 text-[#087F5B]" />
          </div>
          <h4 className="text-sm md:text-base font-bold text-[#123B35]">
            {selectedFile ? selectedFile.name : 'Click to Choose CSV or Drag and Drop'}
          </h4>
          <p className="text-xs text-[#8C9B93] mt-1 max-w-sm mx-auto">
            Supports standard traffic surveillance CSVs containing dates, areas/junctions, vehicular counts, and speed fields.
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087F5B] hover:bg-[#076C4D] text-white text-xs font-semibold shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{selectedFile ? 'Change CSV File' : 'Choose CSV'}</span>
            </button>
          </div>
        </div>

        {/* Loading Inspection State */}
        {inspecting && (
          <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-[#F7F5EF] border border-[#E8E4DA] text-xs font-semibold text-[#123B35]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#087F5B]" />
            <span>Inspecting CSV structure, detecting columns, and verifying schema...</span>
          </div>
        )}

        {/* Inspection Error */}
        {inspectError && (
          <div className="p-4 rounded-2xl bg-[#FDF0EF] border border-[#F9CBC7] text-xs text-[#D4564E] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#E97A72] shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">CSV Inspection Failed:</strong>
              <span>{inspectError}</span>
            </div>
          </div>
        )}

        {/* Inspection Details Card */}
        {inspectionData && (
          <div className="bg-[#F7F5EF] border border-[#E8E4DA] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E0DACE] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <h4 className="text-sm font-bold text-[#123B35]">
                  Dataset Pre-Flight Analysis
                </h4>
              </div>
              <span className="text-xs font-bold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-2.5 py-0.5 rounded-full">
                Ready for PySpark Processing
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA]">
                <span className="text-[#8C9B93] block text-[10px] font-semibold uppercase">Filename</span>
                <span className="font-bold text-[#123B35] truncate block mt-0.5">{inspectionData.filename}</span>
                <span className="text-[10px] text-[#5B6F64]">{inspectionData.file_size_formatted}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA]">
                <span className="text-[#8C9B93] block text-[10px] font-semibold uppercase">Row Count</span>
                <span className="font-extrabold text-lg text-[#123B35] block mt-0.5">{inspectionData.record_count.toLocaleString()}</span>
                <span className="text-[10px] text-[#087F5B] font-medium">Valid records</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA]">
                <span className="text-[#8C9B93] block text-[10px] font-semibold uppercase">Detected Cities</span>
                <span className="font-bold text-[#123B35] block mt-0.5">
                  {inspectionData.detected_cities.length > 0 ? inspectionData.detected_cities.join(', ') : 'Metropolitan'}
                </span>
                <span className="text-[10px] text-[#5B6F64]">{inspectionData.detected_areas.length} corridors detected</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA]">
                <span className="text-[#8C9B93] block text-[10px] font-semibold uppercase">Observation Horizon</span>
                <span className="font-bold text-[#123B35] block mt-0.5 truncate">
                  {inspectionData.date_range.start} to {inspectionData.date_range.end}
                </span>
                <span className="text-[10px] text-[#5B6F64]">Daily cadence</span>
              </div>
            </div>

            {/* Detected Columns Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6F64] block">
                Detected Schema Columns:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspectionData.detected_columns.map(c => (
                  <span
                    key={c}
                    className="text-[11px] font-medium bg-white text-[#123B35] border border-[#E8E4DA] px-2.5 py-1 rounded-lg"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Detected Corridors & Vehicles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA] space-y-1">
                <span className="text-[#8C9B93] block text-[10px] font-semibold uppercase">Detected Corridors ({inspectionData.detected_areas.length}):</span>
                <p className="font-medium text-[#123B35]">{inspectionData.detected_areas.join(', ')}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA] space-y-1">
                <span className="text-[#8C9B93] block text-[10px] font-semibold uppercase">Detected Vehicle Classes ({inspectionData.detected_vehicle_types.length}):</span>
                <p className="font-medium text-[#123B35]">{inspectionData.detected_vehicle_types.join(', ')}</p>
              </div>
            </div>

            {/* Action Button: Generate Analytics */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#5B6F64]">
                Dataset will be ingested into PySpark, normalized into MongoDB Atlas, and set as active.
              </div>
              <button
                onClick={handleGenerateAnalytics}
                disabled={processing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#087F5B] to-[#2BAE9B] hover:from-[#076C4D] hover:to-[#229A88] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all focus:outline-none disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Executing PySpark Big Data Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Generate Analytics & Activate Dataset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Processing Feedback */}
        {processing && (
          <div className="p-6 rounded-2xl bg-[#EBF7F2] border border-[#BDE8DC] space-y-3">
            <div className="flex items-center gap-3 text-sm font-bold text-[#087F5B]">
              <Cpu className="w-5 h-5 animate-spin" />
              <span>PySpark Distributed Pipeline in Progress...</span>
            </div>
            <p className="text-xs text-[#3E554B] leading-relaxed">
              Apache PySpark is currently executing stages: schema validation, casing normalization, spatio-temporal feature engineering, composite hotspot ranking, and multi-variable metric synthesis. MongoDB Atlas collections will be populated shortly.
            </p>
          </div>
        )}

        {/* Process Success Alert */}
        {processResult && (
          <div className="p-5 rounded-2xl bg-[#EBF7F2] border border-[#BDE8DC] text-xs text-[#087F5B] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>{processResult.message}</span>
            </div>
            <p className="text-[#3E554B]">
              All 7 analytics pages (Dashboard, Traffic Analysis, Hotspots, Time Analysis, Incidents, Vehicle Analysis, Smart Insights) are now updated and displaying data for this dataset!
            </p>
          </div>
        )}

        {/* Process Error Alert (Failure Safety) */}
        {processError && (
          <div className="p-5 rounded-2xl bg-[#FDF0EF] border border-[#F9CBC7] text-xs text-[#D4564E] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#D4564E]">
              <AlertCircle className="w-4 h-4 text-[#E97A72]" />
              <span>Processing Error — Current Active Dataset Preserved</span>
            </div>
            <p className="text-[#8C4A45]">{processError}</p>
          </div>
        )}
      </div>

      {/* Available Datasets Switcher Card */}
      <div className="bg-white border border-[#E8E4DA] rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] space-y-5">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#123B35]">
              Stored Datasets in MongoDB Atlas
            </h3>
            <p className="text-xs text-[#5B6F64] mt-0.5">
              Switch between available datasets at any time. All 7 pages adapt instantaneously to the chosen dataset.
            </p>
          </div>
          <span className="text-xs font-bold text-[#087F5B] bg-[#EBF7F2] border border-[#BDE8DC] px-3 py-1 rounded-full">
            {datasets.length} Stored Datasets
          </span>
        </div>

        <div className="space-y-3">
          {datasets.map((d) => {
            const isActive = d.is_active || d.dataset_id === activeDataset?.dataset_id;
            return (
              <div
                key={d.dataset_id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-[#087F5B] bg-[#EBF7F2]/50 shadow-xs ring-1 ring-[#087F5B]/30'
                    : 'border-[#E8E4DA] bg-white hover:border-[#DDD7C9] hover:bg-[#FDFCF9]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-extrabold text-[#123B35]">
                      {d.dataset_name}
                    </span>
                    {isActive ? (
                      <span className="text-[10px] font-bold text-[#087F5B] bg-[#DDF3EA] border border-[#B8E7D5] px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#8C9B93] bg-[#F7F5EF] border border-[#E8E4DA] px-2 py-0.5 rounded-full">
                        Stored
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5B6F64]">
                    <span className="font-semibold text-[#123B35]">
                      {d.record_count?.toLocaleString()} rows
                    </span>
                    <span>•</span>
                    <span>Cities: {d.cities?.join(', ') || 'Metropolitan'}</span>
                    <span>•</span>
                    <span>Areas: {d.areas?.length || 0} corridors</span>
                    <span>•</span>
                    <span>Range: {d.date_range?.start} to {d.date_range?.end}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isActive ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087F5B] bg-white border border-[#BDE8DC] px-3.5 py-2 rounded-xl shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B]" />
                      <span>Currently Active</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSwitchDataset(d.dataset_id)}
                      disabled={switchingId === d.dataset_id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#F7F5EF] border border-[#E8E4DA] text-[#123B35] text-xs font-semibold shadow-2xs hover:shadow transition-all focus:outline-none"
                    >
                      {switchingId === d.dataset_id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#087F5B]" />
                          <span>Switching...</span>
                        </>
                      ) : (
                        <>
                          <span>Switch to this Dataset</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#087F5B]" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

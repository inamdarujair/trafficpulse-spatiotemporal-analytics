import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Bell, ChevronDown, Check, Sparkles, Database } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export const Navbar = () => {
  const { meta, activeDataset, datasets, switchActiveDataset } = useFilters();
  const [datasetMenuOpen, setDatasetMenuOpen] = useState(false);
  const datasetMenuRef = useRef(null);

  const dateRangeStr = meta?.dateRange
    ? `${meta.dateRange.start} – ${meta.dateRange.end}`
    : '2025-01-02 – 2025-12-31';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datasetMenuRef.current && !datasetMenuRef.current.contains(e.target)) {
        setDatasetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDataset = async (dataset_id) => {
    setDatasetMenuOpen(false);
    if (dataset_id !== activeDataset?.dataset_id) {
      await switchActiveDataset(dataset_id);
    }
  };

  return (
    <header className="h-18 bg-[#F7F5EF]/90 backdrop-blur-md border-b border-[#E5DFD3] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Pill */}
      <div className="flex items-center gap-3 w-48 sm:w-64 md:w-72 lg:w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#8C9B93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="navbar-search-input"
            name="search"
            aria-label="Search corridors, dates, metrics"
            placeholder="Search corridors, dates, metrics..."
            className="w-full bg-white/90 border border-[#E5DFD3] text-[#1A2621] text-xs rounded-full pl-9.5 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#087F5B]/15 focus:border-[#087F5B] transition placeholder:text-[#9AA8A0] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Dataset Dropdown Selector */}
        <div className="relative" ref={datasetMenuRef}>
          <button
            onClick={() => setDatasetMenuOpen(!datasetMenuOpen)}
            className="flex items-center gap-2 bg-[#EBF7F2] hover:bg-[#E0F3EC] border border-[#BDE8DC] text-[#087F5B] px-3 py-1.5 rounded-2xl shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20"
            title="Switch Active Dataset"
          >
            <Database className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
            <div className="flex flex-col text-left leading-none">
              <span className="text-[9px] uppercase tracking-wider text-[#087F5B]/80 font-bold">ACTIVE DATASET</span>
              <span className="font-extrabold text-[#123B35] text-xs mt-0.5 truncate max-w-[120px] sm:max-w-[180px] lg:max-w-[220px]">
                {activeDataset?.dataset_name || 'Mumbai Traffic 2025'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#087F5B] transition-transform duration-200 shrink-0 ${datasetMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {datasetMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-[#E8E4DA] shadow-xl p-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#F0ECE1] flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#697D73]">Switch Dataset</span>
                <span className="text-[10px] font-semibold text-[#087F5B] bg-[#EBF7F2] px-2 py-0.5 rounded-full">{datasets.length} available</span>
              </div>
              <div className="max-h-56 overflow-y-auto py-1 space-y-1">
                {datasets.map((d) => {
                  const isCurrent = d.dataset_id === activeDataset?.dataset_id;
                  return (
                    <button
                      key={d.dataset_id}
                      onClick={() => handleSelectDataset(d.dataset_id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between ${
                        isCurrent ? 'bg-[#EBF7F2] text-[#087F5B] font-bold shadow-xs' : 'hover:bg-[#F7F5EF] text-[#1A2621]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate font-semibold text-xs">{d.dataset_name}</p>
                        <p className="text-[10px] text-[#708479] mt-0.5 font-normal">
                          {d.record_count?.toLocaleString()} rows • {d.cities?.join(', ') || 'Metropolitan'}
                        </p>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#087F5B] shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-[#F0ECE1]">
                <Link
                  to="/datasets"
                  onClick={() => setDatasetMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-[#F7F5EF] hover:bg-[#EAE5DA] text-xs font-semibold text-[#123B35] transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>Open Dataset Studio</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Dataset Range Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-white/95 border border-[#E5DFD3] text-[#33473D] text-[11px] font-medium px-3.5 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Calendar className="w-3.5 h-3.5 text-[#087F5B]" />
          <span className="text-[#75887E]">Timeline:</span>
          <span className="font-bold text-[#1A2621]">{dateRangeStr}</span>
        </div>

        {/* Live API Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#DDF3EA] border border-[#BCE6D6] text-[#087F5B] text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B] animate-pulse"></span>
          <span>Live API</span>
        </div>

        {/* Notification Bell */}
        <button
          className="text-[#5B6F64] hover:text-[#1A2621] p-2 rounded-full bg-white/80 border border-[#E5DFD3] hover:bg-white transition relative shadow-2xs"
          title="Analytical alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#E97A72] rounded-full"></span>
        </button>

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5DFD3]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#123B35] to-[#087F5B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            A
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-[#1A2621] leading-tight">Analyst</p>
            <p className="text-[10px] text-[#75887E] leading-tight">BDA Lab Portal</p>
          </div>
        </div>
      </div>
    </header>
  );
};

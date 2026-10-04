import React from 'react';
import { AlertCircle, RefreshCw, Inbox, Info } from 'lucide-react';

export const LoadingState = ({ message = 'Computing aggregates from MongoDB Atlas...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white rounded-2xl border border-[#E8E4DA] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
    <div className="w-10 h-10 border-3 border-[#087F5B] border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-sm font-semibold text-[#123B35]">{message}</p>
    <p className="text-xs text-[#8C9B93] mt-1">PySpark distributed batch execution & MongoDB Atlas pipelines</p>
  </div>
);

export const ErrorState = ({ message = 'Failed to load data from backend API.', onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white rounded-2xl border border-[#F9CBC7] shadow-[0_2px_12px_-3px_rgba(233,122,114,0.1)]">
    <div className="w-12 h-12 bg-[#FDF0EF] rounded-2xl flex items-center justify-center text-[#D4564E] mb-3">
      <AlertCircle className="w-6 h-6" />
    </div>
    <h4 className="text-base font-bold text-[#123B35] mb-1">Data Retrieval Notice</h4>
    <p className="text-xs text-[#5B6F64] max-w-md mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-[#087F5B] hover:bg-[#076C4D] text-white text-xs font-semibold rounded-xl shadow-xs transition-all focus:outline-none"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Query</span>
      </button>
    )}
  </div>
);

export const EmptyState = ({
  title = 'No records match filter criteria',
  message = 'Try broadening your dates, areas, or vehicle type selections.'
}) => (
  <div className="flex flex-col items-center justify-center min-h-[280px] p-8 text-center bg-white rounded-2xl border border-[#E8E4DA] shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
    <div className="w-12 h-12 bg-[#F7F5EF] rounded-2xl flex items-center justify-center text-[#8C9B93] mb-3">
      <Inbox className="w-6 h-6" />
    </div>
    <h4 className="text-sm font-bold text-[#123B35] mb-1">{title}</h4>
    <p className="text-xs text-[#5B6F64] max-w-sm">{message}</p>
  </div>
);

export const CoordinateDisclaimer = ({ disclaimer }) => (
  <div className="flex items-start gap-3 bg-[#EBF7F2] border border-[#BDE8DC] text-[#123B35] text-xs px-4 py-3 rounded-2xl shadow-xs">
    <Info className="w-4 h-4 text-[#087F5B] shrink-0 mt-0.5" />
    <div>
      <span className="font-bold text-[#087F5B]">Spatial Methodology Notice: </span>
      <span className="text-[#3E554B]">
        {disclaimer || 'Marker positions represent approximate geographic locality centroids for metropolitan visualization, not sensor coordinates.'}
      </span>
    </div>
  </div>
);

import React from 'react';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'emerald', // 'emerald', 'blue', 'amber', 'teal', 'coral', 'default'
  loading = false
}) => {
  // Cohesive, tailored color accents matching the editorial palette
  const accentStyles = {
    emerald: {
      topBorder: 'border-t-[#087F5B]',
      iconBg: 'bg-[#DDF3EA] text-[#087F5B]',
      badge: 'bg-[#DDF3EA] text-[#087F5B] border-[#B8E7D5]'
    },
    blue: {
      topBorder: 'border-t-[#5B8DEF]',
      iconBg: 'bg-[#EBF2FE] text-[#3B71D9]',
      badge: 'bg-[#EBF2FE] text-[#3B71D9] border-[#C8DCFB]'
    },
    amber: {
      topBorder: 'border-t-[#E9A23B]',
      iconBg: 'bg-[#FEF5E7] text-[#C47D1A]',
      badge: 'bg-[#FEF5E7] text-[#C47D1A] border-[#FCE1B6]'
    },
    teal: {
      topBorder: 'border-t-[#2BAE9B]',
      iconBg: 'bg-[#E6F8F5] text-[#1D8E7E]',
      badge: 'bg-[#E6F8F5] text-[#1D8E7E] border-[#B5EDE3]'
    },
    coral: {
      topBorder: 'border-t-[#E97A72]',
      iconBg: 'bg-[#FDF0EF] text-[#D4564E]',
      badge: 'bg-[#FDF0EF] text-[#D4564E] border-[#F9CBC7]'
    },
    default: {
      topBorder: 'border-t-[#8C9B93]',
      iconBg: 'bg-[#F0ECE1] text-[#4A5D54]',
      badge: 'bg-[#F0ECE1] text-[#4A5D54] border-[#DDD7C9]'
    }
  };

  const style = accentStyles[badgeType] || accentStyles.default;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-[#E8E4DA] shadow-[0_2px_10px_-2px_rgba(20,35,28,0.04)] animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 bg-[#EAE5DA] rounded w-24"></div>
          <div className="w-8 h-8 bg-[#EAE5DA] rounded-xl"></div>
        </div>
        <div className="h-8 bg-[#EAE5DA] rounded w-32 mb-2"></div>
        <div className="h-3 bg-[#EAE5DA] rounded w-36"></div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-white rounded-2xl p-5 border border-[#E8E4DA] border-t-3 ${style.topBorder} shadow-[0_2px_12px_-3px_rgba(20,35,28,0.05)] hover:shadow-[0_4px_16px_-3px_rgba(20,35,28,0.08)] transition-all flex flex-col justify-between group`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#697D73]">
          {title}
        </span>
        {Icon && (
          <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${style.iconBg}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-1">
        <h3 className="text-[28px] font-extrabold text-[#1A2621] tracking-tight leading-tight">
          {value !== undefined && value !== null ? value : '—'}
        </h3>
      </div>

      {/* Subtitle & Badge Footer */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 text-xs text-[#708479] pt-2.5 border-t border-[#F0ECE1]">
        <span className="text-[11px] font-medium leading-snug">{subtitle}</span>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 tracking-wide ${style.badge}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

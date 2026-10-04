import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle,
  Car,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Cpu,
  Activity,
  Zap
} from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Traffic Analysis', path: '/traffic', icon: TrendingUp },
  { name: 'Hotspots', path: '/hotspots', icon: MapPin },
  { name: 'Time Analysis', path: '/time', icon: Clock },
  { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { name: 'Vehicle Analysis', path: '/vehicles', icon: Car },
  { name: 'Smart Insights', path: '/insights', icon: Sparkles },
  { name: 'Dataset Studio', path: '/datasets', icon: Database }
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { activeDataset } = useFilters();

  return (
    <aside
      className={`bg-[#10221C] text-[#E0E7E3] flex flex-col transition-all duration-300 z-30 shrink-0 select-none border-r border-[#1B332B] ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 px-4 flex items-center justify-between border-b border-[#1A312A]">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#087F5B] to-[#2BAE9B] flex items-center justify-center shrink-0 shadow-md shadow-[#087F5B]/25">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[15px] tracking-tight text-white">
                  TrafficPulse
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2BAE9B]/20 text-[#36CEB8] border border-[#2BAE9B]/30 tracking-wider uppercase">
                  SaaS
                </span>
              </div>
              <p className="text-[11px] text-[#86A398] font-medium tracking-tight">
                Traffic Pattern Analytics
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-[#087F5B] to-[#2BAE9B] flex items-center justify-center shadow-md shadow-[#087F5B]/25">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#789389] hover:text-white p-1.5 rounded-lg hover:bg-[#1A312A] transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-[#678278]">
            Analytics Modules
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#087F5B] to-[#17624C] text-white font-semibold shadow-sm shadow-[#087F5B]/30 ring-1 ring-[#2BAE9B]/30'
                    : 'text-[#9CB3A9] hover:bg-[#162D25] hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Product Status Panel */}
      {!collapsed ? (
        <div className="p-3.5 m-3 rounded-2xl bg-[#0C1B16] border border-[#1C362D] text-xs space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#182F27]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2BAE9B] animate-pulse"></span>
              <span className="text-[11px] font-bold text-white tracking-wide">System Online</span>
            </div>
            <span className="text-[10px] text-[#719184] font-medium">Cluster0</span>
          </div>

          <div className="flex items-center justify-between text-[#8DA69B] text-[11px] pb-1 border-b border-[#182F27]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#36CEB8]"></span>
              <span className="font-semibold text-white truncate max-w-[110px]" title={activeDataset?.dataset_name || 'Mumbai Traffic 2025'}>
                {activeDataset?.dataset_name || 'Mumbai Traffic'}
              </span>
            </div>
            <span className="text-[#36CEB8] text-[9px] font-bold px-1 py-0.5 rounded bg-[#36CEB8]/15 uppercase shrink-0">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between text-[#8DA69B] text-[11px]">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#2BAE9B]" />
              <span>PySpark 4.2</span>
            </div>
            <span className="text-[#647C72] text-[10px]">Big Data Engine</span>
          </div>

          <div className="flex items-center justify-between text-[#8DA69B] text-[11px]">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#5B8DEF]" />
              <span>MongoDB Atlas</span>
            </div>
            <span className="text-[#647C72] text-[10px]">Cloud Database</span>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-[#1A312A] flex flex-col items-center gap-2.5 py-4 text-[#8DA69B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2BAE9B] animate-pulse" title="System Online"></span>
          <Cpu className="w-4 h-4 text-[#2BAE9B]" title="PySpark 4.2 Engine" />
          <Database className="w-4 h-4 text-[#5B8DEF]" title="MongoDB Atlas" />
        </div>
      )}
    </aside>
  );
};

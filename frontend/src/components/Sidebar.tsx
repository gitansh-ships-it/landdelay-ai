import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Folders,
  ShieldAlert,
  MapPin,
  CheckSquare,
  Database,
  Cpu,
  Settings,
  Landmark,
  Scale,
  X
} from 'lucide-react';

interface SidebarProps {
  pendingActionsCount?: number;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingActionsCount = 0,
  mobileOpen = false,
  onClose
}) => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Acquisition Cases', path: '/cases', icon: Folders },
    { name: 'Risk Analytics', path: '/risk-analytics', icon: ShieldAlert },
    { name: 'Geographic View', path: '/map', icon: MapPin },
    { name: 'Action Center', path: '/actions', icon: CheckSquare, badge: pendingActionsCount > 0 ? pendingActionsCount : undefined },
    { name: 'Data Management', path: '/data', icon: Database },
    { name: 'Model Evaluation', path: '/model', icon: Cpu },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                LandDelay <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-normal">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Infrastructure Delay Analytics</p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Decision Support
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-amber-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Statutory Advisory Notice */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-start gap-2.5 text-xs text-slate-400">
            <Scale className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-300">Decision Support Only:</span> Does not make legal awards or adjudicate ownership.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  pendingActionsCount?: number;
  mobileOpen?: boolean;
  onClose?: () => void;
  desktopCollapsed?: boolean;
  onToggleDesktopCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingActionsCount = 0,
  mobileOpen = false,
  onClose,
  desktopCollapsed = false,
  onToggleDesktopCollapse
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900/85 dark:bg-slate-950/80 backdrop-blur-glass border-r border-white/10 dark:border-white/5 text-slate-200 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 shadow-glass-lg ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          desktopCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-white/5 dark:bg-black/20 relative">
          {desktopCollapsed ? (
            <div className="flex items-center justify-center w-full relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 border border-white/20">
                <Landmark className="h-5 w-5" />
              </div>
              {onToggleDesktopCollapse && (
                <button
                  onClick={onToggleDesktopCollapse}
                  title="Expand Sidebar (Desktop)"
                  className="hidden lg:flex absolute -right-6 top-1.5 h-6 w-6 rounded-full bg-slate-800 border border-white/20 text-slate-300 hover:text-white items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 border border-white/20 shrink-0">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                    LandDelay <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono font-medium border border-sky-500/30">AI</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium">Predictive Delay Analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onToggleDesktopCollapse && (
                  <button
                    onClick={onToggleDesktopCollapse}
                    title="Collapse Sidebar (Desktop)"
                    className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className={`px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider ${
            desktopCollapsed ? 'lg:hidden' : 'block'
          }`}>
            Decision Support
          </div>
          {desktopCollapsed && (
            <div className="hidden lg:block h-px bg-white/10 mx-2 mb-2" />
          )}

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              title={desktopCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                `relative flex items-center ${
                  desktopCollapsed ? 'lg:justify-center lg:px-0' : 'justify-between px-3.5'
                } py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/90 to-sky-600/90 text-white shadow-md shadow-blue-600/25 border border-white/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center ${desktopCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className={`${desktopCollapsed ? 'lg:hidden' : 'inline'} transition-opacity truncate`}>
                      {item.name}
                    </span>
                  </div>
                  {item.badge !== undefined && (
                    desktopCollapsed ? (
                      <span
                        title={`${item.badge} pending actions`}
                        className="hidden lg:flex absolute top-1.5 right-2.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse"
                      />
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.badge}
                      </span>
                    )
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Statutory Advisory Notice & Bottom Toggle */}
        <div className="p-3 border-t border-white/10 bg-white/5 dark:bg-black/20">
          {desktopCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title="Decision Support Only: Does not make legal awards or determine land ownership."
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400 cursor-help"
              >
                <Scale className="h-4 w-4" />
              </div>
              {onToggleDesktopCollapse && (
                <button
                  onClick={onToggleDesktopCollapse}
                  title="Expand Sidebar (Desktop)"
                  className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                <Scale className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[10px] leading-relaxed">
                  <span className="font-semibold text-slate-200">Decision Support Only:</span> Does not make legal awards or determine land ownership.
                </div>
              </div>
              {onToggleDesktopCollapse && (
                <button
                  onClick={onToggleDesktopCollapse}
                  className="hidden lg:flex w-full mt-2 items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Collapse Sidebar</span>
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

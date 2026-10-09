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
        className={`fixed inset-y-0 left-0 z-50 bg-white/55 dark:bg-[#182b3f]/75 backdrop-blur-glass border-r border-white/80 dark:border-white/10 text-[#18344D] dark:text-[#EDF6FF] flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 shadow-glass ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          desktopCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between ${
          desktopCollapsed ? 'px-2 lg:px-2' : 'px-4 sm:px-5'
        } border-b border-white/70 dark:border-white/10 bg-white/35 dark:bg-black/20 relative`}>
          {desktopCollapsed ? (
            <>
              {/* Collapsed view on desktop: compact logo + expand chevron */}
              <div className="hidden lg:flex items-center justify-center gap-1.5 w-full">
                <div
                  className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#1687E8] to-[#1264B3] flex items-center justify-center text-white shadow-sm shadow-[#1687E8]/25 border border-white/40 shrink-0"
                  title="LandDelay AI"
                >
                  <Landmark className="h-4 w-4" />
                </div>
                {onToggleDesktopCollapse && (
                  <button
                    onClick={onToggleDesktopCollapse}
                    className="p-1 text-[#607D95] dark:text-slate-400 hover:text-[#18344D] dark:hover:text-white rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    title="Expand Sidebar"
                    aria-label="Expand Sidebar"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Mobile view when desktop is collapsed: full drawer header with close button */}
              <div className="flex lg:hidden items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#1687E8] to-[#1264B3] flex items-center justify-center text-white shadow-md shadow-[#1687E8]/25 border border-white/40 shrink-0">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="font-bold text-base text-[#18344D] dark:text-white tracking-tight flex items-center gap-1.5">
                      LandDelay <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1687E8]/10 dark:bg-sky-500/20 text-[#1264B3] dark:text-sky-300 font-mono font-medium border border-[#1687E8]/25">AI</span>
                    </h1>
                    <p className="text-[10px] text-[#607D95] dark:text-slate-400 font-medium">Predictive Delay Analytics</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-[#607D95] hover:text-[#18344D] dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Menu"
                  aria-label="Close Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#1687E8] to-[#1264B3] flex items-center justify-center text-white shadow-md shadow-[#1687E8]/25 border border-white/40 shrink-0">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-base text-[#18344D] dark:text-white tracking-tight flex items-center gap-1.5">
                    LandDelay <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1687E8]/10 dark:bg-sky-500/20 text-[#1264B3] dark:text-sky-300 font-mono font-medium border border-[#1687E8]/25">AI</span>
                  </h1>
                  <p className="text-[10px] text-[#607D95] dark:text-slate-400 font-medium truncate">Predictive Delay Analytics</p>
                </div>
              </div>

              {/* Desktop collapse toggle button */}
              {onToggleDesktopCollapse && (
                <button
                  onClick={onToggleDesktopCollapse}
                  className="hidden lg:flex p-1.5 text-[#607D95] dark:text-slate-400 hover:text-[#18344D] dark:hover:text-white rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 text-[#607D95] hover:text-[#18344D] dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                title="Close Menu"
                aria-label="Close Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className={`px-3 pb-2 text-[10px] font-semibold text-[#607D95] dark:text-slate-400 uppercase tracking-wider ${
            desktopCollapsed ? 'lg:hidden' : 'block'
          }`}>
            Decision Support
          </div>
          {desktopCollapsed && (
            <div className="hidden lg:block h-px bg-white/40 dark:bg-white/10 mx-2 mb-2" />
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
                    ? 'bg-[#1687E8]/12 text-[#1264B3] dark:bg-sky-500/20 dark:text-[#56B4F5] border border-[#1687E8]/25 dark:border-sky-400/30 font-semibold shadow-xs'
                    : 'text-[#607D95] dark:text-[#A8BED2] hover:text-[#18344D] dark:hover:text-[#EDF6FF] hover:bg-white/50 dark:hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center ${desktopCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#1264B3] dark:text-[#56B4F5]' : 'text-[#607D95] dark:text-[#A8BED2]'}`} />
                    <span className={`${desktopCollapsed ? 'lg:hidden' : 'inline'} transition-opacity truncate`}>
                      {item.name}
                    </span>
                  </div>
                  {item.badge !== undefined && (
                    desktopCollapsed ? (
                      <span
                        title={`${item.badge} pending actions`}
                        className="hidden lg:flex absolute top-1.5 right-2.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900 animate-pulse"
                      />
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-[#1264B3] text-white dark:bg-[#1687E8] dark:text-white'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
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

        {/* Statutory Advisory Notice */}
        <div className="p-3 border-t border-white/70 dark:border-white/10 bg-white/35 dark:bg-black/20">
          {desktopCollapsed ? (
            <div className="flex flex-col items-center">
              <div
                title="Decision Support Only: Does not make legal awards or determine land ownership."
                className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/80 dark:border-white/10 text-amber-600 dark:text-amber-400 cursor-help"
              >
                <Scale className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 text-xs text-[#607D95] dark:text-[#A8BED2] bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-white/70 dark:border-white/10">
              <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed">
                <span className="font-semibold text-[#18344D] dark:text-[#EDF6FF]">Decision Support Only:</span> Does not make legal awards or determine land ownership.
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

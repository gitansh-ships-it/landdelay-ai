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
          className="fixed inset-0 z-40 bg-[#0B1320]/75 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#101B2D] border-r border-[#1F2E45] text-white flex flex-col flex-shrink-0 transition-[width,transform] duration-[220ms] ease-[cubic-bezier(0.2,0,0,1)] lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          desktopCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between ${
          desktopCollapsed ? 'px-2 lg:px-2' : 'px-4 sm:px-5'
        } border-b border-[#1F2E45] bg-[#0C1524] relative`}>
          {desktopCollapsed ? (
            <>
              {/* Collapsed view on desktop: compact logo + expand chevron */}
              <div className="hidden lg:flex items-center justify-between w-full px-1">
                <img
                  src="/logo.png"
                  alt="LandDelay AI"
                  className="h-10 w-10 rounded-xl object-contain shadow-xs shrink-0 drop-shadow-[0_2px_8px_rgba(53,99,233,0.35)]"
                  title="LandDelay AI"
                />
                {onToggleDesktopCollapse && (
                  <button
                    onClick={onToggleDesktopCollapse}
                    className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
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
                  <img
                    src="/logo.png"
                    alt="LandDelay AI"
                    className="h-10 w-10 rounded-xl object-contain shadow-xs shrink-0 drop-shadow-[0_2px_8px_rgba(53,99,233,0.35)]"
                  />
                  <div>
                    <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                      LandDelay <span className="inline-flex items-center justify-center text-[9px] leading-none px-1 py-0.5 rounded bg-[#3563E9]/15 text-[#60A5FA] font-mono font-medium border border-[#3563E9]/30 tracking-wide">AI</span>
                    </h1>
                    <p className="text-[10px] text-[#94A3B8] font-medium">Predictive Delay Analytics</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
                <img
                  src="/logo.png"
                  alt="LandDelay AI"
                  className="h-10 w-10 rounded-xl object-contain shadow-xs shrink-0 drop-shadow-[0_2px_8px_rgba(53,99,233,0.35)]"
                />
                <div className="min-w-0">
                  <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                    LandDelay <span className="inline-flex items-center justify-center text-[9px] leading-none px-1 py-0.5 rounded bg-[#3563E9]/15 text-[#60A5FA] font-mono font-medium border border-[#3563E9]/30 tracking-wide">AI</span>
                  </h1>
                  <p className="text-[10px] text-[#94A3B8] font-medium truncate">Predictive Delay Analytics</p>
                </div>
              </div>

              {/* Desktop collapse toggle button */}
              {onToggleDesktopCollapse && (
                <button
                  onClick={onToggleDesktopCollapse}
                  className="hidden lg:flex p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                title="Close Menu"
                aria-label="Close Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className={`px-3 pb-2 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider ${
            desktopCollapsed ? 'lg:hidden' : 'block'
          }`}>
            Decision Support
          </div>
          {desktopCollapsed && (
            <div className="hidden lg:block h-px bg-[#1F2E45] mx-2 mb-2" />
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
                } py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#3563E9] text-white font-semibold shadow-xs'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center ${desktopCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                    <span className={`${desktopCollapsed ? 'lg:hidden' : 'inline'} transition-opacity truncate`}>
                      {item.name}
                    </span>
                  </div>
                  {item.badge !== undefined && (
                    desktopCollapsed ? (
                      <span
                        title={`${item.badge} pending actions`}
                        className="hidden lg:flex absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[#E9A23B] ring-2 ring-[#101B2D]"
                      />
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#E9A23B]/20 text-[#FBBF24] border border-[#E9A23B]/30'
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
        <div className="p-3 border-t border-[#1F2E45] bg-[#0C1524]">
          {desktopCollapsed ? (
            <div className="flex flex-col items-center">
              <div
                title="Decision Support Only: Does not make legal awards or determine land ownership."
                className="p-2 rounded-lg bg-[#101B2D] border border-[#1F2E45] text-[#E9A23B] cursor-help"
              >
                <Scale className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 text-xs text-[#94A3B8] bg-[#101B2D] p-3 rounded-lg border border-[#1F2E45]">
              <Scale className="h-4 w-4 text-[#E9A23B] shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed">
                <span className="font-semibold text-white">Decision Support Only:</span> Does not make legal awards or determine land ownership.
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

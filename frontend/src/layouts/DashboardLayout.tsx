import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { api } from '../services/api';

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Executive Overview', subtitle: 'Portfolio-wide land acquisition velocity and milestone delay risks' },
  '/cases': { title: 'Acquisition Case Registry', subtitle: 'Detailed inventory of infrastructure parcels and stage progression' },
  '/risk-analytics': { title: 'Predictive Delay Analytics', subtitle: 'Bottleneck diagnosis, stage durations, and rule trigger frequencies' },
  '/map': { title: 'Geographic Infrastructure Map', subtitle: 'Spatial representation of verified acquisition parcels and risk hotspots' },
  '/actions': { title: 'Administrative Action Center', subtitle: 'Follow-up directives, collector reviews, and dispute resolutions' },
  '/data': { title: 'Data Management & Ingestion', subtitle: 'CSV import validation pipeline and synthetic demonstration data controls' },
  '/model': { title: 'Predictive Model Evaluation', subtitle: 'Transparent validation metrics, confusion matrix, and feature importances' },
  '/settings': { title: 'System Configuration', subtitle: 'Statutory benchmarks, rule weights, and risk score thresholds' },
};

import { useTheme } from '../context/ThemeContext';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const [pendingActionsCount, setPendingActionsCount] = useState<number>(0);
  const [isSynthetic, setIsSynthetic] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Desktop sidebar collapse state (persisted in localStorage)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('landdelay_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('landdelay_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const currentMeta = routeMeta[location.pathname] || {
    title: location.pathname.startsWith('/cases/') ? 'Acquisition Case Details' : 'LandDelay AI',
    subtitle: 'Decision-support intelligence for infrastructure progress'
  };

  const fetchGlobalState = async () => {
    try {
      const summary = await api.getDashboardSummary();
      if (summary && summary.kpis) {
        setPendingActionsCount(summary.kpis.pending_actions_count);
        setIsSynthetic(summary.kpis.synthetic_cases_count > 0);
      }
    } catch (e) {
      console.warn("Global status fetch error:", e);
    }
  };

  useEffect(() => {
    fetchGlobalState();
    setMobileSidebarOpen(false); // Close on route change
  }, [location.pathname, refreshTrigger]);

  const handleDataReset = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans bg-[#F5F7FA] dark:bg-[#0B1320]`}>
      <Sidebar
        pendingActionsCount={pendingActionsCount}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        desktopCollapsed={desktopSidebarCollapsed}
        onToggleDesktopCollapse={toggleDesktopSidebar}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onDataReset={handleDataReset}
          isSyntheticActive={isSynthetic}
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none w-full min-w-0 bg-[#F5F7FA] dark:bg-[#0B1320]">
          <div key={location.pathname} className="page-enter">
            <Outlet context={{ refreshTrigger, setRefreshTrigger }} />
          </div>
        </main>
      </div>
    </div>
  );
};

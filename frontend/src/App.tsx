import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { Cases } from './pages/Cases';
import { CaseDetail } from './pages/CaseDetail';
import { RiskAnalytics } from './pages/RiskAnalytics';
import { GeographicView } from './pages/GeographicView';
import { ActionCenter } from './pages/ActionCenter';
import { DataManagement } from './pages/DataManagement';
import { ModelEvaluation } from './pages/ModelEvaluation';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="cases" element={<Cases />} />
          <Route path="cases/:caseId" element={<CaseDetail />} />
          <Route path="risk-analytics" element={<RiskAnalytics />} />
          <Route path="map" element={<GeographicView />} />
          <Route path="actions" element={<ActionCenter />} />
          <Route path="data" element={<DataManagement />} />
          <Route path="model" element={<ModelEvaluation />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

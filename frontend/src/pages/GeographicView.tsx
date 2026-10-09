import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, Filter, AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { MapResponse, MapCaseItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useTheme } from '../context/ThemeContext';

export const GeographicView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapResponse>({
    total_cases: 0,
    mapped_count: 0,
    unmapped_count: 0,
    cases: []
  });

  const [riskFilter, setRiskFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (riskFilter) params.risk_category = riskFilter;
      if (projectFilter) params.project = projectFilter;

      const res = await api.getMapCases(params);
      setMapData(res);
    } catch (err) {
      console.error('Failed to load geographic cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [riskFilter, projectFilter]);

  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'HIGH': return '#f43f5e';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#0284c7';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Filters & Information Banner */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 border border-sky-400/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">National Infrastructure Corridor Map</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {mapData.mapped_count} spatially mapped parcels across regional project alignments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Filter corridor / project..."
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="glass-input text-xs px-3 py-1.5 w-44"
          />

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="glass-input text-xs px-3 py-1.5"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk (Rose)</option>
            <option value="MEDIUM">Medium Risk (Amber)</option>
            <option value="LOW">Low Risk (Emerald)</option>
          </select>

          {(riskFilter || projectFilter) && (
            <button
              onClick={() => { setRiskFilter(''); setProjectFilter(''); }}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Coordinate Provenance Notice */}
      {mapData.unmapped_count > 0 && (
        <div className="bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Data Integrity Assurance:</span> {mapData.unmapped_count} parcels have no verified GPS coordinates in government records. Coordinates are <strong>never fabricated</strong> for verified public cases. Only verified spatial locations appear on the map.
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="glass-panel p-2 overflow-hidden h-[600px] relative">
        <MapContainer
          center={[22.5937, 78.9629]} // Center of India
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '14px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapData.cases.map((c) => (
            <CircleMarker
              key={c.case_id}
              center={[c.latitude, c.longitude]}
              radius={8}
              pathOptions={{
                fillColor: getMarkerColor(c.risk_category),
                fillOpacity: 0.85,
                color: '#ffffff',
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-xs min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-mono font-bold text-sky-600">{c.case_id}</span>
                    <RiskBadge category={c.risk_category} score={c.risk_score} size="sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{c.project_name}</h5>
                    <p className="text-[11px] text-slate-500">{c.district}, {c.state}</p>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <div><span className="text-slate-400">Stage: </span><span className="font-semibold text-slate-700">{c.current_stage}</span></div>
                    <div><span className="text-slate-400">Land Handover: </span><span className="font-semibold text-slate-700">{c.land_acquired_hectares} / {c.land_required_hectares} ha</span></div>
                    {c.delay_days > 0 && (
                      <div className="text-rose-600 font-semibold">+{c.delay_days} days overdue</div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="px-2.5 py-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-opacity hover:opacity-90"
                    >
                      <span>View Dossier</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="glass-panel-elevated absolute bottom-5 right-5 z-[1000] p-3.5 rounded-xl text-xs space-y-1.5 shadow-glass">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider mb-1">
            Delay Risk Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500 border border-white shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">High Risk (Score &gt;= 70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 border border-white shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Medium Risk (Score 40-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 border border-white shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Low Risk (Score &lt; 40)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

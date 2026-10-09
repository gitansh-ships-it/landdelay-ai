import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, Filter, AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { MapResponse, MapCaseItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const GeographicView: React.FC = () => {
  const navigate = useNavigate();

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
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6366f1';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Filters & Information Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">National Infrastructure Corridor Map</h3>
            <p className="text-xs text-slate-500">
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
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44"
          />

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk (Red)</option>
            <option value="MEDIUM">Medium Risk (Amber)</option>
            <option value="LOW">Low Risk (Green)</option>
          </select>

          {(riskFilter || projectFilter) && (
            <button
              onClick={() => { setRiskFilter(''); setProjectFilter(''); }}
              className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Coordinate Provenance Notice */}
      {mapData.unmapped_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Data Integrity Assurance:</span> {mapData.unmapped_count} parcels have no verified GPS coordinates in government records. Coordinates are <strong>never fabricated</strong> for verified public cases. Only verified spatial locations appear on the map.
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-[600px] relative">
        <MapContainer
          center={[22.5937, 78.9629]} // Center of India
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
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
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-mono font-bold text-indigo-600">{c.case_id}</span>
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
                      <div className="text-red-600 font-semibold">+{c.delay_days} days overdue</div>
                    )}
                  </div>
                  <div className="pt-2 border-t flex justify-end">
                    <button
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-semibold flex items-center gap-1 hover:bg-indigo-700 transition-colors"
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
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
            Delay Risk Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">High Risk (Score &gt;= 70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Medium Risk (Score 40-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Low Risk (Score &lt; 40)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

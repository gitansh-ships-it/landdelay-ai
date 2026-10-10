import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { MapResponse } from '../types';
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
      case 'HIGH': return '#DC3545';
      case 'MEDIUM': return '#E9A23B';
      case 'LOW': return '#19966B';
      default: return '#3563E9';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Filters & Information Banner */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#3563E9]/10 border border-[#3563E9]/20 flex items-center justify-center text-[#3563E9] shadow-xs">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">National Infrastructure Corridor Map</h3>
            <p className="text-xs text-[#687386] dark:text-[#94A3B8]">
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
            <option value="HIGH">High Risk (Red)</option>
            <option value="MEDIUM">Medium Risk (Amber)</option>
            <option value="LOW">Low Risk (Green)</option>
          </select>

          {(riskFilter || projectFilter) && (
            <button
              onClick={() => { setRiskFilter(''); setProjectFilter(''); }}
              className="text-xs text-[#3563E9] hover:text-[#2B52C6] font-semibold transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Coordinate Provenance Notice */}
      {mapData.unmapped_count > 0 && (
        <div className="bg-[#FFFBEB] dark:bg-[#E9A23B]/10 border border-[#FDE68A] dark:border-[#E9A23B]/30 rounded-xl p-4 flex items-start gap-3 text-xs text-[#B45309] dark:text-[#FBBF24]">
          <AlertCircle className="h-4 w-4 text-[#E9A23B] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Data Integrity Assurance:</span> {mapData.unmapped_count} parcels have no verified GPS coordinates in government records. Coordinates are <strong>never fabricated</strong> for verified public cases. Only verified spatial locations appear on the map.
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="glass-panel p-2 overflow-hidden h-[450px] sm:h-[600px] relative">
        <MapContainer
          center={[22.5937, 78.9629]} // Center of India
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '10px' }}
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
                  <div className="flex items-center justify-between border-b border-[#E1E7EF] pb-1">
                    <span className="font-mono font-bold text-[#3563E9]">{c.case_id}</span>
                    <RiskBadge category={c.risk_category} score={c.risk_score} size="sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#172033] text-xs">{c.project_name}</h5>
                    <p className="text-[11px] text-[#687386]">{c.district}, {c.state}</p>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <div><span className="text-[#687386]">Stage: </span><span className="font-semibold text-[#172033]">{c.current_stage}</span></div>
                    <div><span className="text-[#687386]">Land Handover: </span><span className="font-semibold text-[#172033]">{c.land_acquired_hectares} / {c.land_required_hectares} ha</span></div>
                    {c.delay_days > 0 && (
                      <div className="text-[#DC3545] font-semibold">+{c.delay_days} days overdue</div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-[#E1E7EF] flex justify-end">
                    <button
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="px-2.5 py-1 bg-[#3563E9] hover:bg-[#2B52C6] text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
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
        <div className="bg-white dark:bg-[#121E31] border border-[#E1E7EF] dark:border-[#1F2E45] absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-[1000] p-3 sm:p-3.5 rounded-lg text-xs space-y-1.5 shadow-md max-w-[calc(100%-1.5rem)]">
          <div className="font-bold text-[#172033] dark:text-[#F1F5F9] text-[11px] uppercase tracking-wider mb-1">
            Delay Risk Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#DC3545] border border-white shadow-xs shrink-0" />
            <span className="text-[#172033] dark:text-[#94A3B8] font-medium text-[11px]">High Risk (Score &gt;= 70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#E9A23B] border border-white shadow-xs shrink-0" />
            <span className="text-[#172033] dark:text-[#94A3B8] font-medium text-[11px]">Medium Risk (Score 40-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#19966B] border border-white shadow-xs shrink-0" />
            <span className="text-[#172033] dark:text-[#94A3B8] font-medium text-[11px]">Low Risk (Score &lt; 40)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

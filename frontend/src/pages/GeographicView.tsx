import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { MapPin, AlertCircle, ExternalLink, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { MapResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useTheme } from '../context/ThemeContext';

interface MapClusterItem {
  key: string;
  center: [number, number];
  centerPx?: { x: number; y: number };
  cases: any[];
  maxRisk: string;
  counts: { high: number; medium: number; low: number };
  avgScore: number;
  dominantDistrict: string;
  dominantProject: string;
}

// Map Controller for Zoom Tracking and Programmatic Camera Actions
const MapController: React.FC<{
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
}> = ({ currentZoom: _currentZoom, onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });

  return null;
};

// Zoom Action Buttons Helper inside Map Context
const ZoomActionHelper: React.FC<{
  targetBounds?: [[number, number], [number, number]] | null;
  targetCenter?: [number, number] | null;
  targetZoom?: number | null;
  onActionComplete?: () => void;
}> = ({ targetBounds, targetCenter, targetZoom, onActionComplete }) => {
  const map = useMap();

  useEffect(() => {
    if (targetBounds) {
      map.flyToBounds(targetBounds, { padding: [40, 40], maxZoom: 14, duration: 0.8 });
      onActionComplete?.();
    } else if (targetCenter && targetZoom) {
      map.flyTo(targetCenter, targetZoom, { duration: 0.8 });
      onActionComplete?.();
    }
  }, [map, targetBounds, targetCenter, targetZoom, onActionComplete]);

  return null;
};

export const GeographicView: React.FC = () => {
  const navigate = useNavigate();
  const { theme: _theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapResponse>({
    total_cases: 0,
    mapped_count: 0,
    unmapped_count: 0,
    cases: []
  });

  const [riskFilter, setRiskFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [clusterMode, setClusterMode] = useState<boolean>(true);
  const [currentZoom, setCurrentZoom] = useState<number>(5);

  // Programmatic camera target state
  const [cameraAction, setCameraAction] = useState<{
    bounds?: [[number, number], [number, number]] | null;
    center?: [number, number] | null;
    zoom?: number | null;
  }>({});

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

  // Zoom-dependent spatial clustering with non-overlapping pixel radius guarantee
  const clusters = useMemo((): MapClusterItem[] => {
    // Guard against empty datasets, null values, or invalid coordinates
    const validCases = (mapData?.cases || []).filter(c =>
      c &&
      typeof c.latitude === 'number' &&
      typeof c.longitude === 'number' &&
      !isNaN(c.latitude) &&
      !isNaN(c.longitude) &&
      c.latitude >= -85.0511 &&
      c.latitude <= 85.0511 &&
      c.longitude >= -180 &&
      c.longitude <= 180
    );

    if (validCases.length === 0) {
      return [];
    }

    if (!clusterMode) {
      // In "All Parcels" mode: 1-to-1 mapping for individual parcel selection
      return validCases.map(c => ({
        key: `single_${c.case_id}`,
        center: [c.latitude, c.longitude] as [number, number],
        cases: [c],
        maxRisk: c.risk_category,
        counts: {
          high: c.risk_category === 'HIGH' ? 1 : 0,
          medium: c.risk_category === 'MEDIUM' ? 1 : 0,
          low: c.risk_category === 'LOW' ? 1 : 0
        },
        avgScore: c.risk_score,
        dominantDistrict: c.district,
        dominantProject: c.project_name
      }));
    }

    // Dynamic pixel distance based on zoom level
    // Ensures markers never overlap each other on any display viewport
    const minPixelDist = Math.max(48, Math.min(68, 80 - currentZoom * 3));
    const tileSize = 256 * Math.pow(2, currentZoom);

    // Project geographic lat/lng into Mercator pixel space
    const projectedPoints = validCases.map(c => {
      const sinY = Math.sin(c.latitude * Math.PI / 180);
      const y = Math.log((1 + sinY) / (1 - sinY));
      const px = (c.longitude + 180) / 360 * tileSize;
      const py = (1 - y / Math.PI) / 2 * tileSize;
      return { c, px, py };
    });

    const groups: Array<{
      centerPx: { x: number; y: number };
      center: [number, number];
      cases: any[];
    }> = [];

    // Spatial clustering using greedy distance separation
    projectedPoints.forEach(p => {
      let bestGroup: typeof groups[0] | null = null;
      let minDist = Infinity;

      for (const g of groups) {
        const d = Math.hypot(g.centerPx.x - p.px, g.centerPx.y - p.py);
        if (d < minPixelDist && d < minDist) {
          minDist = d;
          bestGroup = g;
        }
      }

      if (bestGroup) {
        bestGroup.cases.push(p.c);
      } else {
        groups.push({
          centerPx: { x: p.px, y: p.py },
          center: [p.c.latitude, p.c.longitude],
          cases: [p.c]
        });
      }
    });

    // Compute cluster metrics, risk breakdowns, and labels
    return groups.map((g, idx) => {
      const high = g.cases.filter(x => x.risk_category === 'HIGH').length;
      const med = g.cases.filter(x => x.risk_category === 'MEDIUM').length;
      const low = g.cases.filter(x => x.risk_category === 'LOW').length;
      const total = g.cases.length;
      const avgScore = Math.round(g.cases.reduce((sum, item) => sum + item.risk_score, 0) / total);

      // Dominant cluster color: HIGH if >= 40% high risk or high >= 3; else MEDIUM if >= 40% med; else LOW
      let dominantRisk = 'LOW';
      if (high > 0 && (high / total >= 0.35 || high >= 3)) {
        dominantRisk = 'HIGH';
      } else if (med > 0 && (med / total >= 0.35 || med >= 2)) {
        dominantRisk = 'MEDIUM';
      } else if (high > 0) {
        dominantRisk = 'HIGH';
      }

      return {
        key: `cluster_${currentZoom}_${idx}_${g.center[0].toFixed(2)}_${g.center[1].toFixed(2)}`,
        center: g.center,
        centerPx: g.centerPx,
        cases: g.cases,
        maxRisk: dominantRisk,
        counts: { high, medium: med, low },
        avgScore,
        dominantDistrict: g.cases[0].district,
        dominantProject: g.cases[0].project_name
      };
    });
  }, [mapData.cases, clusterMode, currentZoom]);

  // Zoom into cluster bounds or center on click
  const handleClusterZoom = useCallback((cluster: MapClusterItem) => {
    if (cluster.cases.length === 1) {
      setSelectedCase(cluster.cases[0]);
      return;
    }

    if (cluster.cases.length > 1) {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      cluster.cases.forEach(c => {
        if (c.latitude < minLat) minLat = c.latitude;
        if (c.latitude > maxLat) maxLat = c.latitude;
        if (c.longitude < minLng) minLng = c.longitude;
        if (c.longitude > maxLng) maxLng = c.longitude;
      });

      // If points are distinct, zoom to bounds
      if (maxLat - minLat > 0.05 || maxLng - minLng > 0.05) {
        setCameraAction({
          bounds: [[minLat, minLng], [maxLat, maxLng]]
        });
      } else {
        // Points are very close, step in by +2 zoom levels
        setCameraAction({
          center: cluster.center,
          zoom: Math.min(14, currentZoom + 2)
        });
      }
    }
  }, [currentZoom]);

  const resetMapView = () => {
    setCameraAction({
      center: [22.5937, 78.9629],
      zoom: 5
    });
    setSelectedCase(null);
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

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Clustering Toggle */}
          <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1E293B] p-0.5 rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] text-xs">
            <button
              onClick={() => setClusterMode(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                clusterMode
                  ? 'bg-white dark:bg-[#0E1726] text-[#3563E9] shadow-xs font-semibold'
                  : 'text-[#687386] dark:text-[#94A3B8] hover:text-[#172033]'
              }`}
            >
              Clustered ({clusters.length} {currentZoom >= 10 ? 'Detailed' : 'Regional'})
            </button>
            <button
              onClick={() => setClusterMode(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                !clusterMode
                  ? 'bg-white dark:bg-[#0E1726] text-[#3563E9] shadow-xs font-semibold'
                  : 'text-[#687386] dark:text-[#94A3B8] hover:text-[#172033]'
              }`}
            >
              All Parcels ({mapData.mapped_count})
            </button>
          </div>

          <input
            type="text"
            placeholder="Filter corridor / project..."
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="glass-input text-xs px-3 py-1.5 w-36 sm:w-44"
          />

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="glass-input text-xs px-2.5 py-1.5"
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

          <button
            onClick={resetMapView}
            title="Reset Map Camera"
            className="p-1.5 rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] bg-white dark:bg-[#121E31] text-[#687386] hover:text-[#3563E9] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
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
      <div className="glass-panel p-2 overflow-hidden h-[460px] sm:h-[620px] relative">
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

          <MapController
            currentZoom={currentZoom}
            onZoomChange={(z) => setCurrentZoom(z)}
          />

          <ZoomActionHelper
            targetBounds={cameraAction.bounds}
            targetCenter={cameraAction.center}
            targetZoom={cameraAction.zoom}
            onActionComplete={() => setCameraAction({})}
          />

          {clusters.map((cluster) => {
            const isSingle = cluster.cases.length === 1;
            const singleCase = cluster.cases[0];
            const isSelected = selectedCase && cluster.cases.some(c => c.case_id === selectedCase.case_id);
            const radius = isSingle
              ? (isSelected ? 11 : 7.5)
              : Math.min(22, 11 + Math.min(cluster.cases.length, 12));

            return (
              <CircleMarker
                key={cluster.key}
                center={cluster.center}
                radius={radius}
                eventHandlers={{
                  click: () => {
                    if (isSingle) {
                      setSelectedCase(singleCase);
                    }
                  }
                }}
                pathOptions={{
                  fillColor: getMarkerColor(cluster.maxRisk),
                  fillOpacity: isSelected ? 0.98 : 0.88,
                  color: isSelected ? '#3563E9' : '#FFFFFF',
                  weight: isSelected ? 3.5 : (isSingle ? 2 : 2.5),
                }}
              >
                <Popup>
                  {isSingle ? (
                    <div className="p-1 space-y-2 text-xs min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-[#E1E7EF] pb-1">
                        <span className="font-mono font-bold text-[#3563E9]">{singleCase.case_id}</span>
                        <RiskBadge category={singleCase.risk_category} score={singleCase.risk_score} size="sm" />
                      </div>
                      <div>
                        <h5 className="font-bold text-[#172033] text-xs">{singleCase.project_name}</h5>
                        <p className="text-[11px] text-[#687386]">{singleCase.district}, {singleCase.state}</p>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div><span className="text-[#687386]">Stage: </span><span className="font-semibold text-[#172033]">{singleCase.current_stage}</span></div>
                        <div><span className="text-[#687386]">Land Handover: </span><span className="font-semibold text-[#172033]">{singleCase.land_acquired_hectares} / {singleCase.land_required_hectares} ha</span></div>
                        {singleCase.delay_days > 0 && (
                          <div className="text-[#DC3545] font-semibold">+{singleCase.delay_days} days overdue</div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-[#E1E7EF] flex justify-between items-center gap-2">
                        <button
                          onClick={() => setSelectedCase(singleCase)}
                          className="text-[11px] text-[#3563E9] hover:underline font-semibold cursor-pointer"
                        >
                          Select Marker
                        </button>
                        <button
                          onClick={() => navigate(`/cases/${singleCase.case_id}`)}
                          className="px-2.5 py-1 bg-[#3563E9] hover:bg-[#2B52C6] text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <span>View Dossier</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-1 space-y-2 text-xs min-w-[250px] max-w-[290px]">
                      {/* Cluster Header with Count Badge */}
                      <div className="flex items-center justify-between border-b border-[#E1E7EF] pb-1.5">
                        <div>
                          <span className="font-bold text-[#172033] block">
                            📍 {cluster.dominantDistrict} Region
                          </span>
                          <span className="text-[10px] text-[#687386]">
                            Avg Delay Risk: <strong className="text-[#172033]">{cluster.avgScore}/100</strong>
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#3563E9] text-white font-mono text-[11px] font-bold shadow-xs">
                          {cluster.cases.length} Parcels
                        </span>
                      </div>

                      {/* Cluster Risk Composition */}
                      <div className="flex items-center gap-2 text-[10px] bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-md border border-[#E1E7EF]">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#DC3545]" />
                          <strong>{cluster.counts.high}</strong> High
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#E9A23B]" />
                          <strong>{cluster.counts.medium}</strong> Med
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#19966B]" />
                          <strong>{cluster.counts.low}</strong> Low
                        </span>
                      </div>

                      {/* Action: Zoom into Cluster */}
                      <button
                        onClick={() => handleClusterZoom(cluster)}
                        className="w-full py-1.5 px-2 bg-[#3563E9]/10 hover:bg-[#3563E9]/20 text-[#3563E9] rounded-md font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                        <span>Zoom into {cluster.cases.length} Parcels</span>
                      </button>

                      {/* Contained Cases List */}
                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
                        {cluster.cases.map(c => (
                          <div key={c.case_id} className="pt-1.5 first:pt-0 pb-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-[11px] text-[#3563E9]">{c.case_id}</span>
                              <RiskBadge category={c.risk_category} score={c.risk_score} size="sm" />
                            </div>
                            <div className="text-[10px] text-[#687386] mt-0.5 flex items-center justify-between gap-1">
                              <span className="truncate max-w-[130px]" title={c.project_name}>{c.project_name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setSelectedCase(c)}
                                  className="text-[10px] text-[#687386] hover:text-[#3563E9] font-medium cursor-pointer"
                                >
                                  Select
                                </button>
                                <button
                                  onClick={() => navigate(`/cases/${c.case_id}`)}
                                  className="text-[#3563E9] font-bold hover:underline text-[10px] cursor-pointer"
                                >
                                  Dossier →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Selected Marker Detail Card (Overlay in Top-Left) */}
        {selectedCase && (
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-[1000] bg-white dark:bg-[#121E31] border border-[#3563E9]/30 rounded-xl p-3 sm:p-4 shadow-lg max-w-[280px] sm:max-w-xs animate-fadeIn">
            <div className="flex items-start justify-between gap-2 border-b border-[#E1E7EF] dark:border-[#1F2E45] pb-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#687386] dark:text-[#94A3B8] font-bold block">Selected Parcel</span>
                <span className="font-mono font-bold text-sm text-[#3563E9]">{selectedCase.case_id}</span>
              </div>
              <RiskBadge category={selectedCase.risk_category} score={selectedCase.risk_score} size="sm" />
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <h5 className="font-bold text-[#172033] dark:text-[#F1F5F9] truncate">{selectedCase.project_name}</h5>
              <p className="text-[11px] text-[#687386] dark:text-[#94A3B8]">{selectedCase.district}, {selectedCase.state}</p>
              <div className="text-[11px] text-[#172033] dark:text-[#F1F5F9]">
                Stage: <span className="font-semibold">{selectedCase.current_stage}</span>
              </div>
              {selectedCase.delay_days > 0 && (
                <div className="text-[11px] text-[#DC3545] font-semibold">
                  +{selectedCase.delay_days} days overdue
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#E1E7EF] dark:border-[#1F2E45]">
              <button
                onClick={() => setSelectedCase(null)}
                className="text-[11px] text-[#687386] hover:text-[#172033] dark:hover:text-white cursor-pointer"
              >
                Clear Selection
              </button>
              <button
                onClick={() => navigate(`/cases/${selectedCase.case_id}`)}
                className="px-2.5 py-1 bg-[#3563E9] hover:bg-[#2B52C6] text-white rounded-md text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>Dossier</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Map Legend (Bottom-Right, non-blocking on mobile) */}
        <div className="bg-white/95 dark:bg-[#121E31]/95 backdrop-blur-xs border border-[#E1E7EF] dark:border-[#1F2E45] absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-[900] p-2 sm:p-3 rounded-lg text-xs space-y-1 shadow-md max-w-[170px] sm:max-w-[210px] text-[10px] sm:text-[11px]">
          <div className="font-bold text-[#172033] dark:text-[#F1F5F9] uppercase tracking-wider mb-0.5">
            Delay Risk Legend
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DC3545] border border-white shadow-xs shrink-0" />
            <span className="text-[#172033] dark:text-[#94A3B8] font-medium">High Risk (Score &ge; 70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E9A23B] border border-white shadow-xs shrink-0" />
            <span className="text-[#172033] dark:text-[#94A3B8] font-medium">Medium Risk (40-69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#19966B] border border-white shadow-xs shrink-0" />
            <span className="text-[#172033] dark:text-[#94A3B8] font-medium">Low Risk (&lt; 40)</span>
          </div>
          <div className="pt-0.5 border-t border-[#E1E7EF] dark:border-[#1F2E45] text-[9px] text-[#687386] dark:text-[#94A3B8]">
            Zoom: {currentZoom}x &bull; {clusterMode ? `${clusters.length} clusters` : '250 parcels'}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Flame,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Layers,
  Info,
  Navigation,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { trafficApi } from '../api/trafficApi';
import { useFilters } from '../context/FilterContext';
import { LoadingState, ErrorState, CoordinateDisclaimer } from '../components/common/FeedbackStates';

// Helper component to center map when selecting a hotspot from the list
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

// Create custom colored div icon based on Hotspot Level
const createCustomIcon = (level, rank) => {
  const bgColors = {
    High: '#E97A72',
    Medium: '#E9A23B',
    Low: '#087F5B'
  };
  const color = bgColors[level] || '#087F5B';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(20,35,28,0.25);
        border: 2.5px solid white;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${rank}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export const HotspotsPage = () => {
  const { activeDataset, datasetVersion } = useFilters();
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [classificationRule, setClassificationRule] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'grid'

  const fetchHotspots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trafficApi.getHotspots();
      if (res.success && res.data) {
        setHotspots(res.data);
        if (res.meta) {
          setDisclaimer(res.meta.disclaimer);
          setClassificationRule(res.meta.classification_rule);
        }
        if (res.data.length > 0) {
          setSelectedHotspot(res.data[0]);
        } else {
          setSelectedHotspot(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load traffic hotspot coordinates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, [datasetVersion]);

  const cityName = activeDataset?.cities?.[0] || 'Metropolitan';

  if (loading) return <LoadingState message={`Mapping ${cityName} Traffic Hotspots...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchHotspots} />;

  const defaultCenter = hotspots.length > 0 && hotspots[0].lat && hotspots[0].lng
    ? [hotspots[0].lat, hotspots[0].lng]
    : [19.0760, 72.8777];
  const mapCenter = selectedHotspot ? [selectedHotspot.lat, selectedHotspot.lng] : defaultCenter;

  const levelBadge = (level) => {
    const badges = {
      High: 'bg-[#FDF0EF] text-[#D4564E] border-[#F9CBC7]',
      Medium: 'bg-[#FEF5E7] text-[#C47D1A] border-[#FCE1B6]',
      Low: 'bg-[#EBF7F2] text-[#087F5B] border-[#BDE8DC]'
    };
    return badges[level] || 'bg-[#F7F5EF] text-[#5B6F64] border-[#E8E4DA]';
  };

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] border border-[#BDE8DC] text-[#087F5B] text-xs font-semibold tracking-wide mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Spatio-Temporal Mapping</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#123B35] tracking-tight">
            Spatio-Temporal Hotspot Intelligence
          </h1>
          <p className="text-sm text-[#5B6F64] mt-1">
            Data-driven Hotspot classification derived via PySpark composite normalization (0.5×Vol + 0.3×Acc + 0.2×Viol).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E4DA] text-[#123B35] text-xs font-semibold rounded-xl hover:bg-[#F7F5EF] shadow-2xs transition-all focus:outline-none"
          >
            <Layers className="w-3.5 h-3.5 text-[#087F5B]" />
            <span>Switch to {viewMode === 'map' ? 'Grid View' : 'Map View'}</span>
          </button>
        </div>
      </div>

      {/* Coordinate Rule Disclaimer */}
      <CoordinateDisclaimer disclaimer={disclaimer} />

      {/* Main Content: Ranked List + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ranked Hotspots List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E8E4DA] rounded-2xl p-5 md:p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#EFECE6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#123B35]">Ranked Traffic Hotspots</h3>
                <p className="text-xs text-[#5B6F64]">Select an arterial corridor to zoom and inspect</p>
              </div>
              <span className="text-xs font-bold text-[#087F5B] bg-[#EBF7F2] px-2.5 py-1 rounded-full border border-[#BDE8DC]">
                {hotspots.length} Corridors
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {hotspots.map((item) => {
                const isSelected = selectedHotspot?.area === item.area;
                return (
                  <div
                    key={item.area}
                    onClick={() => setSelectedHotspot(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#087F5B] bg-[#EBF7F2]/60 shadow-xs ring-1 ring-[#087F5B]/30'
                        : 'border-[#E8E4DA] bg-white hover:border-[#DDD7C9] hover:bg-[#FDFCF9]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                          item.hotspot_level === 'High'
                            ? 'bg-[#E97A72]'
                            : item.hotspot_level === 'Medium'
                            ? 'bg-[#E9A23B]'
                            : 'bg-[#087F5B]'
                        }`}
                      >
                        {item.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#123B35]">{item.area}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${levelBadge(
                              item.hotspot_level
                            )}`}
                          >
                            {item.hotspot_level}
                          </span>
                        </div>
                        <p className="text-xs text-[#5B6F64] mt-0.5">
                          {item.total_volume?.toLocaleString()} vehicles • {item.avg_speed} km/h mean
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#123B35]">
                        Score: {item.composite_score}
                      </div>
                      <div className="text-[11px] text-[#8C9B93]">
                        {item.total_accidents} acc | {item.total_violations?.toLocaleString()} viol
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#EFECE6] text-xs text-[#5B6F64] space-y-1 bg-[#F7F5EF] p-3 rounded-xl border border-[#E8E4DA]">
            <p className="font-bold text-[#123B35]">Classification Algorithm:</p>
            <p className="leading-relaxed text-[#5B6F64]">
              Composite = 0.5 × Volume + 0.3 × Accidents + 0.2 × Violations (Min-Max Normalized). Top 34% High, Middle 33% Medium, Remainder Low.
            </p>
          </div>
        </div>

        {/* Right Column: Map or Heat Grid View (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E8E4DA] rounded-2xl p-5 md:p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#087F5B]" />
              <h3 className="text-base font-bold text-[#123B35]">
                {viewMode === 'map' ? 'OpenStreetMap Metropolitan Corridor View' : 'Corridor Matrix View'}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#5B6F64]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E97A72]"></span> High
              </span>
              <span className="flex items-center gap-1.5 text-[#5B6F64]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E9A23B]"></span> Medium
              </span>
              <span className="flex items-center gap-1.5 text-[#5B6F64]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#087F5B]"></span> Low
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[440px] relative rounded-xl overflow-hidden border border-[#E8E4DA]">
            {viewMode === 'map' ? (
              <MapContainer
                center={defaultCenter}
                zoom={11}
                scrollWheelZoom={false}
                style={{ height: '100%', minHeight: '440px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedHotspot && (
                  <MapController center={[selectedHotspot.lat, selectedHotspot.lng]} />
                )}
                {hotspots.map((h) => (
                  <Marker
                    key={h.area}
                    position={[h.lat, h.lng]}
                    icon={createCustomIcon(h.hotspot_level, h.rank)}
                    eventHandlers={{
                      click: () => setSelectedHotspot(h)
                    }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[210px] font-sans">
                        <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                          <h4 className="font-bold text-sm text-[#123B35]">{h.area}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBadge(
                              h.hotspot_level
                            )}`}
                          >
                            #{h.rank} ({h.hotspot_level})
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-[#5B6F64]">
                          <p>
                            <strong className="text-[#123B35]">Total Volume:</strong> {h.total_volume?.toLocaleString()}
                          </p>
                          <p>
                            <strong className="text-[#123B35]">Accidents:</strong> {h.total_accidents} (Rate: {h.accident_rate_per_k}/k)
                          </p>
                          <p>
                            <strong className="text-[#123B35]">Violations:</strong> {h.total_violations?.toLocaleString()} (Rate: {h.violation_rate_per_k}/k)
                          </p>
                          <p>
                            <strong className="text-[#123B35]">Avg Speed:</strong> {h.avg_speed} km/h
                          </p>
                          <p>
                            <strong className="text-[#123B35]">Dominant Level:</strong> {h.dominant_congestion}
                          </p>
                          <p>
                            <strong className="text-[#123B35]">Composite Index:</strong> {h.composite_score}
                          </p>
                        </div>
                        <p className="text-[10px] text-[#8C9B93] mt-2 italic border-t pt-1">
                          Approximate corridor centroid
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full bg-[#F7F5EF] overflow-y-auto">
                {hotspots.map((h) => (
                  <div
                    key={h.area}
                    className="bg-white p-5 rounded-2xl border border-[#E8E4DA] shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-[#123B35] text-white font-bold flex items-center justify-center text-xs">
                          #{h.rank}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-[#123B35]">{h.area}</h4>
                          <p className="text-[11px] text-[#5B6F64]">{h.locality}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${levelBadge(h.hotspot_level)}`}>
                        {h.hotspot_level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-[#EFECE6]">
                      <div>
                        <span className="text-[#8C9B93] block text-[10px] font-semibold">TOTAL FLOW</span>
                        <span className="font-bold text-[#123B35]">{h.total_volume?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[#8C9B93] block text-[10px] font-semibold">AVG SPEED</span>
                        <span className="font-bold text-[#123B35]">{h.avg_speed} km/h</span>
                      </div>
                      <div>
                        <span className="text-[#8C9B93] block text-[10px] font-semibold">ACCIDENTS</span>
                        <span className="font-bold text-[#E97A72]">{h.total_accidents}</span>
                      </div>
                      <div>
                        <span className="text-[#8C9B93] block text-[10px] font-semibold">VIOLATIONS</span>
                        <span className="font-bold text-[#5B8DEF]">{h.total_violations?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realistic Supporting Corridor Photography Banner */}
      <div className="bg-white border border-[#E8E4DA] rounded-2xl p-5 md:p-6 shadow-[0_2px_12px_-3px_rgba(20,35,28,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 rounded-xl overflow-hidden border border-[#E0DACE] shadow-sm">
            <img
              src="/assets/traffic_corridor.jpg"
              alt={`${cityName} Highway Corridor`}
              className="w-full h-36 object-cover"
            />
          </div>
          <div className="md:col-span-8 space-y-2">
            <span className="text-[11px] font-bold text-[#087F5B] uppercase tracking-wider block">
              Corridor Infrastructure & Surveillance
            </span>
            <h4 className="text-base font-bold text-[#123B35]">
              {hotspots[0]?.area ? `${hotspots[0].area} & Primary Arterial Transit Corridors` : `${cityName} Transit Corridors`}
            </h4>
            <p className="text-xs text-[#5B6F64] leading-relaxed">
              These primary corridors accommodate upwards of {hotspots[0]?.total_volume?.toLocaleString() || '400,000'} recorded vehicular movements. PySpark spatial normalization aggregates multi-source throughput, incident severity weights, and lane-level enforcement records to determine urban intervention priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

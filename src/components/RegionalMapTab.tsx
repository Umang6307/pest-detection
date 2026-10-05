import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RegionalTrend } from '../types/pest';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CloudRain,
  Wind,
  Layers,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Thermometer,
  Droplets,
  Activity,
} from 'lucide-react';

interface RegionalMapTabProps {
  trends: RegionalTrend[];
  onSelectRegion?: (trend: RegionalTrend) => void;
}

export const RegionalMapTab: React.FC<RegionalMapTabProps> = ({
  trends,
  onSelectRegion,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedPestFilter, setSelectedPestFilter] = useState<string>('All');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('All');
  const [activeTrend, setActiveTrend] = useState<RegionalTrend | null>(null);

  // Time-lapse simulation state
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);
  const [simulationWeek, setSimulationWeek] = useState<number>(4); // Week 1 to 4

  // Unique pest types for filtering
  const pestTypes = ['All', ...Array.from(new Set(trends.map((t) => t.pest_name.split(' (')[0])))];

  // Filtered trends
  const filteredTrends = trends.filter((trend) => {
    const matchesPest =
      selectedPestFilter === 'All' || trend.pest_name.includes(selectedPestFilter);
    const matchesRisk =
      selectedRiskFilter === 'All' || trend.risk_level === selectedRiskFilter;
    return matchesPest && matchesRisk;
  });

  // Calculate summary stats
  const criticalCount = trends.filter((t) => t.risk_level === 'Critical').length;
  const warningCount = trends.filter((t) => t.risk_level === 'Warning').length;
  const avgInfestation = (
    trends.reduce((acc, t) => acc + t.infestation_index, 0) / (trends.length || 1)
  ).toFixed(1);
  const totalOutbreaks = trends.reduce((acc, t) => acc + t.active_outbreak_count, 0);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center roughly over US Midwest agricultural belt
      const map = L.map(mapContainerRef.current, {
        center: [39.5, -98.35],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark agronomy tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Heat Circles when filteredTrends or simulationWeek changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    filteredTrends.forEach((trend) => {
      // Simulation week modifier
      const weekMultiplier = 0.85 + (simulationWeek * 0.05);
      const simulatedIndex = Math.min(100, Math.round(trend.infestation_index * weekMultiplier));

      const isCritical = trend.risk_level === 'Critical';
      const isWarning = trend.risk_level === 'Warning';
      const isModerate = trend.risk_level === 'Moderate';

      const color = isCritical
        ? '#ef4444'
        : isWarning
        ? '#f97316'
        : isModerate
        ? '#eab308'
        : '#10b981';

      // 1. Heat Radius Circle
      const radiusMeters = simulatedIndex * 2200;
      const circle = L.circle([trend.latitude, trend.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: isCritical ? 0.28 : 0.18,
        weight: 1.5,
        radius: radiusMeters,
      });
      circle.addTo(layerGroupRef.current!);

      // 2. Custom Marker Icon
      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid white;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0f172a;
            font-weight: 800;
            font-size: 11px;
            font-family: monospace;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            ${simulatedIndex}
          </div>
          ${
            isCritical
              ? `<span style="
                  position: absolute;
                  width: 44px;
                  height: 44px;
                  border-radius: 50%;
                  border: 2px solid #ef4444;
                  opacity: 0.75;
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pest-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([trend.latitude, trend.longitude], {
        icon: customIcon,
      });

      // Popup Content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-slate-900';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
          ${trend.region_name}
        </div>
        <div style="font-size: 11px; color: #059669; font-weight: 600; margin-bottom: 6px;">
          ${trend.pest_name}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
          Crop Affected: <strong>${trend.crop_type}</strong>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; margin-bottom: 8px;">
          <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
            <span style="color: #64748b;">Infestation Index:</span><br/>
            <strong style="color: ${color}; font-size: 13px;">${simulatedIndex}/100</strong>
          </div>
          <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
            <span style="color: #64748b;">Weekly Change:</span><br/>
            <strong style="color: ${trend.weekly_change_pct > 0 ? '#dc2626' : '#16a34a'}; font-size: 12px;">
              ${trend.weekly_change_pct > 0 ? '+' : ''}${trend.weekly_change_pct}%
            </strong>
          </div>
        </div>

        <div style="font-size: 10px; color: #334155; line-height: 1.4; border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <div>🌡️ Temp: <strong>${trend.temp_celsius}°C</strong> | 💧 Humidity: <strong>${trend.humidity_pct}%</strong></div>
          <div style="margin-top: 2px;">📍 Outbreaks: <strong>${trend.active_outbreak_count}</strong> | Vector: <strong>${trend.spread_vector}</strong></div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });
      marker.on('click', () => {
        setActiveTrend(trend);
        if (onSelectRegion) onSelectRegion(trend);
      });

      marker.addTo(layerGroupRef.current!);
    });
  }, [filteredTrends, simulationWeek]);

  // Handle Time-lapse play
  useEffect(() => {
    let interval: any;
    if (isPlayingSimulation) {
      interval = setInterval(() => {
        setSimulationWeek((prev) => (prev >= 4 ? 1 : prev + 1));
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isPlayingSimulation]);

  return (
    <div className="space-y-6">
      {/* Top Header & Analytics KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Critical Outbreaks
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1 flex items-baseline gap-1.5 font-mono">
            {criticalCount}
            <span className="text-xs text-slate-500 font-normal">regions</span>
          </div>
          <div className="text-[10px] text-red-400/80 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Immediate IPM response urged</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Warning Hotspots
          </div>
          <div className="text-2xl font-bold text-orange-400 mt-1 flex items-baseline gap-1.5 font-mono">
            {warningCount}
            <span className="text-xs text-slate-500 font-normal">regions</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Under high-density field scouting</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Mean Infestation Index
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5 font-mono">
            {avgInfestation}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+4.2% across agricultural zones</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Outbreak Nodes
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1 flex items-baseline gap-1.5 font-mono">
            {totalOutbreaks}
            <span className="text-xs text-slate-500 font-normal">nodes</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Tracked via telemetry & scouting</div>
        </div>
      </div>

      {/* Main Map Canvas & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Map Toolbar / Filters */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Pest:</span>
              <select
                value={selectedPestFilter}
                onChange={(e) => setSelectedPestFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {pestTypes.map((pest) => (
                  <option key={pest} value={pest}>
                    {pest}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-300">Risk Tier:</span>
              <select
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Risk Tiers</option>
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Moderate">Moderate</option>
                <option value="Safe">Safe</option>
              </select>
            </div>
          </div>

          {/* Time-lapse Controls */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Time-Lapse:
            </span>
            <button
              onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
              className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition"
              title={isPlayingSimulation ? 'Pause' : 'Play Timeline'}
            >
              {isPlayingSimulation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSimulationWeek(1)}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset Week"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-emerald-400 pl-1">
              Week {simulationWeek} of 4
            </span>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="relative w-full h-[520px]">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Infestation Risk Index
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-white/50"></span>
              <span className="text-slate-300">Critical (&gt; 75)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 border border-white/50"></span>
              <span className="text-slate-300">Warning (60 - 75)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white/50"></span>
              <span className="text-slate-300">Moderate (40 - 60)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white/50"></span>
              <span className="text-slate-300">Safe / Controlled (&lt; 40)</span>
            </div>
          </div>

          {/* Active Hotspot Inspector Card (if clicked) */}
          {activeTrend && (
            <div className="absolute top-4 right-4 z-20 w-80 bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl text-xs space-y-3 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{activeTrend.region_name}</h4>
                  <div className="text-emerald-400 font-medium">{activeTrend.pest_name}</div>
                  <div className="text-slate-400 text-[11px]">Primary Crop: {activeTrend.crop_type}</div>
                </div>
                <button
                  onClick={() => setActiveTrend(null)}
                  className="text-slate-400 hover:text-white text-base leading-none p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">Infestation Index</span>
                  <span className="text-base font-bold text-white font-mono">
                    {activeTrend.infestation_index}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Weekly Velocity</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      activeTrend.weekly_change_pct > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {activeTrend.weekly_change_pct > 0 ? '+' : ''}
                    {activeTrend.weekly_change_pct}%
                  </span>
                </div>
              </div>

              {/* Weather correlation */}
              <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-blue-400" />
                  Microclimate Incubation Index
                </div>
                <div className="flex justify-between text-slate-300 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-orange-400" />
                    Temp: {activeTrend.temp_celsius}°C
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    Humidity: {activeTrend.humidity_pct}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-teal-400 shrink-0" />
                  <span>Spread Vector: <strong className="text-slate-200">{activeTrend.spread_vector}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

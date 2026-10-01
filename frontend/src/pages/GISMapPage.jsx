import React, { useState } from 'react';
import { 
  Navigation, MapPin, Layers, Video, AlertTriangle, Car, Shield, 
  Eye, Compass, Info, ChevronDown, CheckCircle2, AlertOctagon, RotateCcw
} from 'lucide-react';
import MapComponent from '../components/MapComponent.jsx';

export default function GISMapPage({ 
  cameras = [], 
  events = [], 
  alerts = [], 
  selectedZone = 'ALL',
  onSelectZone,
  onNavigateTab,
  onSelectPlate,
  onSelectCamera 
}) {
  const [activeLayer, setActiveLayer] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const layers = [
    { id: 'ALL', label: 'All Layers', icon: Layers, desc: 'Composite Tactical View' },
    { id: 'CAMERAS', label: 'Surveillance Nodes', icon: Video, desc: `${cameras.length} CCTV Nodes` },
    { id: 'INCIDENTS', label: 'Active Incidents', icon: AlertTriangle, desc: `${alerts.filter(a => !a.resolved).length} Flagged` },
    { id: 'VEHICLES', label: 'Vehicle Sightings', icon: Car, desc: 'ANPR Sightings' },
    { id: 'ZONES', label: 'Zone Boundaries', icon: Shield, desc: '5 Geofenced Sectors' },
    { id: 'GAPS', label: 'Coverage Gaps', icon: AlertOctagon, desc: 'Transit Corridors' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              State-Wide GIS & Tactical Map Grid
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                GUJARAT POLICE GIS
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Geospatial tactical mapping of CCTV nodes, geofenced security zones, active alerts, and transit coverage gaps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => onSelectZone && onSelectZone(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            <option value="ALL">All Zones (Gujarat Grid)</option>
            <option value="ZONE_A">ZONE A - Ahmedabad</option>
            <option value="ZONE_B">ZONE B - Gandhinagar</option>
            <option value="ZONE_C">ZONE C - Surat</option>
            <option value="ZONE_D">ZONE D - Vadodara</option>
            <option value="ZONE_E">ZONE E - Rajkot</option>
          </select>
          
          {selectedZone !== 'ALL' && (
            <button
              onClick={() => onSelectZone && onSelectZone('ALL')}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Reset to All Zones"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Layer Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400 ring-2 ring-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{layer.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-cyan-700/60 text-cyan-100' : 'bg-slate-800 text-slate-400'}`}>
                {layer.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Full-Screen Map Container */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-2xl relative flex flex-col">
        <div className="flex-1 rounded-xl overflow-hidden min-h-[520px]">
          <MapComponent
            cameras={cameras}
            selectedZone={selectedZone}
            activeLayer={activeLayer}
            events={events}
            alerts={alerts}
            onSelectCamera={(cam) => {
              setSelectedEntity({ type: 'camera', data: cam });
            }}
            onSelectZone={onSelectZone}
            onSelectPlate={onSelectPlate}
          />
        </div>

        {/* Selected Entity Inspector Overlay */}
        {selectedEntity && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/95 border border-cyan-500/40 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{selectedEntity.data.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {selectedEntity.data.camera_id} • {selectedEntity.data.zone_id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedEntity.data.location || 'Gujarat Node'} • Health: {selectedEntity.data.health_score ?? 100}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onSelectCamera) onSelectCamera(selectedEntity.data);
                  if (onNavigateTab) onNavigateTab('cameras');
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Inspect Live Stream
              </button>
              <button
                onClick={() => setSelectedEntity(null)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Coverage & Zone Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveLayer('CAMERAS')}
          className="bg-slate-900/70 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 space-y-1 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase">Geographic Nodes</div>
          <div className="text-lg font-black text-white">{cameras.length} CCTV Feeds</div>
          <p className="text-[11px] text-slate-400">Click to filter surveillance nodes across all zones.</p>
        </div>

        <div 
          onClick={() => setActiveLayer('ZONES')}
          className="bg-slate-900/70 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 space-y-1 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase">Geofenced Zones</div>
          <div className="text-lg font-black text-cyan-400">5 Active Sectors</div>
          <p className="text-[11px] text-slate-400">Click to focus on zone polygons & security perimeters.</p>
        </div>

        <div 
          onClick={() => setActiveLayer('GAPS')}
          className="bg-slate-900/70 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 space-y-1 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase">Transit Coverage Gaps</div>
          <div className="text-lg font-black text-amber-400">Documented & Flagged</div>
          <p className="text-[11px] text-slate-400">Click to view unmonitored highway corridor corridors.</p>
        </div>
      </div>

      {/* 5. Collapsible Technical Details */}
      <div className="border border-slate-800/80 rounded-xl bg-slate-950/50 overflow-hidden">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between transition cursor-pointer"
        >
          <span className="flex items-center gap-2 font-mono">
            <span>⚙️</span> Geospatial Coordinates & Map Projection Details
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechDetails && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs font-mono space-y-2 text-slate-400 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">COORDINATE REFERENCE SYSTEM</span>
                <span className="text-cyan-300">WGS84 (EPSG:4326) / Spherical Mercator</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">POLYGON BOUNDARY GEOMETRY</span>
                <span className="text-cyan-300">GeoJSON Polygon MultiPoint / Ray-Casting Point-in-Polygon</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

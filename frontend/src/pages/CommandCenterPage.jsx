import React, { useState } from 'react';
import { 
  LayoutDashboard, Video, Car, Users, AlertTriangle, ShieldCheck, 
  Clock, MapPin, Eye, ArrowRight, Activity, Radio, ChevronDown, 
  CheckCircle2, Sparkles, Navigation, Layers, Bell, Shield
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import MapComponent from '../components/MapComponent.jsx';
import LiveEventFeed from '../components/LiveEventFeed.jsx';

export default function CommandCenterPage({
  cameras = [],
  events = [],
  alerts = [],
  selectedZone = 'ALL',
  onSelectZone,
  onNavigateTab,
  onSelectPlate,
  onSelectCamera
}) {
  const [showTechDetails, setShowTechDetails] = useState(false);

  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter(c => c.status !== 'OFFLINE' && (c.health_score ?? 100) > 40).length;
  const offlineCameras = totalCameras - onlineCameras;
  const vehicleCount = events.filter(e => e.vehicle_type !== 'person').length;
  const activeAlerts = alerts.filter(a => !a.resolved);
  const avgHealth = Math.round(
    cameras.reduce((acc, c) => acc + (c.health_score ?? 100), 0) / (cameras.length || 1)
  );

  const immediateAttentionAlerts = activeAlerts.slice(0, 3);
  const recentVehicles = events.filter(e => e.plate).slice(0, 4);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                Executive Command Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  REAL-TIME SOC GRID
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                State-wide situational overview across Gujarat CCTV surveillance nodes and automated AI security alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('gis')}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-900/30"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Full GIS Map</span>
          </button>
        </div>
      </div>

      {/* 2. Section A: System Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard
          title="Cameras Online"
          value={`${onlineCameras} / ${totalCameras}`}
          subtext={offlineCameras > 0 ? `${offlineCameras} nodes offline` : "All sector nodes active"}
          icon={Video}
          color="blue"
        />
        <StatCard
          title="Vehicles Observed"
          value={vehicleCount}
          subtext="ANPR & Multi-Camera Tracking"
          icon={Car}
          color="cyan"
        />
        <StatCard
          title="Active Incidents"
          value={activeAlerts.length}
          subtext={activeAlerts.length > 0 ? "Requires SOC Action" : "Zero active alerts"}
          icon={AlertTriangle}
          color="red"
          highlight={activeAlerts.length > 0}
        />
        <StatCard
          title="System Trust Score"
          value={`${avgHealth}%`}
          subtext="Anti-Tamper & Lens Health"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Monitored Zones"
          value="5 Sectors"
          subtext="Ahmedabad to Rajkot"
          icon={Layers}
          color="purple"
        />
      </div>

      {/* 3. Section B: Immediate Attention Alerts Banner (if any) */}
      {immediateAttentionAlerts.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-300 text-sm font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Immediate Attention Required ({activeAlerts.length} Active Items)</span>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-red-300 hover:text-white font-semibold flex items-center gap-1 transition"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {immediateAttentionAlerts.map((alert, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-red-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-red-300 uppercase truncate">
                    {alert.alert_type?.replace(/_/g, ' ') || 'Security Alert'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
                <div className="text-xs text-slate-200">
                  {alert.plate ? (
                    <div>Flagged vehicle <span className="font-mono font-bold text-amber-300">{alert.plate}</span> detected</div>
                  ) : (
                    <div>{alert.description || alert.message || 'Security anomaly detected by edge camera node.'}</div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>Node: <strong className="text-slate-200 font-mono">{alert.camera_id}</strong></span>
                  <div className="flex gap-2">
                    {alert.plate && (
                      <button
                        onClick={() => onSelectPlate(alert.plate)}
                        className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        Track Plate
                      </button>
                    )}
                    <button
                      onClick={() => onNavigateTab('alerts')}
                      className="text-red-400 hover:underline font-semibold cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Main Tactical Grid: Live Map + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Tactical Map (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Gujarat CCTV Surveillance Grid
                </h3>
                <p className="text-[11px] text-slate-400">Geographic nodes & restricted security zones</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  GOOGLE MAPS & TACTICAL
                </span>
              </div>
            </div>

            <MapComponent
              cameras={cameras}
              selectedZone={selectedZone}
              onSelectCamera={(cam) => {
                if (onSelectCamera) onSelectCamera(cam);
                else onNavigateTab('cameras');
              }}
              onSelectZone={onSelectZone}
            />
          </div>
        </div>

        {/* Right: Live Event Feed (5 cols) */}
        <div className="lg:col-span-5">
          <LiveEventFeed
            events={events}
            onSelectPlate={onSelectPlate}
          />
        </div>
      </div>

      {/* 5. Recent Vehicle Activity Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Car className="w-4 h-4 text-cyan-400" />
            <span>Recent Vehicle Intelligence & License Plate Sightings</span>
          </div>
          <button
            onClick={() => onNavigateTab('vehicles')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
          >
            <span>Open Vehicle Tracker</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentVehicles.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No recent vehicle license plates extracted yet. Ingesting live feeds...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentVehicles.map((v, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="plate-badge text-xs py-0.5 px-2">
                    <span className="plate-badge-ind text-[9px]">IND</span>
                    <span className="font-mono">{v.plate}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                    {v.vehicle_type || 'Vehicle'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  <MapPin className="w-3 h-3 inline text-rose-400 mr-1" />
                  {v.location || v.camera_id || 'Gujarat Node'}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span>{v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : 'Recent'}</span>
                  <button
                    onClick={() => onSelectPlate(v.plate)}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Track Route →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Technical Details Accordion */}
      <div className="border border-slate-800/80 rounded-xl bg-slate-950/50 overflow-hidden">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between transition cursor-pointer"
        >
          <span className="flex items-center gap-2 font-mono">
            <span>⚙️</span> Technical Details & Pipeline Telemetry
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechDetails && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs font-mono space-y-2 text-slate-400">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">INGESTION PROTOCOL</span>
                <span className="text-cyan-300">RTSP over TCP / ONVIF Profile S</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">INFERENCE ENGINE</span>
                <span className="text-cyan-300">YOLOv8 Real-Time TensorRT / ByteTrack Re-ID</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">EVIDENCE CRYPTOGRAPHY</span>
                <span className="text-cyan-300">SHA-256 Merkle Ledger (Immutable)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

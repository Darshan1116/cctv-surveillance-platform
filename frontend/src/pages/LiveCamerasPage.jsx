import React, { useState } from 'react';
import { 
  Video, Search, Filter, ShieldCheck, AlertTriangle, Eye, Flame, 
  RefreshCw, CheckCircle2, ChevronDown, Layers, MapPin, Activity,
  Maximize2, Lock, Radio
} from 'lucide-react';

export default function LiveCamerasPage({ 
  cameras = [], 
  onSelectCamera,
  onNavigateAlerts,
  onNavigateEvidence 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedTechId, setExpandedTechId] = useState(null);
  const [selectedModalCam, setSelectedModalCam] = useState(null);
  const [modalMode, setModalMode] = useState('optical');

  // Filter cameras
  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch = 
      cam.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.camera_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone = 
      selectedZone === 'ALL' || 
      cam.zone_id === selectedZone || 
      cam.zone_id === `ZONE_${selectedZone.replace('ZONE ', '')}`;

    const isOnline = cam.status !== 'OFFLINE' && (cam.health_score ?? 100) > 40;
    const matchesStatus = 
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ONLINE' && isOnline) ||
      (selectedStatus === 'OFFLINE' && !isOnline) ||
      (selectedStatus === 'DEGRADED' && (cam.health_score ?? 100) <= 75 && isOnline);

    return matchesSearch && matchesZone && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Live Camera Feeds & Video Wall
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                {cameras.length} NODES CONFIGURED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live optical and thermal video streams across all 5 Gujarat Police surveillance zones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>RTSP Low-Latency Edge Streams</span>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search camera by name, ID (e.g. cam1) or location..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 pl-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Zones (Gujarat Grid)</option>
            <option value="ZONE_A">ZONE A - Ahmedabad</option>
            <option value="ZONE_B">ZONE B - Gandhinagar</option>
            <option value="ZONE_C">ZONE C - Surat</option>
            <option value="ZONE_D">ZONE D - Vadodara</option>
            <option value="ZONE_E">ZONE E - Rajkot</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="ONLINE">🟢 Live / Online</option>
            <option value="DEGRADED">🟡 Degraded</option>
            <option value="OFFLINE">🔴 Offline</option>
          </select>
        </div>
      </div>

      {/* 3. Camera Cards Grid */}
      {filteredCameras.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <Video className="w-8 h-8 mx-auto text-slate-600" />
          <div className="text-sm font-semibold text-slate-400">No cameras matched the selected filter criteria.</div>
          <p className="text-xs text-slate-600">Try clearing the search query or selecting "All Zones".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCameras.map((cam) => {
            const isOnline = cam.status !== 'OFFLINE' && (cam.health_score ?? 100) > 40;
            const isTechOpen = expandedTechId === cam.camera_id;

            return (
              <div
                key={cam.camera_id}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                        {cam.camera_id}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {cam.zone_id || 'ZONE_A'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">{cam.name}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">{cam.location || 'Gujarat Sector'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                      <span>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Health: {cam.health_score ?? 100}%
                    </div>
                  </div>
                </div>

                {/* Live Video Preview Box */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
                  {isOnline ? (
                    <img
                      src={`/api/cameras/${cam.camera_id}/stream?mode=optical`}
                      alt={cam.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-center text-slate-600 p-4 space-y-1">
                      <AlertTriangle className="w-8 h-8 mx-auto text-red-400/80" />
                      <div className="text-xs font-bold text-slate-400">Stream Disconnected</div>
                      <div className="text-[10px] text-slate-600">Camera node not responding over RTSP</div>
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-cyan-300 font-mono text-[10px] border border-white/10">
                    OPTICAL 1080p • {cam.fps || 15} FPS
                  </div>

                  <button
                    onClick={() => {
                      setSelectedModalCam(cam);
                      setModalMode('optical');
                    }}
                    className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-cyan-600 text-white text-[11px] font-semibold flex items-center gap-1 transition opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Enlarge</span>
                  </button>
                </div>

                {/* Current Activity & Actions */}
                <div className="p-4 space-y-3 bg-slate-950/40">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-[11px] text-slate-500">Observed in View:</span>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span className="text-amber-400">People: ~2</span>
                      <span className="text-cyan-400">Vehicles: ~4</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedModalCam(cam);
                        setModalMode('optical');
                      }}
                      className="py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Feed</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedModalCam(cam);
                        setModalMode('thermal');
                      }}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>FLIR</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigateEvidence) onNavigateEvidence();
                      }}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Vault</span>
                    </button>
                  </div>

                  {/* Collapsible Technical Details */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setExpandedTechId(isTechOpen ? null : cam.camera_id)}
                      className="w-full text-left text-[11px] font-mono text-slate-500 hover:text-slate-400 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Technical Details</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isTechOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTechOpen && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-400 animate-fadeIn">
                        <div>Vendor: <span className="text-slate-200">{cam.vendor || 'Hikvision / Dahua ONVIF'}</span></div>
                        <div>Protocol: <span className="text-cyan-400">RTSP over TCP (Port 554)</span></div>
                        <div>Codec: <span className="text-slate-200">{cam.codec || 'H.264 Main Profile'}</span></div>
                        <div>Resolution: <span className="text-slate-200">{cam.resolution || '1920x1080 (FHD)'}</span></div>
                        <div>PTS Sync: <span className="text-emerald-400">Hardware Monotonic Clock</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Camera Inspection Modal */}
      {selectedModalCam && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  {selectedModalCam.camera_id} ({selectedModalCam.zone_id || 'ZONE_A'})
                </span>
                <h3 className="text-sm font-bold text-white">{selectedModalCam.name}</h3>
                <p className="text-xs text-slate-400">{selectedModalCam.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalMode(modalMode === 'thermal' ? 'optical' : 'thermal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    modalMode === 'thermal'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{modalMode === 'thermal' ? 'THERMAL FLIR' : 'OPTICAL IR'}</span>
                </button>
                <button
                  onClick={() => setSelectedModalCam(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                src={`/api/cameras/${selectedModalCam.camera_id}/stream?mode=${modalMode}`}
                alt={selectedModalCam.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-3 left-3 px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                modalMode === 'thermal'
                  ? 'bg-black/80 text-amber-300 border border-amber-500/40'
                  : 'bg-black/75 text-cyan-300 border border-white/10'
              }`}>
                {modalMode === 'thermal' ? 'RADIOMETRIC THERMAL FLIR' : 'OPTICAL NIGHT IR'} • 15 FPS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

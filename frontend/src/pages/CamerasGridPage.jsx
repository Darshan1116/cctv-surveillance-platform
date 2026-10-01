import React, { useState } from 'react';
import { Video, Camera, Maximize2, Activity, Play, ShieldAlert, RefreshCw, Eye, Flame, Sun } from 'lucide-react';

export default function CamerasGridPage({ cameras, onSelectCamera }) {
  const [streamModes, setStreamModes] = useState({
    cam1: 'optical',
    cam2: 'optical',
    cam3: 'thermal'
  });

  const toggleMode = (camId) => {
    setStreamModes((prev) => ({
      ...prev,
      [camId]: prev[camId] === 'thermal' ? 'optical' : 'thermal'
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Video className="w-3.5 h-3.5" />
            <span>Multi-Channel CCTV Grid</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Live Gujarat Camera Feeds & Visual Ingestion Wall
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual feeds with dual-spectrum support: Optical Night Vision IR and Radiometric Thermal FLIR Heatmaps for borderline vehicle inspection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>3 Active Streams</span>
          </span>
        </div>
      </div>

      {/* Grid of 3 Cameras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cameras.map((cam) => {
          const currentMode = streamModes[cam.camera_id] || 'optical';
          const isThermal = currentMode === 'thermal';

          return (
            <div key={cam.camera_id} className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl hover:border-cyan-500/40 transition-all">
              {/* Stream Header */}
              <div className="p-3.5 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono-code font-bold text-cyan-400 uppercase">
                    {cam.camera_id}
                  </span>
                  <span className="text-xs font-bold text-white ml-2">
                    {cam.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleMode(cam.camera_id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold transition flex items-center gap-1 cursor-pointer ${
                      isThermal
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                    title="Toggle Thermal FLIR spectrum"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{isThermal ? 'THERMAL FLIR' : 'OPTICAL IR'}</span>
                  </button>
                </div>
              </div>

              {/* Video Stream Container */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
                <img
                  src={`/api/cameras/${cam.camera_id}/stream?mode=${currentMode}`}
                  alt={cam.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=60";
                  }}
                />
                
                {/* Overlay Badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-md bg-black/75 backdrop-blur-sm border text-[10px] font-mono-code font-bold ${
                  isThermal ? 'border-amber-500/40 text-amber-300' : 'border-white/10 text-cyan-300'
                }`}>
                  {isThermal ? 'FLIR HEATMAP' : 'OPTICAL NIGHT'} ? {cam.fps || 15} FPS
                </div>

                {/* Watermark */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono-code text-slate-400">
                  GUJARAT POLICE SURVEILLANCE
                </div>
              </div>

              {/* Stream Footer Telemetry */}
              <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400 truncate max-w-[170px]">{cam.location}</span>
                <button
                  onClick={() => onSelectCamera(cam)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600/30 hover:text-cyan-300 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

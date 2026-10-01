import React from 'react';
import { Activity, ShieldCheck, AlertOctagon, EyeOff, PauseCircle, RefreshCw, Zap, Cpu, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function CameraHealthPage({ cameras, onRefresh, onSimulate }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>HEALTHY</span>
          </span>
        );
      case 'WARNING':
      case 'VIEW_CHANGED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{status === 'VIEW_CHANGED' ? 'VIEW SHIFTED' : status}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hero USP ? Hardware Tamper Detection</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Camera Trust & Physical Integrity Verification
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time algorithmic monitoring against physical tampering: Frozen Streams (cv2.absdiff), Covered/Blocked Lens (Laplacian Variance), and Turned-Away Orientations (Histogram Correlation).
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Camera Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cameras.map((cam) => {
          const isCritical = cam.status === 'FROZEN' || cam.status === 'BLOCKED' || cam.status === 'OFFLINE';
          const isWarning = cam.status === 'VIEW_CHANGED' || cam.status === 'WARNING';
          
          return (
            <div
              key={cam.camera_id}
              className={`bg-[#111827] rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xl ${
                isCritical
                  ? 'border-red-500/60 bg-red-950/20 shadow-red-950/20'
                  : isWarning
                  ? 'border-amber-500/60 bg-amber-950/20 shadow-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-code font-bold text-cyan-400 uppercase">
                        {cam.camera_id}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                        {cam.mode}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mt-1">{cam.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{cam.location}</p>
                  </div>
                  {getStatusBadge(cam.status)}
                </div>

                {/* Health Score Gauge */}
                <div className="py-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Health Integrity Score</span>
                    <span className={`font-bold font-mono-code text-sm ${
                      cam.health_score > 80 ? 'text-emerald-400' : cam.health_score > 40 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {cam.health_score ?? 100}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        cam.health_score > 80 ? 'bg-emerald-500' : cam.health_score > 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${cam.health_score ?? 100}%` }}
                    />
                  </div>
                </div>

                {/* Metric Telemetry */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Live Framerate</div>
                    <div className="font-mono-code font-bold text-white mt-0.5">{cam.fps || 15} FPS</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Protocol</div>
                    <div className="font-mono-code font-bold text-cyan-400 mt-0.5">RTSP/ONVIF</div>
                  </div>
                </div>

                {/* Real-time Algorithmic Checks */}
                <div className="mt-3.5 p-3 rounded-xl bg-[#090d16] border border-slate-800/80 text-xs">
                  <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Algorithmic Tamper Status</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px]">
                    <li className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span>Frozen Stream (absdiff):</span>
                      </span>
                      <span className={cam.status === 'FROZEN' ? 'text-red-400 font-bold' : 'text-emerald-400 font-medium'}>
                        {cam.status === 'FROZEN' ? 'FROZEN DETECTED' : 'Normal'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span>Covered Lens (Laplacian):</span>
                      </span>
                      <span className={cam.status === 'BLOCKED' ? 'text-red-400 font-bold' : 'text-emerald-400 font-medium'}>
                        {cam.status === 'BLOCKED' ? 'BLOCKED DETECTED' : 'Normal'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span>Orientation (Histogram):</span>
                      </span>
                      <span className={cam.status === 'VIEW_CHANGED' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-medium'}>
                        {cam.status === 'VIEW_CHANGED' ? 'SHIFT DETECTED' : 'Normal'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Quick Fault Simulation Action */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Inject Fault:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onSimulate('freeze', cam.camera_id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-[11px] font-medium border border-slate-800 transition cursor-pointer"
                  >
                    Freeze
                  </button>
                  <button
                    onClick={() => onSimulate('block', cam.camera_id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-[11px] font-medium border border-slate-800 transition cursor-pointer"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => onSimulate('reset', cam.camera_id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 text-[11px] font-medium border border-slate-800 transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

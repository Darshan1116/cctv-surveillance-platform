import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldAlert, Radio, EyeOff, PauseCircle, Zap, Cpu, CheckCircle, Flame, Navigation } from 'lucide-react';

export default function SimulationPanel({ onSimulate, onTriggerIot }) {
  const [selectedCam, setSelectedCam] = useState('cam1');
  const [actionMessage, setActionMessage] = useState(null);

  const handleAction = async (scenario, cam = selectedCam) => {
    try {
      const res = await onSimulate(scenario, cam);
      setActionMessage(res?.message || `Triggered ${scenario} simulation on ${cam}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIotBurst = async () => {
    try {
      const res = await onTriggerIot(selectedCam);
      setActionMessage(`IoT Sensor 01 Motion Triggered on ${selectedCam} - Frame captured & SHA-256 evidence logged!`);
      setTimeout(() => setActionMessage(null), 4500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
          <Cpu className="w-3.5 h-3.5" />
          <span>Interactive Hackathon Presentation Console</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Live Fault Injection & Incident Simulation Controller
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Use these one-click triggers during evaluation to demonstrate real-time Tamper Detection (Health), Watchlist Target Tracking (Alerts), Restricted Zone Breaches, and Cryptographic Evidence Hashing.
        </p>

        {/* Target Node Selector */}
        <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/85">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Target Camera Node:</span>
          {['cam1', 'cam2', 'cam3'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCam(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-bold uppercase transition cursor-pointer ${
                selectedCam === c
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/50'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {c === 'cam1' ? 'cam1 (Ahmedabad)' : c === 'cam2' ? 'cam2 (Gandhinagar)' : 'cam3 (Surat)'}
            </button>
          ))}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-500/80 text-cyan-200 text-xs font-semibold flex items-center gap-2.5 shadow-xl shadow-cyan-950/30 animate-pulse">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Simulation Trigger Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Camera Trust / Tamper Injections */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <PauseCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Camera Trust & Physical Tamper Attacks</h3>
              <p className="text-[11px] text-slate-400">Physical hardware & stream attack simulation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleAction('freeze')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/20 text-left transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-red-300">1. Simulate Frozen Video Stream</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Triggers cv2.absdiff static frame differential detector</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 text-[11px] font-bold shrink-0 border border-red-500/30">Inject</span>
            </button>

            <button
              onClick={() => handleAction('block')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/20 text-left transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-red-300">2. Simulate Blocked / Covered Lens</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Triggers low Laplacian variance & low brightness check</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 text-[11px] font-bold shrink-0 border border-red-500/30">Inject</span>
            </button>

            <button
              onClick={() => handleAction('view_change')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">3. Simulate View Shift / Turned-Away</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Triggers scene histogram correlation drift detector</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold shrink-0 border border-amber-500/30">Inject</span>
            </button>

            <button
              onClick={() => handleAction('reset')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-emerald-400">4. Recover / Restore to HEALTHY Status</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Clears all fault states and restores 100% health score</div>
              </div>
              <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* 2. Security Alerts & IoT Triggers */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Security Alerts & Sensor Ingestion</h3>
              <p className="text-[11px] text-slate-400">Watchlist hits, zone breaches & IoT triggers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleAction('watchlist')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">1. Trigger Watchlist Hit (GJ01AB1234)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Fires instant red alert banner and auto-hashes evidence</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold shrink-0 border border-amber-500/30">Trigger</span>
            </button>

            <button
              onClick={() => handleAction('restricted', 'cam2')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/20 text-left transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-red-300">2. Trigger Restricted Zone Breach</div>
                <div className="text-[11px] text-slate-400 mt-0.5">GPS point-in-polygon breach at Gandhinagar VIP Sector</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 text-[11px] font-bold shrink-0 border border-red-500/30">Trigger</span>
            </button>

            <button
              onClick={handleIotBurst}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-left transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-cyan-300">3. Trigger IoT Motion Burst Sensor</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Fires camera/trigger, takes frame burst, records SHA-256</div>
              </div>
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

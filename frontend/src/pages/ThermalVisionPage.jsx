import React, { useState, useEffect } from 'react';
import { Flame, ShieldAlert, Activity, Eye, Zap, Thermometer, Radio, RefreshCw, Cpu, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ThermalVisionPage({ cameras }) {
  const [selectedCam, setSelectedCam] = useState('cam1');
  const [thermalData, setThermalData] = useState(null);
  const [palette, setPalette] = useState('INFERNO');
  const [loading, setLoading] = useState(false);

  const fetchThermalData = async () => {
    try {
      const res = await fetch(`/api/cameras/${selectedCam}/thermal`);
      const data = await res.json();
      setThermalData(data);
    } catch (e) {
      console.error("Thermal fetch error:", e);
    }
  };

  useEffect(() => {
    fetchThermalData();
    const interval = setInterval(fetchThermalData, 1500);
    return () => clearInterval(interval);
  }, [selectedCam]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Borderline Thermal FLIR Surveillance</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Radiometric Heat Visual Mapping & Vehicle Configuration Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Converts nighttime low-light CCTV into calibrated thermal infrared emissive heat maps. Extracts vehicle thermal configuration (Engine Core, Exhaust Plume, Wheel Friction, Concealed Heat Anomalies) for border line security.
          </p>
        </div>

        {/* Camera Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(cameras && cameras.length > 0 ? cameras : [
            { camera_id: 'cam1', name: 'cam1 (Ahmedabad)' },
            { camera_id: 'cam2', name: 'cam2 (Gandhinagar)' },
            { camera_id: 'cam3', name: 'cam3 (Surat)' },
            { camera_id: 'cam4', name: 'cam4 (Vadodara)' },
            { camera_id: 'cam5', name: 'cam5 (Rajkot)' }
          ]).map((c) => {
            const camId = typeof c === 'string' ? c : c.camera_id;
            const camName = typeof c === 'string' ? c : `${c.camera_id} (${c.location || c.name})`;
            return (
              <button
                key={camId}
                onClick={() => setSelectedCam(camId)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-bold uppercase transition cursor-pointer ${
                  selectedCam === camId
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-extrabold shadow-lg shadow-amber-950/40 border border-amber-400'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {camName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Thermal Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Thermal Heatmap Stream */}
        <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-3.5 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-xs font-mono-code font-bold text-amber-400 uppercase">
                {selectedCam} ? RADIOMETRIC THERMAL STREAM
              </span>
            </div>
            <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              SPECTRUM: FLIR INFERNO
            </span>
          </div>

          {/* Thermal Video Container */}
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <img
              src={`/api/cameras/${selectedCam}/stream?mode=thermal`}
              alt={`Thermal Stream ${selectedCam}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=60";
              }}
            />

            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-amber-500/30 text-[10px] font-mono-code text-amber-300 font-bold flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" />
              <span>DYNAMIC CALIBRATED RANGE: 18?C ? 110?C</span>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-[11px]">Night Stream Mode:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono-code text-[11px] font-bold">
                FLIR False-Color Thermal
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-mono-code text-[11px]">
              <span>Resolution: 640x480</span>
              <span>?</span>
              <span>Emissivity: ? = 0.95</span>
            </div>
          </div>
        </div>

        {/* Right: Extracted Vehicle Heat Configuration & Borderline Metrics */}
        <div className="lg:col-span-4 space-y-4">
          {/* Heat Telemetry KPI */}
          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Scene Thermal Profile</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono-code">Live Sensors</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Peak Engine Temp</div>
                <div className="font-mono-code font-bold text-amber-400 text-base mt-0.5">
                  {thermalData?.max_scene_temp_c || 86.4}?C
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Ambient Background</div>
                <div className="font-mono-code font-bold text-cyan-400 text-base mt-0.5">
                  {thermalData?.min_scene_temp_c || 19.8}?C
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Heat Configuration Breakdown */}
          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Vehicle Heat Signatures ({thermalData?.thermal_targets?.length || 0})</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {(!thermalData?.thermal_targets || thermalData.thermal_targets.length === 0) ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Scanning for vehicle thermal footprints in sector...
                </div>
              ) : (
                thermalData.thermal_targets.map((target, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        {target.vehicle_type} #{target.track_id}
                      </span>
                      {target.heat_anomaly ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 animate-pulse">
                          HEAT ANOMALY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          NORMAL HEAT
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-mono-code pt-1">
                      <div>Engine Core: <strong className="text-amber-300">{target.engine_temp_c}?C</strong></div>
                      <div>Wheel Friction: <strong className="text-cyan-300">{target.wheel_temp_c}?C</strong></div>
                    </div>

                    <div className="text-[10px] text-slate-500 pt-0.5">
                      Configuration: <span className="text-slate-300 font-semibold">{target.thermal_config}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

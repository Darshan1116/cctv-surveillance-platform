import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, ArrowRight, ShieldCheck, Car, CheckCircle2, Navigation, AlertCircle, Compass, Gauge } from 'lucide-react';

export default function VehicleSearchPage({ initialPlate = '' }) {
  const [plateQuery, setPlateQuery] = useState(initialPlate || 'GJ01AB1234');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (initialPlate) {
      setPlateQuery(initialPlate);
      executeSearch(initialPlate);
    } else {
      executeSearch('GJ01AB1234');
    }
  }, [initialPlate]);

  const executeSearch = async (plateToSearch) => {
    const clean = (plateToSearch || plateQuery).trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    try {
      // First try the specialized plate-journey endpoint
      const res = await fetch(`/api/search/plate-journey/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.timeline) ? data.timeline : [];
        setResults({
          searched_plate: data.searched_plate || data.plate || clean,
          total_detections: data.total_detections ?? data.total_sightings ?? list.length,
          unique_cameras_count: data.unique_cameras_count ?? new Set(list.map(t => t.camera_id).filter(Boolean)).size,
          timeline: list
        });
      } else {
        // Fallback to general search endpoint
        const fallbackRes = await fetch(`/api/search?plate=${encodeURIComponent(clean)}`);
        const fallbackData = await fallbackRes.json();
        const list = Array.isArray(fallbackData) ? fallbackData : (fallbackData.timeline || []);
        setResults({
          searched_plate: clean,
          total_detections: list.length,
          unique_cameras_count: new Set(list.map(t => t.camera_id).filter(Boolean)).size,
          timeline: list
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults({
        searched_plate: clean,
        total_detections: 0,
        unique_cameras_count: 0,
        timeline: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeSearch(plateQuery);
  };

  const timelineList = results?.timeline || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Search Bar Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Navigation className="w-3.5 h-3.5" />
            <span>Cross-Camera Route Reconstruction</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Vehicle License Plate Intelligence & Route Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Query detected registration plates across all Gujarat CCTV nodes to visualize the chronological transit trail and cross-city movement.
          </p>

          <form onSubmit={handleFormSubmit} className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={plateQuery}
                onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
                placeholder="Enter Plate (e.g., GJ01AB1234)"
                className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-code text-sm font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              <Car className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Vehicle</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs text-slate-400">
            <span className="text-[11px] font-medium text-slate-500">Quick Test Targets:</span>
            {['GJ01AB1234', 'GJ05CD5678', 'GJ18EF9012', 'GJ27AA0007', 'GJ01XY9999'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPlateQuery(p);
                  executeSearch(p);
                }}
                className="plate-badge hover:scale-105 transition cursor-pointer"
              >
                <span className="plate-badge-ind">IND</span>
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Target Summary Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-4">
              <div className="plate-badge text-base py-1 px-3">
                <span className="plate-badge-ind text-xs">IND</span>
                <span className="text-base">{results.searched_plate || plateQuery}</span>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Target Identity</div>
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Registration Profile</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Sightings</div>
                <div className="text-xl font-bold font-mono-code text-white mt-0.5">{results.total_detections ?? timelineList.length}</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Nodes Crossed</div>
                <div className="text-xl font-bold font-mono-code text-cyan-400 mt-0.5">{results.unique_cameras_count ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Chronological Route Timeline */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Chronological Transit Journey across Gujarat Nodes</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono-code">Ascending Timestamp Trail</span>
            </div>

            {timelineList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm rounded-xl bg-slate-950/40 border border-slate-800/60">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No historical detections found matching plate "{results.searched_plate || plateQuery}".</p>
                <p className="text-xs text-slate-600 mt-1">Try one of the preset Gujarat plates above or allow cameras to capture more frames.</p>
              </div>
            ) : (
              <div className="relative pl-7 space-y-4 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-emerald-500">
                {timelineList.map((item, idx) => (
                  <div key={item.event_id || idx} className="relative group">
                    <span className="absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full bg-[#0f172a] border-2 border-cyan-400 group-hover:scale-125 transition"></span>
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono-code text-xs font-bold uppercase">
                            {item.camera_id}
                          </span>
                          <span className="font-bold text-sm text-slate-100">
                            {item.camera_name || item.camera_id}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium capitalize">
                            {item.vehicle_type || 'Car'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono-code flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>{item.location || 'Gujarat Node'}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          {item.speed_estimate > 0 && (
                            <span className="flex items-center gap-1 text-cyan-300 font-mono-code">
                              <Gauge className="w-3 h-3" />
                              {Math.round(item.speed_estimate)} km/h
                            </span>
                          )}
                          {item.direction && item.direction !== 'STATIONARY' && (
                            <span className="flex items-center gap-1 text-slate-300 font-mono-code">
                              <Compass className="w-3 h-3" />
                              {item.direction}
                            </span>
                          )}
                          <span className="text-emerald-400 font-semibold font-mono-code">
                            AI Conf: {Math.round((item.confidence || 0.93) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

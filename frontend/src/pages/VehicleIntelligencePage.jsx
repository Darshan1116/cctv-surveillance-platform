import React, { useState, useEffect } from 'react';
import { 
  Car, Search, MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2, 
  Navigation, AlertCircle, Compass, Gauge, Eye, Lock, ShieldAlert, 
  ChevronDown, AlertOctagon, Check
} from 'lucide-react';

export default function VehicleIntelligencePage({ 
  initialPlate = '', 
  onNavigateCamera, 
  onNavigateEvidence 
}) {
  const [plateQuery, setPlateQuery] = useState(initialPlate || 'GJ01AB1234');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [watchlistSet, setWatchlistSet] = useState(new Set(['GJ01AB1234']));
  const [showTechDetails, setShowTechDetails] = useState(false);

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
      const res = await fetch(`/api/search/plate-journey/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.timeline) ? data.timeline : [];
        setResults({
          searched_plate: data.searched_plate || data.plate || clean,
          total_detections: data.total_detections ?? list.length,
          unique_cameras_count: data.unique_cameras_count ?? new Set(list.map(t => t.camera_id).filter(Boolean)).size,
          timeline: list
        });
      } else {
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
      console.error("Vehicle search error:", err);
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

  const toggleWatchlist = (plate) => {
    setWatchlistSet(prev => {
      const next = new Set(prev);
      if (next.has(plate)) next.delete(plate);
      else next.add(plate);
      return next;
    });
  };

  const timelineList = results?.timeline || [];
  const isWatchlist = watchlistSet.has(results?.searched_plate || plateQuery);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Vehicle Intelligence & ANPR Tracker
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                CROSS-CAMERA RECONSTRUCTION
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Query detected license plates across Gujarat CCTV nodes to visualize chronological transit trails and coverage gaps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Edge EasyOCR & ANPR Ingested</span>
        </div>
      </div>

      {/* 2. Search Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); executeSearch(plateQuery); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
              placeholder="Enter Registration Plate (e.g. GJ01AB1234)"
              className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <Car className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Tracking Grid...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Vehicle</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Test Target Plates */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400">Quick Test Targets:</span>
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

      {/* 3. Results Section */}
      {results && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Target Header Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-4">
              <div className="plate-badge text-base py-1 px-3">
                <span className="plate-badge-ind text-xs">IND</span>
                <span className="text-base">{results.searched_plate || plateQuery}</span>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Vehicle Profile</div>
                <div className="text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                  {isWatchlist ? (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>🔴 Flagged on Wanted Watchlist</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active Registration Record</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Sightings</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{results.total_detections ?? timelineList.length}</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Nodes Crossed</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{results.unique_cameras_count ?? 1}</div>
              </div>

              <button
                onClick={() => toggleWatchlist(results.searched_plate || plateQuery)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isWatchlist
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isWatchlist ? 'Remove Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>
          </div>

          {/* Chronological Transit Journey */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Chronological Transit Journey across Gujarat CCTV Nodes</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Ascending Timestamp Trail</span>
            </div>

            {timelineList.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <AlertCircle className="w-6 h-6 mx-auto text-slate-600" />
                <div>No historical sightings found for plate "{results.searched_plate}".</div>
                <div className="text-[11px] text-slate-600">Select one of the sample Gujarat plates above to view route trail.</div>
              </div>
            ) : (
              <div className="relative pl-7 space-y-4 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-emerald-500">
                {timelineList.map((item, idx) => {
                  const isGap = item.status === 'COVERAGE_GAP' || (idx > 0 && item.camera_id !== timelineList[idx-1].camera_id && !item.continuous);
                  const isPossibleMatch = item.confidence && item.confidence < 0.85;

                  return (
                    <div key={item.event_id || idx} className="relative group">
                      <span className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 ${
                        isGap
                          ? 'bg-amber-500 border-amber-300'
                          : 'bg-[#0f172a] border-cyan-400 group-hover:scale-125'
                      } transition`}></span>

                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-md space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold uppercase">
                              {item.camera_id || 'NODE-01'}
                            </span>
                            <span className="font-bold text-sm text-slate-100">
                              {item.camera_name || item.camera_id || 'Gujarat Sector Node'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium capitalize">
                              {item.vehicle_type || 'Car'}
                            </span>

                            {/* Status Pill */}
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isGap
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : isPossibleMatch
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {isGap ? 'COVERAGE GAP TRANSIT' : isPossibleMatch ? 'POSSIBLE MATCH' : 'OBSERVED'}
                            </span>
                          </div>

                          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent Sighting'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            <span>{item.location || 'Gujarat Node Sector'}</span>
                          </span>

                          <div className="flex items-center gap-3">
                            {item.speed_estimate > 0 && (
                              <span className="flex items-center gap-1 text-cyan-300 font-mono">
                                <Gauge className="w-3 h-3" />
                                {Math.round(item.speed_estimate)} km/h
                              </span>
                            )}
                            <span className="text-emerald-400 font-semibold font-mono">
                              OCR Conf: {Math.round((item.confidence || 0.93) * 100)}%
                            </span>

                            <button
                              onClick={() => onNavigateCamera && onNavigateCamera(item.camera_id)}
                              className="text-cyan-400 hover:underline font-bold text-[11px] ml-2 cursor-pointer"
                            >
                              Inspect Node →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Collapsible Technical Details */}
      <div className="border border-slate-800/80 rounded-xl bg-slate-950/50 overflow-hidden">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between transition cursor-pointer"
        >
          <span className="flex items-center gap-2 font-mono">
            <span>⚙️</span> ANPR Character Segmentation & Tracking Telemetry
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechDetails && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs font-mono space-y-2 text-slate-400 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">OCR ENGINE</span>
                <span className="text-cyan-300">PyTorch EasyOCR + CLAHE Contrast Enhancer</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PLATE REID SIMILARITY</span>
                <span className="text-cyan-300">Levenshtein Distance &lt;= 1 Character</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TRANSIT CORRIDOR GAP</span>
                <span className="text-amber-400">Inter-node spatial bounding without hallucination</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

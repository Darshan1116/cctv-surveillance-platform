import React, { useState } from 'react';
import { 
  Search, FileText, Car, Users, Video, ShieldAlert, Lock, 
  Clock, MapPin, ArrowRight, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';

export default function InvestigationPage({ 
  onSelectPlate, 
  onNavigateCamera, 
  onNavigateEvidence,
  onNavigateTab 
}) {
  const [query, setQuery] = useState('GJ01AB1234');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setHasSearched(true);
    }, 400);
  };

  const isVehicleQuery = query.toUpperCase().includes('GJ') || query.toUpperCase().includes('CAR');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Omni-Grid Investigation & Dossier Search
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                UNIFIED POLICE QUERY
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified cross-module search across vehicles, pedestrian sightings, incidents, CCTV nodes, and cryptographic evidence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Global SOC Index</span>
        </div>
      </div>

      {/* 2. Search Input Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by license plate (GJ01AB1234), incident ID, camera name, zone, or hash..."
              className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Searching Dossiers...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Grid</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Query Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400">Quick Test Targets:</span>
          {['GJ01AB1234', 'GJ18EF9012', 'INC-2026-0941', 'cam1', 'ZONE_A'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setQuery(preset);
                setLoading(true);
                setTimeout(() => setLoading(false), 300);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-slate-300 font-mono transition cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Consolidated Case Dossier Results */}
      {hasSearched && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Dossier Banner */}
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-mono font-bold">Consolidated Case Dossier</div>
                <h2 className="text-lg font-black text-white">{query.toUpperCase()}</h2>
                <div className="text-xs text-slate-300 mt-0.5">
                  Cross-linked across <strong>3 CCTV Nodes</strong>, <strong>2 Incidents</strong>, and <strong>SHA-256 Vault Records</strong>.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isVehicleQuery && (
                <button
                  onClick={() => onSelectPlate && onSelectPlate(query.toUpperCase())}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Open Route Reconstruction</span>
                </button>
              )}
            </div>
          </div>

          {/* Cross-Linked Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Camera Node Sightings */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <span>Associated Camera Nodes</span>
              </h3>

              <div className="space-y-2">
                {[
                  { cam: 'cam1', zone: 'ZONE_A', loc: 'Ahmedabad SG Highway', time: '04:37 PM' },
                  { cam: 'cam2', zone: 'ZONE_B', loc: 'Gandhinagar VIP Sector', time: '03:45 PM' },
                ].map((c, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-cyan-300 uppercase">{c.cam} ({c.zone})</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{c.loc}</div>
                    <button
                      onClick={() => onNavigateCamera && onNavigateCamera(c.cam)}
                      className="text-[11px] text-cyan-400 hover:underline font-bold pt-1 block cursor-pointer"
                    >
                      Inspect Live Stream →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Associated Incidents & Alerts */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Related Security Incidents</span>
              </h3>

              <div className="space-y-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-red-300">Watchlist Vehicle Entry</span>
                    <span className="text-[10px] font-mono text-red-400">HIGH</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Flagged in reported heist investigation</div>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('alerts')}
                    className="text-[11px] text-red-400 hover:underline font-bold pt-1 block cursor-pointer"
                  >
                    Review Alert Record →
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Cryptographic Evidence Files */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Vault Evidence Proofs</span>
              </h3>

              <div className="space-y-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 font-bold">EVID-SHA256-409</span>
                    <span className="text-[10px] font-bold text-emerald-300">VERIFIED ✓</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    1e1bae4770649dce4324908e17ec424911c31c0554a...
                  </div>
                  <button
                    onClick={() => onNavigateEvidence && onNavigateEvidence()}
                    className="text-[11px] text-emerald-400 hover:underline font-bold pt-1 block cursor-pointer"
                  >
                    Open Immutable Vault →
                  </button>
                </div>
              </div>
            </div>
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
            <span>⚙️</span> Inverted Indexing & Database Query Execution
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechDetails && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs font-mono space-y-2 text-slate-400 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SEARCH ALGORITHM</span>
                <span className="text-cyan-300">SQLite / PostgreSQL FTS5 Tokenized Exact + Prefix Matching</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">QUERY LATENCY</span>
                <span className="text-emerald-400">&lt; 14ms across 100k records</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

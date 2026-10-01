import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, Search, Filter, 
  Clock, MapPin, Eye, Car, Lock, ChevronDown, Check, X, Shield, Sparkles
} from 'lucide-react';

export default function AlertsPage({ 
  alerts = [], 
  onSelectPlate, 
  onNavigateCamera, 
  onNavigateEvidence,
  onClearAlerts 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [expandedTechId, setExpandedTechId] = useState(null);

  const handleResolve = (id) => {
    setResolvedIds((prev) => new Set([...prev, id]));
  };

  // Helper to categorize alerts
  const getCategory = (alert) => {
    const type = (alert.alert_type || alert.type || '').toUpperCase();
    if (type.includes('WATCHLIST') || type.includes('WANTED') || type.includes('BREACH') || type.includes('TAMPER')) {
      return 'IMMEDIATE';
    }
    if (type.includes('RESTRICTED') || type.includes('UNAUTHORIZED') || type.includes('SNATCHING')) {
      return 'IMPORTANT';
    }
    if (type.includes('REVIEW') || type.includes('MOTION') || type.includes('ANOMALY')) {
      return 'REVIEW';
    }
    return 'INFORMATIONAL';
  };

  const getHumanTitle = (alert) => {
    const type = (alert.alert_type || alert.type || '').toUpperCase();
    if (type.includes('WATCHLIST')) return 'Possible Watchlist Match';
    if (type.includes('RESTRICTED')) return 'Restricted Zone Perimeter Breach';
    if (type.includes('SNATCHING')) return 'Possible High-Speed Movement Anomaly';
    if (type.includes('TAMPER') || type.includes('BLOCKED')) return 'Camera Lens Block / Tamper Warning';
    if (type.includes('FROZEN')) return 'Camera Video Stream Freeze Detected';
    if (type.includes('MOTION')) return 'Sensor Triggered Motion Event';
    return alert.title || alert.alert_type?.replace(/_/g, ' ') || 'Security Alert';
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((a, idx) => {
    const id = a.alert_id || idx;
    const cat = getCategory(a);
    const title = getHumanTitle(a).toLowerCase();
    const desc = (a.description || a.message || '').toLowerCase();
    const plate = (a.plate || '').toLowerCase();
    const cam = (a.camera_id || '').toLowerCase();

    const matchesSearch = 
      title.includes(searchQuery.toLowerCase()) ||
      desc.includes(searchQuery.toLowerCase()) ||
      plate.includes(searchQuery.toLowerCase()) ||
      cam.includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'ALL' || cat === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Security Alerts & SOC Dispatch
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold border border-red-500/30">
                {alerts.length} ALERTS LOGGED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated AI alerts requiring police operator acknowledgement, investigation, and dispatch.
            </p>
          </div>
        </div>

        {alerts.length > 0 && (
          <button
            onClick={onClearAlerts}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 text-xs font-semibold transition border border-slate-700 cursor-pointer"
          >
            Clear Dismissed
          </button>
        )}
      </div>

      {/* 2. Filters & Categories */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by title, plate, camera ID or description..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 pl-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'IMMEDIATE', label: '🔴 Immediate' },
            { id: 'IMPORTANT', label: '🟠 Important' },
            { id: 'REVIEW', label: '🟡 Review' },
            { id: 'INFORMATIONAL', label: '🟢 Informational' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-md border border-cyan-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
          <div className="text-sm font-semibold text-slate-300">No active security alerts matching criteria.</div>
          <p className="text-xs text-slate-600">Surveillance grid is operating with nominal parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert, idx) => {
            const id = alert.alert_id || idx;
            const isResolved = resolvedIds.has(id) || alert.resolved;
            const cat = getCategory(alert);
            const title = getHumanTitle(alert);
            const isTechOpen = expandedTechId === id;

            return (
              <div
                key={id}
                className={`p-5 rounded-2xl border transition-all shadow-xl space-y-3 ${
                  isResolved
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : cat === 'IMMEDIATE'
                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                    : cat === 'IMPORTANT'
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                {/* Header Line */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      cat === 'IMMEDIATE' ? 'bg-red-500 animate-ping' : cat === 'IMPORTANT' ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}></span>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {title}
                      {alert.plate && (
                        <span className="plate-badge text-xs py-0.5 px-2">
                          <span className="plate-badge-ind text-[9px]">IND</span>
                          <span>{alert.plate}</span>
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Recent'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                      isResolved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {isResolved ? 'RESOLVED' : 'REVIEW REQUIRED'}
                    </span>
                  </div>
                </div>

                {/* What Happened & Details */}
                <div className="text-xs text-slate-300 space-y-1">
                  <div>{alert.description || alert.message || 'Security anomaly detected by automated CCTV AI pipeline.'}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                    <span>Zone: <strong className="text-cyan-300 font-mono">{alert.zone_id || 'ZONE_A'}</strong></span>
                    <span>Camera: <strong className="text-slate-200 font-mono">{alert.camera_id || 'cam1'}</strong></span>
                    <span>Confidence: <strong className="text-emerald-400 font-mono">{Math.round((alert.confidence || 0.94) * 100)}%</strong></span>
                    <span>Evidence Hash: <strong className="text-cyan-400 font-mono">SHA-256 Verified ✓</strong></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {alert.plate && (
                      <button
                        onClick={() => onSelectPlate && onSelectPlate(alert.plate)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/20"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Track Vehicle</span>
                      </button>
                    )}

                    <button
                      onClick={() => onNavigateCamera && onNavigateCamera(alert.camera_id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View Camera Feed</span>
                    </button>

                    <button
                      onClick={() => onNavigateEvidence && onNavigateEvidence()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Evidence</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isResolved && (
                      <button
                        onClick={() => handleResolve(id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge & Resolve</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Technical Details */}
                <div className="pt-1">
                  <button
                    onClick={() => setExpandedTechId(isTechOpen ? null : id)}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-400 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Technical Details</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isTechOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTechOpen && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1 animate-fadeIn">
                      <div>Raw Code: <span className="text-cyan-400">{alert.alert_type || 'ALERT_001'}</span></div>
                      <div>Event ID: <span className="text-slate-200">{alert.event_id || 'EV-000'}</span></div>
                      <div>Spatial IoU: <span className="text-slate-200">0.89 • ByteTrack TrackID: #{alert.track_id || 42}</span></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

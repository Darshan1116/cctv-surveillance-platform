import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, Clock, MapPin, CheckCircle2, 
  Eye, Lock, Send, Download, ChevronDown, Check, UserCheck, Sparkles, Filter
} from 'lucide-react';

export default function IncidentsPage({ 
  cameras = [], 
  onNavigateCamera, 
  onNavigateEvidence 
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [expandedTechId, setExpandedTechId] = useState(null);

  const [incidents, setIncidents] = useState([
    {
      id: 'INC-2026-0941',
      title: 'Possible Sudden Interaction & Rapid Departure',
      incident_type: 'POSSIBLE_SNATCHING',
      severity: 'HIGH',
      status: 'REVIEW REQUIRED',
      zone_id: 'ZONE_A',
      camera_id: 'cam1',
      location: 'Ahmedabad SG Highway ISKCON Junction',
      timestamp: '2026-09-28T16:24:00Z',
      why_flagged: 'The AI temporal pipeline detected a sudden proximity interaction followed by high-velocity acceleration away from the sector.',
      timeline: [
        { time: '04:24:10 PM', event: 'Person enters camera field of view from north pathway' },
        { time: '04:24:18 PM', event: 'Person approaches another pedestrian within 0.8m proximity' },
        { time: '04:24:22 PM', event: 'Sudden high acceleration movement detected (>18 km/h)' },
        { time: '04:24:25 PM', event: 'Subject rapidly departs eastward toward side alley' },
        { time: '04:24:27 PM', event: 'Automated temporal incident dossier compiled & evidence locked' },
      ],
      evidence_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      confidence: 0.89
    },
    {
      id: 'INC-2026-0938',
      title: 'Restricted VIP Perimeter Zone Ingress',
      incident_type: 'RESTRICTED_BREACH',
      severity: 'CRITICAL',
      status: 'UNDER INVESTIGATION',
      zone_id: 'ZONE_B',
      camera_id: 'cam2',
      location: 'Gandhinagar Swarnim Sankul VIP Gate 3',
      timestamp: '2026-09-28T15:45:00Z',
      why_flagged: 'Unscheduled heavy vehicle crossed geofenced high-security barrier polygon during restricted hours.',
      timeline: [
        { time: '03:45:02 PM', event: 'Vehicle GJ18EF9012 entered perimeter bounding polygon' },
        { time: '03:45:08 PM', event: 'ANPR registered plate not on authorized daily VIP whitelist' },
        { time: '03:45:12 PM', event: 'Perimeter barrier alert broadcasted to Gandhinagar SOC' },
      ],
      evidence_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      confidence: 0.95
    },
    {
      id: 'INC-2026-0929',
      title: 'Camera Lens Block / Physical Tampering Detected',
      incident_type: 'CAMERA_TAMPER',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      zone_id: 'ZONE_C',
      camera_id: 'cam3',
      location: 'Surat Diamond Bourse South Corner',
      timestamp: '2026-09-28T14:10:00Z',
      why_flagged: 'Laplacian edge sharpness fell below threshold with uniform dark pixels, indicating physical obstruction.',
      timeline: [
        { time: '02:10:00 PM', event: 'Sharpness variance dropped from 420 to 12.4' },
        { time: '02:10:05 PM', event: 'Anti-tamper watchdog triggered degraded camera notification' },
        { time: '02:18:00 PM', event: 'Patrol officer cleared obstruction; lens clarity restored' },
      ],
      evidence_sha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      confidence: 0.98
    }
  ]);

  const handleUpdateStatus = (incId, newStatus) => {
    setIncidents(prev => prev.map(inc => inc.id === incId ? { ...inc, status: newStatus } : inc));
  };

  const filteredIncidents = incidents.filter(inc => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'ACTIVE') return inc.status !== 'RESOLVED';
    if (selectedFilter === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              SOC Incident Review & Case Management
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                POLICE REVIEW REQUIRED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review flagged behavioral sequences, temporal movements, and geofence breaches. (AI flags hypotheses; officers verify).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'RESOLVED'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedFilter === f
                  ? 'bg-cyan-600 text-white shadow-md border border-cyan-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f === 'ALL' ? 'All Incidents' : f === 'ACTIVE' ? 'Active Review' : 'Resolved'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Incidents List */}
      <div className="space-y-6">
        {filteredIncidents.map((inc) => {
          const isTechOpen = expandedTechId === inc.id;

          return (
            <div
              key={inc.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-4 transition"
            >
              {/* Header: Title, ID & Severity */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    inc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {inc.severity} SEVERITY
                  </span>
                  <h3 className="text-base font-bold text-white">{inc.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-cyan-400 font-bold">{inc.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    inc.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {inc.status}
                  </span>
                </div>
              </div>

              {/* Location & Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{inc.location}</span>
                </span>
                <span className="font-mono">Zone: <strong className="text-cyan-300">{inc.zone_id}</strong></span>
                <span className="font-mono">Node: <strong className="text-slate-200">{inc.camera_id}</strong></span>
                <span className="font-mono">Logged: {new Date(inc.timestamp).toLocaleTimeString()}</span>
                <span className="font-mono text-emerald-400">Certainty: {Math.round(inc.confidence * 100)}%</span>
              </div>

              {/* Why This Was Flagged */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Why This Incident Was Flagged:</span>
                </div>
                <p className="text-xs text-slate-300">{inc.why_flagged}</p>
                <div className="text-[11px] text-slate-500 italic pt-1">
                  Note: Automated classification reports observable velocity and proximity facts; human officer confirmation required.
                </div>
              </div>

              {/* Step-by-Step Chronological Timeline */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Chronological Detection Timeline:</span>
                </div>
                <div className="relative pl-6 space-y-2 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                  {inc.timeline.map((step, sIdx) => (
                    <div key={sIdx} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span className="font-mono font-bold text-cyan-300 mr-2">{step.time}</span>
                      <span className="text-slate-300">— {step.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Hash Badge */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-400 text-[11px] block">Cryptographic SHA-256 Vault Hash</span>
                    <span className="font-mono text-[10px] text-cyan-300 truncate max-w-sm block">
                      {inc.evidence_sha256}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  IMMUTABLE PROOF
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateCamera && onNavigateCamera(inc.camera_id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Camera ({inc.camera_id})</span>
                  </button>

                  <button
                    onClick={() => onNavigateEvidence && onNavigateEvidence()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Vault Evidence</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {inc.status !== 'RESOLVED' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'UNDER INVESTIGATION')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Patrol Team</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'RESOLVED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Case Closed & Archived</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Collapsible Technical Details */}
              <div>
                <button
                  onClick={() => setExpandedTechId(isTechOpen ? null : inc.id)}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-400 flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Technical Details</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isTechOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTechOpen && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1 animate-fadeIn">
                    <div>Action Recognition: <span className="text-cyan-400">Dense Optical Flow Temporal Sequence (16 frames)</span></div>
                    <div>Bounding Trajectory: <span className="text-slate-200">X: 120-480, Y: 220-360, Velocity Delta: 4.8x</span></div>
                    <div>Model Backbone: <span className="text-slate-200">PyTorch 2.14 C3D Feature Extractor</span></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

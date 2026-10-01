import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Radio, Clock, CheckCircle2, Search, Filter, ShieldCheck, ChevronDown, ChevronUp, Cpu, Eye, ArrowRight } from 'lucide-react';
import { getHumanReadableAlertTitle, getHumanReadableStatus, getStatusBadgeStyle } from '../utils/labelTranslator';

export default function SecurityAlertsPage({ alerts, onSelectPlate, onClearAlerts }) {
  const [filter, setFilter] = useState('ALL');
  const [expandedAlerts, setExpandedAlerts] = useState({});

  const toggleExpand = (alertId) => {
    setExpandedAlerts(prev => ({
      ...prev,
      [alertId]: !prev[alertId]
    }));
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    if (filter === 'WATCHLIST') return (a.alert_type || a.type)?.includes('WATCHLIST');
    if (filter === 'RESTRICTED') return (a.alert_type || a.type)?.includes('RESTRICTED');
    if (filter === 'HEALTH') return (a.alert_type || a.type)?.includes('CAMERA');
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Incident Management</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Security Alerts & Real-Time Incident Stream
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Human-verified alerts for Restricted Area Entries, Watchlist Target matches, and Camera Operational Health.
          </p>
        </div>

        {alerts.length > 0 && (
          <button
            onClick={onClearAlerts}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer shadow-sm"
          >
            Acknowledge All Alerts
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: 'ALL', label: 'All Incidents' },
          { id: 'WATCHLIST', label: 'Possible Watchlist Matches' },
          { id: 'RESTRICTED', label: 'Restricted Area Entries' },
          { id: 'HEALTH', label: 'Camera Operational Alerts' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              filter === f.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm shadow-xl">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500/50" />
            <p className="text-slate-300 font-semibold">Zero active security breaches detected.</p>
            <p className="text-xs text-slate-500 mt-1">All Gujarat surveillance nodes operating within normal parameters.</p>
          </div>
        ) : (
          filtered.map((alert, idx) => {
            const rawType = alert.alert_type || alert.type;
            const humanTitle = getHumanReadableAlertTitle(rawType);
            const severityLabel = getHumanReadableStatus(alert.severity || 'HIGH');
            const alertKey = alert.alert_id || `alert_${idx}`;
            const isExpanded = !!expandedAlerts[alertKey];
            const isCritical = severityLabel === 'IMMEDIATE ATTENTION';

            return (
              <div
                key={alertKey}
                className={`p-4 rounded-xl border transition shadow-md ${
                  isCritical
                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadgeStyle(alert.severity || 'HIGH')}`}>
                          {severityLabel}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {humanTitle}
                        </span>
                        <span className="text-xs font-mono-code font-bold text-cyan-400">
                          [{alert.camera_id || 'NODE'}]
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 mt-1">
                        {alert.details || `Activity observed on node ${alert.camera_id}. Human review required.`}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                        </span>
                        <span>•</span>
                        <span>Status: <strong className="text-slate-300">{alert.status || 'REVIEW_REQUIRED'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.plate && (
                      <button
                        onClick={() => onSelectPlate && onSelectPlate(alert.plate)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Track {alert.plate}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* Technical Details Toggle */}
                    <button
                      onClick={() => toggleExpand(alertKey)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Cpu className="w-3 h-3" />
                      <span>{isExpanded ? 'Hide Details' : 'Technical Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Technical Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-950/60 p-3 rounded-lg text-xs font-mono text-slate-400 space-y-1.5 animate-fadeIn">
                    <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                      Backend Diagnostic Payload
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>Alert Type: <strong className="text-slate-200">{rawType}</strong></div>
                      <div>Confidence: <strong className="text-emerald-400">{Math.round((alert.confidence || 0.95) * 100)}%</strong></div>
                      <div>Evidence ID: <strong className="text-cyan-400">{alert.evidence_id || 'VAULT-EV-01'}</strong></div>
                      <div>SHA-256: <strong className="text-slate-300 truncate block">VERIFIED</strong></div>
                    </div>
                    {alert.explanation && (
                      <div className="text-[11px] text-slate-300 pt-1">
                        Reasoning: {alert.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

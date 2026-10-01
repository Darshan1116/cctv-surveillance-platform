import React from 'react';
import { AlertTriangle, ShieldAlert, X, Radio, ArrowRight, Eye } from 'lucide-react';
import { getHumanReadableAlertTitle, getHumanReadableStatus, getStatusBadgeStyle } from '../utils/labelTranslator';

export default function AlertBanner({ alerts, onDismiss, onSearchPlate }) {
  if (!alerts || alerts.length === 0) return null;

  const latestAlert = alerts[0];
  const title = getHumanReadableAlertTitle(latestAlert.alert_type || latestAlert.type);
  const severity = getHumanReadableStatus(latestAlert.severity || 'HIGH');
  const isCritical = severity === 'IMMEDIATE ATTENTION';

  return (
    <div className={`w-full p-4 rounded-xl border transition-all duration-300 shadow-xl flex flex-wrap items-center justify-between gap-4 ${
      isCritical
        ? 'bg-red-950/70 border-red-500/70 text-red-100 shadow-red-950/40'
        : 'bg-amber-950/70 border-amber-500/70 text-amber-100 shadow-amber-950/40'
    }`}>
      <div className="flex items-center gap-3.5">
        <div className={`p-2.5 rounded-xl shrink-0 ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {isCritical ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6 animate-pulse" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono-code border ${getStatusBadgeStyle(latestAlert.severity || 'HIGH')}`}>
              {severity}
            </span>
            <span className="text-sm font-bold tracking-wide text-white">
              {title}
            </span>
            <span className="text-xs text-slate-400 font-mono-code">
              [{latestAlert.camera_id || 'NODE'}]
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-1 font-medium">
            {latestAlert.details || `Activity observed on camera ${latestAlert.camera_id}. Human review required.`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {latestAlert.plate && (
          <button
            onClick={() => onSearchPlate && onSearchPlate(latestAlert.plate)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono-code font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Track Vehicle: <strong>{latestAlert.plate}</strong></span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

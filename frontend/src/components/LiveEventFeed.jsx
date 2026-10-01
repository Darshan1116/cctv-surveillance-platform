import React, { useState } from 'react';
import { Car, Bus, Truck, Bike, User, ShieldAlert, Clock, Camera, Radio, Filter } from 'lucide-react';

export default function LiveEventFeed({ events, onSelectPlate }) {
  const [filterType, setFilterType] = useState('ALL');

  const getVehicleIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'bus': return <Bus className="w-4 h-4 text-emerald-400" />;
      case 'truck': return <Truck className="w-4 h-4 text-amber-400" />;
      case 'motorcycle':
      case 'bicycle': return <Bike className="w-4 h-4 text-cyan-400" />;
      case 'person': return <User className="w-4 h-4 text-purple-400" />;
      default: return <Car className="w-4 h-4 text-blue-400" />;
    }
  };

  const filteredEvents = events.filter((evt) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'VEHICLES') return evt.vehicle_type !== 'person';
    if (filterType === 'PERSON') return evt.vehicle_type === 'person';
    if (filterType === 'WITH_PLATE') return Boolean(evt.plate);
    return true;
  });

  return (
    <div className="flex flex-col h-[460px] bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Feed Header */}
      <div className="p-3.5 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Live AI Detection Stream
          </h3>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono-code font-bold">
          {filteredEvents.length} Events
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'VEHICLES', label: 'Vehicles' },
          { id: 'WITH_PLATE', label: 'Plates' },
          { id: 'PERSON', label: 'Pedestrians' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filterType === f.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Camera className="w-8 h-8 mb-2 opacity-30 animate-pulse" />
            <span>Streaming camera frames & AI detections...</span>
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const timeFormatted = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now';
            return (
              <div
                key={evt.event_id || idx}
                className="p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800/90 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getVehicleIcon(evt.vehicle_type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-200 capitalize">
                        {evt.vehicle_type || 'Vehicle'}
                      </span>
                      {evt.track_id ? (
                        <span className="text-[10px] text-slate-400 font-mono-code bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          #{evt.track_id}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-bold text-cyan-400 uppercase font-mono-code">{evt.camera_id}</span>
                      <span>?</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" /> {timeFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {evt.plate ? (
                    <button
                      onClick={() => onSelectPlate && onSelectPlate(evt.plate)}
                      className="plate-badge hover:scale-105 transition cursor-pointer"
                      title="Click to track vehicle across Gujarat cameras"
                    >
                      <span className="plate-badge-ind">IND</span>
                      <span>{evt.plate}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No plate</span>
                  )}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-emerald-400 font-medium">
                      {Math.round((evt.confidence || 0.92) * 100)}% conf
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

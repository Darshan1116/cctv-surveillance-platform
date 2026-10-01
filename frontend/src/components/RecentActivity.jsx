import React from 'react';
import { Car, Bus, Truck, Bike, User, Clock, ArrowRight, Activity } from 'lucide-react';

export default function RecentActivity({ events = [], onViewAll, onSelectPlate }) {
  // Show strictly the latest 5 events
  const latestEvents = events.slice(0, 5);

  const getVehicleIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'bus': return <Bus className="w-5 h-5 text-[#22C55E]" />;
      case 'truck': return <Truck className="w-5 h-5 text-[#F59E0B]" />;
      case 'motorcycle':
      case 'bicycle': return <Bike className="w-5 h-5 text-[#38BDF8]" />;
      case 'person': return <User className="w-5 h-5 text-[#A855F7]" />;
      default: return <Car className="w-5 h-5 text-[#3B82F6]" />;
    }
  };

  const formatCameraName = (camId) => {
    switch (camId) {
      case 'cam1': return 'Camera 01 (Ahmedabad)';
      case 'cam2': return 'Camera 02 (Gandhinagar)';
      case 'cam3': return 'Camera 03 (Surat)';
      default: return camId?.toUpperCase() || 'Camera 01';
    }
  };

  return (
    <div className="ui-card h-full w-full flex flex-col justify-between overflow-hidden min-h-[460px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#24324D] flex items-center justify-between shrink-0 bg-[#111A2E]">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-[#3B82F6]" />
          <h2 className="text-base font-semibold text-[#F1F5F9]">
            Recent Activity
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#16223B] border border-[#24324D] text-[#A8B3C7]">
          Latest 5
        </span>
      </div>

      {/* Events List (Row height min 64px) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#24324D]">
        {latestEvents.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#7C8AA5]">
            No recent activity detected.
          </div>
        ) : (
          latestEvents.map((evt, idx) => {
            const timeStr = evt.timestamp
              ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '09:17:42 AM';

            const isAlert = evt.is_alert || evt.alert_type;

            return (
              <div
                key={evt.event_id || idx}
                className="px-6 py-4 min-h-[64px] flex items-center justify-between hover:bg-[#16223B] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2 rounded-lg bg-[#0B1220] border border-[#24324D] shrink-0">
                    {getVehicleIcon(evt.vehicle_type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => evt.plate && onSelectPlate && onSelectPlate(evt.plate)}
                        className="plate-chip cursor-pointer hover:opacity-90 transition"
                        title="Click to track vehicle across Gujarat cameras"
                      >
                        {evt.plate || 'GJ06JK7890'}
                      </span>
                      {isAlert && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                          Alert
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#A8B3C7] mt-1 font-medium truncate">
                      {formatCameraName(evt.camera_id)}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-[#7C8AA5] tabular-nums shrink-0 ml-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#7C8AA5]" />
                  <span>{timeStr}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action */}
      <div className="p-4 border-t border-[#24324D] bg-[#0E1627] shrink-0">
        <button
          onClick={onViewAll}
          className="btn-secondary w-full"
        >
          <span>View All Activity</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

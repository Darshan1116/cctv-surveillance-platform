import React, { useState, useEffect } from 'react';
import { 
  Clock, Radio, Cpu, Bell, ChevronDown, CheckCircle2, ShieldAlert, 
  Zap, AlertTriangle, RotateCcw, Layers, Filter, MapPin
} from 'lucide-react';

const GUJARAT_ZONES = [
  { id: 'ALL', label: 'All Zones (Gujarat Grid)', code: 'ALL', icon: '🌐' },
  { id: 'ZONE_A', label: 'ZONE A: Ahmedabad (SG Highway)', code: 'ZONE A', icon: '📍', color: '#06b6d4' },
  { id: 'ZONE_B', label: 'ZONE B: Gandhinagar (Secretariat VIP)', code: 'ZONE B', icon: '🛡️', color: '#ef4444' },
  { id: 'ZONE_C', label: 'ZONE C: Surat (Ring Road)', code: 'ZONE C', icon: '📍', color: '#10b981' },
  { id: 'ZONE_D', label: 'ZONE D: Vadodara (Alkapuri)', code: 'ZONE D', icon: '📍', color: '#8b5cf6' },
  { id: 'ZONE_E', label: 'ZONE E: Rajkot (Kalawad Road)', code: 'ZONE E', icon: '📍', color: '#f59e0b' },
];

export default function TopNavbar({ 
  activeTab, 
  wsConnected, 
  alertsCount, 
  onSimulate, 
  onTriggerIot, 
  onNavigateAlerts,
  selectedZone = 'ALL',
  onSelectZone,
  onLogout
}) {
  const [timeStr, setTimeStr] = useState('');
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [showZoneMenu, setShowZoneMenu] = useState(false);
  const [simFeedback, setSimFeedback] = useState(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setTimeStr(formatted + ' (IST)');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Command Center';
      case 'zones': return 'Zone Management & Separation Grid';
      case 'cameras': return 'Live Camera Feeds & Video Wall';
      case 'search': return 'Cross-Camera Vehicle Intelligence';
      case 'health': return 'Camera Trust & Physical Tamper Detection';
      case 'evidence': return 'Cryptographic Evidence Vault (SHA-256)';
      case 'alerts': return 'Real-Time Security Alerts';
      case 'simulate': return 'Fault Simulation & Demo Console';
      default: return 'Surveillance Dashboard';
    }
  };

  const currentZoneObj = GUJARAT_ZONES.find(z => z.id === selectedZone || z.code === selectedZone) || GUJARAT_ZONES[0];

  const handleFastSim = async (scenario, cam = 'cam1') => {
    try {
      const res = await onSimulate(scenario, cam);
      setSimFeedback(`Triggered: ${scenario}`);
      setShowSimMenu(false);
      setTimeout(() => setSimFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFastIot = async () => {
    try {
      await onTriggerIot('cam1');
      setSimFeedback('IoT PIR Triggered: cam1');
      setShowSimMenu(false);
      setTimeout(() => setSimFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono-code">
            NetraSuraksha ? Gujarat CCTV
          </div>
          <h2 className="text-sm font-bold text-slate-100">{getPageTitle()}</h2>
        </div>
      </div>

      {/* Center / Right: Global Zone Filter & Quick Tools */}
      <div className="flex items-center gap-3">
        {/* Global Zone Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowZoneMenu(!showZoneMenu)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <span className="text-sm">{currentZoneObj.icon}</span>
            <span className="text-cyan-300 font-mono font-bold">{currentZoneObj.code}</span>
            <span className="hidden lg:inline text-slate-300 font-normal">
              {currentZoneObj.id === 'ALL' ? 'All Districts' : currentZoneObj.label.split(':')[1]?.trim()}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showZoneMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0f172a] border border-slate-700 shadow-2xl p-1.5 z-50 text-xs space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Filter By Geographic Zone</span>
                <Filter className="w-3 h-3 text-cyan-400" />
              </div>
              {GUJARAT_ZONES.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    if (onSelectZone) onSelectZone(z.id);
                    setShowZoneMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between cursor-pointer ${
                    selectedZone === z.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{z.icon}</span>
                    <div>
                      <div className="font-mono text-xs">{z.code}</div>
                      <div className="text-[10px] text-slate-400">{z.label}</div>
                    </div>
                  </div>
                  {selectedZone === z.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Simulation Feedback Pill */}
        {simFeedback && (
          <div className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-medium animate-pulse flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{simFeedback}</span>
          </div>
        )}

        {/* Live IST Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono-code">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || 'Loading clock...'}</span>
        </div>

        {/* WebSocket Stream Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-code">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
          <span className="text-slate-300 hidden sm:inline">
            {wsConnected ? 'AI STREAM LIVE' : 'CONNECTING'}
          </span>
        </div>

        {/* Fast Simulation Trigger Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSimMenu(!showSimMenu)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Simulate Fault</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showSimMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0f172a] border border-slate-700 shadow-2xl p-2 z-50 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Judge Demonstration Triggers
              </div>
              <button
                onClick={() => handleFastSim('freeze', 'cam1')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/20 text-slate-200 hover:text-red-300 transition flex items-center justify-between"
              >
                <span>Simulate Camera Freeze</span>
                <span className="text-[10px] text-red-400 font-mono-code">cv2.absdiff</span>
              </button>
              <button
                onClick={() => handleFastSim('block', 'cam2')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/20 text-slate-200 hover:text-red-300 transition flex items-center justify-between"
              >
                <span>Simulate Blocked Lens</span>
                <span className="text-[10px] text-red-400 font-mono-code">Laplacian</span>
              </button>
              <button
                onClick={() => handleFastSim('view_change', 'cam3')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 transition flex items-center justify-between"
              >
                <span>Simulate View Shift</span>
                <span className="text-[10px] text-amber-400 font-mono-code">Histogram</span>
              </button>
              <button
                onClick={() => handleFastSim('reset', 'cam1')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition flex items-center justify-between"
              >
                <span>Reset Camera to Healthy</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="border-t border-slate-800 my-1"></div>
              <button
                onClick={() => handleFastSim('watchlist', 'cam1')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 transition flex items-center justify-between"
              >
                <span>Watchlist Match (GJ01AB1234)</span>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                onClick={() => handleFastSim('restricted', 'cam2')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/20 text-slate-200 hover:text-red-300 transition flex items-center justify-between"
              >
                <span>Restricted Zone Breach</span>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </button>
              <button
                onClick={handleFastIot}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition flex items-center justify-between"
              >
                <span>Trigger IoT PIR Motion</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          )}
        </div>

        {/* Alert Bell Shortcut */}
        <button
          onClick={onNavigateAlerts}
          className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
          title="View Active Security Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {alertsCount}
            </span>
          )}
        </button>

        {/* Secure Sign Out / Switch Officer */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Sign Out to Login Page"
          >
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}

import React from 'react';
import { 
  LayoutDashboard, Video, Search, ShieldCheck, Lock, Cpu, 
  AlertTriangle, Radio, LogOut, Activity, ChevronRight, User, Flame, 
  Layers, Upload, Building2, Navigation, ShieldAlert, FileText, Settings, Users
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  alertCount, 
  cameraHealthAvg, 
  user, 
  onLogout 
}) {
  const navSections = [
    {
      title: 'OPERATIONAL COMMAND',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, badge: 'SOC' },
        { id: 'cameras', label: 'Live Cameras', icon: Video, badge: '3 LIVE' },
        { id: 'gis', label: 'GIS / Map', icon: Navigation, badge: 'TACTICAL' },
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alertCount > 0 ? alertCount : null, alert: alertCount > 0 },
        { id: 'incidents', label: 'Incidents', icon: ShieldAlert, badge: 'CASES' },
      ]
    },
    {
      title: 'AI INTELLIGENCE & TRACKING',
      items: [
        { id: 'vehicles', label: 'Vehicle Intelligence', icon: Search, badge: 'ANPR' },
        { id: 'persons', label: 'Person / Re-ID', icon: Users, badge: 'RE-ID' },
        { id: 'zones', label: 'Zones & Coverage', icon: Layers, badge: '5 ZONES' },
        { id: 'health', label: 'Camera Health', icon: ShieldCheck, badge: `${cameraHealthAvg}%` },
        { id: 'evidence', label: 'Evidence Vault', icon: Lock, badge: 'SHA-256' },
        { id: 'upload', label: 'Upload & Analyze', icon: Upload, badge: 'INFERENCE', highlight: true },
        { id: 'thermal', label: 'Thermal Vision', icon: Flame, badge: 'NIGHT FLIR', thermal: true },
      ]
    },
    {
      title: 'INVESTIGATION & SYSTEM',
      items: [
        { id: 'security', label: 'Security Alerts', icon: Lock, badge: null },
        { id: 'investigation', label: 'Investigation / Search', icon: FileText, badge: 'OMNI' },
        { id: 'integrations', label: 'Integrations', icon: Building2, badge: 'VAHAN' },
        { id: 'admin', label: 'Administration', icon: Settings, badge: 'RBAC' },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800/80 flex flex-col justify-between shrink-0 z-30 min-h-screen">
      {/* Brand & Network Banner */}
      <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3 sticky top-0 bg-[#0d1322] z-10">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-900/30">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-wide">
                NETRA<span className="text-cyan-400">SURAKSHA</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Gujarat Police Surveillance</p>
          </div>
        </div>

        {/* Live Network Health Status Pill */}
        <div className="px-3 pt-3">
          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium text-[10px]">Surveillance Grid</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 text-[10px]">OPTIMAL</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-2.5 space-y-3 mt-1">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {sec.title}
              </div>

              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600/25 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${
                        isActive
                          ? (item.thermal ? 'text-amber-400' : 'text-cyan-400')
                          : (item.thermal ? 'text-amber-500/80' : 'text-slate-400')
                      }`} />
                      <span className="truncate max-w-[125px]">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                        item.alert
                          ? 'bg-red-500 text-white animate-pulse'
                          : item.thermal
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : item.highlight
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Authenticated User Profile & Logout */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#0a0f1d] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
              {user?.name ? user.name[0] : 'O'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Duty Officer'}</div>
              <div className="text-[9px] text-slate-400 font-mono">{user?.badge || 'GJ-POLICE-SOC-409'}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition cursor-pointer shrink-0"
            title="Secure Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

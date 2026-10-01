import React, { useState } from 'react';
import { 
  Settings, Users, Shield, HardDrive, Plus, CheckCircle2, 
  Activity, Clock, Lock, Server, ChevronDown, Save, RefreshCw
} from 'lucide-react';

export default function AdministrationPage({ cameras = [] }) {
  const [activeTab, setActiveTab] = useState('USERS');
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // New Camera Form
  const [newCam, setNewCam] = useState({
    id: 'cam6',
    name: 'Ahmedabad Outer Ring Road Toll Plaza',
    zone: 'ZONE_A',
    rtsp: 'rtsp://10.0.1.106:554/live/stream1',
    vendor: 'Hikvision ONVIF Profile S'
  });

  const handleSaveSettings = () => {
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const usersList = [
    { name: 'Officer D. Patel', badge: 'GJ-POLICE-SOC-409', role: 'SOC Commander', status: 'ACTIVE', zone: 'State Wide' },
    { name: 'Inspector V. Sharma', badge: 'GJ-POLICE-INV-112', role: 'Forensic Investigator', status: 'ACTIVE', zone: 'ZONE_A (Ahmedabad)' },
    { name: 'Sub-Inspector R. Joshi', badge: 'GJ-POLICE-FLD-882', role: 'Field Patrol Lead', status: 'ON DUTY', zone: 'ZONE_B (Gandhinagar)' },
    { name: 'Administrator System', badge: 'GJ-SYS-ROOT-001', role: 'System Admin', status: 'ACTIVE', zone: 'Infrastructure' },
  ];

  const auditLogs = [
    { time: '04:37:12 PM', officer: 'Officer D. Patel', action: 'Acknowledged Watchlist Alert on GJ01AB1234', node: 'cam1' },
    { time: '04:24:45 PM', officer: 'Inspector V. Sharma', action: 'Opened Forensic Case INC-2026-0941 for review', node: 'cam1' },
    { time: '03:45:20 PM', officer: 'Officer D. Patel', action: 'Dispatched Perimeter Patrol Team to VIP Gate 3', node: 'cam2' },
    { time: '02:18:10 PM', officer: 'Administrator System', action: 'Camera cam3 anti-tamper watchdog restored to healthy', node: 'cam3' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              System Administration & SOC Governance
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
                RBAC & AUDIT
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage authorized police operators, camera node onboarding, storage retention, and immutable SOC audit logs.
            </p>
          </div>
        </div>

        {saveFeedback && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* 2. Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'USERS', label: 'User Roles & RBAC', icon: Users },
          { id: 'ONBOARDING', label: 'Camera Node Onboarding', icon: Plus },
          { id: 'RETENTION', label: 'Evidence Retention & Storage', icon: HardDrive },
          { id: 'AUDIT', label: 'SOC Action Audit Logs', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-md border border-cyan-500/50'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* A. User Roles */}
      {activeTab === 'USERS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Authorized SOC Personnel & Access Control List</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Role-Based Access Control (RBAC)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usersList.map((u, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white">{u.name}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {u.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">Badge: <strong className="text-cyan-300">{u.badge}</strong></div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Role: <strong className="text-slate-200">{u.role}</strong></span>
                  <span>Jurisdiction: <strong className="text-slate-300">{u.zone}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B. Camera Onboarding */}
      {activeTab === 'ONBOARDING' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Onboard New Gujarat CCTV Edge Node</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Register ONVIF Profile S or RTSP camera stream into the automated YOLO/OCR pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Camera ID Code</label>
              <input
                type="text"
                value={newCam.id}
                onChange={(e) => setNewCam({ ...newCam, id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Camera Location Name</label>
              <input
                type="text"
                value={newCam.name}
                onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Assigned Surveillance Zone</label>
              <select
                value={newCam.zone}
                onChange={(e) => setNewCam({ ...newCam, zone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              >
                <option value="ZONE_A">ZONE A - Ahmedabad</option>
                <option value="ZONE_B">ZONE B - Gandhinagar</option>
                <option value="ZONE_C">ZONE C - Surat</option>
                <option value="ZONE_D">ZONE D - Vadodara</option>
                <option value="ZONE_E">ZONE E - Rajkot</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">RTSP Stream URI (TCP)</label>
              <input
                type="text"
                value={newCam.rtsp}
                onChange={(e) => setNewCam({ ...newCam, rtsp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30"
          >
            <Save className="w-4 h-4" />
            <span>Onboard & Initialize AI Pipeline</span>
          </button>
        </div>
      )}

      {/* C. Retention Policies */}
      {activeTab === 'RETENTION' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Evidence Vault & Frame Storage Policies</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure tamper-proof cryptographic ledger retention rules according to Gujarat Police standard operating procedures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white">Cryptographic Vault Retention</div>
              <div className="text-2xl font-black text-cyan-400">90 Days</div>
              <p className="text-[11px] text-slate-400">Immutable SHA-256 evidence records stored in tamper-proof cold storage.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white">Live Video Ring Buffer</div>
              <div className="text-2xl font-black text-emerald-400">24 Hours</div>
              <p className="text-[11px] text-slate-400">Rolling frame buffer for rapid retroactive anomaly analysis.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white">Storage Utilization</div>
              <div className="text-2xl font-black text-purple-400">1.8 TB / 10 TB</div>
              <p className="text-[11px] text-slate-400">Fast NVMe scratch buffer with automated deduplication.</p>
            </div>
          </div>
        </div>
      )}

      {/* D. Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>SOC Operator Action & Access Trail</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Read-only immutable log of every operator alert review, dispatch, and system modification.
            </p>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-cyan-400 font-bold">{log.time}</span>
                  <span className="font-semibold text-slate-200">{log.officer}</span>
                  <span className="text-slate-400">— {log.action}</span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  Node: {log.node}
                </span>
              </div>
            ))}
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
            <span>⚙️</span> System Architecture, Docker & Security Configuration
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechDetails && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs font-mono space-y-2 text-slate-400 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">APPLICATION HOST</span>
                <span className="text-cyan-300">FastAPI Uvicorn Async Workers</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MESSAGE BROKER</span>
                <span className="text-cyan-300">MQTT Mosquitto / WebSocket Hub</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SECURITY PROTOCOL</span>
                <span className="text-emerald-400">TLS 1.3 / bcrypt Password Hashing</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

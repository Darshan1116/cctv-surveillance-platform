import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Video, Search, ShieldCheck, Lock, Cpu, 
  Radio, AlertTriangle, Car, Users, Activity, X, Eye, RefreshCw, Shield, Flame, Layers
} from 'lucide-react';

import ErrorBoundary from './components/ErrorBoundary.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopNavbar from './components/TopNavbar.jsx';

// 16 Full Modules
import CommandCenterPage from './pages/CommandCenterPage.jsx';
import LiveCamerasPage from './pages/LiveCamerasPage.jsx';
import GISMapPage from './pages/GISMapPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import VehicleIntelligencePage from './pages/VehicleIntelligencePage.jsx';
import PersonReIDPage from './pages/PersonReIDPage.jsx';
import ZoneManagementPage from './pages/ZoneManagementPage.jsx';
import CameraHealthPage from './pages/CameraHealthPage.jsx';
import EvidenceVaultPage from './pages/EvidenceVaultPage.jsx';
import UploadMediaPage from './pages/UploadMediaPage.jsx';
import ThermalVisionPage from './pages/ThermalVisionPage.jsx';
import SecurityAlertsPage from './pages/SecurityAlertsPage.jsx';
import InvestigationPage from './pages/InvestigationPage.jsx';
import GovernmentIntegrationPage from './pages/GovernmentIntegrationPage.jsx';
import AdministrationPage from './pages/AdministrationPage.jsx';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('netra_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [cameras, setCameras] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const [modalMode, setModalMode] = useState('optical');
  const [searchInitialPlate, setSearchInitialPlate] = useState('GJ01AB1234');
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  const handleLogin = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('netra_user', JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('netra_user');
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const zoneParam = selectedZone !== 'ALL' ? `?zone_id=${selectedZone}` : '';
      const [cRes, eRes, aRes] = await Promise.all([
        fetch(`/api/cameras${zoneParam}`),
        fetch(`/api/events${selectedZone !== 'ALL' ? `${zoneParam}&limit=40` : '?limit=40'}`),
        fetch(`/api/alerts${zoneParam}`)
      ]);
      const [cData, eData, aData] = await Promise.all([
        cRes.json(),
        eRes.json(),
        aRes.json()
      ]);
      setCameras(Array.isArray(cData) ? cData : []);
      setEvents(Array.isArray(eData) ? eData : []);
      setAlerts(Array.isArray(aData) ? aData : []);
    } catch (err) {
      console.error("Initial fetch error:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [user, selectedZone]);

  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:8000/ws`;

    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'EVENT') {
            setEvents((prev) => [msg.data, ...prev.slice(0, 49)]);
          } else if (msg.type === 'ALERT') {
            setAlerts((prev) => [msg.data, ...prev]);
          } else if (msg.type === 'HEALTH') {
            setCameras((prev) =>
              prev.map((c) => (c.camera_id === msg.data.camera_id ? { ...c, ...msg.data } : c))
            );
          } else if (msg.type === 'IOT_TRIGGER') {
            setEvents((prev) => [msg.data, ...prev.slice(0, 49)]);
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [user]);

  // Zone filtering computed values
  const filteredCameras = selectedZone === 'ALL'
    ? cameras
    : cameras.filter(c => c.zone_id === selectedZone || c.zone_id === `ZONE_${selectedZone.replace('ZONE ', '')}`);

  const filteredEvents = selectedZone === 'ALL'
    ? events
    : events.filter(e => e.zone_id === selectedZone || e.camera_id === filteredCameras.find(c => c.camera_id === e.camera_id)?.camera_id);

  const filteredAlerts = selectedZone === 'ALL'
    ? alerts
    : alerts.filter(a => a.zone_id === selectedZone || filteredCameras.some(c => c.camera_id === a.camera_id));

  const activeAlertsCount = filteredAlerts.filter(a => !a.resolved).length;
  const avgHealth = Math.round(
    filteredCameras.reduce((acc, c) => acc + (c.health_score ?? 100), 0) / (filteredCameras.length || 1)
  );

  const handleSelectPlate = (plate) => {
    setSearchInitialPlate(plate);
    setActiveTab('vehicles');
  };

  const handleInspectCamera = (camOrId) => {
    if (typeof camOrId === 'string') {
      const found = cameras.find(c => c.camera_id === camOrId);
      if (found) setActiveCamera(found);
    } else {
      setActiveCamera(camOrId);
    }
  };

  const handleSimulate = async (scenario, camera_id = 'cam1') => {
    const res = await fetch(`/api/simulate/${scenario}?camera_id=${camera_id}`, { method: 'POST' });
    const data = await res.json();
    fetchData();
    return data;
  };

  const handleTriggerIot = async (camera_id = 'cam1') => {
    const res = await fetch(`/api/events/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensor_id: 'sensor_01', camera_id, trigger_type: 'MOTION' })
    });
    const data = await res.json();
    fetchData();
    return data;
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={activeAlertsCount}
        cameraHealthAvg={avgHealth}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        <TopNavbar
          activeTab={activeTab}
          wsConnected={wsConnected}
          alertsCount={activeAlertsCount}
          onSimulate={handleSimulate}
          onTriggerIot={handleTriggerIot}
          onNavigateAlerts={() => setActiveTab('alerts')}
          selectedZone={selectedZone}
          onSelectZone={(zid) => setSelectedZone(zid)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Active Zone Filter Indicator */}
          {selectedZone !== 'ALL' && (
            <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>
                  Filtering active view by: <strong className="text-white font-mono">{selectedZone}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedZone('ALL')}
                className="px-2.5 py-1 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 text-xs font-semibold cursor-pointer transition border border-cyan-700/50"
              >
                Reset to All Zones (Gujarat Grid)
              </button>
            </div>
          )}

          <ErrorBoundary>
            {/* 1. Command Center */}
            {activeTab === 'dashboard' && (
              <CommandCenterPage
                cameras={filteredCameras}
                events={filteredEvents}
                alerts={filteredAlerts}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                onNavigateTab={setActiveTab}
                onSelectPlate={handleSelectPlate}
                onSelectCamera={handleInspectCamera}
              />
            )}

            {/* 2. Live Cameras */}
            {activeTab === 'cameras' && (
              <LiveCamerasPage
                cameras={filteredCameras}
                onSelectCamera={handleInspectCamera}
                onNavigateAlerts={() => setActiveTab('alerts')}
                onNavigateEvidence={() => setActiveTab('evidence')}
              />
            )}

            {/* 3. GIS / Map */}
            {activeTab === 'gis' && (
              <GISMapPage
                cameras={filteredCameras}
                events={filteredEvents}
                alerts={filteredAlerts}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                onNavigateTab={setActiveTab}
                onSelectPlate={handleSelectPlate}
                onSelectCamera={handleInspectCamera}
              />
            )}

            {/* 4. Alerts */}
            {activeTab === 'alerts' && (
              <AlertsPage
                alerts={filteredAlerts}
                onSelectPlate={handleSelectPlate}
                onNavigateCamera={(camId) => {
                  handleInspectCamera(camId);
                  setActiveTab('cameras');
                }}
                onNavigateEvidence={() => setActiveTab('evidence')}
                onClearAlerts={() => setAlerts([])}
              />
            )}

            {/* 5. Incidents */}
            {activeTab === 'incidents' && (
              <IncidentsPage
                cameras={filteredCameras}
                onNavigateCamera={(camId) => {
                  handleInspectCamera(camId);
                  setActiveTab('cameras');
                }}
                onNavigateEvidence={() => setActiveTab('evidence')}
              />
            )}

            {/* 6. Vehicle Intelligence */}
            {activeTab === 'vehicles' && (
              <VehicleIntelligencePage
                initialPlate={searchInitialPlate}
                onNavigateCamera={(camId) => {
                  handleInspectCamera(camId);
                  setActiveTab('cameras');
                }}
                onNavigateEvidence={() => setActiveTab('evidence')}
              />
            )}

            {/* 7. Person / Re-ID */}
            {activeTab === 'persons' && (
              <PersonReIDPage
                cameras={filteredCameras}
                onNavigateCamera={(camId) => {
                  handleInspectCamera(camId);
                  setActiveTab('cameras');
                }}
                onNavigateEvidence={() => setActiveTab('evidence')}
              />
            )}

            {/* 8. Zones & Coverage */}
            {activeTab === 'zones' && (
              <ZoneManagementPage 
                globalSelectedZone={selectedZone}
                onSelectGlobalZone={(zid) => setSelectedZone(zid)}
              />
            )}

            {/* 9. Camera Health */}
            {activeTab === 'health' && (
              <CameraHealthPage
                cameras={filteredCameras}
                onRefresh={fetchData}
                onSimulate={handleSimulate}
              />
            )}

            {/* 10. Evidence Vault */}
            {activeTab === 'evidence' && (
              <EvidenceVaultPage />
            )}

            {/* 11. Upload & Analyze */}
            {activeTab === 'upload' && (
              <UploadMediaPage 
                onNavigateTab={setActiveTab}
                onSelectPlate={handleSelectPlate}
              />
            )}

            {/* 12. Thermal Vision */}
            {activeTab === 'thermal' && (
              <ThermalVisionPage cameras={filteredCameras} />
            )}

            {/* 13. Security Alerts */}
            {activeTab === 'security' && (
              <SecurityAlertsPage
                alerts={filteredAlerts}
                onSelectPlate={handleSelectPlate}
                onClearAlerts={() => setAlerts([])}
              />
            )}

            {/* 14. Investigation / Search */}
            {activeTab === 'investigation' && (
              <InvestigationPage
                onSelectPlate={handleSelectPlate}
                onNavigateCamera={(camId) => {
                  handleInspectCamera(camId);
                  setActiveTab('cameras');
                }}
                onNavigateEvidence={() => setActiveTab('evidence')}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* 15. Integrations */}
            {activeTab === 'integrations' && (
              <GovernmentIntegrationPage />
            )}

            {/* 16. Administration */}
            {activeTab === 'admin' && (
              <AdministrationPage cameras={filteredCameras} />
            )}
          </ErrorBoundary>
        </main>

        <footer className="border-t border-slate-800/80 bg-[#0d1322] py-3.5 px-6 text-center text-xs text-slate-500">
          NETRASURAKSHA — Gujarat Police State Surveillance SOC Platform — Real-Time Edge AI & Multi-Camera ANPR Grid
        </footer>
      </div>

      {/* Global Camera Stream Modal */}
      {activeCamera && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  {activeCamera.camera_id} ({activeCamera.zone_id || 'ZONE_A'})
                </span>
                <h3 className="text-sm font-bold text-white">{activeCamera.name}</h3>
                <p className="text-xs text-slate-400">{activeCamera.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalMode(modalMode === 'thermal' ? 'optical' : 'thermal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    modalMode === 'thermal'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{modalMode === 'thermal' ? 'THERMAL FLIR' : 'OPTICAL IR'}</span>
                </button>
                <button
                  onClick={() => setActiveCamera(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                src={`/api/cameras/${activeCamera.camera_id}/stream?mode=${modalMode}`}
                alt={activeCamera.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-3 left-3 px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                modalMode === 'thermal' ? 'bg-black/80 text-amber-300 border border-amber-500/40' : 'bg-black/75 text-cyan-300 border border-white/10'
              }`}>
                {modalMode === 'thermal' ? 'RADIOMETRIC THERMAL FLIR' : 'OPTICAL NIGHT IR'} • {activeCamera.fps || 15} FPS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

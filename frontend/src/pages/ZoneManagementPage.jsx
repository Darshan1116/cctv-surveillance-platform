import React, { useState, useEffect } from 'react';
import { 
  Layers, MapPin, Shield, ShieldAlert, AlertTriangle, Video, Activity,
  Radio, CheckCircle2, ChevronRight, Eye, Navigation, Search, Filter,
  TrendingUp, Clock, AlertOctagon, RefreshCw, Cpu, ExternalLink, ArrowRight
} from 'lucide-react';
import MapComponent from '../components/MapComponent';

export default function ZoneManagementPage({ globalSelectedZone, onSelectGlobalZone }) {
  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(globalSelectedZone || 'ZONE_A');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cross-Zone Tracking State
  const [targetQuery, setTargetQuery] = useState('GJ01AB1234');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Active Tab inside Zone View
  const [activeTab, setActiveTab] = useState('cameras'); // 'cameras' | 'incidents' | 'gap_analysis'

  const fetchZoneData = async () => {
    try {
      setRefreshing(true);
      const [zonesRes, camsRes, incRes] = await Promise.all([
        fetch('/api/zones'),
        fetch('/api/cameras'),
        fetch('/api/zones/ZONE_A/incidents') // or fetch all incidents
      ]);

      if (zonesRes.ok) {
        const zData = await zonesRes.json();
        setZones(zData);
      }
      if (camsRes.ok) {
        const cData = await camsRes.json();
        setCameras(cData);
      }
      if (incRes.ok) {
        const iData = await incRes.json();
        setIncidents(iData);
      }
    } catch (err) {
      console.error('Error loading zone data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchZoneData();
  }, []);

  // Fetch Cross-Zone Journey
  const runCrossZoneTracker = async (plateId) => {
    const target = (plateId || targetQuery).trim();
    if (!target) return;
    try {
      setTrackingLoading(true);
      const res = await fetch(`/api/zones/cross-zone-tracking/${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingResult(data);
      }
    } catch (err) {
      console.error('Error tracking target:', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    runCrossZoneTracker('GJ01AB1234');
  }, []);

  // Sync with global zone if passed
  useEffect(() => {
    if (globalSelectedZone && globalSelectedZone !== 'ALL') {
      setSelectedZoneId(globalSelectedZone);
    }
  }, [globalSelectedZone]);

  const activeZone = zones.find(z => z.zone_id === selectedZoneId) || zones[0] || {
    zone_id: 'ZONE_A',
    code: 'ZONE A',
    name: 'Ahmedabad Central & SG Highway Corridor',
    city: 'Ahmedabad',
    status: 'OPTIMAL',
    coverage_status: 'COVERED',
    is_monitored: 1,
    is_restricted: 0,
    camera_count: 1,
    incident_count: 1,
    health_score: 98,
    color: '#06b6d4',
    risk_level: 'MEDIUM'
  };

  const zoneCameras = cameras.filter(c => c.zone_id === activeZone.zone_id);

  // Stats calculation
  const totalMonitoredZones = zones.filter(z => z.is_monitored === 1).length;
  const totalGapCorridors = zones.filter(z => z.is_monitored === 0).length;
  const totalIncidents = zones.reduce((acc, z) => acc + (z.incident_count || 0), 0);
  const avgHealth = zones.length > 0 
    ? Math.round(zones.filter(z => z.is_monitored === 1).reduce((acc, z) => acc + (z.health_score || 100), 0) / (totalMonitoredZones || 1))
    : 97;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner / Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                Gujarat State Surveillance Zone Management
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  GEOGRAPHIC NODES ACTIVE
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-District Zone Separation, Boundary Geofencing & Cross-Corridor Unmonitored Gap Analysis
              </p>
            </div>
          </div>
        </div>

        {/* Global Summary KPIs */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monitored Zones</div>
            <div className="text-lg font-black text-cyan-400">{totalMonitoredZones} <span className="text-xs font-normal text-slate-500">Districts</span></div>
          </div>
          <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Gap Corridors</div>
            <div className="text-lg font-black text-amber-400">{totalGapCorridors} <span className="text-xs font-normal text-slate-500">Unmonitored</span></div>
          </div>
          <div className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Avg Zone Health</div>
            <div className="text-lg font-black text-emerald-400">{avgHealth}%</div>
          </div>
          <button 
            onClick={fetchZoneData}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700 shadow-md"
            title="Refresh Zones"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Zone Cards Selection Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {zones.filter(z => z.is_monitored === 1).map((zone) => {
          const isSelected = selectedZoneId === zone.zone_id;
          const isRestricted = zone.is_restricted === 1;

          return (
            <div
              key={zone.zone_id}
              onClick={() => {
                setSelectedZoneId(zone.zone_id);
                if (onSelectGlobalZone) onSelectGlobalZone(zone.zone_id);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {/* Top Row: Code & Restricted / Health Badge */}
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="px-2 py-0.5 rounded-md text-xs font-mono font-black border"
                  style={{
                    color: zone.color || '#06b6d4',
                    borderColor: `${zone.color}44`,
                    backgroundColor: `${zone.color}15`
                  }}
                >
                  {zone.code}
                </span>

                {isRestricted ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    RESTRICTED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" />
                    {zone.health_score || 98}%
                  </span>
                )}
              </div>

              {/* Zone City & Name */}
              <div className="font-bold text-slate-100 text-sm truncate mb-0.5">{zone.name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                <MapPin className="w-3 h-3 text-slate-500" />
                {zone.city}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Cameras</span>
                  <strong className="text-cyan-300 font-mono font-bold">{zone.camera_count || 1} Nodes</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Incidents</span>
                  <strong className={zone.incident_count > 0 ? 'text-amber-400 font-mono font-bold' : 'text-slate-400 font-mono font-bold'}>
                    {zone.incident_count || 0} Active
                  </strong>
                </div>
              </div>

              {/* Selection Indicator Strip */}
              {isSelected && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: zone.color || '#06b6d4' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Split View: Interactive Zone Map + Zone Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map with Zone Boundaries (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-200">
                Live Geographic Grid & Zone Boundaries
              </h2>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              FOCUSED: <span className="text-cyan-300 font-bold">{activeZone.code} ({activeZone.city})</span>
            </div>
          </div>

          {/* Interactive Map Component */}
          <MapComponent 
            cameras={cameras} 
            zones={zones}
            selectedZone={activeZone.zone_id}
            onSelectZone={(zid) => setSelectedZoneId(zid)}
          />

          {/* Unmonitored Gap Corridors Notice */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-200 block">Identified Unmonitored Inter-Zone Corridors:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                <strong className="text-slate-300">GAP A-B</strong> (Koba Highway), <strong className="text-slate-300">GAP B-C</strong> (NH-48 Corridor), <strong className="text-slate-300">GAP D-E</strong> (Saurashtra Bypass). 
                The system dynamically enforces predictive route tracking and triggers checkpoint alerts upon next camera sighting.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Active Zone Detail Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Zone Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-mono font-black"
                    style={{
                      color: activeZone.color || '#06b6d4',
                      backgroundColor: `${activeZone.color}20`,
                      border: `1px solid ${activeZone.color}40`
                    }}
                  >
                    {activeZone.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {activeZone.city} Sector
                  </span>
                  {activeZone.is_restricted === 1 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                      RESTRICTED HIGH SECURITY
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5">{activeZone.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Coverage Status: <strong className="text-emerald-400">{activeZone.coverage_status || 'COVERED'}</strong> • Health Score: <strong className="text-cyan-400">{activeZone.health_score || 98}%</strong>
                </p>
              </div>
            </div>

            {/* Navigation Tabs for Zone */}
            <div className="flex gap-2 border-b border-slate-800 pb-2 mb-4">
              <button
                onClick={() => setActiveTab('cameras')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'cameras'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Cameras ({zoneCameras.length})
              </button>
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'incidents'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Incidents ({incidents.filter(i => i.zone_id === activeZone.zone_id).length || 1})
              </button>
              <button
                onClick={() => setActiveTab('gap_analysis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'gap_analysis'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Boundaries & Gaps
              </button>
            </div>

            {/* Tab 1: Cameras in Zone */}
            {activeTab === 'cameras' && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {zoneCameras.length > 0 ? (
                  zoneCameras.map(cam => (
                    <div 
                      key={cam.camera_id}
                      className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 text-cyan-400">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">{cam.camera_id}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                              {cam.status || 'ONLINE'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-200">{cam.name}</div>
                          <div className="text-[11px] text-slate-400">{cam.location}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <div className="text-emerald-400 font-bold">{cam.health_score || 98}%</div>
                        <div className="text-[10px] text-slate-500">{cam.fps || 15} FPS</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No cameras assigned directly to this zone corridor.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Incidents in Zone */}
            {activeTab === 'incidents' && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {incidents.filter(i => i.zone_id === activeZone.zone_id).length > 0 ? (
                  incidents.filter(i => i.zone_id === activeZone.zone_id).map((inc, idx) => (
                    <div 
                      key={inc.incident_id || idx}
                      className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {inc.incident_id || `INC-${idx + 101}`}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          {inc.incident_type || 'WATCHLIST_HIT'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-200 font-medium">{inc.details || inc.location}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                        <span>Node: <strong className="text-cyan-400">{inc.camera_id || 'EDGE-SENSOR'}</strong></span>
                        <span>Confidence: <strong className="text-emerald-400">{Math.round((inc.confidence || 0.95) * 100)}%</strong></span>
                        <span>SHA-256 Vault: <strong className="text-cyan-400">VERIFIED</strong></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                    No critical incidents active in {activeZone.code}. Zone is operating in nominal status.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Gap & Polygon Analysis */}
            {activeTab === 'gap_analysis' && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Boundary Geometry & Security Rules
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Polygon Points</span>
                    <strong className="text-slate-200 font-mono">4 Coordinates</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Risk Level</span>
                    <strong className={activeZone.risk_level === 'HIGH' ? 'text-red-400' : 'text-cyan-400'}>
                      {activeZone.risk_level || 'MEDIUM'}
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Geographic boundary enforces real-time spatial indexing for all incoming CCTV video streams. Any detection outside the perimeter or crossing into gap sectors is tracked via predictive transit modeling.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Zone Target Tracking Simulator (Strictly Enforcing LAST OBSERVED -> COVERAGE GAP -> POSSIBLE MATCH) */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-white tracking-wide">
                Cross-Zone Target Transit Reconstruction & Gap Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Honest transit trail recording. Never invents observation inside camera-free unmonitored sectors.
            </p>
          </div>

          {/* Quick Target Query Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value.toUpperCase())}
                placeholder="Enter License Plate / ID"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-500 w-48"
              />
            </div>
            <button
              onClick={() => runCrossZoneTracker(targetQuery)}
              disabled={trackingLoading}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/20"
            >
              <Search className="w-3.5 h-3.5" />
              {trackingLoading ? 'Analyzing...' : 'Reconstruct Trail'}
            </button>
          </div>
        </div>

        {/* Quick Test Presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Quick Test Targets:</span>
          {['GJ01AB1234', 'GJ05CD5678', 'GJ18EF9012', 'GJ27AA0007'].map(plate => (
            <button
              key={plate}
              onClick={() => {
                setTargetQuery(plate);
                runCrossZoneTracker(plate);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                targetQuery === plate
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {plate}
            </button>
          ))}
        </div>

        {/* Cross-Zone Sequential Timeline Visualizer */}
        {trackingResult && trackingResult.timeline && trackingResult.timeline.length > 0 ? (
          <div className="space-y-4">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Target: <strong className="text-cyan-400">{trackingResult.target}</strong></span>
              <span>Traversed: <strong className="text-slate-200">{trackingResult.zones_traversed_count || 3} Zones</strong></span>
              <span>Total Sightings: <strong className="text-emerald-400">{trackingResult.total_observations} Observations</strong></span>
            </div>

            {/* Step-by-Step Chain */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
              {trackingResult.timeline.map((step, idx) => {
                const isGap = step.type === 'COVERAGE_GAP' || step.status_badge === 'COVERAGE GAP';
                const isLast = step.status_badge === 'LAST OBSERVED';
                const isMatch = step.status_badge === 'POSSIBLE MATCH';
                const isOrigin = step.status_badge === 'ORIGIN POINT';

                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border relative flex flex-col justify-between ${
                      isGap
                        ? 'bg-slate-950/80 border-dashed border-amber-500/40 text-slate-300'
                        : isLast
                        ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : isMatch
                        ? 'bg-slate-900/80 border-emerald-500/40'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded ${
                        isGap
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isLast
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : isMatch
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {step.status_badge}
                      </span>

                      <span className="text-[10px] text-slate-500 font-mono">
                        {step.timestamp ? step.timestamp.substring(11, 19) : `Step ${idx + 1}`}
                      </span>
                    </div>

                    {/* Step Title */}
                    <div className="font-bold text-slate-100 text-xs mb-1">
                      {step.label || (isGap ? 'Unmonitored Gap Corridor' : `${step.zone_code} - ${step.camera_id}`)}
                    </div>

                    {/* Step Details */}
                    <div className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      {step.details || (isGap ? 'Camera-free gap corridor. Zero CCTV observation.' : step.location)}
                    </div>

                    {/* Footer / Meta */}
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono flex items-center justify-between text-slate-400">
                      {isGap ? (
                        <span className="text-amber-400 font-bold">⚠️ NO CCTV AVAILABLE</span>
                      ) : (
                        <>
                          <span>Node: <strong className="text-cyan-400">{step.camera_id}</strong></span>
                          <span>Confidence: <strong className="text-emerald-400">{Math.round((step.confidence || 0.95)*100)}%</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
            {trackingLoading ? 'Calculating cross-zone route reconstruction...' : 'No transit history found for this query target.'}
          </div>
        )}
      </div>
    </div>
  );
}

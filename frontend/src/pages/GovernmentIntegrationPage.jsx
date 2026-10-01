import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Database, CheckCircle2, AlertCircle, 
  ExternalLink, Search, RefreshCw, Key, Lock, Globe, Server
} from 'lucide-react';

export default function GovernmentIntegrationPage() {
  const [govSystems, setGovSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testPlate, setTestPlate] = useState('GJ01AB1234');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchGovStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/government/status');
      if (res.ok) {
        const data = await res.json();
        setGovSystems(data.systems || []);
      }
    } catch (e) {
      console.error('Error fetching government systems:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovStatus();
  }, []);

  const handleTestVahanLookup = async () => {
    if (!testPlate) return;
    try {
      setTestLoading(true);
      const res = await fetch(`/api/government/vahan/${encodeURIComponent(testPlate)}`);
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Government & Police Database Interoperability Gateway
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                INTEGRATION READY
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized enterprise adapter layer for VAHAN, SARTHI, eGujCop CCTNS, AFIS, and NAFIS state databases.
            </p>
          </div>
        </div>

        <button
          onClick={fetchGovStatus}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Connectors</span>
        </button>
      </div>

      {/* Grid of Government Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {govSystems.map((sys) => (
          <div
            key={sys.system_id}
            className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {sys.system_id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  INTEGRATION READY
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-0.5">{sys.name}</h3>
              <p className="text-xs text-slate-400">{sys.agency}</p>

              <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Protocol:</span>
                  <span className="font-mono text-cyan-400 font-bold">{sys.protocol}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Gateway State:</span>
                  <span className="font-mono text-amber-400 font-semibold">{sys.connection_state}</span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="mt-3 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Supported Connectors:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sys.capabilities.map((cap, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-400">
                <Lock className="w-3 h-3" />
                Schema Standardized
              </span>
              <span className="text-slate-500 font-mono">mTLS / ESB</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Gateway Adapter Probe */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            External Gateway Integration Adapter Probe
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test external government adapter schemas and verify readiness for live credentials binding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={testPlate}
            onChange={(e) => setTestPlate(e.target.value.toUpperCase())}
            placeholder="Vehicle Plate (e.g. GJ01AB1234)"
            className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500 w-64"
          />
          <button
            onClick={handleTestVahanLookup}
            disabled={testLoading}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Search className="w-3.5 h-3.5" />
            {testLoading ? 'Querying Adapter...' : 'Test VAHAN Schema Probe'}
          </button>
        </div>

        {testResult && (
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Adapter System: <strong className="text-cyan-400">{testResult.system}</strong></span>
              <span>Status: <strong className="text-amber-400">{testResult.status}</strong></span>
            </div>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              {testResult.message}
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
              Schema: {testResult.schema_version} • Gateway Status: {testResult.connection_status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

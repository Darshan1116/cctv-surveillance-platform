import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, FileCheck, RefreshCw, CheckCircle2, XCircle, Hash, Clock, Copy, Check } from 'lucide-react';

export default function EvidenceVaultPage() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evidence');
      const data = await res.json();
      setEvidenceList(data);
    } catch (err) {
      console.error("Failed to fetch evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleVerify = async (evidenceId) => {
    setVerifyingId(evidenceId);
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/verify`, { method: 'POST' });
      const result = await res.json();
      setVerificationResult(result);
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Chain of Custody</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            SHA-256 Cryptographic Evidence Vault
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Every critical detection snapshot, watchlist match, and IoT sensor trigger is cryptographically hashed with SHA-256 during frame ingestion to prevent post-incident tampering.
          </p>
        </div>

        <button
          onClick={fetchEvidence}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Active Verification Toast/Modal */}
      {verificationResult && (
        <div className={`p-5 rounded-2xl border transition-all shadow-xl ${
          verificationResult.is_valid
            ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-100 shadow-emerald-950/30'
            : 'bg-red-950/70 border-red-500/80 text-red-100 shadow-red-950/30'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {verificationResult.is_valid ? (
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-wide">
                    {verificationResult.result}
                  </span>
                  <span className="text-xs font-mono-code opacity-80 px-2 py-0.5 rounded bg-black/30">
                    Record #{verificationResult.evidence_id} ({verificationResult.filename})
                  </span>
                </div>
                <div className="text-xs space-y-1 font-mono-code bg-black/40 p-3 rounded-xl border border-white/10 mt-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Stored Hash:</span>
                    <span className="font-bold text-cyan-300">{verificationResult.stored_hash}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Calculated Hash:</span>
                    <span className="font-bold text-emerald-300">{verificationResult.calculated_hash}</span>
                  </div>
                </div>
                <div className="text-[11px] opacity-80 pt-1">
                  Cryptographic verification confirms binary payload exactly matches ingestion fingerprint. Zero tampering detected.
                </div>
              </div>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="px-3 py-1.5 bg-black/30 hover:bg-black/50 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Evidence Table Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Secured Audit Logs & Snapshot Hashes
          </span>
          <span className="text-xs text-slate-400 font-mono-code font-bold">
            {evidenceList.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Record ID</th>
                <th className="py-3.5 px-4">Node</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Filename</th>
                <th className="py-3.5 px-4">SHA-256 Hash</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-code">
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-sans text-sm">
                    No evidence records logged yet. Trigger a watchlist match or IoT sensor to capture evidence.
                  </td>
                </tr>
              ) : (
                evidenceList.map((ev) => (
                  <tr key={ev.evidence_id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-bold">#{ev.evidence_id}</td>
                    <td className="py-3.5 px-4 text-cyan-400 uppercase font-bold">{ev.camera_id}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">{ev.filename}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-mono-code">
                          {ev.sha256.substring(0, 12)}...{ev.sha256.substring(ev.sha256.length - 8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(ev.sha256, ev.evidence_id)}
                          className="text-slate-500 hover:text-slate-300 cursor-pointer"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copiedHash === ev.evidence_id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleVerify(ev.evidence_id)}
                        disabled={verifyingId === ev.evidence_id}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{verifyingId === ev.evidence_id ? 'Verifying...' : 'Verify Hash'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

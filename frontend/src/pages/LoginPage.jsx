import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, Activity, Video, AlertCircle } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate enterprise authentication handshake
    setTimeout(() => {
      setLoading(false);
      onLogin({
        email: email.trim(),
        name: email.split('@')[0].replace('.', ' ').toUpperCase() || 'OFFICER IN CHARGE',
        role: 'Senior Surveillance Analyst',
        badge: 'GJ-POLICE-SOC-409',
        loginTime: new Date().toISOString()
      });
    }, 600);
  };

  const handleDemoLogin = () => {
    setEmail('officer.patel@gujarat.police.gov.in');
    setPassword('Suraksha@2026');
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      onLogin({
        email: 'officer.patel@gujarat.police.gov.in',
        name: 'INSP. D. PATEL',
        role: 'Senior SOC Supervisor',
        badge: 'GJ-POLICE-SOC-101',
        loginTime: new Date().toISOString()
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle Background Radial Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 px-6 py-6 border-b border-slate-800 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-950/50">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            NETRA<span className="text-cyan-400">SURAKSHA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Gujarat Police Integrated CCTV AI Surveillance Network
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono-code font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SOC SYSTEM OPERATIONAL
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Official Email / Badge ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@gujarat.police.gov.in"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="????????????"
                className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-mono-code"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              * Any credentials will be accepted for prototype evaluation.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 px-4 bg-slate-800/80 hover:bg-slate-800 text-cyan-400 font-medium text-xs rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Demo Officer Login</span>
            </button>
          </div>
        </form>

        {/* Footer Security Badge */}
        <div className="bg-slate-950/80 px-6 py-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Gujarat State Surveillance SOC</span>
          <span className="font-mono-code text-cyan-400/80">SHA-256 Validated</span>
        </div>
      </div>

      {/* System Features Preview */}
      <div className="mt-8 max-w-lg w-full grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <Video className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <div className="text-[11px] font-semibold text-slate-300">Live Ingestion</div>
          <div className="text-[10px] text-slate-500">3 Node Feeds</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <Activity className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-[11px] font-semibold text-slate-300">Camera Trust</div>
          <div className="text-[10px] text-slate-500">Anti-Tamper USP</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <Lock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-[11px] font-semibold text-slate-300">Evidence Vault</div>
          <div className="text-[10px] text-slate-500">Cryptographic</div>
        </div>
      </div>
    </div>
  );
}

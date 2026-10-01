import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'cyan', highlight = false }) {
  const colorMap = {
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-950/20'
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-950/20'
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-950/20'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-950/20'
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      glow: 'shadow-red-950/20'
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      highlight
        ? 'bg-[#111827] border-red-500/50 shadow-lg shadow-red-950/30'
        : 'bg-[#111827] border-slate-800/80 hover:border-slate-700 shadow-md'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono-code text-white tracking-tight">
          {value}
        </span>
      </div>

      {subtext && (
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}

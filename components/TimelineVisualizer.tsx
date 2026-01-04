import React from 'react';
import { AnalysisResult } from '../types';

interface Props {
  segments: AnalysisResult['segments'];
}

const TimelineVisualizer: React.FC<Props> = ({ segments }) => {
  if (!segments || segments.length === 0) return null;

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-8 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
        <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        Detection Timeline
      </h3>
      
      <div className="relative border-l-2 border-slate-700/50 ml-4 space-y-10 pb-4">
        {segments.map((segment, idx) => (
          <div key={idx} className="relative pl-10 group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125 ${
               segment.likelihood === 'high' ? 'bg-slate-900 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
               segment.likelihood === 'medium' ? 'bg-slate-900 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 
               'bg-slate-900 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            }`}></div>
            
            <div className="flex flex-col md:flex-row gap-5 items-start bg-slate-800/40 p-5 rounded-2xl border border-white/5 hover:bg-slate-800/60 hover:border-white/10 transition-all shadow-sm">
              <div className="shrink-0 flex flex-col items-center gap-2">
                <span className="font-mono text-xl font-black text-white bg-slate-950/50 px-4 py-1.5 rounded-lg border border-slate-700/50 min-w-[80px] text-center">
                  {segment.timestamp || "00:00"}
                </span>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${getLikelihoodColor(segment.likelihood)}`}>
                    {segment.likelihood} Risk
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest border border-slate-700/50 px-2 py-0.5 rounded-md bg-slate-900/50">
                    {segment.anomalyType}
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-light">
                  {segment.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineVisualizer;
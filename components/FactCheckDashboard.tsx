import React from 'react';
import { FactCheckResult } from '../types';

interface Props {
  data: FactCheckResult;
}

const FactCheckDashboard: React.FC<Props> = ({ data }) => {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'true': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'false': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'misleading': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'partially-true': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Credibility Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * data.overallCredibility) / 100}
                className={data.overallCredibility > 70 ? "text-emerald-500" : data.overallCredibility > 40 ? "text-yellow-500" : "text-rose-500"}
              />
            </svg>
            <span className="absolute text-2xl font-bold text-white">{data.overallCredibility}%</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Truth Authentication Report</h2>
            <p className="text-slate-400 leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Claim Verification
          </h3>
          {data.claims.map((c, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start mb-3 gap-4">
                <p className="text-white font-medium italic">"{c.claim}"</p>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border whitespace-nowrap ${getVerdictColor(c.verdict)}`}>
                  {c.verdict.replace('-', ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4">{c.explanation}</p>
              <div className="flex flex-wrap gap-2">
                {c.sources.map((src, si) => (
                  <a key={si} href={src.uri} target="_blank" rel="noreferrer" className="text-xs bg-slate-800 text-indigo-400 px-2 py-1 rounded hover:bg-slate-700 transition-colors border border-slate-700">
                    {src.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Side Panel: Bias & Fallacies */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Bias Analysis
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">{data.biasAnalysis.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data.biasAnalysis.intensity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {data.biasAnalysis.intensity} intensity
                </span>
              </div>
              <p className="text-sm text-slate-400 italic">{data.biasAnalysis.description}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Logical Fallacies
            </h3>
            {data.logicalFallacies.length > 0 ? (
              <ul className="space-y-2">
                {data.logicalFallacies.map((fallacy, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                    {fallacy}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No major logical fallacies detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactCheckDashboard;

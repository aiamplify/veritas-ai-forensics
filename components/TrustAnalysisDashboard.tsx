import React from 'react';
import { TrustAnalysisResult } from '../types';

interface Props {
  data: TrustAnalysisResult;
}

const TrustAnalysisDashboard: React.FC<Props> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'SAFE': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'CAUTION': return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
      case 'SCAM': return 'bg-red-600/10 text-red-300 border-red-500/20';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Score Header */}
      <div className="glass-panel rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          {/* Trust Meter */}
          <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                strokeDasharray={439}
                strokeDashoffset={439 - (439 * data.trustScore) / 100}
                className={`${getScoreColor(data.trustScore)} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-black tracking-tighter ${getScoreColor(data.trustScore)}`}>{data.trustScore}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Trust Score</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">Trust Assessment</h2>
                <span className={`px-4 py-1.5 rounded-lg border text-sm font-bold tracking-wider ${getVerdictBadge(data.verdict)}`}>
                  {data.verdict}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed max-w-2xl text-lg font-light">{data.summary}</p>
            </div>
            
            {data.businessDetails && (
              <div className="flex flex-wrap gap-6 text-xs text-slate-400 pt-6 border-t border-white/5">
                {data.businessDetails.name && <span className="flex items-center gap-2"><div className="p-1.5 bg-slate-800 rounded-md"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div> <span className="font-medium">{data.businessDetails.name}</span></span>}
                {data.businessDetails.ageEstimate && <span className="flex items-center gap-2"><div className="p-1.5 bg-slate-800 rounded-md"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div> <span className="font-medium">{data.businessDetails.ageEstimate}</span></span>}
                {data.businessDetails.location && <span className="flex items-center gap-2"><div className="p-1.5 bg-slate-800 rounded-md"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div> <span className="font-medium">{data.businessDetails.location}</span></span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Factors */}
        <div className="glass-panel border-l-4 border-l-red-500/50 rounded-2xl p-6">
          <h3 className="text-red-400 font-bold mb-5 flex items-center gap-2 uppercase text-sm tracking-wider">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Risk Factors
          </h3>
          {data.riskFactors.length > 0 ? (
            <ul className="space-y-3">
              {data.riskFactors.map((risk, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                  <span className="shrink-0 w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></span>
                  {risk}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm italic">No major risk factors detected.</p>
          )}
        </div>

        {/* Trust Signals */}
        <div className="glass-panel border-l-4 border-l-emerald-500/50 rounded-2xl p-6">
          <h3 className="text-emerald-400 font-bold mb-5 flex items-center gap-2 uppercase text-sm tracking-wider">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Trust Signals
          </h3>
          {data.trustSignals.length > 0 ? (
            <ul className="space-y-3">
              {data.trustSignals.map((signal, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                  <span className="shrink-0 w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2"></span>
                  {signal}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm italic">No strong trust signals found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrustAnalysisDashboard;
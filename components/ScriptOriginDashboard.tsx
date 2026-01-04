import React from 'react';
import { ScriptOriginResult } from '../types';

interface Props {
  data: ScriptOriginResult;
}

const ScriptOriginDashboard: React.FC<Props> = ({ data }) => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Attribution Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-indigo-500">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-2xl font-bold text-white">Script Authenticity</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${data.isOriginal ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {data.isOriginal ? 'ORIGINAL SCRIPT' : 'DERIVATIVE WORK'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-3xl">{data.attributionSummary}</p>
          </div>
          <div className="ml-auto flex flex-col items-center">
            <div className="text-4xl font-black text-indigo-400">{data.originalityScore}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Originality</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Matches */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Matched Literature & Sources
          </h3>
          {data.matchedSources.length > 0 ? (
            <div className="space-y-4">
              {data.matchedSources.map((source, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/50 transition-all border-l-4 border-l-indigo-500">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-bold">{source.sourceTitle}</h4>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                      {Math.round(source.similarity * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300 mb-3 font-medium">By {source.author} • <span className="uppercase">{source.type}</span></p>
                  <blockquote className="text-sm text-slate-400 italic bg-slate-950/50 p-3 rounded mb-4 border-l-2 border-slate-700">
                    "{source.textSnippet}"
                  </blockquote>
                  <a href={source.uri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                    View Original Source
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-10 text-center">
              <p className="text-slate-500 italic">No external script sources detected. Content appears unique.</p>
            </div>
          )}
        </div>

        {/* Sidebar Context */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Literary Context</h3>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              {data.literaryContext || "No additional literary context available for this analysis."}
            </p>
          </div>
          
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-5">
             <h4 className="text-indigo-300 font-bold text-xs uppercase mb-2">Fair Use Tip</h4>
             <p className="text-[11px] text-slate-400">
               Directly using script text from books without attribution can lead to copyright strikes or plagiarism claims. Always cite your sources!
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptOriginDashboard;

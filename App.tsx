import React, { useState } from 'react';
import { AnalysisResult, AnalysisMode, FactCheckResult, ScriptOriginResult, TrustAnalysisResult } from './types';
import { analyzeMedia, authenticateInformation, checkScriptOrigin, analyzeTrust, saveAnalysis } from './src/services/api';
import { useAuth } from './src/contexts/AuthContext';
import AuthButton from './src/components/AuthButton';
import HistorySidebar from './src/components/HistorySidebar';
import LiveVoiceAgent from './components/LiveVoiceAgent';
import ChatInterface from './components/ChatInterface';
import FactCheckDashboard from './components/FactCheckDashboard';
import ScriptOriginDashboard from './components/ScriptOriginDashboard';
import TrustAnalysisDashboard from './components/TrustAnalysisDashboard';
import TimelineVisualizer from './components/TimelineVisualizer';

const App: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'video' | 'image' | 'truth' | 'script' | 'trust'>('video');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [channelNameInput, setChannelNameInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.FAST);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [truthResult, setTruthResult] = useState<FactCheckResult | null>(null);
  const [scriptResult, setScriptResult] = useState<ScriptOriginResult | null>(null);
  const [trustResult, setTrustResult] = useState<TrustAnalysisResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      resetResults();
    }
  };

  const resetResults = () => {
    setResult(null);
    setTruthResult(null);
    setScriptResult(null);
    setTrustResult(null);
    setError(null);
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSelectFromHistory = (item: { type: string; input: string; result: Record<string, unknown> }) => {
    resetResults();
    setActiveTab(item.type === 'fact-check' ? 'truth' : item.type as typeof activeTab);
    setUrlInput(item.input);

    if (item.type === 'video' || item.type === 'image') {
      setResult(item.result as unknown as AnalysisResult);
    } else if (item.type === 'fact-check') {
      setTruthResult(item.result as unknown as FactCheckResult);
    } else if (item.type === 'script') {
      setScriptResult(item.result as unknown as ScriptOriginResult);
    } else if (item.type === 'trust') {
      setTrustResult(item.result as unknown as TrustAnalysisResult);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    resetResults();

    try {
      let analysisType = activeTab === 'truth' ? 'fact-check' : activeTab;
      let inputForHistory = urlInput || textInput;

      if (activeTab === 'trust') {
        if (!urlInput) return;
        const data = await analyzeTrust(urlInput);
        setTrustResult(data);
        if (user) saveAnalysis('trust', urlInput, data as unknown as Record<string, unknown>);
      } else if (activeTab === 'script') {
        if (!urlInput) return;
        const data = await checkScriptOrigin(urlInput, videoTitleInput, channelNameInput);
        setScriptResult(data);
        if (user) saveAnalysis('script', urlInput, data as unknown as Record<string, unknown>);
      } else if (activeTab === 'truth') {
        const data = await authenticateInformation(urlInput || textInput, urlInput ? 'url' : 'text');
        setTruthResult(data);
        if (user) saveAnalysis('fact-check', urlInput || textInput, data as unknown as Record<string, unknown>);
      } else {
        let inputData = '';
        let type: 'url' | 'image' = 'url';
        if (activeTab === 'video') {
          if (!urlInput) return;
          inputData = urlInput;
          type = 'url';
        } else {
          if (!imagePreview) return;
          inputData = imagePreview.split(',')[1];
          type = 'image';
          inputForHistory = 'Image Upload';
        }
        const data = await analyzeMedia(inputData, type, analysisMode);
        setResult(data);
        if (user) saveAnalysis(activeTab, inputForHistory, data as unknown as Record<string, unknown>);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-200 p-4 md:p-8">
      {/* History Sidebar */}
      <HistorySidebar onSelectAnalysis={handleSelectFromHistory} />

      {/* Header Section */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 mb-2 drop-shadow-sm">
            Veritas AI
          </h1>
          <p className="text-slate-400 text-lg font-light tracking-wide">
            Next-Gen Forensics & Fact-Checking Engine
          </p>
        </div>
        <div className="flex items-center gap-4">
          {(activeTab === 'video' || activeTab === 'image') && (
            <div className="flex flex-col items-end gap-2">
               <div className="glass-panel p-1 rounded-xl flex items-center gap-1 shadow-lg">
                 <button
                   onClick={() => setAnalysisMode(AnalysisMode.FAST)}
                   className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${analysisMode === AnalysisMode.FAST ? 'bg-slate-700/80 text-cyan-300 shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   Fast Mode
                 </button>
                 <button
                   onClick={() => setAnalysisMode(AnalysisMode.DEEP)}
                   className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${analysisMode === AnalysisMode.DEEP ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                   Deep Scan
                 </button>
               </div>
               <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mr-1 opacity-70">
                 {analysisMode === AnalysisMode.FAST ? 'Gemini Flash' : 'Gemini Pro'}
               </span>
            </div>
          )}
          <AuthButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-200 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Main Control Panel */}
          <section className="glass-panel rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
             {/* Gradient Glow */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>

             <div className="bg-slate-950/50 rounded-[22px] p-6 md:p-8">
               {/* Navigation Tabs */}
               <nav className="flex flex-wrap md:flex-nowrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 mb-8">
                 {[
                   { id: 'video', label: 'Forensics', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                   { id: 'image', label: 'Image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                   { id: 'truth', label: 'Fact Check', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                   { id: 'script', label: 'Script', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                   { id: 'trust', label: 'Trust', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => { setActiveTab(tab.id as typeof activeTab); resetResults(); }}
                     className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                     <span className="hidden md:inline">{tab.label}</span>
                   </button>
                 ))}
               </nav>

               {/* Input Section */}
               <div className="space-y-6 animate-fade-in">
                 {activeTab === 'trust' && (
                   <div className="group relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-400 transition-colors">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                     </div>
                     <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Enter Website or Product URL" className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all shadow-inner" />
                   </div>
                 )}

                 {activeTab === 'script' && (
                   <div className="space-y-4">
                     <div className="group relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="YouTube Video URL" className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner" />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input type="text" value={videoTitleInput} onChange={(e) => setVideoTitleInput(e.target.value)} placeholder="Video Title (Optional)" className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                       <input type="text" value={channelNameInput} onChange={(e) => setChannelNameInput(e.target.value)} placeholder="Channel Name (Optional)" className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                     </div>
                   </div>
                 )}

                 {activeTab === 'truth' && (
                   <div className="grid grid-cols-1 gap-4">
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <input type="text" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setTextInput(''); }} placeholder="Paste URL to Fact-Check" className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner" />
                      </div>
                      <div className="relative">
                        <div className="absolute top-4 left-4 text-slate-500 pointer-events-none">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        </div>
                        <textarea value={textInput} onChange={(e) => { setTextInput(e.target.value); setUrlInput(''); }} placeholder="Or paste text/claims directly here..." className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner h-24 resize-none leading-relaxed" />
                      </div>
                   </div>
                 )}

                 {(activeTab === 'video' || activeTab === 'image') && (
                   <div className="flex-1">
                     {activeTab === 'video' ? (
                       <div className="group relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                         </div>
                         <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="YouTube Video URL" className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner" />
                       </div>
                     ) : (
                       <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all group">
                         <div className="flex flex-col items-center justify-center pt-5 pb-6">
                           <svg className="w-8 h-8 mb-3 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                           <p className="text-sm text-slate-400 group-hover:text-slate-300">Click to upload image for analysis</p>
                         </div>
                         <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                       </label>
                     )}
                   </div>
                 )}

                 <div className="flex justify-end pt-2">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || (!urlInput && !textInput && !imageFile)}
                      className={`
                        relative overflow-hidden group px-10 py-3.5 rounded-xl font-bold text-white shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
                        ${activeTab === 'truth' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-500/25' :
                          activeTab === 'trust' ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/25' :
                          'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-indigo-500/25'}
                      `}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isAnalyzing ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Analyzing...
                          </>
                        ) : (
                          <>
                             {activeTab === 'trust' ? 'Scan for Scams' : activeTab === 'script' ? 'Check Origin' : 'Run Analysis'}
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </>
                        )}
                      </span>
                    </button>
                 </div>
               </div>

               {/* Media Preview Area */}
               <div className="mt-8 relative">
                  {activeTab === 'image' && imagePreview && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 bg-black/40 backdrop-blur-sm flex justify-center h-96 group shadow-2xl">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                      <img src={imagePreview} alt="Preview" className="h-full object-contain relative z-10" />

                      {/* Image Confidence Overlay */}
                      {result && !isAnalyzing && (
                         <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-2xl shadow-2xl animate-fade-in z-20 border-t border-white/10">
                            <div className="flex items-center gap-4">
                               <div className="relative">
                                 <div className={`w-4 h-4 rounded-full ${result.isGenerated ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                 <div className={`absolute inset-0 w-4 h-4 rounded-full ${result.isGenerated ? 'bg-red-500' : 'bg-emerald-500'} animate-ping opacity-75`}></div>
                               </div>
                               <div>
                                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Likelihood</div>
                                  <div className={`text-2xl font-black ${result.isGenerated ? 'text-red-400' : 'text-emerald-400'}`}>{result.confidence}%</div>
                               </div>
                            </div>
                         </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'video' && urlInput && getYoutubeId(urlInput) && (
                     <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/50 bg-black shadow-2xl group">
                       <iframe
                         src={`https://www.youtube.com/embed/${getYoutubeId(urlInput)}`}
                         className="w-full h-full relative z-10"
                         allowFullScreen
                         title="Video Analysis"
                       ></iframe>
                       {/* Video Confidence Overlay */}
                       {result && !isAnalyzing && (
                          <div className="absolute top-6 right-6 glass-panel p-5 rounded-2xl shadow-2xl animate-fade-in z-20 min-w-[200px] border-t border-white/10">
                            <div className="flex items-center justify-between mb-3">
                               <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Confidence</span>
                               <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${result.isGenerated ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
                                 {result.isGenerated ? 'FAKE' : 'REAL'}
                               </span>
                            </div>
                            <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                               <div
                                 className={`h-full transition-all duration-1000 ease-out ${result.isGenerated ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                                 style={{ width: `${result.confidence}%` }}
                               ></div>
                            </div>
                            <div className="text-right mt-1.5 text-xs font-mono text-white opacity-75">{result.confidence}%</div>
                          </div>
                       )}
                     </div>
                  )}
               </div>
             </div>
          </section>

          {/* Results Sections */}
          {trustResult && <TrustAnalysisDashboard data={trustResult} />}
          {scriptResult && <ScriptOriginDashboard data={scriptResult} />}
          {truthResult && <FactCheckDashboard data={truthResult} />}

          {result && (
            <div className="space-y-8 animate-slide-up">
               {/* New Timeline Visualizer */}
               <TimelineVisualizer segments={result.segments} />

               <section className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
                <div className={`p-8 border-b border-white/5 flex justify-between items-center ${result.isGenerated ? 'bg-red-900/10' : 'bg-emerald-900/10'}`}>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Forensic Summary</h2>
                    <p className="text-sm text-slate-400">Analysis completed using Gemini</p>
                  </div>
                  <div className={`text-4xl font-black tracking-tighter ${result.isGenerated ? 'text-red-400' : 'text-emerald-400'}`}>{result.isGenerated ? 'AI DETECTED' : 'AUTHENTIC'}</div>
                </div>
                <div className="p-8 space-y-6 text-slate-300">
                  <p className="text-lg leading-relaxed font-light">{result.summary}</p>

                  {result.safetyConcerns && result.safetyConcerns.length > 0 && (
                    <div className="bg-orange-950/30 border border-orange-500/20 p-6 rounded-2xl mt-4 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                       <h4 className="font-bold text-orange-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                         Safety Concerns
                       </h4>
                       <ul className="space-y-3">
                         {result.safetyConcerns.map((s, i) => (
                           <li key={i} className="flex gap-3 text-sm text-orange-100/80">
                             <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                             {s}
                           </li>
                         ))}
                       </ul>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {isAnalyzing && (
            <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center animate-pulse-slow">
               <div className="relative mb-8">
                 <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                 <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin relative z-10"></div>
               </div>
               <p className="text-slate-200 text-xl font-semibold tracking-tight">Analyzing content integrity...</p>
               <p className="text-slate-500 text-sm mt-3 font-medium">Checking global databases and deepfake patterns</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <LiveVoiceAgent />
          <ChatInterface analysisContext={JSON.stringify(result || truthResult || scriptResult || trustResult || {})} />
        </div>
      </main>
    </div>
  );
};

export default App;

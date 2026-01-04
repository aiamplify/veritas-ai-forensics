import React, { useEffect, useRef, useState } from 'react';
import { connectLiveAgent, createPCM16Blob } from '../services/geminiService';
import { LiveConnectionState } from '../types';

const LiveVoiceAgent: React.FC = () => {
  const [state, setState] = useState<LiveConnectionState>({
    isConnected: false,
    isSpeaking: false,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);

  const startSession = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputContextRef.current.createMediaStreamSource(stream);
      const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPCM16Blob(inputData);
        sessionRef.current.sendRealtimeInput({ media: pcmBlob });
      };

      source.connect(processor);
      processor.connect(inputContextRef.current.destination);

      const session = await connectLiveAgent(
        async (audioBufferRaw) => {
           if (!audioContextRef.current) return;
           const dataInt16 = new Int16Array(audioBufferRaw);
           const audioCtx = audioContextRef.current;
           const float32Data = new Float32Array(dataInt16.length);
           for(let i=0; i<dataInt16.length; i++) {
             float32Data[i] = dataInt16[i] / 32768.0;
           }
           const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
           buffer.copyToChannel(float32Data, 0);
           const playSource = audioCtx.createBufferSource();
           playSource.buffer = buffer;
           playSource.connect(audioCtx.destination);
           const startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
           playSource.start(startTime);
           nextStartTimeRef.current = startTime + buffer.duration;
           
           setState(prev => ({ ...prev, isSpeaking: true }));
           playSource.onended = () => {
             if (audioCtx.currentTime >= nextStartTimeRef.current) {
                 setState(prev => ({ ...prev, isSpeaking: false }));
             }
           };
        },
        () => {
          stopSession();
        }
      );

      sessionRef.current = session;
      setState({ isConnected: true, isSpeaking: false, error: null });

    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, error: "Microphone access denied." }));
    }
  };

  const stopSession = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    inputContextRef.current?.close();
    sessionRef.current = null;
    setState({ isConnected: false, isSpeaking: false, error: null });
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            Veritas Live
            {state.isConnected && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
          </h3>
          <p className="text-slate-400 text-xs font-medium">Real-time voice verification</p>
        </div>

        <div className="relative w-28 h-28 flex items-center justify-center">
           {/* Visualizer rings */}
           {state.isConnected && (
             <>
               <div className={`absolute inset-0 rounded-full border border-indigo-500/30 ${state.isSpeaking ? 'animate-ping' : ''}`}></div>
               <div className={`absolute inset-4 rounded-full border border-indigo-400/20 ${state.isSpeaking ? 'animate-pulse' : ''}`}></div>
             </>
           )}
           
           <button
             onClick={state.isConnected ? stopSession : startSession}
             className={`
               w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95
               ${state.isConnected 
                 ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/30' 
                 : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/30'}
             `}
           >
              {state.isConnected ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              )}
           </button>
        </div>

        {state.error && <p className="text-red-400 text-xs font-medium bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">{state.error}</p>}
        
        <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
           {state.isConnected ? (state.isSpeaking ? "Voice Active" : "Listening...") : "Tap to Speak"}
        </p>
      </div>
    </div>
  );
};

export default LiveVoiceAgent;
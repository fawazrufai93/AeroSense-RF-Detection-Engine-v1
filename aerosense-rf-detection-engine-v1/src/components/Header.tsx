import React, { useState, useEffect } from 'react';
import { RFParameters } from '../types/rf';

interface HeaderProps {
  isStreaming: boolean;
  onToggleStreaming: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  isSignalDetected: boolean;
  detectedClass: string;
  onResetStats: () => void;
  onRunBatchTest: () => void;
  onOpenExport: () => void;
  params: RFParameters;
}

export const Header: React.FC<HeaderProps> = ({
  isStreaming,
  onToggleStreaming,
  audioEnabled,
  onToggleAudio,
  isSignalDetected,
  detectedClass,
  onResetStats,
  onRunBatchTest,
  onOpenExport,
  params
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().substring(11, 23) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Project Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
            <i className="fa-solid fa-satellite-dish text-lg animate-pulse"></i>
            {isSignalDetected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                AeroSense RF Detection Engine
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  v1.0
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              DSP Surveillance &middot; CFAR Energy Detection &middot; Machine Learning Classification
            </p>
          </div>
        </div>

        {/* Operational Indicators & Status Badge */}
        <div className="flex items-center gap-3">
          {/* Operational Status Badge */}
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
              isSignalDetected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 glow-emerald'
                : 'bg-slate-800/80 text-cyan-400 border-cyan-700/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              isSignalDetected ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
            }`}></span>
            <span>
              {isSignalDetected ? 'SIGNAL INTERCEPTED' : 'MONITORING ACTIVE'}
            </span>
          </div>

          {/* Live UTC Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
            <i className="fa-regular fa-clock text-cyan-400"></i>
            <span>{utcTime || '00:00:00.000 UTC'}</span>
          </div>

          {/* System Health / Telemetry Quick Ticker */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400">
            <span title="Analog-to-Digital Converter Sampling Rate">
              <span className="text-slate-500">SPS:</span> <strong className="text-slate-200">40 MS/s</strong>
            </span>
            <span className="text-slate-700">&bull;</span>
            <span title="Center Frequency">
              <span className="text-slate-500">Fc:</span> <strong className="text-cyan-300">{params.centerFreq} MHz</strong>
            </span>
            <span className="text-slate-700">&bull;</span>
            <span title="Detection Algorithm">
              <span className="text-slate-500">Mode:</span> <strong className={params.cfarMode ? 'text-amber-400' : 'text-slate-300'}>{params.cfarMode ? 'CA-CFAR' : 'Fixed'}</strong>
            </span>
          </div>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={onToggleAudio}
            title={audioEnabled ? "Mute RF Chirp Audio" : "Enable RF Audio Synthesizer"}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              audioEnabled 
                ? 'bg-cyan-950/70 border-cyan-600 text-cyan-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className={`fa-solid ${audioEnabled ? 'fa-volume-high' : 'fa-volume-xmark'} w-4 text-center`}></i>
          </button>

          {/* Pause / Resume Live Streaming */}
          <button
            onClick={onToggleStreaming}
            title={isStreaming ? "Pause Spectrum Sweep" : "Resume Spectrum Sweep"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isStreaming
                ? 'bg-amber-950/50 border-amber-700/60 text-amber-300 hover:bg-amber-900/60'
                : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            <i className={`fa-solid ${isStreaming ? 'fa-pause' : 'fa-play'} text-xs`}></i>
            <span className="hidden sm:inline">{isStreaming ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Run 100-frame Monte Carlo Batch */}
          <button
            onClick={onRunBatchTest}
            title="Execute automated 100-trial Monte Carlo benchmark"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/70 text-xs font-medium transition-all"
          >
            <i className="fa-solid fa-microchip text-xs"></i>
            <span className="hidden sm:inline">100-Trial Test</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenExport}
            title="Export Telemetry Data & Internship Report"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-medium transition-all"
          >
            <i className="fa-solid fa-file-export text-xs"></i>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};

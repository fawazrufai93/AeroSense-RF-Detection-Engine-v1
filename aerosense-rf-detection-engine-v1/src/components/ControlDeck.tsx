import React from 'react';
import { RFParameters, SignalPresetType } from '../types/rf';

interface ControlDeckProps {
  params: RFParameters;
  onChangeParams: (newParams: Partial<RFParameters>) => void;
  onApplyPreset: (preset: SignalPresetType) => void;
  onResetToDefaults: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  params,
  onChangeParams,
  onApplyPreset,
  onResetToDefaults,
}) => {
  // Common frequency band presets (ISM & Drone standard bands)
  const freqBands = [
    { label: '433 MHz (Telemetry)', freq: 433 },
    { label: '915 MHz (Long Range)', freq: 915 },
    { label: '2.44 GHz (ISM / Drone)', freq: 2440 },
    { label: '5.80 GHz (Video Link)', freq: 5800 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-sliders text-cyan-400"></i>
          <h2 className="text-sm font-bold tracking-wide text-white uppercase">
            RF Control Deck
          </h2>
        </div>
        <button
          onClick={onResetToDefaults}
          className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          title="Reset to calibrated defaults"
        >
          <i className="fa-solid fa-rotate-left text-[10px]"></i>
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Action Buttons (High Priority from User Prompt) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            RF Scenario Presets
          </label>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            One-Click
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Preset 1: Inject Drone Signal */}
          <button
            onClick={() => onApplyPreset('drone_dji')}
            className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
              params.activePreset === 'drone_dji'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                : 'bg-slate-800/80 border-slate-700 hover:border-cyan-600/60 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs">
              <i className="fa-solid fa-helicopter text-cyan-400"></i>
              <span>Inject Drone Signal</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 leading-tight">
              DJI OcuSync FHSS pulses, high crest factor, narrow peak.
            </span>
          </button>

          {/* Preset 2: Simulate High Noise / False Alarm */}
          <button
            onClick={() => onApplyPreset('high_noise')}
            className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
              params.activePreset === 'high_noise'
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50'
                : 'bg-slate-800/80 border-slate-700 hover:border-rose-600/60 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs">
              <i className="fa-solid fa-bolt-lightning text-rose-400"></i>
              <span>Simulate High Noise</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 leading-tight">
              Elevated thermal floor + spurious transients causing false alarms.
            </span>
          </button>

          {/* Preset 3: Test Overlapping Signals */}
          <button
            onClick={() => onApplyPreset('overlapping')}
            className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
              params.activePreset === 'overlapping'
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-950/50'
                : 'bg-slate-800/80 border-slate-700 hover:border-purple-600/60 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs">
              <i className="fa-solid fa-layer-group text-purple-400"></i>
              <span>Test Overlapping</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 leading-tight">
              Drone controller co-existing with 20MHz 802.11ax Wi-Fi.
            </span>
          </button>
        </div>

        {/* Secondary quick presets */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => onApplyPreset('weak_drone')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              params.activePreset === 'weak_drone'
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-signal mr-1.5 text-[10px] text-amber-400"></i>
            Weak Drone (Borderline SNR)
          </button>

          <button
            onClick={() => onApplyPreset('wifi_interference')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              params.activePreset === 'wifi_interference'
                ? 'bg-blue-950/80 border-blue-500 text-blue-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-wifi mr-1.5 text-[10px] text-blue-400"></i>
            Wi-Fi Only (802.11ax)
          </button>

          <button
            onClick={() => onApplyPreset('idle')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              params.activePreset === 'idle'
                ? 'bg-slate-800 border-slate-600 text-slate-100'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-waveform-lines mr-1.5 text-[10px]"></i>
            Quiet / Thermal Baseline
          </button>
        </div>
      </div>

      {/* Primary Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Slider 1: Signal-to-Noise Ratio (SNR) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              SNR (Signal-to-Noise)
            </label>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {params.snr > 0 ? `+${params.snr}` : params.snr} dB
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="35"
            step="1"
            value={params.snr}
            onChange={(e) => onChangeParams({ snr: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>-10 dB (Sub-noise)</span>
            <span>+15 dB</span>
            <span>+35 dB (Clean)</span>
          </div>
        </div>

        {/* Slider 2: Noise Floor (dBm) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Noise Floor (P_n)
            </label>
            <span className="text-xs font-mono font-bold text-slate-300">
              {params.noiseFloor} dBm
            </span>
          </div>
          <input
            type="range"
            min="-120"
            max="-60"
            step="1"
            value={params.noiseFloor}
            onChange={(e) => onChangeParams({ noiseFloor: Number(e.target.value) })}
            className="w-full accent-slate-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>-120 dBm (Thermal)</span>
            <span>-95 dBm</span>
            <span>-60 dBm (Noisy)</span>
          </div>
        </div>

        {/* Slider 3: Center Frequency (MHz) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Center Frequency (Fc)
            </label>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {params.centerFreq} MHz
            </span>
          </div>
          <div className="flex gap-1 mb-1.5">
            {freqBands.map((b) => (
              <button
                key={b.freq}
                onClick={() => onChangeParams({ centerFreq: b.freq })}
                className={`flex-1 py-0.5 text-[9px] font-mono rounded border transition-colors ${
                  params.centerFreq === b.freq
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                {b.freq >= 1000 ? `${(b.freq / 1000).toFixed(2)}G` : `${b.freq}M`}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="400"
            max="6000"
            step="10"
            value={params.centerFreq}
            onChange={(e) => onChangeParams({ centerFreq: Number(e.target.value) })}
            className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Slider 4: Threshold Sensitivity Multiplier */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Threshold Sensitivity (γ)
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">
              {params.thresholdSensitivity.toFixed(1)}x
              <span className="text-[10px] text-slate-500 ml-1 font-normal">
                (+{(params.thresholdOffsetDb * (params.thresholdSensitivity * 0.75 + 0.25)).toFixed(1)} dB)
              </span>
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={params.thresholdSensitivity}
            onChange={(e) => onChangeParams({ thresholdSensitivity: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
            <span>Aggressive (High Pfa)</span>
            <button
              onClick={() => onChangeParams({ cfarMode: !params.cfarMode })}
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                params.cfarMode
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {params.cfarMode ? 'CA-CFAR ON' : 'FIXED MODE'}
            </button>
            <span>Strict (Low Pd)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

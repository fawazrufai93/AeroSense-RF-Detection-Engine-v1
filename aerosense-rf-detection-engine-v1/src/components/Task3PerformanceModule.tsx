import React from 'react';
import { PerformanceMetrics, SignalPresetType } from '../types/rf';

interface Task3PerformanceModuleProps {
  metrics: PerformanceMetrics;
  onResetMetrics: () => void;
  onRunBatchTest: () => void;
  isBatchRunning: boolean;
  activePreset: SignalPresetType;
  onSelectCondition: (preset: SignalPresetType) => void;
}

export const Task3PerformanceModule: React.FC<Task3PerformanceModuleProps> = ({
  metrics,
  onResetMetrics,
  onRunBatchTest,
  isBatchRunning,
  activePreset,
  onSelectCondition,
}) => {
  // Benchmark scenarios matrix for comparison
  const conditionBenchmarks = [
    {
      id: 'idle' as SignalPresetType,
      name: 'Low Noise (Baseline)',
      expectedPd: 'N/A (No Sig)',
      expectedPfa: '< 1.5%',
      typicalAcc: '99.2%',
      status: 'Optimal',
      badgeClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
    },
    {
      id: 'drone_dji' as SignalPresetType,
      name: 'Drone Signal (Standard)',
      expectedPd: '98.5%',
      expectedPfa: '1.2%',
      typicalAcc: '97.8%',
      status: 'Optimal',
      badgeClass: 'text-cyan-400 bg-cyan-950/60 border-cyan-800'
    },
    {
      id: 'high_noise' as SignalPresetType,
      name: 'High Noise / Thermal',
      expectedPd: '91.2%',
      expectedPfa: '12.4%',
      typicalAcc: '88.0%',
      status: 'Elevated Pfa',
      badgeClass: 'text-rose-400 bg-rose-950/60 border-rose-800'
    },
    {
      id: 'weak_drone' as SignalPresetType,
      name: 'Weak Drone (Low SNR)',
      expectedPd: '82.0%',
      expectedPfa: '3.1%',
      typicalAcc: '84.5%',
      status: 'Challenging',
      badgeClass: 'text-amber-400 bg-amber-950/60 border-amber-800'
    },
    {
      id: 'overlapping' as SignalPresetType,
      name: 'Overlapping (Drone + Wi-Fi)',
      expectedPd: '95.0%',
      expectedPfa: '4.8%',
      typicalAcc: '89.4%',
      status: 'Multi-target',
      badgeClass: 'text-purple-400 bg-purple-950/60 border-purple-800'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-xs">
            M3
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              False Alarm & Performance Analysis
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                Task 3
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Statistical detection probability, ROC metrics & scenario benchmarking
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRunBatchTest}
            disabled={isBatchRunning}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isBatchRunning
                ? 'bg-indigo-950 border border-indigo-700 text-indigo-300 opacity-70 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
            }`}
          >
            <i className={`fa-solid ${isBatchRunning ? 'fa-spinner fa-spin' : 'fa-flask'} text-xs`}></i>
            <span>{isBatchRunning ? 'Running 100 Trials...' : 'Run 100-Trial Test'}</span>
          </button>

          <button
            onClick={onResetMetrics}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Clear accumulated metrics history"
          >
            <i className="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>

      {/* Primary Performance Metrics Cards (Task 3 Core Requirements: Detection Rate, False Alarm Rate, Accuracy) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Detection Rate (%) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">Detection Rate (Pd)</span>
            <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
              TP / (TP + FN)
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {metrics.detectionRate.toFixed(1)}
              <span className="text-lg font-bold ml-0.5">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Probability of true positive interception when RF signal is present.
            </p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.detectionRate)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 2: False Alarm Rate (%) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">False Alarm Rate (Pfa)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              metrics.falseAlarmRate > 5 
                ? 'text-rose-400 bg-rose-950/60 border-rose-800' 
                : 'text-slate-400 bg-slate-800 border-slate-700'
            }`}>
              FP / (FP + TN)
            </span>
          </div>
          <div className="my-2">
            <div className={`text-3xl font-black font-mono ${
              metrics.falseAlarmRate > 5 ? 'text-rose-400' : 'text-slate-200'
            }`}>
              {metrics.falseAlarmRate.toFixed(1)}
              <span className="text-lg font-bold ml-0.5">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Thermal or interference crossing threshold without target.
            </p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.falseAlarmRate > 5 ? 'bg-rose-500' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.min(100, metrics.falseAlarmRate * 5)}%` }} // scale for visual visibility
            ></div>
          </div>
        </div>

        {/* Metric 3: Classification Accuracy (%) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">Classification Accuracy</span>
            <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
              (TP + TN) / Total
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono text-cyan-400">
              {metrics.accuracy.toFixed(1)}
              <span className="text-lg font-bold ml-0.5">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Overall inference correctness across all active sweeps.
            </p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.accuracy)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Frame Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Dynamic Confusion Matrix */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <i className="fa-solid fa-table-cells text-cyan-400"></i>
              Binary Confusion Matrix (Total Frames: {metrics.totalFrames})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Real-Time Accumulator</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
            {/* True Positive */}
            <div className="bg-emerald-950/40 border border-emerald-800/80 p-2.5 rounded-lg">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">True Positive (TP)</div>
              <div className="text-xl font-bold text-emerald-300 mt-1">{metrics.truePositives}</div>
              <div className="text-[10px] text-slate-400">Signal Present & Detected</div>
            </div>

            {/* False Positive / False Alarm */}
            <div className="bg-rose-950/40 border border-rose-800/80 p-2.5 rounded-lg">
              <div className="text-[10px] text-rose-400 uppercase font-semibold">False Positive (FP)</div>
              <div className="text-xl font-bold text-rose-300 mt-1">{metrics.falsePositives}</div>
              <div className="text-[10px] text-slate-400">Noise Triggered Alarm</div>
            </div>

            {/* False Negative / Miss */}
            <div className="bg-amber-950/40 border border-amber-800/80 p-2.5 rounded-lg">
              <div className="text-[10px] text-amber-400 uppercase font-semibold">False Negative (FN)</div>
              <div className="text-xl font-bold text-amber-300 mt-1">{metrics.falseNegatives}</div>
              <div className="text-[10px] text-slate-400">Signal Missed by Threshold</div>
            </div>

            {/* True Negative */}
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">True Negative (TN)</div>
              <div className="text-xl font-bold text-slate-200 mt-1">{metrics.trueNegatives}</div>
              <div className="text-[10px] text-slate-400">Quiet Channel Confirmed</div>
            </div>
          </div>
        </div>

        {/* F1-Score & ROC Tradeoff Breakdown */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-chart-line text-emerald-400"></i>
                Neyman-Pearson & ROC Operating Point
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">CFAR Calibrated</span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              In radar and counter-UAS electronic warfare, increasing threshold sensitivity increases 
              <strong> Detection Rate (Pd)</strong> but raises the risk of <strong>False Alarms (Pfa)</strong>. 
              The current system achieves an empirical F1-Score of{' '}
              <strong className="text-white font-mono">{metrics.f1Score.toFixed(1)}%</strong> with a precision of{' '}
              <strong className="text-cyan-400 font-mono">{metrics.precision.toFixed(1)}%</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Precision</span>
              <span className="font-mono font-bold text-cyan-300">{metrics.precision.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Harmonic Mean (F1)</span>
              <span className="font-mono font-bold text-emerald-300">{metrics.f1Score.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Under Varying Conditions Benchmark Table (User Prompt Requirement) */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 overflow-x-auto">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <i className="fa-solid fa-gauge-high text-amber-400"></i>
            Operational Stress Conditions Benchmark Table
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Click Row to Simulate Scenario</span>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
              <th className="py-1.5 px-2">Operational Scenario</th>
              <th className="py-1.5 px-2">Expected Pd</th>
              <th className="py-1.5 px-2">Expected Pfa</th>
              <th className="py-1.5 px-2">Nominal Acc.</th>
              <th className="py-1.5 px-2">Engine Status</th>
              <th className="py-1.5 px-2 text-right">Switch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {conditionBenchmarks.map((c) => {
              const isActive = activePreset === c.id;
              return (
                <tr 
                  key={c.id} 
                  onClick={() => onSelectCondition(c.id)}
                  className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    isActive ? 'bg-cyan-950/30' : ''
                  }`}
                >
                  <td className="py-2 px-2 font-medium text-slate-200 flex items-center gap-2">
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    <span>{c.name}</span>
                  </td>
                  <td className="py-2 px-2 text-emerald-400">{c.expectedPd}</td>
                  <td className="py-2 px-2 text-amber-400">{c.expectedPfa}</td>
                  <td className="py-2 px-2 text-slate-300">{c.typicalAcc}</td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${c.badgeClass}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button className="text-[10px] text-cyan-400 hover:text-cyan-300 font-sans font-semibold">
                      {isActive ? 'Active' : 'Apply'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

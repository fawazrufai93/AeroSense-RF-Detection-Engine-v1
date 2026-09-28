import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { SpectrumDataPoint, ExtractedFeatures, RFParameters } from '../types/rf';

Chart.register(...registerables);

interface Task1SpectrumModuleProps {
  dataPoints: SpectrumDataPoint[];
  features: ExtractedFeatures;
  isDetected: boolean;
  params: RFParameters;
  onThresholdAdjust?: (newSensitivity: number) => void;
}

export const Task1SpectrumModule: React.FC<Task1SpectrumModuleProps> = ({
  dataPoints,
  features,
  isDetected,
  params,
  onThresholdAdjust,
}) => {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const waterfallHistoryRef = useRef<number[][]>([]);

  // Initialize and update Chart.js
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = dataPoints.map(p => p.frequency.toString());
    const powers = dataPoints.map(p => p.power);
    const thresholds = dataPoints.map(p => p.threshold);

    // If chart doesn't exist, create it
    if (!chartInstanceRef.current) {
      // Create gradient for power spectral density fill
      const gradient = ctx.createLinearGradient(0, 0, 0, 320);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'RF Spectrum (Power dBm)',
              data: powers,
              borderColor: '#06b6d4',
              backgroundColor: gradient,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              fill: true,
              tension: 0.15,
            },
            {
              label: params.cfarMode ? 'Adaptive CFAR Threshold' : 'Detection Threshold (γ)',
              data: thresholds,
              borderColor: '#f59e0b',
              borderWidth: 2,
              borderDash: [5, 4],
              pointRadius: 0,
              fill: false,
              tension: 0.05,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 120, // smooth fast refresh
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: '#94a3b8',
                font: {
                  family: 'JetBrains Mono',
                  size: 11
                },
                boxWidth: 14,
                boxHeight: 2,
                usePointStyle: false,
              }
            },
            tooltip: {
              backgroundColor: '#090d16',
              titleColor: '#38bdf8',
              bodyColor: '#e2e8f0',
              borderColor: '#1e293b',
              borderWidth: 1,
              titleFont: { family: 'JetBrains Mono', size: 12 },
              bodyFont: { family: 'JetBrains Mono', size: 11 },
              padding: 10,
              callbacks: {
                title: (items) => `${items[0].label} MHz`,
                label: (item) => ` ${item.dataset.label}: ${item.raw} dBm`
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(30, 41, 59, 0.6)',
              },
              ticks: {
                color: '#64748b',
                font: { family: 'JetBrains Mono', size: 10 },
                maxTicksLimit: 11,
                callback: (val, index) => {
                  const label = labels[index];
                  return label ? `${label}M` : '';
                }
              },
              title: {
                display: true,
                text: 'Frequency (MHz)',
                color: '#64748b',
                font: { family: 'JetBrains Mono', size: 11 }
              }
            },
            y: {
              min: -130,
              max: -30,
              grid: {
                color: 'rgba(30, 41, 59, 0.6)',
              },
              ticks: {
                color: '#64748b',
                font: { family: 'JetBrains Mono', size: 10 },
                stepSize: 15,
                callback: (val) => `${val} dBm`
              },
              title: {
                display: true,
                text: 'Power Spectral Density (dBm)',
                color: '#64748b',
                font: { family: 'JetBrains Mono', size: 11 }
              }
            }
          }
        }
      });
    } else {
      // Update chart data smoothly
      const chart = chartInstanceRef.current;
      chart.data.labels = labels;
      chart.data.datasets[0].data = powers;
      chart.data.datasets[1].data = thresholds;
      chart.data.datasets[1].label = params.cfarMode ? 'Adaptive CFAR Threshold' : 'Detection Threshold (γ)';
      chart.update('none'); // fast update without reset
    }

    return () => {
      // Cleanup on unmount handled in parent if needed
    };
  }, [dataPoints, params.cfarMode]);

  // Cleanup chart on complete unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Update Waterfall Canvas (rolling 2D RF spectrogram)
  useEffect(() => {
    if (!waterfallCanvasRef.current || dataPoints.length === 0) return;
    const canvas = waterfallCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPowers = dataPoints.map(p => p.power);
    const history = waterfallHistoryRef.current;
    history.unshift(currentPowers);
    if (history.length > 50) history.pop();

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const rowHeight = h / 50;
    const numBins = currentPowers.length;
    const colWidth = w / numBins;

    history.forEach((row, rowIndex) => {
      const y = rowIndex * rowHeight;
      row.forEach((power, colIndex) => {
        const x = colIndex * colWidth;
        
        // Color mapping from power (-120 dBm to -40 dBm)
        // Normalize 0 to 1
        const norm = Math.max(0, Math.min(1, (power - params.noiseFloor) / (params.snr + 15 || 25)));
        
        // Colormap: Navy -> Teal -> Emerald -> Amber -> Red/White
        let color = '#0f172a';
        if (norm < 0.2) {
          color = `rgba(15, 23, 42, ${0.4 + norm * 2})`;
        } else if (norm < 0.45) {
          color = `rgb(${Math.round(6 + norm * 80)}, ${Math.round(80 + norm * 200)}, ${Math.round(180 + norm * 70)})`;
        } else if (norm < 0.75) {
          color = `rgb(${Math.round(16 + norm * 150)}, ${Math.round(185 + norm * 50)}, ${Math.round(129 - norm * 80)})`;
        } else {
          color = `rgb(245, ${Math.round(158 - (norm - 0.75) * 400)}, 11)`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, colWidth + 0.5, rowHeight + 0.5);
      });
    });
  }, [dataPoints, params.noiseFloor, params.snr]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg relative">
      {/* Module Title & Core Task Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
            M1
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              RF Detection & Threshold Simulator
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                Task 1
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Live Power Spectral Density (PSD) with CFAR adaptive thresholding
            </p>
          </div>
        </div>

        {/* Dynamic Text Indicator Required by Prompt: "Signal Detected? -> YES / NO" */}
        <div className="flex items-center gap-2">
          <div 
            className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
              isDetected
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 glow-emerald'
                : 'bg-slate-950/80 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Detection Status
              </span>
              <span className="text-xs font-mono font-bold">
                Signal Detected? &rarr;{' '}
                <span className={`text-sm ${isDetected ? 'text-emerald-400 font-black tracking-widest' : 'text-rose-400 font-semibold'}`}>
                  {isDetected ? 'YES' : 'NO'}
                </span>
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              isDetected ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-500'
            }`}>
              <i className={`fa-solid ${isDetected ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Spectrum Chart Container */}
      <div className="relative w-full h-[290px] bg-slate-950/70 rounded-lg p-2 border border-slate-800/80">
        <canvas ref={chartCanvasRef} />

        {/* Live Peak Callout Overlay in Top Right */}
        <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono shadow-md backdrop-blur flex items-center gap-3 pointer-events-none">
          <div>
            <span className="text-slate-500 text-[10px] block">PEAK FREQ</span>
            <span className="text-cyan-400 font-bold">{features.peakFrequency} MHz</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-700"></div>
          <div>
            <span className="text-slate-500 text-[10px] block">PEAK POWER</span>
            <span className={`font-bold ${isDetected ? 'text-emerald-400' : 'text-slate-300'}`}>
              {features.peakPower} dBm
            </span>
          </div>
          <div className="w-[1px] h-6 bg-slate-700"></div>
          <div>
            <span className="text-slate-500 text-[10px] block">EST. SNR</span>
            <span className="text-amber-400 font-bold">+{features.snrEstimate} dB</span>
          </div>
        </div>
      </div>

      {/* Waterfall Spectrogram (Time vs Frequency Spectral Heatmap) */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-water text-cyan-400 text-[11px]"></i>
            <span className="font-semibold text-slate-300">2D Waterfall Spectrogram (Time History)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span>Low Power: <span className="text-slate-400">Slate/Blue</span></span>
            <span>&rarr;</span>
            <span>High Power: <span className="text-amber-400 font-bold">Amber/Orange</span></span>
          </div>
        </div>
        <div className="h-16 w-full rounded overflow-hidden border border-slate-800">
          <canvas ref={waterfallCanvasRef} width={800} height={60} className="w-full h-full object-cover" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>{params.centerFreq - 20} MHz</span>
          <span>Center: {params.centerFreq} MHz</span>
          <span>{params.centerFreq + 20} MHz</span>
        </div>
      </div>

      {/* Threshold & Spectral Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Threshold Level</span>
          <span className="text-xs font-mono font-bold text-amber-400">
            {params.cfarMode ? 'Adaptive CFAR' : `${(params.noiseFloor + params.thresholdOffsetDb * (params.thresholdSensitivity * 0.75 + 0.25)).toFixed(1)} dBm`}
          </span>
        </div>
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Exceeded Bins</span>
          <span className={`text-xs font-mono font-bold ${features.crossingBinsCount > 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
            {features.crossingBinsCount} / 100 bins
          </span>
        </div>
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Detection Criterion</span>
          <span className="text-xs font-mono font-bold text-slate-300">
            &ge; 2 Consec. Bins
          </span>
        </div>
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Energy Integral</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {features.totalEnergy} dBm
          </span>
        </div>
      </div>
    </div>
  );
};

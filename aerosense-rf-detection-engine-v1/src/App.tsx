import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RFParameters, 
  ExtractedFeatures, 
  ClassificationResult, 
  PerformanceMetrics, 
  SignalPresetType, 
  MLModelType, 
  SpectrumDataPoint 
} from './types/rf';
import { 
  generateSpectrumData, 
  classifyRFSignal, 
  playAudioFeedback 
} from './utils/dspEngine';
import { Header } from './components/Header';
import { ControlDeck } from './components/ControlDeck';
import { Task1SpectrumModule } from './components/Task1SpectrumModule';
import { Task2MLClassifierModule } from './components/Task2MLClassifierModule';
import { Task3PerformanceModule } from './components/Task3PerformanceModule';
import { ExportModal } from './components/ExportModal';

const DEFAULT_PARAMS: RFParameters = {
  snr: 16,
  noiseFloor: -95,
  centerFreq: 2440,
  thresholdSensitivity: 2.0,
  cfarMode: true,
  thresholdOffsetDb: 10,
  sweepSpeed: 300,
  activePreset: 'drone_dji',
  modulation: 'FHSS',
};

const INITIAL_METRICS: PerformanceMetrics = {
  totalFrames: 0,
  truePositives: 0,
  falsePositives: 0,
  trueNegatives: 0,
  falseNegatives: 0,
  detectionRate: 100,
  falseAlarmRate: 0,
  accuracy: 100,
  precision: 100,
  f1Score: 100,
  history: []
};

export default function App() {
  const [params, setParams] = useState<RFParameters>(DEFAULT_PARAMS);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<MLModelType>('decision_tree');
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Real-time calculation outputs
  const [spectrumPoints, setSpectrumPoints] = useState<SpectrumDataPoint[]>([]);
  const [features, setFeatures] = useState<ExtractedFeatures>({
    peakFrequency: 2440,
    peakPower: -79,
    totalEnergy: -72,
    occupiedBandwidth: 2.4,
    spectralKurtosis: 5.2,
    snrEstimate: 16,
    crossingBinsCount: 6,
  });
  const [isDetected, setIsDetected] = useState<boolean>(true);
  const [classification, setClassification] = useState<ClassificationResult>({
    predictedClass: 'UAV / Drone Controller (DJI OcuSync)',
    confidence: 96.5,
    classProbabilities: {
      'UAV / Drone Controller (DJI OcuSync)': 0.965,
      'Wi-Fi Interference (802.11ax)': 0.015,
      'Bluetooth LE Beacon': 0.01,
      'Overlapping Drone + Wi-Fi': 0.005,
      'Background Noise / Thermal Fluctuation': 0.005
    },
    modelUsed: 'decision_tree',
    featureImportance: [
      { feature: 'Occupied Bandwidth ~ 2.4 MHz', value: '2.40 MHz', impact: 'high' },
      { feature: 'Spectral Kurtosis Spike (FHSS)', value: '5.20', impact: 'high' }
    ],
    explanation: 'Extracted 2.4 MHz OBW with kurtosis 5.20 and SNR 16.0 dB strongly matches the spectral signature of UAV / Drone Controller (DJI OcuSync).'
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>(INITIAL_METRICS);

  // Keep track of time ticks for hopping simulation
  const timeTickRef = useRef<number>(0);
  const wasDetectedRef = useRef<boolean>(false);

  // Compute a single DSP frame and update state
  const evaluateDSPFrame = useCallback((currentParams: RFParameters, currentModel: MLModelType, updateMetrics = true) => {
    timeTickRef.current += 0.25;
    const result = generateSpectrumData(currentParams, timeTickRef.current);
    const classificationResult = classifyRFSignal(
      result.features, 
      result.isDetected, 
      currentModel, 
      currentParams.activePreset
    );

    setSpectrumPoints(result.points);
    setFeatures(result.features);
    setIsDetected(result.isDetected);
    setClassification(classificationResult);

    // Audio chime on rising edge detection
    if (audioEnabled && result.isDetected && !wasDetectedRef.current) {
      playAudioFeedback('detect');
    }
    wasDetectedRef.current = result.isDetected;

    // Update cumulative performance metrics
    if (updateMetrics) {
      setMetrics((prev) => {
        // Ground truth: does this scenario have a genuine signal target?
        const isActualSignalPresent = 
          currentParams.activePreset === 'drone_dji' ||
          currentParams.activePreset === 'wifi_interference' ||
          currentParams.activePreset === 'overlapping' ||
          currentParams.activePreset === 'weak_drone' ||
          currentParams.activePreset === 'bluetooth';

        let tp = prev.truePositives;
        let fp = prev.falsePositives;
        let tn = prev.trueNegatives;
        let fn = prev.falseNegatives;

        if (isActualSignalPresent) {
          if (result.isDetected) {
            tp++;
          } else {
            fn++;
          }
        } else {
          // Preset is idle or high noise without target
          if (result.isDetected) {
            fp++; // False Alarm!
          } else {
            tn++;
          }
        }

        const total = tp + fp + tn + fn;
        const detectionRate = (tp + fn > 0) ? (tp / (tp + fn)) * 100 : 100;
        const falseAlarmRate = (fp + tn > 0) ? (fp / (fp + tn)) * 100 : 0;
        const accuracy = total > 0 ? ((tp + tn) / total) * 100 : 100;
        const precision = (tp + fp > 0) ? (tp / (tp + fp)) * 100 : 100;
        const recall = detectionRate / 100;
        const precNorm = precision / 100;
        const f1Score = (precNorm + recall > 0) ? (2 * (precNorm * recall) / (precNorm + recall)) * 100 : 100;

        return {
          totalFrames: total,
          truePositives: tp,
          falsePositives: fp,
          trueNegatives: tn,
          falseNegatives: fn,
          detectionRate: Number(detectionRate.toFixed(2)),
          falseAlarmRate: Number(falseAlarmRate.toFixed(2)),
          accuracy: Number(accuracy.toFixed(2)),
          precision: Number(precision.toFixed(2)),
          f1Score: Number(f1Score.toFixed(2)),
          history: [
            ...prev.history.slice(-20),
            {
              timestamp: Date.now(),
              detectionRate,
              falseAlarmRate,
              accuracy
            }
          ]
        };
      });
    }
  }, [audioEnabled]);

  // Initial execution & parameter change trigger
  useEffect(() => {
    evaluateDSPFrame(params, selectedModel, true);
  }, [params, selectedModel, evaluateDSPFrame]);

  // Continuous sweep interval loop
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      evaluateDSPFrame(params, selectedModel, true);
    }, 280);

    return () => clearInterval(interval);
  }, [isStreaming, params, selectedModel, evaluateDSPFrame]);

  // Handler: Param changes
  const handleParamChange = (changes: Partial<RFParameters>) => {
    setParams(prev => ({ ...prev, ...changes }));
  };

  // Handler: Preset selection
  const handleApplyPreset = (preset: SignalPresetType) => {
    let newParams: Partial<RFParameters> = { activePreset: preset };

    switch (preset) {
      case 'drone_dji':
        newParams = {
          activePreset: 'drone_dji',
          snr: 18,
          noiseFloor: -95,
          centerFreq: 2440,
          thresholdSensitivity: 2.0,
          thresholdOffsetDb: 10,
        };
        break;
      case 'high_noise':
        newParams = {
          activePreset: 'high_noise',
          snr: 3,
          noiseFloor: -82,
          thresholdSensitivity: 1.2, // aggressive threshold makes false alarms trigger!
          thresholdOffsetDb: 7,
        };
        break;
      case 'overlapping':
        newParams = {
          activePreset: 'overlapping',
          snr: 16,
          noiseFloor: -95,
          centerFreq: 2440,
          thresholdSensitivity: 2.0,
          thresholdOffsetDb: 10,
        };
        break;
      case 'weak_drone':
        newParams = {
          activePreset: 'weak_drone',
          snr: 4,
          noiseFloor: -95,
          centerFreq: 2440,
          thresholdSensitivity: 2.4,
          thresholdOffsetDb: 10,
        };
        break;
      case 'wifi_interference':
        newParams = {
          activePreset: 'wifi_interference',
          snr: 15,
          noiseFloor: -95,
          centerFreq: 2440,
          thresholdSensitivity: 2.0,
          thresholdOffsetDb: 10,
        };
        break;
      case 'idle':
        newParams = {
          activePreset: 'idle',
          snr: 0,
          noiseFloor: -98,
          thresholdSensitivity: 2.0,
          thresholdOffsetDb: 10,
        };
        break;
    }

    setParams(prev => ({ ...prev, ...newParams }));
  };

  // Handler: Reset to Calibrated Defaults
  const handleResetDefaults = () => {
    setParams(DEFAULT_PARAMS);
  };

  // Handler: Reset Accumulated Metrics
  const handleResetMetrics = () => {
    setMetrics({
      ...INITIAL_METRICS,
      totalFrames: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
      detectionRate: 100,
      falseAlarmRate: 0,
      accuracy: 100,
      precision: 100,
      f1Score: 100,
      history: []
    });
  };

  // Handler: Run 100-Sample Automated Monte Carlo Trial Benchmark
  const handleRunBatchTest = async () => {
    setIsBatchRunning(true);
    const presetsToTest: SignalPresetType[] = [
      'drone_dji',
      'drone_dji',
      'drone_dji',
      'wifi_interference',
      'overlapping',
      'weak_drone',
      'idle',
      'high_noise',
      'idle',
      'idle'
    ];

    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    // Run 100 virtual sweep frames
    for (let i = 0; i < 100; i++) {
      const preset = presetsToTest[i % presetsToTest.length];
      const hasActualSignal = preset !== 'idle' && preset !== 'high_noise';
      const testSnr = preset === 'weak_drone' ? 3 + Math.random() * 3 : (preset === 'high_noise' ? 2 : 10 + Math.random() * 12);
      
      const testParam: RFParameters = {
        ...params,
        activePreset: preset,
        snr: testSnr,
        noiseFloor: preset === 'high_noise' ? -80 : -95,
      };

      const result = generateSpectrumData(testParam, i * 0.4);

      if (hasActualSignal) {
        if (result.isDetected) tp++;
        else fn++;
      } else {
        if (result.isDetected) fp++;
        else tn++;
      }
    }

    // Set statistical result
    const total = tp + fp + tn + fn;
    const detectionRate = (tp + fn > 0) ? (tp / (tp + fn)) * 100 : 100;
    const falseAlarmRate = (fp + tn > 0) ? (fp / (fp + tn)) * 100 : 0;
    const accuracy = ((tp + tn) / total) * 100;
    const precision = (tp + fp > 0) ? (tp / (tp + fp)) * 100 : 100;
    const recall = detectionRate / 100;
    const precNorm = precision / 100;
    const f1Score = (precNorm + recall > 0) ? (2 * (precNorm * recall) / (precNorm + recall)) * 100 : 100;

    setMetrics({
      totalFrames: total,
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
      detectionRate: Number(detectionRate.toFixed(2)),
      falseAlarmRate: Number(falseAlarmRate.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2)),
      precision: Number(precision.toFixed(2)),
      f1Score: Number(f1Score.toFixed(2)),
      history: [
        {
          timestamp: Date.now(),
          detectionRate,
          falseAlarmRate,
          accuracy
        }
      ]
    });

    setIsBatchRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Status Bar */}
      <Header
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming(!isStreaming)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        isSignalDetected={isDetected}
        detectedClass={classification.predictedClass}
        onResetStats={handleResetMetrics}
        onRunBatchTest={handleRunBatchTest}
        onOpenExport={() => setIsExportOpen(true)}
        params={params}
      />

      {/* Main Operational Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Project Context & Architecture Brief Banner */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-tower-broadcast text-sm"></i>
            </div>
            <div>
              <span className="font-bold text-white text-sm">
                Telecommunications RF Detection & Drone Classification Engineering Platform
              </span>
              <p className="text-slate-400 mt-0.5">
                Simulating physical SDR sampling, Neyman-Pearson / CFAR energy detection, feature vectorization, and multi-model classification.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-[11px]">
            <span className="px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
              Task 1: RF Detection
            </span>
            <span className="px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
              Task 2: ML Engine
            </span>
            <span className="px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
              Task 3: False Alarms
            </span>
          </div>
        </section>

        {/* Live Control Deck (Sidebar/Deck with Sliders & Preset Action Buttons) */}
        <section>
          <ControlDeck
            params={params}
            onChangeParams={handleParamChange}
            onApplyPreset={handleApplyPreset}
            onResetToDefaults={handleResetDefaults}
          />
        </section>

        {/* Main 3 Core Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Module 1 (Task 1): RF Detection & Threshold Simulator - 7 cols on desktop */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            <Task1SpectrumModule
              dataPoints={spectrumPoints}
              features={features}
              isDetected={isDetected}
              params={params}
            />
          </section>

          {/* Module 2 (Task 2): Machine Learning Classification Panel - 5 cols on desktop */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <Task2MLClassifierModule
              features={features}
              classification={classification}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              isDetected={isDetected}
            />
          </section>
        </div>

        {/* Module 3 (Task 3): False Alarm & Performance Analysis - Full Width */}
        <section>
          <Task3PerformanceModule
            metrics={metrics}
            onResetMetrics={handleResetMetrics}
            onRunBatchTest={handleRunBatchTest}
            isBatchRunning={isBatchRunning}
            activePreset={params.activePreset}
            onSelectCondition={handleApplyPreset}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AeroSense RF Detection Engine v1 &middot; Telecommunications Internship Prototype</span>
          <span className="text-slate-400">DSP Sampling: 40 MS/s &middot; CA-CFAR Enabled &middot; ML Decision Tree / Random Forest / SVM</span>
        </div>
      </footer>

      {/* Export / Report Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        params={params}
        features={features}
        classification={classification}
        metrics={metrics}
      />
    </div>
  );
}

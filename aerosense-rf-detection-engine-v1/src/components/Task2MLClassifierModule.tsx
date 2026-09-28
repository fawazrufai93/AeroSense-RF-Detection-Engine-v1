import React from 'react';
import { 
  ExtractedFeatures, 
  ClassificationResult, 
  MLModelType, 
  DetectedClass 
} from '../types/rf';

interface Task2MLClassifierModuleProps {
  features: ExtractedFeatures;
  classification: ClassificationResult;
  selectedModel: MLModelType;
  onSelectModel: (model: MLModelType) => void;
  isDetected: boolean;
}

export const Task2MLClassifierModule: React.FC<Task2MLClassifierModuleProps> = ({
  features,
  classification,
  selectedModel,
  onSelectModel,
  isDetected,
}) => {
  // Helper to determine styling badge based on detected class
  const getClassBadge = (cls: DetectedClass) => {
    switch (cls) {
      case 'UAV / Drone Controller (DJI OcuSync)':
        return {
          bg: 'bg-cyan-950/80',
          border: 'border-cyan-500',
          text: 'text-cyan-300',
          icon: 'fa-helicopter',
          glow: 'glow-cyan',
        };
      case 'Wi-Fi Interference (802.11ax)':
        return {
          bg: 'bg-blue-950/80',
          border: 'border-blue-500',
          text: 'text-blue-300',
          icon: 'fa-wifi',
          glow: '',
        };
      case 'Overlapping Drone + Wi-Fi':
        return {
          bg: 'bg-purple-950/80',
          border: 'border-purple-500',
          text: 'text-purple-300',
          icon: 'fa-layer-group',
          glow: '',
        };
      case 'Bluetooth LE Beacon':
        return {
          bg: 'bg-indigo-950/80',
          border: 'border-indigo-500',
          text: 'text-indigo-300',
          icon: 'fa-bluetooth-b',
          glow: '',
        };
      default:
        return {
          bg: 'bg-slate-900',
          border: 'border-slate-700',
          text: 'text-slate-300',
          icon: 'fa-wave-square',
          glow: '',
        };
    }
  };

  const badgeStyle = getClassBadge(classification.predictedClass);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg">
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center font-bold text-xs">
            M2
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Machine Learning Classification
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                Task 2
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              DSP feature vector extraction & classifier inference
            </p>
          </div>
        </div>

        {/* Model Architecture Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onSelectModel('decision_tree')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              selectedModel === 'decision_tree'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decision Tree
          </button>
          <button
            onClick={() => onSelectModel('random_forest')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              selectedModel === 'random_forest'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Random Forest
          </button>
          <button
            onClick={() => onSelectModel('svm')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              selectedModel === 'svm'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SVM (RBF)
          </button>
        </div>
      </div>

      {/* Feature Extraction Telemetry Cards (Task 2 requirement: Peak Freq, Energy, Bandwidth) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Feature 1: Peak Frequency */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Peak Frequency</span>
            <i className="fa-solid fa-arrows-to-dot text-cyan-400 text-xs"></i>
          </div>
          <div className="text-base font-bold font-mono text-cyan-300">
            {features.peakFrequency} <span className="text-xs text-slate-400 font-normal">MHz</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Bin resolution: 0.40 MHz
          </span>
        </div>

        {/* Feature 2: Integrated Energy */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Signal Energy</span>
            <i className="fa-solid fa-chart-area text-emerald-400 text-xs"></i>
          </div>
          <div className="text-base font-bold font-mono text-emerald-300">
            {features.totalEnergy} <span className="text-xs text-slate-400 font-normal">dBm</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Integrated PSD &Sigma; P_i
          </span>
        </div>

        {/* Feature 3: Occupied Bandwidth */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Occupied Bandwidth</span>
            <i className="fa-solid fa-arrows-left-right text-indigo-400 text-xs"></i>
          </div>
          <div className="text-base font-bold font-mono text-indigo-300">
            {features.occupiedBandwidth} <span className="text-xs text-slate-400 font-normal">MHz</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            -10dB Spectral Span
          </span>
        </div>

        {/* Feature 4: Spectral Kurtosis */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Spectral Kurtosis</span>
            <i className="fa-solid fa-chart-simple text-amber-400 text-xs"></i>
          </div>
          <div className="text-base font-bold font-mono text-amber-300">
            {features.spectralKurtosis}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {features.spectralKurtosis > 4.0 ? 'Pulsed / FHSS Burst' : 'Continuous OFDM / Gauss'}
          </span>
        </div>
      </div>

      {/* Main ML Classifier Prediction Output & Confidence Score */}
      <div className={`p-4 rounded-xl border transition-all duration-300 ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.glow}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-slate-950/60 border border-slate-800 ${badgeStyle.text}`}>
              <i className={`fa-solid ${badgeStyle.icon}`}></i>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                Model Classification Output ({selectedModel.replace('_', ' ').toUpperCase()})
              </span>
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${badgeStyle.text}`}>
                {classification.predictedClass}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {classification.explanation}
              </p>
            </div>
          </div>

          {/* Prominent Confidence Score Percentage */}
          <div className="flex flex-col items-end justify-center min-w-[140px] bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Confidence Score
            </span>
            <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1">
              <span>{classification.confidence}</span>
              <span className="text-sm font-bold text-cyan-400">%</span>
            </div>
            {/* Confidence Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  classification.confidence > 90 
                    ? 'bg-emerald-400' 
                    : classification.confidence > 75 
                    ? 'bg-cyan-400' 
                    : 'bg-amber-400'
                }`}
                style={{ width: `${classification.confidence}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Multi-Class Probability Breakdown Bars */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
            Posterior Probability Distribution P(C_i | X)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {Object.entries(classification.classProbabilities).map(([className, prob]) => {
              const isSelected = className === classification.predictedClass;
              const percent = Math.round(prob * 100);
              return (
                <div key={className} className="flex items-center gap-2">
                  <span className={`truncate w-44 text-[11px] ${isSelected ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>
                    {className}
                  </span>
                  <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className={`w-10 text-right text-[11px] ${isSelected ? 'text-cyan-300 font-bold' : 'text-slate-500'}`}>
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Importance & Model Traceability Explanations */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <i className="fa-solid fa-code-branch text-indigo-400"></i>
            Active Decision Rules & Feature Importance
          </span>
          <span className="text-[10px] text-slate-500 font-mono">SHAP / Gini Importance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {classification.featureImportance.map((item, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300 font-medium">{item.feature}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  item.impact === 'high' 
                    ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.impact}
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 mt-1 block">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { RFParameters, ExtractedFeatures, ClassificationResult, PerformanceMetrics } from '../types/rf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: RFParameters;
  features: ExtractedFeatures;
  classification: ClassificationResult;
  metrics: PerformanceMetrics;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  params,
  features,
  classification,
  metrics,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'json' | 'csv' | 'standalone'>('report');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exportTimestamp = new Date().toISOString();

  // Generate markdown report
  const markdownReport = `# AeroSense RF Detection Engine v1 - Telemetry & Performance Report
Generated at: ${exportTimestamp}

## 1. System Parameters
- Center Frequency: ${params.centerFreq} MHz
- Signal-to-Noise Ratio (SNR): ${params.snr} dB
- Noise Floor: ${params.noiseFloor} dBm
- Threshold Mode: ${params.cfarMode ? 'CA-CFAR (Cell Averaging Adaptive)' : 'Fixed Energy'}
- Threshold Sensitivity Multiplier: ${params.thresholdSensitivity.toFixed(2)}x
- Active Scenario Preset: ${params.activePreset}

## 2. DSP Feature Vector Extraction
- Peak Frequency: ${features.peakFrequency} MHz
- Peak Power: ${features.peakPower} dBm
- Estimated Signal Energy: ${features.totalEnergy} dBm
- Occupied Bandwidth (-10dB): ${features.occupiedBandwidth} MHz
- Spectral Kurtosis: ${features.spectralKurtosis}
- Exceeded Threshold Bins: ${features.crossingBinsCount} / 100

## 3. Machine Learning Classification
- Model Architecture: ${classification.modelUsed.toUpperCase()}
- Predicted Target: ${classification.predictedClass}
- Confidence Score: ${classification.confidence}%
- Classification Explanation: ${classification.explanation}

## 4. Performance & False Alarm Metrics
- Total Frames Analyzed: ${metrics.totalFrames}
- Detection Rate (Pd): ${metrics.detectionRate.toFixed(2)}%
- False Alarm Rate (Pfa): ${metrics.falseAlarmRate.toFixed(2)}%
- Classification Accuracy: ${metrics.accuracy.toFixed(2)}%
- Precision: ${metrics.precision.toFixed(2)}%
- F1-Score: ${metrics.f1Score.toFixed(2)}%
- Confusion Matrix:
  * True Positives (TP): ${metrics.truePositives}
  * False Positives (FP): ${metrics.falsePositives}
  * False Negatives (FN): ${metrics.falseNegatives}
  * True Negatives (TN): ${metrics.trueNegatives}
`;

  const jsonData = JSON.stringify(
    {
      engine: 'AeroSense RF Detection Engine v1',
      timestamp: exportTimestamp,
      parameters: params,
      dspFeatures: features,
      classificationResult: classification,
      performanceMetrics: metrics,
    },
    null,
    2
  );

  const csvData = `Metric,Value,Unit
Center Frequency,${params.centerFreq},MHz
SNR,${params.snr},dB
Noise Floor,${params.noiseFloor},dBm
Peak Frequency,${features.peakFrequency},MHz
Peak Power,${features.peakPower},dBm
Signal Energy,${features.totalEnergy},dBm
Occupied Bandwidth,${features.occupiedBandwidth},MHz
Spectral Kurtosis,${features.spectralKurtosis},
Predicted Class,"${classification.predictedClass}",
Confidence,${classification.confidence},%
Detection Rate,${metrics.detectionRate.toFixed(2)},%
False Alarm Rate,${metrics.falseAlarmRate.toFixed(2)},%
Accuracy,${metrics.accuracy.toFixed(2)},%
Total Frames,${metrics.totalFrames},`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <i className="fa-solid fa-file-export text-sm"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Export RF Telemetry & Internship Report
              </h3>
              <p className="text-xs text-slate-400">
                AeroSense RF Detection Engine v1 Telecommunications Analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-900/60 text-xs">
          <button
            onClick={() => setActiveTab('report')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'report'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-regular fa-file-lines mr-1.5"></i>
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'json'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-code mr-1.5"></i>
            JSON Telemetry
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'csv'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-table mr-1.5"></i>
            CSV Data
          </button>
          <button
            onClick={() => setActiveTab('standalone')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-all ${
              activeTab === 'standalone'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-file-code mr-1.5 text-cyan-400"></i>
            Standalone HTML File
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950/50">
          {activeTab === 'report' && (
            <pre className="whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200">
              {markdownReport}
            </pre>
          )}

          {activeTab === 'json' && (
            <pre className="whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 text-cyan-300">
              {jsonData}
            </pre>
          )}

          {activeTab === 'csv' && (
            <pre className="whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-300">
              {csvData}
            </pre>
          )}

          {activeTab === 'standalone' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-window-maximize"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">Single-File Self-Contained Web App</h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Includes all HTML, Tailwind CSS via CDN, FontAwesome via CDN, Chart.js via CDN, and inline DSP JavaScript.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                This version can be saved directly as an <code>.html</code> file on your computer and immediately launched in Chrome, Safari, Edge, or Firefox without any local web server or terminal commands.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="/standalone.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold font-sans text-xs flex items-center gap-1.5 transition-colors"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>Open Standalone HTML in New Tab</span>
                </a>
                <a
                  href="/standalone.html"
                  download="AeroSense_RF_Detection_Engine_v1.html"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold font-sans text-xs flex items-center gap-1.5 transition-colors"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Download AeroSense_RF_Engine.html</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
          <div className="text-xs text-slate-400 font-mono">
            {copied ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <i className="fa-solid fa-check"></i> Copied to clipboard!
              </span>
            ) : (
              <span>Ready for download or clipboard copy</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text =
                  activeTab === 'report'
                    ? markdownReport
                    : activeTab === 'json'
                    ? jsonData
                    : csvData;
                handleCopy(text);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-regular fa-copy"></i>
              <span>Copy</span>
            </button>

            <button
              onClick={() => {
                if (activeTab === 'report') {
                  handleDownload(markdownReport, 'AeroSense_RF_Report.md', 'text/markdown');
                } else if (activeTab === 'json') {
                  handleDownload(jsonData, 'AeroSense_RF_Data.json', 'application/json');
                } else {
                  handleDownload(csvData, 'AeroSense_RF_Metrics.csv', 'text/csv');
                }
              }}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs flex items-center gap-1.5 shadow transition-all"
            >
              <i className="fa-solid fa-download"></i>
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

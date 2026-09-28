export type SignalPresetType = 
  | 'idle' 
  | 'drone_dji' 
  | 'wifi_interference' 
  | 'overlapping' 
  | 'high_noise' 
  | 'weak_drone'
  | 'bluetooth';

export type MLModelType = 'decision_tree' | 'random_forest' | 'svm';

export type DetectedClass = 
  | 'UAV / Drone Controller (DJI OcuSync)'
  | 'Wi-Fi Interference (802.11ax)'
  | 'Bluetooth LE Beacon'
  | 'Overlapping Drone + Wi-Fi'
  | 'Background Noise / Thermal Fluctuation';

export interface RFParameters {
  snr: number; // in dB (-10 to +35)
  noiseFloor: number; // in dBm (-120 to -60)
  centerFreq: number; // in MHz (e.g. 2440)
  thresholdSensitivity: number; // multiplier / dB margin above noise (1.0 to 5.0)
  cfarMode: boolean; // Constant False Alarm Rate vs Fixed
  thresholdOffsetDb: number; // dB above noise floor
  sweepSpeed: number; // ms
  activePreset: SignalPresetType;
  modulation: 'FHSS' | 'OFDM' | 'DSSS' | 'CW';
}

export interface ExtractedFeatures {
  peakFrequency: number; // MHz
  peakPower: number; // dBm
  totalEnergy: number; // mW / integrated dBm
  occupiedBandwidth: number; // MHz
  spectralKurtosis: number;
  snrEstimate: number; // dB
  crossingBinsCount: number;
}

export interface ClassificationResult {
  predictedClass: DetectedClass;
  confidence: number; // 0 to 100%
  classProbabilities: Record<DetectedClass, number>;
  modelUsed: MLModelType;
  featureImportance: {
    feature: string;
    value: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  explanation: string;
}

export interface PerformanceMetrics {
  totalFrames: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  detectionRate: number; // True Positive Rate (%)
  falseAlarmRate: number; // False Positive Rate (%)
  accuracy: number; // (%)
  precision: number; // (%)
  f1Score: number; // (%)
  history: {
    timestamp: number;
    detectionRate: number;
    falseAlarmRate: number;
    accuracy: number;
  }[];
}

export interface SpectrumDataPoint {
  frequency: number; // MHz
  power: number; // dBm
  threshold: number; // dBm
  isExceeded: boolean;
}

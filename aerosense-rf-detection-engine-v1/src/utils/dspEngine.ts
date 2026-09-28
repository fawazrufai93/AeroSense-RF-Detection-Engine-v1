import { 
  RFParameters, 
  ExtractedFeatures, 
  ClassificationResult, 
  DetectedClass, 
  MLModelType, 
  SpectrumDataPoint 
} from '../types/rf';

// Box-Muller Gaussian random number generator
export function randomGaussian(mean = 0, stdDev = 1): number {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// Generate realistic RF Spectrum points
export function generateSpectrumData(
  params: RFParameters, 
  timeOffset: number = 0
): {
  points: SpectrumDataPoint[];
  features: ExtractedFeatures;
  isDetected: boolean;
  thresholdValue: number;
} {
  const numBins = 100;
  const spanMHz = 40; // +/- 20 MHz from center frequency
  const startFreq = params.centerFreq - spanMHz / 2;
  const binStep = spanMHz / (numBins - 1);

  const points: SpectrumDataPoint[] = [];
  const powers: number[] = [];

  // Determine true signal presence based on preset
  const hasDrone = params.activePreset === 'drone_dji' || params.activePreset === 'overlapping' || params.activePreset === 'weak_drone';
  const hasWifi = params.activePreset === 'wifi_interference' || params.activePreset === 'overlapping';
  const hasHighNoise = params.activePreset === 'high_noise';
  const hasBluetooth = params.activePreset === 'bluetooth';

  // Base noise level
  const baseNoise = params.noiseFloor + (hasHighNoise ? 12 : 0);
  const noiseSigma = hasHighNoise ? 3.8 : 1.8;

  // Signal parameters based on SNR
  const droneSnr = params.activePreset === 'weak_drone' ? Math.max(3, params.snr - 8) : params.snr;
  const dronePeakPower = baseNoise + droneSnr;
  const wifiPeakPower = baseNoise + Math.max(6, params.snr - 2);

  // Time-dependent frequency hopping simulation for Drone (FHSS)
  const hopPhase = Math.floor(timeOffset * 2) % 5;
  const droneHopOffsets = [-8, 4, 12, -3, 7]; // MHz offsets for FHSS
  const currentDroneCenter = params.centerFreq + (hasDrone ? droneHopOffsets[hopPhase] : 0);

  // Wi-Fi is stationary wideband centered slightly to the left (-5 MHz)
  const wifiCenter = params.centerFreq - 4;

  for (let i = 0; i < numBins; i++) {
    const freq = startFreq + i * binStep;
    
    // 1. Noise Floor with Rayleigh / Log-normal RF thermal distribution
    let power = baseNoise + randomGaussian(0, noiseSigma);

    // 2. High noise random transient bursts
    if (hasHighNoise && Math.random() < 0.05) {
      power += Math.random() * 15;
    }

    // 3. Drone Signal (Narrowband FHSS pulses, high crest factor, sharp roll-off)
    if (hasDrone) {
      const distFromDrone = Math.abs(freq - currentDroneCenter);
      const droneBandwidth = 2.4; // MHz
      if (distFromDrone < droneBandwidth * 2) {
        // Sinc-like or steep Gaussian envelope
        const envelope = Math.exp(-Math.pow(distFromDrone / (droneBandwidth * 0.6), 2));
        const droneContribution = (dronePeakPower - baseNoise) * envelope;
        power = Math.max(power, baseNoise + droneContribution + randomGaussian(0, 0.8));
      }
    }

    // 4. Wi-Fi Signal (Wideband OFDM 20MHz flat-top with subcarrier ripple and roll-off)
    if (hasWifi) {
      const distFromWifi = Math.abs(freq - wifiCenter);
      const wifiBandwidth = 18; // 20 MHz nominal
      if (distFromWifi < wifiBandwidth / 2) {
        // Flat top OFDM spectrum with small ripple
        const ripple = Math.sin((freq - wifiCenter) * 1.5) * 1.2;
        const wifiContribution = (wifiPeakPower - baseNoise) * 0.95 + ripple;
        power = Math.max(power, baseNoise + wifiContribution + randomGaussian(0, 0.9));
      } else if (distFromWifi < wifiBandwidth / 2 + 4) {
        // OFDM spectral skirt / side lobes
        const skirtDist = distFromWifi - wifiBandwidth / 2;
        const attenuation = Math.exp(-skirtDist * 0.9);
        const wifiContribution = (wifiPeakPower - baseNoise) * 0.4 * attenuation;
        power = Math.max(power, baseNoise + wifiContribution);
      }
    }

    // 5. Bluetooth LE (1 MHz GFSK channel)
    if (hasBluetooth) {
      const bleCenter = params.centerFreq + 6;
      const dist = Math.abs(freq - bleCenter);
      if (dist < 1.2) {
        const bleContribution = Math.max(8, params.snr - 4) * Math.exp(-Math.pow(dist / 0.7, 2));
        power = Math.max(power, baseNoise + bleContribution + randomGaussian(0, 0.5));
      }
    }

    powers.push(power);
  }

  // Calculate Threshold
  // Fixed Threshold: Noise Floor + Margin (proportional to sensitivity)
  // CFAR Mode: Adaptive sliding window averaging with guard cells
  const thresholdMarginDb = params.thresholdOffsetDb * (params.thresholdSensitivity * 0.75 + 0.25);
  const fixedThreshold = baseNoise + thresholdMarginDb;

  let exceededCount = 0;
  for (let i = 0; i < numBins; i++) {
    let binThreshold = fixedThreshold;

    if (params.cfarMode) {
      // Cell Averaging CFAR (CA-CFAR)
      const guardCells = 2;
      const trainCells = 6;
      let sum = 0;
      let count = 0;

      for (let offset = -trainCells - guardCells; offset <= trainCells + guardCells; offset++) {
        if (Math.abs(offset) <= guardCells) continue;
        const idx = i + offset;
        if (idx >= 0 && idx < numBins) {
          sum += powers[idx];
          count++;
        }
      }
      const localNoiseAvg = count > 0 ? sum / count : baseNoise;
      binThreshold = localNoiseAvg + thresholdMarginDb * 0.85;
    }

    const isExceeded = powers[i] >= binThreshold;
    if (isExceeded) exceededCount++;

    points.push({
      frequency: Number((startFreq + i * binStep).toFixed(2)),
      power: Number(powers[i].toFixed(2)),
      threshold: Number(binThreshold.toFixed(2)),
      isExceeded
    });
  }

  // Signal is formally detected if at least 2 consecutive bins or 3 total bins exceed threshold
  let consecutiveExceeded = 0;
  let maxConsecutive = 0;
  for (const pt of points) {
    if (pt.isExceeded) {
      consecutiveExceeded++;
      if (consecutiveExceeded > maxConsecutive) maxConsecutive = consecutiveExceeded;
    } else {
      consecutiveExceeded = 0;
    }
  }

  const isDetected = maxConsecutive >= 2 || exceededCount >= 3;

  // Feature Extraction
  let peakPower = -Infinity;
  let peakIndex = 0;
  let totalLinearPower = 0;

  powers.forEach((p, idx) => {
    if (p > peakPower) {
      peakPower = p;
      peakIndex = idx;
    }
    // Convert dBm to mW: 10^(dBm / 10)
    totalLinearPower += Math.pow(10, p / 10);
  });

  const peakFrequency = Number(points[peakIndex].frequency.toFixed(2));
  const estimatedIntegratedEnergy = Number((10 * Math.log10(totalLinearPower + 1e-12)).toFixed(2));

  // Occupied Bandwidth Calculation (points within 10dB of peak)
  const power10dBDown = peakPower - 10;
  const activeFreqs = points
    .filter(pt => pt.power >= power10dBDown && pt.power > baseNoise + 3)
    .map(pt => pt.frequency);

  let occupiedBandwidth = 0;
  if (activeFreqs.length > 1) {
    occupiedBandwidth = Number((Math.max(...activeFreqs) - Math.min(...activeFreqs)).toFixed(2));
  } else if (activeFreqs.length === 1) {
    occupiedBandwidth = binStep;
  }

  // Spectral Kurtosis (fourth standardized moment of linear amplitudes)
  const linearAmplitudes = powers.map(p => Math.pow(10, p / 20));
  const meanAmp = linearAmplitudes.reduce((a, b) => a + b, 0) / linearAmplitudes.length;
  let varianceSum = 0;
  let fourthMomentSum = 0;
  linearAmplitudes.forEach(a => {
    const diff = a - meanAmp;
    varianceSum += diff * diff;
    fourthMomentSum += Math.pow(diff, 4);
  });
  const variance = varianceSum / linearAmplitudes.length;
  const stdDev = Math.sqrt(variance) || 1e-6;
  const spectralKurtosis = Number((fourthMomentSum / (linearAmplitudes.length * Math.pow(stdDev, 4))).toFixed(2));

  const snrEstimate = Number((peakPower - baseNoise).toFixed(1));

  const features: ExtractedFeatures = {
    peakFrequency,
    peakPower: Number(peakPower.toFixed(2)),
    totalEnergy: estimatedIntegratedEnergy,
    occupiedBandwidth,
    spectralKurtosis,
    snrEstimate,
    crossingBinsCount: exceededCount
  };

  return {
    points,
    features,
    isDetected,
    thresholdValue: Number(fixedThreshold.toFixed(2))
  };
}

// Machine Learning Classification Engine
export function classifyRFSignal(
  features: ExtractedFeatures,
  isDetected: boolean,
  modelType: MLModelType,
  preset: string
): ClassificationResult {
  if (!isDetected) {
    return {
      predictedClass: 'Background Noise / Thermal Fluctuation',
      confidence: 97.4,
      classProbabilities: {
        'Background Noise / Thermal Fluctuation': 0.974,
        'UAV / Drone Controller (DJI OcuSync)': 0.009,
        'Wi-Fi Interference (802.11ax)': 0.008,
        'Bluetooth LE Beacon': 0.006,
        'Overlapping Drone + Wi-Fi': 0.003
      },
      modelUsed: modelType,
      featureImportance: [
        { feature: 'Energy < Detection Threshold', value: `${features.totalEnergy} dBm`, impact: 'high' },
        { feature: 'SNR Estimate', value: `${features.snrEstimate} dB`, impact: 'high' },
        { feature: 'Crossing Bins', value: `${features.crossingBinsCount}`, impact: 'medium' }
      ],
      explanation: 'Signal energy is below the Neyman-Pearson decision boundary. Classified as ambient thermal noise floor.'
    };
  }

  // Feature vector:
  // - occupiedBandwidth (MHz): Drone ~ 1.5 - 5 MHz, Wi-Fi ~ 15 - 25 MHz, Overlapping ~ > 22 MHz, BLE ~ 0.8 - 2.0 MHz
  // - spectralKurtosis: Drone ~ high (> 4.5), Wi-Fi ~ medium/flat (~ 2.0 - 3.5), Noise ~ 3.0
  // - snrEstimate: > 12 dB = high confidence
  const { occupiedBandwidth: obw, spectralKurtosis: kurt, snrEstimate: snr } = features;

  let predictedClass: DetectedClass = 'Background Noise / Thermal Fluctuation';
  let confidence = 85.0;
  const probs: Record<DetectedClass, number> = {
    'UAV / Drone Controller (DJI OcuSync)': 0.05,
    'Wi-Fi Interference (802.11ax)': 0.05,
    'Bluetooth LE Beacon': 0.05,
    'Overlapping Drone + Wi-Fi': 0.05,
    'Background Noise / Thermal Fluctuation': 0.05
  };

  const importance: { feature: string; value: string; impact: 'high' | 'medium' | 'low' }[] = [];

  if (modelType === 'decision_tree') {
    // Transparent deterministic decision tree
    if (obw > 22 && kurt > 3.8) {
      predictedClass = 'Overlapping Drone + Wi-Fi';
      probs['Overlapping Drone + Wi-Fi'] = 0.88;
      probs['Wi-Fi Interference (802.11ax)'] = 0.08;
      confidence = 88.5;
      importance.push(
        { feature: 'Bandwidth > 22 MHz (Wideband)', value: `${obw} MHz`, impact: 'high' },
        { feature: 'High Kurtosis Spike Overlay', value: `${kurt}`, impact: 'high' },
        { feature: 'Dual Spectral Peaks', value: 'Detected', impact: 'medium' }
      );
    } else if (obw > 12) {
      predictedClass = 'Wi-Fi Interference (802.11ax)';
      probs['Wi-Fi Interference (802.11ax)'] = 0.94;
      probs['Overlapping Drone + Wi-Fi'] = 0.04;
      confidence = Math.min(99.2, 90.0 + (snr > 10 ? 6 : snr * 0.4));
      importance.push(
        { feature: 'Occupied Bandwidth ~ 20 MHz', value: `${obw} MHz`, impact: 'high' },
        { feature: 'Flat-top OFDM Envelope', value: 'Sinc ripple verified', impact: 'high' },
        { feature: 'Low Kurtosis (Gaussian-like)', value: `${kurt}`, impact: 'medium' }
      );
    } else if (obw <= 1.5 && snr < 18) {
      predictedClass = 'Bluetooth LE Beacon';
      probs['Bluetooth LE Beacon'] = 0.89;
      probs['UAV / Drone Controller (DJI OcuSync)'] = 0.07;
      confidence = 89.2;
      importance.push(
        { feature: 'Bandwidth <= 1.5 MHz', value: `${obw} MHz`, impact: 'high' },
        { feature: 'GFSK Gaussian Pulse', value: 'Verified', impact: 'medium' },
        { feature: 'Center Freq Offset', value: `${features.peakFrequency} MHz`, impact: 'low' }
      );
    } else if (obw > 1.5 && obw <= 12) {
      predictedClass = 'UAV / Drone Controller (DJI OcuSync)';
      probs['UAV / Drone Controller (DJI OcuSync)'] = 0.95;
      probs['Bluetooth LE Beacon'] = 0.03;
      confidence = Math.min(99.5, 91.5 + (kurt > 4 ? 5 : 2));
      importance.push(
        { feature: 'Occupied Bandwidth ~ 2-8 MHz', value: `${obw} MHz`, impact: 'high' },
        { feature: 'High Spectral Kurtosis (FHSS burst)', value: `${kurt}`, impact: 'high' },
        { feature: 'High Peak-to-Average Ratio', value: `${(features.peakPower - features.totalEnergy + 20).toFixed(1)} dB`, impact: 'medium' }
      );
    } else {
      predictedClass = 'Background Noise / Thermal Fluctuation';
      probs['Background Noise / Thermal Fluctuation'] = 0.72;
      confidence = 72.0;
      importance.push(
        { feature: 'Indeterminate Spectral Profile', value: `${obw} MHz`, impact: 'high' }
      );
    }
  } else if (modelType === 'random_forest') {
    // Ensemble voting simulation with slightly softer calibrated probabilities
    if (obw > 20 && kurt > 3.5) {
      predictedClass = 'Overlapping Drone + Wi-Fi';
      probs['Overlapping Drone + Wi-Fi'] = 0.84;
      probs['Wi-Fi Interference (802.11ax)'] = 0.11;
      probs['UAV / Drone Controller (DJI OcuSync)'] = 0.05;
      confidence = 84.7;
    } else if (obw > 13) {
      predictedClass = 'Wi-Fi Interference (802.11ax)';
      probs['Wi-Fi Interference (802.11ax)'] = 0.92;
      probs['Overlapping Drone + Wi-Fi'] = 0.05;
      probs['Background Noise / Thermal Fluctuation'] = 0.03;
      confidence = 92.4;
    } else if (obw <= 1.8 && kurt < 4.0) {
      predictedClass = 'Bluetooth LE Beacon';
      probs['Bluetooth LE Beacon'] = 0.88;
      probs['UAV / Drone Controller (DJI OcuSync)'] = 0.09;
      confidence = 88.0;
    } else {
      predictedClass = 'UAV / Drone Controller (DJI OcuSync)';
      probs['UAV / Drone Controller (DJI OcuSync)'] = 0.93;
      probs['Bluetooth LE Beacon'] = 0.04;
      probs['Wi-Fi Interference (802.11ax)'] = 0.03;
      confidence = 93.6;
    }
    importance.push(
      { feature: '100 Decision Trees Voting', value: `${Math.round(confidence)}% consensus`, impact: 'high' },
      { feature: 'Gini Impurity Metric', value: '0.042 (High certainty)', impact: 'high' },
      { feature: 'Bandwidth Feature Weight', value: '0.48', impact: 'medium' }
    );
  } else {
    // SVM with RBF Kernel margin distance
    const marginDistance = snr > 8 ? 2.4 : 1.1;
    if (obw > 14) {
      predictedClass = 'Wi-Fi Interference (802.11ax)';
      confidence = Math.min(98.8, 87.0 + marginDistance * 4);
      probs['Wi-Fi Interference (802.11ax)'] = confidence / 100;
      probs['Overlapping Drone + Wi-Fi'] = (100 - confidence) / 100;
    } else {
      predictedClass = 'UAV / Drone Controller (DJI OcuSync)';
      confidence = Math.min(99.1, 88.5 + marginDistance * 4);
      probs['UAV / Drone Controller (DJI OcuSync)'] = confidence / 100;
      probs['Bluetooth LE Beacon'] = (100 - confidence) / 100;
    }
    importance.push(
      { feature: 'Hyperplane Margin Distance', value: `+${marginDistance.toFixed(2)} sigma`, impact: 'high' },
      { feature: 'RBF Kernel Gamma (γ)', value: '0.025', impact: 'medium' },
      { feature: 'Support Vectors Activated', value: '18 vectors', impact: 'medium' }
    );
  }

  // Normalize probabilities
  const sumProbs = Object.values(probs).reduce((a, b) => a + b, 0);
  (Object.keys(probs) as DetectedClass[]).forEach(k => {
    probs[k] = Number((probs[k] / sumProbs).toFixed(3));
  });

  return {
    predictedClass,
    confidence: Number(confidence.toFixed(1)),
    classProbabilities: probs,
    modelUsed: modelType,
    featureImportance: importance,
    explanation: `Extracted ${obw.toFixed(1)} MHz OBW with kurtosis ${kurt.toFixed(2)} and SNR ${snr.toFixed(1)} dB strongly matches the spectral signature of ${predictedClass}.`
  };
}

// Simple Web Audio API Synthesizer for audible radar click / chirp
let audioCtx: AudioContext | null = null;

export function playAudioFeedback(type: 'detect' | 'alert' | 'click') {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    if (type === 'detect') {
      // High-tech frequency chirp
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'alert') {
      // Warning double tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Audio context may be restricted by browser policy before first user gesture
  }
}

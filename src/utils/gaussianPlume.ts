/**
 * Gaussian Plume Model Implementation
 * Based on EPA's AERMOD and ALOHA dispersion models
 * 
 * Reference: EPA-454/B-03-002, ALOHA Technical Documentation
 */

import { chemicalDatabase, ChemicalProperties } from '@/utils/chemicalDatabase';

// Physical constants
const GRAVITY = 9.81; // m/s²
const GAS_CONSTANT = 8.314; // J/(mol·K)
const STANDARD_PRESSURE = 101325; // Pa
const KELVIN_OFFSET = 273.15;

// Pasquill-Gifford stability class coefficients
// Reference: Turner, D.B. (1970) Workbook of Atmospheric Dispersion Estimates
const SIGMA_Y_COEFFICIENTS: Record<string, { a: number; b: number; c: number; d: number }> = {
  'A': { a: 0.22, b: 0.0001, c: -0.5, d: 0.894 },  // Very unstable
  'B': { a: 0.16, b: 0.0001, c: -0.5, d: 0.894 },  // Unstable
  'C': { a: 0.11, b: 0.0001, c: -0.5, d: 0.894 },  // Slightly unstable
  'D': { a: 0.08, b: 0.0001, c: -0.5, d: 0.894 },  // Neutral
  'E': { a: 0.06, b: 0.0001, c: -0.5, d: 0.894 },  // Stable
  'F': { a: 0.04, b: 0.0001, c: -0.5, d: 0.894 },  // Very stable
};

const SIGMA_Z_COEFFICIENTS: Record<string, { a: number; b: number; c: number; d: number }> = {
  'A': { a: 0.20, b: 0.0000, c: 0.0, d: 0.0 },
  'B': { a: 0.12, b: 0.0000, c: 0.0, d: 0.0 },
  'C': { a: 0.08, b: 0.0002, c: -0.5, d: 0.0 },
  'D': { a: 0.06, b: 0.0015, c: -0.5, d: 0.0 },
  'E': { a: 0.03, b: 0.0003, c: -1.0, d: 0.0 },
  'F': { a: 0.016, b: 0.0003, c: -1.0, d: 0.0 },
};

export interface GaussianPlumeParams {
  /** Source emission rate (kg/s) */
  emissionRate: number;
  /** Stack/release height (m) */
  releaseHeight: number;
  /** Wind speed at release height (m/s) */
  windSpeed: number;
  /** Wind direction (degrees from North, 0-360) */
  windDirection: number;
  /** Pasquill-Gifford stability class (A-F) */
  stabilityClass: string;
  /** Ambient temperature (°C) */
  ambientTemperature: number;
  /** Release/stack gas temperature (°C) */
  releaseTemperature: number;
  /** Source location */
  sourceLocation: { lat: number; lng: number };
  /** Chemical type for threshold lookups */
  chemicalType: string;
  /** Ambient pressure (Pa), default 101325 */
  ambientPressure?: number;
  /** Relative humidity (%), 0-100 */
  humidity?: number;
  /** Stack inner diameter (m), for buoyancy calculations */
  stackDiameter?: number;
  /** Stack exit velocity (m/s) */
  exitVelocity?: number;
}

export interface ConcentrationResult {
  /** Concentration in mg/m³ */
  concentration: number;
  /** Distance from source (m) */
  distance: number;
  /** Crosswind distance from centerline (m) */
  crosswindDistance: number;
  /** Height above ground (m) */
  height: number;
}

export interface PlumeZone {
  distance: number; // meters
  concentration: number; // mg/m³
  sigmaY: number; // horizontal dispersion (m)
  sigmaZ: number; // vertical dispersion (m)
}

/**
 * Calculate horizontal dispersion coefficient (σy) using Pasquill-Gifford formulas
 * @param x Downwind distance (m)
 * @param stabilityClass Pasquill stability class (A-F)
 */
export function calculateSigmaY(x: number, stabilityClass: string): number {
  const coeff = SIGMA_Y_COEFFICIENTS[stabilityClass] || SIGMA_Y_COEFFICIENTS['D'];
  // Briggs rural formula: σy = ax^0.894
  const xKm = x / 1000;
  return coeff.a * Math.pow(xKm, coeff.d) * 1000;
}

/**
 * Calculate vertical dispersion coefficient (σz) using Pasquill-Gifford formulas
 * @param x Downwind distance (m)
 * @param stabilityClass Pasquill stability class (A-F)
 */
export function calculateSigmaZ(x: number, stabilityClass: string): number {
  const coeff = SIGMA_Z_COEFFICIENTS[stabilityClass] || SIGMA_Z_COEFFICIENTS['D'];
  const xKm = x / 1000;
  
  // Use different formulas for different stability classes
  if (stabilityClass === 'A' || stabilityClass === 'B') {
    return coeff.a * Math.pow(xKm, 0.92) * 1000;
  } else if (stabilityClass === 'C' || stabilityClass === 'D') {
    return coeff.a * Math.pow(xKm, 0.78) * 1000;
  } else {
    // E and F (stable conditions)
    return coeff.a * Math.pow(xKm, 0.67) * 1000;
  }
}

/**
 * Calculate plume rise using Briggs equations
 * Reference: Briggs, G.A. (1975) Plume Rise Predictions
 * 
 * @param params Plume parameters
 * @returns Plume rise in meters
 */
export function calculatePlumeRise(params: GaussianPlumeParams): number {
  const {
    releaseTemperature,
    ambientTemperature,
    windSpeed,
    stackDiameter = 1.0,
    exitVelocity = 10.0,
  } = params;

  const u = Math.max(0.5, windSpeed); // Minimum wind speed
  const Ts = releaseTemperature + KELVIN_OFFSET;
  const Ta = ambientTemperature + KELVIN_OFFSET;
  const d = stackDiameter;
  const vs = exitVelocity;

  // Buoyancy flux (m⁴/s³)
  const deltaT = Ts - Ta;
  const Fb = GRAVITY * vs * d * d * deltaT / (4 * Ts);

  // Momentum flux (m⁴/s²)
  const Fm = vs * vs * d * d * Ta / (4 * Ts);

  // Determine if buoyancy or momentum dominated
  let plumeRise: number;

  if (deltaT > 0 && Fb > 0) {
    // Buoyancy-dominated plume rise (Briggs neutral/unstable)
    if (params.stabilityClass === 'A' || params.stabilityClass === 'B' || 
        params.stabilityClass === 'C' || params.stabilityClass === 'D') {
      // Neutral/unstable conditions
      plumeRise = 1.6 * Math.pow(Fb, 1/3) * Math.pow(100, 2/3) / u;
    } else {
      // Stable conditions (E, F)
      const s = 0.02; // Stability parameter for stable conditions
      plumeRise = 2.6 * Math.pow(Fb / (u * s), 1/3);
    }
  } else {
    // Momentum-dominated plume rise
    plumeRise = 3.0 * d * vs / u;
  }

  return Math.max(0, plumeRise);
}

/**
 * Calculate ground-level concentration at a specific point using Gaussian Plume equation
 * 
 * C(x,y,0) = Q / (π * u * σy * σz) * exp(-y²/2σy²) * exp(-H²/2σz²)
 * 
 * @param params Plume parameters
 * @param x Downwind distance (m)
 * @param y Crosswind distance from centerline (m)
 * @param z Height above ground (m), default 0 for ground-level
 */
export function calculateConcentration(
  params: GaussianPlumeParams,
  x: number,
  y: number = 0,
  z: number = 0
): number {
  if (x <= 0) return 0;

  const { emissionRate, windSpeed, stabilityClass, releaseHeight } = params;
  const u = Math.max(0.5, windSpeed);

  // Calculate effective release height (physical + plume rise)
  const plumeRise = calculatePlumeRise(params);
  const H = releaseHeight + plumeRise;

  // Calculate dispersion coefficients
  const sigmaY = calculateSigmaY(x, stabilityClass);
  const sigmaZ = calculateSigmaZ(x, stabilityClass);

  if (sigmaY <= 0 || sigmaZ <= 0) return 0;

  // Gaussian plume equation for ground-level concentration with reflection
  // Q in kg/s, convert to g/s for mg/m³ output
  const Q = emissionRate * 1000; // kg/s to g/s

  // Crosswind term
  const crosswindTerm = Math.exp(-0.5 * Math.pow(y / sigmaY, 2));

  // Vertical term with ground reflection (z = 0)
  const verticalTerm = Math.exp(-0.5 * Math.pow((z - H) / sigmaZ, 2)) +
                       Math.exp(-0.5 * Math.pow((z + H) / sigmaZ, 2));

  // Concentration in g/m³, convert to mg/m³
  const concentration = (Q / (2 * Math.PI * u * sigmaY * sigmaZ)) * 
                        crosswindTerm * verticalTerm * 1000; // g/m³ to mg/m³

  return Math.max(0, concentration);
}

/**
 * Calculate maximum ground-level concentration and its location
 */
export function calculateMaxConcentration(params: GaussianPlumeParams): {
  maxConcentration: number;
  distanceOfMax: number;
} {
  const plumeRise = calculatePlumeRise(params);
  const H = params.releaseHeight + plumeRise;

  // Search for maximum concentration along centerline
  let maxConc = 0;
  let maxDist = 100;

  // Scan from 10m to 50km
  for (let x = 10; x <= 50000; x *= 1.1) {
    const conc = calculateConcentration(params, x, 0, 0);
    if (conc > maxConc) {
      maxConc = conc;
      maxDist = x;
    }
  }

  return { maxConcentration: maxConc, distanceOfMax: maxDist };
}

/**
 * Find distance where concentration equals a threshold value
 */
export function findDistanceForThreshold(
  params: GaussianPlumeParams,
  threshold: number
): number {
  const { maxConcentration, distanceOfMax } = calculateMaxConcentration(params);
  
  if (maxConcentration < threshold) {
    return 0; // Threshold never exceeded
  }

  // Binary search for distance where concentration drops to threshold
  let low = distanceOfMax;
  let high = 100000; // 100km max

  while (high - low > 10) {
    const mid = (low + high) / 2;
    const conc = calculateConcentration(params, mid, 0, 0);
    
    if (conc > threshold) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round(high);
}

/**
 * Generate concentration profile along plume centerline
 */
export function generateConcentrationProfile(
  params: GaussianPlumeParams,
  numPoints: number = 50
): ConcentrationResult[] {
  const results: ConcentrationResult[] = [];
  
  // Generate points from 10m to max distance
  const maxDistance = 10000; // 10km
  const logStart = Math.log10(10);
  const logEnd = Math.log10(maxDistance);
  
  for (let i = 0; i < numPoints; i++) {
    const logX = logStart + (logEnd - logStart) * (i / (numPoints - 1));
    const x = Math.pow(10, logX);
    
    results.push({
      distance: Math.round(x),
      concentration: calculateConcentration(params, x, 0, 0),
      crosswindDistance: 0,
      height: 0,
    });
  }

  return results;
}

/**
 * Calculate hazard zones based on chemical-specific thresholds
 */
export function calculateHazardZones(params: GaussianPlumeParams): {
  red: PlumeZone;
  orange: PlumeZone;
  yellow: PlumeZone;
} {
  const chemical = chemicalDatabase[params.chemicalType.toLowerCase()];
  
  // Default thresholds in ppm, convert to mg/m³
  let redThreshold = 100;   // AEGL-3 equivalent
  let orangeThreshold = 50; // AEGL-2 equivalent
  let yellowThreshold = 10; // AEGL-1 equivalent

  if (chemical) {
    // Use chemical-specific AEGL values, convert from ppm to mg/m³
    const molarVolume = 24.45; // L/mol at 25°C
    const mgPerPpm = chemical.molecularWeight / molarVolume;
    
    redThreshold = (chemical.aegl3 || chemical.idlh || 100) * mgPerPpm;
    orangeThreshold = (chemical.aegl2 || chemical.idlh * 0.1 || 50) * mgPerPpm;
    yellowThreshold = (chemical.aegl1 || chemical.idlh * 0.01 || 10) * mgPerPpm;
  }

  // Find distances for each threshold
  const redDistance = findDistanceForThreshold(params, redThreshold);
  const orangeDistance = findDistanceForThreshold(params, orangeThreshold);
  const yellowDistance = findDistanceForThreshold(params, yellowThreshold);

  return {
    red: {
      distance: redDistance,
      concentration: redThreshold,
      sigmaY: calculateSigmaY(redDistance, params.stabilityClass),
      sigmaZ: calculateSigmaZ(redDistance, params.stabilityClass),
    },
    orange: {
      distance: orangeDistance,
      concentration: orangeThreshold,
      sigmaY: calculateSigmaY(orangeDistance, params.stabilityClass),
      sigmaZ: calculateSigmaZ(orangeDistance, params.stabilityClass),
    },
    yellow: {
      distance: yellowDistance,
      concentration: yellowThreshold,
      sigmaY: calculateSigmaY(yellowDistance, params.stabilityClass),
      sigmaZ: calculateSigmaZ(yellowDistance, params.stabilityClass),
    },
  };
}

/**
 * Convert model parameters to Gaussian plume parameters
 */
export function convertToGaussianParams(params: {
  chemicalType: string;
  releaseRate: number; // kg/min
  windSpeed: number;
  windDirection: number;
  stabilityClass: string;
  temperature: number;
  releaseTemperature: number;
  sourceHeight: number;
  sourceLocation: { lat: number; lng: number };
  humidity?: number;
  ambientPressure?: number;
}): GaussianPlumeParams {
  return {
    emissionRate: params.releaseRate / 60, // kg/min to kg/s
    releaseHeight: params.sourceHeight,
    windSpeed: params.windSpeed,
    windDirection: params.windDirection,
    stabilityClass: params.stabilityClass,
    ambientTemperature: params.temperature,
    releaseTemperature: params.releaseTemperature,
    sourceLocation: params.sourceLocation,
    chemicalType: params.chemicalType,
    ambientPressure: params.ambientPressure,
    humidity: params.humidity,
  };
}

export default {
  calculateSigmaY,
  calculateSigmaZ,
  calculatePlumeRise,
  calculateConcentration,
  calculateMaxConcentration,
  findDistanceForThreshold,
  generateConcentrationProfile,
  calculateHazardZones,
  convertToGaussianParams,
};

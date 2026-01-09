/**
 * Emergency Leakage and Dispersion Selection Model (ELDSM)
 * Dispersion calculation utilities with ALOHA-inspired algorithms
 */

import { chemicalDatabase } from './chemicalDatabase';

interface ModelParameters {
  chemicalType: string;
  releaseRate: number;
  windSpeed: number; 
  windDirection: number;
  stabilityClass: string;
  /** Ambient air temperature (°C) */
  temperature: number;
  /** Release temperature at the source (°C). If omitted, ambient temperature is used. */
  releaseTemperature?: number;
  sourceHeight: number;
  sourceLocation: { lat: number; lng: number };
  ambientPressure?: number;
  humidity?: number;
  terrain?: string;
  relativeHumidity?: number;
  isIndoor?: boolean;
  containmentType?: string;
  sensorThreshold?: number;
  leakDuration?: number;
  sensorCount?: number;
  monitoringMode?: 'continuous' | 'batch';
}

interface ZoneData {
  red: { distance: number; concentration: number };
  orange: { distance: number; concentration: number };
  yellow: { distance: number; concentration: number };
}

export interface DetailedCalculationResults {
  redZone: {
    distance: number;
    concentration: number;
    area: number;
    populationAtRisk: number;
  };
  orangeZone: {
    distance: number;
    concentration: number;
    area: number;
    populationAtRisk: number;
  };
  yellowZone: {
    distance: number;
    concentration: number;
    area: number;
    populationAtRisk: number;
  };
  massReleased: number;
  evaporationRate: number;
  dispersionCoefficients: {
    sigmaY: number;
    sigmaZ: number;
  };
  maximumConcentration: number;
  lethalDistance: number;
  concentrationProfile: Array<{ distance: number; concentration: number }>;
  detectionProbability: number;
  timeToDetection: number;
  recommendedSensorLocations: Array<{ lat: number; lng: number; type: string }>;
  detectionThreshold: number;
  falseAlarmRate: number;
  evacuationTime: number;
}

// Define concentration threshold levels based on ALOHA and chemical safety standards
export const ConcentrationLevels = {
  AEGL3: 'AEGL-3 (Life threatening)',
  AEGL2: 'AEGL-2 (Serious health effects)',
  AEGL1: 'AEGL-1 (Mild effects)',
  ERPG3: 'ERPG-3',
  ERPG2: 'ERPG-2',
  ERPG1: 'ERPG-1',
  IDLH: 'IDLH',
  CUSTOM: 'Custom'
};

/**
 * Calculate the dispersion zones based on the Gaussian Plume model
 * This is a simplified version for visualization purposes
 */
export const calculateDispersion = (params: ModelParameters): ZoneData => {
  // Calculate stability factor based on Pasquill stability class
  const getStabilityFactor = (stabilityClass: string): number => {
    switch(stabilityClass) {
      case 'A': return 0.5;  // Very unstable - more vertical mixing, less horizontal spread
      case 'B': return 0.7;  // Unstable
      case 'C': return 0.9;  // Slightly unstable
      case 'D': return 1.0;  // Neutral
      case 'E': return 1.2;  // Stable - less vertical mixing, more horizontal spread
      case 'F': return 1.5;  // Very stable
      default: return 1.0;   // Default to neutral
    }
  };

  // Get stability factor
  const stabilityFactor = getStabilityFactor(params.stabilityClass);
  
  // Temperature effect on dispersion (affects buoyancy and evaporation)
  // We distinguish ambient air temperature vs release temperature at the source.
  const ambientTempC = params.temperature;
  const releaseTempC = params.releaseTemperature ?? params.temperature;

  // Higher release temperatures increase buoyancy/evaporation.
  const releaseTempKelvin = releaseTempC + 273.15;
  const refTempKelvin = 293.15; // 20°C reference
  const temperatureFactor = Math.pow(releaseTempKelvin / refTempKelvin, 1.5);

  // Humidity effect (relative humidity %). Make this effect visible in the plume.
  const humidityFactor = params.humidity !== undefined
    ? (1.15 - (Math.min(100, Math.max(0, params.humidity)) / 100) * 0.4) // 0%->1.15, 100%->0.75
    : 1;
    
  // Apply pressure adjustment if available
  const pressureFactor = params.ambientPressure 
    ? params.ambientPressure / 1013.25  // Standard pressure normalization
    : 1;
  
  // Terrain adjustment
  const terrainFactor = params.terrain === 'urban' ? 0.8 : 
                       params.terrain === 'forest' ? 0.7 : 
                       params.terrain === 'water' ? 1.2 : 1.0;
  
  // Indoor/outdoor adjustment
  const containmentFactor = params.isIndoor ? 0.3 : 1.0;
  
  // Get chemical data
  const chemicalData = chemicalDatabase[params.chemicalType.toLowerCase()];
  
  // Release height effect on ground-level concentration
  // Elevated releases have lower ground concentrations near source,
  // but the plume touches down further away
  // Using Gaussian plume approximation for effective stack height
  const H = params.sourceHeight || 0; // Release height in meters
  const u = Math.max(0.5, params.windSpeed); // Wind speed, minimum 0.5 m/s
  
  // Buoyancy rise for elevated releases (simplified)
  // Higher (release - ambient) temperature difference = more plume rise
  const deltaT = Math.max(0, releaseTempC - ambientTempC);
  const buoyancyRise = deltaT > 0 ? 1.6 * Math.pow(deltaT * 10, 0.333) * Math.pow(100, 0.667) / u : 0;
  
  // Effective release height
  const effectiveHeight = H + buoyancyRise;
  
  // Height factor: elevated releases reduce ground concentration near source
  // but extend the downwind distance where max concentration occurs
  const heightFactor = effectiveHeight > 0 
    ? Math.min(6, 1 + (effectiveHeight / 25)) // stronger, capped
    : 1;

  // Ground level reduction factor (concentration at ground is lower for elevated sources)
  const groundReductionFactor = effectiveHeight > 0
    ? Math.exp(-0.5 * Math.pow(effectiveHeight / 40, 2)) + 0.2
    : 1;
  
  // Release rate effect - this is CRITICAL for proper scaling
  // Concentration scales linearly with release rate Q
  // Distance for a given concentration scales with sqrt(Q) in Gaussian plume
  const Q = params.releaseRate; // kg/min
  const refQ = 10; // Reference release rate for baseline calculations
  const releaseRateFactor = Math.sqrt(Q / refQ);
  
  // Wind effect - proper atmospheric dispersion relationship
  // Higher wind = more dilution (lower concentration) but wider plume extent
  // Distance scales inversely with wind speed for given concentration
  const windFactor = Math.pow(u, -0.8);
  
  // Combined adjustment factors
  const environmentalFactor = temperatureFactor * humidityFactor * pressureFactor * 
    terrainFactor * containmentFactor;
  
  // Chemical hazard factor (based on actual chemical properties if available)
  let chemicalFactor = 1.0;
  if (chemicalData) {
    // Use molecular weight and vapor pressure to influence the chemical factor
    const molecularWeightFactor = Math.sqrt(chemicalData.molecularWeight) / 10;
    const vaporPressureFactor = Math.log10(Math.max(1, chemicalData.vaporPressure)) / 3;
    
    chemicalFactor = molecularWeightFactor * vaporPressureFactor;
    chemicalFactor = Math.max(0.8, Math.min(2.0, chemicalFactor));
  } else {
    // Fallback
    switch(params.chemicalType.toLowerCase()) {
      case 'chlorine': chemicalFactor = 1.5; break;
      case 'ammonia': chemicalFactor = 1.3; break;
      default: chemicalFactor = 1.2;
    }
  }
  
  // Base distance calculation using improved Gaussian plume principles
  // Distance = f(Q, u, stability, chemistry)
  const baseDistance = stabilityFactor * chemicalFactor * releaseRateFactor * 
    windFactor * environmentalFactor * heightFactor * 5; // 5 km base for ref conditions
  
  // Calculate zone distances with proper scaling
  // Red zone (highest concentration/immediate danger - IDLH level)
  const redDistance = Math.max(0.2, baseDistance * 0.3 * groundReductionFactor);
  // Orange zone (medium concentration/serious health effects - AEGL-2)
  const orangeDistance = Math.max(redDistance * 1.5, baseDistance * 0.6 * groundReductionFactor);
  // Yellow zone (lowest concentration/mild effects - AEGL-1)
  const yellowDistance = Math.max(orangeDistance * 1.3, baseDistance * 1.0);
  
  // Get threshold concentrations from chemical data
  const redConcentration = chemicalData?.aegl3 || chemicalData?.idlh || 50;
  const orangeConcentration = chemicalData?.aegl2 || redConcentration * 0.5;
  const yellowConcentration = chemicalData?.aegl1 || orangeConcentration * 0.3;
  
  return {
    red: { 
      distance: Math.round(redDistance * 1000), // Convert km to meters
      concentration: Math.round(redConcentration)
    },
    orange: { 
      distance: Math.round(orangeDistance * 1000),
      concentration: Math.round(orangeConcentration)
    },
    yellow: { 
      distance: Math.round(yellowDistance * 1000),
      concentration: Math.round(yellowConcentration)
    }
  };
};

// Calculate stability factor based on Pasquill stability class
const getStabilityFactor = (stabilityClass: string): number => {
  switch(stabilityClass) {
    case 'A': return 0.5;  // Very unstable
    case 'B': return 0.7;  // Unstable
    case 'C': return 0.9;  // Slightly unstable
    case 'D': return 1.0;  // Neutral
    case 'E': return 1.2;  // Stable
    case 'F': return 1.5;  // Very stable
    default: return 1.0;   // Default to neutral
  }
};

/**
 * Calculate detailed dispersion results including mass balance, area affected,
 * population at risk, and concentration profile - with rounded values
 */
export const calculateDetailedDispersion = (params: ModelParameters): DetailedCalculationResults => {
  // Get basic zone data
  const zoneData = calculateDispersion(params);
  
  // Calculate mass released (simplified)
  const simulationTime = params.leakDuration || 60; // default 60 minutes
  const massReleased = Math.round(params.releaseRate * simulationTime);
  const evaporationRate = Math.round((params.releaseRate / 60) * 100) / 100; // kg/s
  
  // Calculate dispersion coefficients (simplified version of Pasquill-Gifford)
  // In a real model, these would be based on complex formulas
  const distance = zoneData.yellow.distance * 1000; // meters
  const sigmaY = Math.round(calculateSigmaY(distance, params.stabilityClass) * 100) / 100;
  const sigmaZ = Math.round(calculateSigmaZ(distance, params.stabilityClass) * 100) / 100;
  
  // Calculate maximum concentration at source using proper Gaussian formula
  // C = Q / (π * u * σy * σz) where Q is emission rate, u is wind speed
  const windSpeedEffective = Math.max(0.5, params.windSpeed); // Minimum wind speed for stability
  const maxConcentration = Math.round((params.releaseRate * 1000000) / (Math.PI * windSpeedEffective * sigmaY * sigmaZ * 3600)); // Convert to mg/m³
  
  // Calculate lethal distance (simplified - would use IDLH or LC50 in reality)
  const lethalDistance = Math.round((zoneData.red.distance * 0.7) * 100) / 100;
  
  // Calculate areas using proper elliptical plume shape accounting for wind
  // Plume is elongated in wind direction with wind-dependent spread
  const windSpreadFactor = Math.max(0.2, 1 / Math.sqrt(params.windSpeed)); // Narrower in high wind
  const plumeAspectRatio = Math.min(3, params.windSpeed / 2); // Length/width ratio
  
  const redArea = Math.round((Math.PI * Math.pow(zoneData.red.distance, 2) * windSpreadFactor * plumeAspectRatio) * 100) / 100;
  const orangeArea = Math.round(((Math.PI * Math.pow(zoneData.orange.distance, 2) * windSpreadFactor * plumeAspectRatio) - redArea) * 100) / 100;
  const yellowArea = Math.round(((Math.PI * Math.pow(zoneData.yellow.distance, 2) * windSpreadFactor * plumeAspectRatio) - redArea - orangeArea) * 100) / 100;
  
  // Estimate population at risk based on terrain type
  let populationDensity = 500; // people/km²
  
  if (params.terrain === 'urban') {
    populationDensity = 3000; // Higher density in urban areas
  } else if (params.terrain === 'suburban') {
    populationDensity = 1000; // Medium density in suburban areas
  } else if (params.terrain === 'rural') {
    populationDensity = 100; // Lower density in rural areas
  } else if (params.terrain === 'water') {
    populationDensity = 10; // Very low density on water (boats, etc.)
  } else if (params.terrain === 'forest') {
    populationDensity = 50; // Low density in forests
  }
  
  const redPopulation = Math.round(redArea * populationDensity);
  const orangePopulation = Math.round(orangeArea * populationDensity);
  const yellowPopulation = Math.round(yellowArea * populationDensity);
  
  // Generate concentration profile data
  const concentrationProfile = generateConcentrationProfile(
    params,
    zoneData.red.concentration,
    zoneData.yellow.distance * 1.2
  );
  
  // Calculate leak detection parameters - ensure they are all defined for the return type
  const detectionResults = calculateLeakDetection(params, zoneData);
  
  return {
    redZone: {
      distance: Math.round(zoneData.red.distance * 100) / 100,
      concentration: zoneData.red.concentration,
      area: redArea,
      populationAtRisk: redPopulation
    },
    orangeZone: {
      distance: Math.round(zoneData.orange.distance * 100) / 100,
      concentration: zoneData.orange.concentration,
      area: orangeArea,
      populationAtRisk: orangePopulation
    },
    yellowZone: {
      distance: Math.round(zoneData.yellow.distance * 100) / 100,
      concentration: zoneData.yellow.concentration,
      area: yellowArea,
      populationAtRisk: yellowPopulation
    },
    massReleased,
    evaporationRate,
    dispersionCoefficients: {
      sigmaY,
      sigmaZ
    },
    maximumConcentration: maxConcentration,
    lethalDistance,
    concentrationProfile,
    detectionProbability: Math.round(detectionResults.detectionProbability * 100) / 100,
    timeToDetection: Math.round(detectionResults.timeToDetection),
    recommendedSensorLocations: detectionResults.recommendedSensorLocations,
    detectionThreshold: Math.round(detectionResults.detectionThreshold * 100) / 100,
    falseAlarmRate: Math.round(detectionResults.falseAlarmRate * 100) / 100,
    evacuationTime: Math.round(detectionResults.evacuationTime)
  };
};

// Calculate leak detection parameters
const calculateLeakDetection = (
  params: ModelParameters, 
  zoneData: ZoneData
): { 
  detectionProbability: number;
  timeToDetection: number;
  recommendedSensorLocations: Array<{ lat: number; lng: number; type: string }>;
  detectionThreshold: number;
  falseAlarmRate: number;
  evacuationTime: number;
} => {
  const sensorThreshold = params.sensorThreshold || 0.5; // Default threshold in mg/m³
  const sensorCount = params.sensorCount || 5; // Default number of sensors
  const monitoringMode = params.monitoringMode || 'continuous';
  
  // Calculate detection probability based on sensor coverage and release size
  let detectionProbability = 0.75; // Base probability
  
  // Adjust based on sensor count
  detectionProbability *= Math.min(1, sensorCount / 10);
  
  // Adjust based on release rate (larger releases are easier to detect)
  detectionProbability *= Math.min(1, params.releaseRate / 50);
  
  // Adjust based on monitoring mode
  detectionProbability *= (monitoringMode === 'continuous') ? 1.0 : 0.7;
  
  // Ensure probability is in [0,1] range
  detectionProbability = Math.max(0, Math.min(1, detectionProbability));
  
  // Calculate time to detection (minutes) based on release rate and sensor sensitivity
  const timeToDetection = Math.max(
    1,
    10 * (sensorThreshold / Math.max(0.1, params.releaseRate)) * (monitoringMode === 'continuous' ? 1 : 5)
  );
  
  // Generate recommended sensor locations (simplified)
  const recommendedSensorLocations = [];
  const center = params.sourceLocation;
  const windDirectionRad = params.windDirection * Math.PI / 180;
  
  // Main sensor at source
  recommendedSensorLocations.push({
    lat: Math.round(center.lat * 10000) / 10000,
    lng: Math.round(center.lng * 10000) / 10000,
    type: 'fixed'
  });
  
  // Sensors placed in the predominant wind direction
  for (let i = 1; i < Math.min(5, sensorCount); i++) {
    // Calculate position based on wind direction
    // Adjusting the angle slightly for each sensor
    const angle = windDirectionRad + (i % 2 === 0 ? 0.3 : -0.3);
    const distance = (i * zoneData.yellow.distance / 4); // km
    
    // Calculate lat/lng (simplified)
    const lat = center.lat + (distance * Math.cos(angle)) / 111.32; // km per degree lat
    const lng = center.lng + (distance * Math.sin(angle)) / (111.32 * Math.cos(center.lat * (Math.PI / 180)));
    
    recommendedSensorLocations.push({
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      type: i < 3 ? 'fixed' : 'mobile'
    });
  }
  
  // Calculate false alarm rate (inverse relationship with threshold)
  const falseAlarmRate = 2 / (sensorThreshold * 4);
  
  // Estimate evacuation time based on population and zone sizes
  const avgPopulationDensity = 500; // people per km²
  const totalArea = Math.PI * Math.pow(zoneData.yellow.distance, 2);
  const totalPopulation = totalArea * avgPopulationDensity;
  
  // Simple evacuation time estimate (minutes) - would be much more complex in reality
  const evacuationTime = 20 + Math.sqrt(totalPopulation / 100);
  
  return {
    detectionProbability,
    timeToDetection,
    recommendedSensorLocations,
    detectionThreshold: sensorThreshold,
    falseAlarmRate,
    evacuationTime
  };
};

/**
 * Generate specific sensor placement recommendations based on model parameters
 */
export const generateSensorRecommendations = (
  params: ModelParameters,
  zoneData: ZoneData,
  sensorCount: number = 8
): Array<{ lat: number; lng: number; type: string; priority: number }> => {
  const recommendedSensorLocations = [];
  const center = params.sourceLocation;
  const windDirectionRad = params.windDirection * Math.PI / 180;
  
  // Advanced sensor placement strategy based on ALOHA principles
  // 1. Place primary sensors at the source and slightly downwind
  // 2. Place secondary sensors in a wider arc in the predominant wind direction
  // 3. Place tertiary sensors at key perimeter locations
  
  // Main sensor at source (highest priority)
  recommendedSensorLocations.push({
    lat: Math.round(center.lat * 10000) / 10000,
    lng: Math.round(center.lng * 10000) / 10000,
    type: 'fixed',
    priority: 1
  });
  
  // Downwind sensors in the direction of the wind (high priority)
  const downwindCount = Math.min(3, Math.ceil(sensorCount * 0.4));
  for (let i = 0; i < downwindCount; i++) {
    // Calculate position directly downwind at different distances
    const distanceFactor = (i + 1) / downwindCount;
    const distance = zoneData.orange.distance * distanceFactor; // within orange zone
    
    const lat = center.lat + (distance * Math.cos(windDirectionRad)) / 111.32;
    const lng = center.lng + (distance * Math.sin(windDirectionRad)) / (111.32 * Math.cos(center.lat * (Math.PI / 180)));
    
    recommendedSensorLocations.push({
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      type: 'fixed',
      priority: 2
    });
  }
  
  // Crosswind sensors perpendicular to wind direction (medium priority)
  const crosswindCount = Math.min(3, Math.ceil(sensorCount * 0.3));
  for (let i = 0; i < crosswindCount; i++) {
    // Calculate positions perpendicular to wind direction
    const crossFactor = (i % 2 === 0) ? 1 : -1; // alternate sides
    const crossAngle = windDirectionRad + (crossFactor * Math.PI / 2); // 90 degrees to wind
    const crossDistance = zoneData.yellow.distance * 0.5 * ((i + 1) / crosswindCount);
    
    const lat = center.lat + (crossDistance * Math.cos(crossAngle)) / 111.32;
    const lng = center.lng + (crossDistance * Math.sin(crossAngle)) / (111.32 * Math.cos(center.lat * (Math.PI / 180)));
    
    recommendedSensorLocations.push({
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      type: i === 0 ? 'fixed' : 'mobile',
      priority: 3
    });
  }
  
  // Perimeter sensors at strategic points (lower priority)
  const perimeterCount = Math.max(1, sensorCount - downwindCount - crosswindCount - 1);
  for (let i = 0; i < perimeterCount; i++) {
    // Calculate positions in a wider arc around the perimeter
    const perimeterAngle = windDirectionRad + (Math.PI * (i + 1) / (perimeterCount + 1));
    const perimeterDistance = zoneData.yellow.distance * 0.9;
    
    const lat = center.lat + (perimeterDistance * Math.cos(perimeterAngle)) / 111.32;
    const lng = center.lng + (perimeterDistance * Math.sin(perimeterAngle)) / (111.32 * Math.cos(center.lat * (Math.PI / 180)));
    
    recommendedSensorLocations.push({
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      type: 'mobile',
      priority: 4
    });
  }
  
  return recommendedSensorLocations;
};

/**
 * Simulate leak detection based on model parameters
 * Returns true if a leak is detected
 */
export const simulateLeakDetection = (params: ModelParameters): boolean => {
  // For demo purposes, simulate detection based on release rate and settings
  const results = calculateDetailedDispersion(params);
  
  if (params.monitoringMode === 'batch') {
    // Batch monitoring has lower detection probability
    return Math.random() < results.detectionProbability * 0.8;
  } else {
    // Continuous monitoring
    return Math.random() < results.detectionProbability;
  }
};

/**
 * Calculate combined dispersion effects from multiple sources
 */
export const calculateMultiSourceDispersion = (
  primaryParams: ModelParameters,
  additionalSources: Array<{ location: { lat: number; lng: number }; chemicalType: string; releaseRate: number }>
): Array<{ sourceId: string; zones: ZoneData }> => {
  const multiSourceZones = [];
  
  additionalSources.forEach((source, index) => {
    const sourceParams: ModelParameters = {
      ...primaryParams,
      sourceLocation: source.location,
      chemicalType: source.chemicalType,
      releaseRate: source.releaseRate
    };
    
    const zones = calculateDispersion(sourceParams);
    
    multiSourceZones.push({
      sourceId: `source-${index + 1}`,
      zones
    });
  });
  
  return multiSourceZones;
};

/**
 * Generate a concentration profile for graphing - with rounded values
 */
const generateConcentrationProfile = (
  params: ModelParameters,
  maxConc: number,
  maxDist: number
): Array<{ distance: number; concentration: number }> => {
  const points = [];
  const intervals = 20;
  
  // Use a more realistic decay model based on the Gaussian plume model
  // C(x) = C₀ × exp(-k × x^n)
  // Where:
  // - C₀ is the initial concentration
  // - k is a decay constant (influenced by stability class)
  // - n is a power factor (typically 1.5-2.5)
  
  // Determine decay parameters based on stability class
  let k, n;
  switch(params.stabilityClass) {
    case 'A': 
      k = 4.0; 
      n = 1.5; // Very unstable, rapid dispersion
      break;
    case 'B': 
      k = 3.5; 
      n = 1.6;
      break;
    case 'C': 
      k = 3.0; 
      n = 1.7;
      break;
    case 'D': 
      k = 2.5; 
      n = 1.8; // Neutral conditions
      break;
    case 'E': 
      k = 2.0; 
      n = 1.9;
      break;
    case 'F': 
      k = 1.5; 
      n = 2.0; // Very stable, slower dispersion
      break;
    default: 
      k = 2.5; 
      n = 1.8; // Default to neutral
  }
  
  // Adjust for wind speed (higher wind speeds lead to faster initial dilution but wider spread)
  const windFactor = Math.min(Math.max(params.windSpeed, 1), 10) / 5;
  k = k * (0.7 + windFactor * 0.3);
  
  for (let i = 0; i <= intervals; i++) {
    const distance = (maxDist * i) / intervals;
    
    // Adjusted Gaussian plume model calculation (simplified)
    const normalizedDistance = distance / maxDist;
    const concentration = maxConc * Math.exp(-k * Math.pow(normalizedDistance, n));
    
    points.push({
      distance: Math.round(distance * 100) / 100,
      concentration: Math.round(concentration * 1000) / 1000
    });
  }
  
  return points;
};

/**
 * Calculate horizontal dispersion coefficient σy (simplified)
 */
const calculateSigmaY = (distance: number, stabilityClass: string): number => {
  // Simplified version of Pasquill-Gifford equations
  const coefficients: { [key: string]: { a: number; b: number } } = {
    'A': { a: 0.22, b: 0.0001 },
    'B': { a: 0.16, b: 0.0001 },
    'C': { a: 0.11, b: 0.0001 },
    'D': { a: 0.08, b: 0.0001 },
    'E': { a: 0.06, b: 0.0001 },
    'F': { a: 0.04, b: 0.0001 }
  };
  
  const coef = coefficients[stabilityClass] || coefficients['D'];
  return coef.a * distance * Math.pow((1 + coef.b * distance), -0.5);
};

/**
 * Calculate vertical dispersion coefficient σz (simplified)
 */
const calculateSigmaZ = (distance: number, stabilityClass: string): number => {
  // Simplified version of Pasquill-Gifford equations
  const coefficients: { [key: string]: { c: number; d: number } } = {
    'A': { c: 0.20, d: 0.0 },
    'B': { c: 0.12, d: 0.0 },
    'C': { c: 0.08, d: 0.0002 },
    'D': { c: 0.06, d: 0.0003 },
    'E': { c: 0.03, d: 0.0004 },
    'F': { c: 0.016, d: 0.0005 }
  };
  
  const coef = coefficients[stabilityClass] || coefficients['D'];
  return coef.c * distance * Math.pow((1 + coef.d * distance), -0.5);
};

/**
 * Convert concentration units
 */
export const convertConcentration = (
  value: number,
  fromUnit: 'mg/m3' | 'ppm' | 'percent',
  toUnit: 'mg/m3' | 'ppm' | 'percent'
): number => {
  if (fromUnit === toUnit) return value;
  
  // This would be implemented with proper conversion factors
  // based on molecular weights and standard conditions
  return value; // Placeholder
};

/**
 * Calculate the health impact based on concentration and exposure time
 */
export const calculateHealthImpact = (
  concentration: number,
  exposureTime: number,
  chemicalType: string
): { severity: 'low' | 'medium' | 'high' | 'fatal', description: string } => {
  // Get chemical data if available
  const chemicalData = chemicalDatabase[chemicalType.toLowerCase()];
  
  const dosage = concentration * exposureTime;
  
  // Use AEGL values if available for the chemical
  if (chemicalData) {
    // Convert concentration to ppm for comparison with AEGLs
    const concInPpm = concentration * 24.45 / chemicalData.molecularWeight;
    
    if (chemicalData.aegl3 && concInPpm > chemicalData.aegl3) {
      return { 
        severity: 'fatal', 
        description: `Exceeds AEGL-3 (${Math.round(chemicalData.aegl3)} ppm): Life-threatening health effects or death possible` 
      };
    } else if (chemicalData.aegl2 && concInPpm > chemicalData.aegl2) {
      return { 
        severity: 'high', 
        description: `Exceeds AEGL-2 (${Math.round(chemicalData.aegl2)} ppm): Long-lasting adverse health effects possible` 
      };
    } else if (chemicalData.aegl1 && concInPpm > chemicalData.aegl1) {
      return { 
        severity: 'medium', 
        description: `Exceeds AEGL-1 (${Math.round(chemicalData.aegl1)} ppm): Notable discomfort, irritation, or non-disabling effects` 
      };
    } else {
      return { 
        severity: 'low', 
        description: 'Below all applicable exposure guidelines' 
      };
    }
  }
  
  // Fallback when chemical data is unavailable
  if (dosage > 1000) {
    return { severity: 'fatal', description: 'Potentially fatal exposure' };
  } else if (dosage > 500) {
    return { severity: 'high', description: 'Serious health effects' };
  } else if (dosage > 100) {
    return { severity: 'medium', description: 'Moderate health effects' };
  } else {
    return { severity: 'low', description: 'Minor irritation possible' };
  }
};

/**
 * ALOHA-inspired function to calculate the effectiveness of protective actions
 */
export const evaluateProtectiveActions = (
  params: ModelParameters,
  evacuationTime: number,
  shelterType: 'indoor' | 'vehicle' | 'fullEvacuation'
): { effectivenessPercent: number; casualtyReductionPercent: number; recommendation: string } => {
  const results = calculateDetailedDispersion(params);
  const timeToDetection = results.timeToDetection;
  
  let effectivenessPercent = 0;
  let casualtyReductionPercent = 0;
  let recommendation = '';
  
  // Calculate if there's enough time to evacuate before significant exposure
  const timeBeforeSignificantExposure = 10; // minutes, simplified assumption
  const totalAvailableTime = timeBeforeSignificantExposure - timeToDetection;
  
  // Effectiveness depends on available time vs. required evacuation time
  if (shelterType === 'fullEvacuation') {
    if (totalAvailableTime > evacuationTime) {
      // Full evacuation is possible
      effectivenessPercent = 95;
      casualtyReductionPercent = 98;
      recommendation = "Full evacuation recommended - sufficient time available";
    } else if (totalAvailableTime > evacuationTime * 0.7) {
      // Partial evacuation is possible
      effectivenessPercent = 75;
      casualtyReductionPercent = 85;
      recommendation = "Partial evacuation possible - prioritize vulnerable populations";
    } else {
      // Not enough time to evacuate
      effectivenessPercent = 30;
      casualtyReductionPercent = 40;
      recommendation = "Insufficient time for evacuation - shelter in place";
    }
  } else if (shelterType === 'indoor') {
    // Indoor sheltering effectiveness depends on chemical properties
    const chemicalData = chemicalDatabase[params.chemicalType.toLowerCase()];
    
    // Building protection factor (simplified)
    let buildingProtectionFactor = 0.5; // Default 50% reduction
    
    if (chemicalData) {
      // Adjust based on chemical properties (e.g., gases penetrate buildings more easily)
      if (chemicalData.boilingPoint < 20) {
        buildingProtectionFactor = 0.7; // Only 30% reduction for gases
      } else if (chemicalData.boilingPoint > 100) {
        buildingProtectionFactor = 0.3; // 70% reduction for higher boiling point chemicals
      }
    }
    
    effectivenessPercent = Math.round((1 - buildingProtectionFactor) * 100);
    casualtyReductionPercent = effectivenessPercent + 10; // Slightly higher casualty reduction
    recommendation = "Shelter in place - close all windows and doors, turn off ventilation";
  } else {
    // Vehicle provides minimal protection
    effectivenessPercent = 20;
    casualtyReductionPercent = 30;
    recommendation = "Vehicle provides minimal protection - evacuate if possible";
  }
  
  return {
    effectivenessPercent: Math.round(effectivenessPercent),
    casualtyReductionPercent: Math.round(casualtyReductionPercent),
    recommendation
  };
};


import { calculateDispersion, calculateDetailedDispersion, DetailedCalculationResults } from './dispersionModel';

export interface MultipleSourceParameters {
  sources: Array<{
    id: string;
    location: { lat: number; lng: number };
    chemicalType: string;
    releaseRate: number;
    temperature?: number;
    sourceHeight?: number;
  }>;
  windSpeed: number;
  windDirection: number;
  stabilityClass: string;
  temperature: number;
  ambientPressure?: number;
  humidity?: number;
  terrain?: string;
  relativeHumidity?: number;
  isIndoor?: boolean;
  containmentType?: string;
}

export interface MultipleSourceResults {
  combinedZones: {
    red: { distance: number; concentration: number; area: number };
    orange: { distance: number; concentration: number; area: number };
    yellow: { distance: number; concentration: number; area: number };
  };
  individualSources: Array<{
    sourceId: string;
    results: DetailedCalculationResults;
  }>;
  totalMassReleased: number;
  maxConcentration: number;
  affectedPopulation: number;
  priorityEvacuationZones: Array<{
    center: { lat: number; lng: number };
    radius: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Calculate dispersion for multiple sources
 */
export const calculateMultipleSourceDispersion = (params: MultipleSourceParameters): MultipleSourceResults => {
  const individualResults: Array<{ sourceId: string; results: DetailedCalculationResults }> = [];
  let totalMassReleased = 0;
  let maxConcentration = 0;
  let totalAffectedPopulation = 0;

  // Calculate dispersion for each source individually
  params.sources.forEach(source => {
    const sourceParams = {
      chemicalType: source.chemicalType,
      releaseRate: source.releaseRate,
      windSpeed: params.windSpeed,
      windDirection: params.windDirection,
      stabilityClass: params.stabilityClass,
      temperature: source.temperature || params.temperature,
      sourceHeight: source.sourceHeight || 2,
      sourceLocation: source.location,
      ambientPressure: params.ambientPressure,
      humidity: params.humidity,
      terrain: params.terrain,
      relativeHumidity: params.relativeHumidity,
      isIndoor: params.isIndoor,
      containmentType: params.containmentType
    };

    const result = calculateDetailedDispersion(sourceParams);
    individualResults.push({
      sourceId: source.id,
      results: result
    });

    totalMassReleased += result.massReleased;
    maxConcentration = Math.max(maxConcentration, result.maximumConcentration);
    totalAffectedPopulation += result.redZone.populationAtRisk + result.orangeZone.populationAtRisk + result.yellowZone.populationAtRisk;
  });

  // Calculate combined effect zones
  const combinedZones = calculateCombinedZones(individualResults);
  
  // Determine priority evacuation zones
  const priorityZones = determinePriorityEvacuationZones(params.sources, individualResults);

  return {
    combinedZones,
    individualSources: individualResults,
    totalMassReleased: parseFloat(totalMassReleased.toFixed(4)),
    maxConcentration: parseFloat(maxConcentration.toFixed(4)),
    affectedPopulation: totalAffectedPopulation,
    priorityEvacuationZones: priorityZones
  };
};

/**
 * Calculate combined effect zones from multiple sources
 */
const calculateCombinedZones = (results: Array<{ sourceId: string; results: DetailedCalculationResults }>) => {
  // Simplified approach: take the maximum extent for each zone type
  let maxRedDistance = 0;
  let maxOrangeDistance = 0;
  let maxYellowDistance = 0;
  let totalRedArea = 0;
  let totalOrangeArea = 0;
  let totalYellowArea = 0;
  let maxRedConcentration = 0;
  let maxOrangeConcentration = 0;
  let maxYellowConcentration = 0;

  results.forEach(({ results }) => {
    maxRedDistance = Math.max(maxRedDistance, results.redZone.distance);
    maxOrangeDistance = Math.max(maxOrangeDistance, results.orangeZone.distance);
    maxYellowDistance = Math.max(maxYellowDistance, results.yellowZone.distance);
    
    totalRedArea += results.redZone.area;
    totalOrangeArea += results.orangeZone.area;
    totalYellowArea += results.yellowZone.area;
    
    maxRedConcentration = Math.max(maxRedConcentration, results.redZone.concentration);
    maxOrangeConcentration = Math.max(maxOrangeConcentration, results.orangeZone.concentration);
    maxYellowConcentration = Math.max(maxYellowConcentration, results.yellowZone.concentration);
  });

  return {
    red: { 
      distance: parseFloat(maxRedDistance.toFixed(4)), 
      concentration: parseFloat(maxRedConcentration.toFixed(4)), 
      area: parseFloat(totalRedArea.toFixed(4)) 
    },
    orange: { 
      distance: parseFloat(maxOrangeDistance.toFixed(4)), 
      concentration: parseFloat(maxOrangeConcentration.toFixed(4)), 
      area: parseFloat(totalOrangeArea.toFixed(4)) 
    },
    yellow: { 
      distance: parseFloat(maxYellowDistance.toFixed(4)), 
      concentration: parseFloat(maxYellowConcentration.toFixed(4)), 
      area: parseFloat(totalYellowArea.toFixed(4)) 
    }
  };
};

/**
 * Determine priority evacuation zones based on source locations and hazard levels
 */
const determinePriorityEvacuationZones = (
  sources: MultipleSourceParameters['sources'],
  results: Array<{ sourceId: string; results: DetailedCalculationResults }>
): Array<{ center: { lat: number; lng: number }; radius: number; priority: 'high' | 'medium' | 'low' }> => {
  const zones: Array<{ center: { lat: number; lng: number }; radius: number; priority: 'high' | 'medium' | 'low' }> = [];

  results.forEach(({ sourceId, results }) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    // High priority zone (red zone)
    if (results.redZone.distance > 0.1) {
      zones.push({
        center: source.location,
        radius: parseFloat(results.redZone.distance.toFixed(4)),
        priority: 'high'
      });
    }

    // Medium priority zone (orange zone)
    if (results.orangeZone.distance > results.redZone.distance) {
      zones.push({
        center: source.location,
        radius: parseFloat(results.orangeZone.distance.toFixed(4)),
        priority: 'medium'
      });
    }

    // Low priority zone (yellow zone)
    if (results.yellowZone.distance > results.orangeZone.distance) {
      zones.push({
        center: source.location,
        radius: parseFloat(results.yellowZone.distance.toFixed(4)),
        priority: 'low'
      });
    }
  });

  return zones;
};

/**
 * Calculate sensor optimization for multiple sources
 */
export const optimizeSensorPlacementMultipleSources = (
  params: MultipleSourceParameters,
  sensorCount: number = 15
): Array<{ lat: number; lng: number; type: string; priority: number; coverage: string[] }> => {
  const recommendations: Array<{ lat: number; lng: number; type: string; priority: number; coverage: string[] }> = [];
  
  // Calculate individual source results
  const results = calculateMultipleSourceDispersion(params);
  
  // Place high-priority sensors at each source
  params.sources.forEach((source, index) => {
    recommendations.push({
      lat: parseFloat(source.location.lat.toFixed(4)),
      lng: parseFloat(source.location.lng.toFixed(4)),
      type: 'fixed',
      priority: 1,
      coverage: [source.id]
    });
  });
  
  // Place intermediate sensors between sources if multiple sources exist
  if (params.sources.length > 1) {
    for (let i = 0; i < params.sources.length - 1; i++) {
      const source1 = params.sources[i];
      const source2 = params.sources[i + 1];
      
      // Calculate midpoint
      const midLat = (source1.location.lat + source2.location.lat) / 2;
      const midLng = (source1.location.lng + source2.location.lng) / 2;
      
      recommendations.push({
        lat: parseFloat(midLat.toFixed(4)),
        lng: parseFloat(midLng.toFixed(4)),
        type: 'mobile',
        priority: 2,
        coverage: [source1.id, source2.id]
      });
    }
  }
  
  // Fill remaining sensor count with perimeter sensors
  const remainingSensors = sensorCount - recommendations.length;
  const windDirectionRad = params.windDirection * Math.PI / 180;
  
  for (let i = 0; i < remainingSensors && i < 10; i++) {
    // Calculate average source location as center
    const avgLat = params.sources.reduce((sum, s) => sum + s.location.lat, 0) / params.sources.length;
    const avgLng = params.sources.reduce((sum, s) => sum + s.location.lng, 0) / params.sources.length;
    
    // Place sensors in downwind direction at varying distances
    const angle = windDirectionRad + (Math.PI * (i - remainingSensors/2) / remainingSensors);
    const distance = 2 + (i * 0.5); // km
    
    const lat = avgLat + (distance * Math.cos(angle)) / 111.32;
    const lng = avgLng + (distance * Math.sin(angle)) / (111.32 * Math.cos(avgLat * (Math.PI / 180)));
    
    recommendations.push({
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
      type: 'mobile',
      priority: 3,
      coverage: params.sources.map(s => s.id)
    });
  }
  
  return recommendations.slice(0, sensorCount);
};

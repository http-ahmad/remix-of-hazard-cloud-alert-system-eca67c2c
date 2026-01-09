import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PlumeParameters {
  latitude: number;
  longitude: number;
  chemicalName: string;
  releaseRate: number; // kg/hr
  releaseTime: string;
  windSpeed: number; // m/s
  windDirection: number; // degrees
  mapType: 'street' | 'satellite' | 'terrain';
}

interface ConcentrationZone {
  polygon: LatLngExpression[];
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  riskLevel: 'high' | 'moderate' | 'low';
  concentration: number; // mg/m³
  threshold: string;
}

const GaussianPlumeDispersion: React.FC = () => {
  const [parameters, setParameters] = useState<PlumeParameters>({
    latitude: 40.7128,
    longitude: -74.0060,
    chemicalName: 'Chlorine',
    releaseRate: 100,
    releaseTime: new Date().toISOString().slice(0, 16),
    windSpeed: 5,
    windDirection: 90,
    mapType: 'street'
  });

  const [zones, setZones] = useState<ConcentrationZone[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Chemical exposure thresholds (mg/m³)
  const chemicalThresholds: Record<string, { high: number; moderate: number; low: number }> = {
    'Chlorine': { high: 30, moderate: 10, low: 3 },
    'Ammonia': { high: 350, moderate: 175, low: 70 },
    'Hydrogen Sulfide': { high: 100, moderate: 50, low: 20 },
    'Sulfur Dioxide': { high: 100, moderate: 50, low: 20 },
    'Benzene': { high: 160, moderate: 80, low: 32 },
    'Toluene': { high: 750, moderate: 375, low: 150 }
  };

  // Atmospheric stability classes
  const stabilityClasses = {
    A: { alpha: 0.22, beta: 0.0001 }, // Very unstable
    B: { alpha: 0.16, beta: 0.0001 }, // Moderately unstable
    C: { alpha: 0.11, beta: 0.0001 }, // Slightly unstable
    D: { alpha: 0.08, beta: 0.0001 }, // Neutral
    E: { alpha: 0.06, beta: 0.0003 }, // Slightly stable
    F: { alpha: 0.04, beta: 0.0015 }  // Moderately stable
  };

  // Determine stability class based on wind speed (simplified)
  const getStabilityClass = (windSpeed: number): keyof typeof stabilityClasses => {
    if (windSpeed < 2) return 'F';
    if (windSpeed < 3) return 'E';
    if (windSpeed < 5) return 'D';
    if (windSpeed < 7) return 'C';
    if (windSpeed < 10) return 'B';
    return 'A';
  };

  // Gaussian plume concentration calculation
  const calculateConcentration = (
    x: number, // downwind distance (m)
    y: number, // crosswind distance (m)
    z: number, // height (m)
    Q: number, // emission rate (g/s)
    u: number, // wind speed (m/s)
    h: number, // effective stack height (m)
    stability: keyof typeof stabilityClasses
  ): number => {
    const { alpha, beta } = stabilityClasses[stability];
    
    // Dispersion parameters
    const sigmaY = alpha * x * Math.pow(1 + beta * x, -0.5);
    const sigmaZ = alpha * x * Math.pow(1 + beta * x, -0.5);
    
    // Gaussian plume equation
    const concentration = 
      (Q / (2 * Math.PI * u * sigmaY * sigmaZ)) *
      Math.exp(-0.5 * Math.pow(y / sigmaY, 2)) *
      (Math.exp(-0.5 * Math.pow((z - h) / sigmaZ, 2)) + 
       Math.exp(-0.5 * Math.pow((z + h) / sigmaZ, 2)));
    
    return concentration * 1000; // Convert to mg/m³
  };

  // Generate ALOHA-style elliptical plume polygon for a given concentration threshold
  const generatePlumePolygon = (
    sourceLocation: { lat: number; lng: number },
    threshold: number,
    Q: number,
    u: number,
    windDirection: number,
    stability: keyof typeof stabilityClasses
  ): LatLngExpression[] => {
    const points: LatLngExpression[] = [];
    const { alpha, beta } = stabilityClasses[stability];
    
    // Convert wind direction to radians (meteorological to mathematical)
    const windRad = (windDirection - 90) * Math.PI / 180;
    
    // Find maximum downwind distance where concentration exceeds threshold
    let maxDownwindDistance = 0;
    for (let x = 50; x <= 15000; x += 50) {
      const concentration = calculateConcentration(x, 0, 0, Q, u, 10, stability);
      if (concentration >= threshold) {
        maxDownwindDistance = x;
      } else if (maxDownwindDistance > 0) {
        break;
      }
    }
    
    if (maxDownwindDistance === 0) {
      // Return small circle if no significant plume
      const radius = 150;
      for (let angle = 0; angle <= 2 * Math.PI; angle += Math.PI / 24) {
        const deltaLat = (radius * Math.cos(angle)) / 111000;
        const deltaLng = (radius * Math.sin(angle)) / (111000 * Math.cos(sourceLocation.lat * Math.PI / 180));
        points.push([sourceLocation.lat + deltaLat, sourceLocation.lng + deltaLng]);
      }
      return points;
    }
    
    // Generate ALOHA-style elliptical plume
    const leftSide: LatLngExpression[] = [];
    const rightSide: LatLngExpression[] = [];
    
    // Create smooth elliptical boundary using proper atmospheric dispersion
    const numSegments = 80; // High resolution for smooth curves
    
    for (let i = 1; i <= numSegments; i++) {
      const fraction = i / numSegments;
      const x = maxDownwindDistance * fraction;
      
      // Calculate atmospheric dispersion parameters at this distance
      const sigmaY = alpha * x * Math.pow(1 + beta * x, -0.5);
      const sigmaZ = alpha * x * Math.pow(1 + beta * x, -0.5);
      
      // For ALOHA-style plumes, use 2.5 * sigma for the boundary
      // This captures approximately 99% of the concentration
      let maxCrosswind = 2.5 * sigmaY;
      
      // Refine crosswind distance to match exact threshold
      let bestCrosswind = 0;
      for (let y = 0; y <= maxCrosswind; y += maxCrosswind / 50) {
        const concentration = calculateConcentration(x, y, 0, Q, u, 10, stability);
        if (concentration >= threshold) {
          bestCrosswind = y;
        }
      }
      
      // Use the refined crosswind distance
      const crosswindDistance = bestCrosswind;
      
      if (crosswindDistance > 5) { // Only significant distances
        // Apply ALOHA-style smoothing factor for realistic plume shape
        const smoothingFactor = Math.pow(fraction, 0.7); // Creates proper teardrop shape
        const adjustedCrosswind = crosswindDistance * smoothingFactor;
        
        // Convert to geographic coordinates with proper wind rotation
        const deltaLatX = (x * Math.cos(windRad)) / 111000;
        const deltaLngX = (x * Math.sin(windRad)) / (111000 * Math.cos(sourceLocation.lat * Math.PI / 180));
        
        const deltaLatY = (-adjustedCrosswind * Math.sin(windRad)) / 111000;
        const deltaLngY = (adjustedCrosswind * Math.cos(windRad)) / (111000 * Math.cos(sourceLocation.lat * Math.PI / 180));
        
        // Left boundary (negative crosswind)
        leftSide.push([
          sourceLocation.lat + deltaLatX - deltaLatY,
          sourceLocation.lng + deltaLngX - deltaLngY
        ]);
        
        // Right boundary (positive crosswind)  
        rightSide.push([
          sourceLocation.lat + deltaLatX + deltaLatY,
          sourceLocation.lng + deltaLngX + deltaLngY
        ]);
      }
    }
    
    // Create proper ALOHA-style closed ellipse
    points.push([sourceLocation.lat, sourceLocation.lng]); // Source point
    
    // Add left side points
    for (const point of leftSide) {
      points.push(point);
    }
    
    // Add tip of plume (furthest downwind point)
    if (rightSide.length > 0) {
      const tipPoint = rightSide[rightSide.length - 1];
      points.push([tipPoint[0], tipPoint[1]]);
    }
    
    // Add right side points in reverse order
    for (let i = rightSide.length - 2; i >= 0; i--) {
      points.push(rightSide[i]);
    }
    
    // Close the polygon at source
    points.push([sourceLocation.lat, sourceLocation.lng]);
    
    return points;
  };

  const calculateDispersion = () => {
    setIsCalculating(true);
    
    try {
      const Q = (parameters.releaseRate / 3600) * 1000; // Convert kg/hr to g/s
      const stability = getStabilityClass(parameters.windSpeed);
      const thresholds = chemicalThresholds[parameters.chemicalName] || chemicalThresholds['Chlorine'];
      
      const sourceLocation = { lat: parameters.latitude, lng: parameters.longitude };
      
      const newZones: ConcentrationZone[] = [
        {
          polygon: generatePlumePolygon(sourceLocation, thresholds.low, Q, parameters.windSpeed, parameters.windDirection, stability),
          color: '#eab308',
          fillColor: '#fef3c7',
          fillOpacity: 0.4,
          weight: 2,
          riskLevel: 'low',
          concentration: thresholds.low,
          threshold: 'Low Risk - Enhanced Monitoring'
        },
        {
          polygon: generatePlumePolygon(sourceLocation, thresholds.moderate, Q, parameters.windSpeed, parameters.windDirection, stability),
          color: '#ea580c',
          fillColor: '#fed7aa',
          fillOpacity: 0.5,
          weight: 2,
          riskLevel: 'moderate',
          concentration: thresholds.moderate,
          threshold: 'Moderate Risk - Shelter in Place'
        },
        {
          polygon: generatePlumePolygon(sourceLocation, thresholds.high, Q, parameters.windSpeed, parameters.windDirection, stability),
          color: '#dc2626',
          fillColor: '#fecaca',
          fillOpacity: 0.6,
          weight: 3,
          riskLevel: 'high',
          concentration: thresholds.high,
          threshold: 'High Risk - Immediate Evacuation'
        }
      ];
      
      setZones(newZones);
    } catch (error) {
      console.error('Error calculating dispersion:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getMapTileUrl = () => {
    switch (parameters.mapType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getMapAttribution = () => {
    switch (parameters.mapType) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a>';
      case 'terrain':
        return '&copy; <a href="https://www.esri.com/">Esri</a>';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  useEffect(() => {
    if (zones.length === 0) {
      calculateDispersion();
    }
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gaussian Plume Dispersion Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={parameters.latitude}
                onChange={(e) => setParameters(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={parameters.longitude}
                onChange={(e) => setParameters(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chemical">Chemical</Label>
              <Select
                value={parameters.chemicalName}
                onValueChange={(value) => setParameters(prev => ({ ...prev, chemicalName: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(chemicalThresholds).map(chemical => (
                    <SelectItem key={chemical} value={chemical}>{chemical}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="releaseRate">Release Rate (kg/hr)</Label>
              <Input
                id="releaseRate"
                type="number"
                value={parameters.releaseRate}
                onChange={(e) => setParameters(prev => ({ ...prev, releaseRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="windSpeed">Wind Speed (m/s)</Label>
              <Input
                id="windSpeed"
                type="number"
                step="0.1"
                value={parameters.windSpeed}
                onChange={(e) => setParameters(prev => ({ ...prev, windSpeed: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="windDirection">Wind Direction (°)</Label>
              <Input
                id="windDirection"
                type="number"
                min="0"
                max="360"
                value={parameters.windDirection}
                onChange={(e) => setParameters(prev => ({ ...prev, windDirection: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="releaseTime">Release Time</Label>
              <Input
                id="releaseTime"
                type="datetime-local"
                value={parameters.releaseTime}
                onChange={(e) => setParameters(prev => ({ ...prev, releaseTime: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mapType">Map Type</Label>
              <Select
                value={parameters.mapType}
                onValueChange={(value: 'street' | 'satellite' | 'terrain') => 
                  setParameters(prev => ({ ...prev, mapType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="street">Street Map</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={calculateDispersion} 
            disabled={isCalculating}
            className="w-full md:w-auto"
          >
            {isCalculating ? 'Calculating...' : 'Generate Dispersion Model'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer
              {...({ center: [parameters.latitude, parameters.longitude] } as any)}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                url={getMapTileUrl()}
                {...({ attribution: getMapAttribution() } as any)}
              />
              
              {/* Source marker */}
              <Marker position={[parameters.latitude, parameters.longitude]}>
                <Popup>
                  <div>
                    <strong>Chemical Release Source</strong><br/>
                    Chemical: {parameters.chemicalName}<br/>
                    Release Rate: {parameters.releaseRate} kg/hr<br/>
                    Time: {new Date(parameters.releaseTime).toLocaleString()}<br/>
                    Wind: {parameters.windSpeed} m/s at {parameters.windDirection}°
                  </div>
                </Popup>
              </Marker>
              
              {/* Concentration zones */}
              {zones.map((zone, index) => (
                <Polygon
                  key={`zone-${index}`}
                  positions={zone.polygon}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.fillColor,
                    fillOpacity: zone.fillOpacity,
                    weight: zone.weight,
                    lineJoin: 'round'
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{zone.threshold}</strong><br/>
                      Concentration: ≥{zone.concentration} mg/m³<br/>
                      Risk Level: {zone.riskLevel.charAt(0).toUpperCase() + zone.riskLevel.slice(1)}
                    </div>
                  </Popup>
                </Polygon>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Zone Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span>High Risk - Immediate Evacuation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Moderate Risk - Shelter in Place</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Low Risk - Enhanced Monitoring</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GaussianPlumeDispersion;
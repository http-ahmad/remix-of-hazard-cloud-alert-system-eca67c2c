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
  windDirection: number; // degrees (0=N, 90=E, meteorological convention)
  releaseHeight: number; // meters
  releaseTemperature: number; // °C
  relativeHumidity: number; // %
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
    windDirection: 0, // 0° = North (wind from North, plume goes South)
    releaseHeight: 10,
    releaseTemperature: 20,
    relativeHumidity: 50,
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

  // Atmospheric stability classes with Pasquill-Gifford coefficients
  const stabilityClasses = {
    A: { alpha: 0.22, beta: 0.0001, sigmaZa: 0.20, sigmaZb: 0.0 }, // Very unstable
    B: { alpha: 0.16, beta: 0.0001, sigmaZa: 0.12, sigmaZb: 0.0 }, // Moderately unstable
    C: { alpha: 0.11, beta: 0.0001, sigmaZa: 0.08, sigmaZb: 0.0002 }, // Slightly unstable
    D: { alpha: 0.08, beta: 0.0001, sigmaZa: 0.06, sigmaZb: 0.0015 }, // Neutral
    E: { alpha: 0.06, beta: 0.0003, sigmaZa: 0.03, sigmaZb: 0.0003 }, // Slightly stable
    F: { alpha: 0.04, beta: 0.0015, sigmaZa: 0.016, sigmaZb: 0.0003 }  // Moderately stable
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

  // Enhanced Gaussian plume concentration calculation with environmental factors
  const calculateConcentration = (
    x: number, // downwind distance (m)
    y: number, // crosswind distance (m)
    z: number, // receptor height (m)
    Q: number, // emission rate (g/s)
    u: number, // wind speed (m/s)
    H: number, // effective stack height (m)
    stability: keyof typeof stabilityClasses,
    tempFactor: number = 1, // temperature adjustment
    humidityFactor: number = 1 // humidity adjustment
  ): number => {
    if (x <= 0) return 0;
    
    const { alpha, beta, sigmaZa, sigmaZb } = stabilityClasses[stability];
    
    // Pasquill-Gifford dispersion parameters
    const sigmaY = alpha * x * Math.pow(1 + beta * x, -0.5);
    const sigmaZ = sigmaZa * x * Math.pow(1 + sigmaZb * x, -0.5);
    
    // Ensure minimum sigma values to prevent division issues
    const sY = Math.max(sigmaY, 1);
    const sZ = Math.max(sigmaZ, 1);
    
    // Full Gaussian plume equation with ground reflection
    const expY = Math.exp(-0.5 * Math.pow(y / sY, 2));
    const expZ1 = Math.exp(-0.5 * Math.pow((z - H) / sZ, 2));
    const expZ2 = Math.exp(-0.5 * Math.pow((z + H) / sZ, 2)); // Ground reflection
    
    // Apply environmental adjustment factors
    const adjustedQ = Q * tempFactor * humidityFactor;
    
    const concentration = (adjustedQ / (2 * Math.PI * u * sY * sZ)) * expY * (expZ1 + expZ2);
    
    return concentration * 1000; // Convert g/m³ to mg/m³
  };

  // Generate ALOHA-style elliptical plume polygon for a given concentration threshold
  const generatePlumePolygon = (
    sourceLocation: { lat: number; lng: number },
    threshold: number,
    Q: number, // emission rate in g/s
    u: number, // wind speed in m/s
    windDirection: number, // meteorological wind direction (degrees, 0=N, 90=E)
    stability: keyof typeof stabilityClasses,
    releaseHeight: number, // stack height in meters
    tempFactor: number, // temperature adjustment factor
    humidityFactor: number // humidity adjustment factor
  ): LatLngExpression[] => {
    const points: LatLngExpression[] = [];
    const { alpha, beta, sigmaZa, sigmaZb } = stabilityClasses[stability];
    
    // Meteorological convention: wind direction is where wind COMES FROM
    // 0° = North (wind blows TO the south), 90° = East (wind blows TO the west)
    const plumeDirection = (windDirection + 180) % 360; // Direction plume travels
    const windRad = (90 - plumeDirection) * Math.PI / 180; // Convert to math angle
    
    // Effective wind speed (minimum to prevent division by zero)
    const effectiveWindSpeed = Math.max(0.5, u);
    
    // Release height affects ground-level concentration
    const H = Math.max(0, releaseHeight);
    
    // Find maximum downwind distance where concentration exceeds threshold
    // Scale search distance with release rate - larger releases travel further
    let maxDownwindDistance = 0;
    const maxSearchDistance = Math.max(1000, Math.min(100000, Q * 500 + 2000));
    
    // Search for the maximum distance where ground-level concentration exceeds threshold
    for (let x = 50; x <= maxSearchDistance; x += Math.max(25, x * 0.05)) {
      const concentration = calculateConcentration(x, 0, 0, Q, effectiveWindSpeed, H, stability, tempFactor, humidityFactor);
      if (concentration >= threshold) {
        maxDownwindDistance = x;
      } else if (maxDownwindDistance > 0) {
        // Found the boundary
        break;
      }
    }
    
    // Log for debugging
    console.log('Plume calculation:', {
      Q_gs: Q.toFixed(3),
      threshold,
      releaseHeight: H,
      tempFactor: tempFactor.toFixed(3),
      humidityFactor: humidityFactor.toFixed(3),
      maxDownwindDistance: maxDownwindDistance.toFixed(0) + 'm',
      stability
    });
    
    if (maxDownwindDistance === 0) {
      // Return small circle if no significant plume - scale with Q
      const radius = Math.max(50, Math.min(500, Q * 20 + 50));
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
    
    const numSegments = 80;
    
    for (let i = 1; i <= numSegments; i++) {
      const fraction = i / numSegments;
      const x = maxDownwindDistance * fraction;
      
      // Calculate atmospheric dispersion parameters at this distance
      const sigmaY = alpha * x * Math.pow(1 + beta * x, -0.5);
      
      // Find crosswind distance where concentration equals threshold
      let maxCrosswind = 3.0 * sigmaY;
      let bestCrosswind = 0;
      
      for (let y = 0; y <= maxCrosswind; y += maxCrosswind / 40) {
        const concentration = calculateConcentration(x, y, 0, Q, effectiveWindSpeed, H, stability, tempFactor, humidityFactor);
        if (concentration >= threshold) {
          bestCrosswind = y;
        }
      }
      
      const crosswindDistance = bestCrosswind;
      
      if (crosswindDistance > 5) {
        const smoothingFactor = Math.pow(fraction, 0.6);
        const adjustedCrosswind = crosswindDistance * smoothingFactor;
        
        const deltaLatX = (x * Math.cos(windRad)) / 111000;
        const deltaLngX = (x * Math.sin(windRad)) / (111000 * Math.cos(sourceLocation.lat * Math.PI / 180));
        
        const deltaLatY = (-adjustedCrosswind * Math.sin(windRad)) / 111000;
        const deltaLngY = (adjustedCrosswind * Math.cos(windRad)) / (111000 * Math.cos(sourceLocation.lat * Math.PI / 180));
        
        leftSide.push([
          sourceLocation.lat + deltaLatX - deltaLatY,
          sourceLocation.lng + deltaLngX - deltaLngY
        ]);
        
        rightSide.push([
          sourceLocation.lat + deltaLatX + deltaLatY,
          sourceLocation.lng + deltaLngX + deltaLngY
        ]);
      }
    }
    
    // Create closed polygon
    points.push([sourceLocation.lat, sourceLocation.lng]);
    for (const point of leftSide) {
      points.push(point);
    }
    if (rightSide.length > 0) {
      const tipPoint = rightSide[rightSide.length - 1];
      points.push([tipPoint[0], tipPoint[1]]);
    }
    for (let i = rightSide.length - 2; i >= 0; i--) {
      points.push(rightSide[i]);
    }
    points.push([sourceLocation.lat, sourceLocation.lng]);
    
    return points;
  };

  const calculateDispersionModel = () => {
    setIsCalculating(true);
    
    try {
      // Convert release rate from kg/hr to g/s
      // kg/hr -> g/s: multiply by 1000 (kg to g), divide by 3600 (hr to s)
      const Q = (parameters.releaseRate * 1000) / 3600;
      
      const stability = getStabilityClass(parameters.windSpeed);
      const thresholds = chemicalThresholds[parameters.chemicalName] || chemicalThresholds['Chlorine'];
      
      // Calculate temperature factor
      // Higher temperature = more buoyancy and evaporation = higher effective emission
      const ambientTempK = 293.15; // Reference 20°C
      const releaseTempK = parameters.releaseTemperature + 273.15;
      const tempFactor = Math.pow(releaseTempK / ambientTempK, 1.2);
      
      // Calculate humidity factor
      // Higher humidity = more deposition/washout = lower effective concentration
      // 0% RH -> 1.5x, 50% RH -> 1.0x, 100% RH -> 0.5x
      const humidityFactor = 1.5 - (parameters.relativeHumidity / 100);
      
      // Calculate effective release height with buoyancy
      const buoyancyRise = parameters.releaseTemperature > 20 
        ? Math.min(50, (parameters.releaseTemperature - 20) * 0.3) 
        : 0;
      const effectiveHeight = parameters.releaseHeight + buoyancyRise;
      
      console.log('Dispersion Model Parameters:', {
        releaseRate_kghr: parameters.releaseRate,
        Q_gs: Q.toFixed(4),
        releaseHeight: parameters.releaseHeight,
        effectiveHeight: effectiveHeight.toFixed(1),
        releaseTemp: parameters.releaseTemperature,
        humidity: parameters.relativeHumidity,
        tempFactor: tempFactor.toFixed(3),
        humidityFactor: humidityFactor.toFixed(3),
        windDirection: parameters.windDirection,
        stability
      });
      
      const sourceLocation = { lat: parameters.latitude, lng: parameters.longitude };
      
      const newZones: ConcentrationZone[] = [
        {
          polygon: generatePlumePolygon(sourceLocation, thresholds.low, Q, parameters.windSpeed, parameters.windDirection, stability, effectiveHeight, tempFactor, humidityFactor),
          color: '#eab308',
          fillColor: '#fef3c7',
          fillOpacity: 0.4,
          weight: 2,
          riskLevel: 'low',
          concentration: thresholds.low,
          threshold: 'Low Risk - Enhanced Monitoring'
        },
        {
          polygon: generatePlumePolygon(sourceLocation, thresholds.moderate, Q, parameters.windSpeed, parameters.windDirection, stability, effectiveHeight, tempFactor, humidityFactor),
          color: '#ea580c',
          fillColor: '#fed7aa',
          fillOpacity: 0.5,
          weight: 2,
          riskLevel: 'moderate',
          concentration: thresholds.moderate,
          threshold: 'Moderate Risk - Shelter in Place'
        },
        {
          polygon: generatePlumePolygon(sourceLocation, thresholds.high, Q, parameters.windSpeed, parameters.windDirection, stability, effectiveHeight, tempFactor, humidityFactor),
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
      calculateDispersionModel();
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
              <Label htmlFor="windDirection">Wind Direction (° from North)</Label>
              <Input
                id="windDirection"
                type="number"
                min="0"
                max="360"
                value={parameters.windDirection}
                onChange={(e) => setParameters(prev => ({ ...prev, windDirection: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">0°=N, 90°=E, 180°=S, 270°=W</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="releaseHeight">Release Height (m)</Label>
              <Input
                id="releaseHeight"
                type="number"
                min="0"
                max="200"
                value={parameters.releaseHeight}
                onChange={(e) => setParameters(prev => ({ ...prev, releaseHeight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="releaseTemperature">Release Temperature (°C)</Label>
              <Input
                id="releaseTemperature"
                type="number"
                min="-100"
                max="1000"
                value={parameters.releaseTemperature}
                onChange={(e) => setParameters(prev => ({ ...prev, releaseTemperature: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relativeHumidity">Relative Humidity (%)</Label>
              <Input
                id="relativeHumidity"
                type="number"
                min="0"
                max="100"
                value={parameters.relativeHumidity}
                onChange={(e) => setParameters(prev => ({ ...prev, relativeHumidity: parseFloat(e.target.value) || 0 }))}
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
            onClick={calculateDispersionModel} 
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
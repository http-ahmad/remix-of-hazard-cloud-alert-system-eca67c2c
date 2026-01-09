import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polygon, Popup, useMap } from 'react-leaflet';
import { LatLngExpression, Icon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Source {
  id: string;
  location: { lat: number; lng: number };
  chemicalType: string;
  releaseRate: number;
}

interface SensorLocation {
  lat: number;
  lng: number;
  id: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  threshold: number;
}

interface ZoneData {
  red: { distance: number; concentration: number };
  orange: { distance: number; concentration: number };
  yellow: { distance: number; concentration: number };
}

interface MultiSourceZone {
  center: { lat: number; lng: number };
  radius: number;
  color: string;
  type: 'red' | 'orange' | 'yellow';
  concentration: number;
}

interface EnhancedLeakageMapProps {
  showLeakage: boolean;
  windDirection: number;
  windSpeed: number;
  sourceLocation: { lat: number; lng: number };
  zoneData: ZoneData;
  onLocationChange: (location: { lat: number; lng: number }) => void;
  selectingLocation: boolean;
  detected: boolean;
  sensorLocations: SensorLocation[];
  showTerrain: boolean;
  sources: Source[];
  multipleSourceZones: MultiSourceZone[];
  chemicalType: string;
  releaseRate: number;
  releaseHeight: number;
  ambientTemperature: number;
  releaseTemperature: number;
}

const EnhancedLeakageMap: React.FC<EnhancedLeakageMapProps> = ({
  showLeakage,
  windDirection,
  windSpeed,
  sourceLocation,
  zoneData,
  onLocationChange,
  selectingLocation,
  detected,
  sensorLocations,
  showTerrain,
  sources,
  multipleSourceZones,
  chemicalType,
  releaseRate,
  releaseHeight,
  ambientTemperature,
  releaseTemperature,
}) => {
  const mapCenter = useMemo<LatLngExpression>(() => [sourceLocation.lat, sourceLocation.lng], [
    sourceLocation.lat,
    sourceLocation.lng,
  ]);

  // Generate realistic elliptical plume zones with proper wind direction
  // Wind direction convention: 0° = North, 90° = East, 180° = South, 270° = West
  // windDirDeg is the direction FROM which wind is blowing
  // Plume travels in the OPPOSITE direction (downwind)
  const generatePlumePolygon = (
    source: { lat: number; lng: number },
    maxDistance: number,
    windDirDeg: number,
    windSpd: number
  ): LatLngExpression[] => {
    const centerLat = source.lat;
    const centerLng = source.lng;

    // Convert wind direction to plume direction (downwind)
    // Wind FROM 0° (North) means plume travels TO 180° (South)
    // We use geographic convention: 0° = North, angles increase clockwise
    // Math trig uses 0° = East, counterclockwise, so we convert:
    // Geographic to math: mathAngle = 90 - geoAngle (then add 180 for plume direction)
    const plumeGeoDirection = (windDirDeg + 180) % 360;
    // Convert to radians for math (rotate so 0° is North, clockwise positive)
    const plumeDirection = (90 - plumeGeoDirection) * Math.PI / 180;

    // Realistic atmospheric dispersion parameters
    const windSpeedFactor = Math.max(1, windSpd);
    
    // Ellipse dimensions based on atmospheric science
    // Higher wind speed = more elongated plume
    const aspectRatio = Math.max(2.5, Math.min(8, windSpeedFactor * 0.8 + 2));
    const semiMajorAxis = maxDistance * aspectRatio * 0.5; // Downwind length (reduced by 50%)
    const semiMinorAxis = maxDistance * 0.5; // Crosswind width (reduced by 50%)
    
    // Atmospheric stability affects plume shape
    const stabilityFactor = windSpd < 2 ? 1.5 : windSpd > 7 ? 0.7 : 1.0;
    const adjustedMinorAxis = semiMinorAxis * stabilityFactor;

    // Helper function to convert ellipse coordinates to geographic coordinates
    const toGeo = (localX: number, localY: number): LatLngExpression => {
      // Rotate coordinates to align with wind direction
      const rotatedX = localX * Math.cos(plumeDirection) - localY * Math.sin(plumeDirection);
      const rotatedY = localX * Math.sin(plumeDirection) + localY * Math.cos(plumeDirection);
      
      // Convert meters to lat/lng degrees
      const dLat = rotatedY / 111000;
      const dLng = rotatedX / (111000 * Math.cos(centerLat * Math.PI / 180));
      
      return [centerLat + dLat, centerLng + dLng];
    };

    // Generate ellipse points with leak point at upwind edge
    const points: LatLngExpression[] = [];
    const numPoints = 72; // High resolution for smooth curves

    for (let i = 0; i <= numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      
      // Parametric ellipse equations
      let x = semiMajorAxis * Math.cos(angle);
      let y = adjustedMinorAxis * Math.sin(angle);
      
      // Shift ellipse so leak point is at the upwind edge
      x = x + semiMajorAxis * 0.8; // Offset to put source near edge
      
      // Add slight asymmetry for realism (more spreading downwind)
      if (x > 0) {
        y = y * (1 + x / (semiMajorAxis * 2) * 0.3);
      }
      
      points.push(toGeo(x, y));
    }

    return points;
  };

  // Generate zones for each source
  const generateMultiSourceZones = () => {
    const allSourceZones: { source: Source | { lat: number; lng: number; chemicalType: string; releaseRate: number }, zones: any[] }[] = [];
    
    // Add primary source
    const primarySource = { lat: sourceLocation.lat, lng: sourceLocation.lng, chemicalType, releaseRate };
    const primaryZones = [
      {
        polygon: generatePlumePolygon(sourceLocation, zoneData.red.distance, windDirection, windSpeed),
        color: '#dc2626',
        type: 'red',
        distance: zoneData.red.distance,
        concentration: zoneData.red.concentration
      },
      {
        polygon: generatePlumePolygon(sourceLocation, zoneData.orange.distance, windDirection, windSpeed),
        color: '#f97316',
        type: 'orange',
        distance: zoneData.orange.distance,
        concentration: zoneData.orange.concentration
      },
      {
        polygon: generatePlumePolygon(sourceLocation, zoneData.yellow.distance, windDirection, windSpeed),
        color: '#facc15',
        type: 'yellow',
        distance: zoneData.yellow.distance,
        concentration: zoneData.yellow.concentration
      }
    ];
    allSourceZones.push({ source: primarySource, zones: primaryZones });

    // Add additional sources
    sources.forEach(source => {
      const sourceZones = [
        {
          polygon: generatePlumePolygon(source.location, zoneData.red.distance * (source.releaseRate / releaseRate), windDirection, windSpeed),
          color: '#dc2626',
          type: 'red',
          distance: zoneData.red.distance * (source.releaseRate / releaseRate),
          concentration: zoneData.red.concentration * (source.releaseRate / releaseRate)
        },
        {
          polygon: generatePlumePolygon(source.location, zoneData.orange.distance * (source.releaseRate / releaseRate), windDirection, windSpeed),
          color: '#f97316',
          type: 'orange',
          distance: zoneData.orange.distance * (source.releaseRate / releaseRate),
          concentration: zoneData.orange.concentration * (source.releaseRate / releaseRate)
        },
        {
          polygon: generatePlumePolygon(source.location, zoneData.yellow.distance * (source.releaseRate / releaseRate), windDirection, windSpeed),
          color: '#facc15',
          type: 'yellow',
          distance: zoneData.yellow.distance * (source.releaseRate / releaseRate),
          concentration: zoneData.yellow.concentration * (source.releaseRate / releaseRate)
        }
      ];
      allSourceZones.push({ source, zones: sourceZones });
    });

    return allSourceZones;
  };

  // Generate wind direction arrow using same convention
  const generateWindArrow = (): LatLngExpression[] => {
    const arrowLength = 200; // meters
    const arrowWidth = 50;
    
    // Wind FROM direction - arrow points in direction wind is going (downwind)
    const plumeGeoDirection = (windDirection + 180) % 360;
    const plumeDirection = (90 - plumeGeoDirection) * Math.PI / 180;
    
    const toGeo = (localX: number, localY: number): LatLngExpression => {
      const rotatedX = localX * Math.cos(plumeDirection) - localY * Math.sin(plumeDirection);
      const rotatedY = localX * Math.sin(plumeDirection) + localY * Math.cos(plumeDirection);
      
      const dLat = rotatedY / 111000;
      const dLng = rotatedX / (111000 * Math.cos(sourceLocation.lat * Math.PI / 180));
      
      return [sourceLocation.lat + dLat, sourceLocation.lng + dLng];
    };

    // Arrow shape: shaft + head
    return [
      toGeo(-arrowLength * 1.5, 0), // Start of shaft
      toGeo(-arrowLength * 0.3, -arrowWidth * 0.3), // Shaft edge
      toGeo(-arrowLength * 0.3, -arrowWidth * 0.6), // Arrow notch
      toGeo(0, 0), // Arrow tip (at source)
      toGeo(-arrowLength * 0.3, arrowWidth * 0.6), // Arrow notch
      toGeo(-arrowLength * 0.3, arrowWidth * 0.3), // Shaft edge
      toGeo(-arrowLength * 1.5, 0) // Close shaft
    ];
  };

  const allSourceZones = generateMultiSourceZones();
  const windArrow = generateWindArrow();

  const yellowPolygon = useMemo(
    () => generatePlumePolygon(sourceLocation, zoneData.yellow.distance, windDirection, windSpeed),
    [sourceLocation, zoneData.yellow.distance, windDirection, windSpeed]
  );

  // Touchdown point for elevated releases (approx): where the plume first contacts the ground.
  const touchdownPoint = useMemo(() => {
    const u = Math.max(0.5, windSpeed);
    const deltaT = Math.max(0, releaseTemperature - ambientTemperature);
    const buoyancyRise = deltaT > 0 ? 1.6 * Math.pow(deltaT * 10, 0.333) * Math.pow(100, 0.667) / u : 0;
    const effectiveHeight = Math.max(0, releaseHeight) + buoyancyRise;

    // Simple approximation: higher effective height pushes touchdown downwind.
    const unclampedTouchdown = effectiveHeight * (8 + u * 1.5);
    const touchdownMeters = Math.max(0, Math.min(unclampedTouchdown, zoneData.yellow.distance * 0.9));

    const plumeGeoDirection = (windDirection + 180) % 360;
    const rad = (plumeGeoDirection * Math.PI) / 180;

    const dNorth = Math.cos(rad) * touchdownMeters;
    const dEast = Math.sin(rad) * touchdownMeters;

    const lat = sourceLocation.lat + dNorth / 111000;
    const lng = sourceLocation.lng + dEast / (111000 * Math.cos(sourceLocation.lat * Math.PI / 180));

    return {
      lat,
      lng,
      touchdownMeters,
      effectiveHeight,
    };
  }, [
    ambientTemperature,
    releaseTemperature,
    releaseHeight,
    windSpeed,
    windDirection,
    sourceLocation.lat,
    sourceLocation.lng,
    zoneData.yellow.distance,
  ]);

  const AutoFitBounds: React.FC<{ enabled: boolean; distance: number; points: LatLngExpression[] }> = ({
    enabled,
    distance,
    points,
  }) => {
    const map = useMap();
    const lastFitDistanceRef = useRef<number | null>(null);

    useEffect(() => {
      if (!enabled) return;
      if (!points || points.length < 3) return;

      const last = lastFitDistanceRef.current;
      const changedEnough = last === null ? true : Math.abs(distance - last) / Math.max(1, last) > 0.05;
      if (!changedEnough) return;

      map.fitBounds(latLngBounds(points as any), { padding: [24, 24] });
      lastFitDistanceRef.current = distance;
    }, [enabled, distance, points, map]);

    return null;
  };

  return (
    <MapContainer
      {...({ center: mapCenter } as any)}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <AutoFitBounds enabled={showLeakage} distance={zoneData.yellow.distance} points={yellowPolygon} />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
      />

      {/* Wind direction arrow */}
      <Polygon
        positions={windArrow}
        pathOptions={{
          color: '#1f2937',
          fillColor: '#374151',
          fillOpacity: 0.8,
          weight: 2
        }}
      >
        <Popup>
          <div>
            <strong>Wind Direction</strong><br/>
            From: {windDirection}°<br/>
            Speed: {windSpeed} m/s<br/>
            Plume direction: {((windDirection + 180) % 360)}°
          </div>
        </Popup>
      </Polygon>

      {/* Main source marker */}
      <Marker position={[sourceLocation.lat, sourceLocation.lng]}>
        <Popup>
          <div>
            <strong>Primary Source</strong><br/>
            Chemical: {chemicalType}<br/>
            Release Rate: {releaseRate} kg/min<br/>
            Release Height: {releaseHeight} m<br/>
            Release Temp: {releaseTemperature} °C
          </div>
        </Popup>
      </Marker>

      {/* Touchdown point marker (ground contact for elevated releases) */}
      {showLeakage && touchdownPoint.touchdownMeters > 0 && (
        <Circle
          {...({ center: [touchdownPoint.lat, touchdownPoint.lng], radius: 30 } as any)}
          pathOptions={{ color: '#111827', fillColor: '#111827', fillOpacity: 0.7, weight: 1 }}
        >
          <Popup>
            <div>
              <strong>Approx. Ground Touchdown</strong><br/>
              Distance downwind: {Math.round(touchdownPoint.touchdownMeters)} m<br/>
              Effective height: {Math.round(touchdownPoint.effectiveHeight)} m
            </div>
          </Popup>
        </Circle>
      )}

      {/* Additional sources */}
      {sources.map(source => (
        <Marker key={source.id} position={[source.location.lat, source.location.lng]}>
          <Popup>
            <div>
              <strong>Source {source.id}</strong><br/>
              Chemical: {source.chemicalType}<br/>
              Release Rate: {source.releaseRate} kg/min
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Sensor markers */}
      {sensorLocations.map(sensor => (
        <Marker key={sensor.id} position={[sensor.lat, sensor.lng]}>
          <Popup>
            <div>
              <strong>Sensor {sensor.id}</strong><br/>
              Type: {sensor.type}<br/>
              Status: {sensor.status}<br/>
              Threshold: {sensor.threshold} mg/m³
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Single source dispersion zones */}
      {showLeakage && sources.length === 0 && (
        <>
          {/* Yellow Zone (outermost) */}
          <Polygon
            positions={generatePlumePolygon(sourceLocation, zoneData.yellow.distance, windDirection, windSpeed)}
            pathOptions={{
              color: '#facc15',
              fillColor: '#facc15',
              fillOpacity: 0.2,
              weight: 2,
              lineJoin: 'round'
            }}
          >
            <Popup>
              <div>
                <strong>Yellow Zone</strong><br/>
                Distance: {zoneData.yellow.distance}m<br/>
                Concentration: {zoneData.yellow.concentration} mg/m³<br/>
                Action: Enhanced monitoring
              </div>
            </Popup>
          </Polygon>

          {/* Orange Zone (middle) */}
          <Polygon
            positions={generatePlumePolygon(sourceLocation, zoneData.orange.distance, windDirection, windSpeed)}
            pathOptions={{
              color: '#f97316',
              fillColor: '#f97316',
              fillOpacity: 0.3,
              weight: 2,
              lineJoin: 'round'
            }}
          >
            <Popup>
              <div>
                <strong>Orange Zone</strong><br/>
                Distance: {zoneData.orange.distance}m<br/>
                Concentration: {zoneData.orange.concentration} mg/m³<br/>
                Action: Shelter in place
              </div>
            </Popup>
          </Polygon>

          {/* Red Zone (innermost) */}
          <Polygon
            positions={generatePlumePolygon(sourceLocation, zoneData.red.distance, windDirection, windSpeed)}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#dc2626',
              fillOpacity: 0.4,
              weight: 3,
              lineJoin: 'round'
            }}
          >
            <Popup>
              <div>
                <strong>Red Zone</strong><br/>
                Distance: {zoneData.red.distance}m<br/>
                Concentration: {zoneData.red.concentration} mg/m³<br/>
                Action: Immediate evacuation
              </div>
            </Popup>
          </Polygon>
        </>
      )}

      {/* Multi-source zones - show all source zones */}
      {showLeakage && sources.length > 0 && allSourceZones.map((sourceZoneData, sourceIndex) => (
        <React.Fragment key={`source-${sourceIndex}`}>
          {sourceZoneData.zones.map((zone, zoneIndex) => (
            <Polygon
              key={`zone-${sourceIndex}-${zoneIndex}`}
              positions={zone.polygon}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: zoneIndex === 0 ? 0.4 : zoneIndex === 1 ? 0.3 : 0.2,
                weight: zoneIndex === 0 ? 3 : 2,
                dashArray: sourceIndex === 0 ? undefined : '5,5',
                lineJoin: 'round'
              }}
            >
              <Popup>
                <div>
                  <strong>{zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} Zone</strong><br/>
                  Source: {sourceIndex === 0 ? 'Primary' : `Source ${(sourceZoneData.source as Source).id}`}<br/>
                  Distance: {Math.round(zone.distance)}m<br/>
                  Concentration: {zone.concentration.toFixed(1)} mg/m³
                </div>
              </Popup>
            </Polygon>
          ))}
        </React.Fragment>
      ))}

      {/* Combined effect zones for multiple sources */}
      {multipleSourceZones.map((zone, index) => (
        <Circle
          key={`combined-zone-${index}`}
          {...({ center: [zone.center.lat, zone.center.lng], radius: zone.radius } as any)}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '10,5'
          }}
        >
          <Popup>
            <div>
              <strong>Combined Effect Zone</strong><br/>
              Type: {zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}<br/>
              Radius: {zone.radius}m<br/>
              Enhanced Concentration: {zone.concentration.toFixed(1)} mg/m³
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
};

export default EnhancedLeakageMap;
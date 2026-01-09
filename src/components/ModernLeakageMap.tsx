
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wind, AlertCircle, MapPin, Settings, Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface ZoneData {
  red: { distance: number; concentration: number };
  orange: { distance: number; concentration: number };
  yellow: { distance: number; concentration: number };
}

interface Source {
  id: string;
  location: { lat: number; lng: number };
  chemicalType: string;
  releaseRate: number;
  temperature?: number;
  pressure?: number;
  stabilityClass?: string;
}

interface ModernLeakageMapProps {
  showLeakage: boolean;
  windDirection: number;
  windSpeed: number;
  sourceLocation: { lat: number; lng: number };
  zoneData: ZoneData;
  onLocationChange: (location: { lat: number; lng: number }) => void;
  selectingLocation: boolean;
  detected?: boolean;
  sensorLocations?: Array<{ lat: number; lng: number; type: string }>;
  showTerrain?: boolean;
  sources?: Source[];
  multipleSourceZones?: Array<{ sourceId: string; zones: ZoneData }>;
}

const ModernLeakageMap: React.FC<ModernLeakageMapProps> = ({
  showLeakage,
  windDirection,
  windSpeed,
  sourceLocation,
  zoneData,
  onLocationChange,
  selectingLocation,
  detected = false,
  sensorLocations = [],
  showTerrain = false,
  sources = [],
  multipleSourceZones = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const latLngToPixel = useCallback((lat: number, lng: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const centerLat = sourceLocation.lat;
    const centerLng = sourceLocation.lng;
    
    // Convert lat/lng to pixels (simplified Mercator projection)
    const x = ((lng - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180) * zoom) + canvas.width / 2 + pan.x;
    const y = ((centerLat - lat) * 111320 * zoom) + canvas.height / 2 + pan.y;
    
    return { x: Math.round(x * 10000) / 10000, y: Math.round(y * 10000) / 10000 };
  }, [sourceLocation, zoom, pan]);

  const pixelToLatLng = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { lat: 0, lng: 0 };
    
    const centerLat = sourceLocation.lat;
    const centerLng = sourceLocation.lng;
    
    const lat = centerLat - ((y - canvas.height / 2 - pan.y) / (111320 * zoom));
    const lng = centerLng + ((x - canvas.width / 2 - pan.x) / (111320 * Math.cos(centerLat * Math.PI / 180) * zoom));
    
    return { 
      lat: Math.round(lat * 10000) / 10000, 
      lng: Math.round(lng * 10000) / 10000 
    };
  }, [sourceLocation, zoom, pan]);

  const generatePlumePoints = useCallback((
    center: { lat: number; lng: number },
    distance: number,
    direction: number,
    stabilityClass: string = 'D'
  ) => {
    const stabilityFactors = {
      'A': { lateral: 0.15, dispersion: 1.8, upwind: 0.3 },
      'B': { lateral: 0.12, dispersion: 1.6, upwind: 0.25 },
      'C': { lateral: 0.10, dispersion: 1.4, upwind: 0.2 },
      'D': { lateral: 0.08, dispersion: 1.2, upwind: 0.15 },
      'E': { lateral: 0.06, dispersion: 1.0, upwind: 0.1 },
      'F': { lateral: 0.04, dispersion: 0.8, upwind: 0.05 }
    };

    const stability = stabilityFactors[stabilityClass as keyof typeof stabilityFactors] || stabilityFactors['D'];
    const windEffect = Math.max(1.0, Math.min(3.0, windSpeed / 2));
    const maxDownwindDistance = distance * windEffect * stability.dispersion;
    const maxCrosswindSpread = distance * stability.lateral * 1.5;
    const upwindDistance = distance * stability.upwind;
    
    const directionRad = (direction * Math.PI) / 180;
    
    const points: { x: number; y: number }[] = [];
    
    // Create realistic teardrop/cone plume shape
    const numSegments = 80;
    
    // Generate points from upwind to downwind
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments; // 0 to 1
      
      // Distance along the plume centerline (upwind negative, downwind positive)
      const longitudinalDist = -upwindDistance + t * (maxDownwindDistance + upwindDistance);
      
      // Width at this distance (starts narrow, expands downwind)
      let widthFactor;
      if (longitudinalDist <= 0) {
        // Upwind - very narrow
        widthFactor = 0.1 + 0.2 * (1 + longitudinalDist / upwindDistance);
      } else {
        // Downwind - expanding cone
        const downwindProgress = longitudinalDist / maxDownwindDistance;
        widthFactor = 0.3 + 0.7 * Math.sqrt(downwindProgress);
      }
      
      const crosswindSpread = maxCrosswindSpread * widthFactor;
      
      // Create points on both sides of the centerline
      for (let side = -1; side <= 1; side += 2) {
        const localX = longitudinalDist;
        const localY = crosswindSpread * side;
        
        // Rotate according to wind direction
        const rotatedX = localX * Math.cos(directionRad) - localY * Math.sin(directionRad);
        const rotatedY = localX * Math.sin(directionRad) + localY * Math.cos(directionRad);
        
        // Convert to geographic coordinates
        const latOffset = rotatedY / 111320;
        const lngOffset = rotatedX / (111320 * Math.cos(center.lat * Math.PI / 180));
        const lat = center.lat + latOffset;
        const lng = center.lng + lngOffset;
        
        const pixel = latLngToPixel(lat, lng);
        points.push(pixel);
      }
    }
    
    // Add rounded end cap at downwind end
    const endX = maxDownwindDistance;
    const endY = 0;
    const endSpread = maxCrosswindSpread;
    
    for (let angle = -Math.PI/2; angle <= Math.PI/2; angle += Math.PI/20) {
      const capX = endX + endSpread * 0.3 * Math.cos(angle + Math.PI/2);
      const capY = endY + endSpread * Math.sin(angle);
      
      // Rotate according to wind direction
      const rotatedX = capX * Math.cos(directionRad) - capY * Math.sin(directionRad);
      const rotatedY = capX * Math.sin(directionRad) + capY * Math.cos(directionRad);
      
      // Convert to geographic coordinates
      const latOffset = rotatedY / 111320;
      const lngOffset = rotatedX / (111320 * Math.cos(center.lat * Math.PI / 180));
      const lat = center.lat + latOffset;
      const lng = center.lng + lngOffset;
      
      const pixel = latLngToPixel(lat, lng);
      points.push(pixel);
    }
    
    return points;
  }, [latLngToPixel, windSpeed]);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw terrain-like background
    if (showTerrain) {
      // Create gradient background to simulate terrain
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, 'hsl(var(--muted) / 0.1)');
      gradient.addColorStop(1, 'hsl(var(--muted) / 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw subtle grid
    ctx.strokeStyle = showTerrain ? 'hsl(var(--muted) / 0.2)' : 'hsl(var(--border) / 0.3)';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;
    
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Draw plume zones if leakage is shown
    if (showLeakage) {
      const zoneColors = {
        yellow: 'rgba(255, 235, 59, 0.4)',
        orange: 'rgba(255, 152, 0, 0.5)', 
        red: 'rgba(244, 67, 54, 0.6)'
      };
      
      const zoneBorders = {
        yellow: 'rgba(255, 235, 59, 0.8)',
        orange: 'rgba(255, 152, 0, 0.9)',
        red: 'rgba(244, 67, 54, 1.0)'
      };
      
      // Draw zones from largest to smallest for proper layering
      ['yellow', 'orange', 'red'].forEach(zone => {
        const zoneKey = zone as keyof ZoneData;
        const points = generatePlumePoints(
          sourceLocation,
          zoneData[zoneKey].distance,
          windDirection,
          'D'
        );
        
        if (points.length > 0) {
          // Create smooth gradient fill
          const centerPixel = latLngToPixel(sourceLocation.lat, sourceLocation.lng);
          const gradient = ctx.createRadialGradient(
            centerPixel.x, centerPixel.y, 0,
            centerPixel.x, centerPixel.y, zoneData[zoneKey].distance * zoom * 10
          );
          gradient.addColorStop(0, zoneColors[zoneKey]);
          gradient.addColorStop(1, `${zoneColors[zoneKey].slice(0, -4)}0.2)`);
          
          // Fill zone with gradient
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          points.forEach(point => ctx.lineTo(point.x, point.y));
          ctx.closePath();
          ctx.fill();
          
          // Draw smooth border
          ctx.strokeStyle = zoneBorders[zoneKey];
          ctx.lineWidth = zone === 'red' ? 3 : zone === 'orange' ? 2.5 : 2;
          ctx.setLineDash([]);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          
          // Add inner glow effect
          ctx.shadowColor = zoneBorders[zoneKey];
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
      
      // Draw additional source zones
      multipleSourceZones.forEach((sourceZone, index) => {
        const source = sources.find(s => s.id === sourceZone.sourceId);
        if (!source) return;
        
        const additionalZoneColors = {
          yellow: 'rgba(255, 235, 59, 0.3)',
          orange: 'rgba(255, 152, 0, 0.35)', 
          red: 'rgba(244, 67, 54, 0.4)'
        };
        
        const additionalZoneBorders = {
          yellow: 'rgba(255, 235, 59, 0.6)',
          orange: 'rgba(255, 152, 0, 0.7)',
          red: 'rgba(244, 67, 54, 0.8)'
        };
        
        ['yellow', 'orange', 'red'].forEach(zone => {
          const zoneKey = zone as keyof ZoneData;
          const points = generatePlumePoints(
            source.location,
            sourceZone.zones[zoneKey].distance,
            windDirection,
            source.stabilityClass || 'D'
          );
          
          if (points.length > 0) {
            ctx.fillStyle = additionalZoneColors[zoneKey];
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = additionalZoneBorders[zoneKey];
            ctx.lineWidth = 1.5;
            ctx.setLineDash([8, 4]);
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });
    }
    
    ctx.globalAlpha = 1;
    
    // Draw sources
    const primaryPixel = latLngToPixel(sourceLocation.lat, sourceLocation.lng);
    ctx.fillStyle = detected ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
    ctx.beginPath();
    ctx.arc(primaryPixel.x, primaryPixel.y, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'hsl(var(--background))';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw additional sources
    sources.forEach((source, index) => {
      const pixel = latLngToPixel(source.location.lat, source.location.lng);
      ctx.fillStyle = 'hsl(var(--secondary))';
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'hsl(var(--background))';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw source number
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((index + 2).toString(), pixel.x, pixel.y + 4);
    });
    
    // Draw sensors
    sensorLocations.forEach((sensor, index) => {
      const pixel = latLngToPixel(sensor.lat, sensor.lng);
      ctx.fillStyle = sensor.type === 'fixed' ? 'hsl(var(--accent))' : 'hsl(var(--muted))';
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'hsl(var(--border))';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
  }, [
    showLeakage, sourceLocation, zoneData, windDirection, sources, 
    multipleSourceZones, sensorLocations, detected, showTerrain, 
    latLngToPixel, generatePlumePoints
  ]);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectingLocation) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const latLng = pixelToLatLng(x, y);
        onLocationChange(latLng);
      }
    } else {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * zoomFactor)));
  };

  return (
    <div className="w-full h-full relative overflow-x-auto">
      <div className="min-w-[800px] h-full relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full border rounded-lg cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: selectingLocation ? 'crosshair' : isDragging ? 'grabbing' : 'grab' }}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
            className="bg-background/95 backdrop-blur-sm"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
            className="bg-background/95 backdrop-blur-sm"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="bg-background/95 backdrop-blur-sm"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>

        {/* Wind Direction Indicator */}
        {showLeakage && (
          <Card className="absolute top-4 right-24 z-10 bg-background/95 backdrop-blur-sm border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Wind 
                  size={20} 
                  style={{ 
                    transform: `rotate(${Math.round(windDirection * 10000) / 10000}deg)`,
                    color: windSpeed > 20 ? 'hsl(var(--destructive))' : windSpeed > 10 ? 'hsl(var(--warning))' : 'hsl(var(--primary))'
                  }} 
                />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">
                    {Math.round(windDirection * 10000) / 10000}°
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(windSpeed * 10000) / 10000} m/s
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selection Indicator */}
        {selectingLocation && (
          <Card className="absolute top-4 left-4 z-10 bg-primary/10 border-primary">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Click on the map to select location</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Alert */}
        {detected && (
          <Card className="absolute top-4 left-4 z-10 bg-destructive/10 border-destructive animate-pulse">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <div className="font-bold">EMERGENCY ALERT</div>
                  <div className="text-sm">Chemical leak detected - Emergency response required</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur-sm max-w-xs overflow-x-auto">
          <CardContent className="p-3">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Hazard Zone Classification
            </h4>
            <div className="space-y-2 text-xs overflow-x-auto">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-4 h-3 bg-red-500/20 border border-red-500 rounded-sm flex-shrink-0"></div>
                <span>Red Zone: Immediate evacuation (AEGL-3)</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-4 h-3 bg-orange-500/20 border border-orange-500 rounded-sm flex-shrink-0"></div>
                <span>Orange Zone: Shelter/evacuate (AEGL-2)</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-4 h-3 bg-yellow-500/20 border border-yellow-500 rounded-sm flex-shrink-0"></div>
                <span>Yellow Zone: Monitoring zone (AEGL-1)</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                  <span>Primary source</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-3 h-3 bg-secondary rounded-full flex-shrink-0"></div>
                  <span>Additional sources</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur-sm px-2 py-1 rounded text-xs">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};

export default ModernLeakageMap;

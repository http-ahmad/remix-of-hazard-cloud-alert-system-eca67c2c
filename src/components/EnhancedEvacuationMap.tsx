import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Navigation, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Car, 
  Footprints,
  MapPin,
  Route as RouteIcon,
  Home
} from 'lucide-react';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EvacuationRoute {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'emergency';
  capacity: number;
  estimatedTime: number;
  distance: number;
  status: 'clear' | 'congested' | 'blocked';
  transportMode: 'vehicle' | 'walking' | 'both';
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
    type: 'start' | 'checkpoint' | 'shelter' | 'end';
  }>;
  currentLoad: number;
  averageSpeed: number;
}

interface HazardZone {
  center: { lat: number; lng: number };
  radius: number;
  type: 'red' | 'orange' | 'yellow';
  concentration: number;
}

interface Shelter {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  currentOccupancy: number;
  status: 'available' | 'full' | 'unavailable';
  type: string;
}

interface EnhancedEvacuationMapProps {
  sourceLocation: { lat: number; lng: number };
  hazardZones: HazardZone[];
  windDirection: number;
  windSpeed: number;
  onRouteSelect?: (routeId: string) => void;
  onShelterSelect?: (shelterId: string) => void;
}

// Custom icons
const createCustomIcon = (color: string, icon: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${icon}</text>
    </svg>
  `)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const sourceIcon = createCustomIcon('#ef4444', '!');
const shelterIcon = createCustomIcon('#3b82f6', 'S');
const checkpointIcon = createCustomIcon('#f97316', 'C');
const emergencyIcon = createCustomIcon('#dc2626', 'E');

const EnhancedEvacuationMap: React.FC<EnhancedEvacuationMapProps> = ({
  sourceLocation,
  hazardZones,
  windDirection,
  windSpeed,
  onRouteSelect,
  onShelterSelect
}) => {
  const [routes] = useState<EvacuationRoute[]>([
    {
      id: '1',
      name: 'North Highway Route',
      type: 'primary',
      capacity: 2000,
      estimatedTime: 45,
      distance: 15.2,
      status: windDirection >= 315 || windDirection <= 45 ? 'congested' : 'clear',
      transportMode: 'both',
      currentLoad: 450,
      averageSpeed: 35,
      waypoints: [
        { lat: sourceLocation.lat, lng: sourceLocation.lng, name: 'Incident Site', type: 'start' },
        { lat: sourceLocation.lat + 0.005, lng: sourceLocation.lng - 0.003, name: 'Checkpoint Alpha', type: 'checkpoint' },
        { lat: sourceLocation.lat + 0.015, lng: sourceLocation.lng + 0.008, name: 'Community Center', type: 'shelter' },
        { lat: sourceLocation.lat + 0.025, lng: sourceLocation.lng - 0.005, name: 'Safe Zone North', type: 'end' }
      ]
    },
    {
      id: '2',
      name: 'East Bridge Route',
      type: 'secondary',
      capacity: 1500,
      estimatedTime: 60,
      distance: 18.7,
      status: windDirection >= 45 && windDirection <= 135 ? 'blocked' : 'clear',
      transportMode: 'vehicle',
      currentLoad: 1200,
      averageSpeed: 25,
      waypoints: [
        { lat: sourceLocation.lat, lng: sourceLocation.lng, name: 'Incident Site', type: 'start' },
        { lat: sourceLocation.lat - 0.008, lng: sourceLocation.lng + 0.012, name: 'Bridge Checkpoint', type: 'checkpoint' },
        { lat: sourceLocation.lat - 0.025, lng: sourceLocation.lng + 0.020, name: 'East Shelter', type: 'shelter' },
        { lat: sourceLocation.lat - 0.035, lng: sourceLocation.lng + 0.025, name: 'Safe Zone East', type: 'end' }
      ]
    },
    {
      id: '3',
      name: 'South Emergency Route',
      type: 'emergency',
      capacity: 800,
      estimatedTime: 35,
      distance: 12.1,
      status: windDirection >= 135 && windDirection <= 225 ? 'blocked' : 'clear',
      transportMode: 'walking',
      currentLoad: 150,
      averageSpeed: 15,
      waypoints: [
        { lat: sourceLocation.lat, lng: sourceLocation.lng, name: 'Incident Site', type: 'start' },
        { lat: sourceLocation.lat - 0.010, lng: sourceLocation.lng - 0.002, name: 'Emergency Gathering', type: 'checkpoint' },
        { lat: sourceLocation.lat - 0.020, lng: sourceLocation.lng - 0.008, name: 'Temporary Shelter', type: 'shelter' },
        { lat: sourceLocation.lat - 0.030, lng: sourceLocation.lng - 0.012, name: 'Safe Zone South', type: 'end' }
      ]
    },
    {
      id: '4',
      name: 'West Relief Route',
      type: 'secondary',
      capacity: 1200,
      estimatedTime: 50,
      distance: 16.5,
      status: windDirection >= 225 && windDirection <= 315 ? 'congested' : 'clear',
      transportMode: 'both',
      currentLoad: 800,
      averageSpeed: 30,
      waypoints: [
        { lat: sourceLocation.lat, lng: sourceLocation.lng, name: 'Incident Site', type: 'start' },
        { lat: sourceLocation.lat + 0.003, lng: sourceLocation.lng - 0.015, name: 'West Checkpoint', type: 'checkpoint' },
        { lat: sourceLocation.lat + 0.008, lng: sourceLocation.lng - 0.025, name: 'Relief Center', type: 'shelter' },
        { lat: sourceLocation.lat + 0.015, lng: sourceLocation.lng - 0.035, name: 'Safe Zone West', type: 'end' }
      ]
    }
  ]);

  const [shelters] = useState<Shelter[]>([
    {
      id: '1',
      name: 'Central Community Center',
      coordinates: { lat: sourceLocation.lat + 0.015, lng: sourceLocation.lng + 0.008 },
      capacity: 500,
      currentOccupancy: 125,
      status: 'available',
      type: 'Primary Shelter'
    },
    {
      id: '2',
      name: 'East Side School',
      coordinates: { lat: sourceLocation.lat - 0.025, lng: sourceLocation.lng + 0.020 },
      capacity: 300,
      currentOccupancy: 280,
      status: 'available',
      type: 'Secondary Shelter'
    },
    {
      id: '3',
      name: 'Emergency Relief Center',
      coordinates: { lat: sourceLocation.lat - 0.020, lng: sourceLocation.lng - 0.008 },
      capacity: 200,
      currentOccupancy: 45,
      status: 'available',
      type: 'Emergency Shelter'
    },
    {
      id: '4',
      name: 'West Sports Complex',
      coordinates: { lat: sourceLocation.lat + 0.008, lng: sourceLocation.lng - 0.025 },
      capacity: 1000,
      currentOccupancy: 850,
      status: 'available',
      type: 'Large Capacity Shelter'
    }
  ]);

  const getRouteColor = (route: EvacuationRoute) => {
    if (route.status === 'blocked') return '#dc2626';
    if (route.status === 'congested') return '#f97316';
    return route.type === 'primary' ? '#3b82f6' : route.type === 'secondary' ? '#8b5cf6' : '#ef4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clear': return 'bg-green-50 text-green-700 border-green-200';
      case 'congested': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'blocked': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Calculate optimal routes based on wind direction and current conditions
  const getOptimalRoutes = () => {
    return routes
      .filter(route => route.status !== 'blocked')
      .sort((a, b) => {
        // Prioritize routes that are upwind or crosswind
        const aEfficiency = (a.capacity - a.currentLoad) / a.estimatedTime;
        const bEfficiency = (b.capacity - b.currentLoad) / b.estimatedTime;
        return bEfficiency - aEfficiency;
      });
  };

  return (
    <div className="h-full w-full space-y-4">
      {/* Route Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {routes.map(route => (
          <Card key={route.id} className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {route.transportMode === 'vehicle' && <Car className="w-3 h-3" />}
                {route.transportMode === 'walking' && <Footprints className="w-3 h-3" />}
                {route.transportMode === 'both' && <Car className="w-3 h-3" />}
                <span className="text-xs font-medium truncate">{route.name}</span>
              </div>
              <Badge className={getStatusColor(route.status)}>
                {route.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {route.currentLoad}/{route.capacity} people
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div
                className={`h-1 rounded-full ${
                  route.currentLoad / route.capacity > 0.8 ? 'bg-red-500' :
                  route.currentLoad / route.capacity > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(route.currentLoad / route.capacity) * 100}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Interactive Map */}
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          {...({ center: [sourceLocation.lat, sourceLocation.lng] as LatLngExpression } as any)}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
          />

          {/* Hazard zones - rendered from largest to smallest for proper layering */}
          {hazardZones
            .sort((a, b) => b.radius - a.radius)
            .map((zone, index) => (
            <Circle
              key={`hazard-${index}`}
              {...({ center: [zone.center.lat, zone.center.lng] as LatLngExpression, radius: zone.radius * 1000 } as any)}
              pathOptions={{
                color: zone.type === 'red' ? '#f44336' : zone.type === 'orange' ? '#ff9800' : '#ffeb3b',
                fillColor: zone.type === 'red' ? '#f44336' : zone.type === 'orange' ? '#ff9800' : '#ffeb3b',
                fillOpacity: zone.type === 'red' ? 0.35 : zone.type === 'orange' ? 0.25 : 0.2,
                weight: zone.type === 'red' ? 3 : zone.type === 'orange' ? 2.5 : 2,
                opacity: zone.type === 'red' ? 0.9 : zone.type === 'orange' ? 0.8 : 0.7,
                dashArray: undefined,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <div>
                    <strong className={`${
                      zone.type === 'red' ? 'text-red-600' : 
                      zone.type === 'orange' ? 'text-orange-600' : 
                      'text-yellow-600'
                    }`}>
                      {zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} Hazard Zone
                    </strong>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Radius: <strong>{zone.radius.toFixed(2)} km</strong></div>
                    <div>Concentration: <strong>{zone.concentration.toFixed(1)} mg/m³</strong></div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {zone.type === 'red' && 'Immediate evacuation required - Life-threatening exposure'}
                      {zone.type === 'orange' && 'Shelter in place or evacuate - Serious health effects'}
                      {zone.type === 'yellow' && 'Enhanced monitoring - Mild health effects possible'}
                    </div>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Source location */}
          <Marker {...({ position: [sourceLocation.lat, sourceLocation.lng] as LatLngExpression, icon: sourceIcon } as any)}>
            <Popup>
              <div>
                <strong>Chemical Release Source</strong><br/>
                Wind: {windSpeed} m/s @ {windDirection}°<br/>
                Status: Active Emergency
              </div>
            </Popup>
          </Marker>

          {/* Evacuation routes */}
          {routes.map(route => (
            <React.Fragment key={route.id}>
              {/* Route path */}
              <Polyline
                positions={route.waypoints.map(wp => [wp.lat, wp.lng] as LatLngExpression)}
                pathOptions={{
                  color: getRouteColor(route),
                  weight: route.status === 'blocked' ? 2 : 4,
                  opacity: route.status === 'blocked' ? 0.5 : 0.8,
                  dashArray: route.status === 'blocked' ? '10,10' : undefined
                }}
              >
                <Popup>
                  <div className="space-y-2">
                    <div>
                      <strong>{route.name}</strong>
                      <Badge className={`ml-2 ${getStatusColor(route.status)}`}>
                        {route.status}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <div>Capacity: {route.currentLoad}/{route.capacity} people</div>
                      <div>Distance: {route.distance} km</div>
                      <div>Est. Time: {route.estimatedTime} min</div>
                      <div>Avg Speed: {route.averageSpeed} km/h</div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => onRouteSelect?.(route.id)}
                      disabled={route.status === 'blocked'}
                    >
                      <RouteIcon className="w-3 h-3 mr-1" />
                      Activate Route
                    </Button>
                  </div>
                </Popup>
              </Polyline>

              {/* Waypoint markers */}
              {route.waypoints.map((waypoint, index) => (
                <Marker
                  key={`${route.id}-waypoint-${index}`}
                  {...({ position: [waypoint.lat, waypoint.lng] as LatLngExpression,
                  icon: waypoint.type === 'start' ? sourceIcon :
                    waypoint.type === 'shelter' ? shelterIcon :
                    waypoint.type === 'checkpoint' ? checkpointIcon :
                    emergencyIcon } as any)}
                >
                  <Popup>
                    <div>
                      <strong>{waypoint.name}</strong><br/>
                      Type: {waypoint.type.charAt(0).toUpperCase() + waypoint.type.slice(1)}<br/>
                      Route: {route.name}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </React.Fragment>
          ))}

          {/* Shelter markers */}
          {shelters.map(shelter => (
            <Marker
              key={shelter.id}
              {...({ position: [shelter.coordinates.lat, shelter.coordinates.lng] as LatLngExpression, icon: shelterIcon } as any)}
            >
              <Popup>
                <div className="space-y-2">
                  <div>
                    <strong>{shelter.name}</strong>
                    <Badge className={`ml-2 ${getStatusColor(shelter.status)}`}>
                      {shelter.status}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <div>Type: {shelter.type}</div>
                    <div>Occupancy: {shelter.currentOccupancy}/{shelter.capacity}</div>
                    <div>Available: {shelter.capacity - shelter.currentOccupancy} spaces</div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onShelterSelect?.(shelter.id)}
                    disabled={shelter.status === 'full'}
                  >
                    <Home className="w-3 h-3 mr-1" />
                    Select Shelter
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Optimal Routes Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Recommended Evacuation Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Based on current wind conditions ({windDirection}° @ {windSpeed} m/s) and route capacity:
            </div>
            {getOptimalRoutes().slice(0, 3).map((route, index) => (
              <div key={route.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{route.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {route.capacity - route.currentLoad} available • {route.estimatedTime} min • {route.distance} km
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(route.status)}>
                    {route.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => onRouteSelect?.(route.id)}>
                    <RouteIcon className="w-3 h-3 mr-1" />
                    Activate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedEvacuationMap;
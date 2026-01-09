import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Navigation, Clock, Users, AlertTriangle, CheckCircle, Car, Footprints, Route as RouteIcon } from 'lucide-react';
import EnhancedEvacuationMap from './EnhancedEvacuationMap';

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
}

interface Shelter {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentOccupancy: number;
  amenities: string[];
  coordinates: { lat: number; lng: number };
  status: 'available' | 'full' | 'unavailable';
}

interface EvacuationRoutesProps {
  sourceLocation?: { lat: number; lng: number };
  windDirection?: number;
  windSpeed?: number;
  hazardZones?: Array<{
    center: { lat: number; lng: number };
    radius: number;
    type: 'red' | 'orange' | 'yellow';
    concentration: number;
  }>;
}

const EvacuationRoutes: React.FC<EvacuationRoutesProps> = ({
  sourceLocation = { lat: 40.7589, lng: -73.9851 },
  windDirection = 180,
  windSpeed = 5,
  hazardZones = [
    { center: sourceLocation, radius: 0.5, type: 'red', concentration: 100 },
    { center: sourceLocation, radius: 1.0, type: 'orange', concentration: 50 },
    { center: sourceLocation, radius: 1.5, type: 'yellow', concentration: 25 }
  ]
}) => {
  const [routes] = useState<EvacuationRoute[]>([
    {
      id: '1',
      name: 'North Highway Route',
      type: 'primary',
      capacity: 2000,
      estimatedTime: 45,
      distance: 15.2,
      status: 'clear',
      transportMode: 'both',
      waypoints: [
        { lat: 40.7589, lng: -73.9851, name: 'Incident Site', type: 'start' },
        { lat: 40.7614, lng: -73.9776, name: 'Checkpoint Alpha', type: 'checkpoint' },
        { lat: 40.7749, lng: -73.9442, name: 'Community Center', type: 'shelter' },
        { lat: 40.7831, lng: -73.9712, name: 'Safe Zone North', type: 'end' }
      ]
    },
    {
      id: '2',
      name: 'East Bridge Route',
      type: 'secondary',
      capacity: 1500,
      estimatedTime: 60,
      distance: 18.7,
      status: 'congested',
      transportMode: 'vehicle',
      waypoints: [
        { lat: 40.7589, lng: -73.9851, name: 'Incident Site', type: 'start' },
        { lat: 40.7505, lng: -73.9934, name: 'Bridge Checkpoint', type: 'checkpoint' },
        { lat: 40.7282, lng: -73.9942, name: 'East Shelter', type: 'shelter' },
        { lat: 40.7157, lng: -73.9961, name: 'Safe Zone East', type: 'end' }
      ]
    },
    {
      id: '3',
      name: 'South Emergency Route',
      type: 'emergency',
      capacity: 800,
      estimatedTime: 35,
      distance: 12.1,
      status: 'clear',
      transportMode: 'walking',
      waypoints: [
        { lat: 40.7589, lng: -73.9851, name: 'Incident Site', type: 'start' },
        { lat: 40.7484, lng: -73.9857, name: 'Emergency Gathering Point', type: 'checkpoint' },
        { lat: 40.7362, lng: -73.9928, name: 'Temporary Shelter', type: 'shelter' },
        { lat: 40.7246, lng: -73.9965, name: 'Safe Zone South', type: 'end' }
      ]
    }
  ]);

  const [shelters] = useState<Shelter[]>([
    {
      id: '1',
      name: 'Central Community Center',
      type: 'Primary Shelter',
      capacity: 500,
      currentOccupancy: 125,
      amenities: ['Medical Aid', 'Food Service', 'Communication Center', 'Child Care'],
      coordinates: { lat: 40.7749, lng: -73.9442 },
      status: 'available'
    },
    {
      id: '2',
      name: 'East Side School',
      type: 'Secondary Shelter',
      capacity: 300,
      currentOccupancy: 280,
      amenities: ['Basic Medical', 'Food Service', 'Restrooms'],
      coordinates: { lat: 40.7282, lng: -73.9942 },
      status: 'available'
    },
    {
      id: '3',
      name: 'Emergency Relief Center',
      type: 'Emergency Shelter',
      capacity: 200,
      currentOccupancy: 45,
      amenities: ['First Aid', 'Water Station', 'Communication'],
      coordinates: { lat: 40.7362, lng: -73.9928 },
      status: 'available'
    },
    {
      id: '4',
      name: 'Sports Complex',
      type: 'Large Capacity Shelter',
      capacity: 1000,
      currentOccupancy: 850,
      amenities: ['Medical Center', 'Food Service', 'Recreation Area', 'Pet Area'],
      coordinates: { lat: 40.7831, lng: -73.9712 },
      status: 'available'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clear':
      case 'available':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'congested':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'blocked':
      case 'full':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'primary':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'secondary':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'emergency':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const activateRoute = (routeId: string) => {
    console.log(`Activating evacuation route: ${routeId}`);
    // Add route activation logic here
  };

  const handleRouteSelect = (routeId: string) => {
    console.log(`Route selected: ${routeId}`);
    activateRoute(routeId);
  };

  const handleShelterSelect = (shelterId: string) => {
    console.log(`Shelter selected: ${shelterId}`);
    // Add shelter selection logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Evacuation Routes & Shelters</h2>
          <p className="text-muted-foreground">Plan and manage evacuation routes and emergency shelters</p>
        </div>
      </div>

      <Tabs defaultValue="interactive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interactive">Interactive Map</TabsTrigger>
          <TabsTrigger value="routes">Evacuation Routes</TabsTrigger>
          <TabsTrigger value="shelters">Emergency Shelters</TabsTrigger>
          <TabsTrigger value="real-time">Real-time Status</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6">
          <EnhancedEvacuationMap
            sourceLocation={sourceLocation}
            hazardZones={hazardZones}
            windDirection={windDirection}
            windSpeed={windSpeed}
            onRouteSelect={handleRouteSelect}
            onShelterSelect={handleShelterSelect}
          />
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {routes.map(route => (
              <Card key={route.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        {route.transportMode === 'vehicle' && <Car className="w-4 h-4" />}
                        {route.transportMode === 'walking' && <Footprints className="w-4 h-4" />}
                        {route.transportMode === 'both' && (
                          <>
                            <Car className="w-4 h-4" />
                            <Footprints className="w-4 h-4" />
                          </>
                        )}
                        <span>{route.distance} km</span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Badge className={getRouteTypeColor(route.type)}>
                        {route.type}
                      </Badge>
                      <Badge className={getStatusColor(route.status)}>
                        {route.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{route.capacity} people</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{route.estimatedTime} min</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Waypoints:</h4>
                    {route.waypoints.map((waypoint, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          waypoint.type === 'start' ? 'bg-red-500' :
                          waypoint.type === 'end' ? 'bg-green-500' :
                          waypoint.type === 'shelter' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`} />
                        <span>{waypoint.name}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full"
                    variant={route.status === 'blocked' ? 'secondary' : 'default'}
                    disabled={route.status === 'blocked'}
                    onClick={() => activateRoute(route.id)}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Activate Route
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shelters" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shelters.map(shelter => (
              <Card key={shelter.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{shelter.name}</CardTitle>
                      <CardDescription>{shelter.type}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(shelter.status)}>
                      {shelter.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Occupancy</span>
                      <span className="text-sm">
                        {shelter.currentOccupancy}/{shelter.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          shelter.currentOccupancy / shelter.capacity > 0.9 ? 'bg-red-500' :
                          shelter.currentOccupancy / shelter.capacity > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${(shelter.currentOccupancy / shelter.capacity) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Available Amenities:</h4>
                    <div className="flex flex-wrap gap-1">
                      {shelter.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {shelter.coordinates.lat.toFixed(4)}, {shelter.coordinates.lng.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Navigation className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="real-time" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Routes Active</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Routes Congested</p>
                    <p className="text-2xl font-bold">1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">People Evacuated</p>
                    <p className="text-2xl font-bold">1,300</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Shelters Available</p>
                    <p className="text-2xl font-bold">4</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Live Traffic & Route Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routes.map(route => (
                  <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        route.status === 'clear' ? 'bg-green-500' :
                        route.status === 'congested' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{route.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{route.estimatedTime} min</span>
                      <span>{route.capacity} capacity</span>
                      <Badge className={getStatusColor(route.status)}>
                        {route.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EvacuationRoutes;
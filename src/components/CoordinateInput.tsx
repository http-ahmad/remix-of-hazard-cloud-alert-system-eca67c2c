
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CoordinateInputProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  currentLocation: { lat: number; lng: number };
}

const CoordinateInput = ({ onLocationChange, currentLocation }: CoordinateInputProps) => {
  const [latitude, setLatitude] = useState(currentLocation.lat.toFixed(4));
  const [longitude, setLongitude] = useState(currentLocation.lng.toFixed(4));

  const handleSetLocation = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid numeric coordinates.",
        variant: "destructive",
      });
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast({
        title: "Invalid Latitude",
        description: "Latitude must be between -90 and 90 degrees.",
        variant: "destructive",
      });
      return;
    }
    
    if (lng < -180 || lng > 180) {
      toast({
        title: "Invalid Longitude",
        description: "Longitude must be between -180 and 180 degrees.",
        variant: "destructive",
      });
      return;
    }
    
    onLocationChange({ lat, lng });
    toast({
      title: "Location Updated",
      description: `Source location set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation. Please enter coordinates manually.",
        variant: "destructive",
      });
      return;
    }

    const attemptGeolocation = (retryCount = 0, maxRetries = 3) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat.toFixed(4));
          setLongitude(lng.toFixed(4));
          onLocationChange({ lat, lng });
          toast({
            title: "Location Detected",
            description: `Current location set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        },
        (error) => {
          // Retry on timeout or position unavailable errors
          if (retryCount < maxRetries && (error.code === 2 || error.code === 3)) {
            console.log(`Retrying geolocation... attempt ${retryCount + 2}/${maxRetries + 1}`);
            setTimeout(() => attemptGeolocation(retryCount + 1, maxRetries), 1500);
            return;
          }
          
          toast({
            title: "Location Error",
            description: error.code === 1 
              ? "Location permission denied. Please enable location access or enter coordinates manually."
              : "Unable to detect current location. Please try again or enter coordinates manually.",
            variant: "destructive",
          });
        },
        { 
          timeout: 15000, 
          enableHighAccuracy: false,
          maximumAge: 300000
        }
      );
    };

    attemptGeolocation();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Set Source Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.0001"
              placeholder="40.7128"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.0001"
              placeholder="-74.0060"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSetLocation}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Set Location
          </Button>
          <Button 
            onClick={handleGetCurrentLocation}
            variant="outline"
            className="flex-1"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use Current
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Current: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
          <p className="text-xs mt-1">
            Enter coordinates in decimal degrees format (e.g., 40.7128, -74.0060)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoordinateInput;

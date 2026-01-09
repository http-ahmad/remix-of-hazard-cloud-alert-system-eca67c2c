
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Cloud, 
  Wind, 
  Thermometer, 
  Gauge, 
  Droplet, 
  Eye,
  Sun,
  CloudRain
} from "lucide-react";

interface WeatherDataProps {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  pressure: number; // in hPa, will be converted to kPa
  humidity: number;
  visibility: number;
  cloudCover: number;
  precipitation: number;
  stabilityClass: string;
}

const WeatherDataDisplay = ({
  temperature,
  windSpeed,
  windDirection,
  pressure,
  humidity,
  visibility,
  cloudCover,
  precipitation,
  stabilityClass
}: WeatherDataProps) => {
  // Convert pressure from hPa to kPa
  const pressureInKPa = Math.round((pressure / 10) * 100) / 100;

  const getWindDirectionLabel = (direction: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((direction % 360) / 45)) % 8;
    return directions[index];
  };

  const getStabilityClassDescription = (stabilityClass: string): string => {
    const descriptions = {
      'A': 'Very Unstable',
      'B': 'Unstable',
      'C': 'Slightly Unstable',
      'D': 'Neutral',
      'E': 'Stable',
      'F': 'Very Stable'
    };
    return descriptions[stabilityClass] || 'Unknown';
  };

  const getStabilityClassColor = (stabilityClass: string): string => {
    const colors = {
      'A': 'destructive',
      'B': 'destructive',
      'C': 'secondary',
      'D': 'default',
      'E': 'secondary',
      'F': 'default'
    };
    return colors[stabilityClass] || 'default';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 overflow-x-auto">
          <div className="space-y-4 min-w-[400px]">
            {/* Primary Weather Data */}
            <div className="grid grid-cols-2 gap-4 overflow-x-auto">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-sm">Temperature</span>
                </div>
                <div className="text-lg font-bold">{Math.round(temperature)}°C</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((temperature * 9/5) + 32)}°F
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Wind</span>
                </div>
                <div className="text-lg font-bold">{Math.round(windSpeed)} m/s</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(windDirection)}° ({getWindDirectionLabel(windDirection)})
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-sm">Pressure</span>
                </div>
                <div className="text-lg font-bold">{pressureInKPa} kPa</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(pressure)} hPa
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-cyan-500" />
                  <span className="font-medium text-sm">Humidity</span>
                </div>
                <div className="text-lg font-bold">{Math.round(humidity)}%</div>
                <div className="text-xs text-muted-foreground">
                  Relative humidity
                </div>
              </div>
            </div>

            {/* Secondary Weather Data */}
            <div className="grid grid-cols-2 gap-4 overflow-x-auto">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-sm">Visibility</span>
                </div>
                <div className="text-lg font-bold">{Math.round(visibility)} km</div>
                <div className="text-xs text-muted-foreground">
                  Horizontal visibility
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-sm">Cloud Cover</span>
                </div>
                <div className="text-lg font-bold">{Math.round(cloudCover)}%</div>
                <div className="text-xs text-muted-foreground">
                  Sky coverage
                </div>
              </div>
            </div>

            {/* Atmospheric Stability */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Atmospheric Stability</span>
                <Badge variant={getStabilityClassColor(stabilityClass) as any}>
                  Class {stabilityClass}
                </Badge>
              </div>
              <div className="text-sm text-gray-700">
                {getStabilityClassDescription(stabilityClass)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Affects chemical dispersion patterns
              </div>
            </div>

            {/* Precipitation */}
            {precipitation > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Precipitation</span>
                </div>
                <div className="text-lg font-bold">{Math.round(precipitation * 100) / 100} mm/h</div>
                <div className="text-xs text-muted-foreground">
                  May affect dispersion and detection
                </div>
              </div>
            )}

            {/* Weather Impact Assessment */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Weather Impact on Dispersion</h4>
              <div className="text-xs space-y-1 text-gray-700">
                <div>• Wind speed affects plume dilution and travel distance</div>
                <div>• Stability class influences vertical mixing</div>
                <div>• Temperature affects chemical evaporation rates</div>
                <div>• Humidity can influence chemical behavior</div>
                {precipitation > 0 && <div>• Rain may wash out some chemicals</div>}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WeatherDataDisplay;

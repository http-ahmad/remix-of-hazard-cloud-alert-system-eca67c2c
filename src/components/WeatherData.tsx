
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudRain, Wind, Thermometer, RefreshCw, Droplets, Gauge } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface WeatherDataProps {
  weatherData: {
    windSpeed: number;
    windDirection: number;
    temperature: number;
    conditions: string;
    humidity: number;
    pressure: number;
    timestamp: string;
  } | null;
  isLoading: boolean;
  onRefresh: () => void;
  location: { lat: number; lng: number };
}

// Helper function to get wind direction as text
const getWindDirectionName = (degrees: number): string => {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
};

const WeatherData = ({ weatherData, isLoading, onRefresh, location }: WeatherDataProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <CloudRain className="h-5 w-5" /> 
          Real-Time Weather Data
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : weatherData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <div className="text-xl font-semibold flex items-center">
                  <Thermometer className="h-5 w-5 mr-2 text-red-500" />
                  {weatherData.temperature}°C
                </div>
                <div className="text-sm text-muted-foreground">Temperature</div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xl font-semibold flex items-center">
                  <Wind className="h-5 w-5 mr-2 text-blue-500" />
                  {weatherData.windSpeed} m/s
                </div>
                <div className="text-sm text-muted-foreground">Wind Speed</div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xl font-semibold flex items-center">
                  <Wind className="h-5 w-5 mr-2 text-green-500" 
                    style={{ transform: `rotate(${weatherData.windDirection}deg)` }}
                  />
                  {weatherData.windDirection}° ({getWindDirectionName(weatherData.windDirection)})
                </div>
                <div className="text-sm text-muted-foreground">Wind Direction</div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xl font-semibold">{weatherData.conditions}</div>
                <div className="text-sm text-muted-foreground">Conditions</div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xl font-semibold flex items-center">
                  <Droplets className="h-5 w-5 mr-2 text-blue-400" />
                  {weatherData.humidity}%
                </div>
                <div className="text-sm text-muted-foreground">Humidity</div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xl font-semibold flex items-center">
                  <Gauge className="h-5 w-5 mr-2 text-purple-500" />
                  {weatherData.pressure} hPa
                </div>
                <div className="text-sm text-muted-foreground">Pressure</div>
              </div>
            </div>
            
            <div className="pt-2 mt-4 border-t text-sm text-muted-foreground">
              <div>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
              <div>Last Updated: {new Date(weatherData.timestamp).toLocaleString()}</div>
              <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <p>Weather data is used to automatically update the wind speed, direction, and temperature parameters in the dispersion model.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32">
            <p>No weather data available</p>
            <Button variant="outline" className="mt-4" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Fetch Weather Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherData;

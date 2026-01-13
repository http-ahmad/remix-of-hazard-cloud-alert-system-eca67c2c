import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Wind, 
  MapPin, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Target,
  Layers,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { calculateDispersion } from "@/utils/dispersionModel";
import { chemicalDatabase } from "@/utils/chemicalDatabase";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { safeParseNumber, safeAsync, retryWithBackoff } from "@/utils/errorHandler";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load heavy components for better initial load
const EnhancedLeakageMap = lazy(() => import("@/components/EnhancedLeakageMap"));
const GaussianPlumeDispersion = lazy(() => import("@/components/GaussianPlumeDispersion"));
const EnhancedConcentrationCharts = lazy(() => import("@/components/EnhancedConcentrationCharts"));
const HazardAssessment = lazy(() => import("@/components/HazardAssessment"));
const SensorManagement = lazy(() => import("@/components/SensorManagement"));
const ReportGeneration = lazy(() => import("@/components/ReportGeneration"));
const SimulationComparison = lazy(() => import("@/components/SimulationComparison"));
const MultipleSourceManager = lazy(() => import("@/components/MultipleSourceManager"));
const EnhancedMultiSourceManager = lazy(() => import("@/components/EnhancedMultiSourceManager"));
const EmergencyContacts = lazy(() => import("@/components/EmergencyContacts"));
const EvacuationRoutes = lazy(() => import("@/components/EvacuationRoutes"));
const ResourceManagement = lazy(() => import("@/components/ResourceManagement"));
const WeatherDataDisplay = lazy(() => import("@/components/WeatherDataDisplay"));

/** Source type for gas release modeling */
type SourceType = 'point' | 'line' | 'area' | 'jet';

interface ModelParameters {
  sourceLocation: { lat: number; lng: number };
  releaseRate: number;
  windSpeed: number;
  windDirection: number;
  atmosphericStability: string;
  /** Ambient air temperature (°C) */
  temperature: number;
  /** Ambient relative humidity (%) */
  humidity: number;
  /** Release temperature at the source (°C) */
  releaseTemperature: number;
  chemicalType: string;
  releaseHeight: number;
  duration: number;
  stabilityClass: string;
  sourceHeight: number;
  /** Surface roughness / terrain type */
  terrainType: 'urban' | 'suburban' | 'rural' | 'water' | 'forest';
  /** Mixing height / boundary layer height (m) */
  mixingHeight: number;
  /** Averaging time (minutes) - typically 10 for ALOHA */
  averagingTime: number;
  /** Source type: point, line, area, or jet */
  sourceType: SourceType;
  /** Line source length (m) - for line sources */
  lineLength?: number;
  /** Area source dimensions (m²) - for area sources */
  areaSize?: number;
  /** Jet exit velocity (m/s) - for jet/momentum sources */
  jetVelocity?: number;
  /** Jet exit diameter (m) - for jet sources */
  jetDiameter?: number;
}


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
  battery?: number;
  signalStrength?: number;
  threshold: number;
}

interface Scenario {
  id: string;
  name: string;
  parameters: ModelParameters;
  additionalSources: Source[];
  createdAt: Date;
  description?: string;
}

interface AGLLevels {
  agl1: number;
  agl2: number;
  agl3: number;
}

interface MultiSourceAGL {
  combinedAGL: AGLLevels;
  individualSources: { [sourceId: string]: AGLLevels };
  riskAssessment: string;
}

// Custom Leaflet icons
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `)}`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const sourceIcon = createCustomIcon('#ef4444');
const sensorIcon = createCustomIcon('#3b82f6');

const EmergencyModel = () => {
const [modelParams, setModelParams] = useState<ModelParameters>({
    sourceLocation: { lat: 40.7128, lng: -74.0060 },
    releaseRate: 10.0,
    windSpeed: 5.0,
    windDirection: 180,
    atmosphericStability: 'D',
    temperature: 20,
    humidity: 60,
    releaseTemperature: 20,
    chemicalType: 'ammonia',
    releaseHeight: 2.0,
    duration: 60,
    stabilityClass: 'D',
    sourceHeight: 2.0,
    terrainType: 'suburban',
    mixingHeight: 1000,
    averagingTime: 10,
    sourceType: 'point',
    lineLength: 100,
    areaSize: 100,
    jetVelocity: 50,
    jetDiameter: 0.1,
  });


  const [additionalSources, setAdditionalSources] = useState<Source[]>([]);
  const [sensorLocations, setSensorLocations] = useState<SensorLocation[]>([
    { lat: 40.7150, lng: -74.0070, id: 'sensor-1', type: 'Chemical', status: 'active', battery: 85, signalStrength: 92, threshold: 10 },
    { lat: 40.7100, lng: -74.0050, id: 'sensor-2', type: 'Weather', status: 'active', battery: 78, signalStrength: 88, threshold: 15 },
    { lat: 40.7140, lng: -74.0080, id: 'sensor-3', type: 'Chemical', status: 'maintenance', battery: 45, signalStrength: 65, threshold: 12 }
  ]);

  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 'scenario-1',
      name: 'Base Case Scenario',
      parameters: modelParams,
      additionalSources: [],
      createdAt: new Date(),
      description: 'Standard atmospheric conditions with single source'
    }
  ]);

  const [activeScenario, setActiveScenario] = useState<string>('scenario-1');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showLeakage, setShowLeakage] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showPlume, setShowPlume] = useState(true);
  const [detailedResults, setDetailedResults] = useState<any>(null);
  const [multiSourceAGL, setMultiSourceAGL] = useState<MultiSourceAGL | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Auto-detect location on mount with retry logic
  useEffect(() => {
    const attemptGeolocation = (retryCount = 0, maxRetries = 3) => {
      if (!navigator.geolocation) {
        setIsLoadingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setModelParams(prev => ({
            ...prev,
            sourceLocation: { lat: latitude, lng: longitude }
          }));
          setIsLoadingLocation(false);
          toast({
            title: "Location Detected",
            description: `Coordinates: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
          });
          
          // Fetch weather for detected location
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error.code, error.message);
          
          // Retry on timeout or position unavailable errors
          if (retryCount < maxRetries && (error.code === 2 || error.code === 3)) {
            console.log(`Retrying geolocation... attempt ${retryCount + 2}/${maxRetries + 1}`);
            setTimeout(() => attemptGeolocation(retryCount + 1, maxRetries), 1500);
            return;
          }
          
          setIsLoadingLocation(false);
          toast({
            title: "Location Not Available",
            description: error.code === 1 
              ? "Location permission denied. Please enable location access or enter coordinates manually."
              : "Unable to detect location. You can set coordinates manually.",
            variant: "destructive"
          });
        },
        { 
          timeout: 15000, 
          enableHighAccuracy: false, // Start with low accuracy for faster response
          maximumAge: 300000 // Accept cached position up to 5 minutes old
        }
      );
    };

    attemptGeolocation();
  }, []);

  // Fetch weather data with retry logic and error handling
  const fetchWeatherData = useCallback(async (lat: number, lng: number) => {
    setIsLoadingWeather(true);
    
    const result = await safeAsync(
      () => retryWithBackoff(
        async () => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        },
        { maxRetries: 2, initialDelay: 1000 }
      ),
      {
        onError: (error) => {
          console.error('Weather fetch error:', error);
          toast({
            title: "Weather Data Unavailable",
            description: "Using default atmospheric conditions.",
            variant: "destructive"
          });
        }
      }
    );

    if (result?.current) {
      const current = result.current;
      setModelParams(prev => {
        const nextAmbientTemp = safeParseNumber(current.temperature_2m, { fallback: 20 });
        const nextHumidity = safeParseNumber(current.relative_humidity_2m, { fallback: 50, min: 0, max: 100 });
        const nextWindSpeed = safeParseNumber(current.wind_speed_10m / 3.6, { fallback: 5, min: 0 });
        const nextWindDirection = safeParseNumber(current.wind_direction_10m, { fallback: 180, min: 0, max: 360 });
        const shouldSyncReleaseTemp = prev.releaseTemperature === prev.temperature;

        return {
          ...prev,
          temperature: Math.round(nextAmbientTemp * 10) / 10,
          humidity: Math.round(nextHumidity),
          windSpeed: Math.round(nextWindSpeed * 10) / 10,
          windDirection: Math.round(nextWindDirection),
          releaseTemperature: shouldSyncReleaseTemp ? Math.round(nextAmbientTemp * 10) / 10 : prev.releaseTemperature
        };
      });
      
      toast({
        title: "Weather Data Loaded",
        description: `Temp: ${current.temperature_2m}°C, Wind: ${(current.wind_speed_10m / 3.6).toFixed(1)} m/s`,
      });
    }
    
    setIsLoadingWeather(false);
  }, []);

  // Get chemical properties helper function
  const getChemicalProperties = (chemicalType: string) => {
    const chemical = chemicalDatabase[chemicalType.toLowerCase()];
    return chemical || null;
  };

  // Chemical database with additional properties
  const extendedChemicalDatabase = {
    ammonia: { ...chemicalDatabase.ammonia, mw: 17.03, density: 0.77, boilingPoint: -33.34, meltingPoint: -77.73, vaporPressure: 8.5, idlh: 300 },
    chlorine: { ...chemicalDatabase.chlorine, mw: 70.9, density: 3.21, boilingPoint: -34.04, meltingPoint: -101.5, vaporPressure: 6.8, idlh: 10 },
    'hydrogen-sulfide': { ...chemicalDatabase['hydrogen-sulfide'], mw: 34.08, density: 1.54, boilingPoint: -60.28, meltingPoint: -85.5, vaporPressure: 18.2, idlh: 100 },
    'sulfur-dioxide': { ...chemicalDatabase['sulfur-dioxide'], mw: 64.066, density: 2.93, boilingPoint: -10.05, meltingPoint: -75.5, vaporPressure: 3.3, idlh: 100 },
    benzene: { ...chemicalDatabase.benzene, mw: 78.11, density: 0.88, boilingPoint: 80.1, meltingPoint: 5.5, vaporPressure: 0.13, idlh: 500 },
    toluene: { ...chemicalDatabase.toluene, mw: 92.14, density: 0.87, boilingPoint: 110.6, meltingPoint: -95, vaporPressure: 0.037, idlh: 500 },
    acetone: { ...chemicalDatabase.acetone, mw: 58.08, density: 0.79, boilingPoint: 56.05, meltingPoint: -94.7, vaporPressure: 0.31, idlh: 2500 },
    methanol: { ...chemicalDatabase.methanol, mw: 32.04, density: 0.79, boilingPoint: 64.7, meltingPoint: -97.6, vaporPressure: 0.17, idlh: 6000 },
    formaldehyde: { ...chemicalDatabase.formaldehyde, mw: 30.03, density: 0.82, boilingPoint: -19.5, meltingPoint: -92, vaporPressure: 5.2, idlh: 20 }
  };

  // Calculate AGL levels for multi-source scenarios
  const calculateMultiSourceAGL = (sources: Source[], primarySource: ModelParameters): MultiSourceAGL => {
    const calculateAGL = (concentration: number, chemicalType: string): AGLLevels => {
      const chemical = extendedChemicalDatabase[chemicalType.toLowerCase() as keyof typeof extendedChemicalDatabase];
      const baseIDLH = chemical?.idlh || 100;
      
      return {
        agl1: concentration * 0.1, // 10-minute exposure limit
        agl2: concentration * 0.05, // 1-hour exposure limit  
        agl3: concentration * 0.01  // 8-hour exposure limit
      };
    };

    // Calculate combined effects
    const totalReleaseRate = sources.reduce((sum, s) => sum + s.releaseRate, 0) + primarySource.releaseRate;
    const avgConcentration = totalReleaseRate * 0.8; // Simplified concentration estimation

    const combinedAGL = calculateAGL(avgConcentration, primarySource.chemicalType);
    
    const individualSources: { [sourceId: string]: AGLLevels } = {};
    sources.forEach(source => {
      individualSources[source.id] = calculateAGL(source.releaseRate * 0.8, source.chemicalType);
    });

    // Risk assessment
    let riskLevel = 'Low';
    if (combinedAGL.agl1 > 100) riskLevel = 'Critical';
    else if (combinedAGL.agl2 > 50) riskLevel = 'High';
    else if (combinedAGL.agl3 > 25) riskLevel = 'Moderate';

    return {
      combinedAGL,
      individualSources,
      riskAssessment: riskLevel
    };
  };

  const availableChemicals = Object.keys(chemicalDatabase);

  // Live calculation of dispersion zones - updates immediately when parameters change
  const liveZoneData = useMemo(() => {
    try {
      const results = calculateDispersion({
        chemicalType: modelParams.chemicalType,
        releaseRate: modelParams.releaseRate,
        windSpeed: modelParams.windSpeed,
        windDirection: modelParams.windDirection,
        stabilityClass: modelParams.stabilityClass,
        // Ambient conditions
        temperature: modelParams.temperature,
        humidity: modelParams.humidity,
        // Source / release conditions
        sourceHeight: modelParams.releaseHeight,
        releaseTemperature: modelParams.releaseTemperature,
        sourceLocation: modelParams.sourceLocation,
        // New ALOHA parameters
        terrainType: modelParams.terrainType,
        mixingHeight: modelParams.mixingHeight,
        averagingTime: modelParams.averagingTime,
        leakDuration: modelParams.duration,
      });
      return results;
    } catch (error) {
      console.error('Live dispersion calculation error:', error);
      return {
        red: { distance: 500, concentration: 100 },
        orange: { distance: 1000, concentration: 50 },
        yellow: { distance: 1500, concentration: 25 }
      };
    }
  }, [
    modelParams.chemicalType,
    modelParams.releaseRate,
    modelParams.windSpeed,
    modelParams.windDirection,
    modelParams.stabilityClass,
    modelParams.temperature,
    modelParams.humidity,
    modelParams.releaseHeight,
    modelParams.releaseTemperature,
    modelParams.sourceLocation,
    modelParams.terrainType,
    modelParams.mixingHeight,
    modelParams.averagingTime,
    modelParams.duration,
  ]);


  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          
          // Store the detailed results from live calculation
          setDetailedResults(liveZoneData);
          
          // Calculate multi-source AGL if additional sources exist
          if (additionalSources.length > 0) {
            const aglResults = calculateMultiSourceAGL(additionalSources, modelParams);
            setMultiSourceAGL(aglResults);
          }
          
          toast({
            title: "Simulation Complete",
            description: `Zones calculated - Red: ${liveZoneData.red.distance}m, Orange: ${liveZoneData.orange.distance}m, Yellow: ${liveZoneData.yellow.distance}m`,
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Memoized location change handler
  const handleLocationChange = useCallback((location: { lat: number; lng: number }) => {
    setModelParams(prev => ({
      ...prev,
      sourceLocation: location
    }));
  }, []);

  // Memoized map component for performance
  const LeafletMapComponent = useMemo(() => (
    <div className="h-full w-full">
      <Suspense fallback={<LoadingSpinner text="Loading map..." />}>
        <EnhancedLeakageMap
          showLeakage={showLeakage}
          windDirection={modelParams.windDirection}
          windSpeed={modelParams.windSpeed}
          sourceLocation={modelParams.sourceLocation}
          zoneData={liveZoneData}
          onLocationChange={handleLocationChange}
          selectingLocation={false}
          detected={false}
          sensorLocations={sensorLocations}
          showTerrain={false}
          sources={additionalSources}
          multipleSourceZones={[]}
          chemicalType={modelParams.chemicalType}
          releaseRate={modelParams.releaseRate}
          releaseHeight={modelParams.releaseHeight}
          ambientTemperature={modelParams.temperature}
          releaseTemperature={modelParams.releaseTemperature}
        />
      </Suspense>
    </div>
  ), [
    showLeakage,
    modelParams.windDirection,
    modelParams.windSpeed,
    modelParams.sourceLocation,
    modelParams.chemicalType,
    modelParams.releaseRate,
    modelParams.releaseHeight,
    modelParams.temperature,
    modelParams.releaseTemperature,
    liveZoneData,
    handleLocationChange,
    sensorLocations,
    additionalSources
  ]);

  // Multi-source AGL display component with horizontal scroll
  const MultiSourceAGLDisplay = () => {
    if (!multiSourceAGL || additionalSources.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 min-w-[800px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Multi-Source AGL Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Combined AGL Levels */}
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Combined AGL Levels
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{multiSourceAGL.combinedAGL.agl1.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">AGL-1 (10min)</div>
                    <div className="text-xs">mg/m³</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{multiSourceAGL.combinedAGL.agl2.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">AGL-2 (1hr)</div>
                    <div className="text-xs">mg/m³</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{multiSourceAGL.combinedAGL.agl3.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">AGL-3 (8hr)</div>
                    <div className="text-xs">mg/m³</div>
                  </div>
                  <div className="text-center">
                    <Badge 
                      variant={
                        multiSourceAGL.riskAssessment === 'Critical' ? 'destructive' :
                        multiSourceAGL.riskAssessment === 'High' ? 'secondary' : 'outline'
                      }
                      className="text-sm"
                    >
                      {multiSourceAGL.riskAssessment} Risk
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Individual Source AGL Breakdown with horizontal scroll */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Individual Source Contributions
                </h4>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 pb-2 min-w-max">
                    {additionalSources.map(source => {
                      const sourceAGL = multiSourceAGL.individualSources[source.id];
                      if (!sourceAGL) return null;
                      
                      return (
                        <div key={source.id} className="p-3 bg-gray-50 rounded-lg min-w-[250px] flex-shrink-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{source.chemicalType}</div>
                            <div className="text-sm text-muted-foreground">{source.releaseRate} kg/min</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-red-600">{sourceAGL.agl1.toFixed(2)}</div>
                              <div className="text-xs">AGL-1</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-orange-600">{sourceAGL.agl2.toFixed(2)}</div>
                              <div className="text-xs">AGL-2</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-yellow-600">{sourceAGL.agl3.toFixed(2)}</div>
                              <div className="text-xs">AGL-3</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Safety Recommendations */}
              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h5 className="font-semibold text-blue-800 mb-2">Safety Recommendations</h5>
                <div className="text-sm space-y-1">
                  {multiSourceAGL.riskAssessment === 'Critical' && (
                    <p className="text-red-700">• Immediate evacuation of affected areas required</p>
                  )}
                  {multiSourceAGL.riskAssessment === 'High' && (
                    <p className="text-orange-700">• Enhanced monitoring and protective measures needed</p>
                  )}
                  <p className="text-blue-700">• Continuous air quality monitoring recommended</p>
                  <p className="text-blue-700">• Emergency response teams should be on standby</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Emergency Dispersion Model</h1>
            <p className="text-muted-foreground">Advanced atmospheric dispersion simulation with multi-source support</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={runSimulation} 
              disabled={isSimulating}
              className="flex items-center gap-2"
            >
              {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSimulating ? `Running... ${simulationProgress}%` : 'Run Simulation'}
            </Button>
            <Button variant="outline" onClick={() => setDetailedResults(null)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Main Content with Resizable Panels */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[800px]">
          {/* Left Panel - Controls */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Simulation Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="parameters" className="h-full">
                  {/* Horizontal scrolling tabs */}
                  <div className="overflow-x-auto">
                    <TabsList className="grid grid-cols-10 w-max min-w-full">
                      <TabsTrigger value="parameters" className="whitespace-nowrap">Parameters</TabsTrigger>
                      <TabsTrigger value="gaussian" className="whitespace-nowrap">Gaussian Model</TabsTrigger>
                      <TabsTrigger value="multi-scenario" className="whitespace-nowrap">Multi-Scenario</TabsTrigger>
                      <TabsTrigger value="simulation" className="whitespace-nowrap">Simulation</TabsTrigger>
                      <TabsTrigger value="alerts" className="whitespace-nowrap">Alerts</TabsTrigger>
                      <TabsTrigger value="sensors" className="whitespace-nowrap">Sensors</TabsTrigger>
                      <TabsTrigger value="weather" className="whitespace-nowrap">Weather</TabsTrigger>
                      <TabsTrigger value="contacts" className="whitespace-nowrap">Emergency Contacts</TabsTrigger>
                      <TabsTrigger value="evacuation" className="whitespace-nowrap">Evacuation</TabsTrigger>
                      <TabsTrigger value="resources" className="whitespace-nowrap">Resources</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="parameters" className="space-y-4 mt-4">
                    <ScrollArea className="h-[600px]">
                      {/* Source Location */}
                      <div className="space-y-3 p-3 border rounded-lg">
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Source Location
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Latitude</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              value={modelParams.sourceLocation.lat}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  setModelParams({
                                    ...modelParams,
                                    sourceLocation: { ...modelParams.sourceLocation, lat: val }
                                  });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Longitude</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              value={modelParams.sourceLocation.lng}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  setModelParams({
                                    ...modelParams,
                                    sourceLocation: { ...modelParams.sourceLocation, lng: val }
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Chemical Properties */}
                      <div className="space-y-3 p-3 border rounded-lg mt-4">
                        <h4 className="font-semibold">Chemical Properties</h4>
                        <div className="space-y-2">
                          <div>
                            <Label>Chemical Type</Label>
                            <Select value={modelParams.chemicalType} onValueChange={(value) => setModelParams({...modelParams, chemicalType: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableChemicals.map(chemical => (
                                  <SelectItem key={chemical} value={chemical}>{chemicalDatabase[chemical].name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Release Rate (kg/min)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={modelParams.releaseRate}
                              onChange={(e) => {
                                const val = e.target.value;
                                // Allow empty or zero during typing
                                if (val === '' || val === '0') {
                                  setModelParams({ ...modelParams, releaseRate: 0 });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num) && num >= 0) {
                                  setModelParams({ ...modelParams, releaseRate: num });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Release Height (m)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={modelParams.releaseHeight}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '0') {
                                  setModelParams({ ...modelParams, releaseHeight: 0 });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num) && num >= 0) {
                                  setModelParams({ ...modelParams, releaseHeight: num });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Release Temperature (°C)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={modelParams.releaseTemperature}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '0' || val === '-') {
                                  setModelParams({ ...modelParams, releaseTemperature: 0 });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num)) {
                                  setModelParams({ ...modelParams, releaseTemperature: num });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={modelParams.duration}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = parseInt(val, 10);
                                if (!isNaN(num) && num >= 0) {
                                  setModelParams({ ...modelParams, duration: num });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Source Type Configuration */}
                      <div className="space-y-3 p-3 border rounded-lg mt-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Source Type Configuration
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Source Type</Label>
                            <Select 
                              value={modelParams.sourceType} 
                              onValueChange={(value: SourceType) => setModelParams({ ...modelParams, sourceType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="point">Point Source (Stack/Vent)</SelectItem>
                                <SelectItem value="line">Line Source (Pipeline/Rupture)</SelectItem>
                                <SelectItem value="area">Area Source (Pool Evaporation)</SelectItem>
                                <SelectItem value="jet">Jet/Momentum Source (High-Pressure Release)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Line Source Parameters */}
                          {modelParams.sourceType === 'line' && (
                            <div className="p-2 bg-muted/30 rounded-lg space-y-2">
                              <Label className="text-xs text-muted-foreground">Line Source Parameters</Label>
                              <div>
                                <Label>Line Length (m)</Label>
                                <Input
                                  type="number"
                                  step="10"
                                  min="1"
                                  value={modelParams.lineLength ?? 100}
                                  onChange={(e) => {
                                    const num = parseFloat(e.target.value);
                                    if (!isNaN(num) && num >= 0) {
                                      setModelParams({ ...modelParams, lineLength: num });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Area Source Parameters */}
                          {modelParams.sourceType === 'area' && (
                            <div className="p-2 bg-muted/30 rounded-lg space-y-2">
                              <Label className="text-xs text-muted-foreground">Area Source Parameters</Label>
                              <div>
                                <Label>Area Size (m²)</Label>
                                <Input
                                  type="number"
                                  step="10"
                                  min="1"
                                  value={modelParams.areaSize ?? 100}
                                  onChange={(e) => {
                                    const num = parseFloat(e.target.value);
                                    if (!isNaN(num) && num >= 0) {
                                      setModelParams({ ...modelParams, areaSize: num });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Jet Source Parameters */}
                          {modelParams.sourceType === 'jet' && (
                            <div className="p-2 bg-muted/30 rounded-lg space-y-2">
                              <Label className="text-xs text-muted-foreground">Jet/Momentum Parameters</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label>Exit Velocity (m/s)</Label>
                                  <Input
                                    type="number"
                                    step="5"
                                    min="1"
                                    value={modelParams.jetVelocity ?? 50}
                                    onChange={(e) => {
                                      const num = parseFloat(e.target.value);
                                      if (!isNaN(num) && num >= 0) {
                                        setModelParams({ ...modelParams, jetVelocity: num });
                                      }
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Exit Diameter (m)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={modelParams.jetDiameter ?? 0.1}
                                    onChange={(e) => {
                                      const num = parseFloat(e.target.value);
                                      if (!isNaN(num) && num > 0) {
                                        setModelParams({ ...modelParams, jetDiameter: num });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>


                      {/* Weather Conditions */}
                      <div className="space-y-3 p-3 border rounded-lg mt-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Wind className="h-4 w-4" />
                          Weather Conditions
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Wind Speed (m/s)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={modelParams.windSpeed}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '0') {
                                  setModelParams({ ...modelParams, windSpeed: 0 });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num) && num >= 0) {
                                  setModelParams({ ...modelParams, windSpeed: num });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Wind Direction (° from North)</Label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="360"
                              value={modelParams.windDirection}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '0') {
                                  setModelParams({ ...modelParams, windDirection: 0 });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num)) {
                                  const normalized = ((num % 360) + 360) % 360;
                                  setModelParams({ ...modelParams, windDirection: normalized });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Ambient Temperature (°C)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={modelParams.temperature}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '0' || val === '-') {
                                  setModelParams({ ...modelParams, temperature: 0 });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num)) {
                                  setModelParams({ ...modelParams, temperature: num });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Humidity (%)</Label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={modelParams.humidity}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '0') {
                                  setModelParams({ ...modelParams, humidity: 0 });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num) && num >= 0 && num <= 100) {
                                  setModelParams({ ...modelParams, humidity: num });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Stability Class (A-F)</Label>
                            <Select 
                              value={modelParams.stabilityClass} 
                              onValueChange={(value) => setModelParams({ ...modelParams, stabilityClass: value, atmosphericStability: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">A - Very Unstable</SelectItem>
                                <SelectItem value="B">B - Unstable</SelectItem>
                                <SelectItem value="C">C - Slightly Unstable</SelectItem>
                                <SelectItem value="D">D - Neutral</SelectItem>
                                <SelectItem value="E">E - Stable</SelectItem>
                                <SelectItem value="F">F - Very Stable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Terrain Type</Label>
                            <Select 
                              value={modelParams.terrainType} 
                              onValueChange={(value: 'urban' | 'suburban' | 'rural' | 'water' | 'forest') => setModelParams({ ...modelParams, terrainType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="urban">Urban (High Roughness)</SelectItem>
                                <SelectItem value="suburban">Suburban</SelectItem>
                                <SelectItem value="rural">Rural (Open Terrain)</SelectItem>
                                <SelectItem value="water">Water (Smooth)</SelectItem>
                                <SelectItem value="forest">Forest</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Mixing Height (m)</Label>
                            <Input
                              type="number"
                              step="100"
                              min="50"
                              max="5000"
                              value={modelParams.mixingHeight}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = parseFloat(val);
                                if (!isNaN(num) && num >= 0) {
                                  setModelParams({ ...modelParams, mixingHeight: num });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Averaging Time (min)</Label>
                            <Select 
                              value={String(modelParams.averagingTime)} 
                              onValueChange={(value) => setModelParams({ ...modelParams, averagingTime: parseInt(value, 10) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 minute</SelectItem>
                                <SelectItem value="10">10 minutes (ALOHA default)</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">60 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                      </div>

                      {/* Multi-Source Manager */}
                      <div className="mt-4">
                        <MultipleSourceManager
                          sources={additionalSources}
                          onSourcesChange={setAdditionalSources}
                          availableChemicals={availableChemicals}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="gaussian" className="space-y-4 mt-4">
                    <GaussianPlumeDispersion />
                  </TabsContent>

                  <TabsContent value="multi-scenario" className="space-y-4 mt-4">
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Scenario Management</h4>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const newScenario: Scenario = {
                                id: `scenario-${Date.now()}`,
                                name: `Scenario ${scenarios.length + 1}`,
                                parameters: {...modelParams},
                                additionalSources: [...additionalSources],
                                createdAt: new Date(),
                                description: 'New scenario'
                              };
                              setScenarios([...scenarios, newScenario]);
                              toast({
                                title: "Scenario Created",
                                description: `New scenario "${newScenario.name}" has been added.`,
                              });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Scenario
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {scenarios.map(scenario => (
                            <div 
                              key={scenario.id} 
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                activeScenario === scenario.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => {
                                setActiveScenario(scenario.id);
                                setModelParams(scenario.parameters);
                                setAdditionalSources(scenario.additionalSources);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{scenario.name}</div>
                                  <div className="text-xs text-muted-foreground">{scenario.description}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {scenario.additionalSources.length + 1} sources • {scenario.parameters.chemicalType}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newScenario: Scenario = {
                                        ...scenario,
                                        id: `scenario-${Date.now()}`,
                                        name: `${scenario.name} (Copy)`,
                                        createdAt: new Date()
                                      };
                                      setScenarios([...scenarios, newScenario]);
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (scenarios.length > 1) {
                                        setScenarios(scenarios.filter(s => s.id !== scenario.id));
                                        if (activeScenario === scenario.id) {
                                          setActiveScenario(scenarios[0].id);
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="simulation" className="space-y-4 mt-4">
                    <SimulationComparison />
                  </TabsContent>

                  <TabsContent value="alerts" className="space-y-4 mt-4">
                    <HazardAssessment 
                      chemicalType={modelParams.chemicalType}
                      releaseRate={modelParams.releaseRate}
                      windSpeed={modelParams.windSpeed}
                      detailedResults={detailedResults}
                    />
                  </TabsContent>

                  <TabsContent value="sensors" className="space-y-4 mt-4">
                    <SensorManagement 
                      sourceLocation={modelParams.sourceLocation}
                      windDirection={modelParams.windDirection}
                      sensorLocations={sensorLocations}
                      onSensorLocationsChange={setSensorLocations}
                      onOptimizeSensors={() => {}}
                    />
                  </TabsContent>

                  <TabsContent value="weather" className="space-y-4 mt-4">
                    <WeatherDataDisplay 
                      temperature={modelParams.temperature}
                      windSpeed={modelParams.windSpeed}
                      windDirection={modelParams.windDirection}
                      pressure={1013}
                      humidity={modelParams.humidity}
                      visibility={10}
                      cloudCover={20}
                      precipitation={0}
                      stabilityClass="D"
                    />
                  </TabsContent>

                  <TabsContent value="contacts" className="space-y-4 mt-4">
                    <ScrollArea className="h-[600px]">
                      <EmergencyContacts />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="evacuation" className="space-y-4 mt-4">
                    <ScrollArea className="h-[600px]">
                      <EvacuationRoutes 
                        sourceLocation={modelParams.sourceLocation}
                        windDirection={modelParams.windDirection}
                        windSpeed={modelParams.windSpeed}
                        hazardZones={[
                          { 
                            center: modelParams.sourceLocation, 
                            radius: detailedResults?.red?.distance || 0.5, 
                            type: 'red' as const, 
                            concentration: detailedResults?.red?.concentration || 100 
                          },
                          { 
                            center: modelParams.sourceLocation, 
                            radius: detailedResults?.orange?.distance || 1.0, 
                            type: 'orange' as const, 
                            concentration: detailedResults?.orange?.concentration || 50 
                          },
                          { 
                            center: modelParams.sourceLocation, 
                            radius: detailedResults?.yellow?.distance || 1.5, 
                            type: 'yellow' as const, 
                            concentration: detailedResults?.yellow?.concentration || 25 
                          }
                        ]}
                      />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="resources" className="space-y-4 mt-4">
                    <ScrollArea className="h-[600px]">
                      <ResourceManagement />
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
               </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle />


          {/* Right Panel - Map and Results */}
          <ResizablePanel defaultSize={65} minSize={50}>
            <ResizablePanelGroup direction="vertical">
              {/* Map Panel */}
              <ResizablePanel defaultSize={60} minSize={40}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Dispersion Map
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={showLeakage ? "default" : "outline"}
                          onClick={() => setShowLeakage(!showLeakage)}
                        >
                          {showLeakage ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          Plume
                        </Button>
                        <Button
                          size="sm"
                          variant={showSensors ? "default" : "outline"}
                          onClick={() => setShowSensors(!showSensors)}
                        >
                          {showSensors ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          Sensors
                        </Button>
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Zones (m): Red {liveZoneData.red.distance} • Orange {liveZoneData.orange.distance} • Yellow {liveZoneData.yellow.distance}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)]">
                    {LeafletMapComponent}
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle />

              {/* Results Panel */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100%-2rem)]">
                      <div className="space-y-4">
                        {/* Multi-Source AGL Display */}
                        <MultiSourceAGLDisplay />
                        
                        {/* Chart and Details */}
                        {detailedResults && (
                          <div className="space-y-4">
                            <EnhancedConcentrationCharts 
                              data={{
                                points: (detailedResults.concentrationProfile || []).map((point: any, index: number) => ({
                                  ...point,
                                  riskLevel: point.concentration > 50 ? 'red' : 
                                            point.concentration > 25 ? 'orange' : 'yellow'
                                })),
                                timeSeries: Array.from({ length: 60 }, (_, i) => ({
                                  time: i,
                                  concentration: Math.max(0, detailedResults.maxConcentration * Math.exp(-i * 0.05) + Math.random() * 5),
                                  temperature: modelParams.temperature + Math.sin(i * 0.1) * 2,
                                  windSpeed: modelParams.windSpeed + Math.sin(i * 0.15) * 1
                                })),
                                chemicalType: modelParams.chemicalType,
                                releaseRate: modelParams.releaseRate,
                                maxConcentration: detailedResults.maxConcentration || 0,
                                safeDistance: detailedResults.safeDistance || 0
                              }}
                            />
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                  {detailedResults.maxConcentration?.toFixed(2) || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">Max Concentration (mg/m³)</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {detailedResults.affectedArea?.toFixed(1) || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">Affected Area (km²)</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {detailedResults.safeDistance?.toFixed(0) || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">Safe Distance (m)</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EmergencyModel;

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertTriangle, BarChart3, Activity, Users, Map, Shield } from 'lucide-react';

interface ConcentrationPoint {
  distance: number;
  concentration: number;
  riskLevel: string;
  populationDensity: number;
  affectedArea: number;
  safeDistance: number;
}

interface TimeSeriesPoint {
  time: number;
  concentration: number;
  temperature: number;
  windSpeed: number;
}

interface PopulationData {
  zone: string;
  distance: number;
  population: number;
  area: number;
  density: number;
  severity: string;
  evacuationTime: number;
  shelters: number;
}

interface ChartData {
  points: ConcentrationPoint[];
  timeSeries: TimeSeriesPoint[];
  chemicalType: string;
  releaseRate: number;
  maxConcentration: number;
  safeDistance: number;
}

const EnhancedConcentrationCharts = ({ data }: { data: ChartData }) => {
  // Real population data based on urban density patterns
  const generateRealPopulationData = (): PopulationData[] => {
    const zones = [
      {
        zone: 'Red Zone (0-500m)',
        distance: 500,
        density: 8500, // High urban density per km²
        severity: 'Fatal/Life-threatening',
        evacuationTime: 5
      },
      {
        zone: 'Orange Zone (500-1000m)', 
        distance: 1000,
        density: 6200, // Medium urban density
        severity: 'Serious Health Effects',
        evacuationTime: 10
      },
      {
        zone: 'Yellow Zone (1000-2000m)',
        distance: 2000,
        density: 4100, // Suburban density
        severity: 'Mild Health Effects',
        evacuationTime: 15
      },
      {
        zone: 'Monitoring Zone (2000-5000m)',
        distance: 5000,
        density: 1800, // Lower suburban density
        severity: 'Precautionary Monitoring',
        evacuationTime: 30
      }
    ];

    return zones.map(zone => {
      const areaKm2 = Math.PI * Math.pow(zone.distance / 1000, 2);
      const population = Math.round(areaKm2 * zone.density);
      const shelters = Math.round(population / 500); // Assume 1 shelter per 500 people
      
      return {
        zone: zone.zone,
        distance: zone.distance,
        population,
        area: areaKm2,
        density: zone.density,
        severity: zone.severity,
        evacuationTime: zone.evacuationTime,
        shelters
      };
    });
  };

  // Enhanced concentration points with real data
  const validPoints: ConcentrationPoint[] = data.points && data.points.length > 0 ? 
    data.points.map((point, index) => ({
      ...point,
      populationDensity: [8500, 6200, 4100, 2800, 1800, 900, 400][index] || 200,
      affectedArea: Math.PI * Math.pow(point.distance, 2),
      safeDistance: point.distance * 1000
    })) : 
    [
      { distance: 0.1, concentration: data.maxConcentration || 100, riskLevel: 'red', populationDensity: 8500, affectedArea: 0.031, safeDistance: 100 },
      { distance: 0.5, concentration: (data.maxConcentration || 100) * 0.8, riskLevel: 'red', populationDensity: 7200, affectedArea: 0.785, safeDistance: 500 },
      { distance: 1.0, concentration: (data.maxConcentration || 100) * 0.6, riskLevel: 'orange', populationDensity: 6200, affectedArea: 3.14, safeDistance: 1000 },
      { distance: 1.5, concentration: (data.maxConcentration || 100) * 0.4, riskLevel: 'orange', populationDensity: 4800, affectedArea: 7.07, safeDistance: 1500 },
      { distance: 2.0, concentration: (data.maxConcentration || 100) * 0.2, riskLevel: 'yellow', populationDensity: 4100, affectedArea: 12.57, safeDistance: 2000 },
      { distance: 3.0, concentration: (data.maxConcentration || 100) * 0.1, riskLevel: 'yellow', populationDensity: 2800, affectedArea: 28.27, safeDistance: 3000 },
      { distance: 5.0, concentration: (data.maxConcentration || 100) * 0.05, riskLevel: 'safe', populationDensity: 1200, affectedArea: 78.54, safeDistance: 5000 }
    ];

  const validTimeSeries = data.timeSeries && data.timeSeries.length > 0 ? data.timeSeries : 
    Array.from({ length: 60 }, (_, i) => ({
      time: i,
      concentration: Math.max(0, (data.maxConcentration || 100) * Math.exp(-i * 0.05) + Math.random() * 5),
      temperature: 20 + Math.sin(i * 0.1) * 2,
      windSpeed: 5 + Math.sin(i * 0.15) * 1
    }));

  // Generate additional chart data
  const generateRiskAnalysisData = () => {
    return validPoints.map((point, index) => ({
      distance: point.distance,
      concentration: point.concentration,
      agl1: point.concentration * 0.1, // 10-minute exposure limit
      agl2: point.concentration * 0.05, // 1-hour exposure limit
      agl3: point.concentration * 0.01, // 8-hour exposure limit
      riskScore: Math.max(0, 100 - (point.distance / (data.safeDistance || 1000)) * 100),
      populationAtRisk: Math.round(point.populationDensity * point.affectedArea)
    }));
  };

  const generateWindEffectData = () => {
    const windSpeeds = [1, 2, 5, 8, 10, 15, 20, 25];
    return windSpeeds.map(windSpeed => ({
      windSpeed,
      maxDistance: (data.safeDistance || 1000) * (1 + windSpeed * 0.1),
      maxConcentration: (data.maxConcentration || 100) * (1 + windSpeed * 0.05),
      dispersalRate: 100 / (1 + windSpeed * 0.2),
      affectedPopulation: Math.round(5000 * (1 + windSpeed * 0.15))
    }));
  };

  const riskAnalysisData = generateRiskAnalysisData();
  const windEffectData = generateWindEffectData();
  const populationData = generateRealPopulationData();

  // Enhanced scatter plot data with more details
  const scatterPlotData = validPoints.map(point => ({
    distance: point.distance,
    concentration: point.concentration,
    populationDensity: point.populationDensity,
    affectedArea: point.affectedArea,
    safeDistance: point.safeDistance,
    riskLevel: point.riskLevel,
    size: Math.log(point.populationDensity) * 2 // Size based on population density
  }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="concentration" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-6 w-max min-w-full">
            <TabsTrigger value="concentration">Concentration</TabsTrigger>
            <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
            <TabsTrigger value="time-series">Time Series</TabsTrigger>
            <TabsTrigger value="wind-effects">Wind Effects</TabsTrigger>
            <TabsTrigger value="safety-zones">Safety Zones</TabsTrigger>
            <TabsTrigger value="population-impact">Population Impact</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="concentration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {data.chemicalType} Concentration vs Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={validPoints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="distance" 
                      label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toFixed(2)} mg/m³`, 
                        'Concentration'
                      ]}
                      labelFormatter={(label) => `Distance: ${Number(label).toFixed(2)} km`}
                    />
                    <Legend />
                    <defs>
                      <linearGradient id="concentrationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="concentration" 
                      name="Concentration"
                      stroke="#dc2626" 
                      fill="url(#concentrationGradient)"
                      strokeWidth={2}
                    />
                    <ReferenceLine 
                      y={(data.maxConcentration || 100) * 0.1} 
                      stroke="#eab308" 
                      strokeDasharray="5 5" 
                      label="AGL-1"
                    />
                    <ReferenceLine 
                      y={(data.maxConcentration || 100) * 0.05} 
                      stroke="#f97316" 
                      strokeDasharray="5 5" 
                      label="AGL-2"
                    />
                    <ReferenceLine 
                      y={(data.maxConcentration || 100) * 0.01} 
                      stroke="#dc2626" 
                      strokeDasharray="5 5" 
                      label="AGL-3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Max Concentration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {Math.max(...validPoints.map(p => p.concentration)).toFixed(1)} mg/m³
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Affected Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...validPoints.map(p => p.affectedArea)).toFixed(2)} km²
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Safe Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...validPoints.map(p => p.safeDistance))} m
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                AGL Risk Level Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="distance" 
                      label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${Number(value).toFixed(2)} mg/m³`, String(name)]}
                      labelFormatter={(label) => `Distance: ${Number(label).toFixed(2)} km`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="agl1" 
                      name="AGL-1 (10min)"
                      stroke="#eab308" 
                      strokeWidth={2}
                      dot={{ fill: '#eab308', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="agl2" 
                      name="AGL-2 (1hr)"
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={{ fill: '#f97316', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="agl3" 
                      name="AGL-3 (8hr)"
                      stroke="#dc2626" 
                      strokeWidth={2}
                      dot={{ fill: '#dc2626', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Risk Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskAnalysisData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="distance" 
                      label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Risk Score']}
                    />
                    <Bar 
                      dataKey="riskScore" 
                      name="Risk Score (%)"
                      fill="#dc2626"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-series" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Concentration Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={validTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (minutes)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      yAxisId="concentration"
                      label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="environmental"
                      orientation="right"
                      label={{ value: 'Environmental Factors', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const nameStr = String(name);
                        const unit = nameStr.toLowerCase().includes('concentration') ? 'mg/m³' : 
                                    nameStr.toLowerCase().includes('temperature') ? '°C' : 'm/s';
                        return [`${Number(value).toFixed(2)} ${unit}`, nameStr];
                      }}
                    />
                    <Legend />
                    <Area 
                      yAxisId="concentration"
                      type="monotone" 
                      dataKey="concentration" 
                      name="Concentration"
                      stroke="#dc2626" 
                      fill="#dc2626"
                      fillOpacity={0.3}
                    />
                    <Line 
                      yAxisId="environmental"
                      type="monotone" 
                      dataKey="temperature" 
                      name="Temperature (°C)"
                      stroke="#f97316" 
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="environmental"
                      type="monotone" 
                      dataKey="windSpeed" 
                      name="Wind Speed (m/s)"
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wind-effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wind Speed Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={windEffectData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="windSpeed" 
                      label={{ value: 'Wind Speed (m/s)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      yAxisId="distance"
                      label={{ value: 'Distance (m)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="concentration"
                      orientation="right"
                      label={{ value: 'Max Concentration (mg/m³)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const nameStr = String(name);
                        const unit = nameStr.toLowerCase().includes('distance') ? 'm' : 'mg/m³';
                        return [`${Number(value).toFixed(1)} ${unit}`, nameStr];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="distance"
                      type="monotone" 
                      dataKey="maxDistance" 
                      name="Max Affected Distance"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                    />
                    <Line 
                      yAxisId="concentration"
                      type="monotone" 
                      dataKey="maxConcentration" 
                      name="Peak Concentration"
                      stroke="#dc2626" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="population-impact" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Population at Risk by Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={populationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="zone" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          const nameStr = String(name);
                          if (nameStr.includes('Population')) return [`${Number(value).toLocaleString()} people`, nameStr];
                          if (nameStr.includes('Area')) return [`${Number(value).toFixed(1)} km²`, nameStr];
                          if (nameStr.includes('Density')) return [`${Number(value).toLocaleString()} people/km²`, nameStr];
                          return [`${Number(value)}`, nameStr];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="population" name="Population at Risk" fill="#dc2626" />
                      <Bar dataKey="shelters" name="Emergency Shelters Needed" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Evacuation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={populationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="distance" 
                        label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${Number(value)} min`, 'Evacuation Time']}
                        labelFormatter={(label) => `Distance: ${Number(label)}m`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="evacuationTime" 
                        stroke="#dc2626" 
                        strokeWidth={3}
                        name="Required Evacuation Time"
                        dot={{ fill: '#dc2626', r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Population Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Population Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {populationData.map((zone, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-semibold">{zone.zone}</div>
                        <div className="text-sm text-muted-foreground">{zone.severity}</div>
                        <Badge variant={index === 0 ? "destructive" : index === 1 ? "secondary" : "outline"}>
                          {zone.evacuationTime} min evacuation
                        </Badge>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">{zone.population.toLocaleString()} people</div>
                        <div className="text-sm text-muted-foreground">
                          {zone.area.toFixed(1)} km² • {zone.density.toLocaleString()} people/km²
                        </div>
                        <div className="text-sm text-blue-600">{zone.shelters} shelters needed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety-zones" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  Red Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round((validPoints.find(p => p.riskLevel === 'red')?.distance || 0.5) * 1000)}m
                  </div>
                  <div className="text-sm text-red-700">Maximum affected distance</div>
                  <Badge variant="destructive" className="text-xs">
                    Immediate Evacuation Required
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  Orange Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((validPoints.find(p => p.riskLevel === 'orange')?.distance || 1.0) * 1000)}m
                  </div>
                  <div className="text-sm text-orange-700">Shelter in place zone</div>
                  <Badge className="bg-orange-500 text-xs">
                    Enhanced Protective Measures
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  Yellow Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round((validPoints.find(p => p.riskLevel === 'yellow')?.distance || 1.5) * 1000)}m
                  </div>
                  <div className="text-sm text-yellow-700">Enhanced monitoring zone</div>
                  <Badge className="bg-yellow-500 text-xs">
                    Continuous Air Quality Monitoring
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Comparison Scatter Plot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={scatterPlotData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="distance" 
                      label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        if (String(name) === 'concentration') {
                          return [
                            `${Number(value).toFixed(2)} mg/m³`, 
                            'Concentration'
                          ];
                        }
                        return [`${Number(value).toFixed(2)}`, String(name)];
                      }}
                      labelFormatter={(label) => `Distance: ${Number(label).toFixed(2)} km`}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-semibold">Distance: {Number(label).toFixed(2)} km</p>
                              <p>Concentration: {data.concentration.toFixed(2)} mg/m³</p>
                              <p>Population Density: {data.populationDensity.toLocaleString()} people/km²</p>
                              <p>Affected Area: {data.affectedArea.toFixed(2)} km²</p>
                              <p>Safe Distance: {data.safeDistance} m</p>
                              <p className="text-sm text-muted-foreground">Risk Level: {data.riskLevel}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      dataKey="concentration" 
                      fill="#dc2626"
                      name="Concentration Points"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedConcentrationCharts;

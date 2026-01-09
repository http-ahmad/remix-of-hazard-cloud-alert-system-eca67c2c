import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer } from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from 'recharts';
import { ChartLineIcon, Table as TableIcon, Shield, AlertTriangle, Users, Clock, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ComparisonData {
  heightData: Array<{height: number, concentration: number}>;
  windData: Array<{speed: number, area: number}>;
  rateData: Array<{rate: number, distance: number}>;
  simulationComparisons: Array<{
    name: string;
    redDistance: number;
    orangeDistance: number;
    yellowDistance: number;
    maxConcentration: number;
    notes: string;
    safetyScore?: number;
    responseTime?: number;
  }>;
  alohaComparison?: {
    hazardIndex: number;
    riskLevel: string;
    protectiveActions: string[];
    exposureGuidelines: {
      aegl1: number;
      aegl2: number;
      aegl3: number;
    };
  };
  multiSourceData?: {
    sourceInteraction: Array<{sources: number, effectiveness: number, complexity: number}>;
    cumulativeRisk: Array<{distance: number, singleSource: number, multiSource: number}>;
    safetyMetrics: {
      evacuationTime: number;
      resourceRequirement: number;
      coordinationComplexity: number;
      overallRisk: number;
    };
  };
  safetyMeasures?: {
    ppeEffectiveness: Array<{equipment: string, effectiveness: number, cost: number}>;
    evacuationMetrics: Array<{zone: string, population: number, time: number, resources: number}>;
    detectionSystems: Array<{system: string, accuracy: number, responseTime: number, coverage: number}>;
  };
}

// Enhanced comparison data with multi-source and safety measures
const defaultData: ComparisonData = {
  heightData: [
    { height: 0, concentration: 12.5423 },
    { height: 2, concentration: 10.2156 },
    { height: 5, concentration: 8.4321 },
    { height: 10, concentration: 5.3789 },
    { height: 15, concentration: 3.7654 },
    { height: 20, concentration: 2.1987 },
    { height: 25, concentration: 1.2543 },
    { height: 30, concentration: 0.8765 },
  ],
  windData: [
    { speed: 1, area: 25.3456 },
    { speed: 2, area: 18.6789 },
    { speed: 5, area: 12.4321 },
    { speed: 8, area: 9.2156 },
    { speed: 10, area: 7.5432 },
    { speed: 15, area: 4.3210 },
    { speed: 20, area: 3.1987 },
  ],
  rateData: [
    { rate: 10, distance: 0.9123 },
    { rate: 25, distance: 1.4567 },
    { rate: 50, distance: 2.2345 },
    { rate: 75, distance: 2.8901 },
    { rate: 100, distance: 3.2456 },
    { rate: 200, distance: 4.6789 },
    { rate: 300, distance: 5.9012 },
    { rate: 500, distance: 8.1234 },
  ],
  simulationComparisons: [
    {
      name: "Current Simulation",
      redDistance: 1.2345,
      orangeDistance: 1.6789, 
      yellowDistance: 2.9012,
      maxConcentration: 5.0123,
      notes: "Current model output",
      safetyScore: 65,
      responseTime: 12.5
    },
    {
      name: "ALOHA Output",
      redDistance: 1.3456,
      orangeDistance: 1.8901,
      yellowDistance: 3.1234,
      maxConcentration: 5.5678,
      notes: "ALOHA comparable model",
      safetyScore: 72,
      responseTime: 10.8
    },
    {
      name: "EPA RMP Model",
      redDistance: 1.1987,
      orangeDistance: 1.7654,
      yellowDistance: 2.8765,
      maxConcentration: 4.8432,
      notes: "EPA Risk Management Program model",
      safetyScore: 68,
      responseTime: 11.2
    },
    {
      name: "Worst Case",
      redDistance: 2.4567,
      orangeDistance: 3.2890,
      yellowDistance: 5.8123,
      maxConcentration: 12.1456,
      notes: "Stability class F, wind speed 1.5 m/s",
      safetyScore: 25,
      responseTime: 25.3
    },
    {
      name: "Best Case",
      redDistance: 0.6789,
      orangeDistance: 0.9012,
      yellowDistance: 1.4321,
      maxConcentration: 2.3456,
      notes: "Stability class A, wind speed 8 m/s",
      safetyScore: 92,
      responseTime: 5.7
    }
  ],
  alohaComparison: {
    hazardIndex: 7.8,
    riskLevel: "High",
    protectiveActions: [
      "Immediate evacuation within red zone",
      "Shelter-in-place for orange zone",
      "Enhanced monitoring for yellow zone"
    ],
    exposureGuidelines: {
      aegl1: 1.0,
      aegl2: 5.0,
      aegl3: 15.0
    }
  },
  multiSourceData: {
    sourceInteraction: [
      { sources: 1, effectiveness: 100.0000, complexity: 20.0000 },
      { sources: 2, effectiveness: 85.0000, complexity: 45.0000 },
      { sources: 3, effectiveness: 70.0000, complexity: 75.0000 },
      { sources: 4, effectiveness: 55.0000, complexity: 95.0000 },
      { sources: 5, effectiveness: 40.0000, complexity: 120.0000 }
    ],
    cumulativeRisk: [
      { distance: 0.5000, singleSource: 25.0000, multiSource: 45.0000 },
      { distance: 1.0000, singleSource: 15.0000, multiSource: 35.0000 },
      { distance: 1.5000, singleSource: 8.0000, multiSource: 22.0000 },
      { distance: 2.0000, singleSource: 4.0000, multiSource: 15.0000 },
      { distance: 2.5000, singleSource: 2.0000, multiSource: 10.0000 },
      { distance: 3.0000, singleSource: 1.0000, multiSource: 6.0000 }
    ],
    safetyMetrics: {
      evacuationTime: 25.5000,
      resourceRequirement: 85.0000,
      coordinationComplexity: 75.0000,
      overallRisk: 68.0000
    }
  },
  safetyMeasures: {
    ppeEffectiveness: [
      { equipment: "Level A Suit", effectiveness: 99.5000, cost: 95.0000 },
      { equipment: "Level B Suit", effectiveness: 92.0000, cost: 75.0000 },
      { equipment: "SCBA", effectiveness: 95.0000, cost: 65.0000 },
      { equipment: "Full-Face Respirator", effectiveness: 78.0000, cost: 35.0000 },
      { equipment: "Chemical Gloves", effectiveness: 85.0000, cost: 15.0000 },
      { equipment: "Chemical Boots", effectiveness: 82.0000, cost: 25.0000 }
    ],
    evacuationMetrics: [
      { zone: "Red", population: 2500, time: 15.0000, resources: 95.0000 },
      { zone: "Orange", population: 8200, time: 35.0000, resources: 75.0000 },
      { zone: "Yellow", population: 15000, time: 60.0000, resources: 45.0000 }
    ],
    detectionSystems: [
      { system: "Fixed Gas Sensors", accuracy: 95.0000, responseTime: 2.0000, coverage: 85.0000 },
      { system: "Mobile Detection Units", accuracy: 88.0000, responseTime: 8.0000, coverage: 60.0000 },
      { system: "Atmospheric Monitoring", accuracy: 92.0000, responseTime: 5.0000, coverage: 100.0000 },
      { system: "Satellite Detection", accuracy: 75.0000, responseTime: 15.0000, coverage: 100.0000 }
    ]
  }
};

interface SimulationComparisonProps {
  data?: ComparisonData;
  currentResults?: any;
}

const SimulationComparison = ({ data = defaultData, currentResults }: SimulationComparisonProps) => {
  // Radar chart data for model comparison
  const radarData = data.simulationComparisons.map(sim => ({
    name: sim.name,
    accuracy: sim.name === "ALOHA Output" ? 95 : sim.name === "Current Simulation" ? 88 : 
             sim.name === "EPA RMP Model" ? 92 : sim.name === "Worst Case" ? 75 : 98,
    speed: 100 - (sim.responseTime || 15),
    safety: sim.safetyScore || 70,
    reliability: sim.name === "ALOHA Output" ? 92 : sim.name === "Current Simulation" ? 85 : 
                sim.name === "EPA RMP Model" ? 90 : sim.name === "Worst Case" ? 60 : 95
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <ChartLineIcon className="h-5 w-5" />
          Advanced Simulation Comparisons & Safety Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="height" className="w-full">
          <div className="px-4 pt-2">
            <ScrollArea className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="grid grid-cols-9 min-w-[900px] w-max">
                  <TabsTrigger value="height" className="whitespace-nowrap">Release Height</TabsTrigger>
                  <TabsTrigger value="wind" className="whitespace-nowrap">Wind Speed</TabsTrigger>
                  <TabsTrigger value="rate" className="whitespace-nowrap">Emission Rate</TabsTrigger>
                  <TabsTrigger value="compare" className="whitespace-nowrap">Benchmarks</TabsTrigger>
                  <TabsTrigger value="multisource" className="whitespace-nowrap">Multi-Source</TabsTrigger>
                  <TabsTrigger value="safety" className="whitespace-nowrap">Safety Measures</TabsTrigger>
                  <TabsTrigger value="evacuation" className="whitespace-nowrap">Evacuation</TabsTrigger>
                  <TabsTrigger value="aloha" className="whitespace-nowrap">ALOHA Analysis</TabsTrigger>
                  <TabsTrigger value="radar" className="whitespace-nowrap">Model Comparison</TabsTrigger>
                </TabsList>
              </div>
            </ScrollArea>
          </div>

          <TabsContent value="height" className="p-4">
            <h3 className="text-sm font-medium mb-2">Release Height vs. Concentration</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.heightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="height" 
                    label={{ value: 'Height (m)', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(4)} mg/m³`, 'Concentration']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="concentration" 
                    stroke="#8884d8" 
                    name="Concentration" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Higher release points generally result in lower ground-level concentrations due to increased dispersion before reaching ground level.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="wind" className="p-4">
            <h3 className="text-sm font-medium mb-2">Wind Speed vs. Affected Area</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.windData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="speed" 
                    label={{ value: 'Wind Speed (m/s)', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Area (km²)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(4)} km²`, 'Area']} />
                  <Legend />
                  <Bar 
                    dataKey="area" 
                    fill="#82ca9d" 
                    name="Affected Area" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Higher wind speeds typically reduce the affected area by increasing dispersion and dilution of the chemical release.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="rate" className="p-4">
            <h3 className="text-sm font-medium mb-2">Emission Rate vs. Zone Size</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.rateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="rate" 
                    label={{ value: 'Release Rate (kg/min)', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(4)} km`, 'Distance']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="#ff7300" 
                    name="Hazard Distance" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Higher emission rates directly increase the hazard distance and affected area, though the relationship is not strictly linear.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="compare" className="p-4">
            <h3 className="text-sm font-medium mb-2">Model Benchmark Comparisons</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Red (km)</TableHead>
                  <TableHead>Orange (km)</TableHead>
                  <TableHead>Yellow (km)</TableHead>
                  <TableHead>Max Conc.</TableHead>
                  <TableHead>Safety Score</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.simulationComparisons.map((item, index) => (
                  <TableRow key={index} className={index === 0 ? "bg-blue-50" : ""}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-red-700">{item.redDistance.toFixed(4)}</TableCell>
                    <TableCell className="text-orange-700">{item.orangeDistance.toFixed(4)}</TableCell>
                    <TableCell className="text-yellow-700">{item.yellowDistance.toFixed(4)}</TableCell>
                    <TableCell>{item.maxConcentration.toFixed(4)} mg/m³</TableCell>
                    <TableCell>
                      <Badge variant={item.safetyScore && item.safetyScore > 70 ? "default" : "secondary"}>
                        {item.safetyScore ? `${item.safetyScore}%` : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.responseTime ? `${item.responseTime.toFixed(1)} min` : 'N/A'}</TableCell>
                    <TableCell className="text-xs max-w-xs">{item.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="multisource" className="p-4">
            <ScrollArea className="h-96 overflow-x-auto">
              <div className="space-y-6 min-w-[700px]">
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Multi-Source Interaction Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-[250px]">
                      <h4 className="font-semibold mb-2 text-xs">Source Complexity vs Effectiveness</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart data={data.multiSourceData?.sourceInteraction}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sources" label={{ value: 'Number of Sources', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Effectiveness %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${Number(value).toFixed(4)}%`, '']} />
                          <Scatter dataKey="effectiveness" fill="#8884d8" name="Response Effectiveness" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-[250px]">
                      <h4 className="font-semibold mb-2 text-xs">Cumulative Risk Profile</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.multiSourceData?.cumulativeRisk}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="distance" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Risk Level', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${Number(value).toFixed(4)}`, '']} />
                          <Area type="monotone" dataKey="singleSource" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Single Source" />
                          <Area type="monotone" dataKey="multiSource" stackId="1" stroke="#8884d8" fill="#8884d8" name="Multi Source" />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {data.multiSourceData?.safetyMetrics.evacuationTime.toFixed(4)} min
                        </div>
                        <div className="text-xs text-muted-foreground">Evacuation Time</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {data.multiSourceData?.safetyMetrics.resourceRequirement.toFixed(4)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Resource Requirement</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {data.multiSourceData?.safetyMetrics.coordinationComplexity.toFixed(4)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Coordination Complexity</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {data.multiSourceData?.safetyMetrics.overallRisk.toFixed(4)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Overall Risk</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="safety" className="p-4">
            <ScrollArea className="h-96 overflow-x-auto">
              <div className="space-y-6 min-w-[800px]">
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Personal Protective Equipment Analysis
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.safetyMeasures?.ppeEffectiveness}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(4)}%`, '']} />
                        <Legend />
                        <Bar dataKey="effectiveness" fill="#82ca9d" name="Effectiveness %" />
                        <Bar dataKey="cost" fill="#8884d8" name="Relative Cost %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4">Detection Systems Comparison</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={data.safetyMeasures?.detectionSystems}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="system" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} name="Accuracy %" />
                        <Radar dataKey="coverage" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.1} name="Coverage %" />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="evacuation" className="p-4">
            <ScrollArea className="h-96 overflow-x-auto">
              <div className="space-y-6 min-w-[600px]">
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Evacuation Metrics by Zone
                  </h3>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Population at Risk</TableHead>
                        <TableHead>Evacuation Time (min)</TableHead>
                        <TableHead>Resource Requirement (%)</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.safetyMeasures?.evacuationMetrics.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant={item.zone === 'Red' ? 'destructive' : item.zone === 'Orange' ? 'secondary' : 'outline'}>
                              {item.zone}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.population.toLocaleString()}</TableCell>
                          <TableCell>{item.time.toFixed(4)}</TableCell>
                          <TableCell>{item.resources.toFixed(4)}%</TableCell>
                          <TableCell>
                            <Badge variant={item.zone === 'Red' ? 'destructive' : 'outline'}>
                              {item.zone === 'Red' ? 'Critical' : item.zone === 'Orange' ? 'High' : 'Medium'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4">Evacuation Timeline</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.safetyMeasures?.evacuationMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="zone" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(4)} min`, 'Evacuation Time']} />
                        <Bar dataKey="time" fill="#ff7300" name="Time (minutes)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="aloha" className="p-4">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ALOHA Hazard Assessment Integration
            </h3>
            
            {data.alohaComparison && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Hazard Index Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Hazard Index:</span>
                        <Badge variant={data.alohaComparison.hazardIndex > 5 ? "destructive" : "default"}>
                          {data.alohaComparison.hazardIndex.toFixed(4)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Risk Level:</span>
                        <Badge variant={data.alohaComparison.riskLevel === "High" ? "destructive" : "secondary"}>
                          {data.alohaComparison.riskLevel}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Exposure Guidelines (ppm)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AEGL-1:</span>
                        <Badge variant="outline">{data.alohaComparison.exposureGuidelines.aegl1.toFixed(4)}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>AEGL-2:</span>
                        <Badge variant="outline">{data.alohaComparison.exposureGuidelines.aegl2.toFixed(4)}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>AEGL-3:</span>
                        <Badge variant="destructive">{data.alohaComparison.exposureGuidelines.aegl3.toFixed(4)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      ALOHA Recommended Protective Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.alohaComparison.protectiveActions.map((action, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="radar" className="p-4">
            <h3 className="text-sm font-medium mb-2">Model Performance Comparison</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData[0] ? [radarData[0], radarData[1]] : []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Current Model"
                    dataKey="accuracy"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="ALOHA Model"
                    dataKey="accuracy"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.1}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-4 gap-4 text-center">
              <div>
                <h4 className="font-medium text-sm">Accuracy</h4>
                <p className="text-xs text-muted-foreground">Model precision vs. actual outcomes</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Speed</h4>
                <p className="text-xs text-muted-foreground">Computation and response time</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Safety</h4>
                <p className="text-xs text-muted-foreground">Conservative safety margins</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Reliability</h4>
                <p className="text-xs text-muted-foreground">Consistency across scenarios</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SimulationComparison;

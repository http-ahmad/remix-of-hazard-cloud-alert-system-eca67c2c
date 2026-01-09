import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { TrendingUp, BarChart3, Activity, Zap, Wind, AlertTriangle, Target, Database, GitCompare, Settings } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface SimulationScenario {
  id: string;
  name: string;
  windSpeed: number;
  windDirection: number;
  releaseRate: number;
  temperature: number;
  stabilityClass: string;
  chemicalType: string;
  results: {
    maxConcentration: number;
    affectedArea: number;
    evacuationRadius: number;
    timeToStabilize: number;
    riskScore: number;
  };
}

interface EnhancedSimulationComparisonProps {
  scenarios: SimulationScenario[];
  onScenariosChange: (scenarios: SimulationScenario[]) => void;
}

const EnhancedSimulationComparison: React.FC<EnhancedSimulationComparisonProps> = ({
  scenarios,
  onScenariosChange
}) => {
  const [newScenario, setNewScenario] = useState({
    name: '',
    windSpeed: '10',
    windDirection: '270',
    releaseRate: '50',
    temperature: '25',
    stabilityClass: 'D',
    chemicalType: 'Ammonia'
  });

  const [comparisonSettings, setComparisonSettings] = useState({
    chartType: 'line',
    showConfidenceIntervals: true,
    normalizeValues: false,
    includeUncertainty: true,
    timeHorizon: 24,
    spatialResolution: 100,
    includeMeteorology: true,
    performanceMetrics: true
  });

  const [activeMetrics, setActiveMetrics] = useState({
    concentration: true,
    area: true,
    evacuation: true,
    time: true,
    risk: true
  });

  const availableChemicals = [
    'Ammonia', 'Chlorine', 'Hydrogen Sulfide', 'Sulfur Dioxide',
    'Methane', 'Benzene', 'Toluene', 'Acetone', 'Ethylene Oxide'
  ];

  const addScenario = () => {
    if (!newScenario.name.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a scenario name",
        variant: "destructive"
      });
      return;
    }

    const windSpeed = parseFloat(newScenario.windSpeed);
    const windDirection = parseFloat(newScenario.windDirection);
    const releaseRate = parseFloat(newScenario.releaseRate);
    const temperature = parseFloat(newScenario.temperature);

    if ([windSpeed, windDirection, releaseRate, temperature].some(isNaN)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numeric values",
        variant: "destructive"
      });
      return;
    }

    // Simulate calculation results
    const stabilityFactor = { 'A': 1.5, 'B': 1.3, 'C': 1.1, 'D': 1.0, 'E': 0.9, 'F': 0.8 }[newScenario.stabilityClass] || 1.0;
    const tempFactor = 1 + (temperature - 20) * 0.02;
    const windFactor = Math.max(0.5, Math.min(2.0, windSpeed / 10));

    const scenario: SimulationScenario = {
      id: `scenario-${Date.now()}`,
      name: newScenario.name,
      windSpeed: Math.round(windSpeed * 10000) / 10000,
      windDirection: Math.round(windDirection * 10000) / 10000,
      releaseRate: Math.round(releaseRate * 10000) / 10000,
      temperature: Math.round(temperature * 10000) / 10000,
      stabilityClass: newScenario.stabilityClass,
      chemicalType: newScenario.chemicalType,
      results: {
        maxConcentration: Math.round(releaseRate * stabilityFactor * tempFactor * 100) / 100,
        affectedArea: Math.round(releaseRate * windFactor * stabilityFactor * 0.5 * 100) / 100,
        evacuationRadius: Math.round(Math.sqrt(releaseRate * stabilityFactor) * 0.8 * 100) / 100,
        timeToStabilize: Math.round((24 - windSpeed * 0.5) * stabilityFactor * 100) / 100,
        riskScore: Math.round((releaseRate * stabilityFactor * tempFactor / windFactor) * 0.1 * 100) / 100
      }
    };

    onScenariosChange([...scenarios, scenario]);
    setNewScenario({
      name: '',
      windSpeed: '10',
      windDirection: '270',
      releaseRate: '50',
      temperature: '25',
      stabilityClass: 'D',
      chemicalType: 'Ammonia'
    });

    toast({
      title: "Scenario Added",
      description: `${newScenario.name} has been added to comparison`,
    });
  };

  const removeScenario = (id: string) => {
    onScenariosChange(scenarios.filter(s => s.id !== id));
    toast({
      title: "Scenario Removed",
      description: "Scenario has been removed from comparison",
    });
  };

  // Prepare data for different chart types
  const chartData = useMemo(() => {
    return scenarios.filter(scenario => scenario && scenario.results).map((scenario, index) => ({
      name: scenario.name,
      index: index + 1,
      'Max Concentration': activeMetrics.concentration ? scenario.results.maxConcentration : null,
      'Affected Area': activeMetrics.area ? scenario.results.affectedArea : null,
      'Evacuation Radius': activeMetrics.evacuation ? scenario.results.evacuationRadius : null,
      'Time to Stabilize': activeMetrics.time ? scenario.results.timeToStabilize : null,
      'Risk Score': activeMetrics.risk ? scenario.results.riskScore : null,
      windSpeed: scenario.windSpeed,
      releaseRate: scenario.releaseRate,
      temperature: scenario.temperature
    }));
  }, [scenarios, activeMetrics]);

  const radarData = useMemo(() => {
    const validScenarios = scenarios.filter(scenario => scenario && scenario.results);
    if (validScenarios.length === 0) return [];
    
    const maxValues = {
      concentration: Math.max(...validScenarios.map(s => s.results.maxConcentration)),
      area: Math.max(...validScenarios.map(s => s.results.affectedArea)),
      evacuation: Math.max(...validScenarios.map(s => s.results.evacuationRadius)),
      time: Math.max(...validScenarios.map(s => s.results.timeToStabilize)),
      risk: Math.max(...validScenarios.map(s => s.results.riskScore))
    };

    return validScenarios.map(scenario => ({
      scenario: scenario.name,
      'Max Concentration': Math.round((scenario.results.maxConcentration / maxValues.concentration) * 100 * 100) / 100,
      'Affected Area': Math.round((scenario.results.affectedArea / maxValues.area) * 100 * 100) / 100,
      'Evacuation Radius': Math.round((scenario.results.evacuationRadius / maxValues.evacuation) * 100 * 100) / 100,
      'Time to Stabilize': Math.round((scenario.results.timeToStabilize / maxValues.time) * 100 * 100) / 100,
      'Risk Score': Math.round((scenario.results.riskScore / maxValues.risk) * 100 * 100) / 100
    }));
  }, [scenarios]);

  const statisticalData = useMemo(() => {
    const validScenarios = scenarios.filter(scenario => scenario && scenario.results);
    if (validScenarios.length === 0) return null;

    const calculate = (values: number[]) => ({
      min: Math.round(Math.min(...values) * 100) / 100,
      max: Math.round(Math.max(...values) * 100) / 100,
      mean: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
      std: Math.round(Math.sqrt(values.reduce((acc, val, _, arr) => acc + Math.pow(val - arr.reduce((a, b) => a + b, 0) / arr.length, 2), 0) / values.length) * 100) / 100
    });

    return {
      concentration: calculate(validScenarios.map(s => s.results.maxConcentration)),
      area: calculate(validScenarios.map(s => s.results.affectedArea)),
      evacuation: calculate(validScenarios.map(s => s.results.evacuationRadius)),
      time: calculate(validScenarios.map(s => s.results.timeToStabilize)),
      risk: calculate(validScenarios.map(s => s.results.riskScore))
    };
  }, [scenarios]);

  const renderChart = () => {
    if (chartData.length === 0) return <div className="text-center py-8 text-muted-foreground">No scenarios to compare</div>;

    const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--warning))'];

    switch (comparisonSettings.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {activeMetrics.concentration && <Line type="monotone" dataKey="Max Concentration" stroke={colors[0]} strokeWidth={2} />}
              {activeMetrics.area && <Line type="monotone" dataKey="Affected Area" stroke={colors[1]} strokeWidth={2} />}
              {activeMetrics.evacuation && <Line type="monotone" dataKey="Evacuation Radius" stroke={colors[2]} strokeWidth={2} />}
              {activeMetrics.time && <Line type="monotone" dataKey="Time to Stabilize" stroke={colors[3]} strokeWidth={2} />}
              {activeMetrics.risk && <Line type="monotone" dataKey="Risk Score" stroke={colors[4]} strokeWidth={2} />}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {activeMetrics.concentration && <Bar dataKey="Max Concentration" fill={colors[0]} />}
              {activeMetrics.area && <Bar dataKey="Affected Area" fill={colors[1]} />}
              {activeMetrics.evacuation && <Bar dataKey="Evacuation Radius" fill={colors[2]} />}
              {activeMetrics.time && <Bar dataKey="Time to Stabilize" fill={colors[3]} />}
              {activeMetrics.risk && <Bar dataKey="Risk Score" fill={colors[4]} />}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {activeMetrics.concentration && <Area type="monotone" dataKey="Max Concentration" stackId="1" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />}
              {activeMetrics.area && <Area type="monotone" dataKey="Affected Area" stackId="1" stroke={colors[1]} fill={colors[1]} fillOpacity={0.6} />}
              {activeMetrics.evacuation && <Area type="monotone" dataKey="Evacuation Radius" stackId="1" stroke={colors[2]} fill={colors[2]} fillOpacity={0.6} />}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="windSpeed" name="Wind Speed" stroke="hsl(var(--foreground))" />
              <YAxis dataKey="Max Concentration" name="Max Concentration" stroke="hsl(var(--foreground))" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Scatter name="Scenarios" data={chartData} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData[0] ? [radarData[0]] : []}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis tick={{ fill: 'hsl(var(--foreground))' }} />
              <PolarRadiusAxis tick={{ fill: 'hsl(var(--foreground))' }} />
              <Radar name="Values" dataKey="Max Concentration" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
              <Radar name="Values" dataKey="Affected Area" stroke={colors[1]} fill={colors[1]} fillOpacity={0.3} />
              <Radar name="Values" dataKey="Evacuation Radius" stroke={colors[2]} fill={colors[2]} fillOpacity={0.3} />
              <Radar name="Values" dataKey="Time to Stabilize" stroke={colors[3]} fill={colors[3]} fillOpacity={0.3} />
              <Radar name="Values" dataKey="Risk Score" stroke={colors[4]} fill={colors[4]} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <div className="space-y-6 overflow-x-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Enhanced Simulation Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[800px] overflow-x-auto">
            <div className="space-y-6 pr-4 min-w-[1200px]">
              
              {/* Comparison Settings */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Visualization Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Chart Type</Label>
                      <Select 
                        value={comparisonSettings.chartType} 
                        onValueChange={(value) => setComparisonSettings({...comparisonSettings, chartType: value})}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="scatter">Scatter Plot</SelectItem>
                          <SelectItem value="radar">Radar Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Time Horizon (hours)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[comparisonSettings.timeHorizon]}
                          onValueChange={([value]) => setComparisonSettings({...comparisonSettings, timeHorizon: value})}
                          max={72}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs w-8">{comparisonSettings.timeHorizon}h</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Confidence Intervals</Label>
                        <Switch 
                          checked={comparisonSettings.showConfidenceIntervals}
                          onCheckedChange={(checked) => 
                            setComparisonSettings({...comparisonSettings, showConfidenceIntervals: checked})
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Normalize Values</Label>
                        <Switch 
                          checked={comparisonSettings.normalizeValues}
                          onCheckedChange={(checked) => 
                            setComparisonSettings({...comparisonSettings, normalizeValues: checked})
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(activeMetrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <Switch 
                          checked={value}
                          onCheckedChange={(checked) => 
                            setActiveMetrics({...activeMetrics, [key]: checked})
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Add New Scenario */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Add New Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="scenario-name" className="text-xs">Scenario Name</Label>
                      <Input
                        id="scenario-name"
                        value={newScenario.name}
                        onChange={(e) => setNewScenario({...newScenario, name: e.target.value})}
                        placeholder="e.g., High Wind Conditions"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wind-speed" className="text-xs">Wind Speed (m/s)</Label>
                      <Input
                        id="wind-speed"
                        type="number"
                        step="0.1"
                        value={newScenario.windSpeed}
                        onChange={(e) => setNewScenario({...newScenario, windSpeed: e.target.value})}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wind-direction" className="text-xs">Wind Direction (°)</Label>
                      <Input
                        id="wind-direction"
                        type="number"
                        step="1"
                        value={newScenario.windDirection}
                        onChange={(e) => setNewScenario({...newScenario, windDirection: e.target.value})}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="release-rate" className="text-xs">Release Rate (kg/min)</Label>
                      <Input
                        id="release-rate"
                        type="number"
                        step="0.1"
                        value={newScenario.releaseRate}
                        onChange={(e) => setNewScenario({...newScenario, releaseRate: e.target.value})}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature" className="text-xs">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={newScenario.temperature}
                        onChange={(e) => setNewScenario({...newScenario, temperature: e.target.value})}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stability-class" className="text-xs">Stability Class</Label>
                      <Select 
                        value={newScenario.stabilityClass} 
                        onValueChange={(value) => setNewScenario({...newScenario, stabilityClass: value})}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                  </div>

                  <div className="flex gap-4 items-end">
                    <div>
                      <Label htmlFor="chemical-type" className="text-xs">Chemical Type</Label>
                      <Select 
                        value={newScenario.chemicalType} 
                        onValueChange={(value) => setNewScenario({...newScenario, chemicalType: value})}
                      >
                        <SelectTrigger className="h-8 text-xs w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableChemicals.map(chemical => (
                            <SelectItem key={chemical} value={chemical}>{chemical}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addScenario} size="sm">
                      Add Scenario
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Visualization */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Scenario Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="chart" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="chart">Visual Comparison</TabsTrigger>
                      <TabsTrigger value="statistics">Statistical Analysis</TabsTrigger>
                      <TabsTrigger value="scenarios">Scenario Details</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="chart" className="space-y-4">
                      <div className="overflow-x-auto">
                        {renderChart()}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="statistics" className="space-y-4">
                      {statisticalData && (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(statisticalData).map(([metric, stats]) => (
                            <Card key={metric}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm capitalize">{metric.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div><strong>Min:</strong> {stats.min}</div>
                                  <div><strong>Max:</strong> {stats.max}</div>
                                  <div><strong>Mean:</strong> {stats.mean}</div>
                                  <div><strong>Std Dev:</strong> {stats.std}</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="scenarios" className="space-y-4">
                      <ScrollArea className="h-96 overflow-x-auto">
                        <div className="space-y-2 pr-4 min-w-[800px]">
                          {scenarios.map((scenario) => (
                            <Card key={scenario.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{scenario.name}</h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeScenario(scenario.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <strong>Conditions:</strong><br />
                                    Wind: {scenario.windSpeed} m/s @ {scenario.windDirection}°<br />
                                    Temp: {scenario.temperature}°C<br />
                                    Stability: {scenario.stabilityClass}
                                  </div>
                                  <div>
                                    <strong>Release:</strong><br />
                                    Rate: {scenario.releaseRate} kg/min<br />
                                    Chemical: {scenario.chemicalType}
                                  </div>
                                  <div>
                                    <strong>Impact:</strong><br />
                                    Max Conc: {scenario.results.maxConcentration}<br />
                                    Area: {scenario.results.affectedArea} km²<br />
                                    Evacuation: {scenario.results.evacuationRadius} km
                                  </div>
                                  <div>
                                    <strong>Timing:</strong><br />
                                    Stabilize: {scenario.results.timeToStabilize} hrs<br />
                                    Risk Score: {scenario.results.riskScore}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSimulationComparison;

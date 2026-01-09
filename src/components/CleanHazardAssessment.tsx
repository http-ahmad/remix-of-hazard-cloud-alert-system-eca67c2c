
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Droplets, Wind, Thermometer, Eye } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface HazardAssessmentProps {
  chemicalType: string;
  releaseRate: number;
  windSpeed: number;
  temperature: number;
  zones: {
    red: { distance: number; concentration: number; area: number; populationAtRisk: number };
    orange: { distance: number; concentration: number; area: number; populationAtRisk: number };
    yellow: { distance: number; concentration: number; area: number; populationAtRisk: number };
  };
  concentrationProfile: Array<{ distance: number; concentration: number }>;
  massReleased: number;
  detectionProbability: number;
  timeToDetection: number;
}

const CleanHazardAssessment = ({
  chemicalType,
  releaseRate,
  windSpeed,
  temperature,
  zones,
  concentrationProfile,
  massReleased,
  detectionProbability,
  timeToDetection
}: HazardAssessmentProps) => {
  // Chemical properties data (simplified for demo)
  const chemicalProperties = {
    molecularWeight: getChemicalMW(chemicalType),
    boilingPoint: getChemicalBP(chemicalType),
    vaporPressure: getChemicalVP(chemicalType),
    solubility: getChemicalSolubility(chemicalType)
  };

  // Exposure guidelines
  const exposureGuidelines = {
    aegl1: getAEGL1(chemicalType),
    aegl2: getAEGL2(chemicalType),
    aegl3: getAEGL3(chemicalType),
    idlh: getIDLH(chemicalType)
  };

  // Zone summary data for pie chart
  const zoneSummary = [
    { name: 'Red Zone', value: zones.red.area, population: zones.red.populationAtRisk, color: '#ef4444' },
    { name: 'Orange Zone', value: zones.orange.area, population: zones.orange.populationAtRisk, color: '#f97316' },
    { name: 'Yellow Zone', value: zones.yellow.area, population: zones.yellow.populationAtRisk, color: '#eab308' }
  ];

  // Environmental conditions data
  const environmentalData = [
    { name: 'Wind Speed', value: windSpeed, unit: 'm/s', icon: Wind },
    { name: 'Temperature', value: temperature, unit: '°C', icon: Thermometer },
    { name: 'Release Rate', value: releaseRate, unit: 'kg/min', icon: Droplets }
  ];

  return (
    <div className="space-y-4">
      {/* ALOHA Hazard Assessment Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            ALOHA Hazard Assessment - {chemicalType}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[500px]">
              {environmentalData.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <item.icon className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-lg font-bold">
                      {item.value.toFixed(4)} {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chemical Properties */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Chemical Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40 overflow-x-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[600px]">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Molecular Weight</div>
                <div className="text-lg font-semibold">{chemicalProperties.molecularWeight.toFixed(4)} g/mol</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Boiling Point</div>
                <div className="text-lg font-semibold">{chemicalProperties.boilingPoint.toFixed(4)}°C</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm text-gray-600">Vapor Pressure</div>
                <div className="text-lg font-semibold">{chemicalProperties.vaporPressure.toFixed(4)} kPa</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Water Solubility</div>
                <div className="text-lg font-semibold">{chemicalProperties.solubility}</div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Exposure Guidelines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exposure Guidelines & Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 overflow-x-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-[600px]">
              <div className="p-3 border rounded-lg">
                <Badge variant="secondary" className="mb-2">AEGL-1</Badge>
                <div className="text-sm">Mild effects</div>
                <div className="font-semibold">{exposureGuidelines.aegl1.toFixed(4)} ppm</div>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge variant="secondary" className="mb-2">AEGL-2</Badge>
                <div className="text-sm">Serious effects</div>
                <div className="font-semibold">{exposureGuidelines.aegl2.toFixed(4)} ppm</div>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge variant="destructive" className="mb-2">AEGL-3</Badge>
                <div className="text-sm">Life threatening</div>
                <div className="font-semibold">{exposureGuidelines.aegl3.toFixed(4)} ppm</div>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge variant="destructive" className="mb-2">IDLH</Badge>
                <div className="text-sm">Immediate danger</div>
                <div className="font-semibold">{exposureGuidelines.idlh.toFixed(4)} ppm</div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Concentration Profile Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Concentration vs Distance Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 overflow-x-auto">
            <ResponsiveContainer width="100%" height={300} minWidth={600}>
              <LineChart data={concentrationProfile} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="distance" 
                  label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5 }}
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
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Chemical Concentration"
                />
                {/* Add reference lines for exposure limits */}
                <Line 
                  type="monotone" 
                  dataKey={() => exposureGuidelines.aegl3 * 24.45 / chemicalProperties.molecularWeight} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  name="AEGL-3 Limit"
                />
              </LineChart>
            </ResponsiveContainer>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Zone Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hazard Zone Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 overflow-x-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-[700px]">
              {/* Zone areas pie chart */}
              <div className="h-64">
                <h4 className="font-semibold mb-2 text-sm">Affected Areas</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneSummary}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(4)} km²`}
                    >
                      {zoneSummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(4)} km²`, 'Area']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Zone details table */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Zone Details</h4>
                {Object.entries(zones).map(([zoneType, data]) => (
                  <div key={zoneType} className={`p-3 rounded-lg border-l-4 ${
                    zoneType === 'red' ? 'border-red-500 bg-red-50' :
                    zoneType === 'orange' ? 'border-orange-500 bg-orange-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold capitalize">{zoneType} Zone</span>
                      <Badge 
                        variant={zoneType === 'red' ? 'destructive' : 'secondary'}
                        className="ml-2"
                      >
                        {data.populationAtRisk} at risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Distance: {data.distance.toFixed(4)} km</div>
                      <div>Area: {data.area.toFixed(4)} km²</div>
                      <div>Concentration: {data.concentration.toFixed(4)} mg/m³</div>
                      <div>Population: {data.populationAtRisk}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detection Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" />
            Leak Detection Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[500px]">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(detectionProbability * 100).toFixed(4)}%
                </div>
                <div className="text-sm text-gray-600">Detection Probability</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {timeToDetection.toFixed(4)} min
                </div>
                <div className="text-sm text-gray-600">Time to Detection</div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {massReleased.toFixed(4)} kg
                </div>
                <div className="text-sm text-gray-600">Total Mass Released</div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions to get chemical properties (simplified for demo)
function getChemicalMW(chemical: string): number {
  const mw: { [key: string]: number } = {
    'chlorine': 70.9,
    'ammonia': 17.03,
    'hydrogen sulfide': 34.08,
    'sulfur dioxide': 64.07,
    'hydrogen chloride': 36.46
  };
  return mw[chemical.toLowerCase()] || 50.0;
}

function getChemicalBP(chemical: string): number {
  const bp: { [key: string]: number } = {
    'chlorine': -34.0,
    'ammonia': -33.3,
    'hydrogen sulfide': -60.3,
    'sulfur dioxide': -10.0,
    'hydrogen chloride': -85.1
  };
  return bp[chemical.toLowerCase()] || -20.0;
}

function getChemicalVP(chemical: string): number {
  const vp: { [key: string]: number } = {
    'chlorine': 687.0,
    'ammonia': 857.0,
    'hydrogen sulfide': 1860.0,
    'sulfur dioxide': 330.0,
    'hydrogen chloride': 4200.0
  };
  return vp[chemical.toLowerCase()] || 500.0;
}

function getChemicalSolubility(chemical: string): string {
  const sol: { [key: string]: string } = {
    'chlorine': 'Moderate',
    'ammonia': 'High',
    'hydrogen sulfide': 'Moderate',
    'sulfur dioxide': 'High',
    'hydrogen chloride': 'High'
  };
  return sol[chemical.toLowerCase()] || 'Moderate';
}

function getAEGL1(chemical: string): number {
  const aegl1: { [key: string]: number } = {
    'chlorine': 0.5,
    'ammonia': 30.0,
    'hydrogen sulfide': 0.75,
    'sulfur dioxide': 0.75,
    'hydrogen chloride': 1.8
  };
  return aegl1[chemical.toLowerCase()] || 1.0;
}

function getAEGL2(chemical: string): number {
  const aegl2: { [key: string]: number } = {
    'chlorine': 2.0,
    'ammonia': 220.0,
    'hydrogen sulfide': 27.0,
    'sulfur dioxide': 2.6,
    'hydrogen chloride': 22.0
  };
  return aegl2[chemical.toLowerCase()] || 3.0;
}

function getAEGL3(chemical: string): number {
  const aegl3: { [key: string]: number } = {
    'chlorine': 20.0,
    'ammonia': 1100.0,
    'hydrogen sulfide': 76.0,
    'sulfur dioxide': 30.0,
    'hydrogen chloride': 620.0
  };
  return aegl3[chemical.toLowerCase()] || 5.0;
}

function getIDLH(chemical: string): number {
  const idlh: { [key: string]: number } = {
    'chlorine': 10.0,
    'ammonia': 300.0,
    'hydrogen sulfide': 100.0,
    'sulfur dioxide': 100.0,
    'hydrogen chloride': 50.0
  };
  return idlh[chemical.toLowerCase()] || 25.0;
}

export default CleanHazardAssessment;

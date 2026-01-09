
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, Users, Clock, Wrench } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface SafetyProtocolsProps {
  safetyScore: number;
  recommendedResponse: string;
  zones: {
    red: { distance: number; concentration: number };
    orange: { distance: number; concentration: number };
    yellow: { distance: number; concentration: number };
  };
  chemicalType: string;
}

const EnhancedSafetyProtocols = ({ 
  safetyScore, 
  recommendedResponse, 
  zones, 
  chemicalType 
}: SafetyProtocolsProps) => {
  // PPE Requirements data
  const ppeRequirements = [
    { name: 'Level A Suit', effectiveness: 100, required: safetyScore < 40 },
    { name: 'SCBA', effectiveness: 95, required: safetyScore < 60 },
    { name: 'Level B Suit', effectiveness: 85, required: safetyScore < 70 },
    { name: 'Full-face Respirator', effectiveness: 70, required: safetyScore < 80 },
    { name: 'Half-face Respirator', effectiveness: 40, required: safetyScore < 90 }
  ];

  // Response effectiveness data
  const responseEffectiveness = [
    { name: 'Effectiveness', 'Shelter in Place': 75, 'Evacuation': 90, 'Mixed Response': 85 },
    { name: 'Time Required', 'Shelter in Place': 20, 'Evacuation': 85, 'Mixed Response': 60 },
    { name: 'Resource Needs', 'Shelter in Place': 30, 'Evacuation': 95, 'Mixed Response': 70 },
    { name: 'Complication Risk', 'Shelter in Place': 25, 'Evacuation': 70, 'Mixed Response': 45 },
    { name: 'Long-term Safety', 'Shelter in Place': 60, 'Evacuation': 95, 'Mixed Response': 80 }
  ];

  // Radar chart data for response comparison
  const radarData = [
    { subject: 'Effectiveness', 'Shelter in Place': 75, 'Evacuation': 90, 'Mixed Response': 85 },
    { subject: 'Speed', 'Shelter in Place': 95, 'Evacuation': 30, 'Mixed Response': 65 },
    { subject: 'Resource Efficiency', 'Shelter in Place': 85, 'Evacuation': 20, 'Mixed Response': 55 },
    { subject: 'Safety', 'Shelter in Place': 60, 'Evacuation': 95, 'Mixed Response': 80 },
    { subject: 'Feasibility', 'Shelter in Place': 90, 'Evacuation': 40, 'Mixed Response': 70 }
  ];

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSafetyScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, text: 'Good' };
    if (score >= 60) return { variant: 'secondary' as const, text: 'Moderate' };
    return { variant: 'destructive' as const, text: 'Critical' };
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      {/* Safety Score Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enhanced Safety Protocols
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 overflow-x-auto">
            <div className="space-y-4 min-w-[400px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Safety Score:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getSafetyScoreColor(safetyScore)}`}>
                    {Math.round(safetyScore)}%
                  </span>
                  <Badge {...getSafetyScoreBadge(safetyScore)}>
                    {getSafetyScoreBadge(safetyScore).text}
                  </Badge>
                </div>
              </div>
              <Progress value={safetyScore} className="h-3" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[600px] overflow-x-auto">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-sm">Recommended Response</span>
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap">{recommendedResponse}</Badge>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Chemical Type</span>
                  </div>
                  <span className="text-sm font-mono">{chemicalType}</span>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Response Time</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {safetyScore > 70 ? '< 15 min' : safetyScore > 40 ? '15-30 min' : '> 30 min'}
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Response Effectiveness Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Response Strategy Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 overflow-x-auto">
            <ResponsiveContainer width="100%" height={300} minWidth={500}>
              <BarChart data={responseEffectiveness} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`, '']} />
                <Bar dataKey="Shelter in Place" fill="#8884d8" />
                <Bar dataKey="Evacuation" fill="#82ca9d" />
                <Bar dataKey="Mixed Response" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Mixed Response Protocol */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mixed Response Protocol</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 overflow-x-auto">
            <div className="space-y-3 min-w-[400px]">
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-sm">Red zone ({Math.round(zones.red.distance)} km)</span>
                </div>
                <p className="text-sm text-gray-700">Immediate evacuation</p>
              </div>
              
              <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-semibold text-sm">Orange zone ({Math.round(zones.orange.distance)} km)</span>
                </div>
                <p className="text-sm text-gray-700">Prepare to evacuate, shelter initially</p>
              </div>
              
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold text-sm">Yellow zone ({Math.round(zones.yellow.distance)} km)</span>
                </div>
                <p className="text-sm text-gray-700">Shelter in place</p>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-semibold text-sm mb-2">Key Actions:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Prioritize evacuation of vulnerable populations</li>
                  <li>• Follow emergency service instructions</li>
                  <li>• Monitor wind direction changes</li>
                  <li>• Maintain communication channels</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* PPE Requirements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" />
            Required PPE & Safety Equipment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 overflow-x-auto">
            <div className="space-y-3 min-w-[400px]">
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">First Responder PPE Requirements</h4>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm">
                    <strong>Level B protection required:</strong> Chemical resistant suit with SCBA
                  </p>
                </div>
              </div>
              
              {ppeRequirements.map((ppe, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ppe.name}</span>
                      {ppe.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    </div>
                    <div className="mt-1">
                      <Progress value={ppe.effectiveness} className="h-2" />
                    </div>
                  </div>
                  <span className="text-sm font-semibold ml-4 whitespace-nowrap">
                    {Math.round(ppe.effectiveness)}%
                  </span>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-sm mb-2">Emergency Equipment</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• Gas monitors</div>
                  <div>• Decontamination kits</div>
                  <div>• First aid supplies</div>
                  <div>• Communication devices</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Safety System Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Safety System Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[400px]">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Decontamination</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Emergency shower stations</li>
                  <li>• Chemical neutralization</li>
                  <li>• Waste water containment</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Communication</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Emergency alert system</li>
                  <li>• Public address system</li>
                  <li>• Emergency services coordination</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSafetyProtocols;

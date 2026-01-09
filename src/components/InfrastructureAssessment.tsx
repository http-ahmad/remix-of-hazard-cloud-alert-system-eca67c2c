
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hospital, School, Building, Users } from 'lucide-react';

interface Infrastructure {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'industrial';
  distance: number;
  impactLevel: 'high' | 'medium' | 'low' | 'safe';
  population: number;
  coordinates: { lat: number; lng: number };
}

interface PopulationData {
  totalAffected: number;
  byZone: {
    red: number;
    orange: number;
    yellow: number;
  };
  demographicBreakdown: {
    children: number;
    adults: number;
    elderly: number;
  };
}

interface InfrastructureAssessmentProps {
  infrastructure: Infrastructure[];
  populationData: PopulationData;
}

// Default mock data - in a real app this would come from API calls
const defaultInfrastructure: Infrastructure[] = [
  {
    id: '1',
    name: 'Lincoln High School',
    type: 'school',
    distance: 2.3,
    impactLevel: 'medium',
    population: 1200,
    coordinates: { lat: 40.723, lng: -74.012 }
  },
  {
    id: '2',
    name: 'Central Hospital',
    type: 'hospital',
    distance: 1.8,
    impactLevel: 'high',
    population: 450,
    coordinates: { lat: 40.715, lng: -74.009 }
  },
  {
    id: '3',
    name: 'Westside Manufacturing',
    type: 'industrial',
    distance: 3.2,
    impactLevel: 'low',
    population: 280,
    coordinates: { lat: 40.709, lng: -74.021 }
  }
];

const defaultPopulation: PopulationData = {
  totalAffected: 5850,
  byZone: {
    red: 450,
    orange: 1870,
    yellow: 3530
  },
  demographicBreakdown: {
    children: 1170,
    adults: 3510,
    elderly: 1170
  }
};

const InfrastructureAssessment = ({ 
  infrastructure = defaultInfrastructure, 
  populationData = defaultPopulation 
}: Partial<InfrastructureAssessmentProps>) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Population & Infrastructure Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="p-4 space-y-6">
            {/* Population summary */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Population Impact</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{populationData.totalAffected.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Total Affected</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">{populationData.byZone.red.toLocaleString()}</div>
                  <div className="text-xs text-red-600">Red Zone</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-700">{populationData.byZone.orange.toLocaleString()}</div>
                  <div className="text-xs text-orange-600">Orange Zone</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{populationData.byZone.yellow.toLocaleString()}</div>
                  <div className="text-xs text-yellow-600">Yellow Zone</div>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Demographic Breakdown</h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${populationData.demographicBreakdown.children / populationData.totalAffected * 100}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-600 min-w-[100px]">
                    Children: {populationData.demographicBreakdown.children.toLocaleString()} ({(populationData.demographicBreakdown.children / populationData.totalAffected * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${populationData.demographicBreakdown.adults / populationData.totalAffected * 100}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-600 min-w-[100px]">
                    Adults: {populationData.demographicBreakdown.adults.toLocaleString()} ({(populationData.demographicBreakdown.adults / populationData.totalAffected * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${populationData.demographicBreakdown.elderly / populationData.totalAffected * 100}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-600 min-w-[100px]">
                    Elderly: {populationData.demographicBreakdown.elderly.toLocaleString()} ({(populationData.demographicBreakdown.elderly / populationData.totalAffected * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Critical infrastructure */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Critical Infrastructure</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Population</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {infrastructure.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.type === 'school' && <School className="h-4 w-4" />}
                          {item.type === 'hospital' && <Hospital className="h-4 w-4" />}
                          {item.type === 'industrial' && <Building className="h-4 w-4" />}
                          <span className="capitalize">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.distance.toFixed(1)} km</TableCell>
                      <TableCell>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                          item.impactLevel === 'high' ? 'bg-red-100 text-red-800' :
                          item.impactLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                          item.impactLevel === 'low' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.impactLevel.charAt(0).toUpperCase() + item.impactLevel.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>{item.population.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default InfrastructureAssessment;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock,
  Wind,
  Thermometer,
  Eye,
  Activity,
  Heart,
  Brain
} from "lucide-react";
import { calculateHealthImpact } from '../utils/dispersionModel';
import { chemicalDatabase, getExposureGuidelines, getThresholdDescriptions } from '../utils/chemicalDatabase';

interface ImprovedHazardAssessmentProps {
  results: any;
  modelParams: any;
}

const ImprovedHazardAssessment = ({ results, modelParams }: ImprovedHazardAssessmentProps) => {
  const chemicalData = chemicalDatabase[modelParams.chemicalType.toLowerCase()];
  const guidelines = getExposureGuidelines(modelParams.chemicalType);
  const descriptions = getThresholdDescriptions();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'fatal': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Shield className="h-4 w-4" />;
      case 'medium': return <Eye className="h-4 w-4" />;
      case 'low': return <Users className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const healthImpacts = [
    { zone: 'Red', concentration: results.redZone.concentration, exposureTime: 60 },
    { zone: 'Orange', concentration: results.orangeZone.concentration, exposureTime: 60 },
    { zone: 'Yellow', concentration: results.yellowZone.concentration, exposureTime: 60 }
  ].map(zone => ({
    ...zone,
    impact: calculateHealthImpact(zone.concentration, zone.exposureTime, modelParams.chemicalType)
  }));

  const getRiskLevel = (concentration: number): { level: string; percentage: number; color: string } => {
    if (!guidelines) return { level: 'Unknown', percentage: 0, color: 'gray' };
    
    if (guidelines.aegl3 && concentration > guidelines.aegl3) {
      return { level: 'Critical', percentage: 100, color: 'red' };
    } else if (guidelines.aegl2 && concentration > guidelines.aegl2) {
      return { level: 'High', percentage: 75, color: 'orange' };
    } else if (guidelines.aegl1 && concentration > guidelines.aegl1) {
      return { level: 'Moderate', percentage: 50, color: 'yellow' };
    } else {
      return { level: 'Low', percentage: 25, color: 'green' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Chemical Properties Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            ALOHA Hazard Assessment - {modelParams.chemicalType}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {chemicalData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Physical Properties
                </h4>
                <div className="text-sm space-y-1 ml-6">
                  <div className="flex justify-between">
                    <span>Molecular Weight:</span>
                    <span>{chemicalData.molecularWeight.toFixed(4)} g/mol</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Boiling Point:</span>
                    <span>{chemicalData.boilingPoint.toFixed(4)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vapor Pressure:</span>
                    <span>{chemicalData.vaporPressure.toFixed(4)} mmHg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Specific Gravity:</span>
                    <span>{chemicalData.specificGravity.toFixed(4)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Exposure Guidelines (ppm)
                </h4>
                <div className="text-sm space-y-1 ml-6">
                  {guidelines?.aegl1 && (
                    <div className="flex justify-between">
                      <span>AEGL-1:</span>
                      <Badge variant="outline" className="text-xs">{guidelines.aegl1.toFixed(4)}</Badge>
                    </div>
                  )}
                  {guidelines?.aegl2 && (
                    <div className="flex justify-between">
                      <span>AEGL-2:</span>
                      <Badge variant="outline" className="text-xs">{guidelines.aegl2.toFixed(4)}</Badge>
                    </div>
                  )}
                  {guidelines?.aegl3 && (
                    <div className="flex justify-between">
                      <span>AEGL-3:</span>
                      <Badge variant="destructive" className="text-xs">{guidelines.aegl3.toFixed(4)}</Badge>
                    </div>
                  )}
                  {guidelines?.idlh && (
                    <div className="flex justify-between">
                      <span>IDLH:</span>
                      <Badge variant="destructive" className="text-xs">{guidelines.idlh.toFixed(4)}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {chemicalData && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm mb-2">Primary Hazards</h4>
                <div className="flex flex-wrap gap-2">
                  {chemicalData.hazards.map(hazard => (
                    <Badge key={hazard} variant="secondary" className="text-xs">
                      {hazard}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {chemicalData.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Zone-by-Zone Risk Assessment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Risk Assessment by Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthImpacts.map((zone, index) => {
            const riskLevel = getRiskLevel(zone.concentration);
            return (
              <div key={zone.zone} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${zone.zone === 'Red' ? 'bg-red-500' : zone.zone === 'Orange' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    <span className="font-medium">{zone.zone} Zone</span>
                    <Badge variant="outline" className="text-xs">
                      {zone.concentration.toFixed(4)} mg/m³
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(zone.impact.severity)}
                    <Badge className={`${getSeverityColor(zone.impact.severity)} text-white text-xs`}>
                      {zone.impact.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="ml-5 space-y-1">
                  <Progress value={riskLevel.percentage} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {zone.impact.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Environmental & Meteorological Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Environmental Impact Factors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Wind Speed Effect</span>
                <Badge variant="outline">
                  {modelParams.windSpeed > 5 ? 'High Dispersion' : modelParams.windSpeed > 2 ? 'Moderate' : 'Low Dispersion'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Atmospheric Stability</span>
                <Badge variant="outline">Class {modelParams.stabilityClass}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Temperature Effect</span>
                <Badge variant="outline">
                  {modelParams.temperature > 25 ? 'Enhanced Evaporation' : 'Normal Conditions'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Detection Probability</span>
                <Badge variant="outline">
                  {(results.detectionProbability * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Time to Detection</span>
                <Badge variant="outline">
                  {results.timeToDetection.toFixed(1)} min
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Evacuation Time</span>
                <Badge variant="outline">
                  {results.evacuationTime.toFixed(1)} min
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Effects Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Health Effects Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="w-16 justify-center">0-5 min</Badge>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm">Immediate irritation effects (eyes, nose, throat)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="w-16 justify-center">5-15 min</Badge>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Respiratory symptoms develop</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="w-16 justify-center">15-60 min</Badge>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="text-sm">Systemic effects possible</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="w-16 justify-center">1+ hours</Badge>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="text-sm">Potential long-term health impacts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency Response Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">1</Badge>
              <span className="text-sm">Establish evacuation perimeter at minimum {results.orangeZone.distance.toFixed(4)} km radius</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">2</Badge>
              <span className="text-sm">Deploy emergency response teams with Level A chemical protection</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">3</Badge>
              <span className="text-sm">Activate emergency alert systems for {(results.redZone.populationAtRisk + results.orangeZone.populationAtRisk).toLocaleString()} people at immediate risk</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <span className="text-sm">Monitor wind conditions continuously for plume direction changes</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">5</Badge>
              <span className="text-sm">Establish medical triage areas upwind from the release site</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedHazardAssessment;

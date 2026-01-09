
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModelParameters {
  chemicalType: string;
  releaseRate: number;
  windSpeed: number; 
  windDirection: number;
  stabilityClass: string;
  temperature: number;
  sourceHeight: number;
  sourceLocation: { lat: number; lng: number };
}

interface CalculationsResult {
  redZone: {
    distance: number;
    concentration: number;
    area: number;
    populationAtRisk: number;
  };
  orangeZone: {
    distance: number;
    concentration: number;
    area: number;
    populationAtRisk: number;
  };
  yellowZone: {
    distance: number;
    concentration: number;
    area: number;
    populationAtRisk: number;
  };
  massReleased: number;
  evaporationRate: number;
  dispersionCoefficients: {
    sigmaY: number;
    sigmaZ: number;
  };
  maximumConcentration: number;
  lethalDistance: number;
}

interface CalculationDetailsProps {
  parameters: ModelParameters;
  results: CalculationsResult;
}

const CalculationDetails = ({ parameters, results }: CalculationDetailsProps) => {
  // Ensure values are numbers before calling toFixed
  const formatNumber = (value: any, decimals = 2): string => {
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }
    // Try to convert to number if it's not already
    const num = Number(value);
    return isNaN(num) ? "N/A" : num.toFixed(decimals);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Detailed Calculations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px] pr-4">
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2">Input Parameters</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="font-medium py-1">Chemical Type:</td>
                  <td>{parameters.chemicalType}</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Release Rate:</td>
                  <td>{parameters.releaseRate} kg/min</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Wind Speed:</td>
                  <td>{parameters.windSpeed} m/s</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Wind Direction:</td>
                  <td>{parameters.windDirection}° </td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Stability Class:</td>
                  <td>{parameters.stabilityClass}</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Temperature:</td>
                  <td>{parameters.temperature}°C</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Source Height:</td>
                  <td>{parameters.sourceHeight} m</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Location:</td>
                  <td>{parameters.sourceLocation.lat.toFixed(5)}, {parameters.sourceLocation.lng.toFixed(5)}</td>
                </tr>
              </tbody>
            </table>
            
            <Separator className="my-4" />
            
            <h3 className="font-bold text-lg mb-2">Mass Balance</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="font-medium py-1">Total Mass Released:</td>
                  <td>{formatNumber(results.massReleased)} kg</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Evaporation Rate:</td>
                  <td>{formatNumber(results.evaporationRate, 3)} kg/s</td>
                </tr>
              </tbody>
            </table>
            
            <Separator className="my-4" />
            
            <h3 className="font-bold text-lg mb-2">Dispersion Calculations</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="font-medium py-1">Horizontal Dispersion (σy):</td>
                  <td>{formatNumber(results.dispersionCoefficients.sigmaY)} m</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Vertical Dispersion (σz):</td>
                  <td>{formatNumber(results.dispersionCoefficients.sigmaZ)} m</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Maximum Concentration:</td>
                  <td>{formatNumber(results.maximumConcentration)} mg/m³</td>
                </tr>
                <tr>
                  <td className="font-medium py-1">Lethal Distance (IDLH):</td>
                  <td>{formatNumber(results.lethalDistance)} km</td>
                </tr>
              </tbody>
            </table>
            
            <Separator className="my-4" />
            
            <h3 className="font-bold text-lg mb-2">Zone Analysis</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-red-600">Red Zone</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium py-1">Distance:</td>
                      <td>{formatNumber(results.redZone.distance)} km</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Concentration:</td>
                      <td>{formatNumber(results.redZone.concentration)} mg/m³</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Area Affected:</td>
                      <td>{formatNumber(results.redZone.area)} km²</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Population at Risk:</td>
                      <td>{formatNumber(results.redZone.populationAtRisk, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-600">Orange Zone</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium py-1">Distance:</td>
                      <td>{formatNumber(results.orangeZone.distance)} km</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Concentration:</td>
                      <td>{formatNumber(results.orangeZone.concentration)} mg/m³</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Area Affected:</td>
                      <td>{formatNumber(results.orangeZone.area)} km²</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Population at Risk:</td>
                      <td>{formatNumber(results.orangeZone.populationAtRisk, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h4 className="font-semibold text-yellow-600">Yellow Zone</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium py-1">Distance:</td>
                      <td>{formatNumber(results.yellowZone.distance)} km</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Concentration:</td>
                      <td>{formatNumber(results.yellowZone.concentration)} mg/m³</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Area Affected:</td>
                      <td>{formatNumber(results.yellowZone.area)} km²</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Population at Risk:</td>
                      <td>{formatNumber(results.yellowZone.populationAtRisk, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CalculationDetails;

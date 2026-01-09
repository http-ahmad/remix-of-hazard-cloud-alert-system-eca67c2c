
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConcentrationPoint {
  distance: number;
  concentration: number;
}

interface ChartData {
  points: ConcentrationPoint[];
  chemicalType: string;
}

const ConcentrationChart = ({ data }: { data: ChartData }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {data.chemicalType} Concentration vs Distance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60 overflow-x-auto">
          <ResponsiveContainer width="100%" height={200} minWidth={400}>
            <LineChart
              data={data.points}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="distance" 
                label={{ 
                  value: 'Distance (km)', 
                  position: 'insideBottomRight', 
                  offset: -10 
                }} 
              />
              <YAxis 
                label={{ 
                  value: 'Concentration (mg/m³)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }} 
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toFixed(4)} mg/m³`, 'Concentration']}
                labelFormatter={(label) => `Distance: ${Number(label).toFixed(4)} km`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="concentration" 
                name="Concentration" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConcentrationChart;

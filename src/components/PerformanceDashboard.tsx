import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, Zap, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { performanceMonitor, PerformanceStats } from '@/utils/performanceMonitor';

interface PerformanceDashboardProps {
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = memo(({ 
  refreshInterval = 5000 
}) => {
  const [stats, setStats] = useState<PerformanceStats[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof performanceMonitor.getSummary> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refreshData = () => {
    setStats(performanceMonitor.getAllStats());
    setSummary(performanceMonitor.getSummary());
    setLastUpdate(new Date());
  };

  useEffect(() => {
    refreshData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleExport = () => {
    const data = performanceMonitor.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    performanceMonitor.clear();
    refreshData();
  };

  const getStatusColor = (avgTime: number): string => {
    if (avgTime < 10) return 'text-green-600';
    if (avgTime < 50) return 'text-yellow-600';
    if (avgTime < 100) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusBadge = (avgTime: number): React.ReactNode => {
    if (avgTime < 10) return <Badge variant="outline" className="bg-green-50 text-green-700">Fast</Badge>;
    if (avgTime < 50) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Normal</Badge>;
    if (avgTime < 100) return <Badge variant="outline" className="bg-orange-50 text-orange-700">Slow</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  if (!summary || summary.totalOperations === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No performance data collected yet.</p>
            <p className="text-sm mt-2">Operations will be tracked automatically.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Total Ops
            </div>
            <div className="text-2xl font-bold">{summary.totalOperations}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Avg Time
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(summary.avgTime)}`}>
              {summary.avgTime.toFixed(2)}ms
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Total Time
            </div>
            <div className="text-2xl font-bold">{(summary.totalTime / 1000).toFixed(2)}s</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Success Rate
            </div>
            <div className={`text-2xl font-bold ${summary.successRate < 0.9 ? 'text-red-600' : 'text-green-600'}`}>
              {(summary.successRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Operation Details */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Operations by Performance</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {stats
                .sort((a, b) => b.avgTime - a.avgTime)
                .map((stat) => (
                  <div
                    key={stat.name}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{stat.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.count} calls • {stat.minTime.toFixed(1)}-{stat.maxTime.toFixed(1)}ms range
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className={`text-right ${getStatusColor(stat.avgTime)}`}>
                        <div className="font-bold">{stat.avgTime.toFixed(2)}ms</div>
                        <div className="text-xs">avg</div>
                      </div>
                      {getStatusBadge(stat.avgTime)}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;

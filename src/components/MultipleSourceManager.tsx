import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, MapPin, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Source {
  id: string;
  location: { lat: number; lng: number };
  chemicalType: string;
  releaseRate: number;
}

interface MultipleSourceManagerProps {
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  availableChemicals: string[];
}

const MultipleSourceManager = ({ 
  sources, 
  onSourcesChange, 
  availableChemicals 
}: MultipleSourceManagerProps) => {
  const [newSource, setNewSource] = useState({
    lat: '',
    lng: '',
    chemicalType: '',
    releaseRate: ''
  });

  const [multiSourceConfig, setMultiSourceConfig] = useState({
    enableInteraction: false,
    maxSources: 10,
    simulateSimultaneous: true,
    calculateCombinedEffect: true,
    prioritizeByRate: true
  });

  const addSource = () => {
    const lat = parseFloat(newSource.lat);
    const lng = parseFloat(newSource.lng);
    const releaseRate = parseFloat(newSource.releaseRate);
    
    // Validation
    if (isNaN(lat) || isNaN(lng) || isNaN(releaseRate)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numeric values for coordinates and release rate.",
        variant: "destructive",
      });
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid Coordinates",
        description: "Coordinates must be within valid ranges.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newSource.chemicalType) {
      toast({
        title: "Missing Chemical",
        description: "Please select a chemical type.",
        variant: "destructive",
      });
      return;
    }

    if (sources.length >= multiSourceConfig.maxSources) {
      toast({
        title: "Maximum Sources Reached",
        description: `Cannot add more than ${multiSourceConfig.maxSources} sources.`,
        variant: "destructive",
      });
      return;
    }
    
    const source: Source = {
      id: `source-${Date.now()}`,
      location: { lat, lng },
      chemicalType: newSource.chemicalType,
      releaseRate
    };
    
    onSourcesChange([...sources, source]);
    setNewSource({ lat: '', lng: '', chemicalType: '', releaseRate: '' });
    
    toast({
      title: "Source Added",
      description: `New ${newSource.chemicalType} source added at ${Math.round(lat * 10000) / 10000}, ${Math.round(lng * 10000) / 10000}`,
    });
  };

  const removeSource = (id: string) => {
    onSourcesChange(sources.filter(s => s.id !== id));
    toast({
      title: "Source Removed",
      description: "Source has been removed from the simulation.",
    });
  };

  const clearAllSources = () => {
    onSourcesChange([]);
    toast({
      title: "All Sources Cleared",
      description: "All additional sources have been removed.",
    });
  };

  const getTotalReleaseRate = () => {
    return sources.reduce((total, source) => total + source.releaseRate, 0);
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Multiple Source Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 h-full">
          <ScrollArea className="h-96 overflow-x-auto">
            <div className="space-y-4 pr-4 min-w-[500px]">
              {/* Multi-Source Configuration */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <h4 className="font-semibold text-sm">Multi-Source Configuration</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-x-auto">
                  <div className="flex items-center justify-between min-w-[200px]">
                    <Label className="text-xs">Enable Source Interaction</Label>
                    <Switch 
                      checked={multiSourceConfig.enableInteraction}
                      onCheckedChange={(checked) => 
                        setMultiSourceConfig({...multiSourceConfig, enableInteraction: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between min-w-[200px]">
                    <Label className="text-xs">Simultaneous Release</Label>
                    <Switch 
                      checked={multiSourceConfig.simulateSimultaneous}
                      onCheckedChange={(checked) => 
                        setMultiSourceConfig({...multiSourceConfig, simulateSimultaneous: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between min-w-[200px]">
                    <Label className="text-xs">Combined Effect Calc</Label>
                    <Switch 
                      checked={multiSourceConfig.calculateCombinedEffect}
                      onCheckedChange={(checked) => 
                        setMultiSourceConfig({...multiSourceConfig, calculateCombinedEffect: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between min-w-[200px]">
                    <Label className="text-xs">Prioritize by Rate</Label>
                    <Switch 
                      checked={multiSourceConfig.prioritizeByRate}
                      onCheckedChange={(checked) => 
                        setMultiSourceConfig({...multiSourceConfig, prioritizeByRate: checked})
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="max-sources" className="text-xs whitespace-nowrap">Max Sources:</Label>
                  <Input
                    id="max-sources"
                    type="number"
                    min="1"
                    max="20"
                    value={multiSourceConfig.maxSources}
                    onChange={(e) => 
                      setMultiSourceConfig({...multiSourceConfig, maxSources: parseInt(e.target.value) || 10})
                    }
                    className="h-8 text-xs w-20"
                  />
                </div>
              </div>

              {/* Add new source form */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm">Add New Source</h4>
                <div className="grid grid-cols-2 gap-2 overflow-x-auto min-w-[400px]">
                  <div className="min-w-[120px]">
                    <Label htmlFor="new-lat" className="text-xs">Latitude</Label>
                    <Input
                      id="new-lat"
                      type="number"
                      step="0.0001"
                      placeholder="40.7128"
                      value={newSource.lat}
                      onChange={(e) => setNewSource({...newSource, lat: e.target.value})}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <Label htmlFor="new-lng" className="text-xs">Longitude</Label>
                    <Input
                      id="new-lng"
                      type="number"
                      step="0.0001"
                      placeholder="-74.0060"
                      value={newSource.lng}
                      onChange={(e) => setNewSource({...newSource, lng: e.target.value})}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <Label htmlFor="new-chemical" className="text-xs">Chemical</Label>
                    <Select value={newSource.chemicalType} onValueChange={(value) => setNewSource({...newSource, chemicalType: value})}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select chemical" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 overflow-y-auto overflow-x-auto bg-background border shadow-lg z-50">
                        {availableChemicals.map(chemical => (
                          <SelectItem key={chemical} value={chemical} className="whitespace-nowrap">{chemical}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[120px]">
                    <Label htmlFor="new-rate" className="text-xs">Rate (kg/min)</Label>
                    <Input
                      id="new-rate"
                      type="number"
                      step="0.0001"
                      placeholder="10.0000"
                      value={newSource.releaseRate}
                      onChange={(e) => setNewSource({...newSource, releaseRate: e.target.value})}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addSource} size="sm" className="flex-1">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Source
                  </Button>
                  {sources.length > 0 && (
                    <Button onClick={clearAllSources} variant="outline" size="sm">
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Source Statistics */}
              {sources.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Multi-Source Statistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs overflow-x-auto min-w-[300px]">
                    <div>
                      <span className="font-medium">Total Sources:</span> {sources.length + 1} (including primary)
                    </div>
                    <div>
                      <span className="font-medium">Combined Rate:</span> {Math.round(getTotalReleaseRate())} kg/min
                    </div>
                    <div>
                      <span className="font-medium">Unique Chemicals:</span> {new Set(sources.map(s => s.chemicalType)).size}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> 
                      <Badge variant={multiSourceConfig.enableInteraction ? "default" : "secondary"} className="ml-1 text-xs">
                        {multiSourceConfig.enableInteraction ? "Interactive" : "Independent"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing sources list */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Active Sources ({sources.length})</h4>
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional sources added</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-auto">
                    {sources
                      .sort((a, b) => multiSourceConfig.prioritizeByRate ? b.releaseRate - a.releaseRate : 0)
                      .map((source, index) => (
                      <div key={source.id} className="flex items-center justify-between p-2 border rounded-lg min-w-[400px]">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{source.chemicalType}</div>
                            {multiSourceConfig.prioritizeByRate && source.releaseRate > 50 && (
                              <Badge variant="destructive" className="text-xs">High Priority</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            Location: {Math.round(source.location.lat * 10000) / 10000}, {Math.round(source.location.lng * 10000) / 10000}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Rate: {Math.round(source.releaseRate)} kg/min
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSource(source.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultipleSourceManager;

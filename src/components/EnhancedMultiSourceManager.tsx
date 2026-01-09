
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, MapPin, Settings, AlertTriangle, Wind } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface Source {
  id: string;
  location: { lat: number; lng: number };
  chemicalType: string;
  releaseRate: number;
}

interface EnhancedMultiSourceManagerProps {
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  availableChemicals: string[];
}

const EnhancedMultiSourceManager: React.FC<EnhancedMultiSourceManagerProps> = ({ 
  sources, 
  onSourcesChange, 
  availableChemicals 
}) => {
  const [newSource, setNewSource] = useState({
    lat: '',
    lng: '',
    chemicalType: '',
    releaseRate: ''
  });

  const [scientificConfig, setScientificConfig] = useState({
    atmosphericStability: 'D', // Pasquill stability class
    modelingApproach: 'gaussian', // gaussian, lagrangian, cfd
    interactionEffects: true,
    maximumSources: 15,
    simultaneousRelease: true,
    cumulativeEffects: true,
    crossWindInteraction: false,
    temperatureGradient: 0.0065, // K/m standard atmosphere
    mixingHeight: 1000, // meters
    surfaceRoughness: 0.1, // meters
    minimumDetectionThreshold: 0.1, // mg/m³
    uncertaintyFactor: 1.2
  });

  const [validationRules, setValidationRules] = useState({
    maxReleaseRate: 1000, // kg/min
    minDistance: 0.1, // km between sources
    maxDistance: 50, // km from primary
    requireUniqueChemicals: false,
    enableGeographicValidation: true
  });

  const addSource = () => {
    // Enhanced validation
    const lat = parseFloat(newSource.lat);
    const lng = parseFloat(newSource.lng);
    const releaseRate = parseFloat(newSource.releaseRate);
    
    // Comprehensive input validation
    const validationErrors = [];
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      validationErrors.push('Invalid latitude (must be -90 to 90)');
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      validationErrors.push('Invalid longitude (must be -180 to 180)');
    }
    
    if (isNaN(releaseRate) || releaseRate <= 0) {
      validationErrors.push('Release rate must be positive');
    }
    
    if (releaseRate > validationRules.maxReleaseRate) {
      validationErrors.push(`Release rate exceeds maximum (${validationRules.maxReleaseRate} kg/min)`);
    }
    
    if (!newSource.chemicalType) {
      validationErrors.push('Chemical type is required');
    }

    if (sources.length >= scientificConfig.maximumSources) {
      validationErrors.push(`Maximum sources reached (${scientificConfig.maximumSources})`);
    }

    // Check distance constraints
    if (validationRules.enableGeographicValidation && sources.length > 0) {
      const distances = sources.map(source => {
        const dLat = (lat - source.location.lat) * 111.32;
        const dLng = (lng - source.location.lng) * 111.32 * Math.cos(lat * Math.PI / 180);
        return Math.sqrt(dLat * dLat + dLng * dLng);
      });
      
      const minDist = Math.min(...distances);
      if (minDist < validationRules.minDistance) {
        validationErrors.push(`Too close to existing source (min ${validationRules.minDistance} km)`);
      }
    }

    // Check chemical uniqueness if required
    if (validationRules.requireUniqueChemicals) {
      const existingChemicals = sources.map(s => s.chemicalType);
      if (existingChemicals.includes(newSource.chemicalType)) {
        validationErrors.push('Chemical type already exists (uniqueness required)');
      }
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Failed",
        description: validationErrors.join('; '),
        variant: "destructive",
      });
      return;
    }
    
    const source: Source = {
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      location: { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 },
      chemicalType: newSource.chemicalType,
      releaseRate: Math.round(releaseRate * 100) / 100
    };
    
    onSourcesChange([...sources, source]);
    setNewSource({ lat: '', lng: '', chemicalType: '', releaseRate: '' });
    
    toast({
      title: "Source Added Successfully",
      description: `${newSource.chemicalType} source (${Math.round(releaseRate * 100) / 100} kg/min) at ${source.location.lat}, ${source.location.lng}`,
    });
  };

  const removeSource = (id: string) => {
    const removedSource = sources.find(s => s.id === id);
    onSourcesChange(sources.filter(s => s.id !== id));
    toast({
      title: "Source Removed",
      description: `${removedSource?.chemicalType || 'Unknown'} source removed from simulation`,
    });
  };

  const clearAllSources = () => {
    onSourcesChange([]);
    toast({
      title: "All Sources Cleared",
      description: "All additional sources have been removed from the simulation",
    });
  };

  // Scientific calculations
  const getTotalReleaseRate = () => sources.reduce((total, source) => total + source.releaseRate, 0);
  const getUniqueChemicals = () => new Set(sources.map(s => s.chemicalType)).size;
  const getHighPrioritySources = () => sources.filter(s => s.releaseRate > 50).length;
  
  const calculateRiskScore = () => {
    if (sources.length === 0) return 0;
    
    const totalRate = getTotalReleaseRate();
    const sourceCount = sources.length;
    const interactionFactor = scientificConfig.interactionEffects ? 1.3 : 1.0;
    const stabilityFactor = { 'A': 1.5, 'B': 1.3, 'C': 1.1, 'D': 1.0, 'E': 0.9, 'F': 0.8 }[scientificConfig.atmosphericStability] || 1.0;
    
    return Math.round((totalRate * sourceCount * interactionFactor * stabilityFactor) / 10);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Multi-Source Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScrollArea className="h-[600px] overflow-x-auto">
            <div className="space-y-6 pr-4 min-w-[800px]">
              
              {/* Scientific Parameters */}
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  <h4 className="font-semibold">Atmospheric Dispersion Parameters</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Stability Class</Label>
                    <Select 
                      value={scientificConfig.atmosphericStability} 
                      onValueChange={(value) => 
                        setScientificConfig({...scientificConfig, atmosphericStability: value})
                      }
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
                  
                  <div>
                    <Label className="text-xs">Modeling Approach</Label>
                    <Select 
                      value={scientificConfig.modelingApproach} 
                      onValueChange={(value) => 
                        setScientificConfig({...scientificConfig, modelingApproach: value})
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gaussian">Gaussian Plume</SelectItem>
                        <SelectItem value="lagrangian">Lagrangian Particle</SelectItem>
                        <SelectItem value="cfd">CFD Enhanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Mixing Height (m)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[scientificConfig.mixingHeight]}
                        onValueChange={([value]) => 
                          setScientificConfig({...scientificConfig, mixingHeight: value})
                        }
                        max={3000}
                        min={100}
                        step={50}
                        className="flex-1"
                      />
                      <span className="text-xs w-12">{scientificConfig.mixingHeight}m</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Surface Roughness (m)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[scientificConfig.surfaceRoughness]}
                        onValueChange={([value]) => 
                          setScientificConfig({...scientificConfig, surfaceRoughness: value})
                        }
                        max={2.0}
                        min={0.01}
                        step={0.01}
                        className="flex-1"
                      />
                      <span className="text-xs w-12">{scientificConfig.surfaceRoughness}m</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Uncertainty Factor</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[scientificConfig.uncertaintyFactor]}
                        onValueChange={([value]) => 
                          setScientificConfig({...scientificConfig, uncertaintyFactor: value})
                        }
                        max={3.0}
                        min={1.0}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-xs w-12">{scientificConfig.uncertaintyFactor}x</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Source Interaction Effects</Label>
                    <Switch 
                      checked={scientificConfig.interactionEffects}
                      onCheckedChange={(checked) => 
                        setScientificConfig({...scientificConfig, interactionEffects: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Cross-Wind Interaction</Label>
                    <Switch 
                      checked={scientificConfig.crossWindInteraction}
                      onCheckedChange={(checked) => 
                        setScientificConfig({...scientificConfig, crossWindInteraction: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Validation Rules */}
              <div className="space-y-4 p-4 border rounded-lg bg-yellow-50/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <h4 className="font-semibold">Validation & Safety Rules</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Max Release Rate (kg/min)</Label>
                    <Input
                      type="number"
                      value={validationRules.maxReleaseRate}
                      onChange={(e) => 
                        setValidationRules({...validationRules, maxReleaseRate: parseFloat(e.target.value) || 1000})
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Min Distance (km)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={validationRules.minDistance}
                      onChange={(e) => 
                        setValidationRules({...validationRules, minDistance: parseFloat(e.target.value) || 0.1})
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Require Unique Chemicals</Label>
                    <Switch 
                      checked={validationRules.requireUniqueChemicals}
                      onCheckedChange={(checked) => 
                        setValidationRules({...validationRules, requireUniqueChemicals: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Geographic Validation</Label>
                    <Switch 
                      checked={validationRules.enableGeographicValidation}
                      onCheckedChange={(checked) => 
                        setValidationRules({...validationRules, enableGeographicValidation: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Add New Source */}
              <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                <h4 className="font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Release Source
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-lat" className="text-xs">Latitude (°)</Label>
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
                  <div>
                    <Label htmlFor="new-lng" className="text-xs">Longitude (°)</Label>
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
                  <div>
                    <Label htmlFor="new-chemical" className="text-xs">Chemical Compound</Label>
                    <Select value={newSource.chemicalType} onValueChange={(value) => setNewSource({...newSource, chemicalType: value})}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select chemical" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 overflow-y-auto">
                        {availableChemicals.map(chemical => (
                          <SelectItem key={chemical} value={chemical}>{chemical}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="new-rate" className="text-xs">Release Rate (kg/min)</Label>
                    <Input
                      id="new-rate"
                      type="number"
                      step="0.01"
                      placeholder="10.00"
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

              {/* Multi-Source Analytics */}
              {sources.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-3">Multi-Source Analytics</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div><strong>Total Sources:</strong> {sources.length + 1} (including primary)</div>
                      <div><strong>Combined Rate:</strong> {Math.round(getTotalReleaseRate() * 100) / 100} kg/min</div>
                      <div><strong>Unique Chemicals:</strong> {getUniqueChemicals()}</div>
                      <div><strong>High Priority:</strong> {getHighPrioritySources()}</div>
                    </div>
                    <div className="space-y-2">
                      <div><strong>Risk Score:</strong> 
                        <Badge variant={calculateRiskScore() > 50 ? "destructive" : calculateRiskScore() > 25 ? "secondary" : "outline"} className="ml-1">
                          {calculateRiskScore()}
                        </Badge>
                      </div>
                      <div><strong>Interaction:</strong> 
                        <Badge variant={scientificConfig.interactionEffects ? "default" : "secondary"} className="ml-1">
                          {scientificConfig.interactionEffects ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div><strong>Model:</strong> {scientificConfig.modelingApproach.toUpperCase()}</div>
                      <div><strong>Stability:</strong> Class {scientificConfig.atmosphericStability}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Source List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Active Sources ({sources.length})</h4>
                  {sources.length > 0 && (
                    <Badge variant="outline">{Math.round(getTotalReleaseRate() * 100) / 100} kg/min total</Badge>
                  )}
                </div>
                
                {sources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No additional sources configured</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sources
                      .sort((a, b) => b.releaseRate - a.releaseRate)
                      .map((source, index) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg bg-white min-w-[700px]">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium">{source.chemicalType}</div>
                            {source.releaseRate > 50 && (
                              <Badge variant="destructive" className="text-xs">High Priority</Badge>
                            )}
                            {source.releaseRate > validationRules.maxReleaseRate * 0.8 && (
                              <Badge variant="secondary" className="text-xs">Near Limit</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>
                              <strong>Location:</strong><br />
                              {source.location.lat}, {source.location.lng}
                            </div>
                            <div>
                              <strong>Rate:</strong><br />
                              {Math.round(source.releaseRate * 100) / 100} kg/min
                            </div>
                            <div>
                              <strong>Priority:</strong><br />
                              {index + 2} of {sources.length + 1}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSource(source.id)}
                          className="ml-3"
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

export default EnhancedMultiSourceManager;

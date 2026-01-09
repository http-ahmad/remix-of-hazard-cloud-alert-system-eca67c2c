
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Shield } from 'lucide-react';
import { generateSensorRecommendations } from "../utils/dispersionModel";

interface SensorLocation {
  id: string;
  lat: number;
  lng: number;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  battery?: number;
  signalStrength?: number;
  lastReading?: number;
  threshold: number;
}

interface SensorManagementProps {
  sourceLocation: { lat: number; lng: number };
  windDirection: number;
  sensorLocations: SensorLocation[];
  onSensorLocationsChange: (sensors: SensorLocation[]) => void;
  onOptimizeSensors: () => void;
}

const SensorManagement: React.FC<SensorManagementProps> = ({
  sourceLocation,
  windDirection,
  sensorLocations,
  onSensorLocationsChange,
  onOptimizeSensors
}) => {
  const [editingSensor, setEditingSensor] = useState<SensorLocation | null>(null);
  const [newSensorForm, setNewSensorForm] = useState({
    lat: sourceLocation.lat,
    lng: sourceLocation.lng,
    type: 'fixed',
    threshold: 1.0
  });
  
  const handleAddSensor = () => {
    const newSensor: SensorLocation = {
      id: `sensor-${Date.now()}`,
      lat: newSensorForm.lat,
      lng: newSensorForm.lng,
      type: newSensorForm.type,
      status: 'active',
      battery: 100,
      signalStrength: 95,
      lastReading: 0,
      threshold: newSensorForm.threshold
    };
    
    onSensorLocationsChange([...sensorLocations, newSensor]);
    
    toast({
      title: "Sensor Added",
      description: `New ${newSensorForm.type} sensor has been added to the network`,
    });
    
    // Reset form to defaults
    setNewSensorForm({
      lat: sourceLocation.lat,
      lng: sourceLocation.lng,
      type: 'fixed',
      threshold: 1.0
    });
  };
  
  const handleEditSensor = (sensor: SensorLocation) => {
    setEditingSensor(sensor);
  };
  
  const handleSaveSensorEdit = () => {
    if (!editingSensor) return;
    
    const updatedSensors = sensorLocations.map(s => 
      s.id === editingSensor.id ? editingSensor : s
    );
    
    onSensorLocationsChange(updatedSensors);
    setEditingSensor(null);
    
    toast({
      title: "Sensor Updated",
      description: `Sensor ${editingSensor.id} has been updated`,
    });
  };
  
  const handleDeleteSensor = (id: string) => {
    const updatedSensors = sensorLocations.filter(s => s.id !== id);
    onSensorLocationsChange(updatedSensors);
    
    toast({
      title: "Sensor Removed",
      description: "Sensor has been removed from the network",
    });
  };
  
  const handleSensorStatusChange = (id: string, status: 'active' | 'inactive' | 'maintenance') => {
    const updatedSensors = sensorLocations.map(s => 
      s.id === id ? { ...s, status } : s
    );
    
    onSensorLocationsChange(updatedSensors);
    
    toast({
      title: "Sensor Status Changed",
      description: `Sensor is now ${status}`,
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sensor Network Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sensor status panel */}
        <div className="bg-slate-50 p-3 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Sensor Network Status</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {sensorLocations.filter(s => s.status === 'active').length} Active
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <div className="font-medium">Total Sensors</div>
              <div className="text-lg">{sensorLocations.length}</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="font-medium">Coverage</div>
              <div className="text-lg">{Math.min(100, sensorLocations.length * 15)}%</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="font-medium">Alerts</div>
              <div className="text-lg">{sensorLocations.filter(s => (s.lastReading || 0) > s.threshold).length}</div>
            </div>
          </div>
        </div>
        
        {/* Sensor list */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reading</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensorLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    No sensors configured. Add sensors to begin monitoring.
                  </TableCell>
                </TableRow>
              ) : (
                sensorLocations.map(sensor => (
                  <TableRow key={sensor.id}>
                    <TableCell className="font-medium">{sensor.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      {sensor.type === 'fixed' ? 'Fixed' : 'Mobile'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${sensor.status === 'active' ? 'bg-green-100 text-green-800' : 
                          sensor.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(sensor.lastReading || 0) > sensor.threshold ? (
                        <span className="flex items-center text-red-600 gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {sensor.lastReading?.toFixed(2)} mg/m³
                        </span>
                      ) : (
                        <span>{sensor.lastReading?.toFixed(2) || 'N/A'} mg/m³</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSensor(sensor)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteSensor(sensor.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Add new sensor form */}
        <div className="border rounded-md p-3">
          <h3 className="text-sm font-medium mb-3">Add New Sensor</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="sensorLat">Latitude</Label>
              <Input 
                id="sensorLat"
                type="number"
                step="0.00001"
                value={newSensorForm.lat}
                onChange={(e) => setNewSensorForm({...newSensorForm, lat: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sensorLng">Longitude</Label>
              <Input 
                id="sensorLng"
                type="number"
                step="0.00001"
                value={newSensorForm.lng}
                onChange={(e) => setNewSensorForm({...newSensorForm, lng: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="space-y-1">
              <Label htmlFor="sensorType">Type</Label>
              <Select 
                value={newSensorForm.type}
                onValueChange={(value) => setNewSensorForm({...newSensorForm, type: value})}
              >
                <SelectTrigger id="sensorType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Location</SelectItem>
                  <SelectItem value="mobile">Mobile/Portable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sensorThreshold">Alarm Threshold (mg/m³)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="sensorThreshold"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={[newSensorForm.threshold]}
                  onValueChange={(value) => setNewSensorForm({...newSensorForm, threshold: value[0]})}
                />
                <span className="min-w-[40px] text-right">{newSensorForm.threshold}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setNewSensorForm({
                  lat: sourceLocation.lat,
                  lng: sourceLocation.lng,
                  type: 'fixed',
                  threshold: 1.0
                });
              }}
            >
              Reset
            </Button>
            <Button onClick={handleAddSensor}>Add Sensor</Button>
          </div>
        </div>
        
        {/* Optimization button */}
        <div className="flex justify-center">
          <Button 
            className="w-full" 
            variant="outline"
            onClick={onOptimizeSensors}
          >
            Optimize Sensor Placement
          </Button>
        </div>
        
        {/* Edit sensor modal */}
        {editingSensor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md w-96 max-w-full">
              <h3 className="text-lg font-medium mb-3">Edit Sensor</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editLat">Latitude</Label>
                  <Input 
                    id="editLat"
                    type="number"
                    step="0.00001"
                    value={editingSensor.lat}
                    onChange={(e) => setEditingSensor({
                      ...editingSensor, 
                      lat: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editLng">Longitude</Label>
                  <Input 
                    id="editLng"
                    type="number"
                    step="0.00001"
                    value={editingSensor.lng}
                    onChange={(e) => setEditingSensor({
                      ...editingSensor, 
                      lng: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="editType">Type</Label>
                  <Select 
                    value={editingSensor.type}
                    onValueChange={(value) => setEditingSensor({...editingSensor, type: value})}
                  >
                    <SelectTrigger id="editType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Location</SelectItem>
                      <SelectItem value="mobile">Mobile/Portable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editStatus">Status</Label>
                  <Select 
                    value={editingSensor.status}
                    onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                      setEditingSensor({...editingSensor, status: value})
                    }
                  >
                    <SelectTrigger id="editStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1 mt-3">
                <Label htmlFor="editThreshold">Alarm Threshold (mg/m³)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="editThreshold"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={[editingSensor.threshold]}
                    onValueChange={(value) => setEditingSensor({
                      ...editingSensor, 
                      threshold: value[0]
                    })}
                  />
                  <span className="min-w-[40px] text-right">{editingSensor.threshold}</span>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingSensor(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveSensorEdit}>Save Changes</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SensorManagement;

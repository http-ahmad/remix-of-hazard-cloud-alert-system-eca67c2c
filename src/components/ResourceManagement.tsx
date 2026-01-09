import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Truck, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  type: 'personnel' | 'equipment' | 'medical' | 'vehicle' | 'supplies';
  quantity: number;
  available: number;
  status: 'available' | 'deployed' | 'maintenance' | 'low_stock';
  location: string;
  priority: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

interface Deployment {
  id: string;
  resourceId: string;
  resourceName: string;
  quantity: number;
  location: string;
  assignedTo: string;
  startTime: string;
  estimatedDuration: number;
  status: 'active' | 'completed' | 'pending';
}

const ResourceManagement: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      name: 'Hazmat Suits',
      type: 'equipment',
      quantity: 50,
      available: 35,
      status: 'available',
      location: 'Central Warehouse',
      priority: 'high',
      lastUpdated: '2024-01-15 10:30'
    },
    {
      id: '2',
      name: 'Emergency Response Team',
      type: 'personnel',
      quantity: 12,
      available: 8,
      status: 'deployed',
      location: 'Fire Station 12',
      priority: 'high',
      lastUpdated: '2024-01-15 11:15'
    },
    {
      id: '3',
      name: 'Air Monitoring Equipment',
      type: 'equipment',
      quantity: 8,
      available: 6,
      status: 'available',
      location: 'Emergency Center',
      priority: 'high',
      lastUpdated: '2024-01-15 09:45'
    },
    {
      id: '4',
      name: 'Medical Supplies',
      type: 'medical',
      quantity: 200,
      available: 45,
      status: 'low_stock',
      location: 'Hospital Storage',
      priority: 'medium',
      lastUpdated: '2024-01-15 08:20'
    },
    {
      id: '5',
      name: 'Emergency Vehicles',
      type: 'vehicle',
      quantity: 6,
      available: 4,
      status: 'available',
      location: 'Motor Pool',
      priority: 'medium',
      lastUpdated: '2024-01-15 10:00'
    }
  ]);

  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: '1',
      resourceId: '2',
      resourceName: 'Emergency Response Team',
      quantity: 4,
      location: 'Chemical Plant Site',
      assignedTo: 'Incident Commander Alpha',
      startTime: '2024-01-15 11:00',
      estimatedDuration: 180,
      status: 'active'
    },
    {
      id: '2',
      resourceId: '1',
      resourceName: 'Hazmat Suits',
      quantity: 15,
      location: 'Perimeter Zone A',
      assignedTo: 'Hazmat Team Leader',
      startTime: '2024-01-15 10:45',
      estimatedDuration: 240,
      status: 'active'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'deployed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'maintenance':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low_stock':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personnel':
        return <Users className="w-5 h-5" />;
      case 'equipment':
        return <Package className="w-5 h-5" />;
      case 'medical':
        return <Shield className="w-5 h-5" />;
      case 'vehicle':
        return <Truck className="w-5 h-5" />;
      case 'supplies':
        return <Package className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const deployResource = (resourceId: string, quantity: number) => {
    setResources(prev => prev.map(resource => 
      resource.id === resourceId 
        ? { ...resource, available: resource.available - quantity }
        : resource
    ));
  };

  const calculateAvailabilityPercentage = (available: number, total: number) => {
    return (available / total) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Resource Management</h2>
          <p className="text-muted-foreground">Track and manage emergency response resources</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Resource Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Personnel</p>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.type === 'personnel').reduce((sum, r) => sum + r.available, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">Equipment</p>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.type === 'equipment').reduce((sum, r) => sum + r.available, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Vehicles</p>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.type === 'vehicle').reduce((sum, r) => sum + r.available, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">Low Stock</p>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.status === 'low_stock').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="deployments">Active Deployments</TabsTrigger>
          <TabsTrigger value="requests">Resource Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {resources.map(resource => (
              <Card key={resource.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(resource.type)}
                      <div>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <CardDescription className="capitalize">{resource.type}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Availability</span>
                      <span className="text-sm">
                        {resource.available}/{resource.quantity}
                      </span>
                    </div>
                    <Progress 
                      value={calculateAvailabilityPercentage(resource.available, resource.quantity)}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{resource.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{resource.lastUpdated}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      disabled={resource.available === 0}
                    >
                      Deploy
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <div className="space-y-4">
            {deployments.map(deployment => (
              <Card key={deployment.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold text-lg">{deployment.resourceName}</h3>
                        <Badge className={getStatusColor(deployment.status)}>
                          {deployment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Quantity:</span> {deployment.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {deployment.location}
                        </div>
                        <div>
                          <span className="font-medium">Assigned to:</span> {deployment.assignedTo}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {deployment.estimatedDuration} min
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Started:</span> {deployment.startTime}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Update Status
                      </Button>
                      <Button size="sm" variant="outline">
                        Recall
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Resources</CardTitle>
              <CardDescription>Submit a request for additional resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resource-type">Resource Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personnel">Personnel</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="medical">Medical Supplies</SelectItem>
                      <SelectItem value="vehicle">Vehicles</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity Needed</Label>
                  <Input type="number" placeholder="Enter quantity" />
                </div>
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Deployment Location</Label>
                  <Input placeholder="Enter location" />
                </div>
              </div>
              <Button className="w-full">
                Submit Request
              </Button>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Additional Hazmat Suits</p>
                      <p className="text-sm text-muted-foreground">Quantity: 25 • Priority: High</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">Approve</Button>
                    <Button size="sm" variant="outline">Deny</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Backup Response Team</p>
                      <p className="text-sm text-muted-foreground">Quantity: 6 • Priority: Medium</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">Approve</Button>
                    <Button size="sm" variant="outline">Deny</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceManagement;
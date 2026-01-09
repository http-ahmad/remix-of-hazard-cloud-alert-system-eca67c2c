import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  available: boolean;
}

const EmergencyContacts: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Fire Department',
      role: 'Emergency Response',
      phone: '911',
      email: 'emergency@firestation.gov',
      location: 'Station 12, Main St',
      priority: 'high',
      available: true
    },
    {
      id: '2',
      name: 'Hazmat Team Alpha',
      role: 'Chemical Specialist',
      phone: '+1-555-0123',
      email: 'hazmat@emergency.gov',
      location: 'Regional Command Center',
      priority: 'high',
      available: true
    },
    {
      id: '3',
      name: 'Dr. Sarah Johnson',
      role: 'Toxicology Expert',
      phone: '+1-555-0456',
      email: 'sarah.johnson@hospital.com',
      location: 'City General Hospital',
      priority: 'medium',
      available: false
    },
    {
      id: '4',
      name: 'Emergency Coordinator',
      role: 'Incident Commander',
      phone: '+1-555-0789',
      email: 'coordinator@emergency.gov',
      location: 'Emergency Operations Center',
      priority: 'high',
      available: true
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const priorityColors = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline'
  } as const;

  const callContact = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const emailContact = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleSaveContact = (contact: Partial<EmergencyContact>) => {
    if (editingContact) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...contact } : c));
    } else {
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: contact.name || '',
        role: contact.role || '',
        phone: contact.phone || '',
        email: contact.email || '',
        location: contact.location || '',
        priority: contact.priority || 'medium',
        available: contact.available ?? true
      };
      setContacts(prev => [...prev, newContact]);
    }
    setIsDialogOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Emergency Contacts</h2>
          <p className="text-muted-foreground">Manage emergency response contacts and communication</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingContact(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            </DialogHeader>
            <ContactForm contact={editingContact} onSave={handleSaveContact} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Action Panel */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Emergency Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="destructive" 
              size="lg" 
              onClick={() => callContact('911')}
              className="h-16"
            >
              <Phone className="w-6 h-6 mr-2" />
              Call 911
            </Button>
            <Button 
              variant="destructive" 
              size="lg"
              onClick={() => callContact('+1-555-0123')}
              className="h-16"
            >
              <Phone className="w-6 h-6 mr-2" />
              Hazmat Team
            </Button>
            <Button 
              variant="destructive" 
              size="lg"
              onClick={() => callContact('+1-555-0789')}
              className="h-16"
            >
              <Phone className="w-6 h-6 mr-2" />
              Incident Commander
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts.map(contact => (
          <Card key={contact.id} className={`relative ${!contact.available ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <CardDescription>{contact.role}</CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Badge variant={priorityColors[contact.priority]}>
                    {contact.priority}
                  </Badge>
                  {contact.available && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Available
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{contact.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{contact.location}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => callContact(contact.phone)}
                  disabled={!contact.available}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => emailContact(contact.email)}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setEditingContact(contact);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ContactForm: React.FC<{
  contact: EmergencyContact | null;
  onSave: (contact: Partial<EmergencyContact>) => void;
}> = ({ contact, onSave }) => {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    role: contact?.role || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    location: contact?.location || '',
    priority: contact?.priority || 'medium',
    available: contact?.available ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="available"
          checked={formData.available}
          onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
        />
        <Label htmlFor="available">Currently Available</Label>
      </div>
      
      <Button type="submit" className="w-full">
        Save Contact
      </Button>
    </form>
  );
};

export default EmergencyContacts;
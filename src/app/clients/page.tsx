"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { 
  Plus, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  Trash2,
  Calendar,
  Globe,
  FileText,
  User,
  ArrowRight,
  CalendarDays,
  Edit2,
  Check,
  X as CloseIcon,
  Upload,
  ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ClientsPage() {
  const { data, addClient, updateClient, deleteClient } = useApp();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Client>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newClient, setNewClient] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    location: '',
    notes: '',
    avatarUrl: ''
  });

  const filteredClients = data.clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 storage
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 1MB."
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        if (isEditing) {
          setEditData(prev => ({ ...prev, avatarUrl: base64String }));
        } else {
          setNewClient(prev => ({ ...prev, avatarUrl: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClient({
      ...newClient,
      avatarUrl: newClient.avatarUrl || `https://picsum.photos/seed/${Math.random()}/600/400`
    });
    setIsAddOpen(false);
    setNewClient({ name: '', businessName: '', email: '', phone: '', location: '', notes: '', avatarUrl: '' });
    setLogoPreview(null);
    toast({
      title: "Success",
      description: "Partner onboarded successfully."
    });
  };

  const startEditing = () => {
    if (selectedClient) {
      setEditData(selectedClient);
      setLogoPreview(selectedClient.avatarUrl || null);
      setIsEditing(true);
    }
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClient && editData) {
      updateClient(selectedClient.id, editData);
      setSelectedClient({ ...selectedClient, ...editData } as Client);
      setIsEditing(false);
      setLogoPreview(null);
      toast({
        title: "Success",
        description: "Partner details updated."
      });
    }
  };

  const getClientStats = (clientId: string) => {
    const sites = data.websites.filter(w => w.clientId === clientId);
    const tasks = data.tasks.filter(t => t.clientId === clientId);
    const unpaid = sites.filter(s => s.paymentStatus !== 'Paid').length;
    return { sitesCount: sites.length, tasksCount: tasks.length, unpaidCount: unpaid };
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Partners</h1>
            <p className="text-muted-foreground mt-2">The core of your agency's success.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setLogoPreview(null);
              setNewClient(prev => ({ ...prev, avatarUrl: '' }));
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 premium-button bg-primary text-primary-foreground">
                <Plus size={20} />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Onboard New Partner</DialogTitle>
                <DialogDescription>Add a new client to your management system.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4 py-4">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div 
                    className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo preview" fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload size={20} />
                        <span className="text-[10px] font-bold uppercase">Upload Logo</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-tighter">Recommended: Square PNG/JPG (Max 1MB)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" required value={newClient.businessName} onChange={e => setNewClient({...newClient, businessName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g. London, UK" value={newClient.location} onChange={e => setNewClient({...newClient, location: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Lead Contact</Label>
                  <Input id="name" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Client Vision / Notes</Label>
                  <Textarea id="notes" placeholder="What makes this partnership special?" value={newClient.notes} onChange={e => setNewClient({...newClient, notes: e.target.value})} />
                </div>
                <Button type="submit" className="w-full">Initialize Partnership</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-xl group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search by name, business, or location..." 
            className="pl-10 h-12 bg-background/50 border-muted" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredClients.map((client) => {
            const stats = getClientStats(client.id);
            return (
              <Card 
                key={client.id} 
                className="group relative overflow-hidden premium-card cursor-pointer hover:translate-y-[-4px] transition-all duration-300"
                onClick={() => setSelectedClient(client)}
              >
                <div className="relative h-48 w-full">
                  <Image 
                    src={client.avatarUrl || `https://picsum.photos/seed/${client.id}/600/400`} 
                    alt={client.businessName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    data-ai-hint="client office"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-xl drop-shadow-md">{client.businessName}</h3>
                    <div className="flex items-center gap-1.5 text-xs opacity-90 font-medium">
                      <MapPin size={12} className="text-primary" />
                      {client.location}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    {stats.unpaidCount > 0 && (
                      <Badge variant="destructive" className="animate-pulse bg-red-500/80 backdrop-blur-sm border-none">
                        {stats.unpaidCount} Pending Payment
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={16} />
                      </div>
                      <span className="text-sm font-semibold">{client.name}</span>
                    </div>
                    <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Websites</p>
                      <p className="text-lg font-bold">{stats.sitesCount}</p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tasks</p>
                      <p className="text-lg font-bold">{stats.tasksCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                      <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Sheet open={!!selectedClient} onOpenChange={(open) => {
          if (!open) {
            setSelectedClient(null);
            setIsEditing(false);
            setLogoPreview(null);
          }
        }}>
          <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
            {selectedClient && (
              <div className="space-y-8 pb-10">
                <SheetHeader>
                  <SheetTitle>{isEditing ? 'Edit Partner Details' : selectedClient.businessName}</SheetTitle>
                  <SheetDescription>
                    {isEditing ? 'Modify the details for this client partnership.' : 'Comprehensive view of client status and history.'}
                  </SheetDescription>
                </SheetHeader>

                <div className="relative h-64 -mx-6 -mt-6">
                  <Image 
                    src={selectedClient.avatarUrl || `https://picsum.photos/seed/${selectedClient.id}/600/400`} 
                    alt={selectedClient.businessName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    {!isEditing && (
                      <div>
                        <Badge className="mb-2 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 backdrop-blur-sm">VIP Partner</Badge>
                        <h2 className="text-3xl font-bold">{selectedClient.businessName}</h2>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="icon" onClick={() => { setIsEditing(false); setLogoPreview(null); }} title="Cancel">
                            <CloseIcon size={18} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" size="icon" onClick={startEditing} title="Edit Client">
                            <Edit2 size={18} />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => { deleteClient(selectedClient.id); setSelectedClient(null); }}>
                            <Trash2 size={18} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateClient} className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-4">
                      <div 
                        className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {logoPreview ? (
                          <Image src={logoPreview} alt="Logo preview" fill className="object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Upload size={20} />
                            <span className="text-[10px] font-bold uppercase">Change Logo</span>
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input value={editData.businessName} onChange={e => setEditData({...editData, businessName: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Lead Contact</Label>
                      <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 gap-2">
                        <Check size={18} />
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lead Contact</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold">{selectedClient.name}</p>
                            <p className="text-xs text-muted-foreground">Main Decision Maker</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <p className="font-bold">{selectedClient.location}</p>
                            <p className="text-xs text-muted-foreground">Office Address</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <Phone size={16} className="text-primary" />
                        Communication Channels
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-4 rounded-xl border group hover:border-primary transition-all">
                          <div className="flex items-center gap-3">
                            <Mail size={18} className="text-muted-foreground" />
                            <span className="text-sm font-medium">{selectedClient.email}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="group-hover:text-primary" asChild>
                            <a href={`mailto:${selectedClient.email}`}><ArrowRight size={16} /></a>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl border group hover:border-primary transition-all">
                          <div className="flex items-center gap-3">
                            <Phone size={18} className="text-muted-foreground" />
                            <span className="text-sm font-medium">{selectedClient.phone}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="group-hover:text-primary" asChild>
                            <a href={`tel:${selectedClient.phone}`}><ArrowRight size={16} /></a>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <Globe size={16} className="text-primary" />
                        Digital Properties
                      </h4>
                      <div className="space-y-3">
                        {data.websites.filter(w => w.clientId === selectedClient.id).map(site => (
                          <div key={site.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
                            <div>
                              <p className="font-bold text-sm">{site.domainName}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className="text-[10px]">{site.platform}</Badge>
                                <span className="text-[10px] text-muted-foreground">Expires: {site.expiryDate}</span>
                              </div>
                            </div>
                            <Badge className={site.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}>
                              {site.paymentStatus}
                            </Badge>
                          </div>
                        ))}
                        {data.websites.filter(w => w.clientId === selectedClient.id).length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No websites linked yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        Internal Strategy Notes
                      </h4>
                      <div className="p-4 rounded-xl bg-accent/30 border border-primary/20 italic text-sm leading-relaxed">
                        "{selectedClient.notes}"
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Client Since {selectedClient.createdAt}</span>
                  <span>ID: {selectedClient.id}</span>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  isSaving: boolean;
  isAuthorized: boolean;
  verifyPin: (pin: string) => boolean;
  logout: () => void;
  addClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addWebsite: (website: Partial<Website>) => Promise<void>;
  addCredential: (credential: Partial<Credential>) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, status: Task['status']) => Promise<void>;
  addReminder: (reminder: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  addPayment: (payment: Partial<Payment>) => Promise<void>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const ADMIN_PIN = "1234567a";

// Simple fetch helpers
const api = {
  get: (path: string) =>
    fetch(path).then(r => {
      if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
      return r.json();
    }),
  post: (path: string, body: unknown) =>
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  put: (path: string, body: unknown) =>
    fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  del: (path: string, body: unknown) =>
    fetch(path, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<AppData>({
    clients: [],
    websites: [],
    credentials: [],
    tasks: [],
    reminders: [],
    payments: [],
  });
  const router = useRouter();

  const refreshData = async () => {
    const result = await api.get('/api/data');
    setData(result);
  };

  useEffect(() => {
    if (localStorage.getItem('tgne_auth_session') === 'true') {
      setIsAuthorized(true);
    }

    refreshData()
      .catch(() =>
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: 'Could not load data from the database. Check your connection.',
        })
      )
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyPin = (pin: string) => {
    if (pin === ADMIN_PIN) {
      setIsAuthorized(true);
      localStorage.setItem('tgne_auth_session', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthorized(false);
    localStorage.removeItem('tgne_auth_session');
    router.push('/tgnes');
  };

  const handleError = (ctx: string, error: unknown) => {
    console.error(`[${ctx}]`, error);
    toast({
      variant: 'destructive',
      title: 'Save Failed',
      description: `Could not complete "${ctx}". Please try again.`,
    });
  };

  // ═══════════════════════════════════════════════════
  // MutActions with Premium Save Animation
  // ═══════════════════════════════════════════════════

  // ── Clients ──────────────────────────────────────────────
  const addClient = async (client: Partial<Client>) => {
    setIsSaving(true);
    try {
      const r = await api.post('/api/clients', client);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Success', description: 'Client added successfully!' });
    } catch (e) {
      handleError('addClient', e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    setIsSaving(true);
    try {
      const r = await api.put('/api/clients', { id, ...client });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Success', description: 'Client updated!' });
    } catch (e) {
      handleError('updateClient', e);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClient = async (id: string) => {
    setIsSaving(true);
    try {
      const r = await api.del('/api/clients', { id });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Deleted', description: 'Client removed.' });
    } catch (e) {
      handleError('deleteClient', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Websites ─────────────────────────────────────────────
  const addWebsite = async (website: Partial<Website>) => {
    setIsSaving(true);
    try {
      const r = await api.post('/api/websites', website);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Success', description: 'Website added!' });
    } catch (e) {
      handleError('addWebsite', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Credentials ──────────────────────────────────────────
  const addCredential = async (credential: Partial<Credential>) => {
    setIsSaving(true);
    try {
      const r = await api.post('/api/credentials', credential);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Secured', description: 'Credential saved to vault!' });
    } catch (e) {
      handleError('addCredential', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Tasks ────────────────────────────────────────────────
  const addTask = async (task: Partial<Task>) => {
    setIsSaving(true);
    try {
      const r = await api.post('/api/tasks', task);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Success', description: 'Task created!' });
    } catch (e) {
      handleError('addTask', e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTask = async (id: string, status: Task['status']) => {
    setIsSaving(true);
    try {
      const r = await api.put('/api/tasks', { id, status });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Updated', description: `Task marked as ${status}` });
    } catch (e) {
      handleError('updateTask', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reminders ────────────────────────────────────────────
  const addReminder = async (reminder: Partial<Reminder>) => {
    setIsSaving(true);
    try {
      const r = await api.post('/api/reminders', reminder);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Set', description: 'Reminder scheduled!' });
    } catch (e) {
      handleError('addReminder', e);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReminder = async (id: string) => {
    setIsSaving(true);
    try {
      const r = await api.del('/api/reminders', { id });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Removed', description: 'Reminder deleted.' });
    } catch (e) {
      handleError('deleteReminder', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Payments ─────────────────────────────────────────────
  const addPayment = async (payment: Partial<Payment>) => {
    setIsSaving(true);
    try {
      const r = await api.post('/api/payments', payment);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Invoice Created', description: 'New invoice saved!' });
    } catch (e) {
      handleError('addPayment', e);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    setIsSaving(true);
    try {
      const r = await api.put('/api/payments', { id, ...updates });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Updated', description: 'Invoice updated!' });
    } catch (e) {
      handleError('updatePayment', e);
    } finally {
      setIsSaving(false);
    }
  };

  const deletePayment = async (id: string) => {
    setIsSaving(true);
    try {
      const r = await api.del('/api/payments', { id });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
      toast({ title: 'Deleted', description: 'Invoice removed.' });
    } catch (e) {
      handleError('deletePayment', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        isLoading,
        isSaving,
        isAuthorized,
        verifyPin,
        logout,
        addClient,
        updateClient,
        deleteClient,
        addWebsite,
        addCredential,
        addTask,
        updateTask,
        addReminder,
        deleteReminder,
        addPayment,
        updatePayment,
        deletePayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

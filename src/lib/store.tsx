"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
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

  // ── Clients ──────────────────────────────────────────────
  const addClient = async (client: Partial<Client>) => {
    try {
      const r = await api.post('/api/clients', client);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('addClient', e);
    }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    try {
      const r = await api.put('/api/clients', { id, ...client });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('updateClient', e);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const r = await api.del('/api/clients', { id });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('deleteClient', e);
    }
  };

  // ── Websites ─────────────────────────────────────────────
  const addWebsite = async (website: Partial<Website>) => {
    try {
      const r = await api.post('/api/websites', website);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('addWebsite', e);
    }
  };

  // ── Credentials ──────────────────────────────────────────
  const addCredential = async (credential: Partial<Credential>) => {
    try {
      const r = await api.post('/api/credentials', credential);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('addCredential', e);
    }
  };

  // ── Tasks ────────────────────────────────────────────────
  const addTask = async (task: Partial<Task>) => {
    try {
      const r = await api.post('/api/tasks', task);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('addTask', e);
    }
  };

  const updateTask = async (id: string, status: Task['status']) => {
    try {
      const r = await api.put('/api/tasks', { id, status });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('updateTask', e);
    }
  };

  // ── Reminders ────────────────────────────────────────────
  const addReminder = async (reminder: Partial<Reminder>) => {
    try {
      const r = await api.post('/api/reminders', reminder);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('addReminder', e);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const r = await api.del('/api/reminders', { id });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('deleteReminder', e);
    }
  };

  // ── Payments ─────────────────────────────────────────────
  const addPayment = async (payment: Partial<Payment>) => {
    try {
      const r = await api.post('/api/payments', payment);
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('addPayment', e);
    }
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    try {
      const r = await api.put('/api/payments', { id, ...updates });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('updatePayment', e);
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const r = await api.del('/api/payments', { id });
      if (!r.ok) throw new Error(await r.text());
      await refreshData();
    } catch (e) {
      handleError('deletePayment', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        isLoading,
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

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';
import { useRouter } from 'next/navigation';
import * as actions from '@/lib/actions';
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

  useEffect(() => {
    const authSession = localStorage.getItem('tgne_auth_session');
    if (authSession === 'true') {
      setIsAuthorized(true);
    }

    const loadInitialData = async () => {
      try {
        const result = await actions.fetchAllData();
        setData(result);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: 'Could not load data from the database. Check your connection.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
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

  const refreshData = async () => {
    const updated = await actions.fetchAllData();
    setData(updated);
  };

  const handleError = (context: string, error: unknown) => {
    console.error(`Persistence Error (${context}):`, error);
    toast({
      variant: 'destructive',
      title: 'Save Failed',
      description: `Could not complete "${context}". Please try again.`,
    });
  };

  const addClient = async (client: Partial<Client>) => {
    try {
      await actions.createClient(client);
      await refreshData();
    } catch (error) {
      handleError('addClient', error);
    }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    try {
      await actions.updateClientAction(id, client);
      await refreshData();
    } catch (error) {
      handleError('updateClient', error);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await actions.deleteClientAction(id);
      await refreshData();
    } catch (error) {
      handleError('deleteClient', error);
    }
  };

  const addWebsite = async (website: Partial<Website>) => {
    try {
      await actions.createWebsite(website);
      await refreshData();
    } catch (error) {
      handleError('addWebsite', error);
    }
  };

  const addCredential = async (credential: Partial<Credential>) => {
    try {
      await actions.createCredential(credential);
      await refreshData();
    } catch (error) {
      handleError('addCredential', error);
    }
  };

  const addTask = async (task: Partial<Task>) => {
    try {
      await actions.createTask(task);
      await refreshData();
    } catch (error) {
      handleError('addTask', error);
    }
  };

  const updateTask = async (id: string, status: Task['status']) => {
    try {
      await actions.updateTaskAction(id, status);
      await refreshData();
    } catch (error) {
      handleError('updateTask', error);
    }
  };

  const addReminder = async (reminder: Partial<Reminder>) => {
    try {
      await actions.createReminder(reminder);
      await refreshData();
    } catch (error) {
      handleError('addReminder', error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await actions.deleteReminderAction(id);
      await refreshData();
    } catch (error) {
      handleError('deleteReminder', error);
    }
  };

  const addPayment = async (payment: Partial<Payment>) => {
    try {
      await actions.createPayment(payment);
      await refreshData();
    } catch (error) {
      handleError('addPayment', error);
    }
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    try {
      await actions.updatePaymentAction(id, updates);
      await refreshData();
    } catch (error) {
      handleError('updatePayment', error);
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await actions.deletePaymentAction(id);
      await refreshData();
    } catch (error) {
      handleError('deletePayment', error);
    }
  };

  return (
    <AppContext.Provider value={{ 
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
      deletePayment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
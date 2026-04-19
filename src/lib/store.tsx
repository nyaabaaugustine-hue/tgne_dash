
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';
import { useRouter } from 'next/navigation';
import * as actions from '@/lib/actions';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  isAuthorized: boolean;
  verifyPin: (pin: string) => boolean;
  logout: () => void;
  addClient: (client: Partial<Client>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addWebsite: (website: Partial<Website>) => void;
  addCredential: (credential: Partial<Credential>) => void;
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, status: Task['status']) => void;
  addReminder: (reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addPayment: (payment: Partial<Payment>) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
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

  const addClient = async (client: Partial<Client>) => {
    await actions.createClient(client);
    await refreshData();
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    await actions.updateClientAction(id, client);
    await refreshData();
  };

  const deleteClient = async (id: string) => {
    await actions.deleteClientAction(id);
    await refreshData();
  };

  const addWebsite = async (website: Partial<Website>) => {
    await actions.createWebsite(website);
    await refreshData();
  };

  const addCredential = async (credential: Partial<Credential>) => {
    await actions.createCredential(credential);
    await refreshData();
  };

  const addTask = async (task: Partial<Task>) => {
    await actions.createTask(task);
    await refreshData();
  };

  const updateTask = async (id: string, status: Task['status']) => {
    await actions.updateTaskAction(id, status);
    await refreshData();
  };

  const addReminder = async (reminder: Partial<Reminder>) => {
    await actions.createReminder(reminder);
    await refreshData();
  };

  const deleteReminder = async (id: string) => {
    await actions.deleteReminderAction(id);
    await refreshData();
  };

  const addPayment = async (payment: Partial<Payment>) => {
    await actions.createPayment(payment);
    await refreshData();
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    await actions.updatePaymentAction(id, updates);
    await refreshData();
  };

  const deletePayment = async (id: string) => {
    await actions.deletePaymentAction(id);
    await refreshData();
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

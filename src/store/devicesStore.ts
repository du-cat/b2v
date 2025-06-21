import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Device } from '../types';

interface DevicesState {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  
  fetchDevices: (storeId: string) => Promise<void>;
  createDevice: (deviceData: Partial<Device>) => Promise<Device | null>;
  updateDevice: (deviceId: string, deviceData: Partial<Device>) => Promise<Device | null>;
  deleteDevice: (deviceId: string) => Promise<boolean>;
  updateLastPing: (deviceId: string) => Promise<boolean>;
}

export const useDevicesStore = create<DevicesState>((set, get) => ({
  devices: [],
  isLoading: false,
  error: null,
  
  fetchDevices: async (storeId) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        devices: data as Device[],
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
    }
  },
  
  createDevice: async (deviceData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('devices')
        .insert([{
          ...deviceData,
          last_ping: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newDevice = data as Device;
      set(state => ({ 
        devices: [newDevice, ...state.devices],
        isLoading: false 
      }));
      
      return newDevice;
    } catch (error) {
      console.error('Error creating device:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
      return null;
    }
  },
  
  updateDevice: async (deviceId, deviceData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('devices')
        .update(deviceData)
        .eq('id', deviceId)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedDevice = data as Device;
      set(state => ({ 
        devices: state.devices.map(device => 
          device.id === deviceId ? updatedDevice : device
        ),
        isLoading: false 
      }));
      
      return updatedDevice;
    } catch (error) {
      console.error('Error updating device:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
      return null;
    }
  },
  
  deleteDevice: async (deviceId) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);
      
      if (error) throw error;
      
      set(state => ({ 
        devices: state.devices.filter(device => device.id !== deviceId),
        isLoading: false 
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting device:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message 
      });
      return false;
    }
  },
  
  updateLastPing: async (deviceId) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ last_ping: new Date().toISOString() })
        .eq('id', deviceId);
      
      if (error) throw error;
      
      set(state => ({ 
        devices: state.devices.map(device => 
          device.id === deviceId 
            ? { ...device, last_ping: new Date().toISOString() }
            : device
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating device ping:', error);
      set({ error: (error as Error).message });
      return false;
    }
  },
}));
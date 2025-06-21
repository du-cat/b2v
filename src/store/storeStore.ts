import { create } from 'zustand';
import { supabase, validateSession } from '../lib/supabase';
import type { Store } from '../types';

interface StoreState {
  stores: Store[];
  currentStore: Store | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  hasAttemptedStoreInit: boolean;
  
  fetchStores: (userId: string) => Promise<Store[]>;
  setCurrentStore: (storeId: string) => void;
  createStore: (storeData: Partial<Store>) => Promise<Store | null>;
  updateStore: (storeId: string, storeData: Partial<Store>) => Promise<Store | null>;
  initializeStoreContext: (userId: string) => Promise<void>;
  clearError: () => void;
  resetRetryCount: () => void;
  resetAttemptedStoreInit: () => void;
  checkSessionValidity: () => Promise<boolean>;
}

export const useStoreStore = create<StoreState>((set, get) => ({
  stores: [],
  currentStore: null,
  isLoading: false,
  error: null,
  retryCount: 0,
  hasAttemptedStoreInit: false,
  
  clearError: () => set({ error: null }),
  resetRetryCount: () => set({ retryCount: 0 }),
  resetAttemptedStoreInit: () => set({ hasAttemptedStoreInit: false }),
  
  checkSessionValidity: async () => {
    try {
      const { isValid } = await validateSession();
      return isValid;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },
  
  fetchStores: async (userId) => {
    try {
      console.log('🔄 Fetching stores for user:', userId);
      set({ isLoading: true, error: null });
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
      });
      
      // Validate session before making request
      const sessionPromise = (async () => {
        const { isValid, session, error: sessionError } = await validateSession();
        if (!isValid) {
          console.error('❌ Session validation failed:', sessionError);
          throw new Error('SESSION_EXPIRED');
        }
        
        console.log('✅ Session valid, fetching stores...');
        
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Database error fetching stores:', error);
          
          // Handle auth-related errors
          if (error.code === '42501' || error.message.includes('permission') || error.message.includes('RLS')) {
            throw new Error('SESSION_EXPIRED');
          }
          throw error;
        }
        
        return data as Store[];
      })();
      
      // Race between timeout and actual request
      const stores = await Promise.race([sessionPromise, timeoutPromise]) as Store[];
      
      console.log(`✅ Successfully fetched ${stores.length} stores`);
      
      set({ 
        stores, 
        isLoading: false, 
        error: null 
      });
      
      return stores;
    } catch (error) {
      console.error('❌ Error fetching stores:', error);
      
      const errorMessage = (error as Error).message;
      set({ 
        isLoading: false, 
        error: errorMessage === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : errorMessage
      });
      return [];
    }
  },
  
  setCurrentStore: (storeId) => {
    const store = get().stores.find(s => s.id === storeId);
    if (store) {
      set({ currentStore: store });
      // Save to local storage for persistence
      localStorage.setItem('currentStoreId', storeId);
      console.log(`✅ Current store set to: ${store.name}`);
    }
  },
  
  createStore: async (storeData) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('🔄 Creating store with data:', storeData);
      
      // Validate session before attempting to create store
      const { isValid, session, error: sessionError } = await validateSession();
      if (!isValid) {
        console.error('❌ Session validation failed:', sessionError);
        throw new Error('SESSION_EXPIRED');
      }
      
      console.log('✅ Valid session confirmed for user:', session.user.id);
      
      // Ensure owner_id is set correctly from the authenticated session
      const storePayload = {
        ...storeData,
        owner_id: session.user.id, // Explicitly set from session
      };
      
      console.log('🔄 Inserting store with payload:', {
        ...storePayload,
        owner_id: '***' // Hide the actual ID in logs
      });
      
      const { data, error } = await supabase
        .from('stores')
        .insert([storePayload])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Store creation error:', error);
        
        // Handle specific error types
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('RLS')) {
          throw new Error('SESSION_EXPIRED');
        } else if (error.code === '23505') {
          throw new Error('A store with this name already exists. Please choose a different name.');
        } else if (error.message.includes('row-level security')) {
          throw new Error('SESSION_EXPIRED');
        } else {
          // Increment retry count for other errors
          const currentRetryCount = get().retryCount;
          set({ retryCount: currentRetryCount + 1 });
          throw new Error(`Database error: ${error.message}`);
        }
      }
      
      const newStore = data as Store;
      console.log('✅ Store created successfully:', newStore);
      
      // Reset retry count and attempt flag on success
      set({ retryCount: 0, hasAttemptedStoreInit: false });
      
      // Update stores list and set as current store
      set(state => ({ 
        stores: [newStore, ...state.stores],
        currentStore: newStore,
        isLoading: false 
      }));
      
      // Save to local storage
      localStorage.setItem('currentStoreId', newStore.id);
      console.log(`✅ Store created and set as current: ${newStore.name}`);
      
      return newStore;
    } catch (error) {
      console.error('❌ Error creating store:', error);
      
      const errorMessage = (error as Error).message;
      
      // Handle session expiration specially
      if (errorMessage === 'SESSION_EXPIRED') {
        set({ 
          isLoading: false, 
          error: 'SESSION_EXPIRED' // Special error code for UI handling
        });
      } else {
        // Increment retry count for other errors
        const currentRetryCount = get().retryCount;
        set({ 
          retryCount: currentRetryCount + 1,
          isLoading: false, 
          error: errorMessage
        });
      }
      
      throw error; // Re-throw so the component can handle it
    }
  },
  
  updateStore: async (storeId, storeData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Validate session before making request
      const { isValid, session, error: sessionError } = await validateSession();
      if (!isValid) {
        throw new Error('SESSION_EXPIRED');
      }
      
      const { data, error } = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', storeId)
        .select()
        .single();
      
      if (error) {
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('RLS')) {
          throw new Error('SESSION_EXPIRED');
        }
        throw error;
      }
      
      const updatedStore = data as Store;
      set(state => ({ 
        stores: state.stores.map(store => 
          store.id === storeId ? updatedStore : store
        ),
        currentStore: state.currentStore?.id === storeId ? updatedStore : state.currentStore,
        isLoading: false 
      }));
      
      return updatedStore;
    } catch (error) {
      console.error('Error updating store:', error);
      
      const errorMessage = (error as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        set({ 
          isLoading: false, 
          error: 'SESSION_EXPIRED'
        });
      } else {
        set({ 
          isLoading: false, 
          error: errorMessage
        });
      }
      return null;
    }
  },

  /**
   * Initialize store context with proper error handling and timeout protection
   * Now includes tracking to prevent infinite loops
   */
  initializeStoreContext: async (userId) => {
    // Prevent multiple simultaneous initialization attempts
    const state = get();
    if (state.hasAttemptedStoreInit) {
      console.log('⚠️ Store initialization already attempted, skipping...');
      return;
    }

    try {
      console.log('🔄 Initializing store context for user:', userId);
      set({ isLoading: true, error: null, hasAttemptedStoreInit: true });
      
      // Add timeout protection for the entire initialization
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Store initialization timeout after 15 seconds')), 15000);
      });
      
      const initPromise = (async () => {
        // Validate session before making request
        const { isValid, session, error: sessionError } = await validateSession();
        if (!isValid) {
          console.error('❌ Session validation failed during store context init:', sessionError);
          set({ 
            currentStore: null, 
            isLoading: false, 
            error: 'SESSION_EXPIRED'
          });
          return;
        }
        
        console.log('✅ Session valid, proceeding with store context initialization');
        
        // Fetch all stores for the user
        const stores = await get().fetchStores(userId);
        
        // Check if there was an error during fetch
        const currentError = get().error;
        if (currentError) {
          console.error('❌ Error during store fetch:', currentError);
          set({ isLoading: false });
          return;
        }
        
        if (stores.length === 0) {
          // No stores exist - user will be redirected to setup
          set({ currentStore: null, isLoading: false });
          console.log('ℹ️ No stores found - user needs to create first store');
          return;
        }
        
        // Check if there's a saved current store ID
        const savedStoreId = localStorage.getItem('currentStoreId');
        let selectedStore: Store | null = null;
        
        if (savedStoreId) {
          // Try to find the saved store
          selectedStore = stores.find(store => store.id === savedStoreId) || null;
          if (selectedStore) {
            console.log(`✅ Restored saved store: ${selectedStore.name}`);
          } else {
            console.log('⚠️ Saved store not found, selecting most recent');
          }
        }
        
        // Fallback to most recent store if no saved store or saved store not found
        if (!selectedStore) {
          selectedStore = stores[0]; // Already sorted by created_at desc
          localStorage.setItem('currentStoreId', selectedStore.id);
          console.log(`✅ Auto-selected most recent store: ${selectedStore.name}`);
        }
        
        set({ 
          stores, 
          currentStore: selectedStore, 
          isLoading: false,
          error: null
        });
        
        console.log('✅ Store context initialization completed successfully');
      })();
      
      // Race between timeout and initialization
      await Promise.race([initPromise, timeoutPromise]);
      
    } catch (error) {
      console.error('❌ Error initializing store context:', error);
      
      const errorMessage = (error as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        set({ 
          isLoading: false, 
          error: 'SESSION_EXPIRED'
        });
      } else if (errorMessage.includes('timeout')) {
        set({ 
          isLoading: false, 
          error: 'Store loading timed out. Please refresh the page or try logging out and back in.'
        });
      } else {
        set({ 
          isLoading: false, 
          error: 'Unable to load your stores. Please refresh the page or try logging out and back in.'
        });
      }
    }
  },
}));
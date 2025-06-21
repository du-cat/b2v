import { create } from 'zustand';
import { StoreService } from '../services/StoreService';
import type { StoreState, Store, CreateStoreData } from '../types';

/**
 * Store management store following Single Responsibility Principle
 * Manages store state only - no business logic
 * FIXED: Enhanced error handling and session management
 */
interface StoreStore extends StoreState {
  // Actions
  fetchStores: (userId: string) => Promise<Store[]>;
  setCurrentStore: (storeId: string) => void;
  createStore: (storeData: CreateStoreData) => Promise<Store | null>;
  updateStore: (storeId: string, storeData: Partial<CreateStoreData>) => Promise<Store | null>;
  initializeStoreContext: (userId: string) => Promise<void>;
  clearError: () => void;
  resetRetryCount: () => void;
  resetAttemptedStoreInit: () => void;
  checkSessionValidity: () => Promise<boolean>;
}

export const useStoreStore = create<StoreStore>((set, get) => ({
  // State
  stores: [],
  currentStore: null,
  isLoading: false,
  error: null,
  retryCount: 0,
  hasAttemptedStoreInit: false,
  
  // Actions
  clearError: () => set({ error: null }),
  resetRetryCount: () => set({ retryCount: 0 }),
  resetAttemptedStoreInit: () => set({ hasAttemptedStoreInit: false }),
  
  checkSessionValidity: async () => {
    return await StoreService.checkSessionValidity();
  },
  
  fetchStores: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔄 StoreStore: fetchStores called for userId:', userId);
      
      // CRITICAL FIX: Verify session validity before fetching stores
      const isSessionValid = await StoreService.checkSessionValidity();
      if (!isSessionValid) {
        console.error('❌ Session validation failed before fetching stores');
        set({ 
          stores: [], 
          isLoading: false, 
          error: 'SESSION_EXPIRED' 
        });
        return [];
      }
      
      const result = await StoreService.fetchStores(userId);
      
      if (result.error) {
        console.error('❌ StoreStore: fetchStores failed with error:', result.error);
        set({ 
          stores: [], 
          isLoading: false, 
          error: result.error 
        });
        return [];
      }
      
      console.log(`✅ StoreStore: fetchStores succeeded, got ${result.stores.length} stores`);
      set({ 
        stores: result.stores, 
        isLoading: false, 
        error: null 
      });
      
      return result.stores;
    } catch (error) {
      console.error('❌ StoreStore: Fetch stores failed:', error);
      const errorMessage = (error as Error).message;
      set({ 
        stores: [],
        isLoading: false, 
        error: errorMessage
      });
      return [];
    }
  },
  
  setCurrentStore: (storeId: string) => {
    const store = get().stores.find(s => s.id === storeId);
    if (store) {
      set({ currentStore: store });
      localStorage.setItem('currentStoreId', storeId);
      console.log(`✅ StoreStore: Current store set to: ${store.name}`);
    }
  },
  
  createStore: async (storeData: CreateStoreData) => {
    try {
      console.log('🔄 StoreStore: createStore called with data:', {
        ...storeData,
        owner_id: '***' // Hide the actual ID in logs
      });
      
      set({ isLoading: true, error: null });
      
      // CRITICAL FIX: Verify session validity before attempting store creation
      const isSessionValid = await StoreService.checkSessionValidity();
      if (!isSessionValid) {
        console.error('❌ Session validation failed before store creation');
        throw new Error('SESSION_EXPIRED');
      }
      
      const result = await StoreService.createStore(storeData);
      console.log('🔄 StoreStore: createStore result from service:', result);
      
      if (result.error) {
        console.error('❌ StoreStore: createStore failed with error:', result.error);
        
        // Handle session expiration specially
        if (result.error === 'SESSION_EXPIRED') {
          set({ 
            isLoading: false, 
            error: 'SESSION_EXPIRED'
          });
        } else {
          // Increment retry count for other errors
          const currentRetryCount = get().retryCount;
          set({ 
            retryCount: currentRetryCount + 1,
            isLoading: false, 
            error: result.error
          });
        }
        throw new Error(result.error);
      }
      
      if (!result.store) {
        console.error('❌ StoreStore: createStore returned no store but no error');
        throw new Error('Store creation failed - no store returned');
      }
      
      // Reset retry count and attempt flag on success
      set({ retryCount: 0, hasAttemptedStoreInit: false });
      
      // Update stores list and set as current store
      console.log('✅ StoreStore: createStore succeeded, updating state with new store:', result.store);
      set(state => ({ 
        stores: [result.store!, ...state.stores],
        currentStore: result.store,
        isLoading: false 
      }));
      
      // Save to local storage
      localStorage.setItem('currentStoreId', result.store.id);
      console.log('✅ StoreStore: Saved new store ID to localStorage:', result.store.id);
      
      return result.store;
    } catch (error) {
      console.error('❌ StoreStore: Create store failed:', error);
      throw error;
    }
  },
  
  updateStore: async (storeId: string, storeData: Partial<CreateStoreData>) => {
    try {
      set({ isLoading: true, error: null });
      
      // CRITICAL FIX: Verify session validity before updating store
      const isSessionValid = await StoreService.checkSessionValidity();
      if (!isSessionValid) {
        console.error('❌ Session validation failed before store update');
        throw new Error('SESSION_EXPIRED');
      }
      
      const result = await StoreService.updateStore(storeId, storeData);
      
      if (result.error) {
        set({ 
          isLoading: false, 
          error: result.error === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : result.error
        });
        return null;
      }
      
      if (!result.store) {
        return null;
      }
      
      set(state => ({ 
        stores: state.stores.map(store => 
          store.id === storeId ? result.store! : store
        ),
        currentStore: state.currentStore?.id === storeId ? result.store : state.currentStore,
        isLoading: false 
      }));
      
      return result.store;
    } catch (error) {
      console.error('❌ StoreStore: Update store failed:', error);
      set({ 
        isLoading: false, 
        error: (error as Error).message
      });
      return null;
    }
  },

  initializeStoreContext: async (userId: string) => {
    // Prevent multiple simultaneous initialization attempts
    const state = get();
    if (state.hasAttemptedStoreInit) {
      console.log('⚠️ Store initialization already attempted, skipping...');
      return;
    }

    try {
      console.log('🔄 StoreStore: Initializing store context for user:', userId);
      set({ isLoading: true, error: null, hasAttemptedStoreInit: true });
      
      // CRITICAL FIX: Verify session validity before proceeding
      const isSessionValid = await StoreService.checkSessionValidity();
      if (!isSessionValid) {
        console.error('❌ Session validation failed during store context initialization');
        set({ 
          isLoading: false, 
          error: 'SESSION_EXPIRED'
        });
        return;
      }
      
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
      
    } catch (error) {
      console.error('❌ StoreStore: Error initializing store context:', error);
      
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
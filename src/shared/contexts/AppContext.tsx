import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '../../features/auth/store/AuthStore';
import { useStoreStore } from '../../features/stores/store/StoreStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Store, Plus } from 'lucide-react';

/**
 * Application context for global app state
 * Used sparingly and only for deeply shared state
 * CRITICAL: This context does NOT directly read from other stores to avoid coupling
 */
interface AppContextValue {
  isAppReady: boolean;
  hasValidSession: boolean;
  hasStores: boolean;
  currentUserId: string | null;
  currentStoreId: string | null;
  appError: string | null;
  clearAppError: () => void;
  showStoreReminder: boolean;
  dismissStoreReminder: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [appError, setAppError] = useState<string | null>(null);
  const [showStoreReminder, setShowStoreReminder] = useState(false);
  const [hasShownStoreReminder, setHasShownStoreReminder] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  
  // IMPORTANT: Only subscribe to specific state slices, not entire stores
  const user = useAuthStore(state => state.user);
  const isAuthInitialized = useAuthStore(state => state.isInitialized);
  const authError = useAuthStore(state => state.error);
  const initializeAuth = useAuthStore(state => state.initialize);
  
  const stores = useStoreStore(state => state.stores);
  const currentStore = useStoreStore(state => state.currentStore);
  const storeError = useStoreStore(state => state.error);
  const hasAttemptedStoreInit = useStoreStore(state => state.hasAttemptedStoreInit);
  const initializeStoreContext = useStoreStore(state => state.initializeStoreContext);

  // Initialize auth on mount - with protection against multiple attempts
  useEffect(() => {
    if (!isAuthInitialized && !initializationAttempted) {
      console.log('🔄 AppContext: Initializing auth...');
      setInitializationAttempted(true);
      try {
        initializeAuth();
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setAppError('Authentication initialization failed');
      }
    }
  }, [isAuthInitialized, initializeAuth, initializationAttempted]);

  // Initialize store context when user is available
  useEffect(() => {
    if (user && isAuthInitialized && !hasAttemptedStoreInit) {
      console.log('🔄 AppContext: Initializing store context...');
      try {
        initializeStoreContext(user.id);
      } catch (error) {
        console.error('❌ Store context initialization error:', error);
        setAppError('Store initialization failed');
      }
    }
  }, [user, isAuthInitialized, hasAttemptedStoreInit, initializeStoreContext]);

  // Track errors from auth and store
  useEffect(() => {
    if (authError) {
      console.error('❌ Auth error detected in AppContext:', authError);
      setAppError(authError);
      
      // CRITICAL FIX: Clear localStorage on SESSION_EXPIRED error
      if (authError === 'SESSION_EXPIRED') {
        console.log('🔄 Clearing invalid session data from localStorage due to SESSION_EXPIRED');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
      }
    }
  }, [authError]);

  useEffect(() => {
    if (storeError) {
      console.error('❌ Store error detected in AppContext:', storeError);
      setAppError(storeError);
      
      // CRITICAL FIX: Clear localStorage on SESSION_EXPIRED error
      if (storeError === 'SESSION_EXPIRED') {
        console.log('🔄 Clearing invalid session data from localStorage due to SESSION_EXPIRED');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
      }
    }
  }, [storeError]);

  // Show store reminder toast if user is authenticated but has no stores
  useEffect(() => {
    if (user && isAuthInitialized && hasAttemptedStoreInit && stores.length === 0 && !hasShownStoreReminder) {
      console.log('📣 AppContext: User has no stores, showing reminder');
      setShowStoreReminder(true);
      setHasShownStoreReminder(true);
      
      // Show toast with create store link
      toast(
        (t) => (
          <div className="flex items-center">
            <Store className="h-5 w-5 text-teal-500 mr-2" />
            <span className="mr-2">Create your first store to get started</span>
            <Link 
              to="/setup" 
              className="bg-teal-500 text-white px-2 py-1 rounded text-xs flex items-center"
              onClick={() => toast.dismiss(t.id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Store
            </Link>
          </div>
        ),
        {
          duration: 8000,
          position: 'top-center',
          icon: null,
          style: {
            borderLeft: '4px solid #14b8a6',
            backgroundColor: '#f0fdfa',
            color: '#115e59'
          }
        }
      );
    }
  }, [user, isAuthInitialized, hasAttemptedStoreInit, stores.length, hasShownStoreReminder]);

  // Set up auth state change listener for cross-tab support
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Refresh the auth store with the latest user data
          initializeAuth();
        } else if (event === 'SIGNED_OUT') {
          // CRITICAL FIX: Clear localStorage on sign out
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('currentStoreId');
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth]);

  const clearAppError = () => {
    setAppError(null);
  };

  const dismissStoreReminder = () => {
    setShowStoreReminder(false);
  };

  // Compute context value (derived state only)
  const contextValue: AppContextValue = {
    isAppReady: isAuthInitialized,
    hasValidSession: !!user,
    hasStores: stores.length > 0,
    currentUserId: user?.id || null,
    currentStoreId: currentStore?.id || null,
    appError,
    clearAppError,
    showStoreReminder,
    dismissStoreReminder
  };

  console.log('🔄 AppContext: Context value updated:', {
    isAppReady: contextValue.isAppReady,
    hasValidSession: contextValue.hasValidSession,
    hasStores: contextValue.hasStores,
    currentUserId: contextValue.currentUserId ? '***' : null,
    currentStoreId: contextValue.currentStoreId ? '***' : null,
    hasError: !!contextValue.appError,
    showStoreReminder: contextValue.showStoreReminder
  });

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    </ErrorBoundary>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Specialized hooks for specific context values
 * These prevent unnecessary re-renders by subscribing to specific values
 */
export function useAppReady(): boolean {
  const context = useAppContext();
  return context.isAppReady;
}

export function useHasValidSession(): boolean {
  const context = useAppContext();
  return context.hasValidSession;
}

export function useHasStores(): boolean {
  const context = useAppContext();
  return context.hasStores;
}

export function useCurrentUserId(): string | null {
  const context = useAppContext();
  return context.currentUserId;
}

export function useCurrentStoreId(): string | null {
  const context = useAppContext();
  return context.currentStoreId;
}

export function useAppError(): { error: string | null; clearError: () => void } {
  const context = useAppContext();
  return { 
    error: context.appError,
    clearError: context.clearAppError
  };
}

export function useStoreReminder(): { show: boolean; dismiss: () => void } {
  const context = useAppContext();
  return {
    show: context.showStoreReminder,
    dismiss: context.dismissStoreReminder
  };
}
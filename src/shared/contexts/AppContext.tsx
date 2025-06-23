import React, { createContext, useContext, useEffect, ReactNode, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/AuthStore';
import { useStoreStore } from '../../features/stores/store/StoreStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';

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
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [showStoreReminder, setShowStoreReminder] = useState(false);
  
  // IMPORTANT: Only subscribe to specific state slices
  const user = useAuthStore(state => state.user);
  const isAuthInitialized = useAuthStore(state => state.isInitialized);
  const authError = useAuthStore(state => state.error);
  const initializeAuth = useAuthStore(state => state.initialize);
  const session = useAuthStore(state => state.session);
  
  const stores = useStoreStore(state => state.stores);
  const currentStore = useStoreStore(state => state.currentStore);
  const initializeStoreContext = useStoreStore(state => state.initializeStoreContext);

  // Handle auth initialization
  useEffect(() => {
    let mounted = true;
    
    if (!isAuthInitialized) {
      console.log('🔄 AppContext: Starting auth initialization...');
      initializeAuth().catch(err => {
        console.error('❌ Auth initialization failed:', err);
      }).finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }

    return () => { mounted = false; };
  }, [isAuthInitialized, initializeAuth]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading || !isAuthInitialized) return;

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const hasValidSession = !!user && !!session;

    if (!hasValidSession && !isAuthPage) {
      navigate('/login');
    } else if (hasValidSession && isAuthPage) {
      navigate('/dashboard');
    }
  }, [user, session, isLoading, isAuthInitialized, location.pathname, navigate]);

  // Initialize store context
  useEffect(() => {
    if (user && isAuthInitialized) {
      initializeStoreContext(user.id);
    }
  }, [user, isAuthInitialized, initializeStoreContext]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      console.error('❌ Auth error detected in AppContext:', authError);
      setAppError(authError);
    }
  }, [authError]);

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(() => ({
    isAppReady: isAuthInitialized && !isLoading,
    hasValidSession: !!user && !!session,
    hasStores: stores.length > 0,
    currentUserId: user?.id || null,
    currentStoreId: currentStore?.id || null,
    appError,
    clearAppError: () => setAppError(null),
    showStoreReminder,
    dismissStoreReminder: () => setShowStoreReminder(false)
  }), [
    isAuthInitialized,
    isLoading,
    user,
    session,
    stores.length,
    currentStore?.id,
    appError,
    showStoreReminder
  ]);

  // If still initializing, show nothing
  if (!isAuthInitialized && isLoading) {
    return null;
  }

  return (
    <AppContext.Provider value={value}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Utility hook to access a single value from context
function useAppValue<K extends keyof AppContextValue>(key: K): AppContextValue[K] {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error(`useAppValue must be used within an AppProvider`);
  }
  return context[key];
}

// Individual value hooks
export const useHasStores = () => useAppValue('hasStores');
export const useHasValidSession = () => useAppValue('hasValidSession');
export const useCurrentUserId = () => useAppValue('currentUserId');
export const useCurrentStoreId = () => useAppValue('currentStoreId');
export const useAppError = () => useAppValue('appError');
export const useIsAppReady = () => useAppValue('isAppReady');
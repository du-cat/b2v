import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useApp } from '../../shared/contexts/AppContext';
import { useAuthStore } from '../../features/auth/store/AuthStore';
import { useStoreStore } from '../../features/stores/store/StoreStore';
import type { AuthState } from '../../features/auth/types';
import type { StoreState } from '../../features/stores/types';
import { Button } from '../ui/Button';
import { RefreshCw, LogOut, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';

/**
 * Main layout component following Interface Segregation Principle
 * CRITICAL: Uses context and specific store subscriptions, no direct store coupling
 */
export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Use context for app-wide state (no direct store coupling)
  const { isAppReady, hasValidSession } = useApp();
  
  // IMPORTANT: Only subscribe to specific store slices needed
  const user = useAuthStore((state: AuthState) => state.user);
  const logout = useAuthStore((state: AuthState) => state.logout);
  const stores = useStoreStore((state: StoreState) => state.stores);
  const isStoreLoading = useStoreStore((state: StoreState) => state.isLoading);
  const storeError = useStoreStore((state: StoreState) => state.error);
  const clearStoreError = useStoreStore((state: StoreState) => state.clearError);
  const resetAttemptedStoreInit = useStoreStore((state: StoreState) => state.resetAttemptedStoreInit);
  const initializeStoreContext = useStoreStore((state: StoreState) => state.initializeStoreContext);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };
  
  const handleRetryStoreLoad = () => {
    if (user) {
      clearStoreError();
      resetAttemptedStoreInit();
      initializeStoreContext(user.id);
    }
  };
  
  // Show loading state during initialization
  if (!isAppReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading application...</p>
        </div>
      </div>
    );
  }
  
  // Show store loading with timeout
  if (user && isStoreLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 mb-4">Loading your stores...</p>
          
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-500">Taking longer than expected?</p>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleRetryStoreLoad}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Retry Loading
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state with recovery options
  if (storeError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Stores</h2>
          <p className="text-slate-600 mb-6">{storeError}</p>
          
          <div className="space-y-3">
            <Button
              onClick={handleRetryStoreLoad}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              Retry
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              Refresh Page
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              leftIcon={<LogOut className="h-4 w-4" />}
              className="w-full"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Only render layout if user is authenticated
  if (!hasValidSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Defensive guard for user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Error</h2>
          <p className="text-slate-600 mb-6">
            User information is missing. Please log in again.
          </p>
          <Button
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }
  
  console.log('✅ MainLayout rendering with user:', user?.email);
  
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-slate-50">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(prev => !prev)} 
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
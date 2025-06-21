import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../shared/contexts/AppContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';

/**
 * Protected route component following Interface Segregation Principle
 * Only handles route protection logic
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresStore?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiresStore = false, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { isAppReady, hasValidSession, hasStores } = useAppContext();
  const navigate = useNavigate();
  
  // CRITICAL FIX: Add direct access to auth store to handle session expiration
  const isAuthInitialized = useAuthStore(state => state.isInitialized);
  const authError = useAuthStore(state => state.error);
  
  // CRITICAL FIX: Add timeout detection for app initialization
  const [initTimeout, setInitTimeout] = useState(false);
  
  // CRITICAL FIX: Handle session expiration
  useEffect(() => {
    if (isAuthInitialized && authError === 'SESSION_EXPIRED') {
      console.log('🔒 ProtectedRoute: Session expired, redirecting to login');
      // Clear localStorage before redirect
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      navigate(fallbackPath, { replace: true });
    }
  }, [isAuthInitialized, authError, navigate, fallbackPath]);
  
  // CRITICAL FIX: Add timeout for app initialization
  useEffect(() => {
    if (!isAppReady) {
      const timeoutId = setTimeout(() => {
        console.log('⚠️ App initialization timeout after 10 seconds');
        setInitTimeout(true);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAppReady]);

  // Show loading while app is initializing
  if (!isAppReady && !initTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // CRITICAL FIX: Show timeout message with recovery options
  if (initTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-amber-800 mb-4">Loading Timeout</h2>
            <p className="text-amber-700 mb-6">
              The application is taking longer than expected to initialize. This may be due to network issues or authentication problems.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  // Clear localStorage and refresh
                  localStorage.removeItem('supabase.auth.token');
                  localStorage.removeItem('currentStoreId');
                  window.location.reload();
                }}
                leftIcon={<RefreshCw className="h-4 w-4" />}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Clear Data & Refresh
              </Button>
              <Button
                onClick={() => navigate(fallbackPath, { replace: true })}
                variant="outline"
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!hasValidSession) {
    console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to={fallbackPath} replace />;
  }

  // If requiresStore is true but user has no stores, we'll still render the children
  // The UI components will handle showing appropriate messages
  if (requiresStore && !hasStores) {
    console.log('⚠️ ProtectedRoute: Store required but none exists - rendering anyway');
  }

  // Render children with error boundary
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
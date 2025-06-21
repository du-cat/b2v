import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  redirectPath?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Global error boundary component
 * Catches unexpected UI crashes and provides recovery options
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary - Full error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    this.setState({ error, errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Send to error tracking service in production
    if (import.meta.env.PROD) {
      this.sendToErrorTracking(error, errorInfo);
    }
    
    // CRITICAL FIX: Clear localStorage on critical errors to prevent infinite loading
    if (error.message.includes('SESSION_EXPIRED') || 
        error.message.includes('auth') || 
        error.message.includes('permission') ||
        error.message.includes('supabase') ||
        error.message.includes('timeout')) {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
    }
  }

  private sendToErrorTracking(error: Error, errorInfo: ErrorInfo) {
    // Implement error tracking service integration here
    console.log('📊 Sending error to tracking service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  private handleRetry = () => {
    // CRITICAL FIX: Clear localStorage before retry
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentStoreId');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    // CRITICAL FIX: Clear localStorage before navigation
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentStoreId');
    window.location.href = '/dashboard';
  };

  private handleRefreshPage = () => {
    // CRITICAL FIX: Clear localStorage before refresh
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentStoreId');
    window.location.reload();
  };

  private handleLogout = () => {
    // Clear any stored session data
    localStorage.removeItem('currentStoreId');
    localStorage.removeItem('supabase.auth.token');
    
    // Redirect to login
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if error is related to session
      const isSessionError = this.state.error?.message?.includes('SESSION_EXPIRED') ||
                            this.state.error?.message?.includes('auth') ||
                            this.state.error?.message?.includes('permission');

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className={`max-w-lg mx-auto border-${isSessionError ? 'amber' : 'red'}-200 bg-${isSessionError ? 'amber' : 'red'}-50`}>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className={`h-16 w-16 bg-${isSessionError ? 'amber' : 'red'}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <AlertTriangle className={`h-8 w-8 text-${isSessionError ? 'amber' : 'red'}-600`} />
                </div>
                <h1 className="text-xl font-semibold text-slate-900 mb-2">
                  {isSessionError ? 'Session Error' : 'Something went wrong'}
                </h1>
                <p className={`text-${isSessionError ? 'amber' : 'red'}-600 mb-4`}>
                  {isSessionError 
                    ? 'Your session has expired or is invalid. Please log in again.'
                    : this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
                </p>
              </div>
              
              <div className="space-y-3">
                {isSessionError ? (
                  <Button
                    onClick={this.handleLogout}
                    leftIcon={<LogOut className="h-4 w-4" />}
                    className={`w-full bg-amber-600 hover:bg-amber-700`}
                  >
                    Log Out & Sign In Again
                  </Button>
                ) : (
                  <Button
                    onClick={this.handleRetry}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                )}
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  leftIcon={<Home className="h-4 w-4" />}
                  className={`w-full border-${isSessionError ? 'amber' : 'red'}-300 text-${isSessionError ? 'amber' : 'red'}-700 hover:bg-${isSessionError ? 'amber' : 'red'}-50`}
                >
                  Go to Dashboard
                </Button>
                
                <Button
                  onClick={this.handleRefreshPage}
                  variant="outline"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  className={`w-full border-${isSessionError ? 'amber' : 'red'}-300 text-${isSessionError ? 'amber' : 'red'}-700 hover:bg-${isSessionError ? 'amber' : 'red'}-50`}
                >
                  Refresh Page
                </Button>
              </div>

              {/* Development Error Details */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className={`cursor-pointer text-sm text-${isSessionError ? 'amber' : 'red'}-700 hover:text-${isSessionError ? 'amber' : 'red'}-800 mb-2`}>
                    Error Details (Development Only)
                  </summary>
                  <div className={`p-3 bg-${isSessionError ? 'amber' : 'red'}-100 rounded text-xs`}>
                    <div className={`font-medium text-${isSessionError ? 'amber' : 'red'}-800 mb-2`}>Error Message:</div>
                    <div className={`text-${isSessionError ? 'amber' : 'red'}-700 mb-3 font-mono`}>{this.state.error.message}</div>
                    
                    <div className={`font-medium text-${isSessionError ? 'amber' : 'red'}-800 mb-2`}>Stack Trace:</div>
                    <pre className={`text-${isSessionError ? 'amber' : 'red'}-600 overflow-auto whitespace-pre-wrap text-xs`}>
                      {this.state.error.stack}
                    </pre>
                    
                    {this.state.errorInfo && (
                      <>
                        <div className={`font-medium text-${isSessionError ? 'amber' : 'red'}-800 mb-2 mt-3`}>Component Stack:</div>
                        <pre className={`text-${isSessionError ? 'amber' : 'red'}-600 overflow-auto whitespace-pre-wrap text-xs`}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for using error handler in functional components
 */
export function useErrorHandler() {
  const navigate = useNavigate();
  
  return {
    handleError: (error: Error, errorInfo?: ErrorInfo) => {
      console.error('🚨 Manual error report:', error);
      
      // CRITICAL FIX: Clear localStorage on critical errors
      if (error.message.includes('SESSION_EXPIRED') || 
          error.message.includes('auth') || 
          error.message.includes('permission') ||
          error.message.includes('supabase') ||
          error.message.includes('timeout')) {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
      }
      
      // Check if it's a session error
      if (error.message.includes('SESSION_EXPIRED') || 
          error.message.includes('auth') || 
          error.message.includes('permission')) {
        // Redirect to login
        navigate('/login');
      }
      
      // In a real app, you might want to trigger the error boundary
      // or send the error to a tracking service
      if (import.meta.env.PROD) {
        // Send to error tracking service
        console.log('📊 Manual error tracking:', { error, errorInfo });
      }
    },
    
    catchAsync: async <T,>(promise: Promise<T>, fallback?: T): Promise<T> => {
      try {
        return await promise;
      } catch (error) {
        console.error('🚨 Async operation failed:', error);
        
        // CRITICAL FIX: Clear localStorage on critical errors
        if ((error as Error).message.includes('SESSION_EXPIRED') || 
            (error as Error).message.includes('auth') || 
            (error as Error).message.includes('permission') ||
            (error as Error).message.includes('supabase') ||
            (error as Error).message.includes('timeout')) {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('currentStoreId');
        }
        
        // Check if it's a session error
        if ((error as Error).message.includes('SESSION_EXPIRED') || 
            (error as Error).message.includes('auth') || 
            (error as Error).message.includes('permission')) {
          // Redirect to login
          navigate('/login');
        }
        
        if (fallback !== undefined) {
          return fallback;
        }
        throw error;
      }
    }
  };
}
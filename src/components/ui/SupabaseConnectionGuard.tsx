import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Wifi, WifiOff, Key } from 'lucide-react';
import { useSupabaseConnectionStatus } from '../../hooks/useSupabaseConnectionStatus';
import { getEnvironmentGuidance, hasPlaceholderValues } from '../../lib/envCheck';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { ErrorBoundary } from '../ErrorBoundary';
import { EnvDebugPanel } from './EnvDebugPanel';

interface SupabaseConnectionGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export function SupabaseConnectionGuard({ 
  children, 
  fallbackComponent 
}: SupabaseConnectionGuardProps) {
  const connectionStatus = useSupabaseConnectionStatus();
  const hasPlaceholders = hasPlaceholderValues();
  const [retryCount, setRetryCount] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  // CRITICAL FIX: Add timeout detection for connection check
  useEffect(() => {
    if (connectionStatus.isConnecting) {
      const timeoutId = setTimeout(() => {
        if (connectionStatus.isConnecting) {
          console.error('❌ Connection check timed out after 10 seconds');
          setTimeoutOccurred(true);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [connectionStatus.isConnecting]);

  // Show loading state while checking connection
  if (connectionStatus.isConnecting && !timeoutOccurred) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking Supabase connection...</p>
          
          {/* CRITICAL FIX: Add timeout message */}
          <p className="text-sm text-slate-500 mt-4">
            If this takes too long, try refreshing the page
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Show error state if connection failed or timeout occurred
  if (!connectionStatus.isReady || timeoutOccurred) {
    const guidance = getEnvironmentGuidance();
    
    const handleRetry = () => {
      setRetryCount(prev => prev + 1);
      setTimeoutOccurred(false);
      connectionStatus.retry();
    };
    
    return fallbackComponent || (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                    {hasPlaceholders ? (
                      <Key className="h-8 w-8 text-red-600" />
                    ) : connectionStatus.hasValidEnv ? (
                      <WifiOff className="h-8 w-8 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-red-800 mb-2">
                  {hasPlaceholders 
                    ? 'Supabase Credentials Required' 
                    : timeoutOccurred
                      ? 'Connection Timeout'
                      : connectionStatus.hasValidEnv 
                        ? 'Connection Failed' 
                        : 'Configuration Required'
                  }
                </h1>
                
                <p className="text-red-600 mb-4">
                  {hasPlaceholders 
                    ? 'Please replace the placeholder values in your .env file with your actual Supabase credentials'
                    : timeoutOccurred
                      ? 'Connection check timed out. Please check your network and Supabase configuration.'
                      : connectionStatus.connectionError || 'Unable to connect to Supabase'
                  }
                </p>
              </div>

              {/* Placeholder Values Warning */}
              {hasPlaceholders && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Placeholder Values Detected
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Your .env file contains placeholder values that need to be replaced with your actual Supabase credentials.
                  </p>
                  <div className="text-xs text-amber-600 bg-amber-100 p-2 rounded">
                    <p className="font-medium mb-1">Current placeholder values:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>VITE_SUPABASE_URL=https://xyzcompany.supabase.co</li>
                      <li>VITE_SUPABASE_ANON_KEY=your-anon-key-here</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Environment Validation Errors */}
              {!connectionStatus.hasValidEnv && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Environment Issues
                  </h3>
                  <ul className="space-y-1 text-sm text-red-700">
                    {connectionStatus.envValidation.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CRITICAL FIX: Add localStorage corruption check */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Potential LocalStorage Issues
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  Your browser's localStorage may contain corrupted authentication data.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('supabase.auth.token');
                    localStorage.removeItem('currentStoreId');
                    window.location.reload();
                  }}
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                >
                  Clear LocalStorage & Refresh
                </Button>
              </div>

              {/* Setup Instructions */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-red-200">
                <h3 className="font-semibold text-slate-800 mb-3">Setup Instructions</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</div>
                    <div>
                      <p className="font-medium text-slate-700">Go to Supabase Dashboard</p>
                      <p className="text-slate-600">Visit https://app.supabase.com/ and sign in</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</div>
                    <div>
                      <p className="font-medium text-slate-700">Get Your Credentials</p>
                      <p className="text-slate-600">Select your project → Settings → API</p>
                      <p className="text-slate-600">Copy your Project URL and anon/public key</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</div>
                    <div>
                      <p className="font-medium text-slate-700">Update Your .env File</p>
                      <div className="mt-2 p-3 bg-slate-100 rounded font-mono text-xs">
                        <p>VITE_SUPABASE_URL=https://yiqckoncbxejdrpqymso.supabase.co</p>
                        <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWNrb25jYnhlamRycHF5bXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDQwODgsImV4cCI6MjA2NDM4MDA4OH0.CJexX4v1WvcV_w7m2q73C0mRH4QkzGtOmKkwoufOI3A</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">4</div>
                    <div>
                      <p className="font-medium text-slate-700">Restart Development Server</p>
                      <p className="text-slate-600">Run <code className="bg-slate-200 px-1 rounded">npm run dev</code> to reload with new credentials</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleRetry}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  className="bg-red-600 hover:bg-red-700"
                  isLoading={connectionStatus.isConnecting}
                >
                  {retryCount > 0 ? `Retry Connection (${retryCount})` : 'Retry Connection'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open('https://app.supabase.com/', '_blank')}
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Open Supabase Dashboard
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Refresh Page
                </Button>
              </div>

              {/* Connection Status */}
              <div className="mt-6 pt-4 border-t border-red-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Connection Status:</span>
                  <div className="flex items-center space-x-2">
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 font-medium">
                      {hasPlaceholders ? 'Placeholder Values' : 
                       timeoutOccurred ? 'Connection Timeout' :
                       connectionStatus.hasValidEnv ? 'Connection Failed' : 'Not Configured'}
                    </span>
                  </div>
                </div>
                
                {connectionStatus.lastChecked && (
                  <div className="flex items-center justify-between text-xs text-red-500 mt-1">
                    <span>Last checked:</span>
                    <span>{connectionStatus.lastChecked.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Debug Panel Toggle */}
              <div className="mt-4 text-center">
                <button 
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
                </button>
              </div>

              {/* Debug Panel */}
              {showDebugPanel && <EnvDebugPanel />}

              {/* Development Info */}
              {import.meta.env.DEV && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-red-600 hover:text-red-800">
                    Debug Information (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded text-red-800">
                    <div className="space-y-1">
                      <div>Environment: {import.meta.env.MODE}</div>
                      <div>URL Defined: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
                      <div>Key Defined: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
                      <div>Has Placeholders: {hasPlaceholders ? '⚠️ Yes' : '✅ No'}</div>
                      <div>Has Valid Env: {connectionStatus.hasValidEnv ? '✅' : '❌'}</div>
                      <div>Is Ready: {connectionStatus.isReady ? '✅' : '❌'}</div>
                      <div>Retry Count: {retryCount}</div>
                      <div>Timeout Occurred: {timeoutOccurred ? '⚠️ Yes' : '✅ No'}</div>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Connection is ready, render children
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
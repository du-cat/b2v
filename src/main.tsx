import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { EnvErrorScreen } from './components/EnvErrorScreen';
import { EnvConfigError } from './lib/config';

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}

// Import config to trigger validation
try {
  // This import will throw if environment variables are missing
  import('./lib/config');
} catch (err) {
  console.error('Environment configuration error:', err);
}

// Enhanced global error handlers
window.addEventListener('error', (event) => {
  console.error('🚨 Global JavaScript Error:', {
    message: event.error?.message || event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
});

// Enhanced error boundary with better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary - Full error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-600 mb-4">
                <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-red-800 mb-2">
                Application Error
              </h1>
              <p className="text-red-600 mb-4">
                {this.state.error?.message || 'Something went wrong. Please refresh the page to try again.'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    // CRITICAL FIX: Clear localStorage on error to prevent infinite loading
                    localStorage.removeItem('supabase.auth.token');
                    localStorage.removeItem('currentStoreId');
                    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                  }}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    // CRITICAL FIX: Clear localStorage before reload
                    localStorage.removeItem('supabase.auth.token');
                    localStorage.removeItem('currentStoreId');
                    window.location.reload();
                  }}
                  className="w-full bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded text-xs">
                    <div className="font-medium text-red-800 mb-2">Error Message:</div>
                    <div className="text-red-700 mb-3">{this.state.error.message}</div>
                    
                    <div className="font-medium text-red-800 mb-2">Stack Trace:</div>
                    <pre className="text-red-600 overflow-auto whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                    
                    {this.state.errorInfo && (
                      <>
                        <div className="font-medium text-red-800 mb-2 mt-3">Component Stack:</div>
                        <pre className="text-red-600 overflow-auto whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Ensure DOM element exists with better error handling
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('🚨 Critical Error: Root element not found!');
  
  // Create emergency fallback UI
  document.body.innerHTML = `
    <div style="
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #dc2626; margin-bottom: 16px; font-size: 24px;">Critical Application Error</h1>
        <p style="margin-bottom: 16px;">The application root element is missing from the HTML.</p>
        <p style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
          This usually indicates a build or deployment issue.
        </p>
        <button onclick="window.location.reload()" style="
          background-color: #dc2626; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          cursor: pointer;
          font-size: 16px;
        ">
          Refresh Page
        </button>
      </div>
    </div>
  `;
  throw new Error('Root element not found. Make sure index.html has a div with id="root"');
}

// Create and render the app with comprehensive error handling
try {
  console.log('🚀 SentinelPOS Guardian initializing...');
  
  // CRITICAL FIX: Clear potentially corrupted localStorage data on startup
  try {
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      try {
        JSON.parse(storedSession); // Test if valid JSON
      } catch (e) {
        console.error('❌ Corrupted session data detected in localStorage, clearing...');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
      }
    }
  } catch (e) {
    console.error('❌ Error accessing localStorage:', e);
  }
  
  console.log('📊 Environment Check:', {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    supabase_url_defined: !!import.meta.env.VITE_SUPABASE_URL,
    supabase_key_defined: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    opencage_key_defined: !!import.meta.env.VITE_OPENCAGE_API_KEY,
    firebase_config_defined: !!import.meta.env.VITE_FIREBASE_API_KEY,
    root_element_found: !!rootElement
  });

  const root = createRoot(rootElement);

  // Render the app with error handling
  try {
    // Import config will throw EnvConfigError if environment variables are missing
    import('./lib/config')
      .then(() => {
        // Environment is valid, render the app
        root.render(
          <StrictMode>
            <ErrorBoundary>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ErrorBoundary>
          </StrictMode>
        );
        console.log('✅ SentinelPOS Guardian rendered successfully with BrowserRouter');
      })
      .catch((err) => {
        // Handle environment configuration errors
        if (err instanceof EnvConfigError) {
          console.error('❌ Environment configuration error:', err.message);
          root.render(
            <StrictMode>
              <EnvErrorScreen missing={err.missingKeys} />
            </StrictMode>
          );
        } else {
          // Re-throw other errors
          console.error('❌ Unexpected error during initialization:', err);
          throw err;
        }
      });
  } catch (err) {
    // Catch synchronous errors
    if (err instanceof EnvConfigError) {
      console.error('❌ Environment configuration error:', err.message);
      root.render(
        <StrictMode>
          <EnvErrorScreen missing={err.missingKeys} />
        </StrictMode>
      );
    } else {
      // Re-throw other errors
      console.error('❌ Unexpected error during initialization:', err);
      throw err;
    }
  }
} catch (error) {
  console.error('🚨 Critical Error during app initialization:', error);
  
  // Emergency fallback rendering
  rootElement.innerHTML = `
    <div style="
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #dc2626; margin-bottom: 16px; font-size: 24px;">Application Initialization Failed</h1>
        <p style="margin-bottom: 16px;">Failed to start the application.</p>
        <p style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
          Error: ${(error as Error).message}
        </p>
        <button onclick="localStorage.removeItem('supabase.auth.token'); localStorage.removeItem('currentStoreId'); window.location.reload();" style="
          background-color: #dc2626; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          cursor: pointer;
          font-size: 16px;
        ">
          Clear Data & Refresh
        </button>
      </div>
    </div>
  `;
}

// Development helpers
if (import.meta.env.DEV) {
  console.log('🔧 Development Mode Active');
  console.log('🌐 Environment Variables:', {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    OPENCAGE_KEY: import.meta.env.VITE_OPENCAGE_API_KEY ? '✅ Set' : '❌ Missing',
    FIREBASE_CONFIG: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  });
  
  // Add development debugging helpers to window
  (window as any).__SENTINELPOS_DEBUG__ = {
    version: '1.0.0',
    environment: import.meta.env.MODE,
    buildTime: new Date().toISOString(),
    hasSupabaseConfig: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    hasOpenCageConfig: !!import.meta.env.VITE_OPENCAGE_API_KEY,
    hasFirebaseConfig: !!import.meta.env.VITE_FIREBASE_API_KEY,
    clearLocalStorage: () => {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      console.log('✅ Cleared localStorage');
    }
  };
}
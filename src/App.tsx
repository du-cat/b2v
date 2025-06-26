import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppProvider } from './shared/contexts/AppContext';
import { SupabaseConnectionGuard } from './components/ui/SupabaseConnectionGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Suspense, lazy, useEffect, useState } from 'react';
import { validateEnvironment } from './lib/envCheck';
import { EnvironmentSetupGuide } from './components/ui/EnvironmentSetupGuide';

// Auth pages - imported directly for faster loading
import Login from './pages/Login';
import Signup from './pages/Signup';
import StoreSetup from './pages/StoreSetup';
import Dashboard from './pages/Dashboard';

// Lazy-loaded pages with error boundaries
const Events = lazy(() => import('./pages/Events'));
const Rules = lazy(() => import('./pages/Rules'));
const Reports = lazy(() => import('./pages/Reports'));
const Devices = lazy(() => import('./pages/Devices'));
const Cameras = lazy(() => import('./pages/Cameras'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const EventSimulator = lazy(() => import('./pages/EventSimulator'));
const TestingDashboard = lazy(() => import('./pages/TestingDashboard'));
const RLSDiagnostics = lazy(() => import('./pages/RLSDiagnostics'));
const Integrations = lazy(() => import('./pages/Integrations'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Lazy-loaded integration wizard
const IntegrationWizard = lazy(() => import('./components/integrations/IntegrationWizard').then(module => ({ default: module.IntegrationWizard })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const [isEnvValid, setIsEnvValid] = useState(true);
  
  // Check environment variables on mount
  useEffect(() => {
    const envValidation = validateEnvironment();
    setIsEnvValid(envValidation.isValid);
    
    if (!envValidation.isValid) {
      console.error('❌ Environment validation failed:', envValidation.errors);
    } else {
      console.log('✅ Environment validation passed');
    }
  }, []);
  
  // If environment variables are invalid, show setup guide
  if (!isEnvValid) {
    return <EnvironmentSetupGuide />;
  }
  
  console.log('✅ App rendering with new architecture and error boundaries...');
  
  return (
    <ErrorBoundary>
      <SupabaseConnectionGuard>
        <AppProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={
              <ErrorBoundary>
                <Login />
              </ErrorBoundary>
            } />
            <Route path="/signup" element={
              <ErrorBoundary>
                <Signup />
              </ErrorBoundary>
            } />
            
            {/* Protected routes with layout */}
            <Route path="/" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              </ErrorBoundary>
            }>
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Store setup - doesn't require existing store */}
              <Route path="setup" element={
                <ErrorBoundary>
                  <StoreSetup />
                </ErrorBoundary>
              } />
              
              {/* Routes that work with or without a store */}
              <Route path="dashboard" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="events" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Events />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="rules" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Rules />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="reports" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Reports />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="devices" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Devices />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="cameras" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Cameras />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="simulator" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <EventSimulator />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Integrations routes */}
              <Route path="integrations" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Integrations />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="integrations/:providerId/setup" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <IntegrationWizard />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Utility routes - don't require store */}
              <Route path="notifications" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Notifications />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path="testing" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <TestingDashboard />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path="rls-diagnostics" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RLSDiagnostics />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path="settings/*" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Settings />
                  </Suspense>
                </ErrorBoundary>
              } />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <NotFound />
                </Suspense>
              </ErrorBoundary>
            } />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </AppProvider>
      </SupabaseConnectionGuard>
    </ErrorBoundary>
  );
}

export default App;
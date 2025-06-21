import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Loader, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { testSupabaseConnection } from '../../lib/supabase';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // Test Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔄 Testing Supabase connection from login form...');
      
      try {
        const isConnected = await testSupabaseConnection();
        setConnectionStatus(isConnected ? 'connected' : 'failed');
        
        if (!isConnected) {
          toast.error('Unable to connect to authentication service. Please check your internet connection.');
        }
      } catch (error) {
        console.error('❌ Connection test failed:', error);
        setConnectionStatus('failed');
        toast.error('Connection test failed. Please refresh the page and try again.');
      }
    };

    checkConnection();
  }, []);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowError(false);
    
    console.log('🔄 Login form submitted:', { 
      email, 
      password: '***',
      connectionStatus,
      timestamp: new Date().toISOString()
    });
    
    // Validate connection before attempting login
    if (connectionStatus === 'failed') {
      toast.error('Cannot login: No connection to authentication service');
      return;
    }
    
    if (!email || !password) {
      setShowError(true);
      console.log('❌ Validation failed: missing email or password');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      console.log('🔄 Calling login function...');
      
      // Test connection again before login attempt
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        throw new Error('Lost connection to authentication service. Please check your internet connection and try again.');
      }
      
      await login(email, password);
      console.log('✅ Login successful, navigating to dashboard...');
      
      // Show success message
      toast.success('Login successful! Welcome back.');
      
      // Redirect to dashboard on successful login
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Login failed:', {
        error: err,
        message: (err as Error).message,
        name: (err as Error).name
      });
      
      // Enhanced error handling with user-friendly messages
      const errorMessage = (err as Error).message;
      
      if (errorMessage.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('Email not confirmed')) {
        toast.error('Please check your email and click the confirmation link before logging in.');
      } else if (errorMessage.includes('Too many requests')) {
        toast.error('Too many login attempts. Please wait a few minutes and try again.');
      } else if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
        toast.error('Network error: Please check your internet connection and try again.');
      } else if (errorMessage.includes('CORS')) {
        toast.error('Configuration error: Please contact support if this persists.');
      } else if (errorMessage.includes('timeout')) {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error(`Login failed: ${errorMessage}`);
      }
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500" />;
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Checking connection...';
      case 'connected':
        return 'Connected to authentication service';
      case 'failed':
        return 'Connection failed - check internet connection';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'text-blue-600';
      case 'connected':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Shield className="h-12 w-12 text-teal-600" />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">
            Sign in to SentinelPOS Guardian
          </h2>

          {/* Connection Status */}
          <div className={`mb-4 p-3 rounded-md border ${
            connectionStatus === 'connected' ? 'bg-green-50 border-green-200' :
            connectionStatus === 'failed' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <span className={`text-sm font-medium ${getConnectionColor()}`}>
                {getConnectionText()}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Login Failed</p>
                <p>{error}</p>
                {error.includes('Network') && (
                  <div className="mt-2 text-xs">
                    <p>Troubleshooting steps:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your internet connection</li>
                      <li>Try refreshing the page</li>
                      <li>Disable VPN if using one</li>
                      <li>Check if your firewall is blocking the connection</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="you@example.com"
                required
                disabled={connectionStatus === 'failed'}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-500">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="••••••••"
                required
                disabled={connectionStatus === 'failed'}
              />
            </div>
            
            {showError && !email && !password && (
              <div className="text-sm text-red-600">
                Please enter your email and password.
              </div>
            )}
            
            <div>
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                isLoading={isLoading}
                disabled={isLoading || connectionStatus === 'failed'}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Don't have an account?</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link
                to="/signup"
                className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Create an account
              </Link>
            </div>
          </div>

          {/* Debug Information (only in development) */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-3 bg-slate-50 rounded-md">
              <h4 className="text-xs font-medium text-slate-700 mb-2">Debug Info (Dev Only)</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <p>Environment: {import.meta.env.MODE}</p>
                <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
                <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
                <p>Connection: {connectionStatus}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
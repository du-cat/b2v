import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { signup, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // Test Supabase connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error('Supabase connection error:', error);
        } else {
          console.log('Supabase connection successful');
        }
      } catch (err) {
        console.error('Failed to test Supabase connection:', err);
      }
    };

    testConnection();
  }, []);
  
  const validateForm = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setValidationError('All fields are required');
      return false;
    }
    
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    setValidationError('');
    return true;
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await signup(email, password, fullName);
      
      // Show success message and redirect to dashboard
      toast.success('Welcome! Your account and first store are ready.');
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = (err as Error).message;
      
      // Show user-friendly error messages
      if (errorMessage.includes('already exists')) {
        toast.error('An account with this email already exists. Please try logging in instead.');
      } else if (errorMessage.includes('session')) {
        toast.error('Account created but there was an issue with automatic login. Please try logging in.');
      } else {
        toast.error(`Signup failed: ${errorMessage}`);
      }
    }
  };
  
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Shield className="h-12 w-12 text-teal-600" />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome to SentinelPOS Guardian!
            </h2>
            <p className="text-slate-600 mb-4">
              Your account has been created successfully and your first store is ready to use.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-green-800">
                ✅ Account created<br />
                ✅ Default store configured<br />
                ✅ Security monitoring activated
              </p>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Redirecting you to your dashboard...
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Shield className="h-12 w-12 text-teal-600" />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-6">
            <Link to="/login" className="text-teal-600 hover:text-teal-700 mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-slate-900">
              Create your account
            </h2>
          </div>
          
          {/* Info banner about automatic store creation */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Quick Start Included</p>
                <p>We'll automatically create your first store so you can start monitoring right away.</p>
              </div>
            </div>
          </div>
          
          {(error || validationError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error || validationError}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="John Doe"
                required
              />
            </div>
            
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
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 8 characters.
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div>
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account & first store'}
              </Button>
            </div>
          </form>
          
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
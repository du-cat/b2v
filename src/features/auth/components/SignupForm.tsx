import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/AuthStore';
import { Button } from '../../../components/ui/Button';
import type { SignupData } from '../types';

/**
 * Pure UI component for signup form
 * CRITICAL: No direct Supabase calls - only uses store actions
 */
export function SignupForm() {
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    fullName: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // IMPORTANT: Only subscribe to specific store slices to prevent unnecessary re-renders
  const signup = useAuthStore(state => state.signup);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  
  const navigate = useNavigate();
  
  const validateForm = () => {
    if (!signupData.fullName || !signupData.email || !signupData.password || !confirmPassword) {
      setValidationError('All fields are required');
      return false;
    }
    
    if (signupData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }
    
    if (signupData.password !== confirmPassword) {
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
      // CRITICAL: Only call store action, never direct API calls
      await signup(signupData);
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      // Error handling is done in the store
      console.error('Signup failed:', error);
    }
  };

  const handleInputChange = (field: keyof SignupData | 'confirmPassword', value: string) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setSignupData(prev => ({ ...prev, [field]: value }));
    }
    if (validationError) setValidationError('');
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
                value={signupData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={signupData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={signupData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="••••••••"
                required
                disabled={isLoading}
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
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="••••••••"
                required
                disabled={isLoading}
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
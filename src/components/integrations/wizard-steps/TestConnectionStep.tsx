import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface TestConnectionStepProps {
  provider: any;
  stepData: Record<string, any>;
  onNext: (data?: Record<string, any>) => void;
}

export function TestConnectionStep({ provider, stepData, onNext }: TestConnectionStepProps) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Start testing connection when component mounts
  useEffect(() => {
    testConnection();
  }, []);
  
  const testConnection = async () => {
    setStatus('testing');
    setMessage('Testing connection...');
    
    try {
      // In a real implementation, this would call your API to test the connection
      // For this example, we'll simulate a successful connection after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success (90% of the time)
      if (Math.random() > 0.1) {
        setStatus('success');
        setMessage(`Successfully connected to ${provider.label}!`);
        
        // Automatically proceed to next step after a short delay
        setTimeout(() => {
          onNext();
        }, 1500);
      } else {
        // Simulate error
        throw new Error(`Could not connect to ${provider.label}. Please check your credentials and try again.`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus('error');
      setMessage((error as Error).message);
    }
  };
  
  const handleRetry = () => {
    setIsRetrying(true);
    testConnection();
    setIsRetrying(false);
  };
  
  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${
        status === 'testing' ? 'bg-blue-50 border border-blue-200' :
        status === 'success' ? 'bg-green-50 border border-green-200' :
        status === 'error' ? 'bg-red-50 border border-red-200' :
        'bg-slate-50 border border-slate-200'
      }`}>
        <div className="flex items-center">
          {status === 'testing' && (
            <div className="mr-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mr-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="mr-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          )}
          
          <div>
            <h3 className={`text-lg font-medium ${
              status === 'testing' ? 'text-blue-800' :
              status === 'success' ? 'text-green-800' :
              status === 'error' ? 'text-red-800' :
              'text-slate-800'
            }`}>
              {status === 'testing' ? 'Testing Connection' :
               status === 'success' ? 'Connection Successful' :
               status === 'error' ? 'Connection Failed' :
               'Ready to Test'}
            </h3>
            <p className={`mt-1 ${
              status === 'testing' ? 'text-blue-600' :
              status === 'success' ? 'text-green-600' :
              status === 'error' ? 'text-red-600' :
              'text-slate-600'
            }`}>
              {message}
            </p>
          </div>
        </div>
      </div>
      
      {status === 'error' && (
        <div className="flex justify-center">
          <Button
            onClick={handleRetry}
            isLoading={isRetrying}
            disabled={isRetrying}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Retry Connection
          </Button>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center text-green-600">
          <p>Proceeding to next step...</p>
        </div>
      )}
    </div>
  );
}
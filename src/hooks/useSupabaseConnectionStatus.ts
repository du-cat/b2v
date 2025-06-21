import { useState, useEffect } from 'react';
import { validateEnvironment, type EnvValidationResult } from '../lib/envCheck';
import { testSupabaseConnection } from '../lib/supabase';

export interface SupabaseConnectionStatus {
  isReady: boolean;
  hasValidEnv: boolean;
  connectionError: string | null;
  envValidation: EnvValidationResult;
  isConnecting: boolean;
  lastChecked: Date | null;
}

export function useSupabaseConnectionStatus() {
  const [status, setStatus] = useState<SupabaseConnectionStatus>({
    isReady: false,
    hasValidEnv: false,
    connectionError: null,
    envValidation: { isValid: false, errors: [], warnings: [] },
    isConnecting: true,
    lastChecked: null,
  });

  const checkConnection = async () => {
    console.log('🔄 Checking Supabase connection status...');
    
    setStatus(prev => ({ ...prev, isConnecting: true, connectionError: null }));
    
    try {
      // Step 1: Validate environment
      const envValidation = validateEnvironment();
      
      if (!envValidation.isValid) {
        setStatus({
          isReady: false,
          hasValidEnv: false,
          connectionError: 'Invalid environment configuration',
          envValidation,
          isConnecting: false,
          lastChecked: new Date(),
        });
        return;
      }
      
      // Step 2: Test actual connection
      const connectionSuccess = await testSupabaseConnection();
      
      if (connectionSuccess) {
        console.log('✅ Supabase connection check passed');
        setStatus({
          isReady: true,
          hasValidEnv: true,
          connectionError: null,
          envValidation,
          isConnecting: false,
          lastChecked: new Date(),
        });
      } else {
        throw new Error('Connection test failed');
      }
      
    } catch (error) {
      console.error('❌ Supabase connection check failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown connection error';
      
      setStatus(prev => ({
        ...prev,
        isReady: false,
        connectionError: errorMessage,
        isConnecting: false,
        lastChecked: new Date(),
      }));
    }
  };

  // Initial check on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const retry = () => {
    checkConnection();
  };

  return {
    ...status,
    retry,
    checkConnection,
  };
}
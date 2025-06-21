import { useState } from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { validateEnvironment } from '../../lib/envCheck';
import { testSupabaseConnection } from '../../lib/supabase';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function EnvDebugPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<{
    envValid: boolean;
    supabaseUrl: string | undefined;
    supabaseKey: string | undefined;
    connectionTest: boolean;
    errors: string[];
  } | null>(null);

  const runDiagnostics = async () => {
    setIsChecking(true);
    
    try {
      // Check environment variables
      const envValidation = validateEnvironment();
      
      // Test Supabase connection
      const connectionTest = await testSupabaseConnection();
      
      setResults({
        envValid: envValidation.isValid,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + '...',
        connectionTest,
        errors: envValidation.errors
      });
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-700">Environment Diagnostics</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostics}
            isLoading={isChecking}
            leftIcon={isChecking ? undefined : <RefreshCw className="h-3 w-3" />}
          >
            {isChecking ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
        
        {results && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Environment Valid:</span>
              <span className="flex items-center">
                {results.envValid ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">Valid</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">Invalid</span>
                  </>
                )}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Supabase URL:</span>
              <span className="font-mono">{results.supabaseUrl || 'Not set'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Supabase Key:</span>
              <span className="font-mono">{results.supabaseKey || 'Not set'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Connection Test:</span>
              <span className="flex items-center">
                {results.connectionTest ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">Successful</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">Failed</span>
                  </>
                )}
              </span>
            </div>
            
            {results.errors.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                <div className="flex items-center mb-1">
                  <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">Errors:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-red-600">
                  {results.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
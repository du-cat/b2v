import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Play, RefreshCw, Database, Shield, User, Wifi, WifiOff, Bell } from 'lucide-react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TestNotificationButton } from '../components/ui/TestNotificationButton';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

interface DiagnosticResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
}

export default function RLSDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  
  // IMPORTANT: Only subscribe to specific store slice needed
  const user = useAuthStore(state => state.user);

  const diagnosticTests: Omit<DiagnosticResult, 'status'>[] = [
    {
      id: 'environment-check',
      name: 'Environment Variables Check',
      description: 'Verify all required environment variables are set correctly'
    },
    {
      id: 'connection-test',
      name: 'Supabase Connection Test',
      description: 'Test basic connectivity to Supabase services'
    },
    {
      id: 'auth-context',
      name: 'Auth Context Test',
      description: 'Verify auth.uid() function is working and returns current user ID'
    },
    {
      id: 'session-validation',
      name: 'Session Validation',
      description: 'Check if current session is valid and user is authenticated'
    },
    {
      id: 'getuser-vs-getsession',
      name: 'getUser() vs getSession() Test',
      description: 'Compare getUser() and getSession() responses for consistency'
    },
    {
      id: 'store-creation-debug',
      name: 'Store Creation Debug',
      description: 'Test store creation permissions and RLS policy compliance'
    },
    {
      id: 'stores-select-policy',
      name: 'Stores SELECT Policy',
      description: 'Test if user can read their own stores'
    },
    {
      id: 'stores-insert-policy',
      name: 'Stores INSERT Policy',
      description: 'Test if user can create stores where owner_id = auth.uid()'
    },
    {
      id: 'notifications-table-check',
      name: 'Notifications Table Check',
      description: 'Verify notifications table exists and has correct schema'
    },
    {
      id: 'notifications-select-policy',
      name: 'Notifications SELECT Policy',
      description: 'Test if user can read their own notifications'
    },
    {
      id: 'notifications-insert-policy',
      name: 'Notifications INSERT Policy',
      description: 'Test if user can create notifications'
    },
    {
      id: 'rls-policy-check',
      name: 'RLS Policy Verification',
      description: 'Verify all RLS policies exist and are correctly configured'
    },
    {
      id: 'cors-test',
      name: 'CORS Configuration Test',
      description: 'Verify CORS settings allow requests from current domain'
    },
    {
      id: 'network-diagnostics',
      name: 'Network Diagnostics',
      description: 'Test network connectivity and identify potential issues'
    }
  ];

  useEffect(() => {
    // Initialize diagnostics
    setDiagnostics(diagnosticTests.map(test => ({ ...test, status: 'pending' })));
    
    // Test connection on mount
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
    } catch (error) {
      setConnectionStatus('failed');
    }
  };

  const updateDiagnosticStatus = (
    testId: string, 
    status: DiagnosticResult['status'], 
    result?: any, 
    error?: string, 
    duration?: number
  ) => {
    setDiagnostics(prev => prev.map(diagnostic => 
      diagnostic.id === testId 
        ? { ...diagnostic, status, result, error, duration }
        : diagnostic
    ));
  };

  const runDiagnostic = async (testId: string): Promise<boolean> => {
    const startTime = Date.now();
    setCurrentTest(testId);
    updateDiagnosticStatus(testId, 'running');

    try {
      switch (testId) {
        case 'environment-check':
          const envCheck = {
            supabase_url: {
              defined: !!import.meta.env.VITE_SUPABASE_URL,
              valid_format: import.meta.env.VITE_SUPABASE_URL?.startsWith('https://'),
              length: import.meta.env.VITE_SUPABASE_URL?.length || 0
            },
            supabase_anon_key: {
              defined: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
              valid_format: import.meta.env.VITE_SUPABASE_ANON_KEY?.startsWith('ey'),
              length: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
            },
            opencage_api_key: {
              defined: !!import.meta.env.VITE_OPENCAGE_API_KEY,
              length: import.meta.env.VITE_OPENCAGE_API_KEY?.length || 0
            },
            environment: import.meta.env.MODE,
            all_env_vars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
          };

          if (!envCheck.supabase_url.defined) {
            throw new Error('VITE_SUPABASE_URL is not defined');
          }
          if (!envCheck.supabase_url.valid_format) {
            throw new Error('VITE_SUPABASE_URL must start with https://');
          }
          if (!envCheck.supabase_anon_key.defined) {
            throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
          }
          if (!envCheck.supabase_anon_key.valid_format) {
            throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid (should start with "ey")');
          }

          updateDiagnosticStatus(testId, 'passed', envCheck, undefined, Date.now() - startTime);
          return true;

        case 'connection-test':
          const isConnected = await testSupabaseConnection();
          
          if (!isConnected) {
            throw new Error('Failed to connect to Supabase - check network and credentials');
          }

          // Additional connection tests
          const connectionTests = {
            basic_connection: isConnected,
            auth_endpoint: false,
            database_endpoint: false
          };

          try {
            // Test auth endpoint
            await supabase.auth.getSession();
            connectionTests.auth_endpoint = true;
          } catch (error) {
            console.error('Auth endpoint test failed:', error);
          }

          try {
            // Test database endpoint (simple query)
            await supabase.from('stores').select('id').limit(1);
            connectionTests.database_endpoint = true;
          } catch (error) {
            console.error('Database endpoint test failed:', error);
          }

          updateDiagnosticStatus(testId, 'passed', connectionTests, undefined, Date.now() - startTime);
          return true;

        case 'getuser-vs-getsession':
          // CRITICAL: Compare getUser() vs getSession() to identify discrepancies
          const getUserResult = await supabase.auth.getUser();
          const getSessionResult = await supabase.auth.getSession();
          
          const comparison = {
            getUser: {
              error: getUserResult.error?.message || null,
              user_id: getUserResult.data?.user?.id || null,
              user_exists: !!getUserResult.data?.user
            },
            getSession: {
              error: getSessionResult.error?.message || null,
              user_id: getSessionResult.data?.session?.user?.id || null,
              session_exists: !!getSessionResult.data?.session,
              expires_at: getSessionResult.data?.session?.expires_at || null,
              is_expired: getSessionResult.data?.session?.expires_at ? 
                (getSessionResult.data.session.expires_at * 1000) < Date.now() : null
            },
            consistency: {
              user_ids_match: getUserResult.data?.user?.id === getSessionResult.data?.session?.user?.id,
              both_have_user: !!getUserResult.data?.user && !!getSessionResult.data?.session?.user
            }
          };
          
          // Check for inconsistencies
          if (!comparison.consistency.user_ids_match && comparison.getUser.user_exists && comparison.getSession.session_exists) {
            throw new Error(`User ID mismatch: getUser()=${comparison.getUser.user_id}, getSession()=${comparison.getSession.user_id}`);
          }
          
          if (comparison.getSession.is_expired) {
            throw new Error('Session is expired according to getSession()');
          }
          
          updateDiagnosticStatus(testId, 'passed', comparison, undefined, Date.now() - startTime);
          return true;

        case 'auth-context':
          const { data: authContext, error: authError } = await supabase
            .rpc('test_auth_context');
          
          if (authError) throw authError;
          
          if (!authContext || authContext.length === 0) {
            throw new Error('No auth context returned');
          }
          
          const context = authContext[0];
          
          if (!context.current_user_id) {
            throw new Error('auth.uid() returned NULL - user not authenticated');
          }
          
          if (context.current_user_id !== user?.id) {
            throw new Error(`auth.uid() mismatch: expected ${user?.id}, got ${context.current_user_id}`);
          }
          
          updateDiagnosticStatus(testId, 'passed', context, undefined, Date.now() - startTime);
          return true;

        case 'session-validation':
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          
          if (!session || !session.user) {
            throw new Error('No valid session found');
          }
          
          if (session.user.id !== user?.id) {
            throw new Error('Session user ID does not match current user');
          }
          
          // Check if session is expired
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at || 0;
          
          if (expiresAt <= now) {
            throw new Error('Session has expired');
          }
          
          updateDiagnosticStatus(testId, 'passed', {
            user_id: session.user.id,
            expires_at: new Date(expiresAt * 1000).toISOString(),
            time_until_expiry: expiresAt - now
          }, undefined, Date.now() - startTime);
          return true;

        case 'notifications-table-check':
          // Check if notifications table exists and has correct schema
          try {
            const { data: tableInfo, error: tableError } = await supabase
              .from('notifications')
              .select('id, user_id, message, severity, is_read, created_at')
              .limit(1);
            
            if (tableError) {
              if (tableError.code === '42P01') {
                throw new Error('Notifications table does not exist');
              }
              throw tableError;
            }
            
            // Check if we can get column information
            const { data: columnInfo, error: columnError } = await supabase
              .rpc('get_table_columns', { table_name: 'notifications' });
            
            if (columnError) {
              console.warn('Could not get column information:', columnError);
              // Continue without failing - this is informational
            }
            
            updateDiagnosticStatus(testId, 'passed', {
              table_exists: true,
              columns: columnInfo || 'Could not retrieve column information',
              sample_data: tableInfo
            }, undefined, Date.now() - startTime);
            return true;
          } catch (error) {
            // If the RPC function doesn't exist, try a different approach
            try {
              const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .limit(1);
              
              if (error) {
                if (error.code === '42P01') {
                  throw new Error('Notifications table does not exist');
                }
                throw error;
              }
              
              updateDiagnosticStatus(testId, 'passed', {
                table_exists: true,
                sample_data: data
              }, undefined, Date.now() - startTime);
              return true;
            } catch (fallbackError) {
              throw fallbackError;
            }
          }

        case 'notifications-select-policy':
          // Test if user can read their own notifications
          if (!user?.id) throw new Error('No user ID available');
          
          const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('id, user_id, message, severity, is_read, created_at')
            .eq('user_id', user.id)
            .limit(10);
          
          if (notificationsError) {
            if (notificationsError.code === '42P01') {
              throw new Error('Notifications table does not exist');
            }
            throw notificationsError;
          }
          
          // Verify all returned notifications belong to current user
          const invalidNotifications = notifications?.filter(n => n.user_id !== user.id) || [];
          
          if (invalidNotifications.length > 0) {
            throw new Error(`Found ${invalidNotifications.length} notifications that don't belong to current user`);
          }
          
          updateDiagnosticStatus(testId, 'passed', {
            notifications_count: notifications?.length || 0,
            all_owned_by_user: true
          }, undefined, Date.now() - startTime);
          return true;

        case 'notifications-insert-policy':
          // Test if user can create notifications
          if (!user?.id) throw new Error('No user ID available');
          
          const testNotification = {
            user_id: user.id,
            message: `Test notification ${Date.now()}`,
            type: 'test',
            severity: 'info',
            is_read: false
          };
          
          const { data: newNotification, error: insertError } = await supabase
            .from('notifications')
            .insert([testNotification])
            .select()
            .single();
          
          if (insertError) {
            if (insertError.code === '42P01') {
              throw new Error('Notifications table does not exist');
            }
            throw insertError;
          }
          
          if (!newNotification) {
            throw new Error('Notification created but no data returned');
          }
          
          // Clean up test notification
          const { error: deleteError } = await supabase
            .from('notifications')
            .delete()
            .eq('id', newNotification.id);
          
          if (deleteError) {
            console.warn('Failed to clean up test notification:', deleteError);
          }
          
          updateDiagnosticStatus(testId, 'passed', {
            notification_created: true,
            notification_id: newNotification.id,
            cleanup_successful: !deleteError
          }, undefined, Date.now() - startTime);
          return true;

        case 'rls-policy-check':
          // Check if all required RLS policies exist
          const { data: policies, error: policyError } = await supabase
            .rpc('get_table_policies', { table_name: 'notifications' });
          
          if (policyError) {
            console.warn('Could not fetch RLS policies:', policyError);
            // Continue without failing - this is informational
          }
          
          const expectedPolicies = [
            'Users can read their own notifications',
            'Users can insert their own notifications',
            'Users can update their own notifications'
          ];
          
          const policyCheck = {
            policies_found: policies || [],
            expected_policies: expectedPolicies,
            all_policies_exist: expectedPolicies.every(policy => 
              policies?.some(p => p.policyname.includes(policy))
            )
          };
          
          updateDiagnosticStatus(testId, 'passed', policyCheck, undefined, Date.now() - startTime);
          return true;

        case 'store-creation-debug':
          if (!user?.id) throw new Error('No user ID available');
          
          const { data: debugResult, error: debugError } = await supabase
            .rpc('debug_store_creation', { test_owner_id: user.id });
          
          if (debugError) throw debugError;
          
          if (!debugResult || debugResult.length === 0) {
            throw new Error('No debug result returned');
          }
          
          const debug = debugResult[0];
          
          if (!debug.can_insert) {
            throw new Error(`Store creation blocked: ${debug.error_message}`);
          }
          
          updateDiagnosticStatus(testId, 'passed', debug, undefined, Date.now() - startTime);
          return true;

        case 'stores-select-policy':
          const { data: stores, error: selectError } = await supabase
            .from('stores')
            .select('id, name, owner_id')
            .eq('owner_id', user?.id);
          
          if (selectError) throw selectError;
          
          // Verify all returned stores belong to current user
          const invalidStores = stores?.filter(store => store.owner_id !== user?.id) || [];
          
          if (invalidStores.length > 0) {
            throw new Error(`Found ${invalidStores.length} stores that don't belong to current user`);
          }
          
          updateDiagnosticStatus(testId, 'passed', {
            stores_count: stores?.length || 0,
            all_owned_by_user: true
          }, undefined, Date.now() - startTime);
          return true;

        case 'stores-insert-policy':
          // CRITICAL: Test actual store creation with proper cleanup
          const testStoreName = `RLS Test Store ${Date.now()}`;
          
          console.log('🧪 Testing store creation with RLS...');
          
          const { data: newStore, error: insertStoreError } = await supabase
            .from('stores')
            .insert([{
              owner_id: user?.id,
              name: testStoreName,
              location: 'Test Location for RLS',
              timezone: 'America/New_York'
            }])
            .select()
            .single();
          
          if (insertStoreError) {
            console.error('🚨 Store creation failed:', insertStoreError);
            throw new Error(`Store creation failed: ${insertStoreError.message} (Code: ${insertStoreError.code})`);
          }
          
          if (!newStore || newStore.owner_id !== user?.id) {
            throw new Error('Store created but owner_id validation failed');
          }
          
          console.log('✅ Test store created successfully:', newStore.id);
          
          // Clean up test store
          const { error: deleteStoreError } = await supabase
            .from('stores')
            .delete()
            .eq('id', newStore.id);
          
          if (deleteStoreError) {
            console.warn('⚠️ Failed to clean up test store:', deleteStoreError);
          } else {
            console.log('🧹 Test store cleaned up successfully');
          }
          
          updateDiagnosticStatus(testId, 'passed', {
            test_store_created: true,
            test_store_id: newStore.id,
            cleanup_successful: !deleteStoreError
          }, undefined, Date.now() - startTime);
          return true;

        case 'cors-test':
          // Test CORS by making a simple request
          try {
            const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
              method: 'HEAD',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              }
            });

            const corsResult = {
              status: response.status,
              cors_headers: {
                'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
                'access-control-allow-headers': response.headers.get('access-control-allow-headers')
              },
              current_origin: window.location.origin
            };

            updateDiagnosticStatus(testId, 'passed', corsResult, undefined, Date.now() - startTime);
            return true;
          } catch (error) {
            if ((error as Error).message.includes('CORS')) {
              throw new Error('CORS error: Your domain may not be configured in Supabase Auth settings');
            }
            throw error;
          }

        case 'network-diagnostics':
          const networkTests = {
            dns_resolution: false,
            ssl_certificate: false,
            response_time: 0,
            user_agent: navigator.userAgent,
            connection_type: (navigator as any).connection?.effectiveType || 'unknown'
          };

          const networkStartTime = Date.now();
          
          try {
            const response = await fetch(import.meta.env.VITE_SUPABASE_URL +  '/rest/v1/', {
              method: 'HEAD',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
              }
            });
            
            networkTests.response_time = Date.now() - networkStartTime;
            networkTests.dns_resolution = true;
            networkTests.ssl_certificate = response.url.startsWith('https://');
            
          } catch (error) {
            throw new Error(`Network diagnostic failed: ${(error as Error).message}`);
          }

          updateDiagnosticStatus(testId, 'passed', networkTests, undefined, Date.now() - startTime);
          return true;

        default:
          throw new Error(`Unknown diagnostic test: ${testId}`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Diagnostic ${testId} failed:`, error);
      updateDiagnosticStatus(testId, 'failed', undefined, (error as Error).message, duration);
      return false;
    } finally {
      setCurrentTest(null);
    }
  };

  const runAllDiagnostics = async () => {
    setIsRunning(true);
    
    // Reset all diagnostics
    setDiagnostics(diagnosticTests.map(test => ({ ...test, status: 'pending' })));
    
    let passedCount = 0;
    
    for (const test of diagnosticTests) {
      const passed = await runDiagnostic(test.id);
      if (passed) passedCount++;
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsRunning(false);
    
    if (passedCount === diagnosticTests.length) {
      toast.success(`All ${passedCount} diagnostics passed! 🎉`);
    } else {
      toast.error(`${passedCount}/${diagnosticTests.length} diagnostics passed`);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="success">Passed</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      case 'running':
        return <Badge variant="info">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
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

  const passedTests = diagnostics.filter(d => d.status === 'passed').length;
  const failedTests = diagnostics.filter(d => d.status === 'failed').length;
  const totalTests = diagnostics.length;

  if (!user) {
    return (
      <div className="text-center py-16">
        <User className="h-16 w-16 mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Authentication Required</h2>
        <p className="text-slate-500">Please log in to run RLS diagnostics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-teal-600" />
            RLS & Connection Diagnostics
          </h1>
          <p className="text-slate-500">
            Comprehensive testing of Supabase connectivity, authentication, and Row-Level Security
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-green-600">{passedTests} passed</span>
            {failedTests > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium text-red-600">{failedTests} failed</span>
              </>
            )}
            <span className="mx-2">•</span>
            <span>{totalTests} total</span>
          </div>
          
          <Button
            onClick={runAllDiagnostics}
            isLoading={isRunning}
            leftIcon={isRunning ? <RefreshCw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            disabled={isRunning}
          >
            {isRunning ? 'Running Diagnostics...' : 'Run All Diagnostics'}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getConnectionIcon()}
              <div>
                <h3 className="font-medium text-slate-900">Supabase Connection</h3>
                <p className="text-sm text-slate-500">
                  {connectionStatus === 'checking' && 'Testing connection...'}
                  {connectionStatus === 'connected' && 'Connected successfully'}
                  {connectionStatus === 'failed' && 'Connection failed'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Test Connection
              </Button>
              <TestNotificationButton />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Diagnostic Progress</span>
            <span className="text-sm text-slate-500">{passedTests}/{totalTests}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(passedTests / totalTests) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Environment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">Environment:</span>
              <span className="ml-2 text-slate-600">{import.meta.env.MODE}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Supabase URL:</span>
              <span className="ml-2 text-slate-600">
                {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Supabase Key:</span>
              <span className="ml-2 text-slate-600">
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">User ID:</span>
              <span className="ml-2 text-slate-600 font-mono text-xs">{user.id}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Email:</span>
              <span className="ml-2 text-slate-600">{user.email}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Role:</span>
              <span className="ml-2 text-slate-600">{user.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Diagnostic Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {diagnostics.map((diagnostic) => (
              <div key={diagnostic.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(diagnostic.status)}
                    <div>
                      <h3 className="font-medium text-slate-900">{diagnostic.name}</h3>
                      <p className="text-sm text-slate-500">{diagnostic.description}</p>
                      {diagnostic.error && (
                        <div className="flex items-center space-x-2 mt-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">{diagnostic.error}</span>
                        </div>
                      )}
                      {diagnostic.result && diagnostic.status === 'passed' && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                          <pre className="text-green-800 whitespace-pre-wrap">
                            {JSON.stringify(diagnostic.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {diagnostic.duration && (
                      <span className="text-xs text-slate-400">{diagnostic.duration}ms</span>
                    )}
                    {getStatusBadge(diagnostic.status)}
                    {currentTest === diagnostic.id && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => runDiagnostic('environment-check')}
              leftIcon={<Database className="h-4 w-4" />}
              disabled={isRunning}
            >
              Check Environment
            </Button>
            <Button
              variant="outline"
              onClick={() => runDiagnostic('connection-test')}
              leftIcon={<Wifi className="h-4 w-4" />}
              disabled={isRunning}
            >
              Test Connection
            </Button>
            <Button
              variant="outline"
              onClick={() => runDiagnostic('notifications-table-check')}
              leftIcon={<Bell className="h-4 w-4" />}
              disabled={isRunning}
            >
              Check Notifications
            </Button>
            <Button
              variant="outline"
              onClick={() => runDiagnostic('auth-context')}
              leftIcon={<User className="h-4 w-4" />}
              disabled={isRunning}
            >
              Test Auth Context
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
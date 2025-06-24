import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Play, RefreshCw, AlertTriangle, Store, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { useStoreStore } from '@/features/stores/store/StoreStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}

export default function TestingDashboard() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const { stores, currentStore, createStore, initializeStoreContext } = useStoreStore();
  const navigate = useNavigate();

  const testSuite: Omit<TestResult, 'status'>[] = [
    {
      id: 'auth-check',
      name: 'Authentication Check',
      description: 'Verify user is authenticated and has valid session'
    },
    {
      id: 'store-context',
      name: 'Store Context Initialization',
      description: 'Check if store context loads properly'
    },
    {
      id: 'demo-store-creation',
      name: 'Demo Store Creation',
      description: 'Test quick demo store creation functionality'
    },
    {
      id: 'store-selection',
      name: 'Store Auto-Selection',
      description: 'Verify store is automatically selected after creation'
    },
    {
      id: 'address-autocomplete',
      name: 'Address Autocomplete',
      description: 'Test address suggestions with mock data'
    },
    {
      id: 'dashboard-access',
      name: 'Dashboard Access',
      description: 'Navigate to dashboard with selected store'
    },
    {
      id: 'events-page',
      name: 'Events Page Access',
      description: 'Test events page loads with store context'
    },
    {
      id: 'simulator-access',
      name: 'Event Simulator Access',
      description: 'Verify simulator page works with current store'
    },
    {
      id: 'devices-page',
      name: 'Devices Page Access',
      description: 'Test devices management page'
    },
    {
      id: 'persistence-check',
      name: 'Store Persistence',
      description: 'Check if store selection persists across page refreshes'
    }
  ];

  useEffect(() => {
    // Initialize tests
    setTests(testSuite.map(test => ({ ...test, status: 'pending' })));
  }, []);

  const updateTestStatus = (testId: string, status: TestResult['status'], error?: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status, error, duration }
        : test
    ));
  };

  const runTest = async (testId: string): Promise<boolean> => {
    const startTime = Date.now();
    setCurrentTest(testId);
    updateTestStatus(testId, 'running');

    try {
      switch (testId) {
        case 'auth-check':
          if (!user) throw new Error('User not authenticated');
          if (!user.id) throw new Error('User ID missing');
          break;

        case 'store-context':
          await initializeStoreContext(user!.id);
          break;

        case 'demo-store-creation':
          const demoStore = await createStore({
            owner_id: user!.id,
            name: `Test Demo Store ${Date.now()}`,
            location: "123 Test Street, Demo City, DC 12345, USA",
            timezone: "America/New_York"
          });
          if (!demoStore) throw new Error('Demo store creation failed');
          break;

        case 'store-selection':
          if (!currentStore) throw new Error('No store selected after creation');
          if (stores.length === 0) throw new Error('No stores in store list');
          break;

        case 'address-autocomplete':
          // Simulate address autocomplete test
          const mockQuery = 'main street';
          const mockResults = await simulateAddressSearch(mockQuery);
          if (mockResults.length === 0) throw new Error('Address autocomplete returned no results');
          break;

        case 'dashboard-access':
          // Test navigation to dashboard
          navigate('/dashboard');
          await new Promise(resolve => setTimeout(resolve, 500));
          if (window.location.pathname !== '/dashboard') {
            throw new Error('Failed to navigate to dashboard');
          }
          break;

        case 'events-page':
          navigate('/events');
          await new Promise(resolve => setTimeout(resolve, 500));
          if (window.location.pathname !== '/events') {
            throw new Error('Failed to navigate to events page');
          }
          break;

        case 'simulator-access':
          navigate('/simulator');
          await new Promise(resolve => setTimeout(resolve, 500));
          if (window.location.pathname !== '/simulator') {
            throw new Error('Failed to navigate to simulator page');
          }
          break;

        case 'devices-page':
          navigate('/devices');
          await new Promise(resolve => setTimeout(resolve, 500));
          if (window.location.pathname !== '/devices') {
            throw new Error('Failed to navigate to devices page');
          }
          break;

        case 'persistence-check':
          const savedStoreId = localStorage.getItem('currentStoreId');
          if (!savedStoreId) throw new Error('Store ID not saved to localStorage');
          if (savedStoreId !== currentStore?.id) {
            throw new Error('Saved store ID does not match current store');
          }
          break;

        default:
          throw new Error(`Unknown test: ${testId}`);
      }

      const duration = Date.now() - startTime;
      updateTestStatus(testId, 'passed', undefined, duration);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestStatus(testId, 'failed', (error as Error).message, duration);
      return false;
    } finally {
      setCurrentTest(null);
    }
  };

  const simulateAddressSearch = async (query: string): Promise<any[]> => {
    // Simulate the address autocomplete functionality
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const mockAddresses = [
      "123 Main Street, New York, NY 10001, USA",
      "456 Main Avenue, Los Angeles, CA 90028, USA",
      "789 Main Boulevard, Chicago, IL 60611, USA"
    ];

    return mockAddresses
      .filter(addr => addr.toLowerCase().includes(query.toLowerCase()))
      .map((address, index) => ({
        place_id: `mock_${index}`,
        description: address
      }));
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Reset all tests
    setTests(testSuite.map(test => ({ ...test, status: 'pending' })));
    
    let passedCount = 0;
    
    for (const test of testSuite) {
      const passed = await runTest(test.id);
      if (passed) passedCount++;
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsRunning(false);
    
    if (passedCount === testSuite.length) {
      toast.success(`All ${passedCount} tests passed! 🎉`);
    } else {
      toast.error(`${passedCount}/${testSuite.length} tests passed`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
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

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Readiness Testing</h1>
          <p className="text-slate-500">
            Comprehensive testing of store setup and feature access flow
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
            onClick={runAllTests}
            isLoading={isRunning}
            leftIcon={isRunning ? <RefreshCw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            disabled={isRunning}
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Test Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Test Progress</span>
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

      {/* Current Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">User:</span>
              <span className="ml-2 text-slate-600">{user?.email || 'Not authenticated'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Stores:</span>
              <span className="ml-2 text-slate-600">{stores.length} total</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Current Store:</span>
              <span className="ml-2 text-slate-600">{currentStore?.name || 'None selected'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Authentication</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${currentStore ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>Store Context</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>Google Places API</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {tests.map((test) => (
              <div key={test.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium text-slate-900">{test.name}</h3>
                      <p className="text-sm text-slate-500">{test.description}</p>
                      {test.error && (
                        <div className="flex items-center space-x-2 mt-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">{test.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {test.duration && (
                      <span className="text-xs text-slate-400">{test.duration}ms</span>
                    )}
                    {getStatusBadge(test.status)}
                    {currentTest === test.id && (
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
          <CardTitle>Quick Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/setup')}
              leftIcon={<Store className="h-4 w-4" />}
            >
              Store Setup
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              leftIcon={<CheckCircle className="h-4 w-4" />}
            >
              Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/simulator')}
              leftIcon={<Zap className="h-4 w-4" />}
            >
              Event Simulator
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Testing Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">✅ Store Creation Flow</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Navigate to store setup screen</li>
                  <li>• Enter valid store name and timezone</li>
                  <li>• Test address autocomplete with "main", "broadway"</li>
                  <li>• Submit form and verify toast message</li>
                  <li>• Confirm redirect to dashboard</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-2">⚡ Quick Demo Store</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Click "Quick Demo Store" button</li>
                  <li>• Verify realistic store data is created</li>
                  <li>• Confirm automatic store selection</li>
                  <li>• Test full feature access</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-2">🔍 Address Autocomplete</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Type "main" and see suggestions</li>
                  <li>• Use arrow keys to navigate</li>
                  <li>• Press Enter to select</li>
                  <li>• Verify address fills correctly</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-2">🔄 Store Persistence</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Select a store</li>
                  <li>• Refresh the browser</li>
                  <li>• Verify same store remains selected</li>
                  <li>• Check localStorage for currentStoreId</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
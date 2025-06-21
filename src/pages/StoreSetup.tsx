import { useState, useEffect } from 'react';
import { Plus, Store, MapPin, Clock, Check, Zap, ArrowRight, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { useStoreStore } from '@/features/stores/store/StoreStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AddressInput } from '../components/ui/AddressInput';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import toast from 'react-hot-toast';

interface StoreFormData {
  name: string;
  location: string;
  timezone: string;
  coords?: { lat: number; lng: number };
}

export default function StoreSetup() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [formErrors, setFormErrors] = useState<Partial<StoreFormData>>({});

  // IMPORTANT: Only subscribe to specific store slices needed
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const stores = useStoreStore(state => state.stores);
  const isLoading = useStoreStore(state => state.isLoading);
  const error = useStoreStore(state => state.error);
  const retryCount = useStoreStore(state => state.retryCount);
  const hasAttemptedStoreInit = useStoreStore(state => state.hasAttemptedStoreInit);
  const createStore = useStoreStore(state => state.createStore);
  const initializeStoreContext = useStoreStore(state => state.initializeStoreContext);
  const clearError = useStoreStore(state => state.clearError);
  const resetRetryCount = useStoreStore(state => state.resetRetryCount);
  const resetAttemptedStoreInit = useStoreStore(state => state.resetAttemptedStoreInit);
  const checkSessionValidity = useStoreStore(state => state.checkSessionValidity);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Defensive guard to prevent errors
    if (!user) {
      console.log('⚠️ No user found, skipping store initialization');
      return;
    }
    
    if (!hasAttemptedStoreInit) {
      try {
        console.log('🔄 Attempting to initialize store context...');
        initializeStoreContext(user.id);
      } catch (error) {
        console.error('❌ Error initializing store context:', error);
      }
    }
  }, [user, hasAttemptedStoreInit, initializeStoreContext]);

  // Auto-open modal if no stores exist and not loading
  useEffect(() => {
    if (!isLoading && stores.length === 0 && error !== 'SESSION_EXPIRED' && hasAttemptedStoreInit) {
      console.log('🔄 Auto-opening store creation modal (no stores exist)');
      setIsModalOpen(true);
    }
  }, [isLoading, stores.length, error, hasAttemptedStoreInit]);

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
    resetRetryCount();
  }, [clearError, resetRetryCount]);

  // Handle session expiration
  useEffect(() => {
    if (error === 'SESSION_EXPIRED') {
      toast.error('Session expired. Please log in again.');
      
      // Auto-logout after a short delay
      const logoutTimer = setTimeout(() => {
        handleLogout();
      }, 2000);
      
      return () => clearTimeout(logoutTimer);
    }
  }, [error]);

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
    { value: 'UTC', label: 'UTC' },
  ];

  const validateForm = (): boolean => {
    console.log('🔄 Validating form data:', formData);
    const errors: Partial<StoreFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Store name is required';
    }

    if (!formData.location.trim()) {
      errors.location = 'Store location is required';
    }

    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log(`🔄 Form validation ${isValid ? 'passed' : 'failed'}:`, errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔄 Form submitted, starting validation...');
    
    if (!validateForm() || !user) {
      console.log('❌ Form validation failed or user not available');
      return;
    }

    // Check session validity before proceeding
    console.log('🔄 Checking session validity...');
    const isValidSession = await checkSessionValidity();
    console.log(`🔄 Session validity check result: ${isValidSession ? 'Valid' : 'Invalid'}`);
    
    if (!isValidSession) {
      toast.error('Session expired. Please log in again.');
      handleLogout();
      return;
    }

    setIsCreatingCustom(true);
    clearError();

    try {
      console.log('🔄 Submitting store creation form with data:', {
        ...formData,
        owner_id: user.id
      });
      
      const newStore = await createStore({
        owner_id: user.id,
        name: formData.name.trim(),
        location: formData.location.trim(),
        timezone: formData.timezone,
      });

      console.log('✅ Store creation result:', newStore);
      
      if (newStore) {
        toast.success(`Store "${newStore.name}" created successfully!`);
        setIsModalOpen(false);
        resetForm();
        resetRetryCount();
        
        // Navigate to dashboard
        console.log('🔄 Navigating to dashboard...');
        navigate('/dashboard');
      } else {
        console.error('❌ Store creation returned null but no error was thrown');
        toast.error('Failed to create store: Unknown error');
      }
    } catch (error) {
      console.error('❌ Store creation failed:', error);
      
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'SESSION_EXPIRED') {
        // Session expiration is handled by useEffect above
        return;
      }
      
      // Show user-friendly error message
      if (errorMessage.includes('Permission denied')) {
        toast.error('Permission denied. Please log out and log back in.');
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast.error('A store with this name already exists. Please choose a different name.');
      } else {
        toast.error(`Failed to create store: ${errorMessage}`);
      }
    } finally {
      console.log('🔄 Store creation attempt completed, setting isCreatingCustom to false');
      setIsCreatingCustom(false);
    }
  };

  const createDemoStore = async () => {
    if (!user) return;

    // Check session validity before proceeding
    console.log('🔄 Checking session validity for demo store creation...');
    const isValidSession = await checkSessionValidity();
    console.log(`🔄 Session validity check result: ${isValidSession ? 'Valid' : 'Invalid'}`);
    
    if (!isValidSession) {
      toast.error('Session expired. Please log in again.');
      handleLogout();
      return;
    }

    const demoStores = [
      {
        name: "Downtown Demo Store",
        location: "123 Main Street, New York, NY 10001, USA",
        timezone: "America/New_York"
      },
      {
        name: "West Side Market",
        location: "456 Broadway, New York, NY 10013, USA", 
        timezone: "America/New_York"
      },
      {
        name: "Sunset Plaza",
        location: "200 Sunset Strip, West Hollywood, CA 90069, USA",
        timezone: "America/Los_Angeles"
      },
      {
        name: "Chicago Loop Store",
        location: "800 Michigan Avenue, Chicago, IL 60611, USA",
        timezone: "America/Chicago"
      },
      {
        name: "Miami Beach Shop",
        location: "1300 Ocean Drive, Miami Beach, FL 33139, USA",
        timezone: "America/New_York"
      }
    ];

    const randomDemo = demoStores[Math.floor(Math.random() * demoStores.length)];

    setIsCreatingDemo(true);
    clearError();

    try {
      console.log('🔄 Creating demo store with data:', {
        ...randomDemo,
        owner_id: user.id
      });
      
      const newStore = await createStore({
        owner_id: user.id,
        name: randomDemo.name,
        location: randomDemo.location,
        timezone: randomDemo.timezone,
      });

      console.log('✅ Demo store creation result:', newStore);
      
      if (newStore) {
        toast.success(`Demo store "${randomDemo.name}" created and activated!`);
        setIsModalOpen(false);
        resetRetryCount();
        
        // Navigate to dashboard
        console.log('🔄 Navigating to dashboard...');
        navigate('/dashboard');
      } else {
        console.error('❌ Demo store creation returned null but no error was thrown');
        toast.error('Failed to create demo store: Unknown error');
      }
    } catch (error) {
      console.error('❌ Demo store creation failed:', error);
      
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'SESSION_EXPIRED') {
        // Session expiration is handled by useEffect above
        return;
      }
      
      // Show user-friendly error message
      if (errorMessage.includes('Permission denied')) {
        toast.error('Permission denied. Please log out and log back in.');
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        // Try with a different name
        const timestamp = Date.now();
        const uniqueName = `${randomDemo.name} ${timestamp}`;
        
        try {
          console.log('🔄 Retrying demo store creation with unique name:', uniqueName);
          const retryStore = await createStore({
            owner_id: user.id,
            name: uniqueName,
            location: randomDemo.location,
            timezone: randomDemo.timezone,
          });
          
          console.log('✅ Retry demo store creation result:', retryStore);
          
          if (retryStore) {
            toast.success(`Demo store "${uniqueName}" created and activated!`);
            setIsModalOpen(false);
            resetRetryCount();
            navigate('/dashboard');
            return;
          }
        } catch (retryError) {
          console.error('❌ Retry demo store creation failed:', retryError);
          toast.error('Failed to create demo store. Please try again.');
        }
      } else {
        toast.error(`Failed to create demo store: ${errorMessage}`);
      }
    } finally {
      console.log('🔄 Demo store creation attempt completed, setting isCreatingDemo to false');
      setIsCreatingDemo(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
      // Force navigation even if logout fails
      navigate('/login');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    // Don't allow closing if no stores exist and no session error
    if (stores.length === 0 && error !== 'SESSION_EXPIRED') {
      toast.info('Please create your first store to continue');
      return;
    }
    setIsModalOpen(false);
    resetForm();
    clearError();
    resetRetryCount();
  };

  const handleRetry = () => {
    clearError();
    resetAttemptedStoreInit(); // Reset the attempt flag to allow retry
    // Don't reset retry count here - let it accumulate
  };

  const handleAddressChange = (location: string, coords?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      location,
      coords
    }));
  };

  // Show session expired state
  if (error === 'SESSION_EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto border-amber-200 bg-amber-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Session Expired</h2>
            <p className="text-slate-600 mb-6">
              Your session has expired. Please log in again to continue.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleLogout}
                leftIcon={<LogOut className="h-4 w-4" />}
                className="w-full"
              >
                Go to Login
              </Button>
              
              <div className="text-xs text-slate-500">
                You will be redirected automatically in a few seconds...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state only if we haven't attempted initialization yet
  if (isLoading && !hasAttemptedStoreInit) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your stores...</p>
          
          {/* Show retry options after 5 seconds */}
          <div className="mt-6 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Defensive guard for user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-slate-600 mb-6">
            Please log in to access this page.
          </p>
          <Button
            onClick={() => navigate('/login')}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Store className="h-16 w-16 text-teal-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Store Management</h1>
          <p className="text-slate-600">
            {stores.length === 0 
              ? 'Welcome! Let\'s set up your first store to get started with SentinelPOS Guardian.'
              : 'Manage your stores and create new ones as needed.'
            }
          </p>
        </div>

        {/* Enhanced Error Display */}
        {error && error !== 'SESSION_EXPIRED' && (
          <Card className="max-w-md mx-auto border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3 text-red-700">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Store Creation Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                  
                  {/* Show retry count and options */}
                  {retryCount > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      Attempt {retryCount} failed
                    </div>
                  )}
                  
                  {/* Enhanced troubleshooting suggestions */}
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-medium">Try these troubleshooting steps:</p>
                    <div className="space-y-2">
                      {retryCount < 3 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRetry}
                          leftIcon={<RefreshCw className="h-3 w-3" />}
                          className="w-full text-red-700 border-red-300 hover:bg-red-100"
                        >
                          Retry ({3 - retryCount} attempts left)
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            leftIcon={<LogOut className="h-3 w-3" />}
                            className="w-full text-red-700 border-red-300 hover:bg-red-100"
                          >
                            Log Out & Back In
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                      <p className="font-medium mb-1">Common causes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Session expired or invalid</li>
                        <li>Database permissions issue</li>
                        <li>Network connectivity problem</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stores.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="h-20 w-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-10 w-10 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Create Your First Store</h2>
                <p className="text-slate-600 mb-4">
                  You need at least one store to access the security monitoring features.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    console.log('🔄 Create Custom Store button clicked');
                    setIsModalOpen(true);
                  }}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="w-full"
                  disabled={isCreatingCustom || isCreatingDemo}
                >
                  Create Custom Store
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">or</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    console.log('🔄 Quick Demo Store button clicked');
                    createDemoStore();
                  }}
                  leftIcon={<Zap className="h-4 w-4" />}
                  variant="outline"
                  className="w-full"
                  isLoading={isCreatingDemo}
                  disabled={isCreatingCustom || isCreatingDemo}
                >
                  {isCreatingDemo ? 'Creating Demo Store...' : 'Quick Demo Store'}
                </Button>
                
                <p className="text-xs text-slate-500 mt-2">
                  Demo store comes pre-configured with realistic data for testing
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Your Stores</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={createDemoStore}
                  leftIcon={<Zap className="h-4 w-4" />}
                  variant="outline"
                  isLoading={isCreatingDemo}
                  disabled={isCreatingCustom || isCreatingDemo}
                >
                  {isCreatingDemo ? 'Creating...' : 'Add Demo Store'}
                </Button>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                  disabled={isCreatingCustom || isCreatingDemo}
                >
                  Add Store
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <Card key={store.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{store.name}</h3>
                          <div className="flex items-center text-sm text-slate-500 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[200px]">{store.location}</span>
                          </div>
                        </div>
                      </div>
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-slate-600">
                        <Clock className="h-3 w-3 mr-2" />
                        {store.timezone || 'UTC'}
                      </div>
                      <div className="text-slate-500">
                        Created {new Date(store.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard')}
                        className="w-full"
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Access Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    leftIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/simulator')}
                    leftIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Test Event Simulator
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/devices')}
                    leftIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Manage Devices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Store Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Create New Store"
          size="md"
          showCloseButton={stores.length > 0}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Store Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              placeholder="Enter store name (e.g., Downtown Location)"
              required
            />

            <AddressInput
              label="Store Address"
              value={formData.location}
              onChange={handleAddressChange}
              error={formErrors.location}
              placeholder="Start typing your store address..."
              required
            />

            <Select
              label="Timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              options={timezoneOptions}
            />

            <ModalFooter>
              {stores.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isCreatingCustom}
                >
                  Cancel
                </Button>
              )}
              
              {/* Show Exit and Log Out button if too many failures */}
              {retryCount >= 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="h-4 w-4" />}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Exit and Log Out
                </Button>
              )}
              
              {/* Show retry/logout options if too many failures */}
              {retryCount >= 3 ? (
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={handleRetry}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  isLoading={isCreatingCustom}
                  disabled={isCreatingCustom}
                  onClick={() => {
                    console.log('🔄 Create Store button clicked in modal');
                  }}
                >
                  {isCreatingCustom ? 'Creating Store...' : 'Create Store'}
                </Button>
              )}
            </ModalFooter>
          </form>
        </Modal>
      </div>
    </ErrorBoundary>
  );
}
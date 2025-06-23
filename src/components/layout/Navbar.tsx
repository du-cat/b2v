import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  Settings,
  User,
  Store,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/AuthStore';
import { useStoreStore } from '../../features/stores/store/StoreStore';
import type { Store as StoreType } from '../../features/stores/types';
import type { AuthState } from '../../features/auth/types';
import type { StoreState } from '../../features/stores/types';
import { useHasStores } from '../../shared/contexts/AppContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { Button } from '../ui/Button';
import { HeartbeatStatus } from '../ui/HeartbeatStatus';

/**
 * Navigation component following Interface Segregation Principle
 * CRITICAL: Uses specific store subscriptions, no direct store coupling
 */
export function Navbar() {
  // IMPORTANT: Only subscribe to specific store slices needed
  const user = useAuthStore((state: AuthState) => state.user);
  const logout = useAuthStore((state: AuthState) => state.logout);
  const stores = useStoreStore((state: StoreState) => state.stores);
  const currentStore = useStoreStore((state: StoreState) => state.currentStore);
  const setCurrentStore = useStoreStore((state: StoreState) => state.setCurrentStore);

  const hasStores = useHasStores();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };
  
  const toggleUserMenu = () => {
    setUserMenuOpen(prev => !prev);
  };
  
  const toggleStoreMenu = () => {
    setStoreMenuOpen(prev => !prev);
  };
  
  const handleStoreChange = (storeId: string) => {
    setCurrentStore(storeId);
    setStoreMenuOpen(false);
  };
  
  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  // Check if current page requires a store
  const storeRequiredPages = ['/dashboard', '/events', '/rules', '/reports', '/devices', '/cameras', '/simulator'];
  const isStoreRequiredPage = storeRequiredPages.includes(location.pathname);
  const showStoreWarning = isStoreRequiredPage && !hasStores;
  
  // Get nav link class with store requirement styling
  const getNavLinkClass = (path: string) => {
    const isStoreRequired = storeRequiredPages.includes(path);
    const hasNoStore = !hasStores;
    
    let baseClass = 'px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800';
    
    if (isStoreRequired && hasNoStore) {
      baseClass += ' text-amber-300 opacity-75';
    }
    
    return baseClass;
  };
  
  // Update store mapping with proper types
  const renderStores = (store: StoreType) => (
    <button
      key={store.id}
      onClick={() => setCurrentStore(store.id)}
      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
        currentStore?.id === store.id ? 'bg-gray-50' : ''
      }`}
    >
      {store.name}
    </button>
  );

  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <Shield className="h-8 w-8 text-teal-500" />
                <span className="ml-2 text-xl font-bold">SentinelPOS</span>
              </Link>
            </div>
            
            {/* Desktop nav links */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link 
                  to="/dashboard" 
                  className={getNavLinkClass('/dashboard')}
                  title={showStoreWarning ? 'Works best with a store selected' : ''}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/events" 
                  className={getNavLinkClass('/events')}
                  title={showStoreWarning ? 'Works best with a store selected' : ''}
                >
                  Events
                </Link>
                <Link 
                  to="/rules" 
                  className={getNavLinkClass('/rules')}
                  title={showStoreWarning ? 'Works best with a store selected' : ''}
                >
                  Rules
                </Link>
                <Link 
                  to="/reports" 
                  className={getNavLinkClass('/reports')}
                  title={showStoreWarning ? 'Works best with a store selected' : ''}
                >
                  Reports
                </Link>
                <Link 
                  to="/devices" 
                  className={getNavLinkClass('/devices')}
                  title={showStoreWarning ? 'Works best with a store selected' : ''}
                >
                  Devices
                </Link>
                <Link 
                  to="/cameras" 
                  className={getNavLinkClass('/cameras')}
                  title={showStoreWarning ? 'Works best with a store selected' : ''}
                >
                  Cameras
                </Link>
                <Link to="/setup" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 text-teal-300">
                  Store Setup
                </Link>
                <Link to="/rls-diagnostics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 text-blue-300">
                  RLS Diagnostics
                </Link>
                <Link to="/testing" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 text-purple-300">
                  Testing
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right side menu items */}
          <div className="hidden md:flex items-center">
            {/* Heartbeat status */}
            <div className="mr-4">
              <HeartbeatStatus />
            </div>
            
            {/* Store selector */}
            {user && (
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={toggleStoreMenu}
                    className={`flex items-center text-sm rounded-md px-3 py-2 hover:bg-slate-800 ${
                      !hasStores ? 'text-amber-300' : 'text-white'
                    }`}
                    title={!hasStores ? 'No stores available - click to create one' : ''}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    <span className="mr-1">
                      {currentStore?.name || (!hasStores ? 'No Store' : 'Select Store')}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                
                {storeMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {hasStores ? (
                        <>
                          {stores.map(renderStores)}
                          <div className="border-t border-slate-100 my-1"></div>
                        </>
                      ) : (
                        <div className="px-4 py-2 text-sm text-slate-500 italic">
                          No stores available
                        </div>
                      )}
                      <Link
                        to="/setup"
                        className="block px-4 py-2 text-sm text-teal-600 hover:bg-slate-100"
                        onClick={() => setStoreMenuOpen(false)}
                      >
                        + {!hasStores ? 'Create First Store' : 'Add New Store'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Notification dropdown */}
            <NotificationDropdown />
            
            {/* User menu */}
            {user && (
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                  >
                    <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </button>
                </div>
                
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="px-4 py-2 text-sm text-slate-700 border-b">
                      Signed in as<br />
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Your Profile
                      </div>
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Store warning banner */}
      {showStoreWarning && (
        <div className="bg-amber-600 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>This page works best with a store. You can continue browsing or create a store.</span>
            </div>
            <Link to="/setup" className="underline hover:no-underline font-medium">
              Create Store
            </Link>
          </div>
        </div>
      )}
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 ${
                getNavLinkClass('/dashboard').includes('amber') ? 'text-amber-300' : 'text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/events"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 ${
                getNavLinkClass('/events').includes('amber') ? 'text-amber-300' : 'text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              to="/rules"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 ${
                getNavLinkClass('/rules').includes('amber') ? 'text-amber-300' : 'text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Rules
            </Link>
            <Link
              to="/reports"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 ${
                getNavLinkClass('/reports').includes('amber') ? 'text-amber-300' : 'text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Reports
            </Link>
            <Link
              to="/devices"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 ${
                getNavLinkClass('/devices').includes('amber') ? 'text-amber-300' : 'text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Devices
            </Link>
            <Link
              to="/cameras"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 ${
                getNavLinkClass('/cameras').includes('amber') ? 'text-amber-300' : 'text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Cameras
            </Link>
            <Link
              to="/setup"
              className="block px-3 py-2 rounded-md text-base font-medium text-teal-300 hover:bg-slate-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Store Setup
            </Link>
            <Link
              to="/rls-diagnostics"
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-300 hover:bg-slate-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              RLS Diagnostics
            </Link>
            <Link
              to="/testing"
              className="block px-3 py-2 rounded-md text-base font-medium text-purple-300 hover:bg-slate-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testing
            </Link>
          </div>
          
          {/* Mobile store selector */}
          {user && (
            <div className="pt-4 pb-3 border-t border-slate-700">
              <div className="px-3">
                <p className="text-xs font-medium text-slate-400">CURRENT STORE</p>
                <p className="text-white font-medium">
                  {currentStore?.name || (!hasStores ? 'No Store Selected' : 'Select Store')}
                </p>
              </div>
              <div className="mt-3 px-2 space-y-1">
                {hasStores ? (
                  stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        handleStoreChange(store.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                        currentStore?.id === store.id ? 'bg-slate-700 text-white' : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {store.name}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-400 italic">
                    No stores available
                  </div>
                )}
                <Link
                  to="/setup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-teal-400 hover:bg-slate-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  + {!hasStores ? 'Create First Store' : 'Add New Store'}
                </Link>
              </div>
            </div>
          )}
          
          {/* Mobile user menu */}
          {user && (
            <div className="pt-4 pb-3 border-t border-slate-700">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.full_name || 'User'}</div>
                  <div className="text-sm font-medium text-slate-400">{user.email}</div>
                </div>
                <div className="ml-auto">
                  <NotificationDropdown />
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
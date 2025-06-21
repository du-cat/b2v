import { ReactNode } from 'react';
import { Store, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStoreStore } from '../../store/storeStore';
import { Button } from './Button';

interface StoreRequiredWrapperProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showFallback?: boolean;
}

export function StoreRequiredWrapper({ 
  children, 
  fallbackTitle = "Store Required",
  fallbackMessage = "You'll need a store to use this feature. Create one now to get started.",
  showFallback = true
}: StoreRequiredWrapperProps) {
  const { currentStore, stores } = useStoreStore();
  
  // If we have a current store, or we don't want to show the fallback, render children
  if (currentStore || !showFallback) {
    return <>{children}</>;
  }
  
  // Otherwise show a non-blocking message
  return (
    <div className="text-center py-16">
      <Store className="h-16 w-16 mx-auto mb-4 text-slate-400" />
      <h2 className="text-xl font-semibold text-slate-700 mb-2">{fallbackTitle}</h2>
      <p className="text-slate-500 mb-6">{fallbackMessage}</p>
      
      {stores.length === 0 ? (
        <div className="space-y-4">
          <p className="text-slate-600">You don't have any stores yet.</p>
          <Link to="/setup">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Create Your First Store
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-600">You have {stores.length} store(s) available.</p>
          <p className="text-sm text-slate-500">Use the store selector in the top navigation to choose a store.</p>
          <Link to="/setup">
            <Button variant="outline" leftIcon={<Store className="h-4 w-4" />}>
              Manage Stores
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
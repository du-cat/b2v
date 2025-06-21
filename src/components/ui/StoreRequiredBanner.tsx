import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from './Button';
import { useHasStores } from '../../shared/contexts/AppContext';

interface StoreRequiredBannerProps {
  message?: string;
  className?: string;
}

export function StoreRequiredBanner({ 
  message = "This page works best with a store. Please create or select a store.",
  className = ""
}: StoreRequiredBannerProps) {
  const hasStores = useHasStores();
  
  // Don't show banner if user has stores
  if (hasStores) {
    return null;
  }
  
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">Store Required</h3>
          <p className="mt-1 text-sm text-amber-700">{message}</p>
          <div className="mt-3">
            <Link to="/setup">
              <Button 
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Create Store
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
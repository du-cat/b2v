import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, X } from 'lucide-react';
import { Button } from './Button';
import { useHasStores } from '../../shared/contexts/AppContext';
import toast from 'react-hot-toast';

interface StorePromptBannerProps {
  className?: string;
}

export function StorePromptBanner({ className }: StorePromptBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);
  const hasStores = useHasStores();
  
  // Show toast notification on first render if no stores
  useEffect(() => {
    if (!hasStores && !hasShownToast) {
      toast(
        (t) => (
          <div className="flex items-center">
            <span className="mr-2">Create a store to unlock all features</span>
            <Link to="/setup">
              <Button 
                size="sm" 
                variant="outline" 
                className="ml-2"
                onClick={() => toast.dismiss(t.id)}
              >
                Create Store
              </Button>
            </Link>
          </div>
        ),
        {
          duration: 5000,
          icon: <Store className="h-5 w-5 text-teal-500" />,
        }
      );
      setHasShownToast(true);
    }
  }, [hasStores, hasShownToast]);

  // Don't render the banner if user has stores or banner was dismissed
  if (hasStores || !isVisible) {
    return null;
  }

  return (
    <div className={`bg-teal-50 border-l-4 border-teal-500 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Store className="h-5 w-5 text-teal-500 mr-3" />
          <div>
            <p className="text-sm text-teal-700 font-medium">
              No stores configured
            </p>
            <p className="text-sm text-teal-600">
              Create a store to enable all monitoring features
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/setup">
            <Button size="sm">
              Create Store
            </Button>
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="text-teal-500 hover:text-teal-700"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
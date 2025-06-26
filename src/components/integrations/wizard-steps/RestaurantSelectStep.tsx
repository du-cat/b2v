import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Search, Store, AlertCircle } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  address?: string;
  type?: string;
}

interface RestaurantSelectStepProps {
  onNext: (data: Record<string, any>) => void;
  provider: any;
  stepData: Record<string, any>;
}

export function RestaurantSelectStep({ onNext, provider, stepData }: RestaurantSelectStepProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch restaurants when component mounts
  useEffect(() => {
    fetchRestaurants();
  }, []);
  
  const fetchRestaurants = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API to fetch restaurants
      // For this example, we'll simulate fetching restaurants after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate restaurants data
      const mockRestaurants: Restaurant[] = [
        { id: 'rest_1', name: 'Downtown Bistro', address: '123 Main St, Anytown, USA', type: 'Fine Dining' },
        { id: 'rest_2', name: 'Westside Cafe', address: '456 Oak Ave, Anytown, USA', type: 'Casual' },
        { id: 'rest_3', name: 'North County Grill', address: '789 Pine Rd, Othertown, USA', type: 'Fast Casual' },
        { id: 'rest_4', name: 'Southside Diner', address: '101 Elm Blvd, Anytown, USA', type: 'Diner' },
        { id: 'rest_5', name: 'East End Pizzeria', address: '202 Maple Dr, Othertown, USA', type: 'Pizza' },
      ];
      
      setRestaurants(mockRestaurants);
      
      // If there's only one restaurant, select it automatically
      if (mockRestaurants.length === 1) {
        setSelectedRestaurantId(mockRestaurants[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      setError(`Failed to fetch restaurants: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinue = () => {
    if (!selectedRestaurantId) {
      return;
    }
    
    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    
    onNext({
      restaurant: {
        id: selectedRestaurantId,
        name: selectedRestaurant?.name
      }
    });
  };
  
  // Filter restaurants based on search term
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (restaurant.address && restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (restaurant.type && restaurant.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Fetching your {provider.label} restaurants...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-2">Error Fetching Restaurants</h3>
              <p>{error}</p>
              <Button
                onClick={fetchRestaurants}
                className="mt-4"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search restaurants..."
              className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <Store className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No restaurants found</p>
              {searchTerm && (
                <p className="text-slate-500 text-sm mt-1">
                  Try a different search term or clear the search
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {filteredRestaurants.map(restaurant => (
                <label
                  key={restaurant.id}
                  className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedRestaurantId === restaurant.id
                      ? 'bg-teal-50 border-teal-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="restaurant"
                      value={restaurant.id}
                      checked={selectedRestaurantId === restaurant.id}
                      onChange={() => setSelectedRestaurantId(restaurant.id)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-slate-900">{restaurant.name}</p>
                      {restaurant.type && (
                        <p className="text-sm text-slate-500">{restaurant.type}</p>
                      )}
                      {restaurant.address && (
                        <p className="text-sm text-slate-500">{restaurant.address}</p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="pt-4">
            <Button
              onClick={handleContinue}
              disabled={!selectedRestaurantId}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
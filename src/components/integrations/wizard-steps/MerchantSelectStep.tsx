import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Search, Store, AlertCircle } from 'lucide-react';

interface Merchant {
  id: string;
  name: string;
  address?: string;
}

interface MerchantSelectStepProps {
  onNext: (data: Record<string, any>) => void;
  provider: any;
  stepData: Record<string, any>;
}

export function MerchantSelectStep({ onNext, provider, stepData }: MerchantSelectStepProps) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch merchants when component mounts
  useEffect(() => {
    fetchMerchants();
  }, []);
  
  const fetchMerchants = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API to fetch merchants
      // For this example, we'll simulate fetching merchants after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate merchants data
      const mockMerchants: Merchant[] = [
        { id: 'merch_1', name: 'Downtown Store', address: '123 Main St, Anytown, USA' },
        { id: 'merch_2', name: 'Westside Location', address: '456 Oak Ave, Anytown, USA' },
        { id: 'merch_3', name: 'North County Branch', address: '789 Pine Rd, Othertown, USA' },
        { id: 'merch_4', name: 'Southside Shop', address: '101 Elm Blvd, Anytown, USA' },
        { id: 'merch_5', name: 'East End Market', address: '202 Maple Dr, Othertown, USA' },
      ];
      
      setMerchants(mockMerchants);
      
      // If there's only one merchant, select it automatically
      if (mockMerchants.length === 1) {
        setSelectedMerchantId(mockMerchants[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      setError(`Failed to fetch merchants: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinue = () => {
    if (!selectedMerchantId) {
      return;
    }
    
    const selectedMerchant = merchants.find(m => m.id === selectedMerchantId);
    
    onNext({
      merchant: {
        id: selectedMerchantId,
        name: selectedMerchant?.name
      }
    });
  };
  
  // Filter merchants based on search term
  const filteredMerchants = merchants.filter(merchant => 
    merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (merchant.address && merchant.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Fetching your {provider.label} merchants...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-2">Error Fetching Merchants</h3>
              <p>{error}</p>
              <Button
                onClick={fetchMerchants}
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
              placeholder="Search merchants..."
              className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {filteredMerchants.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <Store className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No merchants found</p>
              {searchTerm && (
                <p className="text-slate-500 text-sm mt-1">
                  Try a different search term or clear the search
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {filteredMerchants.map(merchant => (
                <label
                  key={merchant.id}
                  className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedMerchantId === merchant.id
                      ? 'bg-teal-50 border-teal-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="merchant"
                      value={merchant.id}
                      checked={selectedMerchantId === merchant.id}
                      onChange={() => setSelectedMerchantId(merchant.id)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-slate-900">{merchant.name}</p>
                      {merchant.address && (
                        <p className="text-sm text-slate-500">{merchant.address}</p>
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
              disabled={!selectedMerchantId}
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
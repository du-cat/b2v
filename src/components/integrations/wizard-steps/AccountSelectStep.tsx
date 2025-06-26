import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Search, Store, AlertCircle } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface AccountSelectStepProps {
  onNext: (data: Record<string, any>) => void;
  provider: any;
  stepData: Record<string, any>;
}

export function AccountSelectStep({ onNext, provider, stepData }: AccountSelectStepProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts();
  }, []);
  
  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API to fetch accounts
      // For this example, we'll simulate fetching accounts after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate accounts data
      const mockAccounts: Account[] = [
        { id: 'acct_1', name: 'Main Retail Store', type: 'retail' },
        { id: 'acct_2', name: 'Downtown Restaurant', type: 'restaurant' },
        { id: 'acct_3', name: 'Online Store', type: 'ecommerce' },
        { id: 'acct_4', name: 'Warehouse Location', type: 'retail' },
        { id: 'acct_5', name: 'Pop-up Shop', type: 'retail' },
      ];
      
      setAccounts(mockAccounts);
      
      // If there's only one account, select it automatically
      if (mockAccounts.length === 1) {
        setSelectedAccountId(mockAccounts[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setError(`Failed to fetch accounts: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinue = () => {
    if (!selectedAccountId) {
      return;
    }
    
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    
    onNext({
      account: {
        id: selectedAccountId,
        name: selectedAccount?.name,
        type: selectedAccount?.type
      }
    });
  };
  
  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Fetching your {provider.label} accounts...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-2">Error Fetching Accounts</h3>
              <p>{error}</p>
              <Button
                onClick={fetchAccounts}
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
              placeholder="Search accounts..."
              className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <Store className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No accounts found</p>
              {searchTerm && (
                <p className="text-slate-500 text-sm mt-1">
                  Try a different search term or clear the search
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {filteredAccounts.map(account => (
                <label
                  key={account.id}
                  className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAccountId === account.id
                      ? 'bg-teal-50 border-teal-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="account"
                      value={account.id}
                      checked={selectedAccountId === account.id}
                      onChange={() => setSelectedAccountId(account.id)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-slate-900">{account.name}</p>
                      <p className="text-sm text-slate-500 capitalize">{account.type}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="pt-4">
            <Button
              onClick={handleContinue}
              disabled={!selectedAccountId}
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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProviderCard } from '../components/integrations/ProviderCard';
import { LogsDrawer } from '../components/integrations/LogsDrawer';
import { providers, getCloudProviders, getLocalProviders, getBackOfficeProviders } from '../config/integrationsConfig';
import { useStoreStore } from '../store/storeStore';
import { Integration, ProviderId } from '../types/integrations';
import { IntegrationService } from '../services/integrationService';
import toast from 'react-hot-toast';

export default function Integrations() {
  const navigate = useNavigate();
  const currentStore = useStoreStore(state => state.currentStore);
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  
  // Logs drawer state
  const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<{ id: ProviderId; label: string } | null>(null);
  
  // Fetch integrations when component mounts or store changes
  useEffect(() => {
    if (currentStore) {
      fetchIntegrations();
    } else {
      setIntegrations([]);
      setIsLoading(false);
    }
  }, [currentStore]);
  
  const fetchIntegrations = async () => {
    if (!currentStore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedIntegrations = await IntegrationService.getIntegrations(currentStore.id);
      setIntegrations(fetchedIntegrations);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      setError(`Failed to fetch integrations: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSync = async (providerId: string) => {
    if (!currentStore) return;
    
    // Set syncing state for this provider
    setIsSyncing(prev => ({ ...prev, [providerId]: true }));
    
    try {
      const result = await IntegrationService.sync(currentStore.id, providerId as ProviderId);
      
      if (result.success) {
        toast.success(`Successfully synced data from ${providerId}`);
        // Refresh integrations to update last_synced_at
        fetchIntegrations();
      } else {
        toast.error(`Failed to sync data from ${providerId}: ${result.message}`);
      }
    } catch (error) {
      console.error(`Failed to sync data from ${providerId}:`, error);
      toast.error(`Failed to sync data from ${providerId}: ${(error as Error).message}`);
    } finally {
      // Clear syncing state for this provider
      setIsSyncing(prev => ({ ...prev, [providerId]: false }));
    }
  };
  
  const handleViewLogs = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setSelectedProvider({ id: provider.id, label: provider.label });
      setLogsDrawerOpen(true);
    }
  };
  
  const handleRefresh = () => {
    fetchIntegrations();
  };
  
  // Group providers by type
  const cloudProviders = getCloudProviders();
  const localProviders = getLocalProviders();
  const backOfficeProviders = getBackOfficeProviders();
  
  // Find integration for each provider
  const getIntegrationForProvider = (providerId: string) => {
    return integrations.find(integration => integration.provider === providerId);
  };
  
  if (!currentStore) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
          <p className="text-slate-500">Connect your POS and back-office systems</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Store Selected</h2>
            <p className="text-slate-600 mb-6">
              Please select a store to manage integrations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
          <p className="text-slate-500">Connect your POS and back-office systems</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            isLoading={isLoading}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error Loading Integrations</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Cloud POS Providers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cloud POS Systems</CardTitle>
            <Badge variant="secondary">Cloud API</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cloudProviders.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  integration={getIntegrationForProvider(provider.id)}
                  onSync={handleSync}
                  onViewLogs={handleViewLogs}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Local POS Providers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Local POS Systems</CardTitle>
            <Badge variant="secondary">Local Connector</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localProviders.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  integration={getIntegrationForProvider(provider.id)}
                  onSync={handleSync}
                  onViewLogs={handleViewLogs}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Back-Office Providers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Back-Office Systems</CardTitle>
            <Badge variant="secondary">Data Import</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backOfficeProviders.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  integration={getIntegrationForProvider(provider.id)}
                  onSync={handleSync}
                  onViewLogs={handleViewLogs}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Information Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-slate-900 mb-1">About Integrations</h3>
              <p className="text-slate-600 text-sm">
                Connect your existing POS and back-office systems to enable comprehensive security monitoring.
                All credentials are securely encrypted and stored. Data is synced automatically based on your
                configured schedule, and you can manually sync at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Logs Drawer */}
      {selectedProvider && (
        <LogsDrawer
          isOpen={logsDrawerOpen}
          onClose={() => setLogsDrawerOpen(false)}
          storeId={currentStore.id}
          providerId={selectedProvider.id}
          providerLabel={selectedProvider.label}
        />
      )}
    </div>
  );
}
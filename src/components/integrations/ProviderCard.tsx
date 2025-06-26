import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProviderMeta, Integration, IntegrationStatus } from '../../types/integrations';
import { formatDistanceToNow } from 'date-fns';

interface ProviderCardProps {
  provider: ProviderMeta;
  integration?: Integration;
  onSync?: (providerId: string) => void;
  onViewLogs?: (providerId: string) => void;
}

export function ProviderCard({ provider, integration, onSync, onViewLogs }: ProviderCardProps) {
  const navigate = useNavigate();
  
  const handleSetup = () => {
    navigate(`/integrations/${provider.id}/setup`);
  };
  
  const handleSync = () => {
    if (onSync) {
      onSync(provider.id);
    }
  };
  
  const handleViewLogs = () => {
    if (onViewLogs) {
      onViewLogs(provider.id);
    }
  };
  
  const getStatusBadge = (status?: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Connected</Badge>;
      case 'error':
        return <Badge variant="danger" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Error</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'disconnected':
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Not Connected</Badge>;
    }
  };
  
  const getConnectionTypeBadge = () => {
    switch (provider.connection) {
      case 'oauth':
        return <Badge variant="info">OAuth</Badge>;
      case 'apikey':
        return <Badge variant="info">API Key</Badge>;
      case 'xml':
        return <Badge variant="info">XML API</Badge>;
      case 'file-share':
        return <Badge variant="info">File Share</Badge>;
      case 'sftp':
        return <Badge variant="info">SFTP</Badge>;
      default:
        return null;
    }
  };
  
  const getProviderTypeBadge = () => {
    switch (provider.type) {
      case 'cloud':
        return <Badge variant="secondary">Cloud POS</Badge>;
      case 'local':
        return <Badge variant="secondary">Local POS</Badge>;
      case 'backoffice':
        return <Badge variant="secondary">Back Office</Badge>;
      default:
        return null;
    }
  };
  
  const isConnected = integration?.status === 'connected';
  
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 flex items-center justify-center bg-slate-100 rounded-lg mr-4">
              <img 
                src={provider.logo} 
                alt={`${provider.label} logo`} 
                className="h-8 w-8"
                onError={(e) => {
                  // Fallback if logo fails to load
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900">{provider.label}</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {getProviderTypeBadge()}
                {getConnectionTypeBadge()}
              </div>
            </div>
          </div>
          {getStatusBadge(integration?.status)}
        </div>
        
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{provider.description}</p>
        
        {integration && (
          <div className="mb-4 text-xs text-slate-500">
            {integration.last_synced_at ? (
              <p>Last synced: {formatDistanceToNow(new Date(integration.last_synced_at), { addSuffix: true })}</p>
            ) : (
              <p>Never synced</p>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
          {isConnected ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync}
                className="flex-1"
              >
                Sync Now
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewLogs}
                className="flex-1"
              >
                View Logs
              </Button>
            </>
          ) : (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSetup}
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {integration?.status === 'error' ? 'Reconnect' : 'Connect'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
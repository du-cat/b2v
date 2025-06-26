import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, AlertTriangle, RefreshCw, Download, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { IntegrationLog, ProviderId } from '../../types/integrations';
import { IntegrationLogger } from '../../utils/integrationLogger';
import { formatDistanceToNow, format } from 'date-fns';

interface LogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  providerId: ProviderId;
  providerLabel: string;
}

export function LogsDrawer({ isOpen, onClose, storeId, providerId, providerLabel }: LogsDrawerProps) {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;
  
  // Fetch logs when drawer opens or filters change
  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, levelFilter, page, providerId, storeId]);
  
  const fetchLogs = async () => {
    if (!storeId || !providerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Fetch logs
      const fetchedLogs = await IntegrationLogger.getLogs(
        storeId,
        providerId,
        pageSize,
        offset,
        levelFilter === 'all' ? undefined : levelFilter
      );
      
      // If this is the first page, replace logs
      // Otherwise, append to existing logs
      if (page === 1) {
        setLogs(fetchedLogs);
      } else {
        setLogs(prev => [...prev, ...fetchedLogs]);
      }
      
      // Check if there are more logs to load
      setHasMore(fetchedLogs.length === pageSize);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError(`Failed to fetch logs: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setPage(1);
    fetchLogs();
  };
  
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };
  
  const handleExport = () => {
    // Create CSV content
    const headers = ['Timestamp', 'Level', 'Message', 'Details'];
    const rows = logs.map(log => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.level,
      log.message,
      log.details ? JSON.stringify(log.details) : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${providerId}-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      case 'warn':
        return <Badge variant="warning">Warning</Badge>;
      case 'info':
      default:
        return <Badge variant="info">Info</Badge>;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-2xl">
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">
                {providerLabel} Integration Logs
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Filters */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <Select
                    value={levelFilter}
                    onChange={(e) => {
                      setLevelFilter(e.target.value as any);
                      setPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'All Levels' },
                      { value: 'info', label: 'Info' },
                      { value: 'warn', label: 'Warnings' },
                      { value: 'error', label: 'Errors' }
                    ]}
                    className="w-40"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading && page === 1 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error Loading Logs</p>
                      <p className="mt-1">{error}</p>
                      <Button
                        onClick={handleRefresh}
                        className="mt-3"
                        size="sm"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Info className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No logs found</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {levelFilter !== 'all' 
                      ? `Try selecting a different log level filter` 
                      : `Logs will appear here once activity occurs`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-4 rounded-lg border ${
                        log.level === 'error' ? 'bg-red-50 border-red-200' :
                        log.level === 'warn' ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {getLevelIcon(log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-slate-900">
                              {log.message}
                            </p>
                            <div className="flex items-center space-x-2">
                              {getLevelBadge(log.level)}
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-slate-500">
                            <span>{format(new Date(log.timestamp), 'MMM d, yyyy h:mm:ss a')}</span>
                            <span className="mx-2">•</span>
                            <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                          </div>
                          
                          {log.details && (
                            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs font-mono overflow-x-auto">
                              <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Load more button */}
                  {hasMore && (
                    <div className="text-center pt-2">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        isLoading={isLoading}
                        disabled={isLoading}
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
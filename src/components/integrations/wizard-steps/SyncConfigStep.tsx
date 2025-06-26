import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Clock, AlertCircle } from 'lucide-react';

interface SyncConfigStepProps {
  defaultInterval: number;
  minInterval: number;
  maxInterval: number;
  onNext: (data: Record<string, any>) => void;
  provider: any;
}

export function SyncConfigStep({ defaultInterval, minInterval, maxInterval, onNext, provider }: SyncConfigStepProps) {
  const [interval, setInterval] = useState(defaultInterval);
  const [customInterval, setCustomInterval] = useState(defaultInterval.toString());
  const [isCustom, setIsCustom] = useState(false);
  
  const handleIntervalChange = (value: number) => {
    setInterval(value);
    setCustomInterval(value.toString());
    setIsCustom(false);
  };
  
  const handleCustomIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInterval(e.target.value);
    setIsCustom(true);
    
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= minInterval && value <= maxInterval) {
      setInterval(value);
    }
  };
  
  const handleSubmit = () => {
    // Convert interval to seconds
    const intervalSecs = interval;
    
    onNext({
      sync_config: {
        interval_secs: intervalSecs
      }
    });
  };
  
  // Convert seconds to human-readable format
  const formatInterval = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minutes`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Configure Sync Frequency</h3>
        
        <p className="text-slate-600 mb-6">
          Choose how often we should sync data from your {provider.label} system.
          More frequent syncs provide more up-to-date data but may increase system load.
        </p>
        
        <div className="space-y-4 mb-6">
          <div className="flex flex-col space-y-3">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-5 w-5 text-teal-600"
                checked={interval === 300 && !isCustom}
                onChange={() => handleIntervalChange(300)}
              />
              <span className="ml-2 text-slate-700">Every 5 minutes (recommended)</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-5 w-5 text-teal-600"
                checked={interval === 900 && !isCustom}
                onChange={() => handleIntervalChange(900)}
              />
              <span className="ml-2 text-slate-700">Every 15 minutes</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-5 w-5 text-teal-600"
                checked={interval === 3600 && !isCustom}
                onChange={() => handleIntervalChange(3600)}
              />
              <span className="ml-2 text-slate-700">Every hour</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-5 w-5 text-teal-600"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
              />
              <span className="ml-2 text-slate-700">Custom:</span>
              <input
                type="number"
                className="ml-2 w-20 px-2 py-1 border border-slate-300 rounded-md"
                value={customInterval}
                onChange={handleCustomIntervalChange}
                min={minInterval}
                max={maxInterval}
                step="60"
                onClick={() => setIsCustom(true)}
              />
              <span className="ml-2 text-slate-700">seconds</span>
            </label>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-blue-50 rounded-md text-blue-800 text-sm">
          <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>
            With current settings, data will sync {formatInterval(interval) === '5 minutes' ? 'every' : 'once every'} {formatInterval(interval)}.
          </span>
        </div>
      </div>
      
      {interval < minInterval && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            Sync interval must be at least {formatInterval(minInterval)}.
          </div>
        </div>
      )}
      
      {interval > maxInterval && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            Sync interval cannot exceed {formatInterval(maxInterval)}.
          </div>
        </div>
      )}
      
      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={interval < minInterval || interval > maxInterval}
          className="w-full"
        >
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
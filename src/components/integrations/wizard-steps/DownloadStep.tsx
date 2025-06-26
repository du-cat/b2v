import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Download, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface DownloadStepProps {
  downloadUrl: string;
  instructions: string[];
  onNext: (data?: Record<string, any>) => void;
  provider: any;
}

export function DownloadStep({ downloadUrl, instructions, onNext, provider }: DownloadStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  const handleDownload = () => {
    setIsDownloading(true);
    
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      setIsDownloaded(true);
      
      // Trigger actual download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'sentinel-local-connector-setup.exe';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-4">Local Connector Installation</h3>
        
        <p className="text-blue-700 mb-4">
          To connect to your {provider.label} system, you'll need to install our secure local connector
          on your back-office PC. This lightweight application creates a secure bridge between your
          POS system and our cloud platform.
        </p>
        
        <div className="bg-white p-4 rounded border border-blue-200 mb-4">
          <h4 className="font-medium text-blue-800 mb-2">Installation Instructions:</h4>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            {instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={handleDownload}
            isLoading={isDownloading}
            disabled={isDownloading}
            leftIcon={isDownloaded ? <CheckCircle className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            className="px-8"
          >
            {isDownloaded ? 'Downloaded' : 'Download Connector'}
          </Button>
        </div>
      </div>
      
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-800 mb-1">System Requirements</h4>
            <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
              <li>Windows 10 or later</li>
              <li>Administrator privileges</li>
              <li>Network access to your POS system</li>
              <li>Outbound internet access (HTTPS port 443)</li>
              <li>.NET Framework 4.7.2 or later</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-between">
        <a 
          href="https://docs.sentinelpos.com/local-connector"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 hover:text-teal-800 flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View Installation Guide
        </a>
        
        <Button
          onClick={() => onNext()}
          disabled={!isDownloaded}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
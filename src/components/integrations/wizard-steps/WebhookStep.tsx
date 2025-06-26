import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Copy, CheckCircle, ExternalLink } from 'lucide-react';

interface WebhookStepProps {
  webhookUrl: string;
  events: string[];
  autoConfigured: boolean;
  onNext: (data?: Record<string, any>) => void;
  provider: any;
}

export function WebhookStep({ webhookUrl, events, autoConfigured, onNext, provider }: WebhookStepProps) {
  const [copied, setCopied] = useState(false);
  
  const fullWebhookUrl = `${window.location.origin}${webhookUrl}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(fullWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-6">
      {autoConfigured ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800 mb-2">Webhooks Configured Automatically</h3>
              <p className="text-green-700 mb-4">
                We've automatically registered webhooks for your {provider.label} account.
                You'll receive real-time updates for the following events:
              </p>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                {events.map((event, index) => (
                  <li key={index}>{event}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Manual Webhook Configuration Required</h3>
            <p className="text-blue-700 mb-4">
              Please configure webhooks in your {provider.label} dashboard to send events to the following URL:
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-white p-3 rounded border border-blue-300 text-blue-800 font-mono text-sm flex-1 overflow-x-auto">
                {fullWebhookUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <p className="text-blue-700 mb-2">Subscribe to the following events:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 mb-4">
              {events.map((event, index) => (
                <li key={index}>{event}</li>
              ))}
            </ul>
            
            {provider.docsUrl && (
              <a 
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View {provider.label} webhook documentation
              </a>
            )}
          </div>
        </div>
      )}
      
      <div className="pt-4">
        <Button
          onClick={() => onNext()}
          className="w-full"
        >
          {autoConfigured ? 'Continue' : 'I\'ve Configured Webhooks'}
        </Button>
      </div>
    </div>
  );
}
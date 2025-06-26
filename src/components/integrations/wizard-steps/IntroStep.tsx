import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ProviderMeta } from '../../../types/integrations';

interface IntroStepProps {
  provider: ProviderMeta;
  providerName: string;
  benefits: string[];
  localConnector?: boolean;
  onNext: (data?: Record<string, any>) => void;
}

export function IntroStep({ provider, providerName, benefits, localConnector, onNext }: IntroStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Benefits of connecting {providerName}</h3>
        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-teal-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-slate-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {localConnector && (
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
          <h3 className="text-lg font-medium text-amber-800 mb-2">Local Connector Required</h3>
          <p className="text-amber-700 mb-4">
            This integration requires our secure local connector to be installed on your back-office PC.
            You'll be guided through the installation process in the next steps.
          </p>
          <p className="text-sm text-amber-600">
            The local connector is a small Windows application that securely connects to your POS system
            and sends data to our cloud platform. It requires administrator privileges to install.
          </p>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          onClick={() => onNext()}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
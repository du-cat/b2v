import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';

interface CompleteStepProps {
  provider: any;
  onNext: () => void;
}

export function CompleteStep({ provider, onNext }: CompleteStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {provider.label} Integration Complete!
        </h3>
        <p className="text-slate-600">
          Your {provider.label} account is now connected and ready to use.
          We'll start syncing your data automatically.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
        <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>We'll sync your data every {provider.pollIntervalSecs / 60} minutes</li>
          <li>You can manually sync anytime from the integrations dashboard</li>
          <li>You'll receive alerts for any suspicious activity</li>
          <li>View detailed logs and reports in the dashboard</li>
        </ul>
      </div>
      
      <div className="pt-4">
        <Button
          onClick={onNext}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="px-8"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
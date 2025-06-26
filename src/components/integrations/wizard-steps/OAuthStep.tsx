import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { AlertCircle } from 'lucide-react';

interface OAuthStepProps {
  providerName: string;
  scopes: string[];
  buttonText: string;
  onNext: (data: Record<string, any>) => void;
  provider: any;
}

export function OAuthStep({ providerName, scopes, buttonText, onNext, provider }: OAuthStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle OAuth redirect
  useEffect(() => {
    // Check if this is a redirect from the OAuth provider
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      setError(`Authentication failed: ${error}`);
      return;
    }
    
    if (code && state) {
      // Verify state matches what we expect (anti-CSRF)
      const savedState = sessionStorage.getItem(`${provider.id}_oauth_state`);
      
      if (state !== savedState) {
        setError('Invalid state parameter. Please try again.');
        return;
      }
      
      // Exchange code for token
      setIsLoading(true);
      
      // This would normally be a server-side call to exchange the code for a token
      // For this example, we'll simulate a successful token exchange
      setTimeout(() => {
        // Simulate successful token exchange
        const credentials = {
          access_token: 'simulated_access_token',
          refresh_token: 'simulated_refresh_token',
          merchant_id: 'simulated_merchant_id',
          expires_at: Date.now() + 3600000 // 1 hour from now
        };
        
        // Clear state from session storage
        sessionStorage.removeItem(`${provider.id}_oauth_state`);
        
        // Continue to next step with credentials
        onNext({ credentials });
        
        setIsLoading(false);
      }, 1500);
    }
  }, [provider.id, onNext]);
  
  const handleConnect = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a random state parameter for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);
      
      // Save state to session storage
      sessionStorage.setItem(`${provider.id}_oauth_state`, state);
      
      // Build OAuth URL
      let oauthUrl = '';
      
      switch (provider.id) {
        case 'square':
          oauthUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${import.meta.env.VITE_SQUARE_CLIENT_ID}&scope=${scopes.join('+')}&state=${state}&response_type=code`;
          break;
        case 'clover':
          oauthUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${import.meta.env.VITE_CLOVER_APP_ID}&state=${state}`;
          break;
        case 'lightspeed':
          oauthUrl = `https://cloud.lightspeedapp.com/oauth/authorize?client_id=${import.meta.env.VITE_LIGHTSPEED_CLIENT_ID}&response_type=code&scope=${scopes.join(' ')}&state=${state}`;
          break;
        case 'toast':
          oauthUrl = `https://api.toasttab.com/authentication/v1/authentication/connect/oauth?client_id=${import.meta.env.VITE_TOAST_CLIENT_ID}&response_type=code&state=${state}&scope=${scopes.join(' ')}`;
          break;
        default:
          throw new Error(`OAuth not supported for provider: ${provider.id}`);
      }
      
      // For demo purposes, we'll simulate the OAuth flow
      // In a real app, you would redirect to the OAuth URL
      console.log(`Redirecting to OAuth URL: ${oauthUrl}`);
      
      // Simulate successful OAuth
      setTimeout(() => {
        // Simulate successful token exchange
        const credentials = {
          access_token: 'simulated_access_token',
          refresh_token: 'simulated_refresh_token',
          merchant_id: 'simulated_merchant_id',
          expires_at: Date.now() + 3600000 // 1 hour from now
        };
        
        // Continue to next step with credentials
        onNext({ credentials });
        
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('OAuth error:', error);
      setError(`Failed to initiate ${providerName} authentication: ${(error as Error).message}`);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Connect with {providerName}</h3>
        <p className="text-slate-600 mb-4">
          You'll be redirected to {providerName} to authorize access to your account.
          We only request read-only access to the following:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          {scopes.map((scope, index) => (
            <li key={index}>{scope.replace(/[_:]/g, ' ')}</li>
          ))}
        </ul>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      
      <div className="flex justify-center">
        <Button
          onClick={handleConnect}
          isLoading={isLoading}
          disabled={isLoading}
          size="lg"
          className="px-8"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
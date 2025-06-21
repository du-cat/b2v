import React from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Key, Copy, Check } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { validateEnvironment, hasPlaceholderValues } from '../../lib/envCheck';
import { useState } from 'react';

export function EnvironmentSetupGuide() {
  const [copied, setCopied] = useState(false);
  const envValidation = validateEnvironment();
  const hasPlaceholders = hasPlaceholderValues();

  const copyEnvTemplate = () => {
    const template = `# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenCage Data API (Optional - for live address autocomplete)
# Get your API key from: https://opencagedata.com/
VITE_OPENCAGE_API_KEY=your-opencage-api-key-here

# Development Settings
VITE_APP_ENV=development`;

    navigator.clipboard.writeText(template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl mx-auto border-amber-200 bg-amber-50">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Key className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-amber-800 mb-2">
              Environment Configuration Required
            </h1>
            
            <p className="text-amber-600 mb-4">
              {hasPlaceholders 
                ? 'Please replace the placeholder values in your .env file with your actual Supabase credentials'
                : 'Your environment variables are missing or invalid. Please set up your .env file.'}
            </p>
          </div>

          {/* Environment Validation Errors */}
          {!envValidation.isValid && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Environment Issues
              </h3>
              <ul className="space-y-1 text-sm text-amber-700">
                {envValidation.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-amber-200">
            <h3 className="font-semibold text-slate-800 mb-3">Setup Instructions</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</div>
                <div>
                  <p className="font-medium text-slate-700">Create a .env file</p>
                  <p className="text-slate-600">Create a file named <code className="bg-slate-100 px-1 rounded">.env</code> in the project root directory</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</div>
                <div>
                  <p className="font-medium text-slate-700">Add Your Supabase Credentials</p>
                  <p className="text-slate-600">Get your Project URL and anon key from Supabase Dashboard → Settings → API</p>
                  <div className="mt-2 p-3 bg-slate-100 rounded font-mono text-xs relative">
                    <p>VITE_SUPABASE_URL=https://your-project-id.supabase.co</p>
                    <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...</p>
                    <button 
                      onClick={copyEnvTemplate}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-slate-200 transition-colors"
                      title="Copy template"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</div>
                <div>
                  <p className="font-medium text-slate-700">Restart Development Server</p>
                  <p className="text-slate-600">Run <code className="bg-slate-200 px-1 rounded">npm run dev</code> to reload with new credentials</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Refresh Page
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://app.supabase.com/', '_blank')}
              leftIcon={<ExternalLink className="h-4 w-4" />}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Open Supabase Dashboard
            </Button>
            
            <Button
              variant="outline"
              onClick={copyEnvTemplate}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {copied ? 'Copied!' : 'Copy .env Template'}
            </Button>
          </div>

          {/* Development Info */}
          {import.meta.env.DEV && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-amber-600 hover:text-amber-800">
                Debug Information (Development Only)
              </summary>
              <div className="mt-2 p-3 bg-amber-100 rounded text-amber-800">
                <div className="space-y-1">
                  <div>Environment: {import.meta.env.MODE}</div>
                  <div>URL Defined: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
                  <div>Key Defined: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
                  <div>Has Placeholders: {hasPlaceholders ? '⚠️ Yes' : '✅ No'}</div>
                  <div>Has Valid Env: {envValidation.isValid ? '✅' : '❌'}</div>
                  <div>OpenCage API Key: {import.meta.env.VITE_OPENCAGE_API_KEY ? '✅ Set' : '❌ Missing'}</div>
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
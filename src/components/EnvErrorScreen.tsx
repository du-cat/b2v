import React from 'react';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface EnvErrorScreenProps {
  missing: string[];
}

export function EnvErrorScreen({ missing }: EnvErrorScreenProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-4">
          Configuration Error
        </h1>
        
        <p className="text-slate-600 mb-6 text-center">
          The application is missing required environment variables:
        </p>
        
        <ul className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          {missing.map((key) => (
            <li key={key} className="flex items-center text-red-700 mb-2 last:mb-0">
              <span className="mr-2">•</span>
              <code className="font-mono bg-red-100 px-1 py-0.5 rounded">{key}</code>
            </li>
          ))}
        </ul>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please check your <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.env</code> file and ensure all required variables are set correctly.
          </p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Example .env file:</h3>
            <pre className="text-xs bg-slate-100 p-3 rounded overflow-x-auto">
              <code>
                {`# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Development Settings
VITE_APP_ENV=development`}
              </code>
            </pre>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </button>
            
            <a
              href="https://app.supabase.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Supabase Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
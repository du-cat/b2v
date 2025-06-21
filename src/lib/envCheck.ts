/**
 * Environment validation utility
 * Validates Supabase credentials on app boot and detects placeholder values
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function getEnvVar(key: string): string | undefined {
  // Try import.meta.env first, then fallback to process.env
  return import.meta.env?.[key] || (typeof process !== 'undefined' ? process.env?.[key] : undefined);
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
  
  console.log('🔍 Environment validation check:', {
    supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
    supabaseKey: supabaseKey ? '✅ Set' : '❌ Missing',
    mode: import.meta.env?.MODE || 'unknown'
  });
  
  // Check if environment variables exist
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not defined in environment variables');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must start with "https://"');
  } else if (supabaseUrl.includes('your-project-id') || supabaseUrl.includes('placeholder') || supabaseUrl.includes('xyzcompany')) {
    errors.push('VITE_SUPABASE_URL contains placeholder values. Please update with your actual Supabase URL from https://app.supabase.com/');
  }
  
  if (!supabaseKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
  } else if (!supabaseKey.startsWith('ey')) {
    errors.push('VITE_SUPABASE_ANON_KEY must start with "ey" (JWT format)');
  } else if (supabaseKey.includes('your-anon-key') || supabaseKey.includes('placeholder')) {
    errors.push('VITE_SUPABASE_ANON_KEY contains placeholder values. Please update with your actual Supabase anon key from https://app.supabase.com/');
  }
  
  // Check for OpenCage API key (optional)
  const opencageKey = getEnvVar('VITE_OPENCAGE_API_KEY');
  if (opencageKey && (opencageKey.includes('your-opencage-api-key-here') || opencageKey.length < 20)) {
    warnings.push('VITE_OPENCAGE_API_KEY contains placeholder values or is invalid. Address autocomplete will use demo mode.');
  }
  
  // Check for development environment
  if (import.meta.env?.DEV && errors.length === 0) {
    warnings.push('Running in development mode with valid Supabase credentials');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();
  
  if (result.isValid) {
    console.log('✅ Environment validation passed');
    result.warnings.forEach(warning => console.warn('⚠️', warning));
  } else {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error('  •', error));
    console.error('\n🔧 To fix this:');
    console.error('  1. Go to https://app.supabase.com/');
    console.error('  2. Select your project → Settings → API');
    console.error('  3. Copy your Project URL and anon/public key');
    console.error('  4. Update your .env file with the actual values');
    console.error('  5. Restart your development server');
  }
}

export function getEnvironmentGuidance(): string {
  const result = validateEnvironment();
  
  if (result.isValid) {
    return 'Environment is properly configured';
  }
  
  return `Please fix the following issues:
${result.errors.map(error => `• ${error}`).join('\n')}

To fix this:
1. Go to https://app.supabase.com/
2. Select your project → Settings → API
3. Copy your Project URL and anon/public key
4. Update your .env file:
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
5. Restart your development server`;
}

/**
 * Check if current environment has placeholder values
 */
export function hasPlaceholderValues(): boolean {
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
  
  const urlHasPlaceholder = supabaseUrl?.includes('your-project-id') || 
                           supabaseUrl?.includes('placeholder') || 
                           supabaseUrl?.includes('xyzcompany');
                           
  const keyHasPlaceholder = supabaseKey?.includes('your-anon-key') || 
                           supabaseKey?.includes('placeholder');
  
  return urlHasPlaceholder || keyHasPlaceholder;
}

/**
 * Create a sample .env file content
 */
export function getSampleEnvContent(): string {
  return `# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenCage Data API (Optional - for live address autocomplete)
# Get your API key from: https://opencagedata.com/
VITE_OPENCAGE_API_KEY=your-opencage-api-key-here

# Development Settings
VITE_APP_ENV=development`;
}
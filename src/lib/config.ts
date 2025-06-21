import { z } from 'zod';

/**
 * Environment configuration error class
 * Used to signal missing or invalid environment variables
 */
export class EnvConfigError extends Error {
  missingKeys: string[];

  constructor(opts: { missingKeys: string[] }) {
    super(`Missing env vars: ${opts.missingKeys.join(', ')}`);
    this.name = 'EnvConfigError';
    this.missingKeys = opts.missingKeys;
  }
}

// Get environment variables from import.meta.env or process.env (for SSR/tests)
const getEnv = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env;
  }
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  
  return {};
};

// Required environment variables
const REQUIRED_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

// Placeholder detection regex
const PLACEHOLDER_REGEX = /^(\s*|YOUR_|INSERT_|<.*>)$/i;

// Collect all environment variables
const env = getEnv();

// Check for missing or placeholder values
const missingKeys = REQUIRED_KEYS.filter(key => {
  const value = env[key];
  return !value || PLACEHOLDER_REGEX.test(value);
});

// Log environment status in development
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  console.groupCollapsed('[env] validation');
  
  REQUIRED_KEYS.forEach(key => {
    const value = env[key];
    const isValid = value && !PLACEHOLDER_REGEX.test(value);
    console.log(
      `${isValid ? '✅' : '❌'} ${key}: ${isValid ? 'Valid' : 'Missing or invalid'}`
    );
  });
  
  if (missingKeys.length > 0) {
    console.warn('❌ Missing required environment variables:', missingKeys);
  } else {
    console.log('✅ All required environment variables are present');
  }
  
  console.groupEnd();
}

// Throw error if any required keys are missing
if (missingKeys.length > 0) {
  throw new EnvConfigError({ missingKeys });
}

// Export typed environment variables
export const SUPABASE_URL: string = env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY as string;
export const APP_ENV: string = (env.VITE_APP_ENV as string) || 'development';
export const OPENCAGE_API_KEY: string | undefined = env.VITE_OPENCAGE_API_KEY as string | undefined;

// Schema for environment validation
export const envSchema = z.object({
  SUPABASE_URL: z.string().url('Must be a valid URL starting with https://'),
  SUPABASE_ANON_KEY: z.string().min(20, 'Must be at least 20 characters long'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  OPENCAGE_API_KEY: z.string().optional(),
});

// Validate environment variables against schema
export const validateEnvSchema = () => {
  try {
    return envSchema.parse({
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      APP_ENV,
      OPENCAGE_API_KEY,
    });
  } catch (error) {
    console.error('Environment validation error:', error);
    return null;
  }
};

// Export validated environment
export const validatedEnv = validateEnvSchema();
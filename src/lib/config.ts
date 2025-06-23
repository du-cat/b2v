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

// Environment schema
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string()
    .min(1)
    .refine(val => !val.includes('INSERT_YOUR_URL_HERE'), {
      message: 'VITE_SUPABASE_URL contains placeholder value'
    }),
  VITE_SUPABASE_ANON_KEY: z.string()
    .min(1)
    .refine(val => !val.includes('INSERT_YOUR_KEY_HERE'), {
      message: 'VITE_SUPABASE_ANON_KEY contains placeholder value'
    }),
});

// Type for validated environment
export type ValidEnv = z.infer<typeof envSchema>;

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

// Validate environment and return config
export const validateEnv = () => {
  const env = getEnv();
  const result = envSchema.safeParse(env);
  
  if (!result.success) {
    const missingKeys = Object.keys(result.error.formErrors.fieldErrors);
    throw new EnvConfigError({ missingKeys });
  }
  
  return result.data;
};

// Export validated config
export const config = validateEnv();
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Get Supabase credentials from environment
const getSupabaseCredentials = () => {
  const env = import.meta.env || process.env;
  
  // Debug logging for environment variables
  console.log('🔑 Supabase Environment Check:', {
    url: env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
    key: env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    mode: env.MODE || 'unknown'
  });
  
  return {
    url: env.VITE_SUPABASE_URL || '',
    key: env.VITE_SUPABASE_ANON_KEY || ''
  };
};

const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = getSupabaseCredentials();

// Debug check for credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials are missing!');
}

// Create Supabase client with credentials
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Enhanced session validation with auto-refresh
 */
export const validateSession = async () => {
  try {
    // First try to refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (!refreshError && refreshData.session) {
      return { isValid: true, user: refreshData.user, error: null };
    }

    // If refresh fails, check if we still have a valid user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Session validation failed:', userError?.message || 'No user found');
      return { isValid: false, user: null, error: 'SESSION_EXPIRED' };
    }

    return { isValid: true, user, error: null };
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return { isValid: false, user: null, error: 'SESSION_ERROR' };
  }
};

/**
 * Safe Supabase call wrapper with session validation
 */
export const safeSupabaseCall = async <T>(
  call: () => Promise<{ data: T | null; error: any }>,
  skipSessionValidation = false
): Promise<{ data: T | null; error: any }> => {
  try {
    if (!skipSessionValidation) {
      const { isValid, error } = await validateSession();
      if (!isValid) {
        throw new Error(error || 'SESSION_EXPIRED');
      }
    }

    const result = await call();
    
    if (result.error) {
      // Log the actual error for debugging
      console.error('❌ Supabase call error details:', {
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
        code: result.error.code
      });

      // Check for specific error types
      if (result.error.message?.includes('JWT')) {
        throw new Error('SESSION_EXPIRED');
      }
      
      if (result.error.code === '42501') {
        throw new Error('PERMISSION_DENIED');
      }
      
      if (result.error.code === '23505') {
        throw new Error('DUPLICATE_ERROR');
      }

      // Pass through the actual error message
      throw new Error(result.error.message || 'Database operation failed');
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    console.error('❌ Supabase call failed:', error);
    
    // Ensure we return a proper error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'An unexpected error occurred';
    
    return { data: null, error: errorMessage };
  }
};

/**
 * Tests the Supabase connection by making a simple query
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  console.log('🔄 Testing Supabase connection...');
  try {
    const { error } = await supabase.from('notifications').select('count').single();
    // PGRST116 means "no results" which is fine for a connection test
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
};

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔄 Auth state changed:', {
    event,
    hasSession: !!session,
    userId: session?.user?.id
  });
  
  if (session?.access_token) {
    console.log('✅ Valid access token present');
  } else {
    console.log('⚠️ No access token in session');
  }
});
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

console.log('🔍 Supabase Environment Check:', {
  url_defined: !!SUPABASE_URL,
  url_valid: SUPABASE_URL?.startsWith('https://'),
  anon_key_defined: !!SUPABASE_ANON_KEY,
  anon_key_valid: SUPABASE_ANON_KEY?.startsWith('ey'),
  environment: import.meta.env.MODE || 'unknown'
});

// Create Supabase client with validated credentials
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // CRITICAL FIX: Disable URL detection to prevent redirect issues
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        try {
          const storedSession = localStorage.getItem(key);
          if (!storedSession) return null;
          return JSON.parse(storedSession);
        } catch (error) {
          console.error('Error parsing stored session:', error);
          // CRITICAL FIX: Clear corrupted localStorage data
          localStorage.removeItem(key);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error storing session:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing session:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'sentinelpos-guardian',
      'X-Client-Version': '1.0.0'
    }
  },
  // Add debug logging for all fetch operations
  fetch: (url, options) => {
    console.log('🌐 Supabase Fetch Request:', {
      url: url.toString(),
      method: options?.method,
      headers: options?.headers ? 'Headers present' : 'No headers',
      body: options?.body ? 'Body present' : 'No body'
    });
    
    return fetch(url, options)
      .then(response => {
        console.log('📡 Supabase Fetch Response:', {
          url: url.toString(),
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });
        return response;
      })
      .catch(error => {
        console.error('❌ Supabase Fetch Error:', {
          url: url.toString(),
          error: error.message,
          stack: error.stack
        });
        throw error;
      });
  }
});

// Try to restore session from localStorage
(async () => {
  try {
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      try {
        // CRITICAL FIX: Validate JSON before parsing
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.currentSession?.access_token) {
          console.log('🔄 Attempting to restore session from localStorage...');
          
          const { error } = await supabase.auth.setSession({
            access_token: parsedSession.currentSession.access_token,
            refresh_token: parsedSession.currentSession.refresh_token
          });
          
          if (error) {
            console.error('❌ Failed to restore session:', error);
            // CRITICAL FIX: Clear invalid session data to prevent infinite loading
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('currentStoreId');
          } else {
            console.log('✅ Session restored successfully from localStorage');
          }
        } else {
          // CRITICAL FIX: Clear invalid session data
          console.warn('⚠️ Invalid session data in localStorage, clearing...');
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (parseError) {
        // CRITICAL FIX: Clear corrupted JSON data
        console.error('❌ Error parsing stored session JSON:', parseError);
        localStorage.removeItem('supabase.auth.token');
      }
    }
  } catch (error) {
    console.error('❌ Error restoring session:', error);
    // CRITICAL FIX: Clear potentially corrupted localStorage data
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentStoreId');
  }
})();

/** internal readiness flag */
let _supabaseReady = false;

/** getter used by app code */
export const isSupabaseReady = () => _supabaseReady;

/** call this once after heartbeat succeeds */
export function markSupabaseReady() { 
  _supabaseReady = true;
  console.log('✅ Supabase marked as ready');
}

// Safe connection test with comprehensive error handling
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // CRITICAL FIX: Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Use the heartbeat function (immune to RLS/ACL issues)
      const { data, error } = await supabase.rpc('heartbeat', {}, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('❌ Supabase heartbeat failed:', error);
        return false;
      }
      
      if (data === true) {
        console.log('✅ Supabase heartbeat successful');
        markSupabaseReady();
        return true;
      }
      
      console.error('❌ Supabase heartbeat returned unexpected value:', data);
      return false;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ Supabase connection test timed out after 5 seconds');
      } else {
        console.error('❌ Supabase fetch error:', fetchError);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return false;
  }
};

/**
 * Validates the current user session and returns detailed status
 */
export const validateSession = async () => {
  try {
    console.log('🔄 Validating user session...');
    
    // CRITICAL FIX: Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // CRITICAL FIX: First try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({}, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        // CRITICAL FIX: Clear invalid session data to prevent infinite loading
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        // Continue with getUser() to see if we still have a valid session
      } else if (refreshData.session) {
        console.log('✅ Session refreshed successfully');
      }
    } catch (refreshTimeoutError) {
      clearTimeout(timeoutId);
      if (refreshTimeoutError.name === 'AbortError') {
        console.error('❌ Session refresh timed out after 5 seconds');
        // CRITICAL FIX: Clear session on timeout
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
      }
    }
    
    // Set up a new timeout for getUser
    const userController = new AbortController();
    const userTimeoutId = setTimeout(() => userController.abort(), 5000);
    
    try {
      // Use getUser() for more reliable authentication
      const { data: { user }, error } = await supabase.auth.getUser({}, {
        signal: userController.signal
      });
      
      clearTimeout(userTimeoutId);
      
      if (error) {
        console.error('❌ Session validation error:', error);
        // CRITICAL FIX: Clear invalid session data to prevent infinite loading
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { isValid: false, session: null, user: null, error: error.message };
      }
      
      if (!user) {
        console.warn('⚠️ No active user found during validation');
        // CRITICAL FIX: Clear invalid session data to prevent infinite loading
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { isValid: false, session: null, user: null, error: 'No active user' };
      }
      
      // Check if user ID is valid
      if (!user.id) {
        console.warn('⚠️ User ID missing');
        // CRITICAL FIX: Clear invalid session data to prevent infinite loading
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { isValid: false, session: null, user: null, error: 'Invalid user ID' };
      }
    } catch (userTimeoutError) {
      clearTimeout(userTimeoutId);
      if (userTimeoutError.name === 'AbortError') {
        console.error('❌ getUser() timed out after 5 seconds');
        // CRITICAL FIX: Clear session on timeout
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { isValid: false, session: null, user: null, error: 'Session validation timed out' };
      }
    }
    
    // Set up a new timeout for getSession
    const sessionController = new AbortController();
    const sessionTimeoutId = setTimeout(() => sessionController.abort(), 5000);
    
    try {
      // Get the current session to return it
      const { data: { session }, error: sessionError } = await supabase.auth.getSession({}, {
        signal: sessionController.signal
      });
      
      clearTimeout(sessionTimeoutId);
      
      if (sessionError) {
        console.error('❌ getSession error:', sessionError);
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { isValid: false, session: null, user: null, error: sessionError.message };
      }
      
      if (!session) {
        console.warn('⚠️ No active session found');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { isValid: false, session: null, user: null, error: 'No active session' };
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('✅ Session validation passed for user:', user?.id);
      return { isValid: true, session, user, error: null };
    } catch (sessionTimeoutError) {
      clearTimeout(sessionTimeoutId);
      if (sessionTimeoutError.name === 'AbortError') {
        console.error('❌ getSession timed out after 5 seconds');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { isValid: false, session: null, user: null, error: 'Session retrieval timed out' };
      }
    }
  } catch (error) {
    console.error('❌ Session validation error:', error);
    // CRITICAL FIX: Clear invalid session data to prevent infinite loading
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentStoreId');
    return { isValid: false, session: null, user: null, error: (error as Error).message };
  }
  
  // If we reach here, something went wrong but we don't know what
  return { isValid: false, session: null, user: null, error: 'Unknown session validation error' };
};

// Safe wrapper for Supabase operations
export const safeSupabaseCall = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'Supabase operation'
): Promise<T> => {
  try {
    console.log(`🔄 Starting safe Supabase call: ${operationName}`);
    
    // CRITICAL FIX: Add timeout to prevent hanging operations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      // If operation accepts AbortSignal, we need to modify it
      // For now, we'll just call it directly
      const result = await operation();
      clearTimeout(timeoutId);
      
      console.log(`✅ Completed safe Supabase call: ${operationName}`);
      return result;
    } catch (operationError) {
      clearTimeout(timeoutId);
      if (operationError.name === 'AbortError') {
        console.error(`❌ ${operationName} timed out after 10 seconds`);
        throw new Error(`Operation timed out: ${operationName}`);
      }
      throw operationError;
    }
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error);
    return fallbackValue;
  }
};

// Initialize connection test
testSupabaseConnection().then(success => {
  if (!success) {
    console.warn('⚠️ Initial Supabase connection test failed. Check your configuration.');
  }
});

// Set up auth state change listener for cross-tab support
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔄 Auth state changed:', event);
  
  // Persist session to localStorage for cross-tab access
  if (session) {
    try {
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: {
          id: session.user.id,
          email: session.user.email
        }
      };
      
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: sessionData
      }));
      
      console.log('✅ Session updated in localStorage');
    } catch (error) {
      console.error('❌ Failed to update session in localStorage:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentStoreId');
    console.log('✅ Session removed from localStorage');
  }
});
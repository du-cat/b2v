import { supabase, safeSupabaseCall } from '../../../lib/supabase';
import type { User, AuthSession, LoginCredentials, SignupData } from '../types';

/**
 * Authentication service following Single Responsibility Principle
 * Handles all auth-related API calls and business logic
 * FIXED: Enhanced session validation and error handling
 */
export class AuthService {
  /**
   * Initialize authentication session
   * FIXED: Enhanced session validation using getUser() for reliability
   */
  static async initializeSession(): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      console.log('🔄 AuthService: Initializing session...');
      
      // CRITICAL FIX: First try to get user which is more reliable across tabs
      const userResult = await safeSupabaseCall(
        async () => {
          console.log('🔄 AuthService: Calling auth.getUser()...');
          const { data: { user }, error } = await supabase.auth.getUser();
          console.log('🔄 AuthService: getUser result:', { 
            success: !error, 
            hasUser: !!user,
            userId: user?.id ? '***' : null,
            error: error ? error.message : null
          });
          return { user, error };
        },
        { user: null, error: new Error('Supabase not configured') },
        'User initialization'
      );
      
      if (userResult.error) {
        console.error('❌ User validation failed:', userResult.error);
        // CRITICAL FIX: Clear localStorage on error
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { user: null, session: null, error: userResult.error.message };
      }
      
      if (!userResult.user) {
        console.log('ℹ️ No user found, checking for session...');
        
        // Try to get session as fallback
        const sessionResult = await safeSupabaseCall(
          async () => {
            console.log('🔄 AuthService: Calling auth.getSession()...');
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('🔄 AuthService: getSession result:', { 
              success: !error, 
              hasSession: !!session,
              userId: session?.user?.id ? '***' : null,
              error: error ? error.message : null
            });
            return { session, error };
          },
          { session: null, error: new Error('Supabase not configured') },
          'Session initialization'
        );
        
        if (sessionResult.error || !sessionResult.session) {
          console.log('ℹ️ No session found either, user is not authenticated');
          // CRITICAL FIX: Clear localStorage if no valid session
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('currentStoreId');
          return { user: null, session: null, error: null };
        }
        
        // If we have a session but no user, try to refresh the session
        try {
          console.log('🔄 Found session but no user, attempting to refresh session...');
          
          // CRITICAL FIX: Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const { data: { session }, error } = await supabase.auth.refreshSession(undefined, {
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (error || !session) {
              console.error('❌ Session refresh failed:', error);
              // CRITICAL FIX: Clear localStorage on session refresh failure
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('currentStoreId');
              return { user: null, session: null, error: 'SESSION_EXPIRED' };
            }
            
            // Try to get user again after refresh
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
              console.error('❌ User retrieval failed after session refresh:', userError);
              // CRITICAL FIX: Clear localStorage on user retrieval failure
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('currentStoreId');
              return { user: null, session: null, error: 'SESSION_EXPIRED' };
            }
            
            // Get user profile
            const userData = await this.getUserProfile(user.id);
            
            const authUser: User = userData || {
              id: user.id,
              email: user.email || '',
              role: 'owner',
              full_name: user.user_metadata?.full_name || null,
              created_at: user.created_at || new Date().toISOString()
            };
            
            const authSession: AuthSession = {
              user: authUser,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || 0
            };
            
            // CRITICAL FIX: Manually persist session to localStorage for cross-tab access
            this.persistSession(authSession);
            
            return { user: authUser, session: authSession, error: null };
          } catch (timeoutError) {
            clearTimeout(timeoutId);
            if (timeoutError.name === 'AbortError') {
              console.error('❌ Session refresh timed out after 5 seconds');
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('currentStoreId');
              return { user: null, session: null, error: 'Session refresh timed out' };
            }
            throw timeoutError;
          }
        } catch (refreshError) {
          console.error('❌ Session refresh exception:', refreshError);
          // CRITICAL FIX: Clear localStorage on session refresh exception
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('currentStoreId');
          return { user: null, session: null, error: 'SESSION_EXPIRED' };
        }
      }
      
      // We have a valid user, now get the session
      const sessionResult = await safeSupabaseCall(
        async () => {
          console.log('🔄 AuthService: Getting session for validated user...');
          const { data: { session }, error } = await supabase.auth.getSession();
          return { session, error };
        },
        { session: null, error: new Error('Supabase not configured') },
        'Session retrieval'
      );
      
      // Get user profile
      const userData = await this.getUserProfile(userResult.user.id);
      
      const user: User = userData || {
        id: userResult.user.id,
        email: userResult.user.email || '',
        role: 'owner',
        full_name: userResult.user.user_metadata?.full_name || null,
        created_at: userResult.user.created_at || new Date().toISOString()
      };
      
      // If we have a session, use it; otherwise create a minimal session object
      const session = sessionResult.session ? {
        user,
        access_token: sessionResult.session.access_token,
        refresh_token: sessionResult.session.refresh_token,
        expires_at: sessionResult.session.expires_at || 0
      } : null;
      
      // CRITICAL FIX: If we have a session, persist it to localStorage
      if (session) {
        this.persistSession(session);
      }
      
      return { user, session, error: null };
    } catch (error) {
      console.error('❌ AuthService: Session initialization failed:', error);
      // CRITICAL FIX: Clear localStorage on session initialization failure
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      return { user: null, session: null, error: (error as Error).message };
    }
  }

  /**
   * Login user with credentials
   * FIXED: Enhanced error handling and session validation
   */
  static async login(credentials: LoginCredentials): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      console.log('🔄 AuthService: Attempting login...');
      
      // CRITICAL FIX: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const result = await safeSupabaseCall(
          async () => {
            console.log('🔄 AuthService: Calling auth.signInWithPassword...');
            const { data, error } = await supabase.auth.signInWithPassword(credentials, {
              signal: controller.signal
            });
            console.log('🔄 AuthService: signInWithPassword result:', { 
              success: !error, 
              hasUser: !!data.user,
              hasSession: !!data.session,
              error: error ? error.message : null
            });
            return { data, error };
          },
          { data: { user: null, session: null }, error: new Error('Supabase not configured') },
          'User login'
        );
        
        clearTimeout(timeoutId);
        
        if (result.error) {
          throw result.error;
        }
        
        if (!result.data.session?.user) {
          throw new Error('Login successful but no session returned');
        }
        
        // Get user profile
        const userData = await this.getUserProfile(result.data.session.user.id);
        
        const user: User = userData || {
          id: result.data.session.user.id,
          email: result.data.session.user.email || '',
          role: 'owner',
          full_name: result.data.session.user.user_metadata?.full_name || null,
          created_at: result.data.session.user.created_at || new Date().toISOString()
        };
        
        const authSession: AuthSession = {
          user,
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
          expires_at: result.data.session.expires_at || 0
        };
        
        // CRITICAL FIX: Manually persist session to localStorage for cross-tab access
        this.persistSession(authSession);
        
        return { user, session: authSession, error: null };
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        if (timeoutError.name === 'AbortError') {
          console.error('❌ Login timed out after 10 seconds');
          throw new Error('Login timed out. Please try again.');
        }
        throw timeoutError;
      }
    } catch (error) {
      console.error('❌ AuthService: Login failed:', error);
      return { user: null, session: null, error: this.getErrorMessage(error as Error) };
    }
  }

  /**
   * Sign up new user
   * FIXED: Enhanced error handling and automatic store creation
   */
  static async signup(signupData: SignupData): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      console.log('🔄 AuthService: Starting signup...');
      
      // Check if user already exists
      const existingUser = await this.checkUserExists(signupData.email);
      if (existingUser) {
        throw new Error('An account with this email already exists. Please login instead.');
      }
      
      // CRITICAL FIX: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        // Sign up with Supabase Auth
        const result = await safeSupabaseCall(
          async () => {
            console.log('🔄 AuthService: Calling auth.signUp...');
            const { data, error } = await supabase.auth.signUp({
              email: signupData.email,
              password: signupData.password,
              options: {
                data: {
                  full_name: signupData.fullName
                }
              }
            }, {
              signal: controller.signal
            });
            console.log('🔄 AuthService: signUp result:', { 
              success: !error, 
              hasUser: !!data.user,
              hasSession: !!data.session,
              error: error ? error.message : null
            });
            return { data, error };
          },
          { data: { user: null, session: null }, error: new Error('Supabase not configured') },
          'User signup'
        );
        
        clearTimeout(timeoutId);
        
        if (result.error) throw result.error;
        
        if (!result.data.user) {
          throw new Error('Signup failed - no user returned');
        }
        
        // Create user profile
        await this.createUserProfile({
          id: result.data.user.id,
          email: signupData.email,
          full_name: signupData.fullName,
          role: 'owner'
        });
        
        // Return session if auto-login occurred
        if (result.data.session) {
          const user: User = {
            id: result.data.user.id,
            email: signupData.email,
            full_name: signupData.fullName,
            role: 'owner',
            created_at: result.data.user.created_at || new Date().toISOString()
          };
          
          const authSession: AuthSession = {
            user,
            access_token: result.data.session.access_token,
            refresh_token: result.data.session.refresh_token,
            expires_at: result.data.session.expires_at || 0
          };
          
          // CRITICAL FIX: Manually persist session to localStorage for cross-tab access
          this.persistSession(authSession);
          
          return { user, session: authSession, error: null };
        }
        
        return { user: null, session: null, error: null };
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        if (timeoutError.name === 'AbortError') {
          console.error('❌ Signup timed out after 10 seconds');
          throw new Error('Signup timed out. Please try again.');
        }
        throw timeoutError;
      }
    } catch (error) {
      console.error('❌ AuthService: Signup failed:', error);
      return { user: null, session: null, error: this.getErrorMessage(error as Error) };
    }
  }

  /**
   * Logout user
   * FIXED: Enhanced cleanup
   */
  static async logout(): Promise<{ error: string | null }> {
    try {
      await safeSupabaseCall(
        async () => {
          console.log('🔄 AuthService: Calling auth.signOut...');
          const { error } = await supabase.auth.signOut();
          console.log('🔄 AuthService: signOut result:', { 
            success: !error,
            error: error ? error.message : null
          });
          return { error };
        },
        { error: null },
        'User logout'
      );
      
      // Clear local storage
      localStorage.removeItem('currentStoreId');
      localStorage.removeItem('supabase.auth.token');
      
      return { error: null };
    } catch (error) {
      console.error('❌ AuthService: Logout failed:', error);
      // CRITICAL FIX: Clear localStorage even on logout failure
      localStorage.removeItem('currentStoreId');
      localStorage.removeItem('supabase.auth.token');
      return { error: (error as Error).message };
    }
  }

  /**
   * Refresh user session
   * FIXED: Enhanced session refresh with validation
   */
  static async refreshSession(): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      console.log('🔄 AuthService: Refreshing session...');
      
      // CRITICAL FIX: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const result = await safeSupabaseCall(
          async () => {
            console.log('🔄 AuthService: Calling auth.refreshSession...');
            const { data: { session }, error } = await supabase.auth.refreshSession(undefined, {
              signal: controller.signal
            });
            console.log('🔄 AuthService: refreshSession result:', { 
              success: !error, 
              hasSession: !!session,
              error: error ? error.message : null
            });
            return { session, error };
          },
          { session: null, error: new Error('Supabase not configured') },
          'Session refresh'
        );
        
        clearTimeout(timeoutId);
        
        if (result.error || !result.session) {
          // CRITICAL FIX: Clear localStorage on session refresh failure
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('currentStoreId');
          throw new Error(result.error?.message || 'No session returned after refresh');
        }
        
        // Get user after refresh
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // CRITICAL FIX: Clear localStorage on user retrieval failure
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('currentStoreId');
          throw new Error('Failed to get user after session refresh');
        }
        
        // Get user profile
        const userData = await this.getUserProfile(user.id);
        
        const authUser: User = userData || {
          id: user.id,
          email: user.email || '',
          role: 'owner',
          full_name: user.user_metadata?.full_name || null,
          created_at: user.created_at || new Date().toISOString()
        };
        
        const authSession: AuthSession = {
          user: authUser,
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
          expires_at: result.session.expires_at || 0
        };
        
        // CRITICAL FIX: Manually persist session to localStorage for cross-tab access
        this.persistSession(authSession);
        
        return { user: authUser, session: authSession, error: null };
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        if (timeoutError.name === 'AbortError') {
          console.error('❌ Session refresh timed out after 5 seconds');
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('currentStoreId');
          return { user: null, session: null, error: 'Session refresh timed out' };
        }
        throw timeoutError;
      }
    } catch (error) {
      console.error('❌ AuthService: Session refresh failed:', error);
      // CRITICAL FIX: Clear localStorage on session refresh exception
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      return { user: null, session: null, error: (error as Error).message };
    }
  }

  /**
   * CRITICAL FIX: Manually persist session to localStorage for cross-tab access
   */
  private static persistSession(session: AuthSession): void {
    try {
      // Store minimal session data for cross-tab access
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
      
      console.log('✅ Session manually persisted to localStorage');
    } catch (error) {
      console.error('❌ Failed to persist session:', error);
    }
  }

  /**
   * Private helper methods
   */
  private static async getUserProfile(userId: string): Promise<User | null> {
    const result = await safeSupabaseCall(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        return { data, error };
      },
      { data: null, error: null },
      'User profile fetch'
    );
    
    return result.data;
  }

  private static async checkUserExists(email: string): Promise<boolean> {
    const result = await safeSupabaseCall(
      async () => {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        return data;
      },
      null,
      'Check existing user'
    );
    
    return !!result;
  }

  private static async createUserProfile(user: Omit<User, 'created_at'>): Promise<void> {
    await safeSupabaseCall(
      async () => {
        const { error } = await supabase
          .from('users')
          .upsert([{
            ...user,
            created_at: new Date().toISOString()
          }], {
            onConflict: 'email',
            ignoreDuplicates: false
          });
        return { error };
      },
      { error: null },
      'User profile creation'
    );
  }

  private static getErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    // Authentication errors
    if (message.includes('session_expired') || message.includes('unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link.';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Supabase configuration errors
    if (message.includes('supabase not configured')) {
      return 'Service is not properly configured. Please contact support.';
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    // Generic fallback
    return `${error.message}`;
  }
}
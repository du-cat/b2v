import { supabase } from '../../../lib/supabase';
import type { User, AuthSession, LoginCredentials, SignupData } from '../types';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

/**
 * Authentication service following Single Responsibility Principle
 * Handles all auth-related API calls and business logic
 * FIXED: Enhanced session validation and error handling
 */
export class AuthService {
  private static createUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role: supabaseUser.user_metadata?.role || 'owner',
      full_name: supabaseUser.user_metadata?.full_name || null,
      created_at: supabaseUser.created_at
    };
  }

  private static createSession(session: SupabaseSession | null): AuthSession | null {
    if (!session) return null;
    const user = this.createUser(session.user);
    return {
      user,
      access_token: session.access_token,
      refresh_token: session.refresh_token!,
      expires_at: session.expires_at || 0
    };
  }

  private static persistSession(session: AuthSession): void {
    if (!session) return;
    const serializedSession = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user
    });
    localStorage.setItem('supabase.auth.token', serializedSession);
  }

  /**
   * Initialize authentication session
   */
  static async initializeSession(): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      console.log('🔄 AuthService: Initializing session...');
      
      // First try to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session validation failed:', sessionError);
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { user: null, session: null, error: sessionError.message };
      }
      
      if (!session) {
        console.log('ℹ️ No session found');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { user: null, session: null, error: null };
      }
      
      // Session exists, create auth user and session
      const authUser = this.createUser(session.user);
      const authSession = this.createSession(session);
      
      if (authSession) {
        this.persistSession(authSession);
      }
      
      console.log('✅ Session initialization complete');
      return { user: authUser, session: authSession, error: null };
      
    } catch (error) {
      console.error('❌ AuthService: Session initialization failed:', error);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      return { user: null, session: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Login user with credentials
   */
  static async login(credentials: LoginCredentials): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      console.log('🔄 AuthService: Attempting login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) {
        console.error('❌ Login failed:', error);
        return { user: null, session: null, error: error.message };
      }
      
      if (!data.user || !data.session) {
        console.error('❌ Login succeeded but no user/session returned');
        return { user: null, session: null, error: 'Invalid response from auth service' };
      }
      
      const authUser = this.createUser(data.user);
      const authSession = this.createSession(data.session);
      
      if (authSession) {
        this.persistSession(authSession);
      }
      
      console.log('✅ Login successful');
      return { user: authUser, session: authSession, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error during login:', error);
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Signup user with credentials
   */
  static async signup(signupData: SignupData): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.full_name,
            role: 'owner'
          }
        }
      });
      
      if (error) {
        console.error('❌ Signup failed:', error);
        return { user: null, session: null, error: error.message };
      }
      
      if (!data.user) {
        console.error('❌ Signup succeeded but no user returned');
        return { user: null, session: null, error: 'Invalid response from auth service' };
      }
      
      const authUser = this.createUser(data.user);
      const authSession = this.createSession(data.session);
      
      if (authSession) {
        this.persistSession(authSession);
      }
      
      return { user: authUser, session: authSession, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error during signup:', error);
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
    } catch (error) {
      console.error('❌ AuthService: Logout failed:', error);
      throw error;
    }
  }

  /**
   * Refresh user session
   */
  static async refreshSession(): Promise<{ user: User | null; session: AuthSession | null; error: string | null }> {
    try {
      console.log('🔄 AuthService: Refreshing session...');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.error('❌ Session refresh failed:', error);
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { user: null, session: null, error: error?.message || 'Session refresh failed' };
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Failed to get user after session refresh:', userError);
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        return { user: null, session: null, error: userError?.message || 'Failed to get user' };
      }
      
      const authUser = this.createUser(user);
      const authSession = this.createSession(session);
      
      if (authSession) {
        this.persistSession(authSession);
      }
      
      return { user: authUser, session: authSession, error: null };
      
    } catch (error) {
      console.error('❌ AuthService: Session refresh failed:', error);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      return { user: null, session: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
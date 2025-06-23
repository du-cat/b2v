import { create } from 'zustand';
import { AuthService } from '../services/AuthService';
import type { AuthState, LoginCredentials, SignupData } from '../types';
import { supabase } from '../../../lib/supabase';

interface AuthStore extends AuthState {
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (signupData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  session: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await AuthService.initializeSession();
      
      if (result.error === 'SESSION_EXPIRED' || !result.user) {
        console.log('🔄 Clearing invalid session data');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
      }
      
      set({
        user: result.user,
        session: result.session,
        error: result.error,
        isLoading: false,
        isInitialized: true
      });
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      
      set({
        user: null,
        session: null,
        error: (error as Error).message,
        isLoading: false,
        isInitialized: true
      });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await AuthService.login(credentials);
      
      if (result.error || !result.user || !result.session) {
        throw new Error(result.error || 'Login failed - no valid session');
      }
      
      set({
        user: result.user,
        session: result.session,
        error: null,
        isLoading: false,
        isInitialized: true  // Ensure we're initialized after successful login
      });
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      set({
        user: null,
        session: null,
        error: (error as Error).message,
        isLoading: false,
        isInitialized: true  // Still mark as initialized even on failure
      });
      throw error;  // Re-throw to let UI handle the error
    }
  },

  signup: async (signupData: SignupData) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await AuthService.signup(signupData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      set({
        user: result.user,
        session: result.session,
        error: null,
        isLoading: false,
        isInitialized: true
      });
      
    } catch (error) {
      console.error('❌ Signup failed:', error);
      set({
        error: (error as Error).message,
        isLoading: false
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      set({
        user: null,
        session: null,
        error: null,
        isLoading: false,
        isInitialized: true
      });
      
      // CRITICAL FIX: Clear localStorage on logout
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      set({
        error: (error as Error).message,
        isLoading: false
      });
      throw error;
    }
  },

  refreshSession: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await AuthService.refreshSession();
      
      if (result.error) {
        // CRITICAL FIX: Clear localStorage on session refresh failure
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('currentStoreId');
        throw new Error(result.error);
      }
      
      set({
        user: result.user,
        session: result.session,
        error: null,
        isLoading: false
      });
    } catch (error) {
      console.error('❌ AuthStore: Session refresh failed:', error);
      set({
        error: (error as Error).message,
        isLoading: false
      });
      throw error;
    }
  }
}));
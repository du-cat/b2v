import { create } from 'zustand';
import { AuthService } from '../services/AuthService';
import type { AuthState, LoginCredentials, SignupData } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

/**
 * Authentication store following Single Responsibility Principle
 * Manages auth state only - no business logic
 * FIXED: Added session persistence and cross-tab support
 */
interface AuthStore extends AuthState {
  // Actions
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
  isLoading: true,
  error: null,
  isInitialized: false,

  // Actions
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // CRITICAL FIX: Check for persisted session in localStorage
      const persistedSession = localStorage.getItem('supabase.auth.token');
      if (persistedSession) {
        console.log('🔍 Found persisted session in localStorage');
      }
      
      const result = await AuthService.initializeSession();
      
      // CRITICAL FIX: If session initialization fails, clear localStorage to prevent infinite loading
      if (result.error === 'SESSION_EXPIRED' || !result.user) {
        console.log('🔄 Clearing invalid session data from localStorage');
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
      
      // Set up auth state change listener for cross-tab support
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Refresh the store with the latest user data
            const { user, session: newSession, error } = await AuthService.initializeSession();
            set({ user, session: newSession, error });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, session: null });
            // CRITICAL FIX: Clear localStorage on sign out
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('currentStoreId');
          }
        }
      );
      
      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('❌ AuthStore: Initialize failed:', error);
      // CRITICAL FIX: Clear localStorage on initialization failure
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
      
      toast.success('Login successful!');
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error(errorMessage);
      throw error;
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
      
      toast.success('Account created successfully!');
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error(errorMessage);
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await AuthService.logout();
      
      if (result.error) {
        throw new Error(result.error);
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
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ AuthStore: Logout failed:', error);
      // CRITICAL FIX: Clear localStorage even on logout failure
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentStoreId');
      
      set({
        error: (error as Error).message,
        isLoading: false
      });
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
  },

  clearError: () => {
    set({ error: null });
  }
}));
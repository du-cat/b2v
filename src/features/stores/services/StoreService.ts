import { supabase, safeSupabaseCall, validateSession } from '../../../lib/supabase';
import type { Store, CreateStoreData } from '../types';

/**
 * Store service following Single Responsibility Principle
 * Handles all store-related API calls and business logic
 */
export class StoreService {
  /**
   * Fetch all stores for a user
   */
  static async fetchStores(userId: string): Promise<{ stores: Store[]; error: string | null }> {
    try {
      console.log('🔄 StoreService: Fetching stores for user:', userId);
      
      const { isValid, error: sessionError } = await validateSession();
      if (!isValid) {
        throw new Error(sessionError || 'SESSION_EXPIRED');
      }

      const result = await safeSupabaseCall(async () => {
        return await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', userId);
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return { stores: result.data || [], error: null };
      
    } catch (error) {
      console.error('❌ StoreService: Fetch stores failed:', error);
      return { 
        stores: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch stores' 
      };
    }
  }

  /**
   * Create a new store
   */
  static async createStore(storeData: CreateStoreData): Promise<{ store: Store | null; error: string | null }> {
    try {
      console.log('🔄 StoreService: Creating store:', storeData);
      
      // First validate the session using our helper
      const { isValid, user, error: sessionError } = await validateSession();
      
      // Debug logging
      console.log('🔍 Session validation result:', {
        isValid,
        userId: user?.id,
        error: sessionError
      });

      if (!isValid || !user) {
        console.error('❌ Session validation failed:', sessionError);
        throw new Error(sessionError || 'SESSION_EXPIRED');
      }

      console.log('✓ Session valid, user ID:', user.id);

      // Prepare store data with the current user's ID
      const newStoreData: CreateStoreData = {
        owner_id: user.id, // Always use the authenticated user's ID
        name: storeData.name.trim(),
        location: storeData.location.trim(),
        timezone: storeData.timezone.trim()
      };

      console.log('🔄 Attempting to create store with data:', newStoreData);

      // Create store using our safe call wrapper
      const result = await safeSupabaseCall(async () => {
        return await supabase
          .from('stores')
          .insert([newStoreData])
          .select()
          .single();
      });

      if (result.error) {
        console.error('❌ Store creation failed:', result.error);
        
        // Check for specific error types
        if (result.error.code === '23503') {
          console.error('❌ Foreign key violation. User ID may not exist in auth.users table. User ID:', user.id);
          throw new Error('Failed to create store: Invalid owner ID. Please try logging out and back in.');
        }
        
        throw new Error(result.error.message || 'Failed to create store');
      }

      if (!result.data) {
        throw new Error('Store created but no data returned');
      }

      console.log('✅ Store created successfully:', result.data);
      return { store: result.data, error: null };
      
    } catch (error) {
      console.error('❌ StoreService: Create store failed:', error);
      return {
        store: null,
        error: error instanceof Error ? error.message : 'Failed to create store'
      };
    }
  }

  /**
   * Update an existing store
   * FIXED: Enhanced authentication validation
   */
  static async updateStore(storeId: string, updateData: Partial<CreateStoreData>): Promise<{ store: Store | null; error: string | null }> {
    try {
      // CRITICAL FIX: Refresh session before updating store
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('❌ Session refresh failed:', refreshError);
        throw new Error('SESSION_EXPIRED');
      }
      
      // CRITICAL FIX: Use getUser() for authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('SESSION_EXPIRED');
      }
      
      const result = await safeSupabaseCall(
        async () => {
          const { data, error } = await supabase
            .from('stores')
            .update(updateData)
            .eq('id', storeId)
            .select()
            .single();
          return { data, error };
        },
        { data: null, error: new Error('Supabase not configured') },
        'Update store'
      );
      
      if (result.error) {
        if (result.error.code === '42501' || result.error.message.includes('permission') || result.error.message.includes('RLS')) {
          throw new Error('SESSION_EXPIRED');
        }
        throw result.error;
      }
      
      return { store: result.data as Store, error: null };
    } catch (error) {
      console.error('❌ StoreService: Update store failed:', error);
      const errorMessage = (error as Error).message;
      return { 
        store: null, 
        error: errorMessage === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : errorMessage 
      };
    }
  }

  /**
   * Check session validity
   * FIXED: Use getUser() for better reliability
   */
  static async checkSessionValidity(): Promise<boolean> {
    try {
      console.log('🔄 StoreService: Checking session validity');
      
      // CRITICAL FIX: Try to refresh the session first
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        // Continue with getUser() to see if we still have a valid session
      } else if (refreshData.session) {
        console.log('✅ Session refreshed successfully');
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      const isValid = !error && !!user;
      console.log(`🔄 Session validity check result: ${isValid ? 'Valid' : 'Invalid'}`);
      
      if (error) {
        console.error('❌ Session validity check error:', error);
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ StoreService: Session validity check failed:', error);
      return false;
    }
  }
}
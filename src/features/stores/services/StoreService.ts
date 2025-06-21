import { supabase, safeSupabaseCall } from '../../../lib/supabase';
import type { Store, CreateStoreData } from '../types';

/**
 * Store service following Single Responsibility Principle
 * Handles all store-related API calls and business logic
 * FIXED: Enhanced session validation and proper auth handling
 */
export class StoreService {
  /**
   * Fetch all stores for a user
   * FIXED: Enhanced session validation and error handling
   */
  static async fetchStores(userId: string): Promise<{ stores: Store[]; error: string | null }> {
    try {
      console.log('🔄 StoreService: Fetching stores for user:', userId);
      
      // CRITICAL FIX: Refresh session before fetching stores
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        // Continue with getUser() to see if we still have a valid session
      } else if (refreshData.session) {
        console.log('✅ Session refreshed successfully');
      }
      
      // CRITICAL FIX: Use getUser() instead of getSession() for better reliability
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        throw new Error('SESSION_EXPIRED');
      }
      
      if (user.id !== userId) {
        console.error('❌ User ID mismatch:', { expected: userId, actual: user.id });
        throw new Error('SESSION_EXPIRED');
      }
      
      console.log('✅ User authentication verified for store fetch');
      
      const result = await safeSupabaseCall(
        async () => {
          console.log('🔄 Making Supabase call to fetch stores');
          const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });
          
          console.log('🔄 Supabase fetch stores response:', { 
            success: !error, 
            dataCount: data?.length || 0,
            error: error ? { code: error.code, message: error.message } : null
          });
          
          return { data, error };
        },
        { data: [], error: new Error('Supabase not configured') },
        'Fetch stores'
      );
      
      if (result.error) {
        // Handle auth-related errors
        if (result.error.code === '42501' || result.error.message.includes('permission') || result.error.message.includes('RLS')) {
          console.error('❌ Permission error fetching stores:', result.error);
          throw new Error('SESSION_EXPIRED');
        }
        console.error('❌ Database error fetching stores:', result.error);
        throw result.error;
      }
      
      console.log(`✅ StoreService: Successfully fetched ${result.data.length} stores`);
      return { stores: result.data as Store[], error: null };
    } catch (error) {
      console.error('❌ StoreService: Fetch stores failed:', error);
      const errorMessage = (error as Error).message;
      return { 
        stores: [], 
        error: errorMessage === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : errorMessage 
      };
    }
  }

  /**
   * Create a new store
   * FIXED: Complete rewrite with proper authentication and RLS compliance
   */
  static async createStore(storeData: CreateStoreData): Promise<{ store: Store | null; error: string | null }> {
    try {
      console.log('🔄 StoreService: Creating store with data:', {
        ...storeData,
        owner_id: '***' // Hide the actual ID in logs
      });
      
      // CRITICAL FIX: Refresh session before attempting store creation
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        throw new Error('SESSION_EXPIRED');
      }
      
      if (!refreshData.session) {
        console.error('❌ Session refresh returned no session');
        throw new Error('SESSION_EXPIRED');
      }
      
      console.log('✅ Session refreshed successfully, token expires at:', new Date(refreshData.session.expires_at * 1000).toISOString());
      
      // CRITICAL FIX: Use getUser() for more reliable authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ User authentication failed during store creation:', userError);
        throw new Error('SESSION_EXPIRED');
      }
      
      console.log('✅ User authentication verified for store creation:', user.id);
      
      // CRITICAL FIX: Verify owner_id matches authenticated user ID
      if (user.id !== storeData.owner_id) {
        console.error('❌ Owner ID mismatch:', { 
          providedOwnerId: storeData.owner_id, 
          authenticatedUserId: user.id 
        });
        throw new Error('Owner ID must match authenticated user ID');
      }
      
      // CRITICAL FIX: Run debug function to check RLS permissions
      try {
        const { data: debugResult, error: debugError } = await supabase
          .rpc('debug_store_creation', { test_owner_id: user.id });
        
        if (debugError) {
          console.warn('⚠️ Could not run store creation debug:', debugError);
        } else if (debugResult && debugResult.length > 0) {
          const debug = debugResult[0];
          console.log('🔍 Store creation debug result:', debug);
          
          if (!debug.can_insert) {
            throw new Error(`Store creation blocked: ${debug.error_message}`);
          }
          
          if (!debug.ids_match) {
            throw new Error('User ID mismatch: auth.uid() does not match owner_id');
          }
        }
      } catch (debugError) {
        console.warn('⚠️ Store creation debug check failed:', debugError);
        // Continue with store creation attempt even if debug check fails
      }
      
      console.log('🔄 Creating store with RLS-compliant payload:', {
        name: storeData.name,
        location: storeData.location,
        timezone: storeData.timezone,
        owner_id: '***' // Hide the actual ID in logs
      });
      
      const result = await safeSupabaseCall(
        async () => {
          console.log('🔄 Making Supabase call to insert store');
          const { data, error } = await supabase
            .from('stores')
            .insert([{
              name: storeData.name,
              location: storeData.location,
              timezone: storeData.timezone,
              owner_id: user.id, // CRITICAL FIX: Use the verified user ID from auth
            }])
            .select()
            .single();
          
          console.log('🔄 Supabase insert store response:', { 
            success: !error, 
            data: data ? 'Store data returned' : 'No data returned',
            error: error ? { 
              code: error.code, 
              message: error.message,
              details: error.details,
              hint: error.hint
            } : null
          });
          
          return { data, error };
        },
        { data: null, error: new Error('Supabase not configured') },
        'Create store'
      );
      
      if (result.error) {
        console.error('❌ Store creation error:', result.error);
        
        // Handle specific error types
        if (result.error.code === '42501' || result.error.message.includes('permission') || result.error.message.includes('RLS')) {
          console.error('❌ Permission error creating store:', {
            code: result.error.code,
            message: result.error.message,
            details: result.error.details,
            hint: result.error.hint
          });
          throw new Error('SESSION_EXPIRED');
        } else if (result.error.code === '23505') {
          throw new Error('A store with this name already exists. Please choose a different name.');
        } else if (result.error.message.includes('row-level security')) {
          console.error('❌ RLS policy violation:', result.error);
          throw new Error('SESSION_EXPIRED');
        } else {
          throw new Error(`Database error: ${result.error.message}`);
        }
      }
      
      if (!result.data) {
        console.error('❌ Store creation succeeded but no data returned');
        throw new Error('Store creation succeeded but no data returned');
      }
      
      const store = result.data as Store;
      console.log('✅ StoreService: Store created successfully:', {
        id: store.id,
        name: store.name,
        owner_id: '***' // Hide the actual ID in logs
      });
      
      return { store, error: null };
    } catch (error) {
      console.error('❌ StoreService: Create store failed:', error);
      const errorMessage = (error as Error).message;
      return { 
        store: null, 
        error: errorMessage === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : errorMessage 
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
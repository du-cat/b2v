import { supabase } from '../lib/supabase';
import type { Store } from '../types';

/**
 * Production-grade utility to provision a default store for a user
 * 
 * @param userId - The authenticated user's ID
 * @param options - Optional configuration for the store
 * @returns Promise<Store> - The created store object
 * @throws Error if provisioning fails
 */
export interface ProvisionStoreOptions {
  name?: string;
  location?: string;
  timezone?: string;
}

export async function provisionDefaultStore(
  userId: string, 
  options: ProvisionStoreOptions = {}
): Promise<Store> {
  console.log('🔄 Provisioning default store for user:', userId);
  
  // Validate input
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided for store provisioning');
  }
  
  // Default store configuration
  const defaultConfig = {
    name: options.name || 'My First Store',
    location: options.location || 'Default Location',
    timezone: options.timezone || 'America/Chicago', // Central Time (CT)
  };
  
  try {
    // Verify user session is valid before proceeding
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session validation error:', sessionError);
      throw new Error('Session validation failed. Please log in again.');
    }
    
    if (!session?.user || session.user.id !== userId) {
      console.error('❌ Session user mismatch or no session');
      throw new Error('Invalid session. Please log in again.');
    }
    
    console.log('✅ Session validated for store provisioning');
    
    // Debug: Test auth context before proceeding
    try {
      const { data: authTest, error: authTestError } = await supabase
        .rpc('test_auth_context');
      
      if (authTestError) {
        console.error('❌ Auth context test failed:', authTestError);
      } else {
        console.log('🔍 Auth context test:', authTest);
      }
    } catch (debugError) {
      console.warn('⚠️ Could not run auth context test:', debugError);
    }
    
    // Debug: Test store creation permissions
    try {
      const { data: debugResult, error: debugError } = await supabase
        .rpc('debug_store_creation', { test_owner_id: userId });
      
      if (debugError) {
        console.error('❌ Store creation debug failed:', debugError);
      } else {
        console.log('🔍 Store creation debug:', debugResult);
        
        if (debugResult && debugResult.length > 0) {
          const debug = debugResult[0];
          if (!debug.can_insert) {
            throw new Error(`Store creation blocked: ${debug.error_message}`);
          }
        }
      }
    } catch (debugError) {
      console.warn('⚠️ Could not run store creation debug:', debugError);
    }
    
    // Check if user already has stores (prevent duplicate default stores)
    const { data: existingStores, error: checkError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('owner_id', userId)
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing stores:', checkError);
      throw new Error(`Failed to check existing stores: ${checkError.message}`);
    }
    
    if (existingStores && existingStores.length > 0) {
      console.log('⚠️ User already has stores, skipping default store creation');
      throw new Error('User already has existing stores. Default store not needed.');
    }
    
    // Create the default store
    console.log('🔄 Creating default store with config:', {
      ...defaultConfig,
      owner_id: '***' // Hide user ID in logs
    });
    
    const { data: newStore, error: createError } = await supabase
      .from('stores')
      .insert([{
        owner_id: userId,
        name: defaultConfig.name,
        location: defaultConfig.location,
        timezone: defaultConfig.timezone,
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Store creation error:', createError);
      
      // Handle specific error types
      if (createError.code === '23505') {
        throw new Error('A store with this name already exists. Please choose a different name.');
      } else if (createError.code === '42501' || createError.message.includes('row-level security')) {
        // Enhanced RLS error handling
        console.error('❌ RLS Policy violation details:', {
          code: createError.code,
          message: createError.message,
          hint: createError.hint,
          details: createError.details
        });
        
        throw new Error('Permission denied: Unable to create store. Please ensure you are properly logged in and try again.');
      } else if (createError.message.includes('permission')) {
        throw new Error('Permission denied. Please ensure you are logged in.');
      } else {
        throw new Error(`Failed to create store: ${createError.message}`);
      }
    }
    
    if (!newStore) {
      throw new Error('Store creation succeeded but no data returned');
    }
    
    const store = newStore as Store;
    
    console.log('✅ Default store provisioned successfully:', {
      id: store.id,
      name: store.name,
      location: store.location,
      timezone: store.timezone
    });
    
    // Verify the store was created correctly
    if (!store.id || !store.name || store.owner_id !== userId) {
      console.error('❌ Store data validation failed:', store);
      throw new Error('Store created but data validation failed');
    }
    
    return store;
    
  } catch (error) {
    console.error('❌ Store provisioning failed:', error);
    
    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Store provisioning failed: ${error.message}`);
    } else {
      throw new Error('Store provisioning failed due to unknown error');
    }
  }
}

/**
 * Provision default store and automatically set it as current store
 * 
 * @param userId - The authenticated user's ID
 * @param options - Optional configuration for the store
 * @returns Promise<Store> - The created and selected store
 */
export async function provisionAndSelectDefaultStore(
  userId: string,
  options: ProvisionStoreOptions = {}
): Promise<Store> {
  try {
    const store = await provisionDefaultStore(userId, options);
    
    // Save to localStorage for persistence
    localStorage.setItem('currentStoreId', store.id);
    console.log('✅ Default store set as current store');
    
    return store;
  } catch (error) {
    console.error('❌ Failed to provision and select default store:', error);
    throw error;
  }
}

/**
 * Utility to check if a user needs a default store
 * 
 * @param userId - The authenticated user's ID
 * @returns Promise<boolean> - True if user needs a default store
 */
export async function userNeedsDefaultStore(userId: string): Promise<boolean> {
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);
    
    if (error) {
      console.error('❌ Error checking if user needs default store:', error);
      return false; // Assume they don't need one if we can't check
    }
    
    return !stores || stores.length === 0;
  } catch (error) {
    console.error('❌ Error in userNeedsDefaultStore:', error);
    return false;
  }
}
import { provisionAndSelectDefaultStore, userNeedsDefaultStore } from './provisionDefaultStore';
import toast from 'react-hot-toast';

/**
 * Handle post-signup operations including default store creation
 * 
 * @param userId - The newly created user's ID
 * @param userEmail - The user's email for logging
 * @returns Promise<boolean> - True if all operations succeeded
 */
export async function handlePostSignupOperations(
  userId: string, 
  userEmail: string
): Promise<boolean> {
  try {
    console.log('🔄 Starting post-signup operations for:', userEmail);
    
    // Check if user needs a default store
    const needsStore = await userNeedsDefaultStore(userId);
    
    if (!needsStore) {
      console.log('ℹ️ User already has stores, skipping default store creation');
      return true;
    }
    
    // Provision default store with custom configuration
    const defaultStore = await provisionAndSelectDefaultStore(userId, {
      name: "My First Store",
      location: "Default Location", 
      timezone: "America/Chicago" // Central Time (CT)
    });
    
    console.log('✅ Post-signup operations completed successfully');
    toast.success(`Welcome! Your store "${defaultStore.name}" is ready.`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Post-signup operations failed:', error);
    
    // Show user-friendly error message
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('already has existing stores')) {
      // This is not really an error, just log it
      console.log('ℹ️ User already has stores, no default store needed');
      return true;
    } else {
      toast.error('Account created but store setup failed. You can create a store manually.');
      return false;
    }
  }
}

/**
 * Provision store from admin tools or manual triggers
 * 
 * @param userId - Target user ID
 * @param storeConfig - Custom store configuration
 * @returns Promise<Store> - The created store
 */
export async function provisionStoreForUser(
  userId: string,
  storeConfig: {
    name: string;
    location: string;
    timezone: string;
  }
) {
  try {
    console.log('🔄 Admin provisioning store for user:', userId);
    
    const store = await provisionAndSelectDefaultStore(userId, storeConfig);
    
    console.log('✅ Admin store provisioning completed');
    toast.success(`Store "${store.name}" created successfully`);
    
    return store;
    
  } catch (error) {
    console.error('❌ Admin store provisioning failed:', error);
    toast.error(`Failed to create store: ${(error as Error).message}`);
    throw error;
  }
}
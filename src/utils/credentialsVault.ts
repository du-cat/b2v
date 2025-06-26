import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabase';
import { ProviderCredentials } from '../types/integrations';

/**
 * Credentials Vault utility for securely encrypting and decrypting provider credentials
 * Uses JWT from Supabase auth + AES-256 encryption
 */
export class CredentialsVault {
  private static async getEncryptionKey(): Promise<string> {
    try {
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        throw new Error('No valid session found for encryption key');
      }
      
      // Use the JWT access token as the basis for our encryption key
      // This ensures credentials can only be decrypted by the same user
      const baseKey = session.access_token;
      
      // Create a more secure derived key using SHA-256
      const derivedKey = CryptoJS.SHA256(baseKey).toString();
      
      return derivedKey;
    } catch (error) {
      console.error('Failed to get encryption key:', error);
      throw new Error('Authentication required for secure credential storage');
    }
  }
  
  /**
   * Encrypt credentials using AES-256
   * @param credentials The provider credentials to encrypt
   * @returns Encrypted credentials string
   */
  static async encrypt(credentials: ProviderCredentials): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      
      // Convert credentials object to JSON string
      const credentialsString = JSON.stringify(credentials);
      
      // Encrypt using AES
      const encrypted = CryptoJS.AES.encrypt(credentialsString, key).toString();
      
      return encrypted;
    } catch (error) {
      console.error('Failed to encrypt credentials:', error);
      throw new Error('Failed to securely store credentials');
    }
  }
  
  /**
   * Decrypt credentials using AES-256
   * @param encryptedCredentials The encrypted credentials string
   * @returns Decrypted credentials object
   */
  static async decrypt<T extends ProviderCredentials>(encryptedCredentials: string): Promise<T> {
    try {
      const key = await this.getEncryptionKey();
      
      // Decrypt using AES
      const decrypted = CryptoJS.AES.decrypt(encryptedCredentials, key).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt credentials');
      }
      
      // Parse the decrypted JSON string back to an object
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to decrypt credentials:', error);
      throw new Error('Failed to access stored credentials');
    }
  }
  
  /**
   * Store encrypted credentials in the database
   * @param storeId The store ID
   * @param provider The provider ID
   * @param credentials The provider credentials to encrypt and store
   * @returns Success status
   */
  static async storeCredentials(
    storeId: string,
    provider: string,
    credentials: ProviderCredentials
  ): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Encrypt the credentials
      const encryptedCredentials = await this.encrypt(credentials);
      
      // Store in the database
      const { error } = await supabase
        .from('store_integrations')
        .upsert({
          store_id: storeId,
          provider,
          credentials_encrypted: encryptedCredentials,
          status: 'connected',
          last_synced_at: null
        }, {
          onConflict: 'store_id,provider'
        });
      
      if (error) {
        throw error;
      }
      
      return { success: true, message: 'Credentials stored successfully' };
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return { 
        success: false, 
        message: 'Failed to store credentials securely', 
        error: error as Error 
      };
    }
  }
  
  /**
   * Retrieve and decrypt credentials from the database
   * @param storeId The store ID
   * @param provider The provider ID
   * @returns Decrypted credentials
   */
  static async getCredentials<T extends ProviderCredentials>(
    storeId: string,
    provider: string
  ): Promise<T> {
    try {
      // Retrieve from the database
      const { data, error } = await supabase
        .from('store_integrations')
        .select('credentials_encrypted')
        .eq('store_id', storeId)
        .eq('provider', provider)
        .single();
      
      if (error || !data) {
        throw new Error('No credentials found for this provider');
      }
      
      // Decrypt the credentials
      return await this.decrypt<T>(data.credentials_encrypted);
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      throw new Error('Failed to access stored credentials');
    }
  }
  
  /**
   * Delete credentials from the database
   * @param storeId The store ID
   * @param provider The provider ID
   * @returns Success status
   */
  static async deleteCredentials(
    storeId: string,
    provider: string
  ): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Delete from the database
      const { error } = await supabase
        .from('store_integrations')
        .update({ 
          status: 'disconnected',
          credentials_encrypted: '' // Clear the credentials
        })
        .eq('store_id', storeId)
        .eq('provider', provider);
      
      if (error) {
        throw error;
      }
      
      return { success: true, message: 'Credentials deleted successfully' };
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return { 
        success: false, 
        message: 'Failed to delete credentials', 
        error: error as Error 
      };
    }
  }
}
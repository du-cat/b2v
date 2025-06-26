import { supabase } from '../lib/supabase';
import { CredentialsVault } from '../utils/credentialsVault';
import { IntegrationLogger } from '../utils/integrationLogger';
import { Integration, ProviderId, ProviderCredentials, SyncResult } from '../types/integrations';
import { getProviderById } from '../config/integrationsConfig';

// Import provider services
import { squareService } from './providers/square';
import { ruby2Service } from './providers/ruby2';

/**
 * Main integration service for managing POS and back-office integrations
 */
export class IntegrationService {
  /**
   * Get all integrations for a store
   * @param storeId The store ID
   * @returns Array of integrations
   */
  static async getIntegrations(storeId: string): Promise<Integration[]> {
    try {
      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('store_id', storeId);
      
      if (error) {
        throw error;
      }
      
      return data as Integration[];
    } catch (error) {
      console.error('Failed to get integrations:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific integration
   * @param storeId The store ID
   * @param provider The provider ID
   * @returns The integration or null if not found
   */
  static async getIntegration(storeId: string, provider: ProviderId): Promise<Integration | null> {
    try {
      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('store_id', storeId)
        .eq('provider', provider)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }
      
      return data as Integration;
    } catch (error) {
      console.error(`Failed to get ${provider} integration:`, error);
      throw error;
    }
  }
  
  /**
   * Connect to a provider
   * @param storeId The store ID
   * @param provider The provider ID
   * @param credentials The provider credentials
   * @returns Success status
   */
  static async connect(
    storeId: string,
    provider: ProviderId,
    credentials: ProviderCredentials
  ): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Get the provider service
      const service = this.getProviderService(provider);
      
      // Connect to the provider
      const result = await service.connect(credentials);
      
      if (!result.success) {
        // Log the error
        await IntegrationLogger.error(
          storeId,
          provider,
          `Failed to connect to ${provider}: ${result.message}`,
          undefined,
          result.error
        );
        
        return result;
      }
      
      // Store the credentials
      const storeResult = await CredentialsVault.storeCredentials(storeId, provider, credentials);
      
      if (!storeResult.success) {
        // Log the error
        await IntegrationLogger.error(
          storeId,
          provider,
          `Failed to store credentials for ${provider}: ${storeResult.message}`,
          undefined,
          storeResult.error
        );
        
        return storeResult;
      }
      
      // Log the success
      await IntegrationLogger.info(
        storeId,
        provider,
        `Successfully connected to ${provider}`
      );
      
      return {
        success: true,
        message: `Successfully connected to ${provider}`
      };
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
      
      // Log the error
      await IntegrationLogger.error(
        storeId,
        provider,
        `Failed to connect to ${provider}`,
        undefined,
        error as Error
      );
      
      return {
        success: false,
        message: `Failed to connect to ${provider}`,
        error: error as Error
      };
    }
  }
  
  /**
   * Test connection to a provider
   * @param storeId The store ID
   * @param provider The provider ID
   * @returns Success status
   */
  static async testConnection(
    storeId: string,
    provider: ProviderId
  ): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Get the provider service
      const service = this.getProviderService(provider);
      
      // Get the credentials
      const credentials = await CredentialsVault.getCredentials(storeId, provider);
      
      // Test the connection
      const result = await service.test(credentials);
      
      // Log the result
      if (result.success) {
        await IntegrationLogger.info(
          storeId,
          provider,
          `Successfully tested connection to ${provider}`
        );
      } else {
        await IntegrationLogger.error(
          storeId,
          provider,
          `Failed to test connection to ${provider}: ${result.message}`,
          undefined,
          result.error
        );
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to test connection to ${provider}:`, error);
      
      // Log the error
      await IntegrationLogger.error(
        storeId,
        provider,
        `Failed to test connection to ${provider}`,
        undefined,
        error as Error
      );
      
      return {
        success: false,
        message: `Failed to test connection to ${provider}`,
        error: error as Error
      };
    }
  }
  
  /**
   * Sync data from a provider
   * @param storeId The store ID
   * @param provider The provider ID
   * @returns Sync result
   */
  static async sync(storeId: string, provider: ProviderId): Promise<SyncResult> {
    try {
      // Get the integration
      const integration = await this.getIntegration(storeId, provider);
      
      if (!integration) {
        throw new Error(`No ${provider} integration found for this store`);
      }
      
      if (integration.status !== 'connected') {
        throw new Error(`${provider} integration is not connected`);
      }
      
      // Get the provider service
      const service = this.getProviderService(provider);
      
      // Get the credentials
      const credentials = await CredentialsVault.getCredentials(storeId, provider);
      
      // Log sync start
      await IntegrationLogger.info(
        storeId,
        provider,
        `Starting sync from ${provider}`
      );
      
      // Sync data
      const result = await service.sync(credentials, integration.last_synced_at ? new Date(integration.last_synced_at) : undefined);
      
      // Update last synced timestamp
      if (result.success) {
        await supabase
          .from('store_integrations')
          .update({
            last_synced_at: new Date().toISOString(),
            status: 'connected'
          })
          .eq('store_id', storeId)
          .eq('provider', provider);
        
        // Log sync success
        await IntegrationLogger.info(
          storeId,
          provider,
          `Successfully synced data from ${provider}`,
          {
            eventsCount: result.eventsCount,
            details: result.details
          }
        );
      } else {
        // Update status to error
        await supabase
          .from('store_integrations')
          .update({
            status: 'error'
          })
          .eq('store_id', storeId)
          .eq('provider', provider);
        
        // Log sync error
        await IntegrationLogger.error(
          storeId,
          provider,
          `Failed to sync data from ${provider}: ${result.message}`,
          result.details,
          result.error
        );
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to sync data from ${provider}:`, error);
      
      // Update status to error
      try {
        await supabase
          .from('store_integrations')
          .update({
            status: 'error'
          })
          .eq('store_id', storeId)
          .eq('provider', provider);
      } catch (updateError) {
        console.error('Failed to update integration status:', updateError);
      }
      
      // Log the error
      await IntegrationLogger.error(
        storeId,
        provider,
        `Failed to sync data from ${provider}`,
        undefined,
        error as Error
      );
      
      return {
        success: false,
        message: `Failed to sync data from ${provider}`,
        error: error as Error
      };
    }
  }
  
  /**
   * Disconnect from a provider
   * @param storeId The store ID
   * @param provider The provider ID
   * @returns Success status
   */
  static async disconnect(
    storeId: string,
    provider: ProviderId
  ): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Get the integration
      const integration = await this.getIntegration(storeId, provider);
      
      if (!integration) {
        throw new Error(`No ${provider} integration found for this store`);
      }
      
      // Get the provider service
      const service = this.getProviderService(provider);
      
      // Get the credentials
      const credentials = await CredentialsVault.getCredentials(storeId, provider);
      
      // Disconnect from the provider
      const result = await service.disconnect(credentials);
      
      if (!result.success) {
        // Log the error
        await IntegrationLogger.error(
          storeId,
          provider,
          `Failed to disconnect from ${provider}: ${result.message}`,
          undefined,
          result.error
        );
        
        return result;
      }
      
      // Delete the credentials
      const deleteResult = await CredentialsVault.deleteCredentials(storeId, provider);
      
      if (!deleteResult.success) {
        // Log the error
        await IntegrationLogger.error(
          storeId,
          provider,
          `Failed to delete credentials for ${provider}: ${deleteResult.message}`,
          undefined,
          deleteResult.error
        );
        
        return deleteResult;
      }
      
      // Log the success
      await IntegrationLogger.info(
        storeId,
        provider,
        `Successfully disconnected from ${provider}`
      );
      
      return {
        success: true,
        message: `Successfully disconnected from ${provider}`
      };
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
      
      // Log the error
      await IntegrationLogger.error(
        storeId,
        provider,
        `Failed to disconnect from ${provider}`,
        undefined,
        error as Error
      );
      
      return {
        success: false,
        message: `Failed to disconnect from ${provider}`,
        error: error as Error
      };
    }
  }
  
  /**
   * Get the appropriate service for a provider
   * @private
   * @param provider The provider ID
   * @returns The provider service
   */
  private static getProviderService(provider: ProviderId): ProviderService {
    switch (provider) {
      case 'square':
        return squareService;
      case 'ruby2':
        return ruby2Service;
      // Add other providers as they are implemented
      default:
        throw new Error(`Provider ${provider} is not supported yet`);
    }
  }
}
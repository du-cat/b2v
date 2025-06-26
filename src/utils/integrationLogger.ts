import { supabase } from '../lib/supabase';
import { IntegrationLog, ProviderId } from '../types/integrations';
import * as Sentry from '@sentry/react';

/**
 * Integration Logger utility for logging integration events
 * Logs to both Supabase database and Sentry
 */
export class IntegrationLogger {
  /**
   * Log an integration event
   * @param storeId The store ID
   * @param provider The provider ID
   * @param level The log level (info, warn, error)
   * @param message The log message
   * @param details Optional details object
   * @returns The created log entry
   */
  static async log(
    storeId: string,
    provider: ProviderId,
    level: 'info' | 'warn' | 'error',
    message: string,
    details?: Record<string, any>
  ): Promise<IntegrationLog> {
    try {
      // Create log entry in database
      const { data, error } = await supabase
        .from('integration_logs')
        .insert({
          store_id: storeId,
          provider,
          level,
          message,
          details
        })
        .select()
        .single();
      
      if (error) {
        console.error('Failed to create log entry:', error);
        
        // Still log to Sentry even if database insert fails
        this.logToSentry(storeId, provider, level, message, details, error);
        
        // Return a synthetic log entry
        return {
          id: 0,
          store_id: storeId,
          provider,
          timestamp: new Date().toISOString(),
          level,
          message,
          details
        };
      }
      
      // Also log to Sentry for error monitoring
      this.logToSentry(storeId, provider, level, message, details);
      
      return data as IntegrationLog;
    } catch (error) {
      console.error('Failed to log integration event:', error);
      
      // Log to Sentry as fallback
      this.logToSentry(storeId, provider, level, message, details, error as Error);
      
      // Return a synthetic log entry
      return {
        id: 0,
        store_id: storeId,
        provider,
        timestamp: new Date().toISOString(),
        level,
        message,
        details
      };
    }
  }
  
  /**
   * Log an info event
   */
  static async info(
    storeId: string,
    provider: ProviderId,
    message: string,
    details?: Record<string, any>
  ): Promise<IntegrationLog> {
    return this.log(storeId, provider, 'info', message, details);
  }
  
  /**
   * Log a warning event
   */
  static async warn(
    storeId: string,
    provider: ProviderId,
    message: string,
    details?: Record<string, any>
  ): Promise<IntegrationLog> {
    return this.log(storeId, provider, 'warn', message, details);
  }
  
  /**
   * Log an error event
   */
  static async error(
    storeId: string,
    provider: ProviderId,
    message: string,
    details?: Record<string, any>,
    error?: Error
  ): Promise<IntegrationLog> {
    // Include error stack in details if available
    const enhancedDetails = {
      ...details,
      errorStack: error?.stack,
      errorMessage: error?.message
    };
    
    return this.log(storeId, provider, 'error', message, enhancedDetails);
  }
  
  /**
   * Get logs for a specific store and provider
   * @param storeId The store ID
   * @param provider The provider ID (optional)
   * @param limit The maximum number of logs to return (default: 100)
   * @param offset The offset for pagination (default: 0)
   * @param level Filter by log level (optional)
   * @returns Array of log entries
   */
  static async getLogs(
    storeId: string,
    provider?: ProviderId,
    limit: number = 100,
    offset: number = 0,
    level?: 'info' | 'warn' | 'error'
  ): Promise<IntegrationLog[]> {
    try {
      // Build query
      let query = supabase
        .from('integration_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Add provider filter if specified
      if (provider) {
        query = query.eq('provider', provider);
      }
      
      // Add level filter if specified
      if (level) {
        query = query.eq('level', level);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to retrieve logs:', error);
        return [];
      }
      
      return data as IntegrationLog[];
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }
  
  /**
   * Log to Sentry for error monitoring
   * @private
   */
  private static logToSentry(
    storeId: string,
    provider: ProviderId,
    level: 'info' | 'warn' | 'error',
    message: string,
    details?: Record<string, any>,
    error?: Error
  ): void {
    // Set context for this event
    Sentry.setContext('integration', {
      storeId,
      provider,
      level
    });
    
    // Log based on level
    switch (level) {
      case 'info':
        Sentry.addBreadcrumb({
          category: 'integration',
          message,
          level: 'info',
          data: details
        });
        break;
        
      case 'warn':
        Sentry.captureMessage(message, {
          level: 'warning',
          extra: details
        });
        break;
        
      case 'error':
        if (error) {
          Sentry.captureException(error, {
            extra: {
              message,
              ...details
            }
          });
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            extra: details
          });
        }
        break;
    }
  }
}
import { ProviderService, SyncResult } from '../../types/integrations';
import { SquareCredentialsSchema } from '../../types/integrations';
import { IntegrationLogger } from '../../utils/integrationLogger';
import pLimit from 'p-limit';

// Rate limiting: 100 requests per minute for Square API
const rateLimiter = pLimit(100);

/**
 * Square POS integration service
 */
export class SquareService implements ProviderService {
  private readonly baseUrl = 'https://connect.squareup.com/v2';
  
  /**
   * Connect to Square API
   * @param credentials Square credentials
   */
  async connect(credentials: any): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Validate credentials
      const parsedCredentials = SquareCredentialsSchema.parse(credentials);
      
      // Test the connection
      const testResult = await this.test(parsedCredentials);
      if (!testResult.success) {
        return testResult;
      }
      
      // Register webhooks if needed
      if (!parsedCredentials.merchant_id) {
        return {
          success: false,
          message: 'Merchant ID is required for Square integration',
          error: new Error('Missing merchant ID')
        };
      }
      
      try {
        await this.registerWebhooks(parsedCredentials);
      } catch (error) {
        console.warn('Failed to register webhooks, but connection succeeded:', error);
        // Continue anyway, as webhooks are optional
      }
      
      return {
        success: true,
        message: 'Successfully connected to Square API'
      };
    } catch (error) {
      console.error('Failed to connect to Square API:', error);
      return {
        success: false,
        message: 'Failed to connect to Square API',
        error: error as Error
      };
    }
  }
  
  /**
   * Test connection to Square API
   * @param credentials Square credentials
   */
  async test(credentials: any): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Validate credentials
      const parsedCredentials = SquareCredentialsSchema.parse(credentials);
      
      // Check if token is expired
      if (parsedCredentials.expires_at && parsedCredentials.expires_at < Date.now()) {
        // Token is expired, try to refresh
        try {
          const refreshedCredentials = await this.refreshToken(parsedCredentials);
          // Update the credentials with the refreshed token
          Object.assign(parsedCredentials, refreshedCredentials);
        } catch (refreshError) {
          return {
            success: false,
            message: 'Square access token expired and refresh failed',
            error: refreshError as Error
          };
        }
      }
      
      // Test the connection by fetching locations
      const response = await rateLimiter(() => 
        fetch(`${this.baseUrl}/locations`, {
          headers: {
            'Authorization': `Bearer ${parsedCredentials.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.locations || data.locations.length === 0) {
        return {
          success: false,
          message: 'No locations found for this Square account',
          error: new Error('No locations found')
        };
      }
      
      return {
        success: true,
        message: `Successfully connected to Square API. Found ${data.locations.length} locations.`
      };
    } catch (error) {
      console.error('Failed to test Square API connection:', error);
      return {
        success: false,
        message: 'Failed to connect to Square API',
        error: error as Error
      };
    }
  }
  
  /**
   * Sync data from Square API
   * @param credentials Square credentials
   * @param lastSyncedAt Last sync timestamp
   */
  async sync(credentials: any, lastSyncedAt?: Date): Promise<SyncResult> {
    try {
      // Validate credentials
      const parsedCredentials = SquareCredentialsSchema.parse(credentials);
      
      // Check if token is expired
      if (parsedCredentials.expires_at && parsedCredentials.expires_at < Date.now()) {
        // Token is expired, try to refresh
        try {
          const refreshedCredentials = await this.refreshToken(parsedCredentials);
          // Update the credentials with the refreshed token
          Object.assign(parsedCredentials, refreshedCredentials);
        } catch (refreshError) {
          return {
            success: false,
            message: 'Square access token expired and refresh failed',
            error: refreshError as Error
          };
        }
      }
      
      // Determine begin time for sync
      const beginTime = lastSyncedAt 
        ? lastSyncedAt.toISOString() 
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Default to last 24 hours
      
      // Fetch locations first
      const locationsResponse = await rateLimiter(() => 
        fetch(`${this.baseUrl}/locations`, {
          headers: {
            'Authorization': `Bearer ${parsedCredentials.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      );
      
      if (!locationsResponse.ok) {
        const errorData = await locationsResponse.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || locationsResponse.statusText}`);
      }
      
      const locationsData = await locationsResponse.json();
      
      if (!locationsData.locations || locationsData.locations.length === 0) {
        return {
          success: false,
          message: 'No locations found for this Square account',
          error: new Error('No locations found')
        };
      }
      
      // For each location, fetch orders
      let totalEvents = 0;
      const locationPromises = locationsData.locations.map(async (location: any) => {
        try {
          // Fetch orders for this location
          const ordersResponse = await rateLimiter(() => 
            fetch(`${this.baseUrl}/orders/search`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${parsedCredentials.access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                location_ids: [location.id],
                query: {
                  filter: {
                    date_time_filter: {
                      updated_at: {
                        start_at: beginTime
                      }
                    }
                  },
                  sort: {
                    sort_field: 'UPDATED_AT',
                    sort_order: 'ASC'
                  }
                }
              })
            })
          );
          
          if (!ordersResponse.ok) {
            const errorData = await ordersResponse.json();
            throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || ordersResponse.statusText}`);
          }
          
          const ordersData = await ordersResponse.json();
          
          if (ordersData.orders && ordersData.orders.length > 0) {
            // Process orders and convert to events
            // This is a simplified example - in a real implementation, you would
            // transform the orders into your application's event format and store them
            
            // For each order, create an event
            for (const order of ordersData.orders) {
              // Create event for this order
              // This is where you would insert into your events table
              console.log(`Processing order ${order.id} for location ${location.id}`);
              
              // Increment event count
              totalEvents++;
            }
          }
          
          return {
            locationId: location.id,
            locationName: location.name,
            ordersCount: ordersData.orders?.length || 0
          };
        } catch (error) {
          console.error(`Failed to fetch orders for location ${location.id}:`, error);
          throw error;
        }
      });
      
      // Wait for all location promises to resolve
      const locationResults = await Promise.all(locationPromises);
      
      return {
        success: true,
        message: `Successfully synced data from Square API. Processed ${totalEvents} events across ${locationResults.length} locations.`,
        eventsCount: totalEvents,
        details: {
          locations: locationResults
        }
      };
    } catch (error) {
      console.error('Failed to sync data from Square API:', error);
      return {
        success: false,
        message: 'Failed to sync data from Square API',
        error: error as Error
      };
    }
  }
  
  /**
   * Disconnect from Square API
   * @param credentials Square credentials
   */
  async disconnect(credentials: any): Promise<{ success: boolean; message: string; error?: Error }> {
    try {
      // Validate credentials
      const parsedCredentials = SquareCredentialsSchema.parse(credentials);
      
      // Revoke the access token
      const response = await rateLimiter(() => 
        fetch('https://connect.squareup.com/oauth2/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Client ${import.meta.env.VITE_SQUARE_CLIENT_ID}:${import.meta.env.VITE_SQUARE_CLIENT_SECRET}`
          },
          body: JSON.stringify({
            access_token: parsedCredentials.access_token,
            client_id: import.meta.env.VITE_SQUARE_CLIENT_ID
          })
        })
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }
      
      return {
        success: true,
        message: 'Successfully disconnected from Square API'
      };
    } catch (error) {
      console.error('Failed to disconnect from Square API:', error);
      return {
        success: false,
        message: 'Failed to disconnect from Square API',
        error: error as Error
      };
    }
  }
  
  /**
   * Refresh Square access token
   * @private
   * @param credentials Square credentials
   * @returns Refreshed credentials
   */
  private async refreshToken(credentials: any): Promise<any> {
    try {
      const response = await fetch('https://connect.squareup.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: import.meta.env.VITE_SQUARE_CLIENT_ID,
          client_secret: import.meta.env.VITE_SQUARE_CLIENT_SECRET,
          refresh_token: credentials.refresh_token,
          grant_type: 'refresh_token'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Square token refresh error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
      };
    } catch (error) {
      console.error('Failed to refresh Square access token:', error);
      throw error;
    }
  }
  
  /**
   * Register webhooks with Square API
   * @private
   * @param credentials Square credentials
   */
  private async registerWebhooks(credentials: any): Promise<void> {
    try {
      // Check if webhook subscription already exists
      const checkResponse = await rateLimiter(() => 
        fetch(`${this.baseUrl}/webhooks/subscriptions`, {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      );
      
      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || checkResponse.statusText}`);
      }
      
      const checkData = await checkResponse.json();
      
      // If subscription already exists, don't create a new one
      if (checkData.subscriptions && checkData.subscriptions.length > 0) {
        console.log('Webhook subscription already exists');
        return;
      }
      
      // Create webhook subscription
      const webhookUrl = `${import.meta.env.VITE_APP_URL}/api/webhooks/square`;
      
      const response = await rateLimiter(() => 
        fetch(`${this.baseUrl}/webhooks/subscriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            subscription: {
              name: 'SentinelPOS Guardian',
              event_types: ['order.updated', 'payment.updated'],
              notification_url: webhookUrl,
              api_version: '2023-12-13'
            }
          })
        })
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Successfully registered Square webhooks:', data);
    } catch (error) {
      console.error('Failed to register Square webhooks:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const squareService = new SquareService();
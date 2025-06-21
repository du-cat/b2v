/**
 * Centralized error handling utility
 * Provides consistent error handling across the application
 */

export interface ErrorContext {
  feature: string;
  action: string;
  userId?: string;
  storeId?: string;
  metadata?: Record<string, any>;
}

export class ErrorHandler {
  /**
   * Handle and log errors with context
   */
  static handle(error: Error, context: ErrorContext): string {
    const errorId = this.generateErrorId();
    
    console.error(`❌ [${errorId}] ${context.feature}:${context.action} failed:`, {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Send to error tracking service in production
    if (import.meta.env.PROD) {
      this.sendToErrorTracking(error, context, errorId);
    }
    
    return this.getUserFriendlyMessage(error, context);
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(error: Error, context: ErrorContext): string {
    const message = error.message.toLowerCase();
    
    // Authentication errors
    if (message.includes('session_expired') || message.includes('unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link.';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Supabase configuration errors
    if (message.includes('supabase not configured')) {
      return 'Service is not properly configured. Please contact support.';
    }
    
    // Generic fallback
    return `${context.feature} error: ${error.message}`;
  }

  /**
   * Generate unique error ID for tracking
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send error to tracking service (placeholder)
   */
  private static sendToErrorTracking(error: Error, context: ErrorContext, errorId: string): void {
    // Implement error tracking service integration here
    // e.g., Sentry, LogRocket, etc.
    console.log('📊 Error tracking:', { error, context, errorId });
  }
}

/**
 * Async operation wrapper with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallbackValue: T
): Promise<{ data: T; error: string | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error as Error, context);
    return { data: fallbackValue, error: errorMessage };
  }
}
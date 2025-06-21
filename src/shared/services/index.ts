/**
 * Shared services barrel export
 * Provides centralized access to all service classes
 */

export { AuthService } from '../../features/auth/services/AuthService';
export { StoreService } from '../../features/stores/services/StoreService';
export { EventService } from '../../features/events/services/EventService';

// Re-export types for convenience
export type { LoginCredentials, SignupData } from '../../features/auth/types';
export type { Store, CreateStoreData } from '../../features/stores/types';
export type { Event, EnhancedEvent, EventFilters } from '../../features/events/types';
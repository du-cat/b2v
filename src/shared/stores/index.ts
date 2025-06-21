/**
 * Shared stores barrel export
 * Provides centralized access to all Zustand stores
 */

export { useAuthStore } from '../../features/auth/store/AuthStore';
export { useStoreStore } from '../../features/stores/store/StoreStore';
export { useEventStore } from '../../features/events/store/EventStore';
export { useNotificationStore } from '../../features/notifications/store/NotificationStore';

// Legacy stores (to be migrated)
export { useDevicesStore } from '../../store/devicesStore';
export { useRulesStore } from '../../store/rulesStore';
export { useReportsStore } from '../../store/reportsStore';
export type Severity = 'info' | 'warn' | 'suspicious';

export interface Event {
  id: string;
  store_id: string;
  device_id: string | null;
  event_type: string;
  severity: Severity;
  payload: Record<string, any>;
  captured_at: string;
}

export interface EnhancedEvent extends Event {
  anomaly_score?: number;
  is_anomaly?: boolean;
}

export interface EventFilters {
  searchTerm: string;
  severityFilter: 'all' | Severity | 'anomaly';
  dateFilter: string;
}

export interface EventState {
  events: EnhancedEvent[];
  isLoading: boolean;
  error: string | null;
  filters: EventFilters;
}
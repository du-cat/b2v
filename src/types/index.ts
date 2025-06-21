export type UserRole = 'super_admin' | 'owner' | 'manager' | 'clerk';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export type DeviceType = 'pos' | 'camera' | 'pi' | 'cash_drawer';

export interface Device {
  id: string;
  store_id: string;
  type: DeviceType;
  name: string;
  identifier: string | null;
  metadata: Record<string, any> | null;
  last_ping: string | null;
  created_at: string;
}

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

export type RuleKind = 'threshold' | 'pattern' | 'ml';

export interface Rule {
  id: string;
  store_id: string;
  name: string;
  kind: RuleKind;
  parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  event_id: string;
  channels: string[];
  sent_at: string | null;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  location: string | null;
  timezone: string | null;
  created_at: string;
}

export interface POSProfile {
  id: string;
  store_id: string;
  pos_type: string;
  cloud_capable: boolean;
  technical_contact: string;
  register_count: number;
  alert_prefs: Record<string, any>;
}

export interface WeeklyReport {
  id: string;
  store_id: string;
  csv_url: string | null;
  period_start: string;
  period_end: string;
  dispatched: boolean | null;
}

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  severity: NotificationSeverity;
  store_id: string | null;
  is_read: boolean;
  created_at: string;
}
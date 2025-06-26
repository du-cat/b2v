import { z } from 'zod';

// Provider types
export type ProviderId = 
  | 'square' 
  | 'clover' 
  | 'lightspeed' 
  | 'toast' 
  | 'ruby2' 
  | 'passport' 
  | 'petrosoft' 
  | 'pdi';

export type ProviderType = 'cloud' | 'local' | 'backoffice';
export type ConnectionType = 'oauth' | 'apikey' | 'xml' | 'file-share' | 'sftp';
export type IntegrationStatus = 'connected' | 'error' | 'disconnected' | 'pending';

// Step configuration for the integration wizard
export interface StepItem {
  id: string;
  title: string;
  description: string;
  component: string; // Name of the component to render for this step
  props?: Record<string, any>; // Additional props to pass to the component
  validation?: z.ZodTypeAny; // Zod schema for validating this step's data
}

// Provider metadata configuration
export interface ProviderMeta {
  id: ProviderId;
  label: string;
  type: ProviderType;
  connection: ConnectionType;
  logo: string;
  description: string;
  steps: StepItem[];
  pollIntervalSecs: number;
  supportsWebhooks?: boolean;
  webhookEndpoint?: string;
  webhookEvents?: string[];
  docsUrl?: string;
}

// Integration record as stored in the database
export interface Integration {
  id: string;
  store_id: string;
  provider: ProviderId;
  status: IntegrationStatus;
  credentials_encrypted: string;
  config: Record<string, any>;
  last_synced_at: string | null;
  created_at: string;
}

// Integration log entry
export interface IntegrationLog {
  id: number;
  store_id: string;
  provider: ProviderId;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, any>;
}

// Credentials schemas for each provider
export const SquareCredentialsSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  merchant_id: z.string(),
  expires_at: z.number().optional(),
});

export const CloverCredentialsSchema = z.object({
  access_token: z.string(),
  merchant_id: z.string(),
  api_key: z.string().optional(),
});

export const LightspeedCredentialsSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  refresh_token: z.string(),
  account_id: z.string(),
});

export const ToastCredentialsSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  restaurant_guid: z.string(),
});

export const Ruby2CredentialsSchema = z.object({
  commander_ip: z.string().ip(),
  username: z.string(),
  password: z.string(),
  site_id: z.string(),
});

export const PassportCredentialsSchema = z.object({
  server_ip: z.string().ip(),
  username: z.string(),
  password: z.string(),
  site_id: z.string(),
});

export const PetrosoftCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
  store_id: z.string(),
  api_key: z.string().optional(),
});

export const PDICredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
  site_id: z.string(),
  api_key: z.string().optional(),
  sftp_host: z.string().optional(),
  sftp_username: z.string().optional(),
  sftp_password: z.string().optional(),
});

// Union type for all provider credentials
export type ProviderCredentials = 
  | z.infer<typeof SquareCredentialsSchema>
  | z.infer<typeof CloverCredentialsSchema>
  | z.infer<typeof LightspeedCredentialsSchema>
  | z.infer<typeof ToastCredentialsSchema>
  | z.infer<typeof Ruby2CredentialsSchema>
  | z.infer<typeof PassportCredentialsSchema>
  | z.infer<typeof PetrosoftCredentialsSchema>
  | z.infer<typeof PDICredentialsSchema>;

// Sync result interface
export interface SyncResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  error?: Error;
  eventsCount?: number;
}

// Provider service interface
export interface ProviderService {
  connect(credentials: ProviderCredentials): Promise<{ success: boolean; message: string; error?: Error }>;
  test(credentials: ProviderCredentials): Promise<{ success: boolean; message: string; error?: Error }>;
  sync(credentials: ProviderCredentials, lastSyncedAt?: Date): Promise<SyncResult>;
  disconnect(credentials: ProviderCredentials): Promise<{ success: boolean; message: string; error?: Error }>;
}
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string
          event_id: string
          channels: string[]
          sent_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          channels: string[]
          sent_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          channels?: string[]
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      devices: {
        Row: {
          id: string
          store_id: string
          type: string
          identifier: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          type: string
          identifier?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          type?: string
          identifier?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          store_id: string
          device_id: string | null
          event_type: string
          severity: string
          payload: Json
          captured_at: string
        }
        Insert: {
          id?: string
          store_id: string
          device_id?: string | null
          event_type: string
          severity?: string
          payload: Json
          captured_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          device_id?: string | null
          event_type?: string
          severity?: string
          payload?: Json
          captured_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_device_id_fkey"
            columns: ["device_id"]
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          severity: string
          store_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: string
          severity: string
          store_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          severity?: string
          store_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      pos_profiles: {
        Row: {
          id: string
          store_id: string
          pos_type: string | null
          cloud_capable: boolean | null
          technical_contact: string | null
          register_count: number | null
          alert_prefs: Json | null
        }
        Insert: {
          id?: string
          store_id: string
          pos_type?: string | null
          cloud_capable?: boolean | null
          technical_contact?: string | null
          register_count?: number | null
          alert_prefs?: Json | null
        }
        Update: {
          id?: string
          store_id?: string
          pos_type?: string | null
          cloud_capable?: boolean | null
          technical_contact?: string | null
          register_count?: number | null
          alert_prefs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_profiles_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      rules: {
        Row: {
          id: string
          store_id: string
          name: string | null
          kind: string
          parameters: Json | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name?: string | null
          kind: string
          parameters?: Json | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string | null
          kind?: string
          parameters?: Json | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rules_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          location: string | null
          timezone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          location?: string | null
          timezone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          location?: string | null
          timezone?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          full_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          id: string
          store_id: string
          csv_url: string | null
          period_start: string | null
          period_end: string | null
          dispatched: boolean | null
        }
        Insert: {
          id?: string
          store_id: string
          csv_url?: string | null
          period_start?: string | null
          period_end?: string | null
          dispatched?: boolean | null
        }
        Update: {
          id?: string
          store_id?: string
          csv_url?: string | null
          period_start?: string | null
          period_end?: string | null
          dispatched?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
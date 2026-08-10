export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          segment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          segment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          segment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'brands_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['member_role'];
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: Database['public']['Enums']['member_role'];
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['member_role'];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memberships_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: Database['public']['Enums']['member_role'];
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: Database['public']['Enums']['member_role'];
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: Database['public']['Enums']['member_role'];
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      channels: {
        Row: {
          id: string;
          brand_id: string;
          type: Database['public']['Enums']['channel_type'];
          handle: string | null;
          display_name: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          type: Database['public']['Enums']['channel_type'];
          handle?: string | null;
          display_name?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          type?: Database['public']['Enums']['channel_type'];
          handle?: string | null;
          display_name?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'channels_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      metric_definitions: {
        Row: {
          id: string;
          channel_type: Database['public']['Enums']['channel_type'];
          key: string;
          label_pt: string;
          unit: string;
          equivalence_group: string | null;
          is_primary: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          channel_type: Database['public']['Enums']['channel_type'];
          key: string;
          label_pt: string;
          unit?: string;
          equivalence_group?: string | null;
          is_primary?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          channel_type?: Database['public']['Enums']['channel_type'];
          key?: string;
          label_pt?: string;
          unit?: string;
          equivalence_group?: string | null;
          is_primary?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      publications: {
        Row: {
          id: string;
          brand_id: string;
          channel_id: string;
          title: string;
          published_at: string | null;
          planned_for: string | null;
          status: Database['public']['Enums']['publication_status'];
          permalink: string | null;
          media_url: string | null;
          caption: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          channel_id: string;
          title: string;
          published_at?: string | null;
          planned_for?: string | null;
          status?: Database['public']['Enums']['publication_status'];
          permalink?: string | null;
          media_url?: string | null;
          caption?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          channel_id?: string;
          title?: string;
          published_at?: string | null;
          planned_for?: string | null;
          status?: Database['public']['Enums']['publication_status'];
          permalink?: string | null;
          media_url?: string | null;
          caption?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'publications_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'publications_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'publications_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tags: {
        Row: {
          id: string;
          brand_id: string;
          category: Database['public']['Enums']['tag_category'];
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          category: Database['public']['Enums']['tag_category'];
          name: string;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          category?: Database['public']['Enums']['tag_category'];
          name?: string;
          color?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tags_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      publication_tags: {
        Row: {
          id: string;
          publication_id: string;
          tag_id: string;
          suggested: boolean;
          confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          tag_id: string;
          suggested?: boolean;
          confirmed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          publication_id?: string;
          tag_id?: string;
          suggested?: boolean;
          confirmed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'publication_tags_publication_id_fkey';
            columns: ['publication_id'];
            isOneToOne: false;
            referencedRelation: 'publications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'publication_tags_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
      metric_values: {
        Row: {
          id: string;
          publication_id: string;
          metric_key: string;
          value: number;
          source: Database['public']['Enums']['metric_source'];
          entered_by: string | null;
          entered_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          metric_key: string;
          value: number;
          source?: Database['public']['Enums']['metric_source'];
          entered_by?: string | null;
          entered_at?: string;
        };
        Update: {
          id?: string;
          publication_id?: string;
          metric_key?: string;
          value?: number;
          source?: Database['public']['Enums']['metric_source'];
          entered_by?: string | null;
          entered_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'metric_values_publication_id_fkey';
            columns: ['publication_id'];
            isOneToOne: false;
            referencedRelation: 'publications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'metric_values_entered_by_fkey';
            columns: ['entered_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      metric_audit_log: {
        Row: {
          id: string;
          metric_value_id: string;
          publication_id: string;
          metric_key: string;
          old_value: number | null;
          new_value: number | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          metric_value_id: string;
          publication_id: string;
          metric_key: string;
          old_value?: number | null;
          new_value?: number | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          metric_value_id?: string;
          publication_id?: string;
          metric_key?: string;
          old_value?: number | null;
          new_value?: number | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'metric_audit_log_metric_value_id_fkey';
            columns: ['metric_value_id'];
            isOneToOne: false;
            referencedRelation: 'metric_values';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'metric_audit_log_publication_id_fkey';
            columns: ['publication_id'];
            isOneToOne: false;
            referencedRelation: 'publications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'metric_audit_log_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      goals: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          metric_key: string;
          target_value: number;
          period_start: string;
          period_end: string;
          channel_id: string | null;
          owner_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          metric_key: string;
          target_value: number;
          period_start: string;
          period_end: string;
          channel_id?: string | null;
          owner_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          metric_key?: string;
          target_value?: number;
          period_start?: string;
          period_end?: string;
          channel_id?: string | null;
          owner_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_owner_user_id_fkey';
            columns: ['owner_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      timeline_events: {
        Row: {
          id: string;
          brand_id: string;
          title: string;
          description: string | null;
          event_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'timeline_events_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'timeline_events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          brand_id: string;
          template: Database['public']['Enums']['report_template'];
          title: string;
          period_start: string;
          period_end: string;
          commentary: string | null;
          public_slug: string | null;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          template?: Database['public']['Enums']['report_template'];
          title: string;
          period_start: string;
          period_end: string;
          commentary?: string | null;
          public_slug?: string | null;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          template?: Database['public']['Enums']['report_template'];
          title?: string;
          period_start?: string;
          period_end?: string;
          commentary?: string | null;
          public_slug?: string | null;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      report_snapshots: {
        Row: {
          id: string;
          report_id: string;
          payload: Json;
          taken_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          payload: Json;
          taken_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          payload?: Json;
          taken_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'report_snapshots_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'reports';
            referencedColumns: ['id'];
          },
        ];
      };
      report_views: {
        Row: {
          id: string;
          report_id: string;
          viewed_at: string;
          viewer_email: string | null;
          ip_hash: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          report_id: string;
          viewed_at?: string;
          viewer_email?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string;
          viewed_at?: string;
          viewer_email?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'report_views_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'reports';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_onboarding: {
        Args: {
          p_org_name: string;
          p_segment: string | null;
          p_channels: Database['public']['Enums']['channel_type'][];
        };
        Returns: Json;
      };
      get_public_report: {
        Args: {
          p_slug: string;
        };
        Returns: Json;
      };
      record_report_view: {
        Args: {
          p_slug: string;
          p_ip_hash: string;
          p_user_agent: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      member_role: 'admin' | 'member' | 'viewer';
      channel_type:
        | 'instagram'
        | 'facebook'
        | 'linkedin'
        | 'google_business'
        | 'tiktok'
        | 'youtube'
        | 'other';
      tag_category: 'format' | 'theme' | 'hook' | 'objective';
      publication_status: 'planned' | 'ready' | 'published';
      report_template: 'board' | 'sales' | 'team';
      metric_source: 'manual' | 'paste' | 'import' | 'api';
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

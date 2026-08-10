export type MemberRole = 'admin' | 'member' | 'viewer';
export type ChannelType = 'instagram' | 'facebook' | 'linkedin' | 'google_business' | 'tiktok' | 'youtube' | 'other';
export type TagCategory = 'format' | 'theme' | 'hook' | 'objective';
export type PublicationStatus = 'planned' | 'ready' | 'published';
export type ReportTemplate = 'board' | 'sales' | 'team';
export type MetricSource = 'manual' | 'paste' | 'import' | 'api';

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  segment: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface Channel {
  id: string;
  brand_id: string;
  type: ChannelType;
  handle: string | null;
  display_name: string | null;
  active: boolean;
  created_at: string;
}

export interface MetricDefinition {
  id: string;
  channel_type: ChannelType;
  key: string;
  label_pt: string;
  unit: string;
  equivalence_group: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface Publication {
  id: string;
  brand_id: string;
  channel_id: string;
  title: string;
  published_at: string | null;
  planned_for: string | null;
  status: PublicationStatus;
  permalink: string | null;
  media_url: string | null;
  caption: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  brand_id: string;
  category: TagCategory;
  name: string;
  color: string | null;
  created_at: string;
}

export interface MetricValue {
  id: string;
  publication_id: string;
  metric_key: string;
  value: number;
  source: MetricSource;
  entered_by: string | null;
  entered_at: string;
}

export interface Goal {
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
}

export interface TimelineEvent {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  event_date: string;
  created_by: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  brand_id: string;
  template: ReportTemplate;
  title: string;
  period_start: string;
  period_end: string;
  commentary: string | null;
  public_slug: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
}

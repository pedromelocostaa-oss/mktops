-- ============================================================
-- MKT-OPS: Schema inicial completo
-- Enums, tabelas, índices, triggers, funções, RLS
-- ============================================================

-- 1. ENUMS

create type member_role as enum ('admin', 'member', 'viewer');
create type channel_type as enum ('instagram', 'facebook', 'linkedin', 'google_business', 'tiktok', 'youtube', 'other');
create type tag_category as enum ('format', 'theme', 'hook', 'objective');
create type publication_status as enum ('planned', 'ready', 'published');
create type report_template as enum ('board', 'sales', 'team');
create type metric_source as enum ('manual', 'paste', 'import', 'api');

-- 2. TABELAS

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  name text not null,
  segment text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  email text not null,
  role member_role not null default 'member',
  invited_by uuid references profiles,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table channels (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands on delete cascade,
  type channel_type not null,
  handle text,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table metric_definitions (
  id uuid primary key default gen_random_uuid(),
  channel_type channel_type not null,
  key text not null,
  label_pt text not null,
  unit text not null default 'count',
  equivalence_group text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  unique (channel_type, key)
);

create table publications (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands on delete cascade,
  channel_id uuid not null references channels on delete restrict,
  title text not null,
  published_at timestamptz,
  planned_for timestamptz,
  status publication_status not null default 'published',
  permalink text,
  media_url text,
  caption text,
  created_by uuid references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_publications_brand_date on publications (brand_id, published_at desc);

create table tags (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands on delete cascade,
  category tag_category not null,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (brand_id, category, name)
);

create table publication_tags (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references publications on delete cascade,
  tag_id uuid not null references tags on delete cascade,
  suggested boolean not null default false,
  confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (publication_id, tag_id)
);

create table metric_values (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references publications on delete cascade,
  metric_key text not null,
  value numeric not null,
  source metric_source not null default 'manual',
  entered_by uuid references profiles,
  entered_at timestamptz not null default now(),
  unique (publication_id, metric_key)
);

create table metric_audit_log (
  id uuid primary key default gen_random_uuid(),
  metric_value_id uuid not null references metric_values on delete cascade,
  publication_id uuid not null references publications on delete cascade,
  metric_key text not null,
  old_value numeric,
  new_value numeric,
  changed_by uuid references profiles,
  changed_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands on delete cascade,
  name text not null,
  metric_key text not null,
  target_value numeric not null,
  period_start date not null,
  period_end date not null,
  channel_id uuid references channels,
  owner_user_id uuid references profiles,
  created_at timestamptz not null default now()
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands on delete cascade,
  template report_template not null default 'board',
  title text not null,
  period_start date not null,
  period_end date not null,
  commentary text,
  public_slug text unique,
  published_at timestamptz,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);

create table report_snapshots (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports on delete cascade,
  payload jsonb not null,
  taken_at timestamptz not null default now()
);

create table report_views (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports on delete cascade,
  viewed_at timestamptz not null default now(),
  viewer_email text,
  ip_hash text,
  user_agent text
);

-- 3. TRIGGERS

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_invitation_acceptance()
returns trigger as $$
declare
  v_email text;
  v_inv record;
begin
  select email into v_email from auth.users where id = new.id;

  for v_inv in
    select * from public.invitations
    where lower(email) = lower(v_email) and accepted_at is null
  loop
    insert into public.memberships (organization_id, user_id, role)
    values (v_inv.organization_id, new.id, v_inv.role)
    on conflict (organization_id, user_id) do nothing;

    update public.invitations set accepted_at = now() where id = v_inv.id;
  end loop;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_profile_created_accept_invitations
  after insert on profiles
  for each row execute function public.handle_invitation_acceptance();

create or replace function trg_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger publications_set_updated_at
  before update on publications
  for each row execute function trg_set_updated_at();

create or replace function trg_metric_audit()
returns trigger as $$
begin
  if old.value is distinct from new.value then
    insert into public.metric_audit_log (
      metric_value_id, publication_id, metric_key,
      old_value, new_value, changed_by
    ) values (
      new.id, new.publication_id, new.metric_key,
      old.value, new.value, auth.uid()
    );
    new.entered_by := auth.uid();
    new.entered_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger metric_values_audit
  before update on metric_values
  for each row execute function trg_metric_audit();

-- 4. FUNÇÕES AUXILIARES PARA RLS

create or replace function public.user_org_ids()
returns setof uuid
language sql security definer stable
as $$
  select organization_id from public.memberships where user_id = auth.uid()
$$;

create or replace function public.user_brand_ids()
returns setof uuid
language sql security definer stable
as $$
  select b.id from public.brands b
  inner join public.memberships m on m.organization_id = b.organization_id
  where m.user_id = auth.uid()
$$;

create or replace function public.user_writable_brand_ids()
returns setof uuid
language sql security definer stable
as $$
  select b.id from public.brands b
  inner join public.memberships m on m.organization_id = b.organization_id
  where m.user_id = auth.uid() and m.role in ('admin', 'member')
$$;

create or replace function public.user_admin_org_ids()
returns setof uuid
language sql security definer stable
as $$
  select organization_id from public.memberships
  where user_id = auth.uid() and role = 'admin'
$$;

-- 5. RLS POLICIES

alter table organizations enable row level security;
create policy "org_select" on organizations for select using (id in (select public.user_org_ids()));
create policy "org_insert" on organizations for insert with check (auth.uid() is not null);
create policy "org_update" on organizations for update using (id in (select public.user_admin_org_ids()));

alter table brands enable row level security;
create policy "brands_select" on brands for select using (organization_id in (select public.user_org_ids()));
create policy "brands_insert" on brands for insert with check (organization_id in (select public.user_admin_org_ids()));
create policy "brands_update" on brands for update using (organization_id in (select public.user_admin_org_ids()));
create policy "brands_delete" on brands for delete using (organization_id in (select public.user_admin_org_ids()));

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_select_org" on profiles for select using (
  id in (select m2.user_id from memberships m1 inner join memberships m2 on m2.organization_id = m1.organization_id where m1.user_id = auth.uid())
);
create policy "profiles_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_update" on profiles for update using (id = auth.uid());

alter table memberships enable row level security;
create policy "memberships_select" on memberships for select using (organization_id in (select public.user_org_ids()));
create policy "memberships_insert" on memberships for insert with check (organization_id in (select public.user_admin_org_ids()));
create policy "memberships_update" on memberships for update using (organization_id in (select public.user_admin_org_ids()));
create policy "memberships_delete" on memberships for delete using (organization_id in (select public.user_admin_org_ids()));

alter table invitations enable row level security;
create policy "invitations_select" on invitations for select using (organization_id in (select public.user_org_ids()));
create policy "invitations_insert" on invitations for insert with check (organization_id in (select public.user_admin_org_ids()));
create policy "invitations_delete" on invitations for delete using (organization_id in (select public.user_admin_org_ids()));

alter table channels enable row level security;
create policy "channels_select" on channels for select using (brand_id in (select public.user_brand_ids()));
create policy "channels_insert" on channels for insert with check (brand_id in (select public.user_writable_brand_ids()));
create policy "channels_update" on channels for update using (brand_id in (select public.user_writable_brand_ids()));
create policy "channels_delete" on channels for delete using (
  brand_id in (select b.id from brands b where b.organization_id in (select public.user_admin_org_ids()))
);

alter table metric_definitions enable row level security;
create policy "metric_def_select" on metric_definitions for select using (true);

alter table publications enable row level security;
create policy "publications_select" on publications for select using (brand_id in (select public.user_brand_ids()));
create policy "publications_insert" on publications for insert with check (brand_id in (select public.user_writable_brand_ids()));
create policy "publications_update" on publications for update using (brand_id in (select public.user_writable_brand_ids()));
create policy "publications_delete" on publications for delete using (
  brand_id in (select b.id from brands b where b.organization_id in (select public.user_admin_org_ids()))
);

alter table tags enable row level security;
create policy "tags_select" on tags for select using (brand_id in (select public.user_brand_ids()));
create policy "tags_insert" on tags for insert with check (brand_id in (select public.user_writable_brand_ids()));
create policy "tags_update" on tags for update using (brand_id in (select public.user_writable_brand_ids()));
create policy "tags_delete" on tags for delete using (
  brand_id in (select b.id from brands b where b.organization_id in (select public.user_admin_org_ids()))
);

alter table publication_tags enable row level security;
create policy "pub_tags_select" on publication_tags for select using (
  publication_id in (select id from publications where brand_id in (select public.user_brand_ids()))
);
create policy "pub_tags_insert" on publication_tags for insert with check (
  publication_id in (select id from publications where brand_id in (select public.user_writable_brand_ids()))
);
create policy "pub_tags_delete" on publication_tags for delete using (
  publication_id in (select id from publications where brand_id in (select public.user_writable_brand_ids()))
);

alter table metric_values enable row level security;
create policy "mv_select" on metric_values for select using (
  publication_id in (select id from publications where brand_id in (select public.user_brand_ids()))
);
create policy "mv_insert" on metric_values for insert with check (
  publication_id in (select id from publications where brand_id in (select public.user_writable_brand_ids()))
);
create policy "mv_update" on metric_values for update using (
  publication_id in (select id from publications where brand_id in (select public.user_writable_brand_ids()))
);

alter table metric_audit_log enable row level security;
create policy "audit_select" on metric_audit_log for select using (
  publication_id in (select id from publications where brand_id in (select public.user_brand_ids()))
);

alter table goals enable row level security;
create policy "goals_select" on goals for select using (brand_id in (select public.user_brand_ids()));
create policy "goals_insert" on goals for insert with check (brand_id in (select public.user_writable_brand_ids()));
create policy "goals_update" on goals for update using (brand_id in (select public.user_writable_brand_ids()));
create policy "goals_delete" on goals for delete using (
  brand_id in (select b.id from brands b where b.organization_id in (select public.user_admin_org_ids()))
);

alter table timeline_events enable row level security;
create policy "timeline_select" on timeline_events for select using (brand_id in (select public.user_brand_ids()));
create policy "timeline_insert" on timeline_events for insert with check (brand_id in (select public.user_writable_brand_ids()));
create policy "timeline_update" on timeline_events for update using (brand_id in (select public.user_writable_brand_ids()));
create policy "timeline_delete" on timeline_events for delete using (
  brand_id in (select b.id from brands b where b.organization_id in (select public.user_admin_org_ids()))
);

alter table reports enable row level security;
create policy "reports_select" on reports for select using (brand_id in (select public.user_brand_ids()));
create policy "reports_insert" on reports for insert with check (brand_id in (select public.user_writable_brand_ids()));
create policy "reports_update" on reports for update using (brand_id in (select public.user_writable_brand_ids()));
create policy "reports_delete" on reports for delete using (
  brand_id in (select b.id from brands b where b.organization_id in (select public.user_admin_org_ids()))
);

alter table report_snapshots enable row level security;
create policy "snapshots_select" on report_snapshots for select using (
  report_id in (select id from reports where brand_id in (select public.user_brand_ids()))
);
create policy "snapshots_insert" on report_snapshots for insert with check (
  report_id in (select id from reports where brand_id in (select public.user_writable_brand_ids()))
);

alter table report_views enable row level security;
create policy "views_select" on report_views for select using (
  report_id in (select id from reports where brand_id in (select public.user_brand_ids()))
);

-- 6. FUNÇÕES DE APLICAÇÃO

create or replace function public.complete_onboarding(
  p_org_name text,
  p_segment text,
  p_channels channel_type[]
)
returns jsonb
language plpgsql security definer
as $$
declare
  v_org_id uuid;
  v_brand_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into organizations (name) values (p_org_name)
  returning id into v_org_id;

  insert into brands (organization_id, name, segment)
  values (v_org_id, p_org_name, p_segment)
  returning id into v_brand_id;

  insert into memberships (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'admin');

  insert into channels (brand_id, type)
  select v_brand_id, unnest(p_channels);

  return jsonb_build_object(
    'organization_id', v_org_id,
    'brand_id', v_brand_id
  );
end;
$$;

grant execute on function public.complete_onboarding(text, text, channel_type[]) to authenticated;

create or replace function public.get_public_report(p_slug text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_report_id uuid;
  v_result jsonb;
begin
  select id into v_report_id
  from reports
  where public_slug = p_slug and published_at is not null;

  if v_report_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'report', jsonb_build_object(
      'id', r.id,
      'title', r.title,
      'template', r.template,
      'period_start', r.period_start,
      'period_end', r.period_end,
      'commentary', r.commentary,
      'published_at', r.published_at,
      'brand_name', b.name,
      'org_name', o.name
    ),
    'snapshot', rs.payload
  ) into v_result
  from reports r
  inner join brands b on b.id = r.brand_id
  inner join organizations o on o.id = b.organization_id
  inner join report_snapshots rs on rs.report_id = r.id
  where r.id = v_report_id
  order by rs.taken_at desc
  limit 1;

  return v_result;
end;
$$;

create or replace function public.record_report_view(
  p_slug text,
  p_viewer_email text default null,
  p_ip_hash text default null,
  p_user_agent text default null
)
returns void
language plpgsql security definer
as $$
declare
  v_report_id uuid;
begin
  select id into v_report_id
  from reports
  where public_slug = p_slug and published_at is not null;

  if v_report_id is not null then
    insert into report_views (report_id, viewer_email, ip_hash, user_agent)
    values (v_report_id, p_viewer_email, p_ip_hash, p_user_agent);
  end if;
end;
$$;

grant execute on function public.get_public_report(text) to anon, authenticated;
grant execute on function public.record_report_view(text, text, text, text) to anon, authenticated;

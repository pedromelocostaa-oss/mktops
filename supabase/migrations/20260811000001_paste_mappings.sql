create table public.paste_mappings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  channel_type text not null,
  mapping jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, channel_type)
);

alter table public.paste_mappings enable row level security;

create policy "Users can manage paste mappings for their brands"
  on public.paste_mappings
  for all
  using (brand_id in (select public.user_brand_ids()))
  with check (brand_id in (select public.user_writable_brand_ids()));

create trigger set_updated_at_paste_mappings
  before update on public.paste_mappings
  for each row execute function public.trg_set_updated_at();

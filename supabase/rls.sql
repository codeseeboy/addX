-- AddX RLS policies

-- Enable RLS
alter table public.stores enable row level security;
alter table public.store_settings enable row level security;
alter table public.ads enable row level security;
alter table public.devices enable row level security;
alter table public.playback_events enable row level security;

-- Helper: check ownership
create or replace function public.is_store_owner(store_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.stores s
    where s.id = store_uuid
      and s.owner_user_id = auth.uid()
  );
$$;

-- Stores: owner can CRUD their stores
drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores
for select
using (owner_user_id = auth.uid());

drop policy if exists stores_insert on public.stores;
create policy stores_insert on public.stores
for insert
with check (owner_user_id = auth.uid());

drop policy if exists stores_update on public.stores;
create policy stores_update on public.stores
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- Store settings: owner can read/write settings for their store
drop policy if exists store_settings_select on public.store_settings;
create policy store_settings_select on public.store_settings
for select
using (public.is_store_owner(store_id));

drop policy if exists store_settings_upsert on public.store_settings;
create policy store_settings_upsert on public.store_settings
for all
using (public.is_store_owner(store_id))
with check (public.is_store_owner(store_id));

-- Ads: owner can CRUD ads for their store
drop policy if exists ads_select on public.ads;
create policy ads_select on public.ads
for select
using (public.is_store_owner(store_id));

drop policy if exists ads_insert on public.ads;
create policy ads_insert on public.ads
for insert
with check (public.is_store_owner(store_id));

drop policy if exists ads_update on public.ads;
create policy ads_update on public.ads
for update
using (public.is_store_owner(store_id))
with check (public.is_store_owner(store_id));

drop policy if exists ads_delete on public.ads;
create policy ads_delete on public.ads
for delete
using (public.is_store_owner(store_id));

-- Devices: owner can manage devices for their store
drop policy if exists devices_all on public.devices;
create policy devices_all on public.devices
for all
using (public.is_store_owner(store_id))
with check (public.is_store_owner(store_id));

-- Playback events: owner can insert/read their store events
drop policy if exists playback_events_select on public.playback_events;
create policy playback_events_select on public.playback_events
for select
using (public.is_store_owner(store_id));

drop policy if exists playback_events_insert on public.playback_events;
create policy playback_events_insert on public.playback_events
for insert
with check (public.is_store_owner(store_id));


-- AddX production schema (Supabase Postgres)
-- Apply in Supabase SQL editor or via migrations.

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Stores
-- -----------------------------------------------------------------------------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,

  name text not null default 'My Store',
  type text not null default 'gas_station', -- gas_station | convenience | retail | cafe
  location text,

  subscription_status text not null default 'trial', -- trial | pro | expired
  trial_ends_at timestamptz,

  stripe_customer_id text,
  stripe_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stores_owner_user_id_idx on public.stores(owner_user_id);

-- -----------------------------------------------------------------------------
-- Store settings
-- -----------------------------------------------------------------------------
create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,

  ad_frequency_every_x_songs int not null default 1,
  music_volume real not null default 0.7,
  ad_volume real not null default 0.85,
  default_voice_style text not null default 'energetic',
  default_language text not null default 'en',
  auto_schedule boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Ads
-- -----------------------------------------------------------------------------
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,

  title text not null,
  raw_text text not null,
  script text,
  voice_style text not null default 'energetic',
  language text not null default 'en',
  duration_ms int,

  -- Supabase Storage object path (e.g. "store/<storeId>/ads/<adId>.mp3")
  audio_path text,

  status text not null default 'active', -- active | paused | draft

  plays_today int not null default 0,
  total_plays int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ads_store_id_idx on public.ads(store_id);
create index if not exists ads_store_status_idx on public.ads(store_id, status);

-- -----------------------------------------------------------------------------
-- Devices (for heartbeat / kiosk device mapping)
-- -----------------------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  device_label text,
  platform text,
  last_seen_at timestamptz,
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devices_store_id_idx on public.devices(store_id);

-- -----------------------------------------------------------------------------
-- Playback events (analytics + debugging)
-- -----------------------------------------------------------------------------
create table if not exists public.playback_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  type text not null, -- song | ad
  ref_id text, -- songId or adId
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists playback_events_store_id_idx on public.playback_events(store_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

drop trigger if exists ads_set_updated_at on public.ads;
create trigger ads_set_updated_at
before update on public.ads
for each row execute function public.set_updated_at();

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
before update on public.devices
for each row execute function public.set_updated_at();


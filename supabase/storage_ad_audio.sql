-- Run once in Supabase SQL Editor (after main schema + RLS).
-- Public bucket for generated ad MP3s (OpenAI TTS uploads from AddX Node backend using service role).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ad-audio',
  'ad-audio',
  true,
  52428800,
  array['audio/mpeg', 'audio/mp3']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ad_audio_public_read" on storage.objects;
create policy "ad_audio_public_read"
on storage.objects for select
to public
using (bucket_id = 'ad-audio');

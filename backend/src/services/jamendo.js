/**
 * Jamendo API — royalty-free tracks with streaming URLs (commercial use per Jamendo license).
 * https://developer.jamendo.com/v3.0/tracks
 */

export async function fetchJamendoTracks({ clientId, tags = 'pop', limit = 25 }) {
  if (!clientId) {
    throw new Error('JAMENDO_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: String(Math.min(50, Math.max(1, limit))),
    order: 'popularity_month',
    audioformat: 'mp32',
    tags: tags || 'pop',
  });

  const url = `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jamendo HTTP ${res.status}`);
  }
  const json = await res.json();
  const results = json?.results;
  if (!Array.isArray(results)) {
    throw new Error('Jamendo returned unexpected payload');
  }

  return results
    .filter((t) => t?.audio && t?.name)
    .map((t) => ({
      id: String(t.id),
      name: t.name,
      artist: t.artist_name || 'Unknown artist',
      streamUrl: t.audio,
      durationSec: Number(t.duration) || 180,
      image: t.image || t.album_image || null,
    }));
}

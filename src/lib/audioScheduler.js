export function buildPlaybackQueue({ songs = [], ads = [], everyXSongs = 4 } = {}) {
  const activeAds = (ads || []).filter((a) => a.status === 'active');
  const freq = Math.max(1, Number(everyXSongs) || 4);

  const queue = [];
  let songCount = 0;
  let adIndex = 0;

  for (const song of songs) {
    queue.push({ type: 'song', item: song });
    songCount += 1;

    if (activeAds.length > 0 && songCount % freq === 0) {
      queue.push({ type: 'ad', item: activeAds[adIndex % activeAds.length] });
      adIndex += 1;
    }
  }

  return queue;
}


import { spotifyLink } from './links.mjs';

export async function spotifyMetadata(value, request = fetch) {
  const link = spotifyLink(value);
  if (!link || link.type !== 'playlist') return { status: 'unavailable', title: 'Jason’s playlist', image: null, url: null };
  const fallback = { status: 'unavailable', title: 'Jason’s playlist', image: null, url: link.url };
  try {
    const endpoint = new URL('https://open.spotify.com/oembed');
    endpoint.searchParams.set('url', link.url);
    const response = await request(endpoint.href, {
      // The normalized playlist URL is the cache key, so changing the link can
      // never reuse metadata from the previous playlist.
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    let image = null;
    if (typeof data.thumbnail_url === 'string') {
      const artwork = new URL(data.thumbnail_url);
      if (artwork.protocol === 'https:' && (artwork.hostname.endsWith('.scdn.co') || artwork.hostname.endsWith('.spotifycdn.com'))) image = artwork.href;
    }
    return { status: 'ready', title: typeof data.title === 'string' && data.title.trim() ? data.title : fallback.title, image, url: link.url };
  } catch {
    return fallback;
  }
}

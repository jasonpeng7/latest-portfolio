import { spotifyLink } from "./links.mjs";

// Used only by the server route. Spotify credentials never enter the client bundle.
export function createSpotifyService({ env = process.env, request = fetch, now = Date.now } = {}) {
  let accessToken, accessExpiry = 0, cached, cacheExpiry = 0, pending;
  let refreshToken = env.SPOTIFY_REFRESH_TOKEN;
  const base = status => ({ status, isPlaying: false, track: null });

  async function token() {
    if (accessToken && now() < accessExpiry) return accessToken;
    const response = await request("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Spotify authorization unavailable");
    const data = await response.json();
    if (!data.access_token) throw new Error("Missing Spotify access token");
    accessToken = data.access_token;
    accessExpiry = now() + Math.max(0, (data.expires_in || 3600) - 60) * 1000;
    refreshToken = data.refresh_token || refreshToken;
    return accessToken;
  }

  async function load() {
    let ttl = 20000;
    let result;
    try {
      const response = await request("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${await token()}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (response.status === 204) result = base("idle");
      else if (response.status === 429) {
        ttl = Math.max(ttl, Math.min(3600, Number(response.headers.get("retry-after")) || 60) * 1000);
        result = base("unavailable");
      } else if (!response.ok) {
        if (response.status === 401) accessExpiry = 0;
        result = base("unavailable");
      } else {
        const data = await response.json();
        const item = data.item;
        const link = spotifyLink(item?.external_urls?.spotify);
        if (!item || item.type !== "track" || item.is_local || !link) result = base("idle");
        else result = {
          status: data.is_playing ? "playing" : "paused",
          isPlaying: Boolean(data.is_playing),
          observedAt: now(),
          progressMs: data.progress_ms || 0,
          track: {
            name: item.name,
            artist: (item.artists || []).map(artist => artist.name).join(", "),
            album: item.album?.name || "",
            image: item.album?.images?.find(image => image.url?.startsWith("https://i.scdn.co/"))?.url || null,
            durationMs: item.duration_ms || 0,
            url: link.url,
          },
        };
      }
    } catch {
      result = base("unavailable");
    }
    cached = result;
    cacheExpiry = now() + ttl;
    return result;
  }

  return {
    async current() {
      if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !refreshToken) return base("unconfigured");
      if (cached && now() < cacheExpiry) return cached;
      if (!pending) pending = load().finally(() => { pending = null; });
      return pending;
    },
  };
}

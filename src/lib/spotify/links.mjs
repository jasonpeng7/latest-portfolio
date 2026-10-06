const types = new Set(["track", "playlist", "album", "artist", "episode", "show"]);

export function spotifyLink(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("intl-")) parts.shift();
    if (parts[0] === "embed") parts.shift();
    const [type, id] = parts;
    if (parts.length !== 2 || !types.has(type) || !/^[A-Za-z0-9]{22}$/.test(id)) return null;
    return {
      url: `https://open.spotify.com/${type}/${id}`,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?theme=0`,
      type,
    };
  } catch {
    return null;
  }
}

export function musicTime(ms) {
  const seconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

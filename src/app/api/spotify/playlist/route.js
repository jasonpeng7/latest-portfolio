import { music } from '@/data/music';
import { spotifyMetadata } from '@/lib/spotify/metadata.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await spotifyMetadata(music.playlistUrl), { headers: { 'Cache-Control': 'no-store' } });
}

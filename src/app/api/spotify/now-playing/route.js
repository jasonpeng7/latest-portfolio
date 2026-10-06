import { createSpotifyService } from "@/lib/spotify/server.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const spotify = createSpotifyService();

export async function GET() {
  return Response.json(await spotify.current(), { headers: { "Cache-Control": "no-store" } });
}

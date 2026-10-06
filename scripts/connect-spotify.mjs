import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local first. See README.md.');
  process.exit(1);
}

const redirectUri = 'http://127.0.0.1:4387/callback';
const state = randomBytes(32).toString('hex');
const authorize = new URL('https://accounts.spotify.com/authorize');
authorize.search = new URLSearchParams({
  client_id: clientId, response_type: 'code', redirect_uri: redirectUri,
  scope: 'user-read-currently-playing', state, show_dialog: 'true',
}).toString();
let exchanging = false;
const server = createServer(async (request, response) => {
  const url = new URL(request.url, redirectUri);
  if (url.pathname !== '/callback') { response.writeHead(404).end(); return; }
  const supplied = Buffer.from(url.searchParams.get('state') || '');
  const expected = Buffer.from(state);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    response.writeHead(400).end('Invalid authorization state. Please use the authorization link from the terminal.');
    return;
  }
  if (url.searchParams.has('error') || !url.searchParams.get('code')) {
    response.writeHead(400).end('Spotify connection was not authorized. You can run the command again.');
    finish(1);
    return;
  }
  if (exchanging) { response.writeHead(409).end('Authorization already in progress.'); return; }
  exchanging = true;
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: redirectUri }),
      signal: AbortSignal.timeout(15000),
    });
    if (!tokenResponse.ok) throw new Error('Spotify token exchange failed');
    const tokens = await tokenResponse.json();
    if (!tokens.refresh_token || !tokens.scope?.split(' ').includes('user-read-currently-playing')) throw new Error('Spotify did not grant listening access');
    let existing = '';
    try { existing = await readFile('.env.local', 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const entry = `SPOTIFY_REFRESH_TOKEN=${JSON.stringify(tokens.refresh_token)}`;
    const updated = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(existing)
      ? existing.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, () => entry)
      : `${existing.trimEnd()}\n${entry}\n`;
    await writeFile('.env.local', updated, { mode: 0o600 });
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Spotify connected. You can close this tab and restart the portfolio preview.');
    console.log('Spotify connected. Refresh token saved privately to .env.local. Restart npm run dev.');
    finish(0);
  } catch {
    response.writeHead(502).end('Could not connect Spotify. Check your developer app credentials and redirect URI, then try again.');
    console.error('Spotify connection failed. No credentials or tokens were logged.');
    finish(1);
  }
});
const timeout = setTimeout(() => { console.error('Spotify connection timed out. Run the command again when ready.'); finish(1); }, 10 * 60 * 1000);
function finish(code) {
  clearTimeout(timeout);
  server.close(() => { process.exitCode = code; });
}
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port 4387 is occupied. Free that port and run the command again.' : 'Could not start the local Spotify connection helper.');
  finish(1);
});
process.on('SIGINT', () => finish(0));
server.listen(4387, '127.0.0.1', () => {
  console.log(`Open this URL and authorize Jason’s Spotify account:\n${authorize.href}`);
});

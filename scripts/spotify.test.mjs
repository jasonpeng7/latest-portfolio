import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpotifyService } from '../src/lib/spotify/server.mjs';
import { spotifyLink, musicTime } from '../src/lib/spotify/links.mjs';
import { spotifyMetadata } from '../src/lib/spotify/metadata.mjs';

const env = { SPOTIFY_CLIENT_ID: 'private-client', SPOTIFY_CLIENT_SECRET: 'private-secret', SPOTIFY_REFRESH_TOKEN: 'private-refresh' };
const trackUrl = 'https://open.spotify.com/track/0123456789ABCDEFGHIJKL';
const item = {
  type: 'track', name: 'Test track', artists: [{ name: 'Test artist' }],
  album: { name: 'Test album', images: [{ url: 'https://i.scdn.co/image/test' }] },
  duration_ms: 180000, external_urls: { spotify: trackUrl },
};
const tokenResponse = () => Response.json({ access_token: 'private-access', expires_in: 3600 });

test('changing the playlist link changes its metadata request and artwork together', async () => {
  const urls = ['https://open.spotify.com/playlist/25EhFL0lSRZEy5Frd8Umd3?si=old', 'https://open.spotify.com/playlist/3jwyaToHWrMXNCLLw2Ws5h?si=new'];
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    const id = new URL(new URL(url).searchParams.get('url')).pathname.split('/').pop();
    return Response.json({ title: `Playlist ${id}`, thumbnail_url: `https://mosaic.scdn.co/300/${id}` });
  };
  const previous = await spotifyMetadata(urls[0], request);
  const current = await spotifyMetadata(urls[1], request);
  assert.notEqual(calls[0].url, calls[1].url, 'different playlists cannot share a fetch/cache key');
  assert.notEqual(current.image, previous.image);
  assert.notEqual(current.title, previous.title);
  assert.equal(current.url, spotifyLink(urls[1]).url);
  assert.equal(calls[1].options.headers, undefined, 'metadata needs no private account authorization');
});

test('playlist metadata rejects arbitrary URLs and untrusted thumbnail hosts', async () => {
  let requests = 0;
  const request = async () => { requests++; return Response.json({ title: 'Playlist', thumbnail_url: 'https://evil.example/image.jpg' }); };
  assert.equal((await spotifyMetadata('https://evil.example/private', request)).status, 'unavailable');
  assert.equal(requests, 0);
  const result = await spotifyMetadata('https://open.spotify.com/playlist/3jwyaToHWrMXNCLLw2Ws5h', request);
  assert.equal(result.image, null);
  assert.equal(result.title, 'Playlist');
});

test('metadata failures show a neutral sleeve and retain the playable playlist URL', async () => {
  const url = 'https://open.spotify.com/playlist/3jwyaToHWrMXNCLLw2Ws5h';
  for (const request of [async () => new Response(null, { status: 404 }), async () => { throw new Error('Unavailable'); }]) {
    assert.deepEqual(await spotifyMetadata(url, request), { status: 'unavailable', title: 'Jason’s playlist', image: null, url });
  }
});

test('Spotify links accept supported public content and reject arbitrary iframe origins', () => {
  const id = '25EhFL0lSRZEy5Frd8Umd3';
  assert.equal(spotifyLink(`https://open.spotify.com/playlist/${id}?si=tracking`).embedUrl, `https://open.spotify.com/embed/playlist/${id}?theme=0`);
  assert.equal(spotifyLink(`https://open.spotify.com/intl-en/track/${id}`).type, 'track');
  assert.equal(spotifyLink(`https://open.spotify.com/embed/album/${id}`).type, 'album');
  for (const value of [null, 'javascript:alert(1)', `https://open.spotify.com.evil.test/track/${id}`, `http://open.spotify.com/track/${id}`, `https://open.spotify.com/user/${id}`, `https://open.spotify.com/track/${id}/extra`, 'https://open.spotify.com/track/nope']) assert.equal(spotifyLink(value), null);
  assert.equal(musicTime(185000), '3:05');
  assert.equal(musicTime(-100), '0:00');
});

test('an unconnected account makes no external requests and reports an honest empty state', async () => {
  const service = createSpotifyService({ env: {}, request: () => { throw new Error('Must not request'); } });
  assert.deepEqual(await service.current(), { status: 'unconfigured', isPlaying: false, track: null });
});

test('concurrent visitors share the token and cached listening result without exposing credentials', async () => {
  const calls = [];
  const service = createSpotifyService({ env, now: () => 1000, request: async (url, options) => {
    calls.push({ url, options });
    return url.includes('/api/token') ? tokenResponse() : Response.json({ item, is_playing: true, progress_ms: 42000, device: { id: 'private-device' } });
  } });
  const results = await Promise.all([service.current(), service.current(), service.current()]);
  assert.equal(calls.length, 2);
  assert.equal((await service.current()).track.name, 'Test track');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.body.get('grant_type'), 'refresh_token');
  assert.equal(calls[0].options.body.get('refresh_token'), env.SPOTIFY_REFRESH_TOKEN);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer private-access');
  assert.equal(results[0].status, 'playing');
  assert.equal(results[0].observedAt, 1000);
  assert.equal(results[0].progressMs, 42000);
  assert.equal(results[0].track.url, trackUrl);
  assert.ok(!JSON.stringify(results).includes('private-'));
});

test('paused playback remains paused rather than claiming Jason is currently listening', async () => {
  const service = createSpotifyService({ env, request: async url => url.includes('/api/token') ? tokenResponse() : Response.json({ item, is_playing: false, progress_ms: 9000 }) });
  const result = await service.current();
  assert.equal(result.status, 'paused');
  assert.equal(result.isPlaying, false);
  assert.equal(result.track.name, item.name);
});

test('empty, local, and unsupported playback states show no invented song', async () => {
  for (const response of [() => new Response(null, { status: 204 }), () => Response.json({ item: null }), () => Response.json({ item: { ...item, is_local: true } }), () => Response.json({ item: { ...item, type: 'episode' } })]) {
    const service = createSpotifyService({ env, request: async url => url.includes('/api/token') ? tokenResponse() : response() });
    assert.deepEqual(await service.current(), { status: 'idle', isPlaying: false, track: null });
  }
});

test('rate limits delay further Spotify requests for the Retry-After window', async () => {
  let time = 0, calls = 0;
  const service = createSpotifyService({ env, now: () => time, request: async url => {
    calls++;
    return url.includes('/api/token') ? tokenResponse() : new Response(null, { status: 429, headers: { 'Retry-After': '120' } });
  } });
  assert.equal((await service.current()).status, 'unavailable');
  time = 30000;
  await service.current();
  time = 119000;
  await service.current();
  assert.equal(calls, 2);
  time = 120001;
  await service.current();
  assert.equal(calls, 3);
});

test('expired access tokens refresh using the most recent rotated refresh token', async () => {
  let time = 0;
  const refreshBodies = [];
  const service = createSpotifyService({ env, now: () => time, request: async (url, options) => {
    if (!url.includes('/api/token')) return new Response(null, { status: 204 });
    refreshBodies.push(options.body.get('refresh_token'));
    return Response.json({ access_token: `access-${refreshBodies.length}`, expires_in: 3600, refresh_token: 'rotated-refresh' });
  } });
  await service.current();
  time = 3600000;
  await service.current();
  assert.deepEqual(refreshBodies, ['private-refresh', 'rotated-refresh']);
});

test('network and authorization errors return a safe unavailable state', async () => {
  for (const failure of [() => { throw new Error('private-secret from upstream'); }, () => new Response(null, { status: 400 })]) {
    const service = createSpotifyService({ env, request: async () => failure() });
    const result = await service.current();
    assert.deepEqual(result, { status: 'unavailable', isPlaying: false, track: null });
    assert.ok(!JSON.stringify(result).includes('private'));
  }
});

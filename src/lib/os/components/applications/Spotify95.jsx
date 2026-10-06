/* eslint-disable @next/next/no-img-element -- Native images preserve desktop icons and Spotify-hosted cover art. */
import React, { useEffect, useState } from 'react';
import Window from '../os/Window';
import { music } from '@/data/music';
import { musicTime, spotifyLink } from '@/lib/spotify/links.mjs';

const playlist = spotifyLink(music.playlistUrl);
const playlistFallback = { title: 'Jason’s playlist', image: null, url: playlist.url };

function RecordSleeve({ image }) {
  return <div className="s95-cover" aria-hidden="true">
    {image ? <img src={image} alt="" /> : <><span className="s95-record" /><span className="s95-cover-caption">JP / SIDE A</span></>}
  </div>;
}

export default function Spotify95(props) {
  const [tab, setTab] = useState('playlist');
  const [activity, setActivity] = useState({ status: 'loading', track: null });
  const [playlistInfo, setPlaylistInfo] = useState(playlistFallback);
  const [selected, setSelected] = useState(playlist);
  const [trackTitle, setTrackTitle] = useState('');
  const [playerVersion, setPlayerVersion] = useState(0);
  const mobile = window.innerWidth < 700;
  const track = activity.track;
  const live = activity.status === 'playing';
  const playerTitle = selected.url === playlist.url ? playlistInfo.title : trackTitle;

  useEffect(() => {
    setSelected(playlist);
    setPlaylistInfo(playlistFallback);
    setTrackTitle('');
  }, [playlist.url]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/spotify/playlist', { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Playlist information unavailable'); return response.json(); })
      .then(info => { if (info.url === playlist.url) setPlaylistInfo(info); })
      .catch(() => { /* The player still works when Spotify metadata is unavailable. */ });
    return () => controller.abort();
  }, [playerVersion, playlist.url]);

  useEffect(() => {
    let disposed = false;
    let controller;
    const update = async () => {
      if (document.hidden) return;
      controller = new AbortController();
      try {
        const response = await fetch('/api/spotify/now-playing', { signal: controller.signal });
        if (!response.ok) throw new Error('Listening activity unavailable');
        const data = await response.json();
        if (!disposed) setActivity(data);
      } catch (error) {
        if (!disposed && error.name !== 'AbortError') setActivity({ status: 'unavailable', track: null });
      }
    };
    update();
    const timer = setInterval(update, 30000);
    const onVisible = () => { if (!document.hidden) update(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const selectPlaylist = () => {
    setTab('playlist');
    setSelected(playlist);
  };
  const listenToTrack = () => {
    const link = spotifyLink(track?.url);
    if (!link) return;
    setSelected(link);
    setTrackTitle(track.name);
  };
  const emptyMessage = {
    loading: 'Checking what’s in Jason’s headphones…',
    unconfigured: 'Live listening isn’t connected yet. In the meantime, take a spin through Jason’s playlist.',
    idle: 'Jason isn’t playing anything right now. His playlist is always here for you.',
    unavailable: 'The live signal is taking a break. You can still play Jason’s playlist below.',
  }[activity.status];

  return <Window
    top={mobile ? 8 : 52} left={mobile ? 8 : 160}
    width={Math.min(900, window.innerWidth - (mobile ? 16 : 180))}
    height={Math.min(760, window.innerHeight - (mobile ? 52 : 100))}
    windowTitle="Spotify95 — Jason's listening room" windowBarIcon="spotifyIcon" windowBarColor="#174e34"
    closeWindow={props.onClose} onInteract={props.onInteract} minimizeWindow={props.onMinimize}
    bottomLeftText="Spotify95 · JasonOS"
  >
    <div className="spotify95">
      <div className="s95-menu">
        <span>Music for your visit</span>
        <a href={selected.url} target="_blank" rel="noreferrer">Open in Spotify ↗</a>
      </div>
      <div className="s95-layout">
        <aside className="s95-sidebar">
          <div className="s95-brand"><img src="/os-assets/icons/spotify95.svg" alt="" /><strong>Spotify<span>95</span></strong></div>
          <span className="s95-eyebrow">YOUR LIBRARY</span>
          <button type="button" className={tab === 'playlist' ? 's95-nav active' : 's95-nav'} aria-pressed={tab === 'playlist'} onClick={selectPlaylist}><span aria-hidden="true">▤</span> On repeat</button>
          <button type="button" className={tab === 'live' ? 's95-nav active' : 's95-nav'} aria-pressed={tab === 'live'} onClick={() => setTab('live')}><span aria-hidden="true">♫</span> Now listening</button>
          <div className="s95-library-item"><span className="s95-tiny-cover" aria-hidden="true">JP</span><div><strong>{playlistInfo.title}</strong><small>Jason’s playlist pick</small></div></div>
          <div className="s95-sidebar-footer"><span className="s95-avatar" aria-hidden="true">JP</span><div><strong>Jason Peng</strong><small>Personal listening room</small></div></div>
        </aside>
        <main className="s95-main">
          <div className="s95-topline"><span>JASON’S LISTENING ROOM</span><span className="s95-status"><i className={live ? 'live' : ''} />{live ? 'Jason is listening' : 'On your own time'}</span></div>
          {tab === 'playlist' ? <>
            <section className="s95-hero">
              <RecordSleeve image={playlistInfo.image} />
              <div className="s95-hero-copy"><span className="s95-eyebrow">ON REPEAT</span><h1>{playlistInfo.title}</h1><p>A little of what’s in my headphones.</p><span className="s95-owner">Selected by Jason Peng</span></div>
            </section>
            <div className="s95-section-heading"><h2>On repeat</h2><span>Pick a track. Stay a while.</span></div>
          </> : <>
            <section className="s95-hero s95-live-hero">
              <RecordSleeve image={track?.image} />
              <div className="s95-hero-copy"><span className="s95-eyebrow">{live ? 'LIVE FROM JASON’S SPOTIFY' : track ? 'PAUSED ON JASON’S SPOTIFY' : 'NOW LISTENING'}</span><h1>{track?.name || 'Off the air'}</h1><p>{track?.artist || emptyMessage}</p>{track && <span className="s95-owner">{track.album}</span>}</div>
            </section>
            {track ? <div className="s95-activity">
              <div className="s95-activity-progress"><span>Jason’s position · {musicTime(activity.progressMs)} / {musicTime(track.durationMs)}</span><progress aria-label="Jason's listening progress" max={Math.max(1, track.durationMs)} value={Math.min(activity.progressMs, track.durationMs)} /></div>
              <button type="button" className="s95-button s95-listen" onClick={listenToTrack}>▶ Listen to this track</button>
              <p>Playback here is yours. Jason’s music keeps playing on his device.</p>
            </div> : <div className="s95-empty"><span aria-hidden="true">♫</span><div><strong>The playlist is ready when you are.</strong><p>No need to wait for Jason to press play.</p></div><button type="button" className="s95-button" onClick={selectPlaylist}>Browse playlist</button></div>}
          </>}
          <section className="s95-player" aria-label="Spotify music player">
            <div className="s95-player-label"><span>♫ {playerTitle}</span><button type="button" className="s95-button" onClick={() => setPlayerVersion(version => version + 1)}>Reload player</button></div>
            <iframe key={`${selected.url}-${playerVersion}`} src={selected.embedUrl} title={`Spotify — ${playerTitle}`} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
          </section>
          <p className="s95-playback-note">Press play in the player to listen. Spotify may offer previews or ask you to sign in.</p>
        </main>
      </div>
    </div>
  </Window>;
}

"use client";
import { cameraFilm } from "@/data/film";

function timestamp(seconds = 0) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function CameraPlayer({ ready, film, onToggle, onReplay, onMute, onClose }) {
  return <section className="camera-playback-controls" aria-label="Camera LCD playback">
    <div className="camera-playback-caption"><span>{cameraFilm.title}</span><span>{ready ? `${timestamp(film.time)} / ${timestamp(film.duration)}` : "Lifting & turning…"}</span></div>
    <div className="camera-playback-buttons">
      <button type="button" disabled={!ready || film.error} onClick={onToggle}>{film.playing ? "PAUSE" : "PLAY"}</button>
      <button type="button" disabled={!ready} onClick={onReplay}>REPLAY</button>
      <button type="button" disabled={!ready} aria-pressed={!film.muted} onClick={onMute}>{film.muted ? "SOUND OFF" : "SOUND ON"}</button>
      <button type="button" onClick={onClose} aria-label="Return camera to table">BACK ↩</button>
    </div>
    {film.error && <p role="alert">Film couldn’t load. Press Replay to try again.</p>}
  </section>;
}

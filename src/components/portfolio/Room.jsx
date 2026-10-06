"use client";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/portfolio";
import eventBus from "@/lib/room/ui/EventBus";
import LoadingScreen from "@/lib/room/ui/components/LoadingScreen";

export default function Room() {
  const host = useRef(null);
  const room = useRef(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState("loading");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false, unmountUI;
    const onStart = () => room.current?.start();
    document.addEventListener("loadingScreenDone", onStart);
    const onKey = event => { if (event.key === "Escape") room.current?.transition("desk"); };
    window.addEventListener("keydown", onKey);
    Promise.all([import("@/lib/room/createRoom"), import("@/lib/room/ui/App")]).then(([{ createRoom }, { mountUI }]) => {
      if (cancelled) return;
      unmountUI = mountUI();
      room.current = createRoom(host.current, {
        onProgress: data => { if (!cancelled) setProgress(previous => Math.max(previous, Math.min(data.loaded / Math.max(1, data.total), .99))); },
        onReady: () => { if (!cancelled) { setProgress(1); setReady(true); } },
        onError: () => { if (!cancelled) setError(true); },
        onView: next => { if (!cancelled) { setView(next); document.dispatchEvent(new CustomEvent(next === "monitor" ? "enterMonitor" : "leftMonitor")); } },
      });
    }).catch(() => { if (!cancelled) setError(true); });
    const mute = event => room.current?.setMuted(event.detail);
    const free = event => room.current?.transition(event.detail ? "free" : "room");
    document.addEventListener("muteToggle", mute);
    document.addEventListener("freeCamToggle", free);
    return () => { cancelled = true; document.removeEventListener("loadingScreenDone", onStart); document.removeEventListener("muteToggle", mute); document.removeEventListener("freeCamToggle", free); window.removeEventListener("keydown", onKey); room.current?.destroy(); room.current = null; unmountUI?.(); };
  }, []);
  return <main className="room-page">
    <div ref={host} className="room-stage" />
    <div id="ui-interactive" /><div id="ui" />
    {view === "loading" && !error && <LoadingScreen progress={progress} ready={ready} onStart={() => { if (ready) eventBus.dispatch("loadingScreenDone", {}); }} />}
    {view !== "loading" && <nav className="room-navigation" aria-label="Camera views"><button type="button" aria-pressed={view === "room"} onClick={() => room.current?.transition("room")}>ROOM</button><button type="button" aria-pressed={view === "desk"} onClick={() => room.current?.transition("desk")}>DESK</button><button type="button" aria-pressed={view === "monitor"} onClick={() => room.current?.transition("monitor")}>COMPUTER</button><a href="/desktop">2D ↗</a></nav>}
    <a className="room-fallback" href="/desktop">Open 2D portfolio ↗</a>
    {error && <section className="room-error room-loading-error"><h1>{profile.name}</h1><p>The 3D experience couldn’t load in this browser.</p><a href="/desktop">Explore my complete portfolio in JasonOS →</a></section>}
    <noscript><div className="room-error"><h1>{profile.name}</h1><p>{profile.bio}</p><a href={`mailto:${profile.email}`}>{profile.email}</a></div></noscript>
  </main>;
}

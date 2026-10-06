import React, { useEffect, useRef, useState } from 'react';
let runtime;
function loadRuntime() {
  if (window.Dos) return Promise.resolve();
  if (!runtime) runtime = new Promise((resolve, reject) => {
    const css = document.createElement('link'); css.rel='stylesheet'; css.href='/os-games/js-dos/js-dos.css'; document.head.appendChild(css);
    const script=document.createElement('script'); script.src='/os-games/js-dos/js-dos.js';
    script.onload=() => { window.emulators.pathPrefix='/os-games/js-dos/'; resolve(); }; script.onerror=reject;
    document.head.appendChild(script);
  });
  return runtime;
}
export default function DosPlayer({ width, height, bundleUrl }) {
  const root=useRef(null); const [error,setError]=useState(false);
  useEffect(() => {
    let cancelled=false, instance;
    loadRuntime().then(async () => { if(cancelled) return; instance=window.Dos(root.current); root.current.querySelectorAll('.flex-grow-0').forEach(element => element.remove()); await instance.run(bundleUrl); }).catch(() => { if(!cancelled) setError(true); });
    return () => { cancelled=true; instance?.stop(); };
  }, [bundleUrl]);
  return <div ref={root} style={{width,height,position:'absolute'}}>{error && <p>Unable to start the game. Close this window and try again.</p>}</div>;
}

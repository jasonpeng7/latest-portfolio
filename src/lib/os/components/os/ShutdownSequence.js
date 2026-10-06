import React, { useEffect } from 'react';
export default function ShutdownSequence({ setShutdown }) {
  useEffect(() => { const timer=setTimeout(() => setShutdown(false), 2500); return () => clearTimeout(timer); }, [setShutdown]);
  return <div className="shutdown-screen"><p>JasonOS is restarting...</p><p>See you on the other side_</p><button className="site-button" onClick={() => setShutdown(false)}>Restart now</button></div>;
}

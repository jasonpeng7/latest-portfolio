import React, { useEffect, useRef, useState } from 'react';
import FreeCamToggle from './FreeCamToggle';
import MuteToggle from './MuteToggle';
import { profile } from '@/data/portfolio';
export default function InfoOverlay({ visible }) {
  const [count,setCount]=useState(0),[time,setTime]=useState(new Date().toLocaleTimeString());
  const progress=useRef(0);
  const total=profile.name.length+profile.title.length+11;
  useEffect(() => { const timer=setInterval(() => setTime(new Date().toLocaleTimeString()),1000); return () => clearInterval(timer); },[]);
  useEffect(() => {
    if(!visible || progress.current>=total) return;
    const timer=setInterval(() => { setCount(++progress.current); if(progress.current>=total) clearInterval(timer); },80);
    return () => clearInterval(timer);
  },[visible,total]);
  const name=profile.name.slice(0,count),title=profile.title.slice(0,Math.max(0,count-profile.name.length));
  const clock=time.slice(0,Math.max(0,count-profile.name.length-profile.title.length));
  const block={ background:'black',padding:'4px 16px',textAlign:'center',display:'flex',marginBottom:4,boxSizing:'border-box' };
  return <div style={{ position:'absolute',display:'flex',flexDirection:'column',width:'100%',alignItems:'flex-start',justifyContent:'flex-start' }}>{name && <div style={block}><p>{name}</p></div>}{title && <div style={block}><p>{title}</p></div>}{clock && <div style={{display:'flex',gap:4}}><div style={block}><p>{clock}</p></div>{count>=total && <><MuteToggle /><FreeCamToggle /></>}</div>}</div>;
}

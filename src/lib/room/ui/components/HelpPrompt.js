import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import UIEventBus from '../EventBus';
const TEXT = 'Click anywhere to begin';
export default function HelpPrompt() {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let index=0;
    const timer=setInterval(() => { setText(TEXT.slice(0,++index)); if(index===TEXT.length) clearInterval(timer); },90);
    const hide=() => setVisible(false);
    document.addEventListener('mousedown',hide);
    const unsubscribe=UIEventBus.on('enterMonitor',hide);
    return () => { clearInterval(timer); document.removeEventListener('mousedown',hide); unsubscribe(); };
  }, []);
  return text ? <motion.div animate={{ opacity:visible?1:0,y:visible?0:12 }} style={{ position:'absolute',bottom:64,background:'black',padding:'4px 16px',textAlign:'center',display:'flex',alignItems:'flex-end' }}><p>{text}</p><span className="blinking-cursor" style={{marginLeft:8,marginBottom:2}} /></motion.div> : null;
}

import React, { useState } from 'react';
import Image from 'next/image';
import UIEventBus from '../EventBus';
export default function MuteToggle() {
  const [muted,setMuted]=useState(false);
  return <button className="icon-control-container room-icon-button" type="button" aria-label={muted?'Unmute audio':'Mute audio'} aria-pressed={muted} onClick={() => { const next=!muted; setMuted(next); UIEventBus.dispatch('muteToggle',next); }}><Image unoptimized src={`/room/textures/UI/volume_${muted?'off':'on'}.svg`} alt="" width={10} height={10} /></button>;
}

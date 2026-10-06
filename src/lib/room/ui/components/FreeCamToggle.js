import React, { useState } from 'react';
import Image from 'next/image';
import UIEventBus from '../EventBus';
export default function FreeCamToggle() {
  const [active,setActive]=useState(false);
  return <button className="icon-control-container room-icon-button" type="button" aria-label={active?'Exit free camera':'Enable free camera'} aria-pressed={active} onClick={() => { const next=!active; setActive(next); UIEventBus.dispatch('freeCamToggle',next); }}><Image unoptimized src={`/room/textures/UI/${active?'mouse':'camera'}.svg`} alt="" width={active?4:10} height={active?6:10} /></button>;
}

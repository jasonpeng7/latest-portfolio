import React from 'react';
import Window from '../os/Window';
export default function Credits(props) {
  return (
    <Window top={48} left={48} width={Math.min(900, window.innerWidth-60)} height={Math.min(650,window.innerHeight-90)} windowTitle="Credits" windowBarIcon="windowExplorerIcon" closeWindow={props.onClose} onInteract={props.onInteract} minimizeWindow={props.onMinimize} bottomLeftText="JasonOS — acknowledgements">
      <div className="credits-content">
        <h2>Jason Peng Portfolio</h2>
        <h3>Original 3D experience &amp; OS design</h3>
        <p><a href="https://github.com/henryjeff/portfolio-website" target="_blank" rel="noreferrer">Henry Heffernan</a></p>
        <p className="credit-source"><a href="https://github.com/henryjeff/portfolio-inner-site" target="_blank" rel="noreferrer">Original OS source ↗</a></p>
        <h3>Bed Agape</h3>
        <p><a href="https://sketchfab.com/3d-models/bed-agape-96ed3f6ba55848809dfa8cd505edddae" target="_blank" rel="noreferrer">Render - City</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></p>
        <p>Scaled and placed in the room, with a custom nightstand lamp.</p>
      </div>
    </Window>
  );
}

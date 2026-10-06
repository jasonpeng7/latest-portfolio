import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../showcase/Home';
import Window from '../os/Window';
import { About, Experience, Projects, Contact } from '../showcase/PersonalPages';
import VerticalNavbar from '../showcase/VerticalNavbar';
import useInitialWindowSize from '../../hooks/useInitialWindowSize';

export default function ShowcaseExplorer(props) {
  const { initWidth, initHeight } = useInitialWindowSize({ margin: 100 });
  const mobile = window.innerWidth < 700;
  return <Window top={mobile ? 8 : 24} left={mobile ? 8 : 56} width={mobile ? window.innerWidth - 16 : initWidth} height={mobile ? window.innerHeight - 52 : initHeight} windowTitle="Jason Peng — Showcase" windowBarIcon="windowExplorerIcon" closeWindow={props.onClose} onInteract={props.onInteract} minimizeWindow={props.onMinimize} bottomLeftText={`© ${new Date().getFullYear()} Jason Peng`}>
    <Router><div className="site-page"><VerticalNavbar /><Routes><Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/experience" element={<Experience />} /><Route path="/projects/*" element={<Projects />} /><Route path="/contact" element={<Contact />} /></Routes></div></Router>
  </Window>;
}

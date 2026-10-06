import React from 'react';
import { Link } from '../general';
import { useLocation } from 'react-router-dom';
export default function VerticalNavbar() {
  const location = useLocation();
  if (location.pathname === '/') return null;
  return <nav className="showcase-sidebar"><div className="showcase-sidebar-heading"><h1>Jason</h1><h1>Peng</h1><h3>Showcase</h3></div><div className="showcase-sidebar-links">{[['','HOME'],['about','ABOUT'],['experience','EXPERIENCE'],['projects','PROJECTS'],['contact','CONTACT']].map(([path,label]) => <Link key={label} to={path} text={label} containerStyle={{ marginBottom: 32 }} />)}</div></nav>;
}

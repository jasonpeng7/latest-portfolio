import React from 'react';
import { Link } from '../general';
import { profile } from '@/data/portfolio';
export default function Home() {
  return <div className="showcase-home" style={{ left: 0, right: 0, top: 0, position: 'absolute', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
    <div style={{ textAlign: 'center', marginBottom: 64, marginTop: 64, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><h1 className="showcase-name" style={{ fontSize: 72, marginBottom: 16, lineHeight: .9 }}>{profile.name}</h1><h2>{profile.title}</h2></div>
    <div className="showcase-home-links" style={{ justifyContent: 'space-between' }}>{['about','experience','projects','contact'].map(page => <Link key={page} containerStyle={{ padding: 16 }} to={page} text={page.toUpperCase()} />)}</div>
    <div style={{ marginTop: 64, width: '100%', justifyContent: 'center', alignItems: 'center' }} />
  </div>;
}

/* eslint-disable @next/next/no-img-element -- The photo viewer displays local gallery assets at their original aspect ratio. */
import React, { useState } from 'react';
import Window from '../os/Window';
import { photos } from '@/data/photos';

export function PhotoLibrary({ items = photos }) {
  const [album, setAlbum] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const albums = [...new Set(items.map(photo => photo.album || 'Unsorted'))];
  const filtered = items.filter(photo =>
    (!album || (photo.album || 'Unsorted') === album) &&
    `${photo.title || ''} ${photo.album || ''} ${photo.location || ''}`.toLowerCase().includes(query.toLowerCase().trim())
  );
  const selectedIndex = filtered.findIndex(photo => photo.id === selectedId);
  const selected = filtered[selectedIndex];
  const step = direction => {
    if (filtered.length) setSelectedId(filtered[(selectedIndex + direction + filtered.length) % filtered.length].id);
  };
  const onKeyDown = event => {
    if (!selected) return;
    if (event.key === 'Escape') { event.stopPropagation(); setSelectedId(null); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  };

  return <div className="photos95" onKeyDown={onKeyDown}>
    <header className="p95-toolbar">
      <span>Jason’s photo library</span>
      <span>{items.length} {items.length === 1 ? 'photo' : 'photos'}</span>
    </header>
    <div className="p95-layout">
      <nav className="p95-sidebar" aria-label="Photo albums">
        <img src="/os-assets/icons/photos95.svg" alt="" width="40" height="40" />
        <h2>Albums</h2>
        <button className="site-button" aria-pressed={!album} onClick={() => { setAlbum(null); setSelectedId(null); }}>All photos</button>
        {albums.map(name => <button key={name} className="site-button" aria-pressed={album === name} onClick={() => { setAlbum(name); setSelectedId(null); }}>{name}</button>)}
        <p>A few moments through my lens.</p>
      </nav>
      <main className="p95-main">
        {selected ? <div className="p95-viewer">
          <div className="p95-viewer-controls">
            <button autoFocus className="site-button" onClick={() => setSelectedId(null)}>← Library</button>
            <span>{selectedIndex + 1} / {filtered.length}</span>
            <div><button className="site-button" aria-label="Previous photo" disabled={filtered.length < 2} onClick={() => step(-1)}>←</button><button className="site-button" aria-label="Next photo" disabled={filtered.length < 2} onClick={() => step(1)}>→</button></div>
          </div>
          <figure className="p95-photo">
            <img src={selected.src} alt={selected.alt || selected.title || 'Photo by Jason Peng'} />
            <figcaption><h2>{selected.title || 'Untitled'}</h2>{selected.location && <p>{selected.location}</p>}{selected.date && <time dateTime={selected.date}>{selected.date}</time>}</figcaption>
          </figure>
        </div> : <>
          <div className="p95-library-heading"><h1>{album || 'All photos'}</h1><label>Search photos<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Title, album, or place" /></label></div>
          {filtered.length ? <div className="p95-grid">{filtered.map(photo => <button key={photo.id} className="big-button-container p95-thumbnail" onClick={() => setSelectedId(photo.id)} aria-label={`View ${photo.title || 'photo'}`}><img src={photo.src} alt={photo.alt || photo.title || 'Photo by Jason Peng'} loading="lazy" /><span>{photo.title || 'Untitled'}</span></button>)}</div> : <div className="p95-empty"><img src="/os-assets/icons/photos95.svg" alt="" width="72" height="72" /><h2>{items.length ? 'No photos found' : 'The first roll is coming soon.'}</h2><p>{items.length ? 'Try a different search or album.' : 'Travel, everyday moments, and a few favorites. Check back for the first collection.'}</p></div>}
        </>}
      </main>
    </div>
  </div>;
}

export default function Photos(props) {
  const mobile = window.innerWidth < 700;
  return <Window
    top={mobile ? 8 : 40} left={mobile ? 8 : 120}
    width={Math.min(1000, window.innerWidth - (mobile ? 16 : 140))}
    height={Math.min(760, window.innerHeight - (mobile ? 52 : 100))}
    windowTitle="Photos — Jason’s photo library" windowBarIcon="photosIcon"
    closeWindow={props.onClose} onInteract={props.onInteract} minimizeWindow={props.onMinimize}
    bottomLeftText={`${photos.length} photos · JasonOS`}
  ><PhotoLibrary /></Window>;
}

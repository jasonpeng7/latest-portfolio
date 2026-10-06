import React from 'react';

export default function LoadingScreen({ progress = 0, ready = false, onStart }) {
  const percent = ready ? 100 : Math.floor(Math.max(0, Math.min(0.99, progress)) * 100);
  return React.createElement('section', { className: 'portfolio-preload', 'aria-labelledby': 'portfolio-start-title' },
    React.createElement('div', { className: 'portfolio-start-card' },
      React.createElement('h1', { id: 'portfolio-start-title' }, 'Jason Peng Portfolio Showcase'),
      React.createElement('p', { className: 'portfolio-start-instruction' }, 'Click start to begin'),
      React.createElement('div', { className: 'portfolio-load-status' },
        React.createElement('span', { 'aria-live': 'polite' }, ready ? 'Ready to explore' : 'Loading portfolio…'),
        React.createElement('span', { 'aria-hidden': true }, `${percent}%`)),
      React.createElement('div', { className: 'portfolio-progress-track', role: 'progressbar', 'aria-label': 'Portfolio loading progress', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': percent },
        React.createElement('div', { className: 'portfolio-progress-fill', style: { width: `${percent}%` } })),
      React.createElement('button', { type: 'button', className: 'portfolio-start-button', disabled: !ready, onClick: ready ? onStart : undefined }, 'START'),
      React.createElement('p', { className: 'portfolio-mobile-note' }, 'Best viewed on a desktop or laptop.'),
      React.createElement('a', { className: 'portfolio-start-fallback', href: '/desktop' }, 'Open 2D portfolio ↗')));
}

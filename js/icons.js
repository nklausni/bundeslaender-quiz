// Strich-Icons (24er Raster)
const PFADE = {
  star: '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  flame: '<path d="M12 3c.8 3.2 5 5.4 5 10a5 5 0 0 1-10 0c0-2.3 1.1-3.9 2.3-5 .2 1.7.9 2.8 2 3.3-.3-3 .1-5.8.7-8.3z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M7 7l10 10M17 7L7 17"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  castle: '<path d="M4 20h16M5.5 20V9.5h3V7h2v2.5h3V7h2v2.5h3V20M10 20v-4a2 2 0 0 1 4 0v4"/>',
  waves: '<path d="M3 8.5c2 0 2.2-1.6 4.5-1.6S9.8 8.5 12 8.5s2.3-1.6 4.5-1.6S19 8.5 21 8.5M3 13c2 0 2.2-1.6 4.5-1.6S9.8 13 12 13s2.3-1.6 4.5-1.6S19 13 21 13M3 17.5c2 0 2.2-1.6 4.5-1.6s2.3 1.6 4.5 1.6 2.3-1.6 4.5-1.6 2.5 1.6 4.5 1.6"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5.2a3 3 0 0 0 3.2 4M16 6h2.8a3 3 0 0 1-3.2 4M12 13v4M8.5 20h7M10 17h4v3h-4z"/>',
  bulb: '<path d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  replay: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/><circle cx="12" cy="12" r="6.6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
};

export function icon(name, size = 22, { fill = "none", sw = 2.2, klasse = "" } = {}) {
  return `<svg class="icon ${klasse}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PFADE[name]}</svg>`;
}

export const stern = (an, size = 18, klasse = "") =>
  an
    ? `<span style="color:var(--gold-dunkel)">${icon("star", size, { fill: "var(--gold)", sw: 1.6, klasse })}</span>`
    : `<span style="color:var(--linie-2)">${icon("star", size, { sw: 1.8, klasse })}</span>`;

export const sterne = (n, size = 15) => `<div class="sterne" aria-label="${n} von 3 Sternen">${[0, 1, 2].map((i) => stern(i < n, size)).join("")}</div>`;

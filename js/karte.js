// SVG-Deutschlandkarte: Zeichnen, Beschriften und Antippen.
import { KARTE } from "./karte-daten.js";
import { LAENDER } from "./daten.js";

// Bremen, Hamburg und Berlin sind auf dem iPhone SE nur wenige Pixel groß.
// Deshalb bekommen sie einen unsichtbaren Tippkreis um ihre Stadt.
const STADTSTAATEN = [["hb", "bremen"], ["hh", "hamburg"], ["be", "berlin"]];
const TIPP_RADIUS_PX = 20;

/**
 * @param {object} o
 * @param {Record<string,string>} [o.farben]    Land -> Füllfarbe (z. B. Buntstift beim Ausmalen)
 * @param {Record<string,string>} [o.zustand]   Land -> "mark" | "richtig" | "falsch" | "leise"
 * @param {boolean} [o.alleFluesse]             alle Flüsse dezent zeigen
 * @param {{id:string, art:"haupt"|"neben"}[]} [o.fluesse]
 * @param {{stadt:string, art:"punkt"|"mark", text?:string}[]} [o.staedte]
 * @param {{stadt:string, art:"tipp"|"mark"}[]} [o.ringe]
 * @param {string} [o.hinweis]                  Land, um das ein großer Hinweiskreis gezeichnet wird
 * @param {{x:number, y:number, text:string}[]} [o.texte]
 */
export function karteSvg(o = {}) {
  const { farben = {}, zustand = {}, fluesse = [], staedte = [], ringe = [], texte = [] } = o;
  let s = `<svg class="karte" viewBox="0 0 ${KARTE.breite} ${KARTE.hoehe}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Deutschlandkarte">`;

  s += `<g class="laender">`;
  for (const l of LAENDER) {
    const z = zustand[l.id] ? ` ist-${zustand[l.id]}` : "";
    const f = farben[l.id] ? ` style="fill:${farben[l.id]}"` : "";
    s += `<path class="land${z}" data-land="${l.id}" d="${KARTE.laender[l.id].d}"${f} vector-effect="non-scaling-stroke"></path>`;
  }
  s += `</g>`;

  if (o.alleFluesse) {
    s += `<g class="fluesse-dezent">`;
    for (const id in KARTE.fluesse) s += `<path d="${KARTE.fluesse[id].d}" vector-effect="non-scaling-stroke"></path>`;
    s += `</g>`;
  }
  for (const f of fluesse) {
    const d = KARTE.fluesse[f.id].d;
    s += `<path class="fluss-rand fluss-${f.art}" d="${d}" vector-effect="non-scaling-stroke"></path>`;
    s += `<path class="fluss fluss-${f.art}" d="${d}" vector-effect="non-scaling-stroke"></path>`;
  }

  if (o.hinweis) {
    const [x0, y0, x1, y1] = KARTE.laender[o.hinweis].box;
    // Mittelpunkt leicht verschoben, damit der Kreis nicht direkt auf das Land zeigt
    const cx = (x0 + x1) / 2 + (x1 - x0) * 0.18, cy = (y0 + y1) / 2 - (y1 - y0) * 0.12;
    const r = Math.max(x1 - x0, y1 - y0) * 0.95 + 40;
    s += `<circle class="hinweis-kreis" cx="${cx}" cy="${cy}" r="${r}" vector-effect="non-scaling-stroke"></circle>`;
  }

  for (const r of ringe) {
    const [x, y] = KARTE.staedte[r.stadt];
    s += `<circle class="ring ring-${r.art}" cx="${x}" cy="${y}" data-r="${r.art === "tipp" ? 15 : 13}" r="10" vector-effect="non-scaling-stroke"></circle>`;
  }
  for (const st of staedte) {
    const [x, y] = KARTE.staedte[st.stadt];
    s += `<circle class="stadt stadt-${st.art}" cx="${x}" cy="${y}" data-r="${st.art === "mark" ? 6 : 3.5}" r="4" vector-effect="non-scaling-stroke"></circle>`;
    if (st.text) texte.push({ x, y, text: st.text, stadt: true });
  }
  for (const t of texte) {
    s += `<text class="beschriftung" data-x="${t.x}" data-y="${t.y}" data-dx="${t.stadt ? 9 : 0}" data-dy="${t.stadt ? -9 : 0}" data-fs="15" x="${t.x}" y="${t.y}"${t.stadt ? "" : ` text-anchor="middle"`}>${t.text}</text>`;
  }
  return s + `</svg>`;
}

// Radien und Schriftgrößen in Bildschirm-Pixeln halten, egal wie groß die Karte gerade ist.
export function skaliere(root = document) {
  for (const svg of root.querySelectorAll("svg.karte")) {
    const m = svg.getScreenCTM();
    if (!m || !m.a) continue;
    const s = m.a;
    for (const el of svg.querySelectorAll("[data-r]")) el.setAttribute("r", el.dataset.r / s);
    for (const el of svg.querySelectorAll("text[data-fs]")) {
      el.setAttribute("font-size", el.dataset.fs / s);
      el.setAttribute("x", Number(el.dataset.x) + el.dataset.dx / s);
      el.setAttribute("y", Number(el.dataset.y) + el.dataset.dy / s);
    }
  }
}

// Welche Länder kommen für einen Tipp in Frage? Zuerst der Tippkreis eines Stadtstaats,
// dann das Land direkt unter dem Finger. Nahe Berlin können das zwei verschiedene sein.
export function laenderBeiTipp(svg, clientX, clientY) {
  const treffer = [];
  const m = svg.getScreenCTM();
  if (m) {
    let bestes = null, abstand = TIPP_RADIUS_PX;
    for (const [land, stadt] of STADTSTAATEN) {
      const [x, y] = KARTE.staedte[stadt];
      const p = new DOMPoint(x, y).matrixTransform(m);
      const d = Math.hypot(p.x - clientX, p.y - clientY);
      if (d < abstand) { bestes = land; abstand = d; }
    }
    if (bestes) treffer.push(bestes);
  }
  const direkt = document.elementFromPoint(clientX, clientY)?.closest?.("[data-land]")?.dataset.land;
  if (direkt && !treffer.includes(direkt)) treffer.push(direkt);
  return treffer;
}

export const landBeiTipp = (svg, clientX, clientY) => laenderBeiTipp(svg, clientX, clientY)[0] ?? null;

export const STADTSTAAT_RINGE = STADTSTAATEN.map(([, stadt]) => ({ stadt, art: "tipp" }));
export const STADT_VON_STADTSTAAT = Object.fromEntries(STADTSTAATEN);

// Fortschritt wird nur lokal im Browser gespeichert (localStorage), nichts verlässt das Gerät.
import { LAENDER, RAENGE } from "./daten.js";

// Der Schlüssel bleibt "…-v1", auch wenn das Datenformat wächst: So findet jede neue Version
// den bisherigen Fortschritt. Neue Felder werden beim Laden nur ergänzt, nie ersetzt.
const SCHLUESSEL = "bundeslaender-quiz-v1";
const SICHERUNG = "bundeslaender-quiz-sicherung";
const SCHEMA = 2; // 1 = Grundspiel, 2 = mit Expertenmodus
export const MAX_BOX = 4;   // Lernkarteien-Fach: 0 = neu, 4 = sitzt sicher
export const GEKONNT = 2;   // ab diesem Fach zählt ein Fakt als gekonnt

const leer = () => ({
  schema: SCHEMA,
  name: "",
  punkte: 0,
  serie: { tage: 0, letzterTag: null, beste: 0 },
  sterne: {},    // Mission -> beste Sternezahl
  fakten: {},    // "lage:he" bzw. "profi:stadt:he" -> { box, richtig, falsch, zuletzt }
  stempel: [],   // Länder, die schon einmal komplett gekonnt waren (bleiben für immer bunt)
  ton: true,
  // ab Schema 2
  goldStempel: [],  // Länder, die im Expertenmodus komplett geschrieben wurden
  abzeichen: {},    // Abzeichen-ID -> Zeitpunkt, an dem es verdient wurde
  profi: { sterne: {}, vorgestellt: false, folgeFehlerfrei: 0, besteFolge: 0 },
});

// Altes Format -> aktuelles Format. Vorhandene Werte gewinnen immer gegen die Vorgaben.
export function migriere(alt) {
  const basis = leer();
  return {
    ...basis,
    ...alt,
    serie: { ...basis.serie, beste: alt.serie?.tage ?? 0, ...alt.serie },
    profi: { ...basis.profi, ...alt.profi },
    schema: SCHEMA,
  };
}

let stand = laden();

function laden() {
  let roh = null;
  try {
    roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return leer();
    const alt = JSON.parse(roh);
    // Vor dem ersten Umbau eine unveränderte Kopie ablegen, falls doch etwas schiefgeht
    if ((alt.schema ?? 1) < SCHEMA && !localStorage.getItem(SICHERUNG)) localStorage.setItem(SICHERUNG, roh);
    return migriere(alt);
  } catch {
    // Unlesbare Daten nicht einfach überschreiben: zur Sicherung legen, dann neu anfangen
    try { if (roh) localStorage.setItem(`${SICHERUNG}-defekt`, roh); } catch { /* nichts zu retten */ }
    return leer();
  }
}

function sichern() {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
  } catch {
    // privater Modus o. Ä.: Spiel läuft weiter, merkt sich aber nichts
  }
}

export const get = () => stand;

export function setze(teil) {
  Object.assign(stand, teil);
  sichern();
}

export function zuruecksetzen() {
  const { name, ton } = stand;
  stand = { ...leer(), name, ton, profi: { ...leer().profi, vorgestellt: stand.profi.vorgestellt } };
  sichern();
}

export const faktStat = (id) => stand.fakten[id] ?? { box: 0, richtig: 0, falsch: 0, zuletzt: 0 };

export function merkeAntwort(faktId, richtig) {
  const s = { ...faktStat(faktId) };
  if (richtig) { s.box = Math.min(MAX_BOX, s.box + 1); s.richtig++; }
  else { s.box = Math.max(0, s.box - 1); s.falsch++; }
  s.zuletzt = Date.now();
  stand.fakten[faktId] = s;
  sichern();
}

export const gekonnt = (faktId) => faktStat(faktId).box >= GEKONNT;

// Die drei Punkte im Sammelalbum: Lage, Hauptstadt, Flüsse
export function landStatus(land) {
  return {
    lage: gekonnt(`lage:${land.id}`),
    hauptstadt: gekonnt(`hauptstadt:${land.id}`),
    fluesse: land.fluesse.length ? gekonnt(`fluesse:${land.id}`) : null,
  };
}

export function landKomplett(land) {
  const s = landStatus(land);
  return s.lage && s.hauptstadt && s.fluesse !== false;
}

// Neue Stempel vergeben und zurückgeben
export function neueStempel() {
  const neu = LAENDER.filter((l) => !stand.stempel.includes(l.id) && landKomplett(l)).map((l) => l.id);
  if (neu.length) { stand.stempel = [...stand.stempel, ...neu]; sichern(); }
  return neu;
}

// ---------- Expertenmodus
export const profiFrei = (s = stand) => s.stempel.length >= 8 || s.punkte >= 600;

// Goldstempel: Namen geschrieben, Hauptstadt geschrieben, alle Flüsse einmal komplett gesammelt
export function landGoldStatus(land) {
  return {
    land: gekonnt(`profi:land:${land.id}`),
    stadt: gekonnt(`profi:stadt:${land.id}`),
    fluesse: land.fluesse.length ? faktStat(`profi:sammler:${land.id}`).box >= 1 : null,
  };
}

export function landGold(land) {
  const s = landGoldStatus(land);
  return s.land && s.stadt && s.fluesse !== false;
}

export function neueGoldStempel() {
  const neu = LAENDER.filter((l) => !stand.goldStempel.includes(l.id) && landGold(l)).map((l) => l.id);
  if (neu.length) { stand.goldStempel = [...stand.goldStempel, ...neu]; sichern(); }
  return neu;
}

// Für das Rechtschreib-Ass: Antworten ohne jeden Schreibfehler hintereinander
export function merkeSchreibweise(perfekt) {
  const p = stand.profi;
  p.folgeFehlerfrei = perfekt ? p.folgeFehlerfrei + 1 : 0;
  p.besteFolge = Math.max(p.besteFolge, p.folgeFehlerfrei);
  sichern();
}

const tagText = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Nach jeder gespielten Runde: Tage in Folge fortschreiben
export function spieltagZaehlen() {
  const heute = tagText(new Date());
  const gestern = tagText(new Date(Date.now() - 864e5));
  const { letzterTag, tage } = stand.serie;
  if (letzterTag === heute) return;
  const neu = letzterTag === gestern ? tage + 1 : 1;
  stand.serie = { tage: neu, letzterTag: heute, beste: Math.max(stand.serie.beste ?? 0, neu) };
  sichern();
}

// Serie anzeigen: nur gültig, wenn heute oder gestern gespielt wurde
export function aktuelleSerie() {
  const { letzterTag, tage } = stand.serie;
  const heute = tagText(new Date());
  const gestern = tagText(new Date(Date.now() - 864e5));
  return letzterTag === heute || letzterTag === gestern ? tage : 0;
}

export function rang(punkte = stand.punkte) {
  let i = 0;
  while (i + 1 < RAENGE.length && punkte >= RAENGE[i + 1].ab) i++;
  const naechster = RAENGE[i + 1] ?? null;
  const anteil = naechster ? (punkte - RAENGE[i].ab) / (naechster.ab - RAENGE[i].ab) : 1;
  return { name: RAENGE[i].name, naechster, fehlt: naechster ? naechster.ab - punkte : 0, anteil };
}

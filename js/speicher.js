// Fortschritt wird nur lokal im Browser gespeichert (localStorage), nichts verlässt das Gerät.
import { LAENDER, RAENGE } from "./daten.js";

const SCHLUESSEL = "bundeslaender-quiz-v1";
export const MAX_BOX = 4;   // Lernkarteien-Fach: 0 = neu, 4 = sitzt sicher
export const GEKONNT = 2;   // ab diesem Fach zählt ein Fakt als gekonnt

const leer = () => ({
  name: "",
  punkte: 0,
  serie: { tage: 0, letzterTag: null },
  sterne: {},    // Mission -> beste Sternezahl
  fakten: {},    // "lage:he" -> { box, richtig, falsch, zuletzt }
  stempel: [],   // Länder, die schon einmal komplett gekonnt waren (bleiben für immer bunt)
  ton: true,
});

let stand = laden();

function laden() {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    return roh ? { ...leer(), ...JSON.parse(roh) } : leer();
  } catch {
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
  stand = { ...leer(), name, ton };
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

const tagText = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Nach jeder gespielten Runde: Tage in Folge fortschreiben
export function spieltagZaehlen() {
  const heute = tagText(new Date());
  const gestern = tagText(new Date(Date.now() - 864e5));
  const { letzterTag, tage } = stand.serie;
  if (letzterTag === heute) return;
  stand.serie = { tage: letzterTag === gestern ? tage + 1 : 1, letzterTag: heute };
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

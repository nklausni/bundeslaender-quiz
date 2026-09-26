// Expertenmodus: Namen selbst schreiben statt auswählen.
import { LAENDER, LAND, FLUESSE, mitArtikel, landName, vonLand } from "./daten.js";
import { KARTE } from "./karte-daten.js";
import { STADT_VON_STADTSTAAT } from "./karte.js";
import { ziehe, mischen, flussText, anDem } from "./quiz.js";

export const PROFI_MISSIONEN = {
  "profi-laender": { titel: "Länder schreiben", untertitel: "Markiertes Land benennen", icon: "pin", ton: "koralle", anzahl: 10 },
  "profi-staedte": { titel: "Hauptstädte schreiben", untertitel: "16 Städte ohne Auswahl", icon: "castle", ton: "lila", anzahl: 10 },
  "profi-fluesse": { titel: "Flüsse schreiben", untertitel: `${Object.keys(FLUESSE).length} Flüsse ohne Auswahl`, icon: "waves", ton: "blau", anzahl: 10 },
  "profi-sammler": { titel: "Flüsse-Sammler", untertitel: "Alle Flüsse eines Landes", icon: "target", ton: "gruen", anzahl: 5 },
  "profi-pruefung": { titel: "Profi-Prüfung", untertitel: "Alles gemischt", icon: "crown", ton: "gold", anzahl: 10 },
};

export const PUNKTE = { perfekt: 20, schreibweise: 15, mitTipp: 10, wiederholung: 5, flussGefunden: 10, alleGefunden: 20, runde: 20 };

const FAKTEN = {
  land: LAENDER.map((l) => `profi:land:${l.id}`),
  stadt: LAENDER.map((l) => `profi:stadt:${l.id}`),
  fluss: Object.keys(FLUESSE).map((f) => `profi:fluss:${f}`),
  sammler: LAENDER.filter((l) => l.fluesse.length).map((l) => `profi:sammler:${l.id}`),
};

export function neueProfiRunde(mission) {
  const m = PROFI_MISSIONEN[mission];
  const fakten = {
    "profi-laender": () => ziehe(FAKTEN.land, m.anzahl),
    "profi-staedte": () => ziehe(FAKTEN.stadt, m.anzahl),
    "profi-fluesse": () => ziehe(FAKTEN.fluss, m.anzahl),
    "profi-sammler": () => ziehe(FAKTEN.sammler, m.anzahl),
    "profi-pruefung": () => mischen([...ziehe(FAKTEN.land, 3), ...ziehe(FAKTEN.stadt, 3), ...ziehe(FAKTEN.fluss, 3), ...ziehe(FAKTEN.sammler, 1)]),
  }[mission]();
  return fakten.map(profiFrage);
}

export function profiFrage(fakt) {
  const [, art, id] = fakt.split(":");
  if (art === "land") return landSchreiben(id, fakt);
  if (art === "stadt") return stadtSchreiben(id, fakt);
  if (art === "fluss") return flussSchreiben(id, fakt);
  return sammler(id, fakt);
}

// ---------- Fragetypen
const markRing = (id) => (STADT_VON_STADTSTAAT[id] ? [{ stadt: STADT_VON_STADTSTAAT[id], art: "mark" }] : []);
const label = (id) => { const [x, y] = KARTE.laender[id].label; return { x, y, text: LAND[id].name }; };

function landSchreiben(id, fakt) {
  const l = LAND[id];
  return {
    typ: "text", fakt, kategorie: "land", ziel: id, richtig: l.name, icon: "pin", ton: "koralle",
    klein: "Schreib den Namen:", gross: "Welches Bundesland ist das?", platzhalter: "Bundesland …",
    karte: { zustand: { [id]: "mark" }, ringe: markRing(id) },
    loesung: () => ({ karte: { zustand: { [id]: "richtig" }, ringe: markRing(id), texte: [label(id)] }, text: l.fakt }),
  };
}

function stadtSchreiben(id, fakt) {
  const l = LAND[id];
  const nachLand = Math.random() < 0.5;
  const erklaerung = l.hauptstadt === l.name
    ? `${l.name} ist ein Stadtstaat: Stadt und Bundesland heißen gleich.`
    : `${l.hauptstadt} ist die Hauptstadt ${vonLand(l)}.${l.stadtFluss ? ` Sie liegt ${anDem(l.stadtFluss)}.` : ""}`;
  return {
    typ: "text", fakt, kategorie: "stadt", ziel: id, richtig: l.hauptstadt, icon: "castle", ton: "lila",
    klein: nachLand ? `Schreib die Hauptstadt ${l.artikel ? "vom" : "von"}` : "Schreib den Namen:",
    gross: nachLand ? l.name : "Welche Hauptstadt liegt hier?",
    platzhalter: "Hauptstadt …",
    // Mainz/Wiesbaden und Berlin/Potsdam liegen so dicht beieinander, dass der Punkt allein nicht reicht
    karte: nachLand
      ? { zustand: { [id]: "mark" }, ringe: markRing(id) }
      : { zustand: { [id]: "mark" }, staedte: [{ stadt: l.stadt, art: "mark" }] },
    loesung: () => ({ karte: { zustand: { [id]: "mark" }, staedte: [{ stadt: l.stadt, art: "mark", text: l.hauptstadt }] }, text: erklaerung }),
  };
}

function flussSchreiben(fid, fakt) {
  return {
    typ: "text", fakt, kategorie: "fluss", ziel: fid, richtig: FLUESSE[fid].name, icon: "waves", ton: "blau",
    klein: "Schreib den Namen:", gross: "Wie heißt dieser Fluss?", platzhalter: "Fluss …",
    karte: { alleFluesse: true, fluesse: [{ id: fid, art: "haupt" }] },
    loesung: () => ({ karte: { alleFluesse: true, fluesse: [{ id: fid, art: "haupt" }] }, text: flussText(fid) }),
  };
}

function sammler(id, fakt) {
  const l = LAND[id];
  return {
    typ: "sammler", fakt, land: id, ziel: l.fluesse.slice(), icon: "target", ton: "gruen",
    klein: `Nenne alle Flüsse ${l.artikel ? "vom" : "von"}`, gross: l.name, platzhalter: "Nächster Fluss …",
    karte: (gefunden, fehlend = []) => ({
      zustand: { [id]: "mark" }, ringe: markRing(id),
      fluesse: [...fehlend.map((f) => ({ id: f, art: "neben" })), ...gefunden.map((f) => ({ id: f, art: "haupt" }))],
    }),
  };
}

// ---------- Antworten prüfen
// Vergleichsform: klein, Umlaute ausgeschrieben, nur Buchstaben ("Baden-Württemberg" -> "badenwuerttemberg")
export const normal = (s) => ohneArtikel(s).toLowerCase()
  .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .replace(/[^a-z]/g, "");
// "das Saarland" oder "die Elbe" zählt wie "Saarland" und "Elbe"
const ohneArtikel = (s) => String(s).trim().replace(/^(der|die|das)\s+/i, "");
// "Perfekt" heißt: dieselben Buchstaben samt Umlauten und Bindestrich, nur Groß/klein ist egal
const perfektGleich = (eingabe, name) => ohneArtikel(eingabe).replace(/\s+/g, " ").toLocaleLowerCase("de") === name.toLocaleLowerCase("de");

export function abstand(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let links = i - 1;
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const oben = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, links + (a[i - 1] === b[j - 1] ? 0 : 1));
      links = oben;
    }
  }
  return d[b.length];
}

// Wie viele Tippfehler sind erlaubt? Kurze Namen (Inn, Main, Kiel) müssen stimmen.
const erlaubt = (n) => (n <= 4 ? 0 : n <= 7 ? 1 : 2);

const KATALOG = {
  land: LAENDER.map((l) => ({ kat: "land", id: l.id, name: l.name })),
  stadt: LAENDER.map((l) => ({ kat: "stadt", id: l.id, name: l.hauptstadt })),
  fluss: Object.entries(FLUESSE).map(([id, f]) => ({ kat: "fluss", id, name: f.name })),
};
const ALLE = [...KATALOG.land, ...KATALOG.stadt, ...KATALOG.fluss];

/**
 * @returns {{art: "leer"|"perfekt"|"schreibweise"|"falsch", anderes?: {kat:string,id:string,name:string}}}
 */
export function pruefe(eingabe, kategorie, zielId) {
  const ziel = KATALOG[kategorie].find((x) => x.id === zielId);
  const e = normal(eingabe);
  if (!e) return { art: "leer" };
  if (perfektGleich(eingabe, ziel.name)) return { art: "perfekt" };
  const z = normal(ziel.name);
  if (e === z) return { art: "schreibweise" };

  // Ein anderer echter Name ist falsch, auch wenn er nur einen Buchstaben entfernt ist (Main / Mainz)
  const exakt = ALLE.filter((x) => normal(x.name) === e).sort((a, b) => (b.kat === kategorie) - (a.kat === kategorie))[0];
  if (exakt) return { art: "falsch", anderes: exakt };

  const d = abstand(e, z);
  if (d <= erlaubt(z.length) && !KATALOG[kategorie].some((x) => x.id !== zielId && abstand(e, normal(x.name)) < d)) {
    return { art: "schreibweise" };
  }
  return { art: "falsch" };
}

/**
 * Flüsse-Sammler: Welcher Fluss wurde gemeint und passt er zum Land?
 * @returns {{art: "leer"|"neu"|"doppelt"|"grenz"|"nicht-hier"|"unbekannt", fluss?: string, perfekt?: boolean, anderes?: object}}
 */
export function pruefeSammler(eingabe, landId, gefunden) {
  const e = normal(eingabe);
  if (!e) return { art: "leer" };
  let bester = null, bd = Infinity;
  for (const x of KATALOG.fluss) {
    const d = abstand(e, normal(x.name));
    if (d < bd) { bd = d; bester = x; }
  }
  if (bd > erlaubt(normal(bester.name).length)) {
    return { art: "unbekannt", anderes: ALLE.find((x) => normal(x.name) === e) ?? null };
  }
  const l = LAND[landId];
  const fluss = bester.id;
  if (gefunden.includes(fluss)) return { art: "doppelt", fluss };
  if (l.fluesse.includes(fluss)) return { art: "neu", fluss, perfekt: perfektGleich(eingabe, bester.name) };
  if (l.grenz.includes(fluss)) return { art: "grenz", fluss };
  return { art: "nicht-hier", fluss };
}

// Freundliche Erklärung, wenn ein anderer echter Name getippt wurde
export function anderesText(anderes, frage) {
  if (!anderes) return "";
  const gesucht = { land: "ein Bundesland", stadt: "eine Hauptstadt", fluss: "ein Fluss" }[frage.kategorie];
  if (anderes.kat === "stadt") return `${anderes.name} ist die Hauptstadt ${vonLand(LAND[anderes.id])}.`;
  if (anderes.kat === "land") return anderes.kat === frage.kategorie ? `${anderes.name} ist ein anderes Bundesland.` : `${anderes.name} ist ein Bundesland. Gesucht ist ${gesucht}.`;
  return anderes.kat === frage.kategorie ? `Das ist nicht ${mitArtikel(anderes.id)}.` : `${mitArtikel(anderes.id, true)} ist ein Fluss. Gesucht ist ${gesucht}.`;
}

// ---------- Hilfen
// Tipp: erster Buchstabe und die Länge ("S _ _ _ _ _ _ _")
export function muster(name) {
  const zeichen = [...name].map((c, i) => (i === 0 ? c : /[A-Za-zÄÖÜäöüß]/.test(c) ? "_" : c));
  const anzahl = [...name].filter((c) => /[A-Za-zÄÖÜäöüß]/.test(c)).length;
  return { text: zeichen.join(" "), anzahl };
}

// Richtige Schreibweise, Buchstaben, die in der Eingabe fehlten oder anders waren, markiert
export function markiere(eingabe, richtig) {
  const a = [...eingabe.trim().toLocaleLowerCase("de")], b = [...richtig];
  const bl = b.map((c) => c.toLocaleLowerCase("de"));
  const t = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
    t[i][j] = a[i] === bl[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  }
  const treffer = new Set();
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === bl[j]) { treffer.add(j); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) i++;
    else j++;
  }
  const esc = (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c;
  return b.map((c, j) => (treffer.has(j) ? esc(c) : `<mark>${esc(c)}</mark>`)).join("");
}

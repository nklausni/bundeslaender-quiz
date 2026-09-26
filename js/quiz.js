// Fragen erzeugen: welche Fakten dran sind, welcher Fragetyp, welche falschen Antworten.
import { LAENDER, LAND, FLUESSE, mitArtikel, laenderMitFluss, landName, vonLand } from "./daten.js";
import { KARTE } from "./karte-daten.js";
import { faktStat, MAX_BOX } from "./speicher.js";
import { STADTSTAAT_RINGE, STADT_VON_STADTSTAAT } from "./karte.js";

export const MISSIONEN = {
  lage: { titel: "Wo liegt das?", untertitel: "Karte antippen", icon: "pin", ton: "koralle", anzahl: 10 },
  hauptstadt: { titel: "Hauptstädte", untertitel: "16 Städte", icon: "castle", ton: "lila", anzahl: 10 },
  fluesse: { titel: "Flüsse", untertitel: `${Object.keys(FLUESSE).length} Flüsse`, icon: "waves", ton: "blau", anzahl: 10 },
  pruefung: { titel: "Große Prüfung", untertitel: "Alles gemischt", icon: "trophy", ton: "gold", anzahl: 12 },
};

const FAKTEN = {
  lage: LAENDER.map((l) => `lage:${l.id}`),
  hauptstadt: LAENDER.map((l) => `hauptstadt:${l.id}`),
  fluesse: [
    ...LAENDER.filter((l) => l.fluesse.length).map((l) => `fluesse:${l.id}`),
    ...Object.keys(FLUESSE).map((f) => `fluss:${f}`),
  ],
};

/**
 * Wie dringend soll ein Fakt in der nächsten Runde drankommen?
 * Größeres Gewicht = wird häufiger gezogen. Rückgabe muss > 0 sein.
 *
 * @param {{box:number, richtig:number, falsch:number, zuletzt:number}} stat
 *   box:     Lernkartei-Fach 0 (neu/unsicher) bis 4 (sitzt sicher)
 *   richtig: wie oft insgesamt richtig beantwortet
 *   falsch:  wie oft insgesamt falsch beantwortet
 *   zuletzt: Zeitstempel (ms) der letzten Antwort, 0 = noch nie gefragt
 * @param {number} jetzt  Date.now()
 */
export function gewicht(stat, jetzt) {
  // Unsichere Fakten deutlich öfter: Fach 0 → 16, 1 → 8, 2 → 4, 3 → 2, 4 → 1
  let w = 2 ** (MAX_BOX - stat.box);
  if (!stat.zuletzt) return w; // noch nie gefragt: zählt wie Fach 0

  // Lange nicht gefragt: alle 3 Tage +100 %, höchstens ×3, damit Gekonntes nicht in Vergessenheit gerät
  const tage = (jetzt - stat.zuletzt) / 864e5;
  w *= 1 + Math.min(2, tage / 3);

  // Echte Stolpersteine (z. B. Mainz und Wiesbaden) leicht bevorzugen
  const versuche = stat.richtig + stat.falsch;
  if (versuche >= 2) w *= 1 + stat.falsch / versuche;

  // Gerade erst dran gewesen: zurückhalten, damit "Nochmal spielen" nicht dieselben Fragen bringt
  if (jetzt - stat.zuletzt < 2 * 60 * 1000) w *= 0.3;
  return w;
}

export function ziehe(fakten, anzahl) {
  const jetzt = Date.now();
  const pool = fakten.map((id) => ({ id, w: Math.max(0.01, gewicht(faktStat(id), jetzt) || 0.01) }));
  const gezogen = [];
  while (gezogen.length < anzahl && pool.length) {
    let r = Math.random() * pool.reduce((a, b) => a + b.w, 0);
    let i = 0;
    while (i < pool.length - 1 && r > pool[i].w) { r -= pool[i].w; i++; }
    gezogen.push(pool.splice(i, 1)[0].id);
  }
  return gezogen;
}

export function neueRunde(mission) {
  const m = MISSIONEN[mission];
  const fakten = mission === "pruefung"
    ? mischen([...ziehe(FAKTEN.lage, 4), ...ziehe(FAKTEN.hauptstadt, 4), ...ziehe(FAKTEN.fluesse, 4)])
    : ziehe(FAKTEN[mission], m.anzahl);
  return fakten.map(frageZuFakt);
}

// ---------- Hilfen
export const mischen = (a) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const zufall = (a) => a[Math.floor(Math.random() * a.length)];
const liste = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} und ${a[a.length - 1]}`);
export const anDem = (flussId) => (FLUESSE[flussId].artikel === "der" ? `am ${FLUESSE[flussId].name}` : `an der ${FLUESSE[flussId].name}`);

const mitte = (id) => { const [x0, y0, x1, y1] = KARTE.laender[id].box; return [(x0 + x1) / 2, (y0 + y1) / 2]; };
const abstand = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Falsche Antworten: zwei aus der Nähe (schwieriger, lehrreicher) und eine zufällige.
function ablenker(richtig, kandidaten, pos, anzahl = 3) {
  const rest = kandidaten.filter((k) => k !== richtig);
  const nah = rest.slice().sort((a, b) => abstand(pos(a), pos(richtig)) - abstand(pos(b), pos(richtig)));
  const gewaehlt = mischen(nah.slice(0, 5)).slice(0, Math.min(2, anzahl));
  const uebrig = rest.filter((k) => !gewaehlt.includes(k));
  return [...gewaehlt, ...mischen(uebrig).slice(0, anzahl - gewaehlt.length)];
}

const optionen = (ids, textVon) => mischen(ids).map((id) => ({ id, text: textVon(id) }));
const markRing = (landId) => (STADT_VON_STADTSTAAT[landId] ? [{ stadt: STADT_VON_STADTSTAAT[landId], art: "mark" }] : []);

function frageZuFakt(fakt) {
  const [art, id] = fakt.split(":");
  if (art === "lage") return Math.random() < 0.65 ? lageTippen(id, fakt) : lageErkennen(id, fakt);
  if (art === "hauptstadt") return Math.random() < 0.6 ? hauptstadt(id, fakt) : hauptstadtRueck(id, fakt);
  if (art === "fluesse") return flussDurchLand(id, fakt);
  return Math.random() < 0.6 ? flussErkennen(id, fakt) : landZuFluss(id, fakt);
}
export const frageNochmal = (frage) => frageZuFakt(frage.fakt);

// ---------- Fragetypen
function lageTippen(id, fakt) {
  const l = LAND[id];
  return {
    typ: "tippen", fakt, icon: "pin", ton: "koralle",
    klein: "Tippe auf das Bundesland", gross: l.name,
    karte: { ringe: STADTSTAAT_RINGE },
    richtig: id,
    loesung(gewaehlt) {
      const gut = gewaehlt === id;
      const zustand = { [id]: "richtig" };
      const texte = [{ ...LABEL[id], text: l.name }];
      if (!gut && gewaehlt) { zustand[gewaehlt] = "falsch"; texte.push({ ...LABEL[gewaehlt], text: LAND[gewaehlt].name }); }
      return {
        karte: { zustand, texte, ringe: markRing(id) },
        titel: gut ? "Richtig!" : "Fast!",
        text: gut ? l.fakt : `Du hast ${landName(LAND[gewaehlt])} angetippt. ${landName(l, true)} ist grün markiert.`,
      };
    },
  };
}

function lageErkennen(id, fakt) {
  const l = LAND[id];
  const ids = [id, ...ablenker(id, LAENDER.map((x) => x.id), mitte)];
  return {
    typ: "wahl", fakt, icon: "pin", ton: "koralle",
    klein: "Schau auf die Karte:", gross: "Welches Bundesland ist das?",
    karte: { zustand: { [id]: "mark" }, ringe: markRing(id) },
    optionen: optionen(ids, (x) => LAND[x].name), richtig: id,
    loesung: (gewaehlt) => ({
      karte: { zustand: { [id]: "richtig" }, ringe: markRing(id), texte: [{ ...LABEL[id], text: l.name }] },
      titel: gewaehlt === id ? "Richtig!" : `Das ist ${landName(l)}.`,
      text: l.fakt,
    }),
  };
}

export function hauptstadtText(l) {
  if (l.hauptstadt === l.name) return `${l.name} ist ein Stadtstaat: Stadt und Bundesland haben denselben Namen.`;
  return l.stadtFluss ? `${l.hauptstadt} liegt ${anDem(l.stadtFluss)}.` : l.fakt;
}

function hauptstadt(id, fakt) {
  const l = LAND[id];
  const ids = [id, ...ablenker(id, LAENDER.map((x) => x.id), (x) => KARTE.staedte[LAND[x].stadt])];
  return {
    typ: "wahl", fakt, icon: "castle", ton: "lila",
    klein: `Was ist die Hauptstadt ${l.artikel ? "vom" : "von"}`, gross: `${l.name}?`,
    karte: { zustand: { [id]: "mark" }, ringe: markRing(id) },
    optionen: optionen(ids, (x) => LAND[x].hauptstadt), richtig: id,
    loesung: (gewaehlt) => ({
      karte: { zustand: { [id]: "mark" }, staedte: [{ stadt: l.stadt, art: "mark", text: l.hauptstadt }] },
      titel: gewaehlt === id ? "Richtig!" : `Es ist ${l.hauptstadt}.`,
      text: hauptstadtText(l),
    }),
  };
}

function hauptstadtRueck(id, fakt) {
  const l = LAND[id];
  const ids = [id, ...ablenker(id, LAENDER.map((x) => x.id), (x) => KARTE.staedte[LAND[x].stadt])];
  return {
    typ: "wahl", fakt, icon: "castle", ton: "lila",
    klein: "Von welchem Bundesland ist das die Hauptstadt?", gross: l.hauptstadt,
    karte: { staedte: [{ stadt: l.stadt, art: "mark" }] },
    optionen: optionen(ids, (x) => LAND[x].name), richtig: id,
    loesung: (gewaehlt) => ({
      karte: { zustand: { [id]: "richtig" }, staedte: [{ stadt: l.stadt, art: "mark", text: l.hauptstadt }] },
      titel: gewaehlt === id ? "Richtig!" : `Das ist ${landName(l)}.`,
      text: `${l.hauptstadt} ist die Hauptstadt ${vonLand(l)}. ${hauptstadtText(l) === l.fakt ? "" : hauptstadtText(l)}`.trim(),
    }),
  };
}

export function flussText(fid) {
  const laender = laenderMitFluss(fid).map((l) => landName(l));
  const staedte = LAENDER.filter((l) => l.stadtFluss === fid).map((l) => l.hauptstadt);
  let t = `${mitArtikel(fid, true)} fließt durch ${liste(laender)}.`;
  if (staedte.length) t += ` ${liste(staedte)} ${staedte.length > 1 ? "liegen" : "liegt"} ${anDem(fid)}.`;
  return t;
}

function flussErkennen(fid, fakt) {
  const pos = (x) => KARTE.fluesse[x].mitte;
  const ids = [fid, ...ablenker(fid, Object.keys(FLUESSE), pos)];
  return {
    typ: "wahl", fakt, icon: "waves", ton: "blau",
    klein: "Schau auf die Karte:", gross: "Wie heißt dieser Fluss?",
    karte: { alleFluesse: true, fluesse: [{ id: fid, art: "haupt" }] },
    optionen: optionen(ids, (x) => FLUESSE[x].name), richtig: fid,
    loesung: (gewaehlt) => ({
      karte: {
        alleFluesse: true, fluesse: [{ id: fid, art: "haupt" }],
        zustand: Object.fromEntries(laenderMitFluss(fid).map((l) => [l.id, "leise"])),
      },
      titel: gewaehlt === fid ? "Richtig!" : `Das ist ${mitArtikel(fid)}.`,
      text: flussText(fid),
    }),
  };
}

function flussDurchLand(id, fakt) {
  const l = LAND[id];
  const richtig = zufall(l.fluesse);
  const verboten = new Set([...l.fluesse, ...l.grenz]);
  const falsche = mischen(Object.keys(FLUESSE).filter((f) => !verboten.has(f))).slice(0, 3);
  return {
    typ: "wahl", fakt, icon: "waves", ton: "blau",
    klein: `Welcher dieser Flüsse fließt durch${l.artikel ? ` ${l.artikel}` : ""}`, gross: `${l.name}?`,
    karte: { zustand: { [id]: "mark" }, ringe: markRing(id) },
    optionen: optionen([richtig, ...falsche], (x) => FLUESSE[x].name), richtig,
    loesung: (gewaehlt) => ({
      karte: {
        zustand: { [id]: "mark" }, ringe: markRing(id),
        fluesse: [...l.fluesse.filter((f) => f !== richtig).map((f) => ({ id: f, art: "neben" })), { id: richtig, art: "haupt" }],
      },
      titel: gewaehlt === richtig ? "Richtig!" : `Es ist ${mitArtikel(richtig)}.`,
      text: l.fluesse.length > 1
        ? `Durch ${landName(l)} fließen ${liste(l.fluesse.map((f) => FLUESSE[f].name))}.`
        : `Durch ${landName(l)} fließt ${mitArtikel(richtig)}.`,
    }),
  };
}

function landZuFluss(fid, fakt) {
  const mitFluss = laenderMitFluss(fid).map((l) => l.id);
  const richtig = zufall(mitFluss);
  const falsche = mischen(LAENDER.filter((l) => !l.fluesse.includes(fid) && !l.grenz.includes(fid)).map((l) => l.id)).slice(0, 3);
  return {
    typ: "wahl", fakt, icon: "waves", ton: "blau",
    klein: "Durch welches Bundesland fließt", gross: `${mitArtikel(fid)}?`,
    karte: { fluesse: [{ id: fid, art: "haupt" }] },
    optionen: optionen([richtig, ...falsche], (x) => LAND[x].name), richtig,
    loesung: (gewaehlt) => ({
      karte: {
        fluesse: [{ id: fid, art: "haupt" }],
        zustand: Object.fromEntries(mitFluss.map((x) => [x, x === richtig ? "richtig" : "leise"])),
      },
      titel: gewaehlt === richtig ? "Richtig!" : `Richtig wäre ${landName(LAND[richtig])}.`,
      text: flussText(fid),
    }),
  };
}

// Beschriftungspunkte (Pol der Unzugänglichkeit) kommen aus den Kartendaten
const LABEL = Object.fromEntries(LAENDER.map((l) => {
  const [x, y] = KARTE.laender[l.id].label;
  return [l.id, { x, y }];
}));

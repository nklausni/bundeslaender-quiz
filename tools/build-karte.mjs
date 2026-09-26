// Erzeugt js/karte-daten.js aus freien Geodaten.
//
// Quellen (in <quellordner> ablegen, siehe README):
//   states.geojson          isellsoap/deutschlandGeoJSON, 2_bundeslaender/3_mittel.geo.json
//   rivers.geojson          Natural Earth ne_10m_rivers_lake_centerlines
//   rivers_eu.geojson       Natural Earth ne_10m_rivers_europe
//   osm_rivers.json         Overpass-Export (Havel, Leine, Lahn, Werra, Mulde, Saar), © OpenStreetMap
//
// Aufruf: node build-karte.mjs <quellordner> <ausgabedatei> [anteil]
import fs from "node:fs";
import { topology } from "topojson-server";
import { presimplify, simplify, quantile } from "topojson-simplify";
import { feature, mesh } from "topojson-client";

const [SRC, OUT, ANTEIL = "0.3"] = process.argv.slice(2);
const lies = (f) => JSON.parse(fs.readFileSync(`${SRC}/${f}`, "utf8"));

// Sinusoidal-Projektion um die Mitte Deutschlands: sieht aus wie gewohnte Schulkarten.
const LON0 = 10.45, LAT0 = 51.16, K = 100;
const projiziere = ([lon, lat]) => [
  (lon - LON0) * Math.cos((lat * Math.PI) / 180) * K,
  -(lat - LAT0) * K,
];

const LAENDER_IDS = {
  "Schleswig-Holstein": "sh", Hamburg: "hh", "Mecklenburg-Vorpommern": "mv", Bremen: "hb",
  Niedersachsen: "ni", "Sachsen-Anhalt": "st", Brandenburg: "bb", Berlin: "be",
  "Nordrhein-Westfalen": "nw", Hessen: "he", "Thüringen": "th", Sachsen: "sn",
  "Rheinland-Pfalz": "rp", Saarland: "sl", Bayern: "by", "Baden-Württemberg": "bw",
};

const STAEDTE = {
  kiel: [10.1228, 54.3233], hamburg: [9.9937, 53.5511], schwerin: [11.4012, 53.6355],
  bremen: [8.8017, 53.0793], hannover: [9.732, 52.3759], magdeburg: [11.6276, 52.1205],
  potsdam: [13.0645, 52.3906], berlin: [13.405, 52.52], duesseldorf: [6.7735, 51.2277],
  wiesbaden: [8.2398, 50.0782], erfurt: [11.0299, 50.9848], dresden: [13.7373, 51.0504],
  mainz: [8.2473, 49.9929], saarbruecken: [6.9969, 49.2402], muenchen: [11.582, 48.1351],
  stuttgart: [9.1829, 48.7758],
};

// ---------- Bundesländer: topologisch vereinfachen, damit Nachbargrenzen deckungsgleich bleiben
const states = lies("states.geojson");
for (const f of states.features) f.properties = { id: LAENDER_IDS[f.properties.name] };
let topo = topology({ laender: states }, 1e5);
topo = presimplify(topo);
topo = simplify(topo, quantile(topo, Number(ANTEIL))); // behält etwa diesen Anteil der Punkte
const laenderGeo = feature(topo, topo.objects.laender);
const aussengrenze = mesh(topo, topo.objects.laender, (a, b) => a === b);

// ---------- Flüsse sammeln
const FLUSS_QUELLEN = {
  elbe: { ne: ["Elbe"] }, havel: { osm: ["Havel"] }, oder: { ne: ["Oder"] },
  ems: { ne: ["Ems"] }, weser: { ne: ["Weser"] }, aller: { eu: ["Aller"] },
  leine: { osm: ["Leine"], box: [9.3, 51.3, 10.4, 52.9] }, lippe: { eu: ["Lippe"] },
  saale: { eu: ["Saale"] }, spree: { eu: ["Spree"] }, neisse: { eu: ["Lausitzer Neiße"] },
  rhein: { ne: ["Rhein", "Rhine", "Rhin"] }, fulda: { eu: ["Fulda"] },
  mulde: { osm: ["Mulde", "Vereinigte Mulde"], eu: ["Zwickauer Mulde"], box: [12.1, 50.5, 13.1, 51.9] },
  lahn: { osm: ["Lahn"], box: [7.5, 50.2, 8.9, 51.1] }, werra: { osm: ["Werra"], box: [9.5, 50.3, 11.1, 51.5] },
  mosel: { ne: ["Mosel", "Moselle"] }, main: { ne: ["Main"] }, neckar: { eu: ["Neckar"] },
  donau: { ne: ["Donau", "Danube"] }, isar: { eu: ["Isar"] }, inn: { ne: ["Inn"] },
  saar: { osm: ["Saar", "La Sarre / Saar"], box: [6.3, 48.5, 7.4, 49.8] }, // an der Grenze zweisprachig benannt
};

const imBereich = (lon, lat, box = [5.3, 47.0, 15.6, 55.3]) =>
  lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3];

function linienAus(geom) {
  if (geom.type === "LineString") return [geom.coordinates];
  if (geom.type === "MultiLineString") return geom.coordinates;
  return [];
}

const ne = lies("rivers.geojson"), eu = lies("rivers_eu.geojson"), osm = lies("osm_rivers.json");
const nameVon = (p) => [p.name, p.name_de, p.name_en].filter(Boolean);

function sammle(id) {
  const q = FLUSS_QUELLEN[id];
  const linien = [];
  const nimm = (coords) => {
    if (coords.some(([lon, lat]) => imBereich(lon, lat, q.box))) linien.push(coords);
  };
  for (const [quelle, namen] of [[ne, q.ne], [eu, q.eu]]) {
    if (!namen) continue;
    for (const f of quelle.features) {
      if (nameVon(f.properties).some((n) => namen.includes(n))) linienAus(f.geometry).forEach(nimm);
    }
  }
  for (const e of osm.elements) {
    if (q.osm?.includes(e.tags?.name) && e.geometry) nimm(e.geometry.map((p) => [p.lon, p.lat]));
  }
  return verbinde(linien);
}

// OSM liefert viele kurze Wegstücke: an gemeinsamen Endpunkten zu langen Linien zusammenfügen.
function verbinde(linien) {
  const key = ([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`;
  let offen = linien.map((l) => l.slice());
  let geaendert = true;
  while (geaendert) {
    geaendert = false;
    outer: for (let i = 0; i < offen.length; i++) {
      for (let j = 0; j < offen.length; j++) {
        if (i === j) continue;
        const a = offen[i], b = offen[j];
        if (key(a[a.length - 1]) === key(b[0])) { offen[i] = a.concat(b.slice(1)); }
        else if (key(a[a.length - 1]) === key(b[b.length - 1])) { offen[i] = a.concat(b.slice(0, -1).reverse()); }
        else continue;
        offen.splice(j, 1); geaendert = true; break outer;
      }
    }
  }
  return offen;
}

// Douglas-Peucker für Flusslinien (in projizierten Koordinaten)
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  let max = 0, idx = 0;
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return dp(pts.slice(0, idx + 1), tol).slice(0, -1).concat(dp(pts.slice(idx), tol));
}

// ---------- Flüsse auf Deutschland zuschneiden (plus schmaler Saum für Grenzflüsse wie Oder und Neiße)
const ringe = [];
for (const f of laenderGeo.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) ringe.push(p[0].map(projiziere));
}
const grenzSegmente = [];
for (const l of aussengrenze.coordinates) {
  const p = l.map(projiziere);
  for (let i = 1; i < p.length; i++) grenzSegmente.push([p[i - 1], p[i]]);
}
function imRing([x, y], r) {
  let drin = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
}
function abstandGrenze([x, y]) {
  let min = Infinity;
  for (const [[ax, ay], [bx, by]] of grenzSegmente) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    min = Math.min(min, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return min;
}
// Oberrhein und Saar sind stellenweise selbst Grenzfluss zu Frankreich (bzw. der Schweiz), deshalb dort ein breiterer Saum.
const SAUM = { rhein: 7, saar: 6 };
const inDeutschland = (p, id) => ringe.some((r) => imRing(p, r)) || abstandGrenze(p) < (SAUM[id] ?? 2.5);

// ---------- Koordinaten normalisieren (linke obere Ecke = Rand)
const alle = ringe.flat();
const RAND = 12;
const minX = Math.min(...alle.map((p) => p[0])), minY = Math.min(...alle.map((p) => p[1]));
const maxX = Math.max(...alle.map((p) => p[0])), maxY = Math.max(...alle.map((p) => p[1]));
const verschiebe = ([x, y]) => [x - minX + RAND, y - minY + RAND];
const r1 = (n) => Math.round(n * 10) / 10;

function pfad(ringListe, schliessen) {
  return ringListe
    .map((r) => {
      const p = r.map((pt) => verschiebe(pt).map(r1));
      let d = `M${p[0][0]} ${p[0][1]}`;
      for (let i = 1; i < p.length; i++) {
        const dx = r1(p[i][0] - p[i - 1][0]), dy = r1(p[i][1] - p[i - 1][1]);
        if (dx || dy) d += `l${dx} ${dy}`;
      }
      return schliessen ? d + "z" : d;
    })
    .join("");
}
function box(punkte) {
  const v = punkte.map(verschiebe);
  const xs = v.map((p) => p[0]), ys = v.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(Math.round);
}

// Beschriftungspunkt: der Punkt im größten Teilstück, der am weitesten von jeder Grenze weg ist.
// Bei Brandenburg landet er so nicht im Loch, in dem Berlin liegt.
function flaeche(r) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]);
  return Math.abs(a / 2);
}
function labelPunkt(poly) {
  const segs = [];
  for (const r of poly) for (let i = 1; i < r.length; i++) segs.push([r[i - 1], r[i]]);
  const xs = poly[0].map((p) => p[0]), ys = poly[0].map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let bester = [(x0 + x1) / 2, (y0 + y1) / 2], weite = -1;
  const N = 60;
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    const p = [x0 + ((x1 - x0) * i) / N, y0 + ((y1 - y0) * j) / N];
    const drin = poly.reduce((d, r) => (imRing(p, r) ? !d : d), false);
    if (!drin) continue;
    let min = Infinity;
    for (const [[ax, ay], [bx, by]] of segs) {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1e-9;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / l2));
      min = Math.min(min, Math.hypot(p[0] - (ax + t * dx), p[1] - (ay + t * dy)));
    }
    if (min > weite) { weite = min; bester = p; }
  }
  return verschiebe(bester).map(Math.round);
}

const laender = {};
for (const f of laenderGeo.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const projPolys = polys.map((p) => p.map((r) => r.map(projiziere)));
  const rs = projPolys.flat();
  const groesstes = projPolys.reduce((a, b) => (flaeche(b[0]) > flaeche(a[0]) ? b : a));
  laender[f.properties.id] = { d: pfad(rs, true), box: box(rs.flat()), label: labelPunkt(groesstes) };
}

const tol = Number(ANTEIL) < 0.1 ? 1.2 : 0.6;
const fluesse = {};
for (const id of Object.keys(FLUSS_QUELLEN)) {
  const teile = [];
  for (const linie of sammle(id)) {
    const p = dp(linie.map(projiziere), tol / 2);
    let lauf = [];
    for (const pt of p) {
      if (inDeutschland(pt, id)) lauf.push(pt);
      else { if (lauf.length > 1) teile.push(lauf); lauf = []; }
    }
    if (lauf.length > 1) teile.push(lauf);
  }
  const vereinfacht = teile.map((t) => dp(t, tol)).filter((t) => t.length > 1);
  if (!vereinfacht.length) throw new Error(`Fluss ohne Geometrie: ${id}`);
  // Mitte = Punkt auf halber Länge des längsten Teilstücks (für Hervorhebung und Zoom)
  const laengste = vereinfacht.reduce((a, b) => (b.length > a.length ? b : a));
  let gesamt = 0; for (let i = 1; i < laengste.length; i++) gesamt += Math.hypot(laengste[i][0] - laengste[i - 1][0], laengste[i][1] - laengste[i - 1][1]);
  let lauf = 0, mitte = laengste[0];
  for (let i = 1; i < laengste.length; i++) {
    lauf += Math.hypot(laengste[i][0] - laengste[i - 1][0], laengste[i][1] - laengste[i - 1][1]);
    if (lauf >= gesamt / 2) { mitte = laengste[i]; break; }
  }
  fluesse[id] = { d: pfad(vereinfacht, false), box: box(vereinfacht.flat()), mitte: verschiebe(mitte).map(Math.round) };
}

const staedte = {};
for (const [id, ll] of Object.entries(STAEDTE)) staedte[id] = verschiebe(projiziere(ll)).map(r1);

const daten = {
  breite: Math.ceil(maxX - minX + 2 * RAND),
  hoehe: Math.ceil(maxY - minY + 2 * RAND),
  laender, fluesse, staedte,
};
const kopf = "// Automatisch erzeugt von tools/build-karte.mjs. Nicht von Hand bearbeiten.\n" +
  "// Grenzen: deutschlandGeoJSON (isellsoap). Flüsse: Natural Earth und © OpenStreetMap-Mitwirkende (ODbL).\n";
fs.writeFileSync(OUT, OUT.endsWith(".json") ? JSON.stringify(daten) : `${kopf}export const KARTE = ${JSON.stringify(daten)};\n`);
console.log(`${OUT}: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB, ${daten.breite}×${daten.hoehe}`);

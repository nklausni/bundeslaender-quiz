import { LAENDER, LAND, STIFT, FLUESSE } from "./daten.js";
import { KARTE } from "./karte-daten.js";
import { karteSvg, skaliere, landBeiTipp, laenderBeiTipp, STADTSTAAT_RINGE, STADT_VON_STADTSTAAT } from "./karte.js";
import { MISSIONEN, neueRunde, frageNochmal } from "./quiz.js";
import * as sp from "./speicher.js";
import { icon, stern, sterne } from "./icons.js";
import { klang, konfetti } from "./effekte.js";

const app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const trenn = (s) => esc(s).replace(/-/g, "-<wbr>");
const markRing = (id) => (STADT_VON_STADTSTAAT[id] ? [{ stadt: STADT_VON_STADTSTAAT[id], art: "mark" }] : []);

let runde = null;

function zeige(html, { fix = false } = {}) {
  schliesseDialog();
  app.innerHTML = html;
  app.classList.toggle("fix", fix);
  window.scrollTo(0, 0);
  requestAnimationFrame(() => skaliere(app));
}

function toast(html) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = html;
  app.appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

// ---------------------------------------------------------------- Willkommen
function zeigeWillkommen() {
  zeige(`<form class="willkommen" data-form="name">
    <div class="karten-rahmen">${karteSvg({ farben: STIFT })}</div>
    <h1>Hallo! Wie heißt du?</h1>
    <p>Lerne alle 16 Bundesländer, ihre Hauptstädte und Flüsse. Jedes Land, das du kannst, malst du bunt aus.</p>
    <input class="feld" name="name" maxlength="20" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="Dein Vorname" aria-label="Dein Vorname" required>
    <button class="knopf knopf-haupt" type="submit">Los geht’s ${icon("arrow", 20, { sw: 2.6 })}</button>
  </form>`);
}

// ---------------------------------------------------------------- Start
function zeigeStart() {
  runde = null;
  const s = sp.get();
  const r = sp.rang();
  const serie = sp.aktuelleSerie();
  const n = s.stempel.length;
  const farben = Object.fromEntries(s.stempel.map((id) => [id, STIFT[id]]));
  const missionen = Object.entries(MISSIONEN).map(([id, m]) => `
    <button class="karte-box mission ton-${m.ton}" data-aktion="mission" data-wert="${id}">
      <span class="icon-kachel">${icon(m.icon, 22)}</span>
      <span class="titel">${m.titel}</span>
      <span class="unten"><span>${m.untertitel}</span>${sterne(s.sterne[id] ?? 0)}</span>
    </button>`).join("");

  zeige(`<div class="start">
    <header class="start-kopf">
      <div>
        <h1>Hallo ${esc(s.name)}!</h1>
        <div class="rang">${r.name} · ${s.punkte} Punkte</div>
      </div>
      <div class="rechts">
        <span class="pill" aria-label="${serie} Tage in Folge geübt"><span class="flamme">${icon("flame", 18, { fill: "#F6B49F", sw: 1.8 })}</span>${serie} ${serie === 1 ? "Tag" : "Tage"}</span>
        <button class="icon-knopf" data-aktion="einstellungen" aria-label="Einstellungen">${icon("gear", 22)}</button>
      </div>
    </header>
    <button class="karte-box ausmalen" data-aktion="album">
      <span class="karten-rahmen">${karteSvg({ farben })}</span>
      <span class="info">
        <span class="klein-titel">Deutschland ausmalen</span>
        <span class="zahl">${n}<small> / 16</small></span>
        <span class="leise" style="font-size:14px;line-height:1.35">${n === 16 ? "Alles bunt! Du kennst ganz Deutschland." : "Jedes Land, das du richtig kannst, wird bunt."}</span>
        <span class="balken"><span style="display:block;height:100%;width:${(n / 16) * 100}%;background:var(--gruen);border-radius:6px"></span></span>
        <span class="link-text">Sammelalbum ${icon("arrow", 16)}</span>
      </span>
    </button>
    <h2 class="missionen-titel">Deine Missionen</h2>
    <div class="missionen">${missionen}</div>
    <button class="karte-box erkunden" data-aktion="erkunden">
      <span class="icon-kachel ton-gruen">${icon("compass", 22)}</span>
      <span class="text"><span class="titel">Karte erkunden</span><span>Tippe auf ein Land und lerne alles darüber</span></span>
      <span style="color:var(--blau)">${icon("arrow", 20)}</span>
    </button>
  </div>`);
}

// ---------------------------------------------------------------- Quiz
function starteRunde(mission) {
  const fragen = neueRunde(mission);
  runde = { mission, fragen, anzahl: fragen.length, i: 0, erstRichtig: 0, punkte: 0, serie: 0, beantwortet: false, tipp: false };
  zeigeFrage();
}

function zeigeFrage() {
  const f = runde.fragen[runde.i];
  runde.beantwortet = false;
  runde.tipp = false;
  const tippen = f.typ === "tippen";
  const unten = tippen
    ? `<div class="quiz-fuss" data-unten>
        <span class="leise">Kleine Länder haben einen Kreis zum Antippen.</span>
        <button class="tipp-knopf" data-aktion="tipp">${icon("bulb", 20)}Tipp</button>
      </div>`
    : `<div class="antworten" data-unten>${f.optionen.map((o) => `
        <button class="antwort${o.text.length > 12 ? " lang" : ""}" data-aktion="antwort" data-wert="${o.id}">${trenn(o.text)}</button>`).join("")}
      </div>`;

  zeige(`<div class="quiz">
    ${quizKopf()}
    <div class="karte-box frage ton-${f.ton}">
      <span class="icon-kachel">${icon(f.icon, 22)}</span>
      <div><div class="klein">${esc(f.klein)}</div><div class="gross">${trenn(f.gross)}</div></div>
    </div>
    <div class="karten-feld${tippen ? " tippbar" : ""}"${tippen ? ' data-aktion="karte-tipp"' : ""} data-karte>${karteSvg(f.karte)}</div>
    ${unten}
  </div>`, { fix: true });
}

function quizKopf() {
  const gesamt = runde.fragen.length;
  return `<div class="quiz-kopf">
    <button class="icon-knopf" data-aktion="beenden" aria-label="Runde beenden">${icon("close", 24)}</button>
    <div class="balken" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="${gesamt}" aria-valuenow="${runde.i}"><div style="width:${(runde.i / gesamt) * 100}%"></div></div>
    <span class="pill">${stern(true, 18)}<span data-punkte>${runde.punkte}</span></span>
  </div>`;
}

function karteTipp(e) {
  if (!runde || runde.beantwortet) return;
  const svg = app.querySelector("[data-karte] svg");
  const kandidaten = laenderBeiTipp(svg, e.clientX, e.clientY);
  if (!kandidaten.length) return; // Tipp aufs Meer oder ins Ausland zählt nicht
  // Trifft der Finger im Grenzbereich zwei Länder und eines ist das gesuchte, zählt das gesuchte
  const { richtig } = runde.fragen[runde.i];
  beantworte(kandidaten.includes(richtig) ? richtig : kandidaten[0]);
}

function tippGeben(knopf) {
  const f = runde.fragen[runde.i];
  if (runde.beantwortet || runde.tipp) return;
  runde.tipp = true;
  app.querySelector("[data-karte]").innerHTML = karteSvg({ ...f.karte, hinweis: f.richtig });
  knopf.disabled = true;
  knopf.previousElementSibling.textContent = "Das Land liegt im gelben Kreis. Richtig gibt jetzt 5 Punkte.";
  requestAnimationFrame(() => skaliere(app));
}

function beantworte(gewaehlt) {
  if (runde.beantwortet) return;
  runde.beantwortet = true;
  const f = runde.fragen[runde.i];
  const gut = gewaehlt === f.richtig;
  sp.merkeAntwort(f.fakt, gut);

  let plus = 0, bonus = 0, nochmal = false;
  if (gut) {
    plus = f.wiederholung || runde.tipp ? 5 : 10;
    if (!f.wiederholung) runde.erstRichtig++;
    runde.serie++;
    if (runde.serie >= 3 && runde.serie % 3 === 0) bonus = 5;
  } else {
    runde.serie = 0;
    if (!f.wiederholung) {
      runde.fragen.push({ ...frageNochmal(f), wiederholung: true });
      nochmal = true;
    }
  }
  runde.punkte += plus + bonus;

  const l = f.loesung(gewaehlt);
  app.querySelector(".quiz").classList.add("beantwortet");
  app.querySelector("[data-karte]").innerHTML = karteSvg(l.karte);
  app.querySelector("[data-punkte]").textContent = runde.punkte;

  for (const b of app.querySelectorAll(".antwort")) {
    b.disabled = true;
    const id = b.dataset.wert;
    if (id === f.richtig) {
      b.classList.add(gut ? "ist-richtig" : "ist-loesung");
      b.insertAdjacentHTML("afterbegin", icon("check", 20, { sw: 3 }));
    } else if (id === gewaehlt) {
      b.classList.add("ist-falsch");
      b.insertAdjacentHTML("afterbegin", icon("x", 20, { sw: 3 }));
    } else b.classList.add("ist-aus");
  }

  const letzte = runde.i === runde.fragen.length - 1;
  const blatt = `<div class="rueckmeldung ${gut ? "gut" : "schlecht"}" role="status">
    <div class="zeile">
      <div class="kreis">${icon(gut ? "check" : "x", 22, { sw: 3 })}</div>
      <h2>${esc(l.titel)}</h2>
      ${gut ? `<span class="plus">+${plus + bonus}</span>` : ""}
    </div>
    <p>${esc(l.text)}${nochmal ? " Die Frage kommt gleich noch einmal." : ""}</p>
    <button class="knopf ${gut ? "knopf-gruen" : "knopf-haupt"}" data-aktion="weiter">${letzte ? "Zum Ergebnis" : "Weiter"} ${icon("arrow", 20, { sw: 2.6 })}</button>
  </div>`;
  const unten = app.querySelector("[data-unten]");
  if (f.typ === "tippen") unten.outerHTML = blatt;
  else unten.insertAdjacentHTML("afterend", blatt);

  klang(gut ? "richtig" : "falsch");
  if (bonus) {
    setTimeout(() => { toast(`${icon("flame", 20, { fill: "#F6B49F", sw: 1.8 })} ${runde.serie} richtig in Folge! +5`); klang("serie"); }, 350);
  }
  requestAnimationFrame(() => skaliere(app));
}

function naechsteFrage() {
  runde.i++;
  if (runde.i >= runde.fragen.length) zeigeErgebnis();
  else zeigeFrage();
}

function frageBeenden() {
  oeffneDialog(`<h2 id="dlg-titel">Runde beenden?</h2>
    <p>Deine Punkte aus dieser Runde bekommst du trotzdem.</p>
    <button class="knopf knopf-gruen" data-aktion="dialog-zu">Weiterspielen</button>
    <button class="knopf knopf-leise" data-aktion="runde-abbrechen">Beenden</button>`);
}

function rundeAbbrechen() {
  if (runde) sp.setze({ punkte: sp.get().punkte + runde.punkte });
  zeigeStart();
}

// ---------------------------------------------------------------- Ergebnis
function zeigeErgebnis() {
  const quote = runde.erstRichtig / runde.anzahl;
  const anzahlSterne = quote >= 0.9 ? 3 : quote >= 0.7 ? 2 : quote >= 0.4 ? 1 : 0;
  runde.punkte += 10; // Bonus fürs Durchspielen

  const s = sp.get();
  const rangVorher = sp.rang().name;
  sp.setze({
    punkte: s.punkte + runde.punkte,
    sterne: { ...s.sterne, [runde.mission]: Math.max(s.sterne[runde.mission] ?? 0, anzahlSterne) },
  });
  sp.spieltagZaehlen();
  const neu = sp.neueStempel();
  const r = sp.rang();
  const neuerRang = r.name !== rangVorher;
  const serie = sp.aktuelleSerie();
  const name = esc(s.name);

  const titel = [`Weiter so, ${name}!`, `Gut geübt, ${name}!`, `Toll, ${name}!`, `Super gemacht, ${name}!`][anzahlSterne];
  const grossStern = (an, size, delay, mitte = false) =>
    `<span class="${mitte ? "mitte" : ""}" style="color:${an ? "var(--gold-dunkel)" : "var(--linie-2)"}">${icon("star", size, { fill: an ? "var(--gold)" : "none", sw: 1.2 }).replace("<svg ", `<svg style="animation-delay:${delay}s" `)}</span>`;

  zeige(`<div class="ergebnis">
    <div class="gross-sterne" aria-label="${anzahlSterne} von 3 Sternen">
      ${grossStern(anzahlSterne >= 1, 64, 0.1)}${grossStern(anzahlSterne >= 2, 84, 0.3, true)}${grossStern(anzahlSterne >= 3, 64, 0.5)}
    </div>
    <div>
      <h1>${titel}</h1>
      <div class="quote">${runde.erstRichtig} von ${runde.anzahl} auf Anhieb richtig</div>
    </div>
    <div class="kacheln">
      <div class="karte-box kachel"><span style="color:var(--gold-dunkel)">${icon("star", 28, { fill: "var(--gold)", sw: 1.6 })}</span><div><b>+${runde.punkte}</b><span>Punkte</span></div></div>
      <div class="karte-box kachel"><span class="flamme">${icon("flame", 28, { fill: "#F6B49F", sw: 1.6 })}</span><div><b>${serie} ${serie === 1 ? "Tag" : "Tage"}</b><span>in Folge geübt</span></div></div>
    </div>
    ${ergebnisKarte(neu)}
    <div class="rang-fortschritt">
      <div class="zeile"><span>${neuerRang ? `Neuer Rang: ${r.name}!` : r.name}</span><span class="leise">${r.naechster ? `noch ${r.fehlt} bis ${r.naechster.name}` : "Höchster Rang!"}</span></div>
      <div class="balken"><div style="width:${Math.round(r.anteil * 100)}%"></div></div>
    </div>
    <div class="knoepfe">
      <button class="knopf knopf-haupt" data-aktion="mission" data-wert="${runde.mission}">${icon("replay", 20, { sw: 2.6 })}Nochmal spielen</button>
      <button class="knopf knopf-leise" data-aktion="start">Zur Übersicht</button>
    </div>
  </div>`);

  klang("fertig");
  if (anzahlSterne >= 2 || neu.length || neuerRang) setTimeout(() => konfetti(), 250);
}

function ergebnisKarte(neu) {
  const s = sp.get();
  const farben = Object.fromEntries(s.stempel.map((id) => [id, STIFT[id]]));
  if (neu.length) {
    return `<div class="karte-box neu-karte">
      <span class="karten-rahmen">${karteSvg({ farben, ringe: neu.flatMap(markRing) })}</span>
      <div><div class="klein-titel">Neu ausgemalt</div><h2>${neu.map((id) => trenn(LAND[id].name)).join(", ")}</h2>
      <p>Lage, Hauptstadt und Flüsse sitzen. Neuer Stempel im Sammelalbum!</p></div>
    </div>`;
  }
  if (s.stempel.length === 16) {
    return `<div class="karte-box neu-karte">
      <span class="karten-rahmen">${karteSvg({ farben })}</span>
      <div><div class="klein-titel">Geschafft</div><h2>Alle 16 bunt!</h2><p>Übe weiter, damit alles sicher sitzt.</p></div>
    </div>`;
  }
  // Das Land, das am nächsten dran ist, als Ansporn zeigen
  const kandidaten = LAENDER.filter((l) => !s.stempel.includes(l.id)).map((l) => {
    const st = sp.landStatus(l);
    const fehlt = [!st.lage && "die Lage", !st.hauptstadt && "die Hauptstadt", st.fluesse === false && "die Flüsse"].filter(Boolean);
    return { l, fehlt };
  }).sort((a, b) => a.fehlt.length - b.fehlt.length);
  const { l, fehlt } = kandidaten[0];
  return `<div class="karte-box neu-karte">
    <span class="karten-rahmen">${karteSvg({ farben, zustand: { [l.id]: "mark" }, ringe: markRing(l.id) })}</span>
    <div><div class="klein-titel">${fehlt.length === 1 ? "Fast geschafft" : "Als Nächstes"}</div><h2>${trenn(l.name)}</h2>
    <p>Hier ${fehlt.length === 1 ? "fehlt" : "fehlen"} noch ${fehlt.join(" und ")}. Dann wird das Land bunt.</p></div>
  </div>`;
}

// ---------------------------------------------------------------- Album
function zeigeAlbum() {
  const s = sp.get();
  const punkt = (an) => `<span class="punkt${an ? " an" : ""}"></span>`;
  const stempel = LAENDER.slice().sort((a, b) => a.nr - b.nr).map((l) => {
    const voll = s.stempel.includes(l.id);
    const st = sp.landStatus(l);
    const [x0, y0, x1, y1] = KARTE.laender[l.id].box;
    const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
    const vb = [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map((v) => v.toFixed(1)).join(" ");
    return `<button class="stempel${voll ? " voll" : ""}" data-aktion="land-info" data-wert="${l.id}" aria-label="${esc(l.name)}${voll ? ", Stempel gesammelt" : ""}">
      <svg viewBox="${vb}" aria-hidden="true"><path d="${KARTE.laender[l.id].d}" fill="${voll ? STIFT[l.id] : "#E4D9C2"}" fill-rule="evenodd" stroke="${voll ? "#1E2A4A" : "#C9BC9F"}" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
      <span class="name">${trenn(l.name)}</span>
      <span class="punkte">${punkt(st.lage)}${punkt(st.hauptstadt)}${st.fluesse === null ? "" : punkt(st.fluesse)}</span>
    </button>`;
  }).join("");

  zeige(`<div class="album">
    <div class="album-kopf"><button class="icon-knopf" data-aktion="start" aria-label="Zurück">${icon("back", 24, { sw: 2.4 })}</button><h1>Mein Sammelalbum</h1></div>
    <div class="leise" style="font-size:16px;line-height:1.4">${s.stempel.length} von 16 Stempeln gesammelt. Tippe auf ein Land, um es zu lernen.</div>
    <div class="legende">
      <span>${punkt(true)}Lage</span><span>${punkt(true)}Hauptstadt</span><span>${punkt(true)}Flüsse</span>
    </div>
    <div class="stempel-raster">${stempel}</div>
  </div>`);
}

function landInfo(l) {
  const flussChips = l.fluesse.length
    ? `<div class="chips">${l.fluesse.map((f) => `<span class="chip">${esc(FLUESSE[f].name)}</span>`).join("")}</div>`
    : `<div class="leise" style="font-size:15px">Keiner der Flüsse vom Arbeitsblatt</div>`;
  return `
    <div class="info-zeile"><span class="icon-kachel ton-lila">${icon("castle", 20)}</span><div><div class="was">Hauptstadt</div>${esc(l.hauptstadt)}</div></div>
    <div class="info-zeile"><span class="icon-kachel ton-blau">${icon("waves", 20)}</span><div><div class="was">Flüsse</div>${flussChips}</div></div>
    <p>${esc(l.fakt)} Auf deinem Arbeitsblatt hat das Land die Nummer ${l.nr}.</p>`;
}

const infoKarte = (l) => karteSvg({
  zustand: { [l.id]: "mark" }, ringe: markRing(l.id),
  fluesse: l.fluesse.map((f) => ({ id: f, art: "neben" })),
  staedte: [{ stadt: l.stadt, art: "mark", text: l.hauptstadt }],
});

function zeigeLandDialog(id) {
  const l = LAND[id];
  oeffneDialog(`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <h2 id="dlg-titel">${trenn(l.name)}</h2>
      <button class="icon-knopf" data-aktion="dialog-zu" aria-label="Schließen">${icon("close", 24)}</button>
    </div>
    <div class="karten-rahmen">${infoKarte(l)}</div>
    ${landInfo(l)}`);
}

// ---------------------------------------------------------------- Erkunden
function zeigeErkunden() {
  zeige(`<div class="erkunden-seite">
    <div class="seiten-kopf"><button class="icon-knopf" data-aktion="start" aria-label="Zurück">${icon("back", 24, { sw: 2.4 })}</button><h1>Karte erkunden</h1></div>
    <div class="hinweis-zeile">Tippe auf ein Bundesland.</div>
    <div class="karten-feld tippbar" data-aktion="erkunden-tipp" data-karte>${karteSvg({ alleFluesse: true, ringe: STADTSTAAT_RINGE })}</div>
    <div data-info></div>
  </div>`, { fix: true });
}

function erkundenTipp(e) {
  const svg = app.querySelector("[data-karte] svg");
  const id = landBeiTipp(svg, e.clientX, e.clientY);
  if (!id) return;
  const l = LAND[id];
  app.querySelector("[data-karte]").innerHTML = karteSvg({
    alleFluesse: true, zustand: { [id]: "mark" }, ringe: markRing(id),
    fluesse: l.fluesse.map((f) => ({ id: f, art: "neben" })),
    staedte: [{ stadt: l.stadt, art: "mark", text: l.hauptstadt }],
  });
  app.querySelector("[data-info]").innerHTML = `<div class="info-blatt"><h2>${trenn(l.name)}</h2>${landInfo(l)}</div>`;
  requestAnimationFrame(() => skaliere(app));
}

// ---------------------------------------------------------------- Einstellungen
function zeigeEinstellungen() {
  const s = sp.get();
  oeffneDialog(`<div style="display:flex;align-items:center;justify-content:space-between">
      <h2 id="dlg-titel">Einstellungen</h2>
      <button class="icon-knopf" data-aktion="dialog-zu" aria-label="Schließen">${icon("close", 24)}</button>
    </div>
    <form data-form="name-aendern" style="display:flex;gap:8px">
      <input class="feld" name="name" maxlength="20" autocomplete="off" value="${esc(s.name)}" aria-label="Name" required>
      <button class="knopf knopf-blau" type="submit" style="width:auto">Ändern</button>
    </form>
    <div class="karte-box schalter-zeile">
      <span id="ton-label">Töne</span>
      <button class="schalter" role="switch" aria-checked="${s.ton}" aria-labelledby="ton-label" data-aktion="ton"></button>
    </div>
    <p><b style="color:var(--tinte)">Tipp fürs iPhone:</b> In Safari auf „Teilen“ tippen und „Zum Home-Bildschirm“ wählen. Dann startet das Quiz wie eine App im Vollbild.</p>
    <p>Der Fortschritt wird nur auf diesem Gerät gespeichert.</p>
    <button class="knopf knopf-leise" data-aktion="zuruecksetzen">Fortschritt zurücksetzen</button>`);
}

// ---------------------------------------------------------------- Dialoge
function oeffneDialog(inhalt) {
  schliesseDialog();
  const d = document.createElement("div");
  d.className = "schleier";
  d.dataset.aktion = "schleier";
  d.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-titel">${inhalt}</div>`;
  document.body.appendChild(d);
  requestAnimationFrame(() => {
    skaliere(d);
    d.querySelector("button, input")?.focus({ preventScroll: true });
  });
}

function schliesseDialog() {
  document.querySelector(".schleier")?.remove();
}

// ---------------------------------------------------------------- Ereignisse
const AKTIONEN = {
  start: () => zeigeStart(),
  mission: (wert) => starteRunde(wert),
  antwort: (wert) => beantworte(wert),
  "karte-tipp": (_, __, e) => karteTipp(e),
  tipp: (_, el) => tippGeben(el),
  weiter: () => naechsteFrage(),
  beenden: () => frageBeenden(),
  "runde-abbrechen": () => rundeAbbrechen(),
  album: () => zeigeAlbum(),
  "land-info": (wert) => zeigeLandDialog(wert),
  erkunden: () => zeigeErkunden(),
  "erkunden-tipp": (_, __, e) => erkundenTipp(e),
  einstellungen: () => zeigeEinstellungen(),
  "dialog-zu": () => schliesseDialog(),
  schleier: (_, el, e) => { if (e.target === el) schliesseDialog(); },
  ton: (_, el) => {
    const an = !sp.get().ton;
    sp.setze({ ton: an });
    el.setAttribute("aria-checked", String(an));
    if (an) klang("richtig");
  },
  zuruecksetzen: (_, el) => {
    if (el.dataset.sicher) {
      sp.zuruecksetzen();
      zeigeStart();
      return;
    }
    el.dataset.sicher = "1";
    el.textContent = "Wirklich alles löschen? Nochmal tippen";
    el.style.color = "var(--koralle-dunkel)";
    el.style.borderColor = "var(--koralle)";
  },
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-aktion]");
  if (!el || el.disabled) return;
  AKTIONEN[el.dataset.aktion]?.(el.dataset.wert, el, e);
});

document.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = new FormData(e.target).get("name")?.toString().trim();
  if (!name) return;
  sp.setze({ name });
  zeigeStart();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") schliesseDialog();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => skaliere(document), 60);
});
document.fonts?.ready.then(() => skaliere(document));

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

if (sp.get().name) zeigeStart();
else zeigeWillkommen();

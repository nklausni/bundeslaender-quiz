import { LAENDER, LAND, STIFT, FLUESSE, ANREDEN, mitArtikel } from "./daten.js";
import { KARTE } from "./karte-daten.js";
import { karteSvg, skaliere, landBeiTipp, laenderBeiTipp, STADTSTAAT_RINGE, STADT_VON_STADTSTAAT } from "./karte.js";
import { MISSIONEN, neueRunde, frageNochmal } from "./quiz.js";
import { PROFI_MISSIONEN, PUNKTE, neueProfiRunde, profiFrage, pruefe, pruefeSammler, anderesText, muster, markiere } from "./profi.js";
import { ABZEICHEN, vergibAbzeichen } from "./abzeichen.js";
import * as sp from "./speicher.js";
import { icon, stern, sterne } from "./icons.js";
import { klang, konfetti } from "./effekte.js";

const app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const trenn = (s) => esc(s).replace(/-/g, "-<wbr>");
const liste = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} und ${a[a.length - 1]}`);
const markRing = (id) => (STADT_VON_STADTSTAAT[id] ? [{ stadt: STADT_VON_STADTSTAAT[id], art: "mark" }] : []);
const GOLD = "#F2C14E";
const MEDAILLEN_FARBE = { koralle: "var(--koralle)", lila: "var(--lila)", blau: "var(--blau)", gruen: "var(--gruen)", gold: "var(--gold-dunkel)" };

let runde = null;

function zeige(html, { fix = false, schreiben = false } = {}) {
  schliesseDialog();
  app.innerHTML = html;
  app.classList.toggle("fix", fix);
  app.classList.toggle("schreiben", schreiben);
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

function wackle(el) {
  el.classList.remove("wackeln");
  void el.offsetWidth; // Animation neu starten
  el.classList.add("wackeln");
}

// Buntstift für gesammelte Stempel. Auf der Gold-Karte nur die goldenen Länder,
// sonst wäre Gold neben dem gelben Buntstift (Baden-Württemberg) kaum zu erkennen.
function kartenFarben(s, { gold = false } = {}) {
  if (gold) return Object.fromEntries(s.goldStempel.map((id) => [id, GOLD]));
  return Object.fromEntries(s.stempel.map((id) => [id, STIFT[id]]));
}

const medaille = (a, an, gr = 62) =>
  `<span class="medaille${an ? " an" : ""}" style="--m:${MEDAILLEN_FARBE[a.farbe]};--g:${gr}px" aria-hidden="true"><span>${icon(a.icon, Math.round(gr * 0.45))}</span></span>`;

function rueckmeldung({ gut, titel, plus = 0, text = "", extra = "", letzte }) {
  return `<div class="rueckmeldung ${gut ? "gut" : "schlecht"}" role="status">
    <div class="zeile">
      <div class="kreis">${icon(gut ? "check" : "x", 22, { sw: 3 })}</div>
      <h2>${esc(titel)}</h2>
      ${plus ? `<span class="plus">+${plus}</span>` : ""}
    </div>
    ${extra}
    ${text ? `<p>${esc(text)}</p>` : ""}
    <button class="knopf ${gut ? "knopf-gruen" : "knopf-haupt"}" data-aktion="weiter">${letzte ? "Zum Ergebnis" : "Weiter"} ${icon("arrow", 20, { sw: 2.6 })}</button>
  </div>`;
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

// ---------------------------------------------------------------- Titel wählen
// Einmal pro Spielstand: Das Kind sucht sich die Titelform selbst aus.
function zeigeTitelWahl() {
  const s = sp.get();
  zeige(`<div class="titel-wahl">
    <div class="titel-icon">${icon("medal", 56, { sw: 1.8 })}</div>
    <h1>Hallo ${esc(s.name)}! Welche Titel möchtest du sammeln?</h1>
    <p>Mit jedem Punkt kommst du deinem nächsten Titel näher. Du kannst das später in den Einstellungen ändern.</p>
    <div class="titel-optionen">
      ${Object.entries(ANREDEN).map(([k, a]) => `<button class="karte-box titel-option" data-aktion="anrede" data-wert="${k}">
        <span class="kreis" aria-hidden="true"></span>
        <span class="text"><span class="titel">${trenn(a.titel)}</span><span>${esc(a.beispiele)}</span></span>
      </button>`).join("")}
    </div>
  </div>`);
}

// ---------------------------------------------------------------- Start
function zeigeStart() {
  runde = null;
  if (!sp.get().anrede) return zeigeTitelWahl();
  // Abzeichen, die schon mit dem bisherigen Fortschritt verdient sind, vor dem Zeichnen vergeben
  const neu = vergibAbzeichen();
  const s = sp.get();
  const r = sp.rang();
  const serie = sp.aktuelleSerie();
  const n = s.stempel.length;
  const frei = sp.profiFrei(s);
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
    ${frei ? profiKarte(s) : ""}
    <button class="karte-box ausmalen" data-aktion="album">
      <span class="karten-rahmen">${karteSvg({ farben: kartenFarben(s) })}</span>
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
    ${frei ? "" : profiKarte(s)}
  </div>`);

  if (frei && !s.profi.vorgestellt) {
    sp.setze({ profi: { ...s.profi, vorgestellt: true } });
    zeigeProfiVorstellung(neu);
  } else if (neu.length) {
    zeigeNeueAbzeichenDialog(neu);
  }
}

function profiKarte(s) {
  if (!sp.profiFrei(s)) {
    const fehlt = Math.max(0, 8 - s.stempel.length);
    return `<div class="karte-box profi-gesperrt">
      <span class="icon-kachel ton-gold">${icon("lock", 22)}</span>
      <span class="text"><span class="titel">Expertenmodus</span><span>Wird frei ab 8 Stempeln (noch ${fehlt}) oder 600 Punkten.</span></span>
    </div>`;
  }
  const neu = !Object.keys(s.profi.sterne).length;
  return `<button class="profi-karte" data-aktion="profi">
    <span class="zeile">
      <span class="profi-icon">${icon("pencil", 24)}</span>
      <span class="text">
        <span class="titel">Expertenmodus${neu ? '<span class="neu">NEU</span>' : ""}</span>
        <span class="unter">Jetzt schreibst du die Namen selbst.</span>
      </span>
      <span class="pfeil">${icon("arrow", 22, { sw: 2.4 })}</span>
    </span>
    <span class="werte">
      <span>${icon("crown", 20)}${s.goldStempel.length} / 16 Gold</span>
      <span>${icon("medal", 20)}${Object.keys(s.abzeichen).length} / ${ABZEICHEN.length} Abzeichen</span>
    </span>
  </button>`;
}

function zeigeProfiVorstellung(neu) {
  const s = sp.get();
  oeffneDialog(`<div class="intro-kopf"><span class="profi-icon gross">${icon("pencil", 30)}</span></div>
    <h2 id="dlg-titel">Neu: Expertenmodus!</h2>
    <p>${s.stempel.length === 16 ? "Du hast ganz Deutschland ausgemalt." : "Du kennst dich schon richtig gut aus."} Jetzt wird es schwerer: Du schreibst die Namen selbst, ganz ohne Auswahl.</p>
    <ul class="intro-liste">
      <li>${icon("crown", 22)}<span>Deutschland vergolden: Schreib Land, Hauptstadt und alle Flüsse richtig.</span></li>
      <li>${icon("medal", 22)}<span>${ABZEICHEN.length} Abzeichen zum Sammeln</span></li>
      <li>${icon("star", 22)}<span>Neue Ränge bis zur Deutschland-Legende</span></li>
    </ul>
    ${neu.length ? `<div class="klein-titel">Schon verdient</div>
      <div class="abz-reihe">${neu.map((a) => `<span class="abz-mini">${medaille(a, true, 44)}<span>${esc(a.name)}</span></span>`).join("")}</div>` : ""}
    <button class="knopf knopf-haupt" data-aktion="profi">Los geht’s ${icon("arrow", 20, { sw: 2.6 })}</button>
    <button class="knopf knopf-leise" data-aktion="dialog-zu">Später</button>`);
  if (neu.length) setTimeout(() => konfetti(), 300);
}

function zeigeNeueAbzeichenDialog(neu) {
  oeffneDialog(`<h2 id="dlg-titel">${neu.length === 1 ? "Neues Abzeichen!" : "Neue Abzeichen!"}</h2>
    <div class="abz-liste">${neu.map((a) => `<div class="abz-zeile">${medaille(a, true, 52)}<div><b>${esc(a.name)}</b><span>${esc(a.text)}</span></div></div>`).join("")}</div>
    <button class="knopf knopf-gruen" data-aktion="dialog-zu">Super!</button>`);
  setTimeout(() => konfetti(), 300);
}

// ---------------------------------------------------------------- Expertenmodus: Übersicht
function zeigeProfi() {
  runde = null;
  const s = sp.get();
  const n = s.goldStempel.length;
  const missionen = Object.entries(PROFI_MISSIONEN).map(([id, m]) => `
    <button class="karte-box profi-mission ton-${m.ton}" data-aktion="mission" data-wert="${id}">
      <span class="icon-kachel">${icon(m.icon, 22)}</span>
      <span class="text"><span class="titel">${m.titel}</span><span>${m.untertitel}</span></span>
      ${sterne(s.profi.sterne[id] ?? 0)}
    </button>`).join("");
  const reihenfolge = [...ABZEICHEN.filter((a) => s.abzeichen[a.id]), ...ABZEICHEN.filter((a) => !s.abzeichen[a.id])];

  zeige(`<div class="start profi-seite">
    <div class="album-kopf">
      <button class="icon-knopf" data-aktion="start" aria-label="Zurück">${icon("back", 24, { sw: 2.4 })}</button>
      <h1>Expertenmodus</h1>
      <span class="pill" style="margin-left:auto">${stern(true, 18)}${s.punkte}</span>
    </div>
    <button class="karte-box ausmalen gold-karte" data-aktion="album">
      <span class="karten-rahmen">${karteSvg({ farben: kartenFarben(s, { gold: true }) })}</span>
      <span class="info">
        <span class="klein-titel">Deutschland vergolden</span>
        <span class="zahl">${n}<small> / 16</small></span>
        <span class="leise" style="font-size:14px;line-height:1.35">${n === 16 ? "Ganz Deutschland ist golden!" : "Schreib Land, Hauptstadt und alle Flüsse richtig, dann wird das Land golden."}</span>
        <span class="balken"><span style="display:block;height:100%;width:${(n / 16) * 100}%;background:var(--gold-dunkel);border-radius:6px"></span></span>
      </span>
    </button>
    <h2 class="missionen-titel">Profi-Missionen</h2>
    <div class="profi-missionen">${missionen}</div>
    <button class="karte-box abzeichen-karte" data-aktion="abzeichen">
      <span class="kopf"><span class="titel">Abzeichen</span><span class="link-text">${Object.keys(s.abzeichen).length} von ${ABZEICHEN.length} ${icon("arrow", 16)}</span></span>
      <span class="medaillen-reihe">${reihenfolge.slice(0, 6).map((a) => medaille(a, !!s.abzeichen[a.id], 44)).join("")}</span>
    </button>
  </div>`);
}

// ---------------------------------------------------------------- Quiz (Auswahl und Antippen)
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
  if (!runde || runde.beantwortet || runde.profi) return;
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

// Punkte, Serie und Wiederholung – gleich für normale und Profi-Fragen
function werte(f, gut, punkteWennGut) {
  let plus = 0, bonus = 0, nochmal = false;
  if (gut) {
    plus = punkteWennGut;
    if (!f.wiederholung) runde.erstRichtig++;
    runde.serie++;
    if (runde.serie >= 3 && runde.serie % 3 === 0) bonus = 5;
  } else {
    runde.serie = 0;
    runde.fehler = (runde.fehler ?? 0) + 1;
    if (!f.wiederholung) {
      runde.fragen.push({ ...(runde.profi ? profiFrage(f.fakt) : frageNochmal(f)), wiederholung: true });
      nochmal = true;
    }
  }
  runde.punkte += plus + bonus;
  return { plus: plus + bonus, bonus, nochmal };
}

function nachAntwort(gut, bonus) {
  app.querySelector("[data-punkte]").textContent = runde.punkte;
  klang(gut ? "richtig" : "falsch");
  if (bonus) {
    const serie = runde.serie; // Runde kann in den 350 ms schon beendet sein
    setTimeout(() => { toast(`${icon("flame", 20, { fill: "#F6B49F", sw: 1.8 })} ${serie} richtig in Folge! +5`); klang("serie"); }, 350);
  }
  requestAnimationFrame(() => skaliere(app));
}

function beantworte(gewaehlt) {
  if (runde.beantwortet) return;
  runde.beantwortet = true;
  const f = runde.fragen[runde.i];
  const gut = gewaehlt === f.richtig;
  sp.merkeAntwort(f.fakt, gut);
  const { plus, bonus, nochmal } = werte(f, gut, f.wiederholung || runde.tipp ? 5 : 10);

  const l = f.loesung(gewaehlt);
  app.querySelector(".quiz").classList.add("beantwortet");
  app.querySelector("[data-karte]").innerHTML = karteSvg(l.karte);

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

  const blatt = rueckmeldung({
    gut, titel: l.titel, plus: gut ? plus : 0,
    text: `${l.text}${nochmal ? " Die Frage kommt gleich noch einmal." : ""}`,
    letzte: runde.i === runde.fragen.length - 1,
  });
  const unten = app.querySelector("[data-unten]");
  if (f.typ === "tippen") unten.outerHTML = blatt;
  else unten.insertAdjacentHTML("afterend", blatt);
  nachAntwort(gut, bonus);
}

function naechsteFrage() {
  runde.i++;
  if (runde.i >= runde.fragen.length) zeigeErgebnis();
  else if (runde.profi) zeigeProfiFrage();
  else zeigeFrage();
}

function frageBeenden() {
  oeffneDialog(`<h2 id="dlg-titel">Runde beenden?</h2>
    <p>Deine Punkte aus dieser Runde bekommst du trotzdem.</p>
    <button class="knopf knopf-gruen" data-aktion="dialog-zu">Weiterspielen</button>
    <button class="knopf knopf-leise" data-aktion="runde-abbrechen">Beenden</button>`);
}

function rundeAbbrechen() {
  const warProfi = runde?.profi;
  if (runde) sp.setze({ punkte: sp.get().punkte + runde.punkte });
  if (warProfi) zeigeProfi();
  else zeigeStart();
}

// ---------------------------------------------------------------- Expertenmodus: Schreiben
function starteProfiRunde(mission) {
  const fragen = neueProfiRunde(mission);
  runde = {
    profi: true, mission, fragen, anzahl: fragen.length, i: 0, erstRichtig: 0, punkte: 0, serie: 0,
    fehler: 0, tippGenutzt: false, beantwortet: false, tipp: false,
  };
  zeigeProfiFrage();
}

function sammelChips(f, fehlend = []) {
  const leer = Math.max(0, f.ziel.length - f.gefunden.length - fehlend.length);
  return [
    ...f.gefunden.map((id) => `<span class="chip chip-gefunden">${icon("check", 15, { sw: 3 })}${esc(FLUESSE[id].name)}</span>`),
    ...fehlend.map((id) => `<span class="chip chip-fehlt">${esc(FLUESSE[id].name)}</span>`),
    ...Array(leer).fill('<span class="chip chip-leer" aria-hidden="true"></span>'),
  ].join("");
}

function zeigeProfiFrage() {
  const f = runde.fragen[runde.i];
  runde.beantwortet = false;
  runde.tipp = false;
  const sammler = f.typ === "sammler";
  if (sammler) f.gefunden = [];

  zeige(`<div class="quiz profi-quiz">
    ${quizKopf()}
    <div class="karte-box frage ton-${f.ton}">
      <span class="icon-kachel">${icon(f.icon, 22)}</span>
      <div class="frage-text">
        <div class="klein">${esc(f.klein)}</div>
        <div class="gross">${trenn(f.gross)}</div>
        <div class="muster" data-muster hidden></div>
      </div>
      ${sammler ? `<div class="zaehler" data-zaehler>0<small> / ${f.ziel.length}</small></div>` : ""}
    </div>
    <div class="karten-feld" data-karte>${karteSvg(sammler ? f.karte([]) : f.karte)}</div>
    ${sammler ? `<div class="chips sammel-chips" data-chips>${sammelChips(f)}</div>
      <div class="sammel-status" data-status role="status"></div>` : ""}
    <div data-unten>
      <form class="eingabe-zeile" data-form="${sammler ? "sammler" : "antwort"}" autocomplete="off">
        <label class="unsichtbar" for="antwort">Deine Antwort</label>
        <input id="antwort" class="feld" name="antwort" type="text" maxlength="40" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="go" placeholder="${esc(f.platzhalter)}">
        <button class="pruefen-knopf behalte-fokus" type="submit" aria-label="Prüfen">${icon("check", 26, { sw: 3 })}</button>
      </form>
      <div class="hilfe-zeile">
        <button class="text-knopf tipp-link behalte-fokus" type="button" data-aktion="profi-tipp">${icon("bulb", 18)}Tipp</button>
        <button class="text-knopf" type="button" data-aktion="${sammler ? "sammler-fertig" : "weiss-nicht"}">${sammler ? "Fertig" : "Weiß ich nicht"}</button>
      </div>
    </div>
  </div>`, { fix: true, schreiben: true });
  // Direkt im Klick fokussieren, sonst öffnet iOS die Tastatur nicht
  app.querySelector("#antwort").focus({ preventScroll: true });
}

function profiTipp(knopf) {
  const f = runde.fragen[runde.i];
  if (runde.beantwortet || runde.tipp) return;
  runde.tipp = true;
  runde.tippGenutzt = true;
  knopf.disabled = true;
  if (f.typ === "sammler") {
    const offen = f.ziel.filter((x) => !f.gefunden.includes(x));
    const s = app.querySelector("[data-status]");
    s.textContent = `Tipp: Ein Fluss beginnt mit „${FLUESSE[offen[0]].name[0]}“.`;
    s.className = "sammel-status neutral";
  } else {
    const m = muster(f.richtig);
    const el = app.querySelector("[data-muster]");
    el.hidden = false;
    el.innerHTML = `${esc(m.text)} <span>· ${m.anzahl} Buchstaben</span>`;
  }
  app.querySelector("#antwort")?.focus({ preventScroll: true });
  requestAnimationFrame(() => skaliere(app));
}

function textAntwort(eingabe) {
  if (!runde?.profi || runde.beantwortet) return;
  const f = runde.fragen[runde.i];
  const r = pruefe(eingabe, f.kategorie, f.ziel);
  if (r.art === "leer") return wackle(app.querySelector("#antwort"));
  profiAufloesen(f, r, eingabe);
}

function profiAufloesen(f, r, eingabe) {
  runde.beantwortet = true;
  document.activeElement?.blur();
  const gut = r.art === "perfekt" || r.art === "schreibweise";
  sp.merkeAntwort(f.fakt, gut);
  sp.merkeSchreibweise(r.art === "perfekt");
  const punkteWennGut = f.wiederholung ? PUNKTE.wiederholung : runde.tipp ? PUNKTE.mitTipp : PUNKTE[r.art];
  const { plus, bonus, nochmal } = werte(f, gut, punkteWennGut);

  const l = f.loesung();
  app.querySelector(".quiz").classList.add("beantwortet");
  app.querySelector("[data-karte]").innerHTML = karteSvg(l.karte);

  const titel = { perfekt: "Richtig!", schreibweise: "Richtig! Fast perfekt.", falsch: "Nicht ganz.", "weiss-nicht": `Das ist ${f.richtig}.` }[r.art];
  const vergleich = r.art === "schreibweise" || r.art === "falsch"
    ? `<div class="vergleich"><span class="leise">Du:</span><span>${esc(eingabe.trim())}</span><span class="leise">Richtig:</span><b>${markiere(eingabe, f.richtig)}</b></div>`
    : "";
  const hinweis = r.art === "schreibweise"
    ? `Achte auf die markierten Buchstaben. Perfekt geschrieben gibt ${PUNKTE.perfekt} Punkte.`
    : r.art === "falsch" ? anderesText(r.anderes, f) : "";
  const text = [hinweis, l.text, nochmal ? "Die Frage kommt gleich noch einmal." : ""].filter(Boolean).join(" ");

  app.querySelector("[data-unten]").outerHTML = rueckmeldung({
    gut, titel, plus: gut ? plus : 0, text, extra: vergleich, letzte: runde.i === runde.fragen.length - 1,
  });
  nachAntwort(gut, bonus);
}

function sammlerEingabe(eingabe, form) {
  if (!runde?.profi || runde.beantwortet) return;
  const f = runde.fragen[runde.i];
  const feld = form.querySelector("input");
  const r = pruefeSammler(eingabe, f.land, f.gefunden);
  if (r.art === "leer") return wackle(feld);
  const land = LAND[f.land].name;
  const name = r.fluss ? FLUESSE[r.fluss].name : "";
  let meldung, art = "schlecht";
  if (r.art === "neu") {
    f.gefunden.push(r.fluss);
    sp.merkeSchreibweise(r.perfekt);
    runde.punkte += PUNKTE.flussGefunden;
    meldung = `${name} gefunden! +${PUNKTE.flussGefunden}${r.perfekt ? "" : ` · So schreibt man es: ${name}`}`;
    art = "gut";
    klang("richtig");
  } else if (r.art === "doppelt") {
    meldung = `${name} hast du schon.`;
    art = "neutral";
  } else if (r.art === "grenz") {
    meldung = `${mitArtikel(r.fluss, true)} berührt ${land} nur am Rand. Zählt hier nicht.`;
    art = "neutral";
  } else if (r.art === "nicht-hier") {
    meldung = `${mitArtikel(r.fluss, true)} fließt nicht durch ${land}.`;
    klang("falsch");
  } else {
    const was = { stadt: "eine Stadt", land: "ein Bundesland" }[r.anderes?.kat];
    meldung = was ? `${r.anderes.name} ist ${was}, kein Fluss.` : "Diesen Fluss kenne ich nicht. Prüf die Schreibweise.";
  }
  const status = app.querySelector("[data-status]");
  status.textContent = meldung;
  status.className = `sammel-status ${art}`;
  if (art === "schlecht") wackle(feld);
  feld.value = "";

  app.querySelector("[data-chips]").innerHTML = sammelChips(f);
  app.querySelector("[data-zaehler]").innerHTML = `${f.gefunden.length}<small> / ${f.ziel.length}</small>`;
  app.querySelector("[data-karte]").innerHTML = karteSvg(f.karte(f.gefunden));
  app.querySelector("[data-punkte]").textContent = runde.punkte;
  requestAnimationFrame(() => skaliere(app));

  if (f.gefunden.length === f.ziel.length) sammlerAbschluss(true);
  else feld.focus({ preventScroll: true });
}

function sammlerAbschluss(komplett) {
  if (!runde?.profi || runde.beantwortet) return;
  runde.beantwortet = true;
  document.activeElement?.blur();
  const f = runde.fragen[runde.i];
  const land = LAND[f.land].name;
  const fehlend = f.ziel.filter((x) => !f.gefunden.includes(x));
  sp.merkeAntwort(f.fakt, komplett);
  const { plus, bonus, nochmal } = werte(f, komplett, f.wiederholung ? PUNKTE.wiederholung : PUNKTE.alleGefunden);

  app.querySelector(".quiz").classList.add("beantwortet");
  app.querySelector("[data-karte]").innerHTML = karteSvg(f.karte(f.gefunden, fehlend));
  app.querySelector("[data-chips]").innerHTML = sammelChips(f, fehlend);
  app.querySelector("[data-status]").remove();
  const namen = (ids) => liste(ids.map((id) => FLUESSE[id].name));
  const text = komplett
    ? `Durch ${land} ${f.ziel.length > 1 ? `fließen ${namen(f.ziel)}` : `fließt ${mitArtikel(f.ziel[0])}`}.`
    : `Es ${fehlend.length > 1 ? "fehlen" : "fehlt"} noch: ${namen(fehlend)}.${nochmal ? " Die Frage kommt gleich noch einmal." : ""}`;
  app.querySelector("[data-unten]").outerHTML = rueckmeldung({
    gut: komplett,
    titel: komplett ? "Alle gefunden!" : `${f.gefunden.length} von ${f.ziel.length} gefunden`,
    plus: komplett ? plus : 0, text, letzte: runde.i === runde.fragen.length - 1,
  });
  nachAntwort(komplett, bonus);
}

// ---------------------------------------------------------------- Ergebnis
function zeigeErgebnis() {
  const profi = !!runde.profi;
  const quote = runde.erstRichtig / runde.anzahl;
  const anzahlSterne = quote >= 0.9 ? 3 : quote >= 0.7 ? 2 : quote >= 0.4 ? 1 : 0;
  runde.punkte += profi ? PUNKTE.runde : 10; // Bonus fürs Durchspielen

  const s = sp.get();
  const rangVorher = sp.rang().name;
  const bestwert = (alt) => ({ ...alt, [runde.mission]: Math.max(alt[runde.mission] ?? 0, anzahlSterne) });
  if (profi) sp.setze({ punkte: s.punkte + runde.punkte, profi: { ...s.profi, sterne: bestwert(s.profi.sterne) } });
  else sp.setze({ punkte: s.punkte + runde.punkte, sterne: bestwert(s.sterne) });
  sp.spieltagZaehlen();
  const neu = profi ? [] : sp.neueStempel();
  const neuGold = profi ? sp.neueGoldStempel() : [];
  const neueAbz = vergibAbzeichen(profi ? { sterne: anzahlSterne, fehler: runde.fehler, tippGenutzt: runde.tippGenutzt } : null);
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
    ${neueAbz.length ? `<div class="karte-box neue-abzeichen">
      <div class="klein-titel">${neueAbz.length === 1 ? "Neues Abzeichen" : "Neue Abzeichen"}</div>
      <div class="abz-reihe">${neueAbz.map((a) => `<span class="abz-mini">${medaille(a, true, 48)}<span>${esc(a.name)}</span></span>`).join("")}</div>
    </div>` : ""}
    ${profi ? goldKarte(neuGold) : ergebnisKarte(neu)}
    <div class="rang-fortschritt">
      <div class="zeile"><span>${neuerRang ? `Neuer Rang: ${r.name}!` : r.name}</span><span class="leise">${r.naechster ? `noch ${r.fehlt} bis ${r.naechster.name}` : "Höchster Rang!"}</span></div>
      <div class="balken"><div style="width:${Math.round(r.anteil * 100)}%"></div></div>
    </div>
    <div class="knoepfe">
      <button class="knopf knopf-haupt" data-aktion="mission" data-wert="${runde.mission}">${icon("replay", 20, { sw: 2.6 })}Nochmal spielen</button>
      <button class="knopf knopf-leise" data-aktion="${profi ? "profi" : "start"}">${profi ? "Zum Expertenmodus" : "Zur Übersicht"}</button>
    </div>
  </div>`);

  klang("fertig");
  if (anzahlSterne >= 2 || neu.length || neuGold.length || neueAbz.length || neuerRang) setTimeout(() => konfetti(), 250);
}

function ergebnisKarte(neu) {
  const s = sp.get();
  const farben = kartenFarben(s);
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
      <div><div class="klein-titel">Geschafft</div><h2>Alle 16 bunt!</h2><p>${sp.profiFrei(s) ? "Probier jetzt den Expertenmodus aus." : "Übe weiter, damit alles sicher sitzt."}</p></div>
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

function goldKarte(neu) {
  const s = sp.get();
  const farben = kartenFarben(s, { gold: true });
  if (neu.length) {
    return `<div class="karte-box neu-karte">
      <span class="karten-rahmen">${karteSvg({ farben, ringe: neu.flatMap(markRing) })}</span>
      <div><div class="klein-titel">Neu vergoldet</div><h2>${neu.map((id) => trenn(LAND[id].name)).join(", ")}</h2>
      <p>Name, Hauptstadt und Flüsse richtig geschrieben. Goldstempel im Sammelalbum!</p></div>
    </div>`;
  }
  if (s.goldStempel.length === 16) {
    return `<div class="karte-box neu-karte">
      <span class="karten-rahmen">${karteSvg({ farben })}</span>
      <div><div class="klein-titel">Unglaublich</div><h2>Ganz Deutschland golden!</h2><p>${sp.nachAnrede({ w: "Du bist eine echte Deutschland-Expertin.", m: "Du bist ein echter Deutschland-Experte.", n: "Du bist ein echtes Deutschland-Ass." })}</p></div>
    </div>`;
  }
  const kandidaten = LAENDER.filter((l) => !s.goldStempel.includes(l.id)).map((l) => {
    const st = sp.landGoldStatus(l);
    const fehlt = [!st.land && "Name", !st.stadt && "Hauptstadt", st.fluesse === false && "alle Flüsse"].filter(Boolean);
    return { l, fehlt };
  }).sort((a, b) => a.fehlt.length - b.fehlt.length);
  const { l, fehlt } = kandidaten[0];
  return `<div class="karte-box neu-karte">
    <span class="karten-rahmen">${karteSvg({ farben, zustand: { [l.id]: "mark" }, ringe: markRing(l.id) })}</span>
    <div><div class="klein-titel">${fehlt.length === 1 ? "Fast golden" : "Als Nächstes golden"}</div><h2>${trenn(l.name)}</h2>
    <p>Noch offen: ${liste(fehlt)}. Dann wird das Land golden.</p></div>
  </div>`;
}

// ---------------------------------------------------------------- Album
function zeigeAlbum() {
  const s = sp.get();
  const frei = sp.profiFrei(s);
  const punkt = (an) => `<span class="punkt${an ? " an" : ""}"></span>`;
  const stempel = LAENDER.slice().sort((a, b) => a.reihe - b.reihe).map((l) => {
    const voll = s.stempel.includes(l.id);
    const gold = s.goldStempel.includes(l.id);
    const st = sp.landStatus(l);
    const [x0, y0, x1, y1] = KARTE.laender[l.id].box;
    const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
    const vb = [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map((v) => v.toFixed(1)).join(" ");
    const fuellung = gold ? GOLD : voll ? STIFT[l.id] : "#E4D9C2";
    return `<button class="stempel${voll ? " voll" : ""}${gold ? " gold" : ""}" data-aktion="land-info" data-wert="${l.id}" aria-label="${esc(l.name)}${gold ? ", Goldstempel" : voll ? ", Stempel gesammelt" : ""}">
      ${gold ? `<span class="krone">${icon("crown", 16)}</span>` : ""}
      <svg viewBox="${vb}" aria-hidden="true"><path d="${KARTE.laender[l.id].d}" fill="${fuellung}" fill-rule="evenodd" stroke="${voll || gold ? "#1E2A4A" : "#C9BC9F"}" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
      <span class="name">${trenn(l.name)}</span>
      <span class="punkte">${punkt(st.lage)}${punkt(st.hauptstadt)}${st.fluesse === null ? "" : punkt(st.fluesse)}</span>
    </button>`;
  }).join("");

  zeige(`<div class="album">
    <div class="album-kopf"><button class="icon-knopf" data-aktion="start" aria-label="Zurück">${icon("back", 24, { sw: 2.4 })}</button><h1>Mein Sammelalbum</h1></div>
    <div class="leise" style="font-size:16px;line-height:1.4">${s.stempel.length} von 16 Stempeln${frei ? `, ${s.goldStempel.length} davon golden` : ""}. Tippe auf ein Land, um es zu lernen.</div>
    <div class="legende">
      <span>${punkt(true)}Lage</span><span>${punkt(true)}Hauptstadt</span><span>${punkt(true)}Flüsse</span>
      ${frei ? `<span class="gold-legende">${icon("crown", 15)}Gold: im Expertenmodus geschrieben</span>` : ""}
    </div>
    <div class="stempel-raster">${stempel}</div>
  </div>`);
}

function landInfo(l) {
  const flussChips = l.fluesse.length
    ? `<div class="chips">${l.fluesse.map((f) => `<span class="chip">${esc(FLUESSE[f].name)}</span>`).join("")}</div>`
    : `<div class="leise" style="font-size:15px">Keiner der 22 Flüsse aus dem Quiz</div>`;
  return `
    <div class="info-zeile"><span class="icon-kachel ton-lila">${icon("castle", 20)}</span><div><div class="was">Hauptstadt</div>${esc(l.hauptstadt)}</div></div>
    <div class="info-zeile"><span class="icon-kachel ton-blau">${icon("waves", 20)}</span><div><div class="was">Flüsse</div>${flussChips}</div></div>
    <p>${esc(l.fakt)}</p>`;
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

// ---------------------------------------------------------------- Abzeichen
function zeigeAbzeichen() {
  const s = sp.get();
  const datum = (ts) => new Date(ts).toLocaleDateString("de-DE", { day: "numeric", month: "numeric", year: "2-digit" });
  const karten = ABZEICHEN.map((a) => {
    const an = !!s.abzeichen[a.id];
    let fuss = "";
    if (an) fuss = `<span class="verdient">Verdient am ${datum(s.abzeichen[a.id])}</span>`;
    else if (a.stand) {
      const [ist, ziel] = a.stand(s);
      fuss = `<span class="balken klein"><span style="width:${Math.round((ist / ziel) * 100)}%"></span></span><span class="stand">${ist} / ${ziel}</span>`;
    }
    return `<div class="abzeichen${an ? " an" : ""}">
      ${medaille(a, an, 62)}
      <span class="name">${esc(a.name)}</span>
      <span class="text">${esc(a.text)}</span>
      ${fuss}
    </div>`;
  }).join("");

  zeige(`<div class="album">
    <div class="album-kopf"><button class="icon-knopf" data-aktion="${sp.profiFrei(s) ? "profi" : "start"}" aria-label="Zurück">${icon("back", 24, { sw: 2.4 })}</button><h1>Abzeichen</h1></div>
    <div class="leise" style="font-size:16px;line-height:1.4;margin-bottom:14px">${Object.keys(s.abzeichen).length} von ${ABZEICHEN.length} verdient. Unter jedem Abzeichen steht, was du dafür tun musst.</div>
    <div class="abzeichen-raster">${karten}</div>
  </div>`);
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
    <div class="karte-box titel-zeile" role="radiogroup" aria-labelledby="titel-label">
      <span id="titel-label">Titel</span>
      <div class="segmente">${Object.entries(ANREDEN).map(([k, a]) => `<button class="segment" role="radio" aria-checked="${s.anrede === k}" data-aktion="anrede-einstellung" data-wert="${k}">${trenn(a.titel)}</button>`).join("")}</div>
    </div>
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
  profi: () => zeigeProfi(),
  abzeichen: () => zeigeAbzeichen(),
  mission: (wert) => (wert.startsWith("profi-") ? starteProfiRunde(wert) : starteRunde(wert)),
  antwort: (wert) => beantworte(wert),
  "karte-tipp": (_, __, e) => karteTipp(e),
  tipp: (_, el) => tippGeben(el),
  "profi-tipp": (_, el) => profiTipp(el),
  "weiss-nicht": () => { if (runde?.profi && !runde.beantwortet) profiAufloesen(runde.fragen[runde.i], { art: "weiss-nicht" }, ""); },
  "sammler-fertig": () => sammlerAbschluss(false),
  weiter: () => naechsteFrage(),
  beenden: () => frageBeenden(),
  "runde-abbrechen": () => rundeAbbrechen(),
  album: () => zeigeAlbum(),
  "land-info": (wert) => zeigeLandDialog(wert),
  erkunden: () => zeigeErkunden(),
  "erkunden-tipp": (_, __, e) => erkundenTipp(e),
  einstellungen: () => zeigeEinstellungen(),
  "dialog-zu": () => schliesseDialog(),
  anrede: (wert) => { sp.setze({ anrede: wert }); zeigeStart(); },
  "anrede-einstellung": (wert, el) => {
    sp.setze({ anrede: wert });
    for (const b of el.parentElement.children) b.setAttribute("aria-checked", String(b === el));
    const rangZeile = app.querySelector(".start-kopf .rang");
    if (rangZeile) rangZeile.textContent = `${sp.rang().name} · ${sp.get().punkte} Punkte`;
  },
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

// Tipp- und Prüfen-Knopf nehmen dem Eingabefeld nicht den Fokus, damit die Tastatur offen bleibt
document.addEventListener("mousedown", (e) => {
  if (e.target.closest(".behalte-fokus")) e.preventDefault();
});

document.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const daten = new FormData(form);
  if (form.dataset.form === "antwort") return textAntwort(String(daten.get("antwort") ?? ""));
  if (form.dataset.form === "sammler") return sammlerEingabe(String(daten.get("antwort") ?? ""), form);
  const name = daten.get("name")?.toString().trim();
  if (!name) return;
  sp.setze({ name });
  zeigeStart();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") schliesseDialog();
});

// Sichtbarer Bereich: Auf dem iPhone verdeckt die Tastatur fast die halbe Höhe.
// Beim Schreiben passt sich die Seite deshalb an den wirklich sichtbaren Teil an.
const vv = window.visualViewport;
let resizeTimer, volleHoehe = 0, letzteBreite = 0;
function passeSichtbereich() {
  if (vv) {
    if (vv.width !== letzteBreite) { letzteBreite = vv.width; volleHoehe = 0; }
    volleHoehe = Math.max(volleHoehe, vv.height);
    const root = document.documentElement;
    root.style.setProperty("--sicht-h", `${Math.round(vv.height)}px`);
    root.style.setProperty("--sicht-oben", `${Math.round(vv.offsetTop)}px`);
    root.classList.toggle("tastatur-offen", volleHoehe - vv.height > 150);
  }
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => skaliere(document), 60);
}
vv?.addEventListener("resize", passeSichtbereich);
vv?.addEventListener("scroll", passeSichtbereich);
window.addEventListener("resize", passeSichtbereich);
passeSichtbereich();
document.fonts?.ready.then(() => skaliere(document));

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

if (sp.get().name) zeigeStart();
else zeigeWillkommen();

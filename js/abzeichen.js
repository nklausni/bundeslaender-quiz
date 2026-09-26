// Abzeichen für den Expertenmodus. Einige lassen sich auch mit bisherigem Fortschritt verdienen
// (Deutschland bunt, Eine Woche dabei, 2000er-Club) und werden nach dem Update sofort vergeben.
import { LAENDER, FLUESSE } from "./daten.js";
import * as sp from "./speicher.js";

const geschrieben = (praefix, ids) => ids.filter((id) => sp.faktStat(praefix + id).richtig >= 1).length;
const LAND_IDS = LAENDER.map((l) => l.id);
const MIT_FLUSS = LAENDER.filter((l) => l.fluesse.length).map((l) => l.id);

// stand(s) -> [erreicht, Ziel] für Fortschrittsbalken; runde(r) prüft das Ergebnis einer Profi-Runde
export const ABZEICHEN = [
  { id: "bunt", name: "Deutschland bunt", text: "Alle 16 Länder ausgemalt", icon: "star", farbe: "koralle",
    stand: (s) => [s.stempel.length, 16] },
  { id: "profi-start", name: "Profi-Start", text: "Erste Profi-Runde geschafft", icon: "pencil", farbe: "lila",
    runde: () => true },
  { id: "laender", name: "Länder-Profi", text: "Alle 16 Länder richtig geschrieben", icon: "pin", farbe: "koralle",
    stand: () => [geschrieben("profi:land:", LAND_IDS), 16] },
  { id: "staedte", name: "Hauptstadt-Profi", text: "Alle 16 Hauptstädte richtig geschrieben", icon: "castle", farbe: "lila",
    stand: () => [geschrieben("profi:stadt:", LAND_IDS), 16] },
  { id: "fluesse", name: "Fluss-Profi", text: `Alle ${Object.keys(FLUESSE).length} Flüsse richtig geschrieben`, icon: "waves", farbe: "blau",
    stand: () => [geschrieben("profi:fluss:", Object.keys(FLUESSE)), Object.keys(FLUESSE).length] },
  { id: "sammler", name: "Sammel-Ass", text: "Bei 5 Ländern alle Flüsse gefunden", icon: "target", farbe: "gruen",
    stand: () => [Math.min(5, geschrieben("profi:sammler:", MIT_FLUSS)), 5] },
  { id: "ass", name: "Rechtschreib-Ass", text: "10 Antworten hintereinander ohne Schreibfehler", icon: "medal", farbe: "gruen",
    stand: (s) => [Math.min(10, s.profi.besteFolge), 10] },
  { id: "ohne-tipp", name: "Ganz ohne Tipp", text: "Profi-Runde mit 3 Sternen, ohne Tipp", icon: "bulb", farbe: "gold",
    runde: (r) => r.sterne === 3 && !r.tippGenutzt },
  { id: "perfekt", name: "Perfekte Runde", text: "Profi-Runde ganz ohne Fehler", icon: "crown", farbe: "blau",
    runde: (r) => r.fehler === 0 },
  { id: "woche", name: "Eine Woche dabei", text: "7 Tage in Folge geübt", icon: "flame", farbe: "koralle",
    stand: (s) => [Math.min(7, Math.max(s.serie.beste ?? 0, sp.aktuelleSerie())), 7] },
  { id: "punkte", name: "2000er-Club", text: "2000 Punkte gesammelt", icon: "star", farbe: "gold",
    stand: (s) => [Math.min(2000, s.punkte), 2000] },
  { id: "gold", name: "Goldenes Deutschland", text: "Alle 16 Länder vergoldet", icon: "crown", farbe: "gold",
    stand: (s) => [s.goldStempel.length, 16] },
];

/**
 * Vergibt alle neu erreichten Abzeichen und gibt sie zurück.
 * @param {{sterne:number, fehler:number, tippGenutzt:boolean}|null} runde  Ergebnis einer Profi-Runde
 */
export function vergibAbzeichen(runde = null) {
  const s = sp.get();
  const neu = ABZEICHEN.filter((a) => {
    if (s.abzeichen[a.id]) return false;
    if (a.stand) { const [ist, ziel] = a.stand(s); return ist >= ziel; }
    return !!runde && a.runde(runde);
  });
  if (neu.length) {
    const jetzt = Date.now();
    sp.setze({ abzeichen: { ...s.abzeichen, ...Object.fromEntries(neu.map((a) => [a.id, jetzt])) } });
  }
  return neu;
}

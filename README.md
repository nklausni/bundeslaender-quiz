# Bundesländer-Quiz

Ein Lernspiel für Kinder: die 16 Bundesländer, ihre Hauptstädte und die Flüsse Deutschlands, immer mit Blick auf die Karte. Die Inhalte folgen dem Arbeitsblatt „Deutschland: Bundesländer, Landeshauptstädte und Flüsse“ (Flüsse A bis V).

Das Quiz ist für das iPhone SE (375 × 667 Punkte) ausgelegt und läuft in jedem aktuellen Browser.

## Spielen

- **Wo liegt das?** Bundesland auf der Karte antippen oder ein markiertes Land erkennen
- **Hauptstädte** Hauptstadt zum Land und Land zur Hauptstadt
- **Flüsse** Fluss auf der Karte erkennen, Fluss zu Land und Land zu Fluss
- **Große Prüfung** alles gemischt
- **Karte erkunden** und **Sammelalbum** zum Nachschlagen und Lernen

Motivation: Punkte, Ränge, Sterne pro Mission, Tage in Folge und ein Deutschlandbild, das sich Land für Land bunt ausmalt, sobald Lage, Hauptstadt und Flüsse sitzen. Falsch beantwortete Fragen kommen in derselben Runde noch einmal.

Auf dem iPhone in Safari „Teilen“ → „Zum Home-Bildschirm“ wählen, dann startet das Quiz im Vollbild und funktioniert auch offline.

Der Fortschritt bleibt im `localStorage` des Geräts. Es gibt keinen Server, kein Tracking und keine externen Anfragen (Schriften liegen im Repo).

## Lokal starten

```bash
python3 -m http.server 8742
```

Dann http://localhost:8742 öffnen. Es gibt keinen Build-Schritt, nur HTML, CSS und JavaScript-Module.

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/daten.js` | Bundesländer, Hauptstädte, Flüsse, Merksätze |
| `js/quiz.js` | Fragetypen, Auswahl der Fragen, falsche Antwortmöglichkeiten |
| `js/speicher.js` | Fortschritt, Lernkartei-Fächer, Stempel, Ränge |
| `js/karte.js` | SVG-Karte zeichnen und Antippen erkennen |
| `js/karte-daten.js` | erzeugte Kartengeometrie (nicht von Hand bearbeiten) |
| `js/app.js` | Bildschirme und Ablauf |
| `sw.js` | Offline-Cache. Nach Änderungen `VERSION` hochzählen |

## Karte neu erzeugen

Die Geometrie in `js/karte-daten.js` stammt aus freien Quellen:

- Ländergrenzen: [deutschlandGeoJSON](https://github.com/isellsoap/deutschlandGeoJSON) (`2_bundeslaender/3_mittel.geo.json` → `states.geojson`)
- Flüsse: [Natural Earth](https://www.naturalearthdata.com/) `ne_10m_rivers_lake_centerlines` → `rivers.geojson` und `ne_10m_rivers_europe` → `rivers_eu.geojson`
- Havel, Leine, Lahn, Werra, Mulde: © [OpenStreetMap](https://www.openstreetmap.org/copyright)-Mitwirkende (ODbL), Overpass-Export → `osm_rivers.json`

Dateien nach `tools/quellen/` legen, dann:

```bash
cd tools && npm install && npm run karte
```

## Abweichungen vom ausgefüllten Arbeitsblatt

Das Quiz fragt die Flüsse so ab, wie sie auf der Karte des Arbeitsblatts eingezeichnet sind:

- **Niedersachsen:** Weser, Ems, Aller, Leine und Elbe (Aller und Leine fließen laut Karte durch Niedersachsen, die Elbe bildet die Grenze)
- **Berlin:** Spree und Havel. Die Elbe fließt nicht durch Berlin.
- **Saarland:** kein Fluss aus der Liste (Saarbrücken liegt an der Saar)

Flüsse, die ein Land nur am Rand berühren (etwa die Lahn in Nordrhein-Westfalen), werden weder abgefragt noch als falsche Antwort angeboten.

Schriften: [Grandstander](https://fonts.google.com/specimen/Grandstander) und [Nunito](https://fonts.google.com/specimen/Nunito), beide unter der SIL Open Font License.

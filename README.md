# Bundesländer-Quiz

Ein Lernspiel für Kinder: die 16 Bundesländer, ihre Hauptstädte und 22 große Flüsse Deutschlands, immer mit Blick auf die Karte. Frei nutzbar, ohne Anmeldung und ohne Werbung.

Das Quiz ist für das iPhone SE (375 × 667 Punkte) ausgelegt und läuft in jedem aktuellen Browser.

## Spielen

- **Wo liegt das?** Bundesland auf der Karte antippen oder ein markiertes Land erkennen
- **Hauptstädte** Hauptstadt zum Land und Land zur Hauptstadt
- **Flüsse** Fluss auf der Karte erkennen, Fluss zu Land und Land zu Fluss
- **Große Prüfung** alles gemischt
- **Karte erkunden** und **Sammelalbum** zum Nachschlagen und Lernen

Motivation: Punkte, Ränge, Sterne pro Mission, Tage in Folge und ein Deutschlandbild, das sich Land für Land bunt ausmalt, sobald Lage, Hauptstadt und Flüsse sitzen. Falsch beantwortete Fragen kommen in derselben Runde noch einmal.

Die Titel gibt es in drei Formen (Entdeckerin, Entdecker, Entdeckungs-Profi). Nach der Namenseingabe sucht sich das Kind die Form selbst aus, änderbar in den Einstellungen. Die App schließt nicht vom Namen auf das Geschlecht.

### Expertenmodus

Wird frei ab 8 Stempeln oder 600 Punkten. Statt auszuwählen werden die Namen selbst geschrieben:

- **Länder, Hauptstädte, Flüsse schreiben** mit Karte als Hinweis
- **Flüsse-Sammler** alle Flüsse eines Landes nennen, einer nach dem anderen
- **Profi-Prüfung** alles gemischt

Kleine Schreibfehler zählen als richtig (15 statt 20 Punkte), die falschen Buchstaben werden markiert. „ue“ statt „ü“ und Leerzeichen statt Bindestrich gehen auch. Kurze Namen (Inn, Main, Kiel) müssen stimmen, und ein anderer echter Name zählt nie (Mainz ist nicht der Main).

Neue Ziele: Goldstempel („Deutschland vergolden“, wenn Name, Hauptstadt und alle Flüsse eines Landes geschrieben sind), 12 Abzeichen in `js/abzeichen.js` und Ränge bis 5000 Punkte.

### Fortschritt bei Updates

Der Spielstand liegt unter dem Schlüssel `bundeslaender-quiz-v1`. Neue Versionen ergänzen fehlende Felder (`migriere()` in `js/speicher.js`), vorhandene Werte werden nie überschrieben. Vor jedem Umbau auf ein neues Format legt die App eine unveränderte Kopie ab (`bundeslaender-quiz-sicherung` für das erste Format, danach `…-sicherung-schema2` usw.).

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
| `js/profi.js` | Expertenmodus: Freitext-Fragen, Flüsse-Sammler, Prüfung der Schreibweise |
| `js/abzeichen.js` | Abzeichen und ihre Bedingungen |
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

## Welche Flüsse abgefragt werden

Elbe, Havel, Oder, Ems, Weser, Aller, Leine, Lippe, Saale, Spree, Neiße, Rhein, Fulda, Mulde, Lahn, Werra, Mosel, Main, Neckar, Donau, Isar und Inn.

Pro Land gelten die Flüsse, die wirklich hindurchfließen (`fluesse` in `js/daten.js`). Flüsse, die ein Land nur am Rand berühren oder dort entspringen (`grenz`, etwa die Lahn in Nordrhein-Westfalen), werden weder abgefragt noch als falsche Antwort angeboten. So hat keine Frage zwei richtige Lösungen. Durch das Saarland fließt keiner der 22 Flüsse, Saarbrücken liegt an der Saar.

Schriften: [Grandstander](https://fonts.google.com/specimen/Grandstander) und [Nunito](https://fonts.google.com/specimen/Nunito), beide unter der SIL Open Font License.

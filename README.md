# Klimperkiste 🎵

Ein einfaches Soundboard für Babys (ab ca. 9 Monaten): 9 große Kacheln, 9 kurze Melodien.
Läuft als installierbare Web-App (PWA) auf **iPad, iPhone und Android**, komplett offline,
ohne Werbung und ohne Datenerhebung.

## Funktionen (Version 0.1)

- 3×3-Raster mit großen, kontrastreichen Kacheln
- Antippen spielt eine Melodie **bis zum Ende**. Währenddessen wird jedes weitere Antippen ignoriert (nie mehrere Sounds gleichzeitig).
- **Kindermodus**: kein Zoomen, Scrollen, Markieren oder Kontextmenü
- **Elternbereich**: Schloss unten rechts 2,5 s gedrückt halten, dann eine Rechenaufgabe lösen
- Funktioniert nach dem ersten Öffnen **ohne Internet**
- Platzhalter für die spätere Bilder-Erweiterung, die die Eltern einschalten können

## Die Melodien

Alle Melodien sind gemeinfrei, und die Klänge werden per Skript synthetisch erzeugt (`tools/generate_sounds.py`). Es gibt also keine Lizenzfragen.

| # | Kachel | Melodie | Instrument |
|---|--------|---------|------------|
| 1 | Tropfen | Alle meine Entchen | Xylophon |
| 2 | Sonne | Hänschen klein | Spieluhr |
| 3 | Stern | Morgen kommt der Weihnachtsmann (Twinkle Twinkle) | Glockenspiel |
| 4 | Glocke | Bruder Jakob | Marimba |
| 5 | Blume | Old MacDonald | Ukulele |
| 6 | Wolke | Mary hat ein kleines Lamm | Klavier |
| 7 | Herz | Ode an die Freude | Flöte |
| 8 | Mond | Guten Abend, gut' Nacht (Brahms) | Spieluhr |
| 9 | Regenbogen | London Bridge | Xylophon |

## Auf das iPad bringen

1. Der Code wird mit jedem Push auf `main` automatisch über **GitHub Pages** veröffentlicht (`.github/workflows/pages.yml`).
   Einmalig nötig: im Repo unter *Settings → Pages → Source* „GitHub Actions“ auswählen.
2. Auf dem iPad die Pages-Adresse in **Safari** öffnen, dann Teilen-Symbol → **„Zum Home-Bildschirm“**.
3. Die App einmal mit Internet starten. Danach sind alle Sounds offline gespeichert.
4. Für eine vollständige Kindersicherung zusätzlich **Geführter Zugriff** nutzen
   (Einstellungen → Bedienungshilfen → Geführter Zugriff).

Auf Android: die Adresse in Chrome öffnen, dann Menü ⋮ → „App installieren“.

## Entwicklung

Voraussetzungen: Node.js 20+ (für TypeScript) sowie Python 3 mit numpy/scipy/Pillow und ffmpeg (nur für die Generator-Skripte).

```bash
npm install          # TypeScript installieren
npm run build        # src/*.ts → public/js/
npm run serve        # lokal unter http://localhost:8080
npm run sounds       # Melodien neu erzeugen (public/sounds/)
npm run icons        # App-Icons neu erzeugen (public/icons/)
```

**Eigene Sounds hinzufügen:** MP3 nach `public/sounds/` legen, einen Eintrag in `src/tracks.ts` ergänzen,
die Datei in `public/sw.js` unter `ASSETS` eintragen und `CACHE_VERSION` erhöhen.

### Aufbau

```
src/app.ts        Soundboard, Kindermodus, Elternbereich
src/player.ts     Audio (Web Audio API, immer nur ein Sound)
src/tracks.ts     Die 9 Kacheln: Farben, Formen, Sounddateien
public/           Alles, was ausgeliefert wird (HTML, CSS, Sounds, Icons, Service Worker)
tools/            Generatoren für Sounds und Icons
docs/konzept.md   Produktkonzept und Roadmap
```

## Warum eine Web-App (PWA)?

Ohne Mac und ohne Apple-Developer-Account (99 €/Jahr) lässt sich keine native iOS-App bauen und installieren.
Eine PWA läuft auf iPad, iPhone und Android, kostet nichts, funktioniert offline und
lässt sich später mit **Capacitor** in echte Store-Apps verpacken, ohne den Code neu zu schreiben.

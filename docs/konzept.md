# Klimperkiste – Produktkonzept

**Stand:** 17.11.2026 · **Product Owner:** Kai Wendt

## Ziel

Ein Soundboard für Babys (ca. 9 Monate), das das Kind selbst bedienen kann, während meist ein Elternteil daneben sitzt.
Hauptgerät ist ein iPad, die App soll aber auch auf iPhone und Android laufen. Zunächst nur für den **privaten Gebrauch**.

## Marktrecherche (Kurzfassung)

Es gibt reichlich Konkurrenz:
- **Soundboards:** Happytouch Baby Sound-Board, Heyduda! Die Kuh macht Muh, Miga Baby, Toddler Sound 123, Basic Sounds
- **„Hören → Bild antippen“:** Sound Touch Lingo Quiz, Domi Domi Listen & Guess, Tilo Touch, Guess the sounds, Listen & Learn

**Entscheidung:** Vorerst privat, keine Monetarisierung. Eine Veröffentlichung kann später neu bewertet werden.

## Technik-Entscheidung

| Kriterium | Ergebnis |
|---|---|
| Kein Mac, kein Apple-Developer-Account | Native iOS-App ist nicht direkt möglich |
| **Gewählt: Progressive Web App (TypeScript)** | Läuft auf iPad, iPhone und Android, kostenlos, offline-fähig |
| Hosting | GitHub Pages (automatisch per GitHub Actions) |
| Spätere Store-Version | Mit Capacitor verpacken, iOS-Build über einen Cloud-Dienst (z. B. Codemagic) |
| Kindersicherung | In der App: Gesten-Sperre und Elternsperre. Auf dem Gerät: Geführter Zugriff (iOS) bzw. App anheften (Android) |

## Phase 1 – Soundboard (umgesetzt in v0.1)

- 9 Kacheln im 3×3-Raster mit einfachen, kontrastreichen Formen
- 9 gemeinfreie Kinderlied-Melodien, synthetisch erzeugt (10–15 s)
- Ein Sound zur Zeit, wird immer bis zum Ende gespielt, kein paralleles Abspielen
- Keine Animation. Nicht spielende Kacheln werden während der Wiedergabe leicht abgedunkelt (abschaltbar per Konstante)
- Keine Lautstärke-Einstellung, die Sounds sind bewusst moderat gepegelt
- Elternbereich: Schloss gedrückt halten, dann eine Rechenaufgabe lösen

## Phase 1b – Ideen für später

- Mehr Sounds und mehrere Seiten bzw. Kategorien
- Bunte Illustrationen statt Formen
- Bilder-Erweiterung, die die Eltern einschalten können (Schalter ist als Platzhalter vorhanden)

## Phase 2 – Lernspiel (noch nicht begonnen)

Ablauf laut Idee: (1) Geräusch hören → (2) Bild und Geräusch → (3) Auswahl aus drei Bildern per Touch.
Die offenen Fragen dazu werden vor Beginn von Phase 2 geklärt.

## Offene Punkte

- Termin für eine erste nutzbare Version: Kai meldet sich im Lauf der Woche
- Code liegt unter github.com/kaiwendt92/klimperkiste. GitHub Pages muss noch einmalig eingeschaltet werden (Settings → Pages → Source: GitHub Actions)

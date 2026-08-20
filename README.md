# Sparcity Voice

Eine Progressive Web App zum Tracken von Ausgaben per Sprache. Einfach das Mikro antippen und sagen, was ausgegeben wurde – auch mehrere Posten in einem Satz, z. B. *"Cola 1,20 und Brot 3,50 und dann noch tanken für 130 Euro"* – die App zerlegt das in einzelne Positionen mit Betrag, Beschreibung und Kategorie und trackt das Monatsbudget.

## Features

- **Voice-Input**: Spracherkennung (Web Speech API, `de-DE`). Eine Aufnahme pro Antippen, endet automatisch nach der Pause am Satzende – für mehrere Ausgaben in unterschiedlichen Sätzen einfach nochmal antippen
- **Multi-Item-Erkennung**: ein Satz mit mehreren Ausgaben wird automatisch in einzelne Posten aufgeteilt
- **Sofort-Speichern**: erkannte Posten werden direkt übernommen, kein Bestätigungsschritt nötig – Korrekturen passieren nachträglich per Klick auf einen Eintrag in der Liste
- **Lokale Speicherung**: Alle Daten bleiben offline auf dem Gerät (IndexedDB via Dexie)
- **Budget-Tracking**: Monatslimit setzen, Fortschrittsbalken, Warnung bei Überschreitung
- **PWA**: installierbar, offline-fähig (Service Worker via `vite-plugin-pwa`)
- **Quick-Capture-Shortcut**: eigenes App-Shortcut ("Ausgabe diktieren"), das direkt ins Mikro springt – ganz ohne Budget-Übersicht oder Liste. Auf Android per langem Druck auf das App-Icon als eigenes Homescreen-Icon herausziehbar, startet beim Öffnen sofort die Aufnahme
- **Fallback**: Text-Eingabe für Browser ohne Spracherkennungs-Support

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server mit HMR
npm run build    # Produktions-Build inkl. Service Worker
npm run preview  # Build lokal testen
```

## Architektur

- `src/db/db.ts` – Dexie-Schema (Expenses, Categories, Budgets)
- `src/voice/` – Speech-Recognition-Hook + Parser (Sprache → Betrag/Kategorie/Beschreibung)
- `src/components/` – UI-Bausteine (Mikro-Button, Budget-Übersicht, Ausgabenliste mit Inline-Edit)
- `src/useExpenseCapture.ts` – gemeinsame Aufnahme-/Speicher-Logik, genutzt von `App.tsx` und `QuickCapture.tsx`
- `src/App.tsx` – vollständige Ansicht (Budget, Mikro, Liste)
- `src/QuickCapture.tsx` – minimaler Diktier-Screen für den App-Shortcut (`?quick=1`), startet die Aufnahme automatisch beim Öffnen

Die Spracherkennung läuft vollständig client-seitig über die Browser-eigene Web Speech API – es gibt aktuell kein Backend.

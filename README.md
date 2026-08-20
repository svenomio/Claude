# Sparcity Voice

Eine Progressive Web App zum Tracken von Ausgaben per Sprache. Einfach das Mikro antippen und sagen, was ausgegeben wurde – z. B. *"Kaffee drei Euro fünfzig"* – die App erkennt Betrag, Beschreibung und Kategorie automatisch und trackt das Monatsbudget.

## Features

- **Voice-Input**: Spracherkennung (Web Speech API, `de-DE`) mit automatischer Erkennung von Betrag und Kategorie
- **Bestätigungs-Dialog**: Erkannte Ausgabe kann vor dem Speichern korrigiert werden
- **Lokale Speicherung**: Alle Daten bleiben offline auf dem Gerät (IndexedDB via Dexie)
- **Budget-Tracking**: Monatslimit setzen, Fortschrittsbalken, Warnung bei Überschreitung
- **PWA**: installierbar, offline-fähig (Service Worker via `vite-plugin-pwa`)
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
- `src/components/` – UI-Bausteine (Mikro-Button, Budget-Übersicht, Ausgabenliste, Bestätigungs-Card)
- `src/App.tsx` – verbindet Voice-Input, Parser und Datenbank

Die Spracherkennung läuft vollständig client-seitig über die Browser-eigene Web Speech API – es gibt aktuell kein Backend.

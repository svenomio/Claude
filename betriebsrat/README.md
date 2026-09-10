# Betriebsrat 🎡

Ein Glücksrad für die VEC-Organisation: durch Wischen/Ziehen am Rad wird eine
von 9 Eskalationsstufen ausgelost, die das Organigramm daneben live verändert
– animiert, damit man sieht, wer sich gerade wohin bewegt.

## Nutzung

Einfach `index.html` im Browser öffnen – kein Build-Schritt, kein Server nötig.

- **Rad wischen/ziehen**: am Rad ziehen und loslassen (oder kurz antippen)
  löst einen Dreh aus. Je nach Schwung dauert die Animation unterschiedlich
  lang, das Ergebnis selbst ist aber immer fair nach den hinterlegten
  Gewichtungen ausgelost (siehe Legende unter dem Rad).
- **Organigramm**: zeigt den kompletten VEC-Baum (Ausgangsdaten in
  `orgchart.js`) mit allen Personen. Nach jedem Dreh wird die betroffene
  Änderung eingeblendet (Banner oben) und im Baum animiert – umbenannte
  Bereiche blitzen kurz auf, versetzte Personen "fliegen" sichtbar an ihre
  neue Stelle.
- **Zurücksetzen**: Organigramm und Chaos wieder auf den VEC-Ausgangszustand.

## Die 9 Eskalationsstufen

Je höher die Stufe, desto seltener kommt sie auf dem Rad vor (Stufe 9 ist ein
Unikat). Definiert in `escalation.js` unter `TIERS`:

1. Umbenennungswelle – ein Bereich bekommt einen neuen Namen
2. Namenstausch – zwei Bereiche tauschen ihre Namen
3. Claim-Update – neuer Name + absurder Claim für einen Bereich
4. Job-Rotation – eine Person wechselt den Bereich
5. Titel-Upgrade – eine Person bekommt einen absurden Titel
6. Doppelschlag – zwei der obigen Effekte gleichzeitig
7. Führungswechsel – die Geschäftsführung tauscht mit einer anderen Person
8. Mitarbeiter-Joker – alle Positionen im ganzen Baum werden neu gewürfelt,
   die Bereichsstruktur bleibt
9. Vorstands-Veranstaltung (Unikat) – kompletter Neuaufbau: alle Bereiche
   *und* alle Positionen werden neu generiert

## Dateien

- `orgchart.js` – Ausgangs-Organigramm der VEC (Rohdaten)
- `escalation.js` – die 9 Stufen, Namens-/Titel-Pools, reine Spiellogik ohne DOM-Zugriff
- `index.html` / `style.css` – Struktur & Design (Rad, Legende, Baum-Ansicht)
- `app.js` – Wisch/Drag-Interaktion fürs Rad, Baum-Rendering inkl.
  FLIP-Animation für versetzte Personen, State-Persistenz (`localStorage`)

## Ausblick

Als nächste Ausbaustufe angedacht (noch nicht umgesetzt): ein Punktesystem,
mit dem sich gesammelte Punkte gezielt gegen Organisationsänderungen
eintauschen lassen.

# Betriebsrad 🎡

*Alle kommen unter die Räder*

Ein Glücksrad für die VEC-Organisation: durch Wischen/Ziehen am Rad wird eine
von 5 Eskalationsstufen ausgelost, die das Organigramm daneben live verändert
– animiert, damit man sieht, wer sich gerade wohin bewegt. Jede Stufe bündelt
mehrere Effekte gleichzeitig, damit auch die häufigste Stufe schon spürbar
etwas auslöst.

## Nutzung

Einfach `index.html` im Browser öffnen – kein Build-Schritt, kein Server nötig.

- **Rad wischen/ziehen**: am Rad ziehen und loslassen (oder kurz antippen)
  löst einen Dreh aus. Je nach Schwung dauert die Animation unterschiedlich
  lang, das Ergebnis selbst ist aber immer fair nach den hinterlegten
  Gewichtungen ausgelost (siehe Legende unter dem Rad). Jedes Radfeld trägt
  seine Stufennummer, die Felder sind durchmischt verteilt (nie zwei gleiche
  Felder direkt nebeneinander, auch nicht am Kreis-Übergang) statt in
  Blöcken gruppiert – fühlt sich dadurch nach einem echten Glücksrad an.
- **Organigramm**: zeigt den kompletten VEC-Baum (Ausgangsdaten in
  `orgchart.js`) in drei klar beschrifteten Ebenen – oben die
  Geschäftsführung, darunter die Chapters, darunter die übrigen Bereiche
  & Teams. Welche Einheit in welcher Ebene landet, hängt an einem festen
  `category`-Feld pro Einheit (nicht am Namen), bleibt also auch nach
  Umbenennungen stabil. Die erste Person jeder Einheit gilt als Lead und
  wird mit einem "Lead"-Tag hervorgehoben, der Rest der Mannschaft steht
  kompakter darunter. Nach jedem Dreh wird die Änderung im Baum animiert –
  umbenannte Bereiche blitzen kurz auf, versetzte Personen "fliegen"
  sichtbar an ihre neue Stelle.
- **Geschichte**: jeder Dreh wird als Eintrag unter den vorherigen
  angehängt (oben im Verlauf), sodass sich beim Lesen eine fortlaufende
  Chronik der Organisationsgeschichte ergibt. Bleibt über Reloads erhalten
  (`localStorage`), bis man zurücksetzt.
- **Zurücksetzen**: Organigramm, Geschichte und Chaos wieder auf den
  VEC-Ausgangszustand.

## Die 5 Eskalationsstufen

Je höher die Stufe, desto seltener kommt sie auf dem Rad vor (Stufe 5 ist ein
Unikat – der "Hauptpreis"). Alle Radsegmente sind gleich groß, Stufe 1
bekommt aber die meisten davon (10 von 22) und Stufe 5 genau eines – dadurch
wirkt Stufe 1 groß und häufig, Stufe 5 wie ein seltener Treffer. Definiert
in `escalation.js` unter `TIERS`:

1. Wundertüte – 2 zufällige Effekte gleichzeitig (Umbenennung, Namenstausch,
   Claim-Update, Job-Rotation, Titel-Upgrade, Platztausch zweier Personen
   oder Doppel-Titel-Upgrade – 7 Bausteine zur Auswahl, für Abwechslung
   auch bei der häufigsten Stufe)
2. Kettenreaktion – 4 dieser Bausteine gleichzeitig
3. Stühlerücken – die Geschäftsführung tauscht mit einer anderen Person,
   plus 2 weitere Bausteine gleichzeitig
4. Blackout – alle Positionen im ganzen Baum werden neu gewürfelt,
   die Bereichsstruktur bleibt
5. Stunde Null (Unikat) – kompletter Neuaufbau: alle Bereiche *und* alle
   Positionen werden neu generiert

## Dateien

- `orgchart.js` – Ausgangs-Organigramm der VEC (Rohdaten)
- `escalation.js` – die 5 Stufen, Namens-/Titel-Pools, reine Spiellogik ohne DOM-Zugriff
- `index.html` / `style.css` – Struktur & Design (Rad, Legende, Baum-Ansicht)
- `app.js` – Wisch/Drag-Interaktion fürs Rad, Baum-Rendering inkl.
  FLIP-Animation für versetzte Personen, State-Persistenz (`localStorage`)

## Ausblick

Als nächste Ausbaustufe angedacht (noch nicht umgesetzt): ein Punktesystem,
mit dem sich gesammelte Punkte gezielt gegen Organisationsänderungen
eintauschen lassen.

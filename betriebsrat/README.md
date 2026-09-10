# Betriebsrat 🎡

Ein Glücksrad für die Führungsebene: bei jedem Dreh bekommt jede Person aus der
Liste eine neue (zunehmend absurde) Rolle zugelost, und daraus entsteht eine
kleine Geschichte à la:

> Martin wurde von Geschäftsführer zu Head of Assistance of Administration
> befördert, um dann Marco stieg von Teamleiter zu Aufsichtsrat auf, während
> Moni von Assistenz der Geschäftsführung zu Chef:in vom Kaffeeautomaten
> wechselte.

## Nutzung

Einfach `index.html` im Browser öffnen – kein Build-Schritt, kein Server nötig.

- **Rad drehen**: würfelt neue Rollen für alle Personen aus und erzählt, was
  passiert ist. Das Chaos-Level steigt mit jedem Dreh, wodurch zunehmend
  abstrusere Titel ins Spiel kommen.
- **Bearbeiten**: Namen und Ausgangspositionen der Personen anpassen
  (wird lokal im Browser gespeichert, `localStorage`).
- **Zurücksetzen**: Chaos-Level und aktuelle Rollen wieder auf den
  Ausgangszustand setzen.

Es gibt bewusst keine Verlaufs-/Historienansicht – nur der letzte Zustand wird
gespeichert und als Basis für den nächsten (noch verrückteren) Dreh verwendet.

## Dateien

- `index.html` – Struktur
- `style.css` – Design
- `app.js` – Logik (Roster-Verwaltung, Rad-Animation, Titel-Pools,
  Geschichten-Generator)

## Anpassen

- Titel-Pools (nach Absurditäts-Stufe) stehen in `app.js` unter `TITLE_POOLS`.
- Satzbausteine für die Geschichten stehen unter `OPENERS` und `CONNECTORS`.

# INGTEC Inspect

Interaktive JavaScript-Web-App für die hybride Prüf-, Bewertungs- und Wissensplattform der INGTEC GmbH.

## Aktueller Stand

- responsive Web-App für iPhone, Tablet und Desktop
- statisch sichtbare HTML-Basis mit JavaScript-Erweiterung
- Premium-Glass-Design
- weiße neutrale Arbeitsbereiche
- graue Bewertungs-, Risiko- und QS-Bereiche
- INGTEC-Grün `#9DC31A` für Aktionen, Links und aktive Navigation
- keine blaue Akzentfarbe
- Safety-Score® A bis E mit Ampellogik
- Unternehmens- und Objektakte
- interaktiver BMA-Prüfprozess
- Text- und Quellenampel: Rot, Gelb, Grün
- Feststellungen und Maßnahmen
- Bericht mit Quality Gate und Freigabesperre
- SharePoint-Dokumentenakte als vorbereitete Integrationssicht
- Kundenportal
- fehlertolerante lokale Speicherung im Browser

## Safety-Score®-Anwendung

Die Bewertung eines Objektes oder einer Anlage nach **PRD-INGTEC-SAFETY-SCORE-001, Version 1.0**
liegt als eigenständige Anwendung unter [`safetyscore/`](safetyscore/README.md).

- deterministische Score-Engine in Festkommaarithmetik, Modellversion 1.0.0
- Skala 0–100 Risikopunkte, 0 ist optimal, Klassen A–E und NB
- sechs Bewertungsdimensionen LRC, TPF, IPH, ORG, EVD, MEA
- vier getrennte Ergebnisachsen: Score, Compliance, Konfidenz, Gate
- Gates KO-01 bis KO-08 mit Score-Floors, NB und Freigabesperre
- vollständiger Berechnungstrace, Snapshot mit SHA-256-Hash und Auditprotokoll
- Portfolioaggregation mit gewichtetem P90 und Klassenverteilung
- Tests der Validierungsstufen V0 und V1: `npm run test:safety-score`

Start: `safetyscore/index.html`

## Direkt starten

Die App ist als eigenständige `index.html` im Repository enthalten und benötigt keinen Build-Schritt. Lokal kann die Datei direkt in einem aktuellen Browser geöffnet werden.

Für die zuverlässige Nutzung am iPhone soll die App über GitHub Pages oder eine reguläre HTTPS-Webadresse geöffnet werden. Die iOS-Dateivorschau ist kein vollwertiger Browser und kann JavaScript einschränken.

## GitHub Pages

Im Repository ist ein Pages-Workflow vorgesehen. Nach Aktivierung von **Settings → Pages → Source: GitHub Actions** wird die Anwendung automatisch veröffentlicht.

## Farb- und Bewertungslogik

- Weißes Glas: neutrale Daten und normale Arbeitsbereiche
- Graues Glas: Bewertung, Risiko, Safety-Score®, Maßnahmenbewertung und Qualitätssicherung
- INGTEC-Grün: Marke, Interaktion, Links und aktive Navigation
- Rot: ungeprüfte Inhalte aus Mustern oder nicht validierten Quellen
- Gelb: verlässliche Vorperiode mit Aktualisierungsbedarf
- Grün: aktuell verifiziert, abschließend zu sichten
- Safety-Score® A–E: eigenständiges sicherheitstechnisches Bewertungssystem

## Fachliche Abgrenzung

Der aktuelle Stand ist ein interaktiver Frontend-Prototyp mit Demodaten. Für den Produktivbetrieb sind insbesondere erforderlich:

- API-Backend und PostgreSQL-Datenbank
- Microsoft-Entra-ID-Anmeldung
- echte Microsoft-Graph-/SharePoint-Integration
- Odoo-Schnittstelle
- verschlüsselte Offline-Synchronisation
- unveränderbares Auditlog
- DOCX-/PDF-Berichtserzeugung
- Mandantentrennung und produktives Berechtigungssystem

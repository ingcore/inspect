# INGTEC Inspect

Interaktive JavaScript-Web-App für die hybride Prüf-, Bewertungs- und Wissensplattform der INGTEC GmbH.

## Anwendungen im Repository

| Anwendung | Pfad | Zweck |
| --- | --- | --- |
| INGTEC Inspect | `index.html` | Prüf-, Bewertungs- und Wissensplattform |
| Löschwasserberechnung | `loeschwasser/index.html` | Löschwasserbedarf, Förderstrecke, Verbrauch, Vorrat, Hydranten |

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

## Löschwasserberechnung

Eigenständige Single-File-App unter `loeschwasser/index.html`, erreichbar über den Seitenbereich der Hauptanwendung oder direkt unter `/loeschwasser/`.

### Module

- **Löschwasserbedarf** – Grundschutz nach Bebauungsart und Objektschutz nach Brandgefahr, Brandabschnittsfläche, Geschoßanzahl und Löschanlage. Ausgabe in l/min und m³, maßgebender Wert aus beiden Betrachtungen.
- **Förderstrecke** – Wasserförderung über lange Wegstrecken. Ermittelt aus Fördermenge, Länge, Höhenunterschied und Schlauchart die kleinste erforderliche Pumpenzahl und verteilt die Schläuche gleichmäßig auf die Abschnitte. Ausgabe: Pumpenstandorte, Ein- und Ausgangsdrücke, Schlauchbedarf inklusive Reserve, Restdruck, Wasserinhalt und Füllzeit der Leitung.
- **Strahlrohre** – Verbrauch der eingesetzten Rohre in l/min, Wassermenge je Einsatzdauer und Abgleich mit einem verfügbaren Vorrat.
- **Löschwasservorrat** – Behälter, Zisterne oder Becken über Geometrie oder direkte Volumseingabe, nutzbarer Anteil, Reichweite in Minuten und Bewertung der geodätischen Saughöhe.
- **Hydranten** – Verzeichnis der Wasserentnahmestellen mit Ergiebigkeit, Ruhedruck, Notiz und optionaler Koordinate; Sortierung nach Entfernung zum aktuellen Standort.
- **Objekte** – Berechnungen benennen, speichern, wieder laden sowie als JSON exportieren und importieren.
- **Grundlagen** – vollständige Offenlegung aller Rechenwerte, Tabellen und Formeln.

### Rechenwerte

- Höhendruck: 0,1 bar je Meter
- Reibungsverlust B-75 nach österreichischer Ausbildungstabelle, 800 l/min entsprechen rund 1,0 bar je 100 m; Zwischenwerte linear interpoliert, Werte darüber quadratisch extrapoliert
- Pumpe: 8,0 bar Ausgangsdruck, 1,5 bar Mindesteingangsdruck, 5,0 bar Solldruck am Leitungsende (jeweils änderbar)
- Geodätische Saughöhe: Grenzwert 7,5 m

Die Stufen für den Löschwasserbedarf bilden die Systematik der TRVB 137 F „Löschwasserbedarf" nach und sind Richtwerte der Anwendung, kein Auszug der Richtlinie. Für Gutachten, Bescheide und Projektierungen ist die geltende Fassung heranzuziehen. Alle Daten werden ausschließlich lokal im Browser gespeichert.

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

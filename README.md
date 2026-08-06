# INGTEC Inspect

Interaktive JavaScript-Web-App für die hybride Prüf-, Bewertungs- und Wissensplattform der INGTEC GmbH.

## Anwendungen im Repository

| Anwendung | Pfad | Zweck |
| --- | --- | --- |
| INGTEC Inspect | `index.html` | Prüf-, Bewertungs- und Wissensplattform |
| Löschwasserberechnung | `loeschwasser/index.html` | Löschwasserbedarf nach TRVB 137 F sowie Förderstrecke, Verbrauch, Vorrat und Hydranten |

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

Rechengrundlage der Bedarfsermittlung ist die **TRVB 137 F „Löschwasserbedarf", Ausgabe 01.09.2021** (Österreichischer Bundesfeuerwehrverband und Die Österreichischen Brandverhütungsstellen). Die Tabellen 1 bis 7 und der vollständige Anhang A mit 415 Nutzungen sind wortgetreu hinterlegt.

### Module nach TRVB 137 F

- **Grundschutz** (Punkt 4 und 5) – Tabelle 1 mit Löschwasserrate Q<sub>LWG</sub>, Mindest-Lieferdauer t<sub>G</sub>, Mindest-Löschwasservorrat V<sub>LWG</sub> und Entfernungsstaffelung 125 / 250 / 500 m. Zusätzlich Tabelle 2 (spezielle Nutzungen innerhalb des bebauten Gebietes), Tabelle 3 (außerhalb) und Tabelle 4 (zulässige Entfernungen) sowie die Liste der nach Punkt 5.1 durch den Grundschutz abgedeckten Nutzungen.
- **Objektschutz** (Punkt 6, Berechnungsblatt Anhang B) – spezifische Löschwasserrate der immobilen Brandbelastung nach Tabelle 5 (Wände) und Tabelle 6 (Decken/Dächer) einschließlich Mischform, mobile Brandbelastung über den durchsuchbaren Anhang A oder anteilsmäßige Festlegung, rechnerische Brandfläche A<sub>B</sub> nach Tabelle 7, Berechnung nach Punkt 6.1.4 bzw. 6.1.5 für Lagerguthöhen über 2,5 m samt Deckelung gesprinklerter Lager, Prüfung der Obergrenze von 8.000 l/min, Löschwasservorrat V<sub>LWO</sub> für 90 min nach Punkt 6.2 und Löschwasserrückhaltemenge nach Punkt 8.
- **Bereitstellung** (Punkt 7, Berechnungsblatt Anhang C) – Erfassung der vorhandenen Löschwasserversorgung, Beurteilung nach dem Grundschutz mit Übertrag des Überschusses in die nächste Entfernungsstaffel, Ermittlung der bemessungsrelevanten Löschwasserrate Q<sub>LWR</sub> sowie des bereitzustellenden Bedarfs Q<sub>LWB</sub> und V<sub>LWB</sub>.
- **Grundlagen** – Fundstellennachweis je Rechenschritt, Mindestbetriebsdruck nach ÖVGW W 77 / ÖNORM B 2538 und der vollständige, filterbare Anhang A.

### Einsatztaktische Rechenhilfen

Diese Module sind nicht Gegenstand der TRVB und als solche gekennzeichnet:

- **Förderstrecke** – Wasserförderung über lange Wegstrecken. Ermittelt aus Fördermenge, Länge, Höhenunterschied und Schlauchart die kleinste erforderliche Pumpenzahl und verteilt die Schläuche gleichmäßig auf die Abschnitte. Ausgabe: Pumpenstandorte, Ein- und Ausgangsdrücke, Schlauchbedarf inklusive Reserve, Restdruck, Wasserinhalt und Füllzeit der Leitung.
- **Strahlrohre** – Verbrauch der eingesetzten Rohre in l/min, Wassermenge je Einsatzdauer und Abgleich mit einem verfügbaren Vorrat.
- **Löschwasservorrat** – Behälter, Zisterne oder Becken über Geometrie oder direkte Volumseingabe, nutzbarer Anteil, Reichweite in Minuten und Bewertung der geodätischen Saughöhe.
- **Hydranten** – Verzeichnis der Wasserentnahmestellen mit Ergiebigkeit, Ruhedruck, Notiz und optionaler Koordinate; Sortierung nach Entfernung zum aktuellen Standort.
- **Objekte** – Berechnungen benennen, speichern, wieder laden sowie als JSON exportieren und importieren.

### Rechenwerte der Förderstrecke

- Höhendruck: 0,1 bar je Meter
- Reibungsverlust B-75 nach österreichischer Ausbildungstabelle, 800 l/min entsprechen rund 1,0 bar je 100 m; Zwischenwerte linear interpoliert, Werte darüber quadratisch extrapoliert
- Pumpe: 8,0 bar Ausgangsdruck, 1,5 bar Mindesteingangsdruck, 5,0 bar Solldruck am Leitungsende (jeweils änderbar)
- Geodätische Saughöhe: Grenzwert 7,5 m

Die Ermittlung des Löschwasserbedarfs und die Ausführung der Löschwasserentnahmestellen sind gemäß TRVB 137 F mit der örtlich zuständigen Feuerwehr oder der für den Brandschutz zuständigen Dienststelle abzustimmen; Informationen zur Entnahme aus Wasserversorgungsanlagen sind beim Wasserversorgungsunternehmen zu erheben. Für Gutachten, Bescheide und Projektierungen ist stets die geltende Fassung der Richtlinie heranzuziehen. Alle Daten werden ausschließlich lokal im Browser gespeichert.

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

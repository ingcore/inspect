# Frontend, Visualisierung und Interaktion

Umsetzung der Spezifikation, Abschnitte 7 sowie 16 bis 20.

---

## 1. Owl-Komponenten (Abschnitt 7)

Das interaktive Frontend ist komponentenbasiert. Die vorgesehenen
Hauptkomponenten sind vollständig umgesetzt; der Prototyp bildet sie als reine
Renderfunktionen ab, damit die Portierung nach Owl geradlinig bleibt.

| Komponente | Prototyp (`ui/`) | Odoo Owl |
| --- | --- | --- |
| SafetyNavigator | `app.js` `mountSafetyNavigator` | `SafetyNavigator` |
| ProgressHeader | `components.js` | `ProgressHeader` |
| ObjectTypeSelector | `components.js` | `ObjectTypeSelector` |
| BuildingVisualizer | `components.js` | `BuildingVisualizer` |
| SystemHotspot | `core/visual/building.js` | im BuildingVisualizer |
| SystemSearch | `components.js` | `SystemSearch` |
| SystemDetailPanel | `components.js` | `SystemDetailPanel` |
| QuestionRenderer | `components.js` | `QuestionRenderer` |
| DocumentUploader | `components.js` | Upload über die API |
| Portfolio | `components.js` | im Wurzeltemplate |
| RequirementResult | `components.js` | `RequirementResult` |
| SafetyCheckSummary | `components.js` | im Wurzeltemplate |
| LeadForm | `components.js` | `LeadForm` |
| KnowledgeTooltip | `app.js` `showTooltip` | Tooltip im Stage-Handler |
| MaintenanceInspectionRevisionInfo | `components.js` | `MaintenanceInspectionRevisionInfo` |
| SaveAndContinue | `components.js` | Session-API |
| ResultExport | `components.js` | Druck und JSON-Export |

Die Komponenten kommunizieren über einen gemeinsamen Application State
(`ui/state.js`). Er trennt zwei Dinge sauber:

* **`session`** – fachlicher Zustand. Wird gespeichert und übertragen.
* **`ui`** – Darstellung: Ansicht, Panel, Zoom, Tooltip, Zielgruppe.

Nur `session` wird persistiert. Dadurch bleibt ein gespeicherter Vorgang frei
von Darstellungsdetails und zwischen den Bereitstellungsvarianten austauschbar.

---

## 2. Visualisierung (Abschnitt 16)

Die Gebäudevisualisierung ist **kein JPG**. Primärformat ist **SVG**:
skalierbar, responsive, hotspotfähig, einzelne Anlagen aktivierbar,
Hover-Effekte und Statusfarben möglich, datensparsam, gut im Browser
integrierbar und mit barrierefreien Labels versehbar.

Die Layerstruktur folgt der Spezifikation:

```
svg-building
 ├── layer_building
 ├── layer_fire_protection
 │    ├── system_bma
 │    ├── system_rwa
 │    └── system_sprinkler
 ├── layer_work_equipment
 │    ├── system_crane
 │    ├── system_gate
 │    └── system_lift
 └── layer_energy
      ├── system_pv
      └── system_battery
```

Ergänzt um `layer_building_services`, `layer_fall_protection` und
`layer_traffic` für die weiteren Kategorien aus Abschnitt 12.

**Die Geometrie liegt im Kern, nicht im Frontend.** `HOTSPOT_GEOMETRY` in
`core/visual/building.js` hält Position und Verortung je Anlagentyp. Odoo-Owl
und externe Web-App zeichnen damit exakt dieselbe Grafik – eine verschobene
Anlage verschiebt sich in beiden Varianten gleichzeitig.

Jeder Hotspot trägt:

```html
<g id="system_gate" class="sn-hotspot" data-system-type="SYS-AT-GATE-001"
   data-hotspot="hotspot_gate_01" role="button" tabindex="0"
   aria-pressed="false" aria-label="Kraftbetriebenes Tor – Hallentor">
  <title>Kraftbetriebenes Tor – Hallentor</title>
  …
</g>
```

`role="button"`, `tabindex="0"`, `aria-label` und `<title>` machen die Grafik
per Tastatur und Screenreader bedienbar. Der Gebäudekörper selbst ist
`aria-hidden`, damit die Vorlesereihenfolge nicht von Fensterrechtecken
unterbrochen wird.

Darstellungszustände: `is-selected` (erfasst), `is-unsure` (gestrichelter
Rand), `is-focus` (hervorgehoben).

---

## 3. Interaktion mit SVG (Abschnitt 17)

**Hover:** die Anlage wird hervorgehoben und ein Tooltip erscheint.

> **Rauch- und Wärmeabzugsanlage**
> „Öffnet im Brandfall Rauchabzugsöffnungen bzw. unterstützt die
> Rauchableitung."

Der Tooltipinhalt kommt aus `hotspotTooltip()` und damit aus der
Laienbeschreibung des Anlagenstamms – er ist Stammdatum, nicht UI-Text.

**Klick:** das Detailpanel öffnet mit den Optionen
`[Habe ich]`, `[Mehr erfahren]`, `[Bin nicht sicher]`.

`[Bin nicht sicher]` ist bewusst kein Abbruch: die Anlage wird erfasst und mit
`selection: 'unsure'` markiert. Sie erscheint im Ergebnis mit einem eigenen
Hinweis und wird fachlich geklärt, statt aus der Betrachtung zu fallen. Wer
unsicher ist, hat den Prüfbedarf nicht weniger.

---

## 4. Mobile Bedienung (Abschnitt 18)

Auf dem Smartphone ist **kein Mouse-Hover erforderlich**:

* **Tap 1** – Anlage markieren
* **Tap 2** – Detail öffnen

Erkannt wird das über `matchMedia('(hover: hover)')`, nicht über die
Bildschirmbreite. Ein Tablet mit Maus verhält sich damit wie ein Desktop, ein
großes Touchgerät wie ein Smartphone.

Das Detail erscheint mobil als **Bottom-Sheet** statt als Seitenpanel
(`@media (max-width: 900px)`).

Das Gebäude kann gezoomt, verschoben und vergrößert werden. Verschieben und
Antippen werden über eine Bewegungsschwelle von vier Pixeln unterschieden, so
dass ein Wischen über einen Hotspot nicht versehentlich das Detail öffnet.

---

## 5. Alternative Anlagenansicht (Abschnitt 19)

Neben der Grafik gibt es einen Umschalter:

```
[Gebäude]  [Liste]  [Suche]
```

Damit finden Nutzer auch kleine oder verdeckte Anlagen. Die Liste gruppiert
nach Kategorie und berücksichtigt dabei auch die sekundären Zuordnungen: die
Sicherheitsbeleuchtung erscheint unter Brandschutz, Elektrotechnik und
Arbeitnehmerschutz.

Der Hinweis unter der Grafik verweist ausdrücklich auf beide Alternativen. Die
Gebäudeansicht ist ein Einstieg, kein Nadelöhr.

---

## 6. Anlagen-Suchmaschine (Abschnitt 20)

Suchfeld: **Welche Anlage suchen Sie?**

Die Eingabe `Tor` findet unter anderem Kraftbetriebenes Tor, Brandschutztor,
Garagentor, Schnelllauftor.

Die Bewertung unterscheidet, **wo** ein Begriff trifft:

| Punkte | Treffer |
| --- | --- |
| 100 | exakter Name |
| 80 | Name beginnt mit dem Begriff |
| 75 | Begriff ist ein eigenes Wort im Namen |
| 60 | Name enthält den Begriff als Wortbestandteil |
| 50 / 45 / 42 / 30 | dasselbe für Synonyme |
| 15 / 10 | Laien- bzw. Fachbeschreibung |

Die Unterscheidung zwischen eigenem Wort und Wortbestandteil ist im Deutschen
wesentlich: `Tor` listet deshalb „Kraftbetriebenes Tor" vor „Brandschutztor" –
im ersten Fall steht der gesuchte Begriff für sich, im zweiten ist er Teil
einer Zusammensetzung. Ohne diese Unterscheidung entscheidet die Reihenfolge in
der Bibliothek, was fachlich willkürlich wäre.

Umlaute, Großschreibung und Bindestriche sind egal: `lüftung`, `LUEFTUNG` und
`Lüftung` führen zum selben Ergebnis.

Bei unklarer Eingabe erscheint **„Ich kenne die genaue Bezeichnung nicht."**
mit vier Auswegen: Foto aufnehmen oder hochladen, nach Kategorie durchsehen,
Bezeichnung unbekannt, Beratung anfordern. Der Fotoweg ist die Vorbereitung für
eine spätere KI-basierte Anlagenklassifikation – die Aufnahme wird bereits
heute erfasst und der Session zugeordnet.

---

## 7. Farb- und Gestaltungslogik

Übernommen aus INGTEC Inspect, damit beide Anwendungen als ein System
wahrgenommen werden:

* **Weißes Glas** – neutrale Daten und Arbeitsbereiche
* **Graues Glas** – Bewertung, Risiko, Zusammenfassung, Qualitätssicherung
* **INGTEC-Grün `#9DC31A`** – Marke, Interaktion, Links, aktive Navigation
* **Keine blaue Akzentfarbe**
* **Quellenampel** – Rot ungeprüft, Gelb Vorperiode, Grün verifiziert

Die Prioritätsmarken 1 bis 6 laufen von Rot über Ocker nach Grüngrau. Sie
sind zusätzlich beziffert und mit Klartext beschriftet, damit die Aussage
nicht allein an der Farbe hängt.

---

## 8. Prototyp starten

Der Prototyp verwendet ES-Module und benötigt deshalb einen Webserver;
ein Doppelklick auf die Datei genügt nicht.

```bash
npm run navigator:serve
# http://localhost:8080/safety-navigator/
```

Über GitHub Pages ist er ohne weitere Schritte unter `/safety-navigator/`
erreichbar.

Getestet mit Chromium über Playwright: Landingpage, Objektartauswahl,
Gebäudeansicht mit 36 Hotspots, Tooltip, Detailpanel, Suche, Liste,
regelgetriebene Fragen, Ergebnis mit Prioritätssortierung, Freigabefilter,
Kontaktformular, Speichern und Fortsetzen sowie die Zwei-Tipp-Bedienung mit
Bottom-Sheet am Smartphone.

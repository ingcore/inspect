# Datenmodell und Regelwerk

Umsetzung der Spezifikation, Abschnitte 8 bis 15 sowie 21 bis 25.

---

## 1. Nutzerstatus (Abschnitt 8)

Der Navigator weiß zu jedem Zeitpunkt, welcher Schritt aktiv ist, welche
Objektart gewählt wurde, welche Anlagen gewählt wurden, welche Antworten
gegeben wurden, welche Dokumente vorhanden sind, welche Regeln ausgelöst
wurden und welcher Prüfstatus ermittelt wurde.

```
Session
 ├── Objekt          object_type_id
 ├── Nutzung         object_facts
 ├── Standort        object_facts['state']
 ├── Anlagen         instances[]
 │    ├── BMA
 │    ├── RWA
 │    ├── Tore
 │    └── Kran
 ├── Antworten       object_facts + instance.facts
 ├── Dokumente       documents[]
 ├── Regelresultate  evaluateSession().systems[].requirements
 └── Ergebnis        evaluateSession().summary
```

Der Zustand ist **unveränderlich modelliert**: jede Änderungsfunktion gibt
eine neue Session zurück, statt die bestehende zu mutieren. Das macht
Zwischenstände speicherbar und später eine Undo-Funktion möglich, ohne dass
die Aufrufer davon wissen müssen.

Getrennt davon liegt der reine Darstellungszustand (Ansicht, Panel, Zoom,
Tooltip) in `ui/state.js`. Nur die fachliche Session wird persistiert und
übertragen.

---

## 2. Session-Modell (Abschnitt 9 und 10)

Modellname: `ingtec.navigator.session`

Beim Start wird eine eindeutige Referenz erzeugt:

```
SN-2026-X8F72P
```

Das Alphabet ist verwechslungsarm (ohne `0`/`O` und `1`/`I`), damit die Referenz
telefonisch und handschriftlich übertragbar bleibt. Erzeugt wird sie
kryptografisch zufällig – sie wirkt zugleich als Zugriffstoken für den
anonymen Vorgang, darf also nicht erraten werden können.

**Der Check ist zunächst anonym.** Personenbezogene Daten werden erst erhoben,
wenn der Nutzer das Ergebnis speichern, ein Angebot erhalten, Unterlagen
übermitteln, eine Beratung vereinbaren oder den Vorgang später fortsetzen
möchte.

| Feld | Typ | Anmerkung |
| --- | --- | --- |
| `reference` | Char | eindeutig, readonly, `SN-JJJJ-XXXXXX` |
| `state` | Selection | draft, in_progress, completed, converted, abandoned |
| `website_id` | Many2one | `website` |
| `partner_id` | Many2one | `res.partner`, erst nach Einwilligung |
| `company_name` | Char | |
| `contact_name` | Char | |
| `email` | Char | |
| `phone` | Char | |
| `object_type_id` | Many2one | `ingtec.navigator.object_type` |
| `started_at` | Datetime | |
| `completed_at` | Datetime | |
| `lead_id` | Many2one | `crm.lead` |
| `quotation_id` | Many2one | `sale.order` |
| `score_id` | Char | Referenz im Safety-Score(R) Core |
| `consent_status` | Selection | none, anonymous, granted, withdrawn |

Ergänzt um `object_facts` (Json), `instance_ids` (One2many),
`result_snapshot` (Json) und `attachment_ids`.

`result_snapshot` friert das Ergebnis beim Abschluss ein. Das ist kein Cache,
sondern Dokumentation: da Regeln versioniert sind und freigegeben werden,
muss später nachvollziehbar bleiben, welche Regelfassung zu welcher Aussage
geführt hat.

---

## 3. Objektarten (Abschnitt 11)

Modellname: `ingtec.navigator.object_type`

15 Objektarten: Industrie, Gewerbe, Büro, Lager, Werkstätte, Hotel, Schule,
Garage, Wohngebäude, Gesundheitseinrichtung, Veranstaltungsstätte, Baustelle,
Verkehrsanlage, Eisenbahnanlage, Sonderobjekt.

Felder: Name, Kurzbeschreibung, Bild, SVG-Visualisierung, aktive
Anlagenkategorien, Priorität, URL-Slug, SEO-Daten, aktiv/inaktiv.

Zusätzlich `default_facts`: vorbelegte Objektfakten je Objektart. Ein Hotel
bringt zum Beispiel `sleeping_area: true` mit. Das reduziert Rückfragen
spürbar, ohne die Aussage zu präjudizieren – **eine Nutzerantwort hat immer
Vorrang vor der Vorbelegung**, auch wenn sie zuerst gegeben wurde.

---

## 4. Anlagenkategorien (Abschnitt 12)

Modellname: `ingtec.system.category`

Brandschutz, Arbeitsmittel, Maschinensicherheit, Elektrotechnik,
Gebäudetechnik, Arbeitnehmerschutz, Absturzsicherung, Verkehrstechnik.

Jede Kategorie trägt zusätzlich den zugehörigen SVG-Layer, eine
Darstellungsfarbe und den zuständigen INGTEC-Fachbereich. Damit steuert die
Kategorie zugleich Optik und Zuständigkeit.

---

## 5. Anlagenstamm (Abschnitt 13 und 14)

Modellname: `ingtec.system.type`

Beispiel `SYS-AT-GATE-001`:

| Feld | Wert |
| --- | --- |
| ID | SYS-AT-GATE-001 |
| Kategorie | Arbeitsmittel |
| Bezeichnung | Kraftbetriebenes Tor |
| Synonyme | Rolltor, Sektionaltor, Schnelllauftor, Schiebetor, Garagentor, Drehflügeltor, Falttor, Tor |
| Laienbeschreibung | Motorisch betriebenes Tor zum Öffnen oder Schließen einer Gebäudeöffnung. |
| Technische Beschreibung | Kraftbetriebener Torabschluss einschließlich Antrieb, Steuerung, Sicherheitseinrichtungen gegen Quetschen und Scheren, Absturzsicherung des Torblatts und Notentriegelung. |
| SVG Layer | layer_work_equipment |
| SVG Objekt | system_gate |
| Hotspot-ID | hotspot_gate_01 |

Dazu die Felder aus Abschnitt 14: Wartung/Inspektion/Prüfung/Revision relevant,
typische Prüffrist, Fristart, Prüfart, zuständiger INGTEC-Fachbereich,
erforderliche Fachkunde, benötigte Unterlagen, typische Gefährdungen,
typische Mängel, mögliche Rechtsgrundlagen, Normen (TRVB, ÖNORM, EN, ISO),
Herstelleranforderungen, Bescheidrelevanz, Safety-Score(R)-Kategorie.

### Zur Kategoriezuordnung

Abschnitt 15 gruppiert die Startbibliothek in Brandschutz, Arbeitsmittel und
Gebäudetechnik. Abschnitt 12 kennt darüber hinaus fünf weitere Kategorien.
Beides ist umgesetzt: `category` folgt der Gruppierung aus Abschnitt 15,
`secondary_categories` bildet die feinere fachliche Zuordnung ab. Die
Sicherheitsbeleuchtung steht damit primär im Brandschutz und zusätzlich in
Elektrotechnik und Arbeitnehmerschutz – und erscheint in allen drei Listen.

---

## 6. Erste Anlagenbibliothek (Abschnitt 15)

36 Anlagentypen, vollständig nach Abschnitt 15.

**Brandschutz (17):** Brandmeldeanlage, Brandmeldezentrale, automatische
Brandmelder, Handfeuermelder, Brandfallsteuerungen, Rauch- und
Wärmeabzugsanlage, Brandrauchentlüftung, Druckbelüftungsanlage,
Sprinkleranlage, Wandhydranten, Steigleitung, Feuerlöscher, Brandschutztür,
Brandschutztor, Feststellanlage, Sicherheitsbeleuchtung,
Fluchtwegorientierungsbeleuchtung.

**Arbeitsmittel (11):** kraftbetriebene Tore, Krananlagen, Laufkrane,
Hebebühnen, Hubtische, Lastaufnahmemittel, Regalanlagen, Leitern,
Förderanlagen, Maschinen, verkettete Maschinenanlagen.

**Gebäudetechnik (8):** PV-Anlage, Batteriespeicher, Blitzschutz, Aufzug,
Lüftungsanlage, elektrische Anlage, Absturzsicherung, Druckanlage.

> **Quellenqualität.** Sämtliche hinterlegten Rechtsgrundlagen, Normen,
> Fristen und Prüfarten sind **Entwurfsvorschläge**. Jeder Datensatz trägt
> `source_status: 'red'` – die Quellenampel der INGTEC-Systematik. Erst nach
> fachlicher Prüfung durch den zuständigen Fachbereich darf ein Datensatz auf
> `green` gesetzt werden. Ein Test sichert ab, dass die Bibliothek nicht
> versehentlich als geprüft ausgeliefert wird.

---

## 7. Anlageninstanz (Abschnitt 21)

Modellname: `ingtec.system.instance`

Eine Anlage im Kundenbetrieb ist nicht identisch mit einem Anlagentyp. Der Typ
beschreibt die Gattung, die Instanz die konkrete Anlage:

```
Typ:              Kraftbetriebenes Tor
Anzahl:           6
Standort:         Produktionshalle
Hersteller:       Hörmann
Baujahr:          2018
letzte Prüfung:  unbekannt
Wartung:          jährlich
Prüfbericht:     nicht vorhanden
Mangel:           unbekannt
```

Mehrere Instanzen desselben Typs sind ausdrücklich möglich – sechs Tore in
der Produktionshalle und zwei im Lager Nord sind zwei Instanzen mit
unterschiedlichen Fakten. Die Rule Engine wertet jede Instanz einzeln aus, so
dass verkürzte Intervalle nur dort greifen, wo sie begründet sind.

---

## 8. Fachliche Entscheidungsmatrix (Abschnitt 22)

Eine einfache boolesche Logik – `prüfpflichtig = Ja/Nein` – ist fachlich nicht
ausreichend. Die Engine arbeitet deshalb **dreiwertig**:

| Ergebnis | Bedeutung | Folge im Navigator |
| --- | --- | --- |
| `match` | alle Bedingungen erfüllt | Anforderung wird ausgewiesen |
| `no_match` | mindestens eine Bedingung falsch | Regel bleibt stumm |
| `indeterminate` | könnte greifen, es fehlen Angaben | gezielte Rückfrage |

Der dritte Zustand ist der fachlich wichtigste. Er erzeugt keine falsche
Sicherheit, sondern genau die Rückfrage, die zur Entscheidung fehlt – das
"Prüfbedarf näher bestimmen" aus Abschnitt 23.

Die Verknüpfungen folgen dreiwertiger Logik:

```
all:  falsch, sobald ein Zweig falsch ist
      sonst unbestimmt, sobald ein Zweig unbestimmt ist
      sonst wahr

any:  wahr, sobald ein Zweig wahr ist
      sonst unbestimmt, sobald ein Zweig unbestimmt ist
      sonst falsch

not:  invertiert wahr und falsch, unbestimmt bleibt unbestimmt
```

Ein Detail mit spürbarer Wirkung auf die Nutzerführung: sobald ein Zweig
einer `all`-Verknüpfung **falsch** ist, meldet die Engine **keine** fehlenden
Fakten mehr. Wer keine Arbeitnehmer beschäftigt, wird nicht nach der Bauart
des Tores gefragt – die Antwort würde am Ergebnis nichts ändern.

### Fragen entstehen aus Regeln, nicht aus einem Fragebogen

Jede Regelbedingung referenziert einen Faktenschlüssel. Der Fragenkatalog
(`core/model/questions.js`) ordnet jedem Schlüssel eine Frage zu. Ist ein Fakt
unbekannt, meldet die Engine ihn zurück und der Navigator stellt genau diese
Frage. Es gibt deshalb keinen statischen Fragebogen, sondern einen adaptiven
Dialog, der nur erhebt, was für eine Aussage erforderlich ist.

### Faktennamensräume

| Präfix | Quelle |
| --- | --- |
| `object.*` | Objektfakten der Session |
| `instance.*` | Fakten der bewerteten Anlageninstanz |
| `system.present` | die Instanz existiert |
| `system.is_work_equipment` | abgeleitet aus der Kategorie |
| `system.<ID>.present` | eine Anlage dieses Typs ist in der Session erfasst |

Gespeichert werden die Schlüssel **ohne** Präfix; die Engine ergänzt den
Namensraum beim Auflösen. Ein Test sichert das ab, weil ein versehentliches
Präfix in den Vorbelegungen wirkungslos bliebe, ohne einen Fehler zu erzeugen.

### Operatoren

`is_true`, `is_false`, `eq`, `ne`, `in`, `not_in`, `gt`, `gte`, `lt`, `lte`,
`known`, `unknown`, `older_than_months`.

`older_than_months` behandelt einen ausdrücklich unbekannten Prüfzeitpunkt
als überfällig. Ein nicht nachweisbarer Prüfstand ist fachlich wie ein
fehlender Prüfstand zu behandeln.

---

## 9. Regelmodell (Abschnitt 23)

Modellname: `ingtec.rule`

```js
{
  code: 'RULE-AMVO-GATE-001',
  title: 'Kraftbetriebenes Tor – wiederkehrende Prüfung',
  system_type: 'SYS-AT-GATE-001',
  conditions: { all: [
    { fact: 'object.workplace',        op: 'is_true' },
    { fact: 'instance.power_operated', op: 'is_true' },
  ]},
  outcome: {
    kind: 'pruefung',
    statement: 'Kraftbetriebene Tore in Arbeitsstätten unterliegen einer '
             + 'wiederkehrenden Prüfung durch geeignete fachkundige Personen. '
             + 'Der Prüfbedarf ist nach Bauart und Verwendung näher zu bestimmen.',
    interval: { value: 1, unit: 'year' },
    required_documents: ['Prüfbuch des Tores', 'Betriebsanleitung', 'Konformitätserklärung'],
    recommended_action: 'Torprüfung inklusive Kraftmessung und Sicherheitseinrichtungen beauftragen.',
  },
  assertion_quality: ASSERTION_QUALITY.GESETZLICH,
  legal_basis: 'AM-VO – Arbeitsmittelverordnung; ASchG',
  version: '1.2',
  valid_from: '2026-01-01',
  state: 'draft',
}
```

---

## 10. Regelstatus (Abschnitt 24)

```
draft → review → approved
                    ↓
              withdrawn / archived
```

**Nur freigegebene Regeln dürfen Ergebnisse für externe Nutzer erzeugen.**

Das ist an drei Stellen unabhängig voneinander abgesichert:

1. **Rule Engine** – `evaluateSession(session, { audience: 'public' })` wertet
   nur Regeln im Status `approved` aus. Zurückgehaltene Regeln werden gezählt
   und als Hinweis ausgewiesen, nicht stillschweigend verschluckt.
2. **API** – der interne Modus setzt eine angemeldete Sitzung voraus. Ein
   externer Aufruf mit `audience: 'internal'` fällt auf `public` zurück.
3. **Odoo-Datensatzregel** – `ir.rule` beschränkt öffentliche und
   Portalbenutzer lesend auf `state = 'approved'`.

Drei Ebenen sind hier kein Überbau: die Freigabe ist die fachliche
Kernzusage des Produkts. Ein einzelner Fehler in der API darf nicht dazu
führen, dass ein Entwurf als belastbare Aussage nach außen geht.

Das gesamte Startregelwerk – 41 Regeln – ist im Status `draft`. Der externe
Modus liefert damit heute bewusst **keine** Anforderungen. Der Prototyp startet
in der internen Vorschau und macht das mit einem roten Hinweisbalken sichtbar.

---

## 11. Regelpriorität (Abschnitt 25)

| Priorität | Bedeutung | Aussagequalität |
| --- | --- | --- |
| 1 | konkrete behördliche Vorgabe | `behoerdlich` |
| 2 | unmittelbare Rechtsvorschrift | `gesetzlich` |
| 3 | technisches Regelwerk | `regelwerk` |
| 4 | Norm | `norm` |
| 5 | Herstelleranforderung | `hersteller` |
| 6 | fachliche INGTEC-Empfehlung | `empfehlung` |

Die Priorität wird aus der Aussagequalität abgeleitet und kann im Backend
begründet abweichen. Ergebnisse werden je Anlage nach Priorität sortiert
ausgegeben; ein Test sichert die Sortierung ab.

> Die Spezifikation bricht in Abschnitt 25 mit dem Satz "Die tatsächliche
> juristische Verbindlichkeit ist …" ab. Umgesetzt ist deshalb die Hierarchie
> selbst. Wie die Verbindlichkeit gegenüber dem Nutzer zu formulieren ist,
> trägt jede Regel bereits mit: `assertion_quality` und `legal_basis` werden
> an jeder Anforderung angezeigt. Der Anschlusstext ist nachzureichen.

---

## 12. Intervallermittlung

Je Anlageninstanz gilt das **kürzeste** geforderte Intervall aller greifenden
Regeln. Greift keine Regel mit Intervall, gilt die typische Prüffrist des
Anlagenstamms.

Beispiel: eine Regalanlage trägt jährliche Inspektion. Wird sie mit
Flurförderzeugen bedient, greift zusätzlich eine Empfehlung mit sechs
Monaten. Ergebnis: sechs Monate – aber nur für die Instanz, bei der
Staplerverkehr angegeben wurde.

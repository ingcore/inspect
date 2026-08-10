# INGTEC Safety Navigator

Interaktive Ermittlung des Prüfbedarfs technischer Anlagen.

Umsetzung der technischen Produkt- und Umsetzungsspezifikation Version 1.1
vom 09.08.2026, Abschnitte 1 bis 25.

---

## Was das ist

Der Safety Navigator beantwortet für einen Betrieb die Frage **„Was müssen
Sie prüfen lassen?"** – über eine Gebäudegrafik, eine Anlagenliste oder eine
Suche, und liefert Prüfbedarf, Fristen, benötigte Unterlagen und
Rechtsgrundlagen, sortiert nach Bindungswirkung.

Er ist fachlich eine eigenständige Anwendung und technisch über definierte
Schnittstellen mit Odoo verbunden. Alle drei in der Spezifikation geforderten
Bereitstellungsvarianten sind aus derselben Codebasis bedienbar.

---

## Schnellstart

```bash
# Tests des fachlichen Kerns – ohne npm install lauffähig
npm run navigator:test

# Prototyp lokal starten
npm run navigator:serve
# → http://localhost:8080/safety-navigator/

# Odoo-Stammdaten und Kern-Spiegelung neu erzeugen
npm run navigator:data

# Konsistenz prüfen (Daten, Spiegelung, Tests)
npm run navigator:check
```

---

## Aufbau

```
safety-navigator/
├── index.html                      externe Web-App (Variante B)
├── core/                           fachlicher Kern – dependency-frei
│   ├── model/
│   │   ├── object-types.js         15 Objektarten (Abschnitt 11)
│   │   ├── system-categories.js    8 Kategorien (Abschnitt 12)
│   │   ├── system-types.js         36 Anlagentypen (Abschnitt 13–15)
│   │   ├── questions.js            Fragenkatalog, an Regeln gekoppelt
│   │   └── rules.js                41 Regeln (Abschnitt 23–25)
│   ├── engine/
│   │   ├── rule-engine.js          dreiwertige Auswertung (Abschnitt 22)
│   │   ├── session.js              Session und Zustand (Abschnitt 8–10, 21)
│   │   └── search.js               Anlagensuche (Abschnitt 20)
│   └── visual/building.js          SVG mit Layern und Hotspots (Abschnitt 16–18)
├── ui/                             Prototyp-Frontend (Abschnitt 7)
├── odoo/ingtec_safety_navigator/   Odoo-Modul (Variante A/C)
├── docs/
│   ├── 01-architektur.md           Varianten, Empfehlung, Website-Einstieg
│   ├── 02-datenmodell.md           Modelle, Rule Engine, Freigabe, Priorität
│   ├── 03-frontend.md              Komponenten, SVG, Mobile, Suche
│   └── 04-api.md                   Schnittstellenvertrag der Navigator-API
└── scripts/                        Generatoren für Odoo-Daten und Spiegelung
```

---

## Die drei Bereitstellungsvarianten

| Variante | Wann | Wo im Repository |
| --- | --- | --- |
| **A** natives Odoo-Modul | Odoo.sh oder On-Premise | `odoo/ingtec_safety_navigator/` |
| **B** externe Web-App im iFrame | reines Odoo Online | `index.html` + `ui/` |
| **C** Hybrid – **empfohlen** | UI in Odoo, Logik als Service | Kern + `controllers/main.py` |

In allen drei Varianten ist der fachliche Kern **derselbe Code**, nicht nur
dasselbe Konzept. `npm run navigator:check` schlägt fehl, sobald die Kopie im
Odoo-Modul von der Quelle abweicht.

Ausführliche Begründung: [`docs/01-architektur.md`](docs/01-architektur.md).

---

## Zwei Entwurfsentscheidungen, die den Unterschied machen

### Dreiwertige Auswertung statt Ja/Nein

Eine einfache boolesche Logik – „prüfpflichtig = Ja/Nein" – ist fachlich nicht
ausreichend. Die Rule Engine kennt deshalb `match`, `no_match` und
`indeterminate`. Der dritte Zustand erzeugt keine falsche Sicherheit, sondern
genau die Rückfrage, die zur Entscheidung fehlt.

Daraus folgt unmittelbar der Fragendialog: es gibt keinen statischen Fragebogen.
Jede Frage stammt aus einer konkreten Regel und wird nur gestellt, wenn sie das
Ergebnis noch ändern kann.

### Freigabe als harte Grenze

**Nur freigegebene Regeln dürfen Ergebnisse für externe Nutzer erzeugen.**
Abgesichert in der Rule Engine, in der API und über eine Odoo-Datensatzregel.

Das gesamte Startregelwerk ist im Status `draft`, die Anlagenbibliothek trägt
durchgängig den Quellenstatus `red`. Beide sind fachlich plausibel formuliert,
aber **nicht freigegeben**. Rechtsgrundlagen, Normen, Fristen und Prüfarten
sind Entwurfsvorschläge und vor der Freigabe durch den zuständigen
INGTEC-Fachbereich zu prüfen.

Der externe Modus liefert deshalb heute bewusst keine Anforderungen. Der
Prototyp startet in der internen Vorschau und weist das sichtbar aus.

---

## Freigabeprozess

Im Odoo-Backend unter **Safety Navigator → Regelwerk → Freigabe offen**:

```
Entwurf → Zur fachlichen Prüfung → Fachlich geprüft → Freigeben
```

Freigeben setzt eine dokumentierte fachliche Prüfung voraus und ist der
Gruppe „Navigator: Fachliche Leitung" vorbehalten. Erst dann wird die Regel
extern wirksam und der Quellenstatus wechselt auf grün.

Analog für die Anlagenbibliothek unter **Anlagenbibliothek → Anlagenstamm**
über „Fachlich verifizieren".

---

## Odoo-Modul installieren

```bash
cp -r safety-navigator/odoo/ingtec_safety_navigator /pfad/zu/odoo/addons/
# Odoo neu starten, Apps-Liste aktualisieren, "INGTEC Safety Navigator" installieren
```

Danach steht zur Verfügung:

* Landingpage unter `/safety-navigator`, `/pruefbedarf` und `/safety-check`
* Website-Baustein **INGTEC Safety Navigator** im Website Builder
* Backend-Menü mit Vorgängen, Anlagenbibliothek und Regelwerk
* Navigator-API unter `/safety-navigator/api/*`

Das Modul wurde gegen die Odoo-17-API geschrieben, aber **nicht in einer
laufenden Odoo-Instanz getestet** – im Repository steht keine zur Verfügung.
Python und XML sind syntaktisch geprüft. Ein Installationstest steht aus.

---

## Tests

```
npm run navigator:test
```

46 Tests, keine Abhängigkeiten, kein Build. Abgedeckt sind unter anderem:

* Vollständigkeit von Objektarten und Anlagenbibliothek gegen Abschnitt 11 und 15
* Pflichtfelder des Anlagenstamms gegen Abschnitt 13 und 14
* dreiwertige Logik einschließlich Abkürzung falscher Konjunktionen
* Freigabefilter: Entwürfe erreichen externe Nutzer nicht
* Prioritätssortierung nach Abschnitt 25
* Fragen entstehen aus Regeln und verschwinden nach Beantwortung
* Intervallermittlung je Instanz
* Suche über Namen, Synonyme und Umlaute
* SVG-Layerstruktur, Hotspot-Eindeutigkeit und Barrierefreiheit

Das Frontend wurde zusätzlich mit Chromium über Playwright durchgespielt:
Desktop-Ablauf von der Landingpage bis zum Ergebnis sowie die
Zwei-Tipp-Bedienung mit Bottom-Sheet am Smartphone.

---

## Offen

* **Spezifikation ab Abschnitt 26** – die Vorlage bricht in Abschnitt 25 mit
  „Die tatsächliche juristische Verbindlichkeit ist …" ab. Umgesetzt ist die
  Prioritätshierarchie selbst; die Formulierung der Verbindlichkeit gegenüber
  dem Nutzer ist nachzureichen.
* **Fachliche Freigabe** von Anlagenbibliothek und Regelwerk.
* **Installationstest** des Odoo-Moduls auf einer echten Instanz.
* **KI-basierte Anlagenklassifikation** aus Fotos (Abschnitt 20, als spätere
  Ergänzung vorgesehen).

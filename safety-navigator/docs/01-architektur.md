# Solution Architecture – INGTEC Safety Navigator

Umsetzung der technischen Produkt- und Umsetzungsspezifikation, Version 1.1
vom 09.08.2026, Abschnitte 1 bis 6.

---

## 1. Leitgedanke

Der Safety Navigator ist **fachlich eine eigenständige Anwendung** und
**technisch über definierte Schnittstellen mit Odoo verbunden**. Damit bleibt
die fachliche Logik unabhängig davon, wie die Anwendung ausgeliefert wird.

Konkret heißt das in diesem Repository: es gibt genau einen fachlichen Kern
(`safety-navigator/core`) und mehrere Hüllen darum.

```
                        ┌──────────────────────────────┐
                        │  Safety Navigator Core       │
                        │  Anlagenlogik, Rule Engine,  │
                        │  Regelwerk, Session          │
                        └──────────────┬───────────────┘
                                       │  identisch in allen Varianten
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
┌───────┴────────┐          ┌──────────┴─────────┐         ┌──────────┴────────┐
│ Variante A     │          │ Variante B         │         │ Variante C        │
│ Odoo-Modul     │          │ externe Web-App    │         │ Hybrid            │
│ Owl im Website │          │ im iFrame          │         │ UI in Odoo,       │
│ Builder        │          │ navigator.ingtec.at│         │ Logik als Service │
└────────────────┘          └────────────────────┘         └───────────────────┘
```

Der Kern ist dependency-frei, ohne Build-Schritt lauffähig und in Node wie im
Browser identisch. Das ist die technische Voraussetzung dafür, dass die
fachliche Datenstruktur in allen drei Varianten wirklich gleich bleibt und
nicht nur gleich gemeint ist.

---

## 2. Schichten (Spezifikation Abschnitt 2)

| Schicht | Umsetzung in diesem Repository |
| --- | --- |
| Odoo Website | `odoo/ingtec_safety_navigator/views/templates.xml`, `views/snippets.xml` |
| Safety Navigator UI | `ui/` (Prototyp) und `odoo/.../static/src/js/safety_navigator.js` (Owl) |
| Safety Navigator API | `odoo/ingtec_safety_navigator/controllers/main.py` |
| Rule Engine | `core/engine/rule-engine.js` |
| Anlagen- und Regelwerksdatenbank | `core/model/`, gespiegelt nach `odoo/.../data/*.xml` |
| Odoo CRM / Kontakte / Angebote | `models/navigator_session.py`, `models/crm_lead.py` |
| Safety-Score(R) / Ingplan / SharePoint | `buildScoreInput()` als Übergabepunkt |

Die Spezifikation warnt ausdrücklich davor, die fachliche Logik in einzelnen
JavaScript-Schnipseln oder Website-Blöcken abzulegen. Deshalb enthält der
Website-Baustein **keine** Fachlogik: er ist ein Montagepunkt und nichts sonst.

---

## 3. Empfohlene Zielvariante

Empfohlen wird die **Hybridarchitektur (Variante C)**, auch wenn Odoo.sh
eingesetzt wird.

**Begründung.** Der teure und langlebige Teil des Produkts ist das Regelwerk,
nicht die Oberfläche. Ein Regelwerk, das nur als Odoo-Modul existiert, ist an
den Lebenszyklus einer Odoo-Version gebunden: jedes Major-Upgrade berührt dann
auch die fachlichen Inhalte. Umgekehrt braucht der Vertriebsprozess – Lead,
Angebot, Auftrag, Kommunikation – nichts, was Odoo nicht bereits besser kann.

Die Aufgabenteilung folgt Abschnitt 4:

**Odoo** – betriebswirtschaftlicher Backbone
CRM, Kunden, Kontakte, Leads, Angebote, Aufträge, Kommunikation, Website,
Terminvereinbarung, später gegebenenfalls Portal.

**Safety Navigator Core** – fachlicher Kern
Anlagenlogik, Anlagentypen, Entscheidungsbäume, Prüflogik,
Wartung/Prüfung/Revision, Rechtsgrundlagen, Normen, Regelwerke,
Dokumentenbedarf, Safety-Check-Ergebnis, Rule Engine.

**Safety-Score(R) Core** – Bewertung
Scores, Risikoindikatoren, Managementauswertung, Benchmarking.

Damit wird Odoo zum betriebswirtschaftlichen Backbone, ohne zum fachlichen
Regelwerksmonolithen zu werden.

### Abgrenzung, die im Code durchgehalten wird

Der Navigator berechnet **keinen Score**. `evaluateSession()` liefert
Anforderungen, Fristen und offene Fragen; `buildScoreInput()` erzeugt daraus
ein Eingangsprofil je Safety-Score(R)-Kategorie. Die Bewertung selbst bleibt im
Safety-Score(R) Core. Ein Test sichert das ab: das Übergabeobjekt darf kein
Feld `score` enthalten.

---

## 4. Entscheidung nach Odoo-Betriebsmodell (Abschnitt 3)

### 4.1 Odoo.sh oder On-Premise

Bevorzugte Lösung ist das eigene Modul `ingtec_safety_navigator`. Die
öffentliche Oberfläche wird als Owl-Komponente innerhalb der Odoo-Website
umgesetzt und über `web.assets_frontend` geladen. Die Lösung kann unmittelbar
mit Odoo-Modellen, CRM, Kontakten, Leads und Angeboten kommunizieren.

Das Modul in diesem Repository ist so gebaut. Es lädt drei Dinge in das
Frontend-Bundle:

```python
"web.assets_frontend": [
    "ingtec_safety_navigator/static/src/scss/safety_navigator.scss",
    "ingtec_safety_navigator/static/src/core/**/*.js",   # fachlicher Kern
    "ingtec_safety_navigator/static/src/js/**/*.js",     # Owl-Komponenten
    "ingtec_safety_navigator/static/src/xml/**/*.xml",   # Owl-Templates
],
```

### 4.2 Odoo Online

Bei reinem Odoo Online ist keine Python-Custom-Modulentwicklung vorgesehen. Der
Navigator wird dann als externe Web-Applikation betrieben, zum Beispiel unter
`navigator.ingtec.at`, und in die Odoo-Website eingebettet:

```html
<iframe src="https://navigator.ingtec.at/start"
        title="INGTEC Safety Navigator"
        loading="lazy"
        allow="camera"
        style="width:100%;min-height:900px;border:0"></iframe>
```

Der Prototyp in `safety-navigator/index.html` ist genau diese externe Web-App.
Er verwendet denselben Kern und dieselben Hotspot-IDs wie das Odoo-Modul.

**Was beim iFrame zu beachten ist**

* Die Höhe kann nicht automatisch mitwachsen. Entweder eine großzügige
  Mindesthöhe setzen oder per `postMessage` die Inhaltshöhe melden.
* `allow="camera"` ist erforderlich, wenn die Fotoaufnahme aus Abschnitt 20
  genutzt werden soll.
* Cookies im iFrame sind Drittanbieter-Cookies. Der Prototyp kommt deshalb ohne
  Cookies aus und speichert ausschließlich im `localStorage`.
* Für die Lead-Übergabe an Odoo ist eine serverseitige Schnittstelle nötig;
  ein reines Frontend im iFrame kann keinen Lead anlegen.

### 4.3 Wechsel zwischen den Varianten

Ein Wechsel von B nach A oder C betrifft nur die Hülle. Die Modelle, die
Regeln, die Bewertungslogik und die SVG-Geometrie bleiben unverändert, weil
sie im Kern liegen. Das ist der praktische Nutzen der Trennung.

---

## 5. Website-Einstieg (Abschnitt 5)

Der Navigator erhält eine eigene Landingpage. Der Controller bedient alle drei
in der Spezifikation genannten URLs:

```
/safety-navigator      empfohlen
/pruefbedarf           Alternative
/safety-check          Alternative
```

Zusätzlich beantwortet `/safety-navigator/<slug>` objektartspezifische
Einstiege, etwa `/safety-navigator/industrie`. Diese Seiten tragen die
SEO-Daten aus dem Objektartmodell und bilden damit die Grundlage für
branchenspezifische Landingpages.

Auf der Startseite wird prominent eingebunden:

> **Was müssen Sie prüfen lassen?**
> Finden Sie in wenigen Minuten heraus, welche technischen Anlagen und
> Prüfbereiche für Ihren Betrieb relevant sind.
> `[Safety Check starten]`

Sekundäre Einstiege: `[Ich kenne meine Anlage]`, `[Ich habe einen Bescheid]`,
`[Ich benötige ein Angebot]`. Sie führen nicht auf eigene Seiten, sondern
setzen den Navigator direkt in den passenden Zustand:

| Einstieg | Wirkung |
| --- | --- |
| Safety Check starten | Schritt 1, Objektartauswahl |
| Ich kenne meine Anlage | Schritt 2 mit aktiver Suche |
| Ich habe einen Bescheid | setzt `object.permit_exists = true`, Priorität 1 greift sofort |
| Ich benötige ein Angebot | direkt zum Kontaktformular |

---

## 6. Website Building Block (Abschnitt 6)

Bei nativer Odoo-Integration ist der Navigator ein eigener Website-Baustein mit
der Bezeichnung **INGTEC Safety Navigator** im Website Builder.

```html
<section class="s_ingtec_safety_navigator">
  <div class="o_ingtec_navigator_mount" data-object-type="" data-entry="start">
    <!-- Fallback ohne JavaScript, wird beim Montieren ersetzt -->
  </div>
</section>
```

Der Website-Administrator kann den Block wie einen normalen Odoo-Baustein
positionieren, auf verschiedenen Landingpages verwenden und über die
Snippet-Optionen zwei Dinge einstellen, ohne Entwicklung:

* **Vorausgewählte Objektart** – zum Beispiel `industrie` auf einer
  Industrie-Landingpage. Der Navigator überspringt dann Schritt 1.
* **Einstieg** – welcher der vier Einstiege aus Abschnitt 5 aktiv ist.

Der Prototyp verwendet **denselben Selektor**. Was im Prototyp funktioniert,
funktioniert damit auch im Website Builder, ohne Anpassung des Montagecodes.

---

## 7. Was in diesem Repository liegt

```
safety-navigator/
├── index.html                    externe Web-App (Variante B), lauffähig
├── core/                         fachlicher Kern, dependency-frei
│   ├── model/                    Objektarten, Kategorien, Anlagen, Fragen, Regeln
│   ├── engine/                   Rule Engine, Session, Suche
│   └── visual/                   SVG-Gebäudegrafik mit Layern und Hotspots
├── ui/                           Prototyp-Frontend (Komponenten wie in Abschnitt 7)
├── odoo/ingtec_safety_navigator/ Odoo-Modul (Variante A/C)
├── docs/                         diese Dokumentation
└── scripts/                      Generatoren für Odoo-Daten und Kern-Spiegelung
```

Tests: `npm run navigator:test` (46 Tests, ohne Installation lauffähig).
Konsistenzprüfung: `npm run navigator:check`.

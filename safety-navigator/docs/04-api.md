# Navigator-API

Schnittstelle zwischen Safety Navigator UI und Safety Navigator Core.

Die Endpunkte sind so geschnitten, dass sie in Variante A/C von Odoo bedient
werden (`odoo/ingtec_safety_navigator/controllers/main.py`) und in Variante B
von einem eigenständigen Service. **Das Frontend bleibt in beiden Fällen
unverändert** – das ist der Zweck dieses Vertrags.

Alle JSON-Endpunkte folgen der Odoo-Konvention `type="json"`: POST mit
JSON-RPC-Hülle, Parameter im Feld `params`.

---

## Zugriffsmodell

Der Check ist laut Abschnitt 9 anonym möglich. Alle Endpunkte sind deshalb
`auth="public"`.

Der Zugriff auf einen Vorgang erfolgt ausschließlich über die
**Session-Referenz**. Sie ist kryptografisch zufällig und wirkt damit als
Zugriffstoken (Capability). Daraus folgen zwei Regeln, die eingehalten werden
müssen, wenn die API nachgebaut wird:

1. **Nie eine Liste von Sessions ausgeben.** Es gibt bewusst keinen
   Listen-Endpunkt.
2. **Die Referenz nicht ableitbar vergeben.** Kein Zähler, kein Zeitstempel.

Die Referenz wird bei der Suche normalisiert (Leerzeichen entfernt,
Großschreibung), damit sie telefonisch weitergegeben werden kann.

---

## Stammdaten

### `POST /safety-navigator/api/catalog`

Objektarten, Kategorien und Anlagentypen für das Frontend.

```json
{ "object_type": "industrie" }
```

Ist `object_type` gesetzt, sind bereits nur die für diese Objektart aktiven
Anlagentypen enthalten – inklusive der Treffer über sekundäre Kategorien.

```json
{
  "object_types": [ { "id": "industrie", "name": "Industrie", "categories": ["brandschutz", "…"], "…": "…" } ],
  "categories":   [ { "id": "brandschutz", "name": "Brandschutz", "svg_layer_id": "layer_fire_protection", "…": "…" } ],
  "system_types": [ { "id": "SYS-AT-GATE-001", "name": "Kraftbetriebenes Tor", "synonyms": ["Rolltor", "…"], "…": "…" } ]
}
```

### `POST /safety-navigator/api/rules`

```json
{ "audience": "public" }
```

Abschnitt 24: extern werden ausschließlich Regeln im Status `approved`
ausgegeben. `audience: "internal"` setzt eine angemeldete Sitzung voraus und
fällt sonst auf `public` zurück. Die Antwort nennt die tatsächlich
angewandte Zielgruppe:

```json
{ "audience": "public", "rules": [ { "code": "RULE-AMVO-GATE-001", "…": "…" } ] }
```

Zurückgezogene und archivierte Regeln werden nie ausgeliefert, auch intern
nicht.

---

## Session

### `POST /safety-navigator/api/session`

Legt eine anonyme Session an. Optional mit vorgewählter Objektart, dann werden
deren Vorbelegungen übernommen.

```json
{ "object_type": "industrie" }
```

Antwort: das Session-Objekt (siehe unten).

### `POST /safety-navigator/api/session/<reference>`

Nimmt einen Vorgang wieder auf (SaveAndContinue). Antwort: das Session-Objekt
oder `{"error": "not_found"}`.

### `POST /safety-navigator/api/session/<reference>/facts`

```json
{ "facts": { "workplace": true, "permit_exists": true } }
```

Schlüssel **ohne** Namensraum-Präfix. Nur einfache Werte werden übernommen;
verschachtelte Strukturen werden verworfen.

### `POST /safety-navigator/api/session/<reference>/instance`

Anlegen oder Aktualisieren einer Anlageninstanz.

```json
{
  "system_type": "SYS-AT-GATE-001",
  "values": { "quantity": 6, "location": "Produktionshalle", "last_inspection_unknown": true }
}
```

Zum Aktualisieren statt `system_type` das Feld `instance_id` übergeben.
Schreibbar sind nur die Felder aus `ALLOWED_INSTANCE_FIELDS`; alles andere wird
ignoriert. Je Session sind höchstens 200 Instanzen zulässig.

Fehler: `unknown_system_type`, `too_many_instances`, `not_found`.

### `POST /safety-navigator/api/session/<reference>/instance/<id>/delete`

### `POST /safety-navigator/api/session/<reference>/result`

Friert das Ergebnis der Rule Engine an der Session ein und schließt sie ab.

```json
{ "result": { "…": "Ergebnis aus evaluateSession()" } }
```

Das ist kein Cache. Da Regeln versioniert und freigegeben werden, muss später
nachvollziehbar bleiben, welche Regelfassung zu welcher Aussage geführt hat.

### `POST /safety-navigator/api/session/<reference>/lead`

Übergabe an das Odoo CRM. Erst hier entstehen personenbezogene Daten.

```json
{
  "contact": {
    "company_name": "Muster GmbH",
    "contact_name": "Max Mustermann",
    "email": "office@example.at",
    "phone": "+43 …",
    "consent": true
  }
}
```

`consent` und `email` sind Pflicht; sonst `consent_required` bzw.
`email_required`. Erfolg:

```json
{ "ok": true, "reference": "SN-2026-X8F72P", "lead_id": 42 }
```

### `POST /safety-navigator/api/session/<reference>/attachment`

Multipart-Upload (`type="http"`, CSRF aktiv). Feld `ufile`, optional
`document_type`. Maximal 20 MB je Datei. Die Datei wird als `ir.attachment` an
der Session abgelegt.

---

## Session-Objekt

```json
{
  "reference": "SN-2026-X8F72P",
  "state": "in_progress",
  "object_type_id": "industrie",
  "object_facts": { "workplace": true, "production": true },
  "consent_status": "anonymous",
  "started_at": "2026-08-09T10:12:00",
  "completed_at": null,
  "instances": [
    {
      "id": 17,
      "system_type_id": "SYS-AT-GATE-001",
      "selection": "has",
      "facts": {
        "count": 6,
        "location": "Produktionshalle",
        "manufacturer": "Hörmann",
        "year_built": 2018,
        "last_inspection": "unknown",
        "maintenance_contract": true,
        "report_available": false,
        "known_defects": false,
        "power_operated": true
      }
    }
  ],
  "documents": [ { "id": 5, "name": "Bescheid.pdf", "document_type": "bescheid" } ]
}
```

`facts` mischt die strukturierten Felder der Instanz mit den frei erfassten
Antworten aus dem Json-Feld. Für die Rule Engine ist beides gleichwertig – sie
sieht nur Faktenschlüssel.

`last_inspection` ist entweder ein ISO-Datum, `"unknown"` oder `null`. Der Wert
`"unknown"` ist fachlich bedeutsam: der Operator `older_than_months` behandelt
ihn als überfällig, weil ein nicht nachweisbarer Prüfstand wie ein fehlender
Prüfstand zu behandeln ist.

---

## Auswertung

Die Auswertung findet **im Frontend** statt, mit demselben Kern, den auch der
Server verwendet:

```js
import { evaluateSession, buildScoreInput } from './core/index.js';

const result = evaluateSession(session, { audience: 'public' });
const scoreInput = buildScoreInput(result);
```

Das ist bewusst so: die Auswertung ist reine Funktion ohne Seiteneffekte, sie
braucht keinen Serverweg und macht den Dialog verzögerungsfrei. Der Server
bleibt trotzdem die Autorität – er entscheidet über `/api/rules`, welche
Regeln das Frontend überhaupt zu sehen bekommt. Ein manipuliertes Frontend
kann sich damit keine unfreigegebenen Regeln beschaffen.

Soll die Auswertung serverseitig laufen (Variante C mit eigenem Service), wird
derselbe Kern dort ausgeführt und das Ergebnis als
`evaluateSession()`-kompatibles Objekt geliefert. Das Frontend merkt keinen
Unterschied.

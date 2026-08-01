# INGTEC Safety-Score® – Bewertungsanwendung

Umsetzung von **PRD-INGTEC-SAFETY-SCORE-001, Version 1.0** für die Bewertung eines Objektes
oder einer Anlage. Die Anwendung besteht aus einer deterministischen Score-Engine und einer
Bedienoberfläche und läuft ohne Build-Schritt direkt im Browser.

Start: `safetyscore/index.html` (über GitHub Pages oder eine HTTPS-Adresse öffnen; die
iOS-Dateivorschau ist kein vollwertiger Browser).

## Modell in einem Satz

**Safety-Score®: x,x von 100 Risikopunkten – Klasse A–E.** 0 ist der bestmögliche, 100 der
maximal kritische Zustand innerhalb des festgelegten Scopes. Niedriger ist besser. Der Zahlenwert
steht nie allein: Score, **Compliance**, **Konfidenz** und **Gate** sind vier getrennte
Ergebnisachsen, ergänzt um Scope, Stichtag und Modellversion.

## Aufbau

```
safetyscore/
  index.html            Einstieg der Anwendung
  app.css               INGTEC-Designsystem (weißes/graues Glas, INGTEC-Grün)
  js/engine/            Score-Engine, frei von UI- und Speicherlogik
    fixed.js            Festkommaarithmetik in Basispunkten (BigInt)
    model.js            Modellversion 1.0.0: Dimensionen, Schweregrade, Modifikatoren,
                        Klassen, Gates, Compliance, Konfidenz, Wortlaut
    profiles.js         Profilregister aller 35 PRD-Profile mit Gewichten in Basispunkten
    criteria/           Freigegebene Kriterienkataloge (T-BMA, C-BAG, B-COM)
    score-engine.js     Berechnung, Gates, Compliance, Konfidenz, Abdeckung, Trace
    aggregate.js        Portfolioaggregation, gewichtetes P90, Trend
    snapshot.js         Calculation Snapshot, SHA-256-Hashes, Audit-Trail
    hash.js             Kanonische Serialisierung und Hashbildung
  js/ui/                Zustand, Bausteine, Ansichten, Steuerung
  tests/engine.test.mjs Validierungsstufe V0 und Golden-Master-Satz
```

## Rechenweg (PRD 7)

| Schritt | Formel |
| --- | --- |
| Prüfpunkt | `r_i = min(1; (s_i / 4) · F_A · F_E · F_R · F_M)` |
| Dimension | `D_d = 100 · [Σ(w_i · r_i) / Σ(w_i)]` |
| Rohscore | `S_raw = Σ(alpha_d · D_d)`, `Σ alpha_d = 10.000 Basispunkte` |
| Finalwert | `S_final = max(S_raw; höchster aktiver Gate-Floor)` |

- Rechnung vollständig in ganzzahliger Festkommaarithmetik (BigInt), keine Gleitkommaeffekte.
- Nicht anwendbare Kriterien werden aus Zähler und Nenner entfernt.
- Nicht prüfbare Kriterien gelten nie als erfüllt; sie senken die Konfidenz und lösen bei
  Schutzkritikalität KO-06 aus.
- Modifikatoren wirken nur dort, wo die Matrix aus PRD 7.5 sie zulässt, sonst mit 1,00.
- Die Klasse wird aus dem **ungerundeten** Finalwert bestimmt; angezeigt wird auf eine
  Dezimalstelle gerundet.

## Was die Anwendung leistet

| Ansicht | Inhalt |
| --- | --- |
| Bewertungsobjekt | Scope-Pflichtangaben nach PRD 5.2, Profil- und Score-Art-Wahl, Vollständigkeitsprüfung |
| Bewertung | Kriterien je Modul mit Anwendbarkeit, Schweregrad samt Ankerbeispielen, zugelassenen Modifikatoren, Evidenz, Messwerten mit Plausibilitätsgrenzen, Begründung und Live-Rechenweg |
| Ergebnis | Score-Box, vier Ergebnisachsen, Dimensionswerte, Treiber, Compliance-, Konfidenz- und Abdeckungsdetails, Vorperiodenvergleich |
| Gates | Aktive Gates mit Auslöser, Floor, Mindestklasse, Anforderung und Schließbedingung; Gate-Katalog |
| Trace | Vollständiger Berechnungsweg bis Kriterium, Faktor und Quelle (CALC-009) |
| Freigabe & QS | Quality Gate, Rollen, Freigabe mit unveränderbarem Snapshot und Hash, Auditprotokoll, Korrekturrevision |
| Bericht | Safety-Score® Assessment nach REP-001 bis REP-008 mit verbindlichem Wortlaut, druck- und PDF-fähig |
| Portfolio | Aggregation kompatibler Ergebnisse mit Mittelwert, gewichtetem P90, schlechtestem Wert, Klassenverteilung und weiterwirkenden Gates |
| Modellkarte | Zweck, Grenzen, Klassen, Konfidenzklassen, Modifikatormatrix, Profilregister, Validierungsstand |

## Freigaberegeln

Ein Ergebnis ist extern erst verwendbar, wenn alle Punkte erfüllt sind:

- Scope-Pflichtangaben vollständig
- gewichtete Abdeckung ≥ 85,0 %
- kein KO-06 und keine Freigabesperre KO-08
- Konfidenz mindestens K3
- alle gewichteten Dimensionen bewertet
- Fachreview (Vier-Augen oder Senior-Freigabe) und benannte freigabeberechtigte Person

Unter 70 % Abdeckung wird kein Zahlenwert veröffentlicht (**NB**), zwischen 70 % und 85 % nur ein
vorläufiger interner Score mit maximal K2. Ein freies Überschreiben des Zahlenwertes ist technisch
gesperrt; Korrekturen erzeugen eine neue Revision.

## Tests

```bash
npm run test:safety-score
```

32 Tests der Validierungsstufen V0 und V1: Profilschema und Gewichtssummen, Prüfpunkt- und
Rohscoreformel gegen Anhang B des PRD, Golden Masters (0,0/A bis NB), N/A-Behandlung, KO-06,
Gate-Floors, Monotonie über 200 Zufallskombinationen, Klassengrenzen 10/25/45/70, Compliance- und
Konfidenzformel, Hash-Determinismus und Manipulationserkennung, Aggregation, Trendkompatibilität
und die Performancevorgabe (2.000 Kriterien < 2 s).

## Abgrenzung und offene Punkte

- Der Safety-Score® ist ein proprietäres, normorientiertes Modell. Er ist **keine** behördliche,
  akkreditierte oder ISO-zertifizierte Aussage und keine Eintrittswahrscheinlichkeit.
- Freigegebene Kriterienkataloge bestehen derzeit für **T-BMA** (Vertical Slice der Phase 1),
  **C-BAG** und **B-COM**. Alle übrigen PRD-Profile sind mit Gewichten registriert und als
  „geplant“ gekennzeichnet; sie werden ohne Codeänderung als Katalog ergänzt (PROF-001).
- Speicherung erfolgt lokal im Browser. Für den Produktivbetrieb sind Backend, Mandantentrennung,
  Entra-ID-Anmeldung, serverseitig autoritative Neuberechnung nach Sync, signierte Offline-Pakete
  und ein zentrales unveränderbares Auditlog erforderlich.
- Offen aus PRD 18.1: Freigabe der Gewichtungsmatrizen, Standardfristen je Mangelklasse,
  Rollenfestlegung für Compliance- und Gate-Entscheidungen, Bezeichnung externer Dokumente,
  Pilotkunden und Benchmarksegmente.
- Die im Repository vorhandene ältere Prototyp-App (`index.html` im Wurzelverzeichnis) zeigt eine
  Demo-Bewertung mit umgekehrter Skalenrichtung. Verbindlich ist ausschließlich die Skala dieser
  Anwendung: 0 = optimal, 100 = maximal kritisch.

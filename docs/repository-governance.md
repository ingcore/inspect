# Repository Governance – INGTEC Inspect

Stand: 2026-08-19

## Ziel

`main` ist der freigabefähige Hauptbranch. Produktive oder sicherheitsrelevante Änderungen werden nicht unmittelbar auf `main` entwickelt, sondern über einen Arbeitsbranch und Pull Request integriert.

## Branch-Konvention

- `main` – freigabefähiger Hauptstand
- `feature/*` – Fachfunktionen
- `fix/*` – Fehlerbehebungen
- `security/*` – Sicherheits- und P0-Änderungen

Ein zusätzlicher `develop`-Branch wird erst eingeführt, wenn ein eigenständiger Staging-/Releaseprozess dies tatsächlich erfordert.

## Verbindliches Merge-Gate

Für Pull Requests nach `main` soll der GitHub-Statuscheck `quality-gate` erfolgreich sein. Die CI prüft den derzeitigen Root-Stand und erkennt zusätzlich eine künftige modulare Struktur unter `frontend/` und `backend/`.

Die nachfolgenden Repository-Einstellungen sind in GitHub für `main` zu aktivieren, sofern der verwendete Plan und die Repository-Einstellungen sie unterstützen:

1. Pull Request vor Merge erforderlich.
2. Statuscheck `quality-gate` erforderlich.
3. Branch muss vor Merge aktuell sein, soweit dies im konkreten Workflow praktikabel ist.
4. Offene PR-Konversationen müssen gelöst sein.
5. Force Push deaktivieren.
6. Branch-Löschung deaktivieren.
7. Bypass für Administratoren auf tatsächlich notwendige Notfälle beschränken.

## Deployment

Der GitHub-Pages-Workflow enthält ein zusätzliches `validate-before-deploy`-Gate. Ein Push auf `main` wird daher erst nach erfolgreichem Lint-, Test- und Build-Lauf ausgeliefert.

GitHub Pages ist ausschließlich für nicht vertrauliche Demonstrations-/Frontendstände vorgesehen. Das aktuelle Repository ist öffentlich. Echtdaten, produktive Zugangsdaten, interne Prüfunterlagen und vertrauliche Kundendaten dürfen hier nicht gespeichert werden.

Die produktive Zielanwendung mit Laravel, PostgreSQL, Entra ID, SharePoint/Graph, Odoo und Offline-Synchronisation benötigt eine getrennt abgesicherte Produktionsinfrastruktur. Ein öffentliches GitHub-Pages-Deployment ist dafür kein Produktivhosting.

## Sicherheitsgrundsätze

- Keine Secrets oder Tokens im Repository.
- `.env`-Dateien nicht versionieren; nur bereinigte Beispielkonfigurationen.
- Autorisierung serverseitig erzwingen.
- Auditdaten nicht allein clientseitig führen.
- Finale Freigaben serverseitig und rollenbasiert prüfen.
- Safety-Score als deterministische, versionierte Engine betreiben.
- KI-Ausgaben sind Vorschläge/Interpretationen und keine unkontrollierte Fachfreigabe.

## Nächster P0-Schritt nach Übernahme der modularen Codebasis

Sobald die bereits entwickelte modulare Laravel-/React-Codebasis in diesem Repository verfügbar ist, ist als nächster Security-Schritt die vorhandene Autorisierungs-Policy verbindlich vor alle fachlichen API-Routen zu hängen und durch negative sowie positive Permission-Tests nachzuweisen.

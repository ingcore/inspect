## Zweck

Beschreibe kurz, welches Problem gelöst wird und welche fachliche oder technische Änderung enthalten ist.

## Änderungstyp

- [ ] P0 / Security / Produktionsreife
- [ ] Fachfunktion
- [ ] Fehlerbehebung
- [ ] Refactoring ohne Funktionsänderung
- [ ] Dokumentation

## Qualitätsnachweise

- [ ] Bestehende Funktionen wurden nicht unbeabsichtigt entfernt.
- [ ] Relevante Tests wurden ergänzt oder angepasst.
- [ ] `quality-gate` ist erfolgreich.
- [ ] Keine Secrets, Zugangsdaten oder Echtdaten wurden eingecheckt.
- [ ] Berechtigungen werden bei sicherheitsrelevanten Änderungen serverseitig geprüft.
- [ ] Fachlich relevante Statusänderungen und Freigaben bleiben auditierbar.
- [ ] Safety-Score-Berechnungen bleiben deterministisch und versioniert; ein LLM ersetzt keine Rule Engine.
- [ ] Offline-/Sync-Auswirkungen wurden berücksichtigt, sofern betroffen.

## Datenbank / Migration

Beschreibe Migrationen, Datenverlustrisiken und Rückwärtskompatibilität. Falls nicht betroffen: `nicht betroffen`.

## Sicherheit / Berechtigung

Beschreibe Änderungen an Authentifizierung, Autorisierung, Rollen, Mandantentrennung oder Datenzugriff. Falls nicht betroffen: `nicht betroffen`.

## Rollback

Wie kann diese Änderung sicher zurückgenommen werden?

## Offene Punkte

Nur tatsächlich offene Punkte oder bewusste Abgrenzungen aufführen.

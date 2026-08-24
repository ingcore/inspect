# Golden-Master-Satz T-BMA 1.0.0

Referenzfälle der Validierungsstufe V1 nach PRD 16.1 mit vollständigem Berechnungstrace.
Dieses Dokument wird aus `golden-masters.mjs` erzeugt und darf nicht von Hand geändert werden:
`npm run trace:golden-masters`.

| Merkmal | Festlegung |
| --- | --- |
| Modellversion | 1.0.0 |
| Engine | ingtec-score-engine/1.0.0 |
| Prüfprofil | T-BMA 1.0.0 · Brandmeldeanlagen |
| Score-Art | SS-COND |
| Kriterien im Profil | 29 |
| Referenzfälle | 20 |

Die Hashes dienen der Regressionskontrolle: Ändert sich ein Referenzfall, ändert sich sein
`input_hash`. Berechnungs-ID und Zeitstempel sind für den Export bewusst fixiert (Fall-ID und
1970-01-01), damit auch der `signature_hash` über Läufe hinweg vergleichbar bleibt.

## Übersicht

| Fall | Situation | Score | Klasse | Compliance | Konfidenz | Gate | Freigabe |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| [GM-BMA-01](#gm-bma-01--vollstaendig-erfuellte-wiederkehrende-pruefung) | Vollstaendig erfuellte wiederkehrende Pruefung | 0,0 | A | CONFORM | K4 | – | ja |
| [GM-BMA-02](#gm-bma-02--unwesentliche-nachweisluecke-im-betriebsbuch) | Unwesentliche Nachweisluecke im Betriebsbuch | 0,2 | A | CONFORM | K4 | – | ja |
| [GM-BMA-03](#gm-bma-03--wartungsnachweise-der-laufenden-periode-unvollstaendig) | Wartungsnachweise der laufenden Periode unvollstaendig | 2,6 | A | CONFORM | K4 | – | ja |
| [GM-BMA-04](#gm-bma-04--formale-abweichung-von-einer-bescheidauflage) | Formale Abweichung von einer Bescheidauflage | 0,7 | A | NONCONFORM | K4 | – | ja |
| [GM-BMA-05](#gm-bma-05--mehrere-relevante-technische-abweichungen-ohne-schutzfunktionsausfall) | Mehrere relevante technische Abweichungen ohne Schutzfunktionsausfall | 4,3 | A | CONFORM | K4 | – | ja |
| [GM-BMA-06](#gm-bma-06--wiederholungsmangel-mit-wirksamer-uebergangsmassnahme) | Wiederholungsmangel mit wirksamer Uebergangsmassnahme | 2,6 | A | CONFORM | K4 | – | ja |
| [GM-BMA-07](#gm-bma-07--brandfallsteuerung-ohne-funktion) | Brandfallsteuerung ohne Funktion | 50,0 | D | CONFORM | K4 | KO-03 | ja |
| [GM-BMA-08](#gm-bma-08--alarmierung-im-erforderlichen-bereich-unwirksam) | Alarmierung im erforderlichen Bereich unwirksam | 75,0 | E | CONFORM | K4 | KO-03 | ja |
| [GM-BMA-09](#gm-bma-09--unmittelbare-erhebliche-gefahr-durch-fehlende-personenwarnung) | Unmittelbare erhebliche Gefahr durch fehlende Personenwarnung | 85,0 | E | CONFORM | K4 | KO-01 | ja |
| [GM-BMA-10](#gm-bma-10--fluchtweg-durch-brandfallsteuerung-blockiert) | Fluchtweg durch Brandfallsteuerung blockiert | 75,0 | E | CONFORM | K4 | KO-05 | ja |
| [GM-BMA-11](#gm-bma-11--geforderte-alarmweiterleitung-nicht-verfuegbar) | Geforderte Alarmweiterleitung nicht verfuegbar | 50,0 | D | NONCONFORM | K4 | KO-04, KO-03 | ja |
| [GM-BMA-12](#gm-bma-12--ueberwachungsumfang-weicht-wesentlich-vom-bescheid-ab) | Ueberwachungsumfang weicht wesentlich vom Bescheid ab | 50,0 | D | NONCONFORM | K4 | KO-04 | ja |
| [GM-BMA-13](#gm-bma-13--kritische-massnahme-aus-der-vorperiode-nicht-umgesetzt) | Kritische Massnahme aus der Vorperiode nicht umgesetzt | 50,0 | D | CONFORM | K4 | KO-07 | ja |
| [GM-BMA-14](#gm-bma-14--freigegebene-brandfallsteuermatrix-fehlt) | Freigegebene Brandfallsteuermatrix fehlt | NB | NB | CONFORM | K4 | KO-06 | gesperrt |
| [GM-BMA-15](#gm-bma-15--schutzkritisches-pflichtkriterium-nicht-pruefbar) | Schutzkritisches Pflichtkriterium nicht pruefbar | NB | NB | CONFORM | K4 | KO-06 | gesperrt |
| [GM-BMA-16](#gm-bma-16--teilpruefung-mit-80-prozent-abdeckung) | Teilpruefung mit 80 Prozent Abdeckung | 0,0 | A | PARTIAL | K2 | – | gesperrt |
| [GM-BMA-17](#gm-bma-17--nicht-anwendbare-kriterien-bei-anlage-ohne-uebertragungseinrichtung) | Nicht anwendbare Kriterien bei Anlage ohne Uebertragungseinrichtung | 2,4 | A | CONFORM | K4 | – | ja |
| [GM-BMA-18](#gm-bma-18--belastbare-bewertung-auf-basis-von-vorperiodenevidenz) | Belastbare Bewertung auf Basis von Vorperiodenevidenz | 0,0 | A | CONFORM | K3 | – | ja |
| [GM-BMA-19](#gm-bma-19--integritaetsmangel-sperrt-die-externe-veroeffentlichung) | Integritaetsmangel sperrt die externe Veroeffentlichung | 1,2 | A | CONFORM | K4 | KO-08 | gesperrt |
| [GM-BMA-20](#gm-bma-20--anhang-b-rechenbeispiel-des-prd) | Anhang B - Rechenbeispiel des PRD | 50,0 | D | CONFORM | K4 | KO-03 | ja |

## GM-BMA-01 · Vollstaendig erfuellte wiederkehrende Pruefung

**Fachliche Begründung.** Alle Kriterien nachgewiesen erfuellt, Primaerevidenz, Senior-Freigabe. Kein Risikodefizit, daher r_i = 0 fuer alle Kriterien und S_raw = 0,0. Klasse A, konform, K4, freigabefaehig.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 0,0 | 0,0 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

Alle Kriterien sind mit Schweregrad 0 bewertet; kein Kriterium liefert einen Beitrag.

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 0,00** · höchster aktiver Gate-Floor = 0,00 · **S_final = 0,00** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `ea6875f0b1125b6951d3924c3a6c519ad5c64d4028491aea0c915514ed117cc2` |
| scope_hash | `a6fba8d00b1c1e7deb01930879849ffa87f27c942b6da7ef7d0833eaade95c1f` |
| signature_hash | `5052ff5d82b87b89271c668c0c4ed1ca4e23cb49c7cd88119bf1119ec5c7482a` |
| raw_score_bp | 0 |
| final_score_bp | 0 |

---

## GM-BMA-02 · Unwesentliche Nachweisluecke im Betriebsbuch

**Fachliche Begründung.** Einzelne Eintraege im Betriebsbuch fehlen (ORG Grad 1, isoliert). Ein Kriterium mit Gewicht 2 in einer mit 5 % gewichteten Dimension kann den Score nur marginal heben. Klasse A bleibt, die Anlage ist konform, da keine verpflichtende Anforderung betroffen ist.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 0,2 | 0,2 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-ORG-03 | ORG | 2 | anwendbar | 1 | 0,25 | 0,80 / 1,00 / 1,00 / 1,00 | 0,200 | 0,40 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 4,44 | 0,0500 | 0,2220 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 0,22** · höchster aktiver Gate-Floor = 0,00 · **S_final = 0,22** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `cdf47c7ce15936d796da35dc0bac5fb190e8de2c59f0388902b0fd26a2bf0586` |
| scope_hash | `7eee6e3ee433853e2c1df02ac009967bf10a2248c0ff8628cf4e5d9cdce9c75c` |
| signature_hash | `79a20095878165c441105cfd801f8657bccb1c7cba195339a8fede031fcfc2c6` |
| raw_score_bp | 22 |
| final_score_bp | 22 |

---

## GM-BMA-03 · Wartungsnachweise der laufenden Periode unvollstaendig

**Fachliche Begründung.** Wartungsprotokolle liegen nur teilweise vor (EVD Grad 2) und die Melderreinigung ist ueberfaellig (MEA Grad 2, Frist ueberschritten). Beides sind relevante, aber beherrschte Maengel ohne Schutzfunktionsausfall: Klasse A ohne Gate. Keine verpflichtende Anforderung verletzt. Rechenweg: D_EVD = 100 · 3 · 0,45 / 13 = 10,38 (Beitrag 1,04), D_MEA = 100 · 3 · 0,495 / 14 = 10,61 (Beitrag 1,59), S_raw = 2,63.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 2,6 | 2,6 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-EVD-03 | EVD | 3 | anwendbar | 2 | 0,50 | 0,90 / 1,00* / 1,00 / 1,00* | 0,450 | 1,35 | Norm / Stand der Technik |
| T-BMA-MEA-03 | MEA | 3 | anwendbar | 2 | 0,50 | 0,90 / 1,00* / 1,10 / 1,00 | 0,495 | 1,49 | Herstelleranforderung |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 10,38 | 0,1000 | 1,0380 |
| MEA | 14 | 10,61 | 0,1500 | 1,5915 |

**S_raw = 2,63** · höchster aktiver Gate-Floor = 0,00 · **S_final = 2,63** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `9f4ce5a0cb2354ceed9cb2157bfbe700142369dabea0ac6f50f0d2dac9d9f20c` |
| scope_hash | `d2b84f2b8698222283a487370b5ade89b080b2cd4595c717e954a2d115212a5d` |
| signature_hash | `692aa8f9f1926c1d1de845df92f96005b7966c3b8eac385c990bc627c9984726` |
| raw_score_bp | 263 |
| final_score_bp | 263 |

---

## GM-BMA-04 · Formale Abweichung von einer Bescheidauflage

**Fachliche Begründung.** Die Pruefung wurde fristgerecht, aber ohne vollstaendigen Nachweis der Pruefbefugnis dokumentiert (LRC Grad 1). Punktemaessig unwesentlich, jedoch ist eine verpflichtende Anforderung nicht nachgewiesen erfuellt: Compliance NONCONFORM bei Klasse A. Trennung von Score und Rechtsaussage. Rechenweg: r = 0,25 · 0,80 = 0,20, D_LRC = 100 · 4 · 0,20 / 17 = 4,71, S_raw = 0,15 · 4,71 = 0,71.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 0,7 | 0,7 |
| Klasse | A | A |
| Compliance | NONCONFORM | NONCONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-LRC-02 | LRC | 4 | anwendbar | 1 | 0,25 | 0,80 / 1,00* / 1,00 / 1,00* | 0,200 | 0,80 | Rechtsvorschrift |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 4,71 | 0,1500 | 0,7065 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 0,71** · höchster aktiver Gate-Floor = 0,00 · **S_final = 0,71** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- T-BMA-LRC-02: verpflichtende Anforderung nicht erfuellt (Schweregrad 1). (Rechtsvorschrift)

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `bbdee5811dd5f161da77013574604954a417b4c4a1290d30c5a7cf6ea6ad781e` |
| scope_hash | `56b19320c4721c58b674cedb42407d48a98c47739f14ce95b87dad620af81404` |
| signature_hash | `c7542a815bab1a035ed64c8d47cfe0e91554b311b56319fb9e0653b87dcb0821` |
| raw_score_bp | 71 |
| final_score_bp | 71 |

---

## GM-BMA-05 · Mehrere relevante technische Abweichungen ohne Schutzfunktionsausfall

**Fachliche Begründung.** Handfeuermelder verstellt, Stoerungsmeldungen offen, Feuerwehrperipherie teilweise falsch beschriftet (TPF Grad 2, systemisch). Die Schutzwirkung ist eingeschraenkt, aber nicht ausgefallen. Erwartet wird ein Wert im Bereich geringer bis relevanter Abweichungen ohne Gate.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 4,3 | 4,3 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-TPF-03 | TPF | 3 | anwendbar | 2 | 0,50 | 1,00 / 1,00 / 1,00 / 1,00 | 0,500 | 1,50 | Norm / Stand der Technik |
| T-BMA-TPF-04 | TPF | 3 | anwendbar | 2 | 0,50 | 1,00 / 1,00 / 1,00 / 1,00 | 0,500 | 1,50 | Norm / Stand der Technik |
| T-BMA-TPF-10 | TPF | 4 | anwendbar | 2 | 0,50 | 1,00 / 1,00 / 1,00 / 1,00 | 0,500 | 2,00 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 12,20 | 0,3500 | 4,2700 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 4,27** · höchster aktiver Gate-Floor = 0,00 · **S_final = 4,27** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `edb46c9a12e4e5c9cbeb48ba1d4d73f7cda0544649ecd6de1eae6a7e9256920c` |
| scope_hash | `08ea994ca737644ec94a996fe41c68b08e9b53b29ace4054d33a74f4bacf8fb0` |
| signature_hash | `67e63cda5114f95b3bda0988a65289f5ccf6384cbd4a68053fccce74defd005f` |
| raw_score_bp | 427 |
| final_score_bp | 427 |

---

## GM-BMA-06 · Wiederholungsmangel mit wirksamer Uebergangsmassnahme

**Fachliche Begründung.** Die Ersatzstromversorgung erreicht die geforderte Ueberbrueckungsdauer nicht (TPF Grad 3), der Mangel wurde bereits in der Vorperiode festgestellt (F_R = 1,20). Eine befristete, fachlich geprueefte Uebergangsmassnahme ist wirksam (F_M = 0,85). r = min(1; 0,75 · 1,20 · 0,85) = 0,765 statt 0,90 - die Uebergangsmassnahme senkt den Risikobeitrag, hebt aber kein Gate auf. Kein Gate, da die Profilregel erst ab Grad 4 greift.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 2,6 | 2,6 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-TPF-08 | TPF | 4 | anwendbar | 3 | 0,75 | 1,00 / 1,00 / 1,20 / 0,85 | 0,765 | 3,06 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 7,46 | 0,3500 | 2,6110 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 2,61** · höchster aktiver Gate-Floor = 0,00 · **S_final = 2,61** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `abf6a07d4a6135fc0575e319d361fccef56418004ec1601e81803daa1fc23f5e` |
| scope_hash | `96974783848963922bf7151ad964ced66d898a7fa3b9787dd7f0a63792c10351` |
| signature_hash | `4e017a141819a98a47d6a6e7986e1228cb5fb15318d9942936a6c4a72c8f187b` |
| raw_score_bp | 261 |
| final_score_bp | 261 |

---

## GM-BMA-07 · Brandfallsteuerung ohne Funktion

**Fachliche Begründung.** Eine wesentliche Brandfallsteuerung loest nicht aus (TPF Grad 3). Die Profilregel loest KO-03 aus, Floor 50,0 und mindestens Klasse D. Der Rohwert liegt deutlich darunter - der Fall belegt die Nichtkompensierbarkeit: zahlreiche unauffaellige Kriterien heben das Ergebnis nicht.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 50,0 | 50,0 |
| Klasse | D | D |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-03 | KO-03 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-TPF-07 | TPF | 5 | anwendbar | 3 | 0,75 | 1,00 / 1,00 / 1,00 / 1,00 | 0,750 | 3,75 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 9,15 | 0,3500 | 3,2025 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 3,20** · höchster aktiver Gate-Floor = 50,00 (KO-03) · **S_final = 50,00** · Klasse **D**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-03 | Ausfall ohne unmittelbare Exposition | Schweregrad 3 bei T-BMA-TPF-07 | Floor 50,0 · mindestens Klasse D | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `c74cade332132425757b38cd3147add86f2db64b356f2559b884f5616a170795` |
| scope_hash | `cd9371f5e15292a7580c1754c259bc487628ad3e413c7630706a47729313dad0` |
| signature_hash | `5bb1f7896842d54a915067d22ae7aca0996afececc3dac66dbd172003999e3a2` |
| raw_score_bp | 320 |
| final_score_bp | 5000 |

---

## GM-BMA-08 · Alarmierung im erforderlichen Bereich unwirksam

**Fachliche Begründung.** Die akustische Alarmierung erreicht den ungueensigsten Aufenthaltsbereich nicht (TPF Grad 4) bei dauernder Personenexposition. KO-03 in der Stufe mit unmittelbarer Exposition wirkt mit Floor 75,0 und Klasse E.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 75,0 | 75,0 |
| Klasse | E | E |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-03 | KO-03 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-TPF-05 | TPF | 5 | anwendbar | 4 | 1,00 | 1,00 / 1,10 / 1,00 / 1,00 | 1,000 | 5,00 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 12,20 | 0,3500 | 4,2700 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 4,27** · höchster aktiver Gate-Floor = 75,00 (KO-03) · **S_final = 75,00** · Klasse **E**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-03 | Ausfall mit unmittelbarer Exposition | Schweregrad 4 bei T-BMA-TPF-05 | Floor 75,0 · mindestens Klasse E | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `59eacf1952834062b2284e68866076c7a9d3ee32fecc8dac02b5c0e0acc54083` |
| scope_hash | `958f0b0af6fc4ba8010ddb987f87cfc2b541f872a441231c9d55143e2170a98d` |
| signature_hash | `c08f4f2a7ec10d22309d98296f86b4c9156f58cf204c824cc98159f28ad2023d` |
| raw_score_bp | 427 |
| final_score_bp | 7500 |

---

## GM-BMA-09 · Unmittelbare erhebliche Gefahr durch fehlende Personenwarnung

**Fachliche Begründung.** In einem Beherbergungsbereich mit eingeschraenkter Selbstrettung erfolgt keine rechtzeitige Warnung (IPH Grad 4). KO-01 wirkt mit Floor 85,0 und Klasse E; zusaetzlich ist Soforteskalation erforderlich.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 85,0 | 85,0 |
| Klasse | E | E |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-01 | KO-01 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-IPH-01 | IPH | 5 | anwendbar | 4 | 1,00 | 1,00 / 1,10 / 1,00 / 1,00 | 1,000 | 5,00 | Fachliche Bewertung |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 29,41 | 0,2000 | 5,8820 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 5,88** · höchster aktiver Gate-Floor = 85,00 (KO-01) · **S_final = 85,00** · Klasse **E**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-01 | unmittelbare erhebliche Gefahr | Schweregrad 4 bei T-BMA-IPH-01 | Floor 85,0 · mindestens Klasse E | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `de5701209cff4ce49f369da5d4eba1b635618e03406511a286e6490fc36a50e8` |
| scope_hash | `04627ed5e5ed8753eb94b7e2207ffe1459e28f265e7ccab10a9b09f047701eaa` |
| signature_hash | `91a81fa455a8cc995fb6a33a622eb751a0887209cc5cbc998b8d89a9c8acb36e` |
| raw_score_bp | 588 |
| final_score_bp | 8500 |

---

## GM-BMA-10 · Fluchtweg durch Brandfallsteuerung blockiert

**Fachliche Begründung.** Fluchttueren verriegeln im Alarmfall (IPH Grad 4). KO-05 in der Stufe mit Personengefaehrdung wirkt mit Floor 75,0 und Klasse E. Der Fall trennt den Flucht- und Rettungswegmangel von der allgemeinen Gefahrenlage nach KO-01.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 75,0 | 75,0 |
| Klasse | E | E |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-05 | KO-05 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-IPH-02 | IPH | 5 | anwendbar | 4 | 1,00 | 1,00 / 1,00 / 1,00 / 1,00 | 1,000 | 5,00 | Fachliche Bewertung |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 29,41 | 0,2000 | 5,8820 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 5,88** · höchster aktiver Gate-Floor = 75,00 (KO-05) · **S_final = 75,00** · Klasse **E**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-05 | kritischer Mangel mit Personengefaehrdung | Schweregrad 4 bei T-BMA-IPH-02 | Floor 75,0 · mindestens Klasse E | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `731bfaea86e8aba85772b4698c292ab4a0510bcb6f6c41f4222a7d77276d4c13` |
| scope_hash | `b860d1edf68a66d6c18900415277f70ca53bd11ed7f9393ce9fcf5079a33ed99` |
| signature_hash | `4d902f24329c98cf273160711b3f53c69762ddd4f46ae805add63fb74786484a` |
| raw_score_bp | 588 |
| final_score_bp | 7500 |

---

## GM-BMA-11 · Geforderte Alarmweiterleitung nicht verfuegbar

**Fachliche Begründung.** Die beauflagte Uebertragung zur Feuerwehr ist nicht betriebsbereit (LRC Grad 3, Bescheidauflage) und die Uebertragungseinrichtung leitet nicht weiter (TPF Grad 4). KO-04 Stufe D (Floor 50,0) und KO-03 (Floor 50,0) wirken gemeinsam; massgeblich ist der hoechste Floor. Compliance NONCONFORM, weil eine verpflichtende Bescheidanforderung nicht erfuellt ist.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 50,0 | 50,0 |
| Klasse | D | D |
| Compliance | NONCONFORM | NONCONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-03, KO-04 | KO-04, KO-03 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-LRC-03 | LRC | 5 | anwendbar | 3 | 0,75 | 1,00 / 1,00* / 1,00 / 1,00* | 0,750 | 3,75 | Bescheid / Auflage |
| T-BMA-TPF-06 | TPF | 5 | anwendbar | 4 | 1,00 | 1,00 / 1,00 / 1,00 / 1,00 | 1,000 | 5,00 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 22,06 | 0,1500 | 3,3090 |
| TPF | 41 | 12,20 | 0,3500 | 4,2700 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 7,58** · höchster aktiver Gate-Floor = 50,00 (KO-04) · **S_final = 50,00** · Klasse **D**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-04 | schwere Abweichung | Schweregrad 3 bei T-BMA-LRC-03 | Floor 50,0 · mindestens Klasse D | profilregel |
| KO-03 | Ausfall ohne unmittelbare Exposition | Schweregrad 4 bei T-BMA-TPF-06 | Floor 50,0 · mindestens Klasse D | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- T-BMA-LRC-03: verpflichtende Anforderung nicht erfuellt (Schweregrad 3). (Bescheid / Auflage)

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `5f3762ca36fc0656df5f9283fdf80ecfe7dd0a7cabea3747d59ab3508cb8a73b` |
| scope_hash | `d43234bb6bed5cb803309751c44be0f2a59dbf6fdcfc1b592705f4f995dddb72` |
| signature_hash | `e7efc0940b072f3a4f722c5f609baa762e7a0be71e5de14e7ed295cdddf87354` |
| raw_score_bp | 758 |
| final_score_bp | 5000 |

---

## GM-BMA-12 · Ueberwachungsumfang weicht wesentlich vom Bescheid ab

**Fachliche Begründung.** Mehrere ueberwachungspflichtige Bereiche sind nicht erfasst (LRC Grad 3, TPF Grad 3). KO-04 Stufe D setzt Floor 50,0; die Anlage ist nicht konform. Der Fall zeigt, dass Rechtsabweichung und technischer Zustand getrennt bewertet und getrennt ausgewiesen werden.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 50,0 | 50,0 |
| Klasse | D | D |
| Compliance | NONCONFORM | NONCONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-04 | KO-04 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-LRC-01 | LRC | 5 | anwendbar | 3 | 0,75 | 1,00 / 1,00* / 1,00 / 1,00* | 0,750 | 3,75 | Bescheid / Auflage |
| T-BMA-TPF-01 | TPF | 4 | anwendbar | 3 | 0,75 | 0,90 / 1,00 / 1,00 / 1,00 | 0,675 | 2,70 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 22,06 | 0,1500 | 3,3090 |
| TPF | 41 | 6,59 | 0,3500 | 2,3065 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 5,61** · höchster aktiver Gate-Floor = 50,00 (KO-04) · **S_final = 50,00** · Klasse **D**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-04 | schwere Abweichung | Schweregrad 3 bei T-BMA-LRC-01 | Floor 50,0 · mindestens Klasse D | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- T-BMA-LRC-01: verpflichtende Anforderung nicht erfuellt (Schweregrad 3). (Bescheid / Auflage)

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `c6a427fc9a5799c34e92777f30d6c9086b58931ffcc8644b38c22edd5cd708de` |
| scope_hash | `2a49f49b0abb68150f1fc46c0494c2cfd20eb19bf263ca1c9f6819df8ce6f6f2` |
| signature_hash | `e6b1b03bd15abf01bf7bcb30360d9e06f0db6250b3d706df35b2180c5b94a9d0` |
| raw_score_bp | 561 |
| final_score_bp | 5000 |

---

## GM-BMA-13 · Kritische Massnahme aus der Vorperiode nicht umgesetzt

**Fachliche Begründung.** Ein wesentlicher Mangel der Vorpruefung wurde trotz bestaetigter Behebung erneut festgestellt (MEA Grad 4, F_R = 1,30). KO-07 wirkt mit Floor 50,0 und Klasse D und eskaliert an die definierte Fuehrungsebene.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 50,0 | 50,0 |
| Klasse | D | D |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-07 | KO-07 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-MEA-01 | MEA | 4 | anwendbar | 4 | 1,00 | 1,00 / 1,00* / 1,30 / 1,00 | 1,000 | 4,00 | Fachliche Bewertung |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 28,57 | 0,1500 | 4,2855 |

**S_raw = 4,29** · höchster aktiver Gate-Floor = 50,00 (KO-07) · **S_final = 50,00** · Klasse **D**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-07 | ueberfaellige kritische Massnahme | Schweregrad 4 bei T-BMA-MEA-01 | Floor 50,0 · mindestens Klasse D | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `4b262c000fa89df399d028c8352f81f5abbcb7638987909b1d9894ee143e83ec` |
| scope_hash | `93f1d9adcfee9af6925812544ba0a45ead6f6f21e11c03ef469429d4307fc47d` |
| signature_hash | `a861ec24b9704f76ccc9d2ad7f4ec61e356f2f5e38050b715f5840664d075418` |
| raw_score_bp | 429 |
| final_score_bp | 5000 |

---

## GM-BMA-14 · Freigegebene Brandfallsteuermatrix fehlt

**Fachliche Begründung.** Ohne freigegebene Steuermatrix ist die Wirksamkeit der Brandfallsteuerungen nicht verifizierbar (EVD Grad 4). KO-06 setzt NB: es wird kein scheinpraeziser Zahlenwert veroeffentlicht. Der interne Rohwert bleibt erhalten, die Freigabe ist gesperrt.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | NB | NB |
| Klasse | NB | NB |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-06 | KO-06 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | nein | nein |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-EVD-02 | EVD | 4 | anwendbar | 4 | 1,00 | 1,00 / 1,00* / 1,00 / 1,00* | 1,000 | 4,00 | Fachliche Bewertung |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 30,77 | 0,1000 | 3,0770 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 3,08** · höchster aktiver Gate-Floor = 0,00 · **S_final = NB** · Klasse **NB**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-06 | kritische Evidenzluecke | Schweregrad 4 bei T-BMA-EVD-02 | NB – kein veröffentlichter Zahlenwert | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

**Freigabesperren:**
- Ergebnis ist NB: Schweregrad 4 bei T-BMA-EVD-02

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `3dbe3587a8edfb1cf032738bce9ae709872ae1d50064f23ee3b2f9d6a5860dd5` |
| scope_hash | `72fecb39e9781f3306c923123508f4026cf3a3986f8ffa76fff2f070434e7319` |
| signature_hash | `b831d03ffb9d50a4ab28000fcf23b009847f23cbe4e1c5986788dc0336c57a3c` |
| raw_score_bp | 308 |
| final_score_bp | null (NB) |

---

## GM-BMA-15 · Schutzkritisches Pflichtkriterium nicht pruefbar

**Fachliche Begründung.** Die Melderstichprobe war wegen laufender Produktion nicht durchfuehrbar. Ein schutzkritisches Pflichtkriterium ohne Bewertung darf nicht als erfuellt gelten: KO-06 setzt NB und fordert die Nachpruefung. Die Abdeckung sinkt nur um das Gewicht des Kriteriums auf 95,5 %, die Konfidenz bleibt K4. Der Fall belegt, dass die Belastbarkeit hier nicht ueber die Konfidenz, sondern ueber das Gate gesichert wird - eine einzelne schutzkritische Luecke waere sonst rechnerisch unauffaellig.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | NB | NB |
| Klasse | NB | NB |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 98,2) |
| Gate | KO-06 | KO-06 |
| Gewichtete Abdeckung | 95,5 % | 95,5 % |
| Freigabefähig | nein | nein |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-TPF-02 | TPF | 5 | nicht_pruefbar | – | – | – | – | – | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 36 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 0,00** · höchster aktiver Gate-Floor = 0,00 · **S_final = NB** · Klasse **NB**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-06 | kritische Evidenzluecke | Schutzkritisches Pflichtkriterium T-BMA-TPF-02 ist nicht pruefbar. | NB – kein veröffentlichter Zahlenwert | abdeckungsregel |

### Konfidenz und Compliance

K = 0,40 · 95,5 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **98,2** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

**Freigabesperren:**
- Ergebnis ist NB: Schutzkritisches Pflichtkriterium T-BMA-TPF-02 ist nicht pruefbar.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `8f45c6c373184fad9ac4706f7f0ff6d10a27fbdb54abe8d3ed8d41f61b9f2097` |
| scope_hash | `d1b0c4098d0758173531a54ef2bd0e8e2e48a8c6cae2fe701fac3897a0743786` |
| signature_hash | `f2ee72c2a2589a117636668d8ae58efbeacfd7c9c795b8430db5da7088628f7d` |
| raw_score_bp | 0 |
| final_score_bp | null (NB) |

---

## GM-BMA-16 · Teilpruefung mit 80 Prozent Abdeckung

**Fachliche Begründung.** Die Pruefung konnte nur teilweise durchgefuehrt werden. Alle schutzkritischen Pflichtkriterien sind bewertet, acht Kriterien mit zusammen 22 von 111 Gewichtspunkten fehlen: 89 / 111 = 80,2 %. Damit liegt die Abdeckung zwischen 70 % und 85 %, zulaessig ist nur ein vorlaeufiger interner Score mit maximal K2 - obwohl der rechnerische Konfidenzwert hoeher laege. Externe Freigabe ist gesperrt, die Compliance-Aussage bleibt wegen des begrenzten Umfangs PARTIAL.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 0,0 | 0,0 |
| Klasse | A | A |
| Compliance | PARTIAL | PARTIAL |
| Konfidenz | K2 | K2 (K = 92,1) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 80,2 % | 80,2 % |
| Freigabefähig | nein | nein |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-TPF-03 | TPF | 3 | anwendbar | – | – | – | – | – | Norm / Stand der Technik |
| T-BMA-TPF-04 | TPF | 3 | anwendbar | – | – | – | – | – | Norm / Stand der Technik |
| T-BMA-TPF-09 | TPF | 3 | anwendbar | – | – | – | – | – | Norm / Stand der Technik |
| T-BMA-IPH-04 | IPH | 3 | anwendbar | – | – | – | – | – | Fachliche Bewertung |
| T-BMA-ORG-03 | ORG | 2 | anwendbar | – | – | – | – | – | Norm / Stand der Technik |
| T-BMA-EVD-04 | EVD | 2 | anwendbar | – | – | – | – | – | Norm / Stand der Technik |
| T-BMA-MEA-03 | MEA | 3 | anwendbar | – | – | – | – | – | Herstelleranforderung |
| T-BMA-MEA-04 | MEA | 3 | anwendbar | – | – | – | – | – | Herstelleranforderung |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 32 | 0,00 | 0,3500 | 0,0000 |
| IPH | 14 | 0,00 | 0,2000 | 0,0000 |
| ORG | 7 | 0,00 | 0,0500 | 0,0000 |
| EVD | 11 | 0,00 | 0,1000 | 0,0000 |
| MEA | 8 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 0,00** · höchster aktiver Gate-Floor = 0,00 · **S_final = 0,00** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 80,2 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **92,1** → **K2**

- Compliance-Status PARTIAL: keine offene verpflichtende Anforderung im Scope.

**Freigabesperren:**
- Gewichtete Abdeckung 80,2 % unter der Freigabeschwelle von 85,0 %.
- Konfidenz K2 unter der Freigabeschwelle K3.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `980400121d18a6c6cfe77dfe623c9cf10b20373caa16becbd27ea556905216fd` |
| scope_hash | `73a22f0af0467767ac49b71558c24de372b6760cb1aff77f98d5983d90741a12` |
| signature_hash | `7401020ef87d166bffd9cf499f8fac1b97c6ebaed9066ac9b56bcfa36cd234d6` |
| raw_score_bp | 0 |
| final_score_bp | 0 |

---

## GM-BMA-17 · Nicht anwendbare Kriterien bei Anlage ohne Uebertragungseinrichtung

**Fachliche Begründung.** Fuer die Anlage ist keine Alarmweiterleitung gefordert; die drei Uebertragungskriterien sind nicht anwendbar und werden aus Zaehler und Nenner entfernt. Der verbleibende Wartungsrueckstand (MEA Grad 2) bestimmt das Ergebnis. Die Abdeckung bleibt bei 100 %, da nur anwendbare Kriterien in den Nenner eingehen.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 2,4 | 2,4 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-LRC-03 | LRC | 5 | nicht_anwendbar | – | – | – | – | – | Bescheid / Auflage |
| T-BMA-TPF-06 | TPF | 5 | nicht_anwendbar | – | – | – | – | – | Norm / Stand der Technik |
| T-BMA-EVD-04 | EVD | 2 | nicht_anwendbar | – | – | – | – | – | Norm / Stand der Technik |
| T-BMA-MEA-02 | MEA | 4 | anwendbar | 2 | 0,50 | 1,00 / 1,00* / 1,10 / 1,00 | 0,550 | 2,20 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 12 | 0,00 | 0,1500 | 0,0000 |
| TPF | 36 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 11 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 15,71 | 0,1500 | 2,3565 |

**S_raw = 2,36** · höchster aktiver Gate-Floor = 0,00 · **S_final = 2,36** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `afcf5e805ef85cb8b93eea5a1fdb5efbc6816f97775c007ec55c9270d562c478` |
| scope_hash | `d17ad5618ba71bc59714760c51841869649084a01a77722a3dc481e00489bdf8` |
| signature_hash | `6780c1550b2b56aea3261b6d89f25c1baec0f42204f0507256a870f95a5996ca` |
| raw_score_bp | 236 |
| final_score_bp | 236 |

---

## GM-BMA-18 · Belastbare Bewertung auf Basis von Vorperiodenevidenz

**Fachliche Begründung.** Alle Kriterien sind bewertet, die Evidenz stammt aber ueberwiegend aus der Vorperiode und ist alternd. Der Score bleibt unveraendert - fehlende Evidenzqualitaet senkt nie den Punktwert, sondern ausschliesslich die Konfidenz. K = 0,40 · 100 + 0,30 · 60 + 0,15 · 70 + 0,15 · 100 = 83,5 -> K3.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 0,0 | 0,0 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K3 | K3 (K = 83,5) |
| Gate | kein Gate | kein Gate |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

Alle Kriterien sind mit Schweregrad 0 bewertet; kein Kriterium liefert einen Beitrag.

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 0,00** · höchster aktiver Gate-Floor = 0,00 · **S_final = 0,00** · Klasse **A**

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 60,0 + 0,15 · 70,0 + 0,15 · 100,0 = **83,5** → **K3**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `94a353ce63915f93777b629223b2fb2d7935ea6633248cf68536589c0ab20b13` |
| scope_hash | `c9136d13c8d2007ba6f2fe0e15fc6a87e797a4f62679e9c13f8d995bd0f98de2` |
| signature_hash | `655743e20405c947276f3640ab0c7c6de1485cef75fa959304e7a979641f9f7e` |
| raw_score_bp | 0 |
| final_score_bp | 0 |

---

## GM-BMA-19 · Integritaetsmangel sperrt die externe Veroeffentlichung

**Fachliche Begründung.** Die Unabhaengigkeit des Pruefers ist nicht dokumentiert. KO-08 sperrt die Freigabe, ohne den berechneten internen Rohwert zu veraendern: D_EVD = 100 · 3 · 0,50 / 13 = 11,54, S_raw = 1,15. Der Wert bleibt bestehen, darf aber nicht extern verwendet werden.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 1,2 | 1,2 |
| Klasse | A | A |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-08 | KO-08 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | nein | nein |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-EVD-03 | EVD | 3 | anwendbar | 2 | 0,50 | 1,00 / 1,00* / 1,00 / 1,00* | 0,500 | 1,50 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 0,00 | 0,3500 | 0,0000 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 11,54 | 0,1000 | 1,1540 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 1,15** · höchster aktiver Gate-Floor = 0,00 · **S_final = 1,15** · Klasse **A**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-08 | Integritaets- oder Unabhaengigkeitsmangel | Unabhaengigkeit des Pruefers nicht dokumentiert | Freigabesperre | manuell |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

**Freigabesperren:**
- KO-08 aktiv: Unabhaengigkeit des Pruefers nicht dokumentiert - keine externe Veroeffentlichung.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `7a579a03be4e2593c76cebd4647befd556f3d8dddd2e96c85018136dae2cf8ae` |
| scope_hash | `6db701040e83a4a296bbf9294804f5a6fbcfece1378d464cb69d805af258bd44` |
| signature_hash | `14e5d77094b53b46ce43ba1569b91f974521dca44ba1b86ac0e81891d737016d` |
| raw_score_bp | 115 |
| final_score_bp | 115 |

---

## GM-BMA-20 · Anhang B - Rechenbeispiel des PRD

**Fachliche Begründung.** Nachbildung des Rechenbeispiels aus Anhang B: ein Pruefpunkt mit Schweregrad 3, erheblichem Ausmass, regulaerer Exposition, wiederholter Feststellung und ohne Uebergangsmassnahme ergibt r = min(1; 0,75 · 1,20) = 0,90 und bei Kontrollgewicht 5 den gewichteten Beitrag 4,50. Die Profilregel des Kriteriums loest zusaetzlich KO-03 aus.

| Ergebnisachse | Erwartet | Berechnet |
| --- | --- | --- |
| Safety-Score® | 50,0 | 50,0 |
| Klasse | D | D |
| Compliance | CONFORM | CONFORM |
| Konfidenz | K4 | K4 (K = 100,0) |
| Gate | KO-03 | KO-03 |
| Gewichtete Abdeckung | 100,0 % | 100,0 % |
| Freigabefähig | ja | ja |

### Kriterien mit Bewertungsbeitrag

| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |
| T-BMA-TPF-07 | TPF | 5 | anwendbar | 3 | 0,75 | 1,00 / 1,00 / 1,20 / 1,00 | 0,900 | 4,50 | Norm / Stand der Technik |

\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).

### Dimensionsebene

| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |
| --- | ---: | ---: | ---: | ---: |
| LRC | 17 | 0,00 | 0,1500 | 0,0000 |
| TPF | 41 | 10,98 | 0,3500 | 3,8430 |
| IPH | 17 | 0,00 | 0,2000 | 0,0000 |
| ORG | 9 | 0,00 | 0,0500 | 0,0000 |
| EVD | 13 | 0,00 | 0,1000 | 0,0000 |
| MEA | 14 | 0,00 | 0,1500 | 0,0000 |

**S_raw = 3,84** · höchster aktiver Gate-Floor = 50,00 (KO-03) · **S_final = 50,00** · Klasse **D**

### Gate-Auswertung

| Gate | Stufe | Auslöser | Wirkung | Herkunft |
| --- | --- | --- | --- | --- |
| KO-03 | Ausfall ohne unmittelbare Exposition | Schweregrad 3 bei T-BMA-TPF-07 | Floor 50,0 · mindestens Klasse D | profilregel |

### Konfidenz und Compliance

K = 0,40 · 100,0 + 0,30 · 100,0 + 0,15 · 100,0 + 0,15 · 100,0 = **100,0** → **K4**

- Compliance-Status CONFORM: keine offene verpflichtende Anforderung im Scope.

### Snapshot

| Feld | Wert |
| --- | --- |
| input_hash | `30d7dbd8ce795ce6c74f303433c0bf29931c99f7b817c020371a3fb101dc865c` |
| scope_hash | `7154157c0f37f59c5a06d7231e5267f3ae60c0b0eca420f2785b17ee57f9a375` |
| signature_hash | `639556ca8505d0b3be468568f34232c2f2d99feda2cb3674731bec2c43b996e4` |
| raw_score_bp | 384 |
| final_score_bp | 5000 |


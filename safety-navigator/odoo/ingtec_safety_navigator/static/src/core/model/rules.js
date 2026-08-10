/*
 * Kopie aus safety-navigator/core – nicht direkt bearbeiten.
 * Änderungen im Kern vornehmen und anschließend ausführen:
 *   node safety-navigator/scripts/sync-core.mjs
 */
/**
 * INGTEC Safety Navigator – Regelwerk
 *
 * Modell laut Spezifikation Abschnitt 23: `ingtec.rule`
 * Regelstatus laut Abschnitt 24, Regelpriorität laut Abschnitt 25.
 *
 * FREIGABESTATUS
 * --------------
 * Alle Regeln dieser Startbibliothek sind im Status `draft`. Sie sind fachlich
 * plausibel formuliert, aber NICHT freigegeben. Die Rule Engine liefert im
 * Audience-Modus `public` ausschließlich Regeln im Status `approved` aus
 * (Abschnitt 24: "Nur freigegebene Regeln dürfen Ergebnisse für externe
 * Nutzer erzeugen"). Der interne Modus zeigt Entwürfe mit rotem Quellenstatus.
 *
 * Die Freigabe erfolgt fachlich durch den zuständigen INGTEC-Fachbereich:
 * `state: 'review'` -> Prüfung -> `state: 'approved'`, `approved: true`,
 * `reviewed_on` und `source_status: 'green'` setzen.
 */

/** Regelstatus laut Abschnitt 24. */
export const RULE_STATES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  WITHDRAWN: 'withdrawn',
  ARCHIVED: 'archived',
};

/** Regelpriorität laut Abschnitt 25 – 1 ist die stärkste Bindung. */
export const RULE_PRIORITIES = {
  1: 'Konkrete behördliche Vorgabe',
  2: 'Unmittelbare Rechtsvorschrift',
  3: 'Technisches Regelwerk',
  4: 'Norm',
  5: 'Herstelleranforderung',
  6: 'Fachliche INGTEC-Empfehlung',
};

/**
 * Aussagequalität laut Abschnitt 23. Die Priorität wird daraus abgeleitet,
 * kann je Regel aber überschrieben werden.
 */
export const ASSERTION_QUALITY = {
  BEHOERDLICH: { key: 'behoerdlich', label: 'Behördliche Vorgabe', priority: 1 },
  GESETZLICH: { key: 'gesetzlich', label: 'Gesetzlich', priority: 2 },
  REGELWERK: { key: 'regelwerk', label: 'Technisches Regelwerk', priority: 3 },
  NORM: { key: 'norm', label: 'Norm', priority: 4 },
  HERSTELLER: { key: 'hersteller', label: 'Herstelleranforderung', priority: 5 },
  EMPFEHLUNG: { key: 'empfehlung', label: 'Fachliche INGTEC-Empfehlung', priority: 6 },
};

/**
 * Ergebnisarten einer Regel.
 *
 * Die Schlüssel sind bewusst ASCII: sie werden als technische Werte in Odoo
 * (`Selection`), in der API und in gespeicherten Ergebnissen verwendet und
 * dürfen sich nie ändern. Für die Anzeige gilt OUTCOME_KIND_LABELS.
 */
export const OUTCOME_KINDS = {
  TEST: 'pruefung',
  MAINTENANCE: 'wartung',
  INSPECTION: 'inspektion',
  REVISION: 'revision',
  DOCUMENTATION: 'dokumentation',
  CLARIFICATION: 'abklaerung',
};

/** Anzeigebezeichnungen der Ergebnisarten. */
export const OUTCOME_KIND_LABELS = {
  pruefung: 'Prüfung',
  wartung: 'Wartung',
  inspektion: 'Inspektion',
  revision: 'Revision',
  dokumentation: 'Dokumentation',
  abklaerung: 'Abklärung',
};

/** Platzhalter für Regeln, die unabhängig vom Anlagentyp gelten. */
export const ANY_SYSTEM = '*';

/**
 * @param {object} data
 * @returns {object}
 */
function rule(data) {
  const quality = data.assertion_quality ?? ASSERTION_QUALITY.EMPFEHLUNG;
  return {
    version: '1.0',
    valid_from: '2026-01-01',
    reviewed_on: null,
    approved: false,
    state: RULE_STATES.DRAFT,
    source_status: 'red',
    priority: quality.priority,
    conditions: { all: [] },
    ...data,
    assertion_quality: quality,
  };
}

/** Bedingung: Fakt ist wahr. */
const isTrue = (fact) => ({ fact, op: 'is_true' });
/** Bedingung: Fakt ist unbekannt oder liegt länger zurück als das Intervall. */
const overdue = (fact, months) => ({ fact, op: 'older_than_months', value: months });

/* -------------------------------------------------------------------------
 * Übergreifende Regeln
 * ---------------------------------------------------------------------- */

const GENERAL_RULES = [
  rule({
    code: 'RULE-GEN-PERMIT-001',
    title: 'Behördlicher Bescheid – Auflagen haben Vorrang',
    system_type: ANY_SYSTEM,
    conditions: { all: [isTrue('object.permit_exists')] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Für das Objekt liegt ein behördlicher Bescheid vor. Die darin festgelegten Prüfintervalle und Auflagen gehen den allgemeinen Vorgaben vor und sind vor der Angebotslegung auszuwerten.',
      interval: null,
      required_documents: ['behördlicher Bescheid samt Auflagenverzeichnis'],
      recommended_action: 'Bescheid hochladen oder zur Auswertung an INGTEC übermitteln.',
    },
    assertion_quality: ASSERTION_QUALITY.BEHOERDLICH,
    legal_basis: 'individueller behördlicher Bescheid',
    version: '1.0',
  }),
  rule({
    code: 'RULE-GEN-AMVO-001',
    title: 'Arbeitsmittel im Betrieb – grundsätzliche Prüfpflicht abklären',
    system_type: ANY_SYSTEM,
    conditions: { all: [isTrue('object.workplace'), isTrue('system.is_work_equipment')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Das Arbeitsmittel wird betrieblich verwendet. Damit ist der Prüfbedarf nach den Arbeitsmittelvorschriften näher zu bestimmen (Art, Umfang und Intervall der wiederkehrenden Prüfung).',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Betriebsanleitung', 'Prüfnachweise der letzten Prüfung'],
      recommended_action: 'Prüfumfang und Intervall anhand von Bauart und Verwendung festlegen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO – Arbeitsmittelverordnung; ASchG',
    version: '1.0',
  }),
  rule({
    code: 'RULE-GEN-DOC-001',
    title: 'Kein Prüfnachweis vorhanden – Dokumentationsbedarf',
    system_type: ANY_SYSTEM,
    conditions: { all: [{ fact: 'instance.report_available', op: 'is_false' }] },
    outcome: {
      kind: OUTCOME_KINDS.DOCUMENTATION,
      statement:
        'Für die Anlage liegt kein aktueller Prüfbericht vor. Ohne Nachweis kann die Einhaltung der Prüfpflicht nicht belegt werden.',
      interval: null,
      required_documents: ['letzter Prüfbefund', 'Wartungsnachweise'],
      recommended_action: 'Bestehende Nachweise suchen oder Erstprüfung beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.EMPFEHLUNG,
    legal_basis: 'Nachweisführung gemäß betrieblicher Sorgfaltspflicht',
    version: '1.0',
  }),
  rule({
    code: 'RULE-GEN-DEFECT-001',
    title: 'Bekannte offene Mängel – vorrangige Behandlung',
    system_type: ANY_SYSTEM,
    conditions: { all: [isTrue('instance.known_defects')] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'An der Anlage sind offene Mängel bekannt. Offene Mängel sind unabhängig vom Prüfintervall zu bewerten und zu beheben.',
      interval: null,
      required_documents: ['Mängelliste', 'Behebungsnachweise'],
      recommended_action: 'Mängel erfassen, bewerten und Fristen festlegen.',
    },
    assertion_quality: ASSERTION_QUALITY.EMPFEHLUNG,
    legal_basis: 'betriebliche Sorgfaltspflicht; ASchG',
    version: '1.0',
  }),
  rule({
    code: 'RULE-GEN-MOD-001',
    title: 'Wesentliche Änderung – erneute Konformitätsbewertung prüfen',
    system_type: ANY_SYSTEM,
    conditions: { all: [isTrue('instance.modified')] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Die Anlage wurde seit der Inbetriebnahme verändert. Es ist zu beurteilen, ob eine wesentliche Änderung vorliegt und dadurch eine neue Konformitätsbewertung, Abnahmeprüfung oder behördliche Anzeige erforderlich wird.',
      interval: null,
      required_documents: ['Änderungsdokumentation', 'ursprüngliche Konformitätserklärung'],
      recommended_action: 'Änderung fachlich bewerten lassen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'MSV 2010; AM-VO; behördliche Anzeigepflichten',
    version: '1.0',
  }),
];

/* -------------------------------------------------------------------------
 * Brandschutz
 * ---------------------------------------------------------------------- */

const FIRE_RULES = [
  rule({
    code: 'RULE-TRVB-BMA-001',
    title: 'Brandmeldeanlage – wiederkehrende Überprüfung',
    system_type: 'SYS-AT-BMA-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Brandmeldeanlagen unterliegen einer wiederkehrenden Überprüfung durch eine fachkundige Stelle. Zusätzlich sind Eigenkontrollen des Betreibers zu führen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Betriebsbuch', 'Brandfallsteuermatrix', 'letzter Prüfbefund'],
      recommended_action: 'Jährliche Überprüfung beauftragen und Betriebsbuch prüfen.',
    },
    assertion_quality: ASSERTION_QUALITY.REGELWERK,
    legal_basis: 'TRVB S 123; behördlicher Bescheid',
    version: '1.0',
  }),
  rule({
    code: 'RULE-TRVB-BMA-002',
    title: 'Brandmeldeanlage – Aufschaltung und Alarmweiterleitung',
    system_type: 'SYS-AT-BMA-001',
    conditions: { all: [{ fact: 'instance.monitored_transmission', op: 'is_false' }] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Die Brandmeldeanlage ist nicht auf eine ständig besetzte Stelle aufgeschaltet. Ob eine Aufschaltung erforderlich ist, ergibt sich aus Bescheid, Brandschutzkonzept und Anlagenkategorie.',
      interval: null,
      required_documents: ['Bescheid', 'Brandschutzkonzept'],
      recommended_action: 'Erforderlichkeit der Aufschaltung fachlich klären.',
    },
    assertion_quality: ASSERTION_QUALITY.REGELWERK,
    legal_basis: 'TRVB S 123; behördlicher Bescheid',
    version: '1.0',
  }),
  rule({
    code: 'RULE-TRVB-FCTRL-001',
    title: 'Brandfallsteuerungen – Funktionsprüfung gegen Steuermatrix',
    system_type: 'SYS-AT-FCTRL-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Brandfallsteuerungen sind wiederkehrend gegen die freigegebene Steuermatrix zu prüfen. Die Prüfung erfordert die Einbindung aller angesteuerten Gewerke.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['freigegebene Brandfallsteuermatrix', 'Funktionsprüfprotokolle'],
      recommended_action: 'Gewerkeübergreifende Wirkprinzipprüfung planen.',
    },
    assertion_quality: ASSERTION_QUALITY.REGELWERK,
    legal_basis: 'TRVB S 123; TRVB S 112',
    version: '1.0',
  }),
  rule({
    code: 'RULE-TRVB-RWA-001',
    title: 'Rauch- und Wärmeabzugsanlage – wiederkehrende Überprüfung',
    system_type: 'SYS-AT-RWA-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Rauch- und Wärmeabzugsanlagen sind wiederkehrend auf Funktion, Auslösung und Freihaltung der Nachströmöffnungen zu überprüfen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Auslegungsnachweis', 'Wartungsnachweise', 'letzter Prüfbefund'],
      recommended_action: 'Jährliche Funktionsprüfung inklusive Nachströmung beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.REGELWERK,
    legal_basis: 'TRVB S 125; behördlicher Bescheid',
    version: '1.0',
  }),
  rule({
    code: 'RULE-TRVB-SPR-001',
    title: 'Sprinkleranlage – wiederkehrende Überprüfung und Eigenkontrollen',
    system_type: 'SYS-AT-SPR-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Ortsfeste Löschanlagen unterliegen wiederkehrenden Überprüfungen durch eine fachkundige Stelle sowie regelmäßigen Eigenkontrollen des Betreibers.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Anlagenbuch', 'hydraulische Berechnung', 'Eigenkontrollnachweise'],
      recommended_action: 'Prüfzyklus mit Errichter und Sachversicherer abstimmen.',
    },
    assertion_quality: ASSERTION_QUALITY.REGELWERK,
    legal_basis: 'TRVB S 151; Auflagen des Sachversicherers',
    version: '1.0',
  }),
  rule({
    code: 'RULE-ASCHG-EXT-001',
    title: 'Feuerlöscher – wiederkehrende Überprüfung',
    system_type: 'SYS-AT-EXT-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Tragbare Feuerlöscher sind in wiederkehrenden Abständen durch fachkundige Personen zu überprüfen. Die Anzahl der Löschmitteleinheiten richtet sich nach Fläche und Nutzung.',
      interval: { value: 2, unit: 'year' },
      required_documents: ['Löscherverzeichnis', 'Prüfplaketten'],
      recommended_action: 'Löscherbestand und Prüfstand erheben.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ASchG; AStV; TRVB F 124',
    version: '1.0',
  }),
  rule({
    code: 'RULE-ASCHG-EMLIGHT-001',
    title: 'Sicherheitsbeleuchtung – wiederkehrende Prüfung der Betriebsdauer',
    system_type: 'SYS-AT-EMLIGHT-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Sicherheitsbeleuchtungsanlagen sind wiederkehrend zu prüfen, insbesondere auf Erreichen der Bemessungsbetriebsdauer. Zwischenprüfungen sind zu dokumentieren.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Prüfbuch der Sicherheitsbeleuchtung', 'Beleuchtungsberechnung'],
      recommended_action: 'Jahresprüfung mit Volllasttest planen und Prüfbuch führen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ASchG; AStV; EN 50172',
    version: '1.0',
  }),
  rule({
    code: 'RULE-SLEEP-BMA-001',
    title: 'Schlafbereiche ohne Brandmeldeanlage – Erforderlichkeit klären',
    system_type: ANY_SYSTEM,
    conditions: {
      all: [isTrue('object.sleeping_area'), { fact: 'system.SYS-AT-BMA-001.present', op: 'is_false' }],
    },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Im Objekt gibt es Bereiche, in denen Personen schlafen, es wurde jedoch keine Brandmeldeanlage erfasst. Ob eine automatische Branderkennung erforderlich ist, ist anhand von Bescheid und Brandschutzkonzept zu klären.',
      interval: null,
      required_documents: ['Brandschutzkonzept', 'behördlicher Bescheid'],
      recommended_action: 'Erforderlichkeit einer Branderkennung fachlich beurteilen lassen.',
    },
    assertion_quality: ASSERTION_QUALITY.EMPFEHLUNG,
    legal_basis: 'landesrechtliche Bauvorschriften; Brandschutzkonzept',
    version: '1.0',
    scope: 'object',
  }),
  rule({
    code: 'RULE-FDOOR-001',
    title: 'Brandschutzabschlüsse – wiederkehrende Funktionsprüfung',
    system_type: 'SYS-AT-FDOOR-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Brandschutztüren sind wiederkehrend auf Selbstschließung, Dichtheit und Unversehrtheit zu prüfen. Ergänzend sind laufende Sichtkontrollen erforderlich.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Abschlussverzeichnis', 'Verwendbarkeitsnachweise'],
      recommended_action: 'Abschlussverzeichnis anlegen und jährliche Prüfung einplanen.',
    },
    assertion_quality: ASSERTION_QUALITY.NORM,
    legal_basis: 'ÖNORM B 3850; behördlicher Bescheid',
    version: '1.0',
  }),
  rule({
    code: 'RULE-HOLD-001',
    title: 'Feststellanlage – monatliche Kontrolle und jährliche Prüfung',
    system_type: 'SYS-AT-HOLD-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Feststellanlagen sind jährlich fachkundig zu prüfen. Zusätzlich ist eine regelmäßige Funktionskontrolle durch den Betreiber zu dokumentieren.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Kontrollbuch der Feststellanlagen'],
      recommended_action: 'Betreiberkontrolle organisieren und dokumentieren.',
    },
    assertion_quality: ASSERTION_QUALITY.NORM,
    legal_basis: 'ÖNORM B 3850; EN 14637',
    version: '1.0',
  }),
];

/* -------------------------------------------------------------------------
 * Arbeitsmittel und Maschinen
 * ---------------------------------------------------------------------- */

const EQUIPMENT_RULES = [
  rule({
    code: 'RULE-AMVO-GATE-001',
    title: 'Kraftbetriebenes Tor – wiederkehrende Prüfung',
    system_type: 'SYS-AT-GATE-001',
    conditions: {
      all: [isTrue('object.workplace'), isTrue('instance.power_operated')],
    },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Kraftbetriebene Tore in Arbeitsstätten unterliegen einer wiederkehrenden Prüfung durch geeignete fachkundige Personen. Der Prüfbedarf ist nach Bauart und Verwendung näher zu bestimmen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Prüfbuch des Tores', 'Betriebsanleitung', 'Konformitätserklärung'],
      recommended_action: 'Torprüfung inklusive Kraftmessung und Sicherheitseinrichtungen beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO – Arbeitsmittelverordnung; ASchG',
    version: '1.2',
  }),
  rule({
    code: 'RULE-EN12453-GATE-002',
    title: 'Kraftbetriebenes Tor – Sicherheit der Schließkanten',
    system_type: 'SYS-AT-GATE-001',
    conditions: { all: [isTrue('instance.power_operated')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Die Schutzeinrichtungen gegen Quetschen und Scheren sind auf Wirksamkeit zu prüfen. Dazu gehört die Messung der Schließkräfte an den relevanten Messpunkten.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Kraftmessprotokoll'],
      recommended_action: 'Kraftmessung in die wiederkehrende Prüfung aufnehmen.',
    },
    assertion_quality: ASSERTION_QUALITY.NORM,
    legal_basis: 'EN 12453; EN 13241',
    version: '1.0',
  }),
  rule({
    code: 'RULE-GATE-ESCAPE-003',
    title: 'Tor im Fluchtweg – zusätzliche Anforderungen',
    system_type: 'SYS-AT-GATE-001',
    conditions: { all: [isTrue('instance.escape_route')] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Das Tor liegt in einem Flucht- oder Rettungsweg. Kraftbetriebene Tore in Fluchtwegen benötigen eine im Gefahrenfall wirksame Öffnungsmöglichkeit ohne Hilfsmittel und ohne besondere Kenntnisse.',
      interval: null,
      required_documents: ['Fluchtwegplan', 'Nachweis der Notöffnung'],
      recommended_action: 'Notöffnung und Fluchtwegführung fachlich beurteilen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AStV; ASchG',
    version: '1.0',
  }),
  rule({
    code: 'RULE-AMVO-CRANE-001',
    title: 'Krananlage – wiederkehrende Prüfung',
    system_type: 'SYS-AT-CRANE-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Krane und Hebezeuge sind wiederkehrend durch geeignete fachkundige Personen zu prüfen. Zusätzlich ist in längeren Intervallen eine umfassende Begutachtung vorzusehen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Kranbuch', 'Lastdiagramm', 'letzter Prüfbefund'],
      recommended_action: 'Kranprüfung inklusive Kranbuchführung beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; ASchG',
    version: '1.1',
  }),
  rule({
    code: 'RULE-CRANE-PERSON-002',
    title: 'Heben von Personen mit Hebezeugen – erhöhte Anforderungen',
    system_type: 'SYS-AT-CRANE-001',
    conditions: { all: [isTrue('instance.person_transport')] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Werden mit dem Hebezeug Personen gehoben, gelten deutlich strengere Anforderungen an Eignung, Sicherheitsfaktoren und Prüfungen. Die Zulässigkeit ist im Einzelfall zu beurteilen.',
      interval: null,
      required_documents: ['Eignungsnachweis für Personenaufnahmemittel', 'Betriebsanweisung'],
      recommended_action: 'Zulässigkeit des Personenhebens fachlich prüfen lassen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; ASchG',
    version: '1.0',
  }),
  rule({
    code: 'RULE-AMVO-OHCRANE-001',
    title: 'Laufkran – wiederkehrende Prüfung inklusive Kranbahn',
    system_type: 'SYS-AT-OHCRANE-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Laufkrane sind wiederkehrend zu prüfen. Die Kranbahn ist dabei gesondert zu beurteilen, da Verschleiß und Verformung die Standsicherheit beeinflussen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Kranbuch', 'Kranbahnnachweis'],
      recommended_action: 'Kran- und Kranbahnprüfung gemeinsam beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; ASchG; ÖNORM M 9600',
    version: '1.0',
  }),
  rule({
    code: 'RULE-AMVO-MEWP-001',
    title: 'Hebebühne – wiederkehrende Prüfung',
    system_type: 'SYS-AT-MEWP-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Hebebühnen sind wiederkehrend durch geeignete fachkundige Personen zu prüfen, insbesondere Tragmittel, Absturzsicherung und Notablasseinrichtung.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Prüfbuch', 'Betriebsanleitung'],
      recommended_action: 'Jahresprüfung der Hebebühne einplanen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; ASchG; EN 280 bzw. EN 1493',
    version: '1.0',
  }),
  rule({
    code: 'RULE-EN15635-RACK-001',
    title: 'Regalanlage – wiederkehrende Inspektion',
    system_type: 'SYS-AT-RACK-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.INSPECTION,
      statement:
        'Regalanlagen sind in regelmäßigen Abständen durch eine fachkundige Person zu inspizieren. Zusätzlich sind laufende Sichtkontrollen durch den Betreiber durchzuführen und zu dokumentieren.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Regalplan', 'Lastenschild', 'letzter Inspektionsbericht'],
      recommended_action: 'Regalinspektion beauftragen und Betreiberkontrollen einrichten.',
    },
    assertion_quality: ASSERTION_QUALITY.NORM,
    legal_basis: 'EN 15635; AM-VO',
    version: '1.0',
  }),
  rule({
    code: 'RULE-RACK-FORKLIFT-002',
    title: 'Regalanlage mit Staplerverkehr – verkürztes Inspektionsintervall prüfen',
    system_type: 'SYS-AT-RACK-001',
    conditions: { all: [isTrue('instance.forklift_traffic')] },
    outcome: {
      kind: OUTCOME_KINDS.INSPECTION,
      statement:
        'Die Regalanlage wird mit Flurförderzeugen bedient. Anfahrschäden sind die häufigste Ursache für Regaleinstürze; ein verkürztes Inspektionsintervall und wirksamer Anfahrschutz sind zu prüfen.',
      interval: { value: 6, unit: 'month' },
      required_documents: ['Anfahrschutzkonzept', 'Schadensmeldeprozess'],
      recommended_action: 'Anfahrschutz ergänzen und Meldeprozess für Schäden etablieren.',
    },
    assertion_quality: ASSERTION_QUALITY.EMPFEHLUNG,
    legal_basis: 'EN 15635; fachliche INGTEC-Empfehlung',
    version: '1.0',
  }),
  rule({
    code: 'RULE-AMVO-LADDER-001',
    title: 'Leitern und Tritte – wiederkehrende Prüfung',
    system_type: 'SYS-AT-LADDER-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Leitern und Tritte sind wiederkehrend auf ihren sicheren Zustand zu prüfen und die Prüfung ist nachvollziehbar zu dokumentieren.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Leiterverzeichnis', 'Prüfnachweise'],
      recommended_action: 'Leiterverzeichnis anlegen und Prüfung organisieren.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; ASchG; EN 131',
    version: '1.0',
  }),
  rule({
    code: 'RULE-AMVO-LIFTGEAR-001',
    title: 'Lastaufnahme- und Anschlagmittel – wiederkehrende Prüfung',
    system_type: 'SYS-AT-LIFTGEAR-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Lastaufnahme- und Anschlagmittel sind wiederkehrend zu prüfen und vor jeder Verwendung einer Sichtkontrolle zu unterziehen. Ablegereife Mittel sind der Verwendung zu entziehen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Verzeichnis der Anschlagmittel', 'Prüfnachweise'],
      recommended_action: 'Bestand erfassen, kennzeichnen und Prüfzyklus festlegen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; ASchG',
    version: '1.0',
  }),
  rule({
    code: 'RULE-MSV-MACH-001',
    title: 'Maschine – Konformitätsnachweis und Schutzeinrichtungen',
    system_type: 'SYS-AT-MACH-001',
    conditions: { all: [{ fact: 'instance.ce_declaration', op: 'is_false' }] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Für die Maschine liegt keine Konformitätserklärung vor. Vor der weiteren Verwendung ist zu klären, wer als Inverkehrbringer gilt und welche Nachweise nachzuholen sind.',
      interval: null,
      required_documents: ['Konformitätserklärung', 'Risikobeurteilung', 'Betriebsanleitung'],
      recommended_action: 'Konformitätsbewertung bzw. Nachdokumentation beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'MSV 2010; AM-VO',
    version: '1.0',
  }),
  rule({
    code: 'RULE-AMVO-MACH-002',
    title: 'Maschine – wiederkehrende Prüfung',
    system_type: 'SYS-AT-MACH-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Maschinen sind wiederkehrend auf ihren sicheren Zustand zu prüfen. Umfang und Intervall richten sich nach Gefährdung, Einsatzbedingungen und Herstellervorgaben.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Betriebsanleitung', 'Prüfnachweise'],
      recommended_action: 'Prüfumfang aus Risikobeurteilung und Herstellerangaben ableiten.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; ASchG',
    version: '1.0',
  }),
  rule({
    code: 'RULE-MSV-LINE-001',
    title: 'Verkettete Maschinenanlage – Gesamtkonformität',
    system_type: 'SYS-AT-MACHLINE-001',
    conditions: { all: [isTrue('instance.linked_machines')] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Durch die Verkettung entsteht in der Regel eine Gesamtheit von Maschinen. Für diese ist eine eigene Risikobeurteilung, ein anlagenweites Not-Halt-Konzept und eine Gesamt-Konformitätsbewertung erforderlich.',
      interval: null,
      required_documents: [
        'Risikobeurteilung der Gesamtanlage',
        'Gesamt-Konformitätserklärung',
        'Not-Halt-Konzept',
      ],
      recommended_action: 'Gesamtkonformität der verketteten Anlage beurteilen lassen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'MSV 2010',
    version: '1.0',
  }),
  rule({
    code: 'RULE-AMVO-CONV-001',
    title: 'Förderanlage – wiederkehrende Prüfung der Schutzeinrichtungen',
    system_type: 'SYS-AT-CONV-001',
    conditions: { all: [isTrue('object.workplace')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Förderanlagen sind wiederkehrend zu prüfen. Besonderes Augenmerk gilt Einzugstellen, Übergabepunkten und der Erreichbarkeit der Not-Halt-Einrichtungen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Betriebsanleitung', 'Schutzeinrichtungskonzept'],
      recommended_action: 'Prüfung der Schutzeinrichtungen und Not-Halt-Funktion beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'AM-VO; MSV 2010',
    version: '1.0',
  }),
];

/* -------------------------------------------------------------------------
 * Gebäude-, Elektro- und Drucktechnik
 * ---------------------------------------------------------------------- */

const BUILDING_RULES = [
  rule({
    code: 'RULE-ETV-ELEC-001',
    title: 'Elektrische Anlage – wiederkehrende Überprüfung (E-Befund)',
    system_type: 'SYS-AT-ELEC-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Ortsfeste elektrische Anlagen sind wiederkehrend zu überprüfen. Das Intervall hängt von Anlagenart, Nutzung und Umgebungsbedingungen ab und ist im Einzelfall festzulegen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Anlagenbefund (E-Befund)', 'Verteilerpläne', 'Mängelbehebungsnachweise'],
      recommended_action: 'Anlagenbefund erstellen bzw. Gültigkeit prüfen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ETV 2012; ESV 2012; ÖVE/ÖNORM E 8001',
    version: '1.1',
  }),
  rule({
    code: 'RULE-ASV-ELEV-001',
    title: 'Aufzug – wiederkehrende Überprüfung und Wartung',
    system_type: 'SYS-AT-ELEV-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Aufzugsanlagen unterliegen wiederkehrenden Überprüfungen und einer regelmäßigen Wartung. Zusätzlich ist die ständige Erreichbarkeit des Notrufs sicherzustellen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Aufzugsbuch', 'Wartungsvertrag', 'letzter Überprüfungsbefund'],
      recommended_action: 'Aufzugsbuch und Notrufaufschaltung prüfen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ASV 2008; HBV 2009; landesrechtliche Aufzugsvorschriften',
    version: '1.0',
  }),
  rule({
    code: 'RULE-ELEV-EMERGENCY-002',
    title: 'Aufzug – Notrufaufschaltung auf ständig besetzte Stelle',
    system_type: 'SYS-AT-ELEV-001',
    conditions: { all: [{ fact: 'instance.monitored_transmission', op: 'is_false' }] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Der Aufzugsnotruf ist nicht auf eine ständig besetzte Stelle aufgeschaltet. Damit ist die Befreiung eingeschlossener Personen nicht jederzeit sichergestellt.',
      interval: null,
      required_documents: ['Notrufvertrag', 'Notbefreiungsanleitung'],
      recommended_action: 'Notrufaufschaltung und Befreiungsorganisation herstellen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ASV 2008; EN 81-20',
    version: '1.0',
  }),
  rule({
    code: 'RULE-LPS-001',
    title: 'Blitzschutzanlage – wiederkehrende Überprüfung',
    system_type: 'SYS-AT-LPS-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Blitzschutzanlagen sind wiederkehrend zu überprüfen. Das Intervall hängt von der Schutzklasse und den Vorgaben des Bescheids ab.',
      interval: { value: 3, unit: 'year' },
      required_documents: ['Blitzschutzbefund', 'Risikoanalyse'],
      recommended_action: 'Blitzschutzbefund prüfen und Intervall festlegen.',
    },
    assertion_quality: ASSERTION_QUALITY.NORM,
    legal_basis: 'ÖVE/ÖNORM EN 62305; ETV 2012',
    version: '1.0',
  }),
  rule({
    code: 'RULE-PV-001',
    title: 'Photovoltaikanlage – wiederkehrende Überprüfung',
    system_type: 'SYS-AT-PV-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Photovoltaikanlagen sind als Teil der elektrischen Anlage wiederkehrend zu überprüfen. Zu beurteilen sind insbesondere DC-Seite, Verkabelung, Befestigung und Freischaltmöglichkeit.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Anlagendokumentation', 'Strangplan', 'Inbetriebnahmeprotokoll'],
      recommended_action: 'PV-Prüfung gemeinsam mit dem E-Befund planen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ETV 2012; ÖVE/ÖNORM E 8001; EN 62446',
    version: '1.0',
  }),
  rule({
    code: 'RULE-PV-FIRE-002',
    title: 'Photovoltaikanlage ohne Freischalteinrichtung – Einsatzkräftesicherheit',
    system_type: 'SYS-AT-PV-001',
    conditions: { all: [{ fact: 'instance.fire_brigade_switch', op: 'is_false' }] },
    outcome: {
      kind: OUTCOME_KINDS.CLARIFICATION,
      statement:
        'Ohne Freischalteinrichtung bleibt die DC-Seite der Anlage auch im Einsatzfall unter Spannung. Die Anforderungen aus Bescheid und Feuerwehrabstimmung sind zu prüfen.',
      interval: null,
      required_documents: ['Feuerwehrplan', 'behördlicher Bescheid'],
      recommended_action: 'Freischaltkonzept mit Feuerwehr und Behörde abstimmen.',
    },
    assertion_quality: ASSERTION_QUALITY.EMPFEHLUNG,
    legal_basis: 'fachliche INGTEC-Empfehlung; Vorgaben der Einsatzorganisationen',
    version: '1.0',
  }),
  rule({
    code: 'RULE-DGUEW-PRESS-001',
    title: 'Druckanlage – wiederkehrende Prüfungen nach Kategorie',
    system_type: 'SYS-AT-PRESS-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Druckgeräte unterliegen je nach Einstufung äußeren, inneren und Druckprüfungen in unterschiedlichen Intervallen. Die Einstufung ist Voraussetzung für die Festlegung des Prüfprogramms.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Kennblatt des Druckgeräts', 'Aufstellungsprüfbefund', 'Prüfprotokolle'],
      recommended_action: 'Einstufung des Druckgeräts klären und Prüfprogramm festlegen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'DGÜW-V; Kesselgesetz; AM-VO',
    version: '1.0',
  }),
  rule({
    code: 'RULE-HVAC-DAMPER-001',
    title: 'Lüftungsanlage – Brandschutzklappen prüfen',
    system_type: 'SYS-AT-HVAC-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Brandschutzklappen in raumlufttechnischen Anlagen sind wiederkehrend auf Funktion zu prüfen und die Prüfung ist zu dokumentieren.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Brandschutzklappenverzeichnis', 'Funktionsprüfprotokolle'],
      recommended_action: 'Klappenverzeichnis anlegen und Funktionsprüfung beauftragen.',
    },
    assertion_quality: ASSERTION_QUALITY.REGELWERK,
    legal_basis: 'behördlicher Bescheid; technische Regelwerke der Lüftungstechnik',
    version: '1.0',
  }),
  rule({
    code: 'RULE-FALL-001',
    title: 'Absturzsicherung und PSAgA – wiederkehrende Prüfung',
    system_type: 'SYS-AT-FALL-001',
    conditions: { all: [isTrue('object.height_work')] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Anschlageinrichtungen und persönliche Schutzausrüstung gegen Absturz sind wiederkehrend durch sachkundige Personen zu prüfen. Zusätzlich ist ein Rettungskonzept erforderlich.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Montagedokumentation der Anschlageinrichtung', 'Prüfnachweise PSAgA', 'Rettungskonzept'],
      recommended_action: 'Prüfung der Anschlagpunkte und PSAgA beauftragen, Rettungskonzept erstellen.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ASchG; BauV; PSA-V; EN 795',
    version: '1.0',
  }),
  rule({
    code: 'RULE-BATT-001',
    title: 'Batteriespeicher – Aufstellraum und wiederkehrende Prüfung',
    system_type: 'SYS-AT-BATT-001',
    conditions: { all: [{ fact: 'system.present', op: 'is_true' }] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Stationäre Batteriespeicher sind wiederkehrend zu prüfen. Zusätzlich sind die Anforderungen an Aufstellraum, Lüftung und Brandschutz zu beurteilen.',
      interval: { value: 1, unit: 'year' },
      required_documents: ['Anlagendokumentation', 'Brandschutz- und Lüftungskonzept'],
      recommended_action: 'Aufstellbedingungen und Prüfzyklus klären.',
    },
    assertion_quality: ASSERTION_QUALITY.GESETZLICH,
    legal_basis: 'ETV 2012; behördlicher Bescheid',
    version: '1.0',
  }),
  rule({
    code: 'RULE-GEN-OVERDUE-001',
    title: 'Prüfung überfällig oder unbekannt',
    system_type: ANY_SYSTEM,
    conditions: { all: [overdue('instance.last_inspection', 12)] },
    outcome: {
      kind: OUTCOME_KINDS.TEST,
      statement:
        'Die letzte Prüfung liegt länger als das typische Intervall zurück oder ist nicht bekannt. Der Prüfstand ist damit nicht nachweisbar.',
      interval: null,
      required_documents: ['letzter Prüfbefund'],
      recommended_action: 'Prüfung zeitnah beauftragen oder Nachweis beibringen.',
    },
    assertion_quality: ASSERTION_QUALITY.EMPFEHLUNG,
    legal_basis: 'betriebliche Nachweispflicht',
    version: '1.0',
  }),
];

/** @type {object[]} */
export const RULES = [...GENERAL_RULES, ...FIRE_RULES, ...EQUIPMENT_RULES, ...BUILDING_RULES];

/**
 * Regeln, die für einen Anlagentyp anzuwenden sind – inklusive der
 * übergreifenden Regeln (`ANY_SYSTEM`).
 * @param {string} systemTypeId
 * @returns {object[]}
 */
export function listRulesForSystemType(systemTypeId) {
  return RULES.filter((item) => item.system_type === systemTypeId || item.system_type === ANY_SYSTEM);
}

/**
 * Regeln, die ausschließlich auf Objektebene ausgewertet werden.
 * @returns {object[]}
 */
export function listObjectRules() {
  return RULES.filter((item) => item.scope === 'object');
}

/**
 * @param {string} code
 * @returns {object | undefined}
 */
export function getRule(code) {
  return RULES.find((item) => item.code === code);
}

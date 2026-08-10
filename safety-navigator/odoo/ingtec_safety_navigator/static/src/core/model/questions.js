/*
 * Kopie aus safety-navigator/core – nicht direkt bearbeiten.
 * Änderungen im Kern vornehmen und anschließend ausführen:
 *   node safety-navigator/scripts/sync-core.mjs
 */
/**
 * INGTEC Safety Navigator – Fragenkatalog
 *
 * Der Fragenkatalog ist die Gegenseite der Rule Engine: jede Regelbedingung
 * referenziert einen Fakt (`fact`). Kann ein Fakt nicht aufgelöst werden,
 * liefert die Engine das Ergebnis "unbestimmt" und meldet den fehlenden Fakt
 * zurück. Der Navigator schlägt daraufhin genau jene Frage nach, die diesen
 * Fakt beantwortet (Spezifikation Abschnitt 22: "Prüfbedarf näher bestimmen").
 *
 * Dadurch entsteht kein statischer Fragebogen, sondern ein adaptiver Dialog,
 * der nur das erhebt, was für eine Aussage tatsächlich erforderlich ist.
 *
 * @typedef {'boolean'|'choice'|'number'|'text'|'date_or_unknown'} QuestionType
 *
 * @typedef {object} Question
 * @property {string}       fact         Eindeutiger Faktenschlüssel
 * @property {'object'|'instance'} scope Objektfrage oder Anlagenfrage
 * @property {QuestionType} type
 * @property {string}       label
 * @property {string}       help         Inhalt des KnowledgeTooltip
 * @property {{value: any, label: string}[]} options
 * @property {string[]}     applies_to   Anlagentyp-IDs; leer = alle
 * @property {number}       sequence
 */

const YES_NO_UNKNOWN = [
  { value: true, label: 'Ja' },
  { value: false, label: 'Nein' },
  { value: null, label: 'Weiß ich nicht' },
];

let sequenceCounter = 0;

/**
 * @param {Partial<Question> & {fact: string, scope: 'object'|'instance', label: string}} data
 * @returns {Question}
 */
function question(data) {
  sequenceCounter += 10;
  return {
    type: 'boolean',
    help: '',
    options: data.type === 'choice' ? [] : YES_NO_UNKNOWN,
    applies_to: [],
    sequence: sequenceCounter,
    ...data,
  };
}

/* -------------------------------------------------------------------------
 * Objektfragen – gelten für die gesamte Session
 * ---------------------------------------------------------------------- */

/** @type {Question[]} */
const OBJECT_QUESTIONS = [
  question({
    fact: 'object.workplace',
    scope: 'object',
    label: 'Werden in dem Objekt Arbeitnehmerinnen oder Arbeitnehmer beschäftigt?',
    help:
      'Sobald Arbeitnehmerinnen oder Arbeitnehmer beschäftigt werden, gelten die Vorschriften des ArbeitnehmerInnenschutzes. Das erweitert den Prüfbedarf deutlich, insbesondere bei Arbeitsmitteln.',
  }),
  question({
    fact: 'object.permit_exists',
    scope: 'object',
    label: 'Liegt für das Objekt ein behördlicher Bescheid vor?',
    help:
      'Ein Betriebsanlagen-, Bau- oder sonstiger Bescheid enthält häufig konkrete Auflagen zu Prüfintervallen. Behördliche Auflagen haben in der Regelhierarchie des Navigators die höchste Priorität (Priorität 1).',
  }),
  question({
    fact: 'object.public_access',
    scope: 'object',
    label: 'Ist das Objekt für Kundinnen, Kunden oder Besucher zugänglich?',
    help:
      'Publikumsverkehr erhöht die Anforderungen an Fluchtwege, Sicherheitsbeleuchtung und Brandschutzeinrichtungen.',
  }),
  question({
    fact: 'object.production',
    scope: 'object',
    label: 'Wird in dem Objekt produziert oder gefertigt?',
    help: 'Produktionsbetriebe führen regelmäßig zu zusätzlichem Prüfbedarf bei Maschinen und Arbeitsmitteln.',
  }),
  question({
    fact: 'object.storage',
    scope: 'object',
    label: 'Werden größere Mengen gelagert (Lagerbereiche, Hochregal)?',
    help: 'Lagerbereiche beeinflussen Brandschutzanforderungen sowie die Inspektionspflicht von Regalanlagen.',
  }),
  question({
    fact: 'object.sleeping_area',
    scope: 'object',
    label: 'Gibt es Bereiche, in denen Personen schlafen?',
    help:
      'Schlafbereiche erhöhen die Anforderungen an Branderkennung und Alarmierung, weil Personen im Ereignisfall nicht selbst aufmerksam werden.',
  }),
  question({
    fact: 'object.vulnerable_persons',
    scope: 'object',
    label: 'Halten sich Personen mit eingeschränkter Selbstrettungsfähigkeit im Objekt auf?',
    help:
      'Kinder, pflegebedürftige oder mobilitätseingeschränkte Personen erhöhen die Anforderungen an Evakuierung und Alarmierung.',
  }),
  question({
    fact: 'object.height_work',
    scope: 'object',
    label: 'Werden Arbeiten in der Höhe durchgeführt (Dach, Bühne, Regal)?',
    help: 'Höhenarbeiten lösen Anforderungen an Absturzsicherung, Anschlageinrichtungen und Rettungskonzepte aus.',
  }),
  question({
    fact: 'object.state',
    scope: 'object',
    type: 'choice',
    label: 'In welchem Bundesland liegt das Objekt?',
    help:
      'Bautechnik-, Feuerpolizei- und Veranstaltungsrecht sind Landesmaterien. Das Bundesland entscheidet daher mit, welche landesrechtlichen Vorschriften anzuwenden sind.',
    options: [
      { value: 'burgenland', label: 'Burgenland' },
      { value: 'kaernten', label: 'Kärnten' },
      { value: 'niederoesterreich', label: 'Niederösterreich' },
      { value: 'oberoesterreich', label: 'Oberösterreich' },
      { value: 'salzburg', label: 'Salzburg' },
      { value: 'steiermark', label: 'Steiermark' },
      { value: 'tirol', label: 'Tirol' },
      { value: 'vorarlberg', label: 'Vorarlberg' },
      { value: 'wien', label: 'Wien' },
      { value: null, label: 'Weiß ich nicht' },
    ],
  }),
];

/* -------------------------------------------------------------------------
 * Anlagenfragen – gelten je erfasster Anlageninstanz
 * ---------------------------------------------------------------------- */

/** @type {Question[]} */
const INSTANCE_QUESTIONS = [
  question({
    fact: 'instance.count',
    scope: 'instance',
    type: 'number',
    label: 'Wie viele Anlagen dieser Art sind vorhanden?',
    help: 'Die Anzahl beeinflusst Prüfaufwand und Angebotsumfang, nicht jedoch die Prüfpflicht selbst.',
  }),
  question({
    fact: 'instance.location',
    scope: 'instance',
    type: 'text',
    label: 'Wo befindet sich die Anlage?',
    help: 'Beispiel: Produktionshalle, Lager Nord, Technikraum UG. Die Angabe dient der späteren Zuordnung im Prüfauftrag.',
  }),
  question({
    fact: 'instance.manufacturer',
    scope: 'instance',
    type: 'text',
    label: 'Wer ist der Hersteller?',
    help: 'Herstellerangaben sind für Wartungsintervalle und Ersatzteilverfügbarkeit relevant.',
  }),
  question({
    fact: 'instance.year_built',
    scope: 'instance',
    type: 'number',
    label: 'Aus welchem Baujahr stammt die Anlage?',
    help:
      'Das Baujahr entscheidet mit darüber, welches Regelwerk beim Inverkehrbringen anzuwenden war und ob eine wesentliche Änderung vorliegt.',
  }),
  question({
    fact: 'instance.last_inspection',
    scope: 'instance',
    type: 'date_or_unknown',
    label: 'Wann wurde die Anlage zuletzt geprüft?',
    help:
      'Liegt die letzte Prüfung länger zurück als das typische Intervall oder ist sie unbekannt, wird der Prüfbedarf als offen geführt.',
  }),
  question({
    fact: 'instance.maintenance_contract',
    scope: 'instance',
    label: 'Besteht ein Wartungsvertrag für die Anlage?',
    help:
      'Wartung ersetzt keine wiederkehrende Prüfung. Ein Wartungsvertrag deckt in der Regel nur den Erhalt des Sollzustands ab.',
  }),
  question({
    fact: 'instance.report_available',
    scope: 'instance',
    label: 'Liegt ein aktueller Prüfbericht oder Befund vor?',
    help: 'Der letzte Befund zeigt offene Mängel und den Stand der Mängelbehebung.',
  }),
  question({
    fact: 'instance.known_defects',
    scope: 'instance',
    label: 'Sind offene Mängel an der Anlage bekannt?',
    help: 'Bekannte offene Mängel fließen in die Priorisierung und in den Safety-Score(R) ein.',
  }),
  question({
    fact: 'instance.modified',
    scope: 'instance',
    label: 'Wurde die Anlage seit der Inbetriebnahme wesentlich verändert?',
    help:
      'Wesentliche Änderungen können eine neue Konformitätsbewertung, eine Abnahmeprüfung oder eine behördliche Anzeige erforderlich machen.',
  }),

  /* Anlagenspezifische Fragen */
  question({
    fact: 'instance.power_operated',
    scope: 'instance',
    label: 'Wird das Tor kraftbetrieben (motorisch) bewegt?',
    help:
      'Handbetätigte Tore werden anders beurteilt als kraftbetriebene Tore. Kraftbetriebene Tore benötigen Sicherheitseinrichtungen gegen Quetschen und Scheren.',
    applies_to: ['SYS-AT-GATE-001'],
  }),
  question({
    fact: 'instance.escape_route',
    scope: 'instance',
    label: 'Liegt die Anlage in einem Flucht- oder Rettungsweg?',
    help: 'Anlagen in Fluchtwegen unterliegen zusätzlichen Anforderungen an Freihaltung, Kennzeichnung und Funktion.',
    applies_to: ['SYS-AT-GATE-001', 'SYS-AT-FDOOR-001', 'SYS-AT-FGATE-001', 'SYS-AT-HOLD-001'],
  }),
  question({
    fact: 'instance.person_transport',
    scope: 'instance',
    label: 'Werden mit der Anlage Personen gehoben oder befördert?',
    help:
      'Das Heben von Personen führt zu deutlich strengeren Anforderungen an Prüfung, Fangvorrichtungen und Sicherheitsfaktoren.',
    applies_to: ['SYS-AT-CRANE-001', 'SYS-AT-OHCRANE-001', 'SYS-AT-MEWP-001', 'SYS-AT-LIFTTBL-001'],
  }),
  question({
    fact: 'instance.capacity_above_1t',
    scope: 'instance',
    label: 'Beträgt die Tragfähigkeit mehr als 1.000 kg?',
    help: 'Die Tragfähigkeit ist ein wesentliches Kriterium für Prüfumfang und erforderliche Fachkunde.',
    applies_to: ['SYS-AT-CRANE-001', 'SYS-AT-OHCRANE-001'],
  }),
  question({
    fact: 'instance.rack_height_above_3m',
    scope: 'instance',
    label: 'Ist die Regalanlage höher als 3 Meter?',
    help: 'Höhe und Lagerguthandhabung bestimmen Inspektionsumfang und Anfahrschutzanforderungen.',
    applies_to: ['SYS-AT-RACK-001'],
  }),
  question({
    fact: 'instance.forklift_traffic',
    scope: 'instance',
    label: 'Wird die Anlage mit Flurförderzeugen (Stapler) bedient?',
    help: 'Staplerverkehr erhöht das Risiko von Anfahrschäden erheblich und verkürzt Inspektionsintervalle.',
    applies_to: ['SYS-AT-RACK-001', 'SYS-AT-GATE-001', 'SYS-AT-CONV-001'],
  }),
  question({
    fact: 'instance.ce_declaration',
    scope: 'instance',
    label: 'Liegt eine Konformitätserklärung mit CE-Kennzeichnung vor?',
    help:
      'Fehlt die Konformitätserklärung, ist vor der weiteren Verwendung zu klären, wer als Inverkehrbringer gilt und welche Nachweise nachzuholen sind.',
    applies_to: ['SYS-AT-MACH-001', 'SYS-AT-MACHLINE-001', 'SYS-AT-CONV-001', 'SYS-AT-GATE-001', 'SYS-AT-MEWP-001'],
  }),
  question({
    fact: 'instance.linked_machines',
    scope: 'instance',
    label: 'Sind mehrere Maschinen zu einer Gesamtanlage verkettet?',
    help:
      'Werden Maschinen verkettet, entsteht in der Regel eine neue Gesamtheit von Maschinen mit eigener Konformitätsbewertung.',
    applies_to: ['SYS-AT-MACH-001', 'SYS-AT-MACHLINE-001'],
  }),
  question({
    fact: 'instance.feed_in',
    scope: 'instance',
    label: 'Wird Strom in das öffentliche Netz eingespeist?',
    help: 'Netzeinspeisung führt zu zusätzlichen Anforderungen des Netzbetreibers und zu Nachweispflichten.',
    applies_to: ['SYS-AT-PV-001', 'SYS-AT-BATT-001'],
  }),
  question({
    fact: 'instance.fire_brigade_switch',
    scope: 'instance',
    label: 'Ist eine Freischalteinrichtung für die Feuerwehr vorhanden?',
    help:
      'Ohne Freischaltmöglichkeit steht die DC-Seite einer PV-Anlage auch im Einsatzfall unter Spannung. Das ist für Einsatzkräfte relevant.',
    applies_to: ['SYS-AT-PV-001'],
  }),
  question({
    fact: 'instance.pressure_above_limit',
    scope: 'instance',
    label: 'Überschreitet die Anlage die Kennwerte für überwachungsbedürftige Druckgeräte?',
    help:
      'Druckgeräte werden nach Druck, Volumen und Medium in Kategorien eingeteilt. Diese Einstufung bestimmt die wiederkehrenden Prüfungen.',
    applies_to: ['SYS-AT-PRESS-001'],
  }),
  question({
    fact: 'instance.monitored_transmission',
    scope: 'instance',
    label: 'Ist die Anlage auf eine ständig besetzte Stelle aufgeschaltet?',
    help:
      'Die Aufschaltung auf eine ständig besetzte Stelle oder die Feuerwehr entscheidet mit über die erforderliche Anlagenkategorie.',
    applies_to: ['SYS-AT-BMA-001', 'SYS-AT-BMZ-001', 'SYS-AT-SPR-001', 'SYS-AT-ELEV-001'],
  }),
];

/** @type {Question[]} */
export const QUESTIONS = [...OBJECT_QUESTIONS, ...INSTANCE_QUESTIONS];

/** @type {Map<string, Question>} */
const BY_FACT = new Map(QUESTIONS.map((item) => [item.fact, item]));

/**
 * @param {string} fact
 * @returns {Question | undefined}
 */
export function getQuestion(fact) {
  return BY_FACT.get(fact);
}

/**
 * Alle Anlagenfragen, die für einen Anlagentyp gelten.
 * @param {string} systemTypeId
 * @returns {Question[]}
 */
export function listInstanceQuestions(systemTypeId) {
  return INSTANCE_QUESTIONS.filter(
    (item) => item.applies_to.length === 0 || item.applies_to.includes(systemTypeId),
  ).sort((a, b) => a.sequence - b.sequence);
}

/**
 * @returns {Question[]}
 */
export function listObjectQuestions() {
  return [...OBJECT_QUESTIONS].sort((a, b) => a.sequence - b.sequence);
}

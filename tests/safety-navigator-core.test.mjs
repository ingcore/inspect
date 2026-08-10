/**
 * Tests für den INGTEC Safety Navigator Core.
 *
 * Der Kern ist bewusst dependency-frei, daher laufen diese Tests ohne
 * vorherigen Build und ohne installierte Pakete:
 *
 *   node --test tests/safety-navigator-core.test.mjs
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANY_SYSTEM,
  ASSERTION_QUALITY,
  RULES,
  RULE_STATES,
  SELECTION_STATES,
  SYSTEM_TYPES,
  addInstance,
  answerQuestion,
  buildScoreInput,
  createSession,
  deserializeSession,
  evaluateRule,
  evaluateSession,
  generateReference,
  getObjectType,
  getSystemType,
  isRuleReleasable,
  listHotspots,
  listInstanceQuestions,
  listObjectTypes,
  listSystemTypesForObjectType,
  markUnsure,
  progress,
  renderBuildingSvg,
  resolveFact,
  searchSystemTypes,
  serializeSession,
  setInstanceFact,
  setObjectFact,
  setObjectType,
  toggleSystem,
} from '../safety-navigator/core/index.js';

/* ---------------------------------------------------------------------------
 * Stammdaten
 * ------------------------------------------------------------------------ */

test('Objektarten laut Abschnitt 11 sind vollständig', () => {
  const names = listObjectTypes().map((item) => item.name);
  for (const expected of [
    'Industrie',
    'Gewerbe',
    'Büro',
    'Lager',
    'Werkstätte',
    'Hotel',
    'Schule',
    'Garage',
    'Wohngebäude',
    'Gesundheitseinrichtung',
    'Veranstaltungsstätte',
    'Baustelle',
    'Verkehrsanlage',
    'Eisenbahnanlage',
    'Sonderobjekt',
  ]) {
    assert.ok(names.includes(expected), `Objektart fehlt: ${expected}`);
  }
  assert.equal(names.length, 15);
});

test('Vorbelegte Objektfakten sind unpräfixiert und für die Engine auflösbar', () => {
  // Regressionsschutz: Faktenschlüssel in `object_facts` werden ohne den
  // Namensraum 'object.' gespeichert – die Engine ergänzt ihn beim Auflösen.
  // Ein versehentliches Präfix würde die Vorbelegung wirkungslos machen.
  for (const objectType of listObjectTypes()) {
    for (const [key, value] of Object.entries(objectType.default_facts)) {
      assert.equal(key.includes('.'), false, `${objectType.id}: Fakt '${key}' darf kein Präfix tragen`);
      const session = setObjectType(createSession(), objectType.id);
      assert.equal(
        resolveFact(`object.${key}`, { session, instance: null }).value,
        value,
        `${objectType.id}: Fakt '${key}' ist nicht auflösbar`,
      );
    }
  }
});

test('Anlagenbibliothek laut Abschnitt 15 ist vollständig', () => {
  const names = SYSTEM_TYPES.map((item) => item.name);
  for (const expected of [
    'Brandmeldeanlage',
    'Brandmeldezentrale',
    'Automatische Brandmelder',
    'Handfeuermelder',
    'Brandfallsteuerungen',
    'Rauch- und Wärmeabzugsanlage',
    'Brandrauchentlüftung',
    'Druckbelüftungsanlage',
    'Sprinkleranlage',
    'Wandhydranten',
    'Steigleitung',
    'Feuerlöscher',
    'Brandschutztür',
    'Brandschutztor',
    'Feststellanlage',
    'Sicherheitsbeleuchtung',
    'Fluchtwegorientierungsbeleuchtung',
    'Kraftbetriebenes Tor',
    'Krananlage',
    'Laufkran',
    'Hebebühne',
    'Hubtisch',
    'Lastaufnahmemittel',
    'Regalanlage',
    'Leitern und Tritte',
    'Förderanlage',
    'Maschine',
    'Verkettete Maschinenanlage',
    'Photovoltaikanlage',
    'Batteriespeicher',
    'Blitzschutzanlage',
    'Aufzug',
    'Lüftungsanlage',
    'Elektrische Anlage',
    'Absturzsicherung',
    'Druckanlage',
  ]) {
    assert.ok(names.includes(expected), `Anlage fehlt: ${expected}`);
  }
});

test('Anlagen-IDs sind eindeutig und folgen dem Namensschema', () => {
  const ids = SYSTEM_TYPES.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, 'doppelte Anlagen-ID');
  for (const id of ids) assert.match(id, /^SYS-AT-[A-Z]+-\d{3}$/);
});

test('Anlagenstamm trägt die Pflichtfelder aus Abschnitt 13 und 14', () => {
  for (const systemType of SYSTEM_TYPES) {
    assert.ok(systemType.layman_description.length > 10, `${systemType.id}: Laienbeschreibung fehlt`);
    assert.ok(systemType.technical_description.length > 20, `${systemType.id}: Fachtext fehlt`);
    assert.ok(systemType.synonyms.length > 0, `${systemType.id}: keine Synonyme`);
    assert.ok(systemType.department.length > 0, `${systemType.id}: kein Fachbereich`);
    assert.ok(systemType.required_documents.length > 0, `${systemType.id}: keine Unterlagen`);
    assert.ok(systemType.typical_hazards.length > 0, `${systemType.id}: keine Gefährdungen`);
    assert.ok(systemType.typical_defects.length > 0, `${systemType.id}: keine Mängel`);
    assert.ok(systemType.legal_bases.length > 0, `${systemType.id}: keine Rechtsgrundlagen`);
    assert.ok(systemType.safety_score_category.length > 0, `${systemType.id}: keine Score-Kategorie`);
    assert.ok(
      systemType.maintenance_relevant ||
        systemType.inspection_relevant ||
        systemType.test_relevant ||
        systemType.revision_relevant,
      `${systemType.id}: keine Relevanz gesetzt`,
    );
  }
});

test('Startbibliothek ist als ungeprüft gekennzeichnet (Quellenampel rot)', () => {
  for (const systemType of SYSTEM_TYPES) {
    assert.equal(systemType.source_status, 'red', `${systemType.id} darf nicht als geprüft gelten`);
  }
});

/* ---------------------------------------------------------------------------
 * Session
 * ------------------------------------------------------------------------ */

test('Session-Referenz folgt dem Format SN-JAHR-XXXXXX', () => {
  const reference = generateReference(new Date('2026-08-09T10:00:00Z'));
  assert.match(reference, /^SN-2026-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
});

test('Session-Referenzen sind praktisch kollisionsfrei', () => {
  const references = new Set();
  for (let index = 0; index < 2000; index += 1) references.add(generateReference());
  assert.equal(references.size, 2000);
});

test('Session startet anonym', () => {
  const session = createSession();
  assert.equal(session.consent_status, 'anonymous');
  assert.equal(session.email, '');
  assert.equal(session.partner_id, null);
  assert.equal(session.state, 'draft');
});

test('Objektart setzt Vorbelegungen, überschreibt aber keine Antworten', () => {
  let session = createSession();
  session = setObjectFact(session, 'workplace', false);
  session = setObjectType(session, 'industrie');

  assert.equal(session.object_type_id, 'industrie');
  assert.equal(session.state, 'in_progress');
  assert.equal(session.object_facts.workplace, false, 'Nutzerantwort wurde überschrieben');
  assert.equal(session.object_facts.production, true, 'Vorbelegung fehlt');
});

test('Anlagen lassen sich erfassen, umschalten und als unsicher markieren', () => {
  let session = setObjectType(createSession(), 'industrie');

  session = toggleSystem(session, 'SYS-AT-GATE-001');
  assert.equal(session.instances.length, 1);
  assert.equal(session.instances[0].selection, SELECTION_STATES.HAS);

  session = toggleSystem(session, 'SYS-AT-GATE-001');
  assert.equal(session.instances.length, 0);

  session = markUnsure(session, 'SYS-AT-RWA-001');
  assert.equal(session.instances[0].selection, SELECTION_STATES.UNSURE);
});

test('Mehrere Instanzen desselben Anlagentyps sind möglich (Abschnitt 21)', () => {
  let session = setObjectType(createSession(), 'lager');
  session = addInstance(session, 'SYS-AT-GATE-001', { count: 6, location: 'Produktionshalle' });
  session = addInstance(session, 'SYS-AT-GATE-001', { count: 2, location: 'Lager Nord' });

  assert.equal(session.instances.length, 2);
  assert.notEqual(session.instances[0].id, session.instances[1].id);
  assert.equal(session.instances[0].facts.count, 6);
  assert.equal(session.instances[1].facts.location, 'Lager Nord');
});

test('Serialisierung ist fehlertolerant', () => {
  const session = setObjectType(createSession(), 'buero');
  const restored = deserializeSession(serializeSession(session));
  assert.equal(restored.reference, session.reference);
  assert.equal(restored.object_type_id, 'buero');

  assert.equal(deserializeSession('kaputt'), null);
  assert.equal(deserializeSession(''), null);
  assert.equal(deserializeSession('{"foo":1}'), null);
});

test('Fortschritt für den ProgressHeader', () => {
  const session = createSession();
  const state = progress(session);
  assert.equal(state.index, 0);
  assert.equal(state.total, 5);
  assert.equal(state.steps[0].active, true);
});

/* ---------------------------------------------------------------------------
 * Rule Engine – dreiwertige Logik
 * ------------------------------------------------------------------------ */

const testRule = {
  code: 'RULE-TEST-001',
  title: 'Testregel',
  system_type: 'SYS-AT-GATE-001',
  conditions: {
    all: [
      { fact: 'object.workplace', op: 'is_true' },
      { fact: 'instance.power_operated', op: 'is_true' },
    ],
  },
  outcome: { kind: 'pruefung', statement: 'Test', interval: { value: 1, unit: 'year' }, required_documents: [] },
  assertion_quality: ASSERTION_QUALITY.GESETZLICH,
  legal_basis: 'Test',
  priority: 2,
  version: '1.0',
  state: RULE_STATES.APPROVED,
  approved: true,
  source_status: 'green',
};

test('Regel greift, wenn alle Bedingungen erfüllt sind', () => {
  const session = { object_facts: { workplace: true }, instances: [] };
  const instance = { id: 'i1', system_type_id: 'SYS-AT-GATE-001', facts: { power_operated: true } };
  const result = evaluateRule(testRule, { session, instance, systemType: getSystemType('SYS-AT-GATE-001') });
  assert.equal(result.status, 'match');
  assert.deepEqual(result.missing_facts, []);
});

test('Regel greift nicht, wenn eine Bedingung falsch ist', () => {
  const session = { object_facts: { workplace: false }, instances: [] };
  const instance = { id: 'i1', system_type_id: 'SYS-AT-GATE-001', facts: { power_operated: true } };
  const result = evaluateRule(testRule, { session, instance, systemType: getSystemType('SYS-AT-GATE-001') });
  assert.equal(result.status, 'no_match');
});

test('Fehlende Angabe führt zu "indeterminate", nicht zu "nein"', () => {
  const session = { object_facts: { workplace: true }, instances: [] };
  const instance = { id: 'i1', system_type_id: 'SYS-AT-GATE-001', facts: {} };
  const result = evaluateRule(testRule, { session, instance, systemType: getSystemType('SYS-AT-GATE-001') });
  assert.equal(result.status, 'indeterminate');
  assert.deepEqual(result.missing_facts, ['instance.power_operated']);
});

test('Eine falsche Bedingung kürzt die Konjunktion ab (keine unnötigen Rückfragen)', () => {
  const session = { object_facts: { workplace: false }, instances: [] };
  const instance = { id: 'i1', system_type_id: 'SYS-AT-GATE-001', facts: {} };
  const result = evaluateRule(testRule, { session, instance, systemType: getSystemType('SYS-AT-GATE-001') });
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.missing_facts, [], 'es darf keine Frage gestellt werden');
});

test('any-Verknüpfung: ein wahrer Zweig genügt', () => {
  const rule = {
    ...testRule,
    conditions: {
      any: [
        { fact: 'object.workplace', op: 'is_true' },
        { fact: 'instance.unbekannt', op: 'is_true' },
      ],
    },
  };
  const session = { object_facts: { workplace: true }, instances: [] };
  const instance = { id: 'i1', system_type_id: 'SYS-AT-GATE-001', facts: {} };
  assert.equal(evaluateRule(rule, { session, instance }).status, 'match');
});

test('not-Verknüpfung invertiert, lässt "unbekannt" aber unbekannt', () => {
  const rule = { ...testRule, conditions: { not: { fact: 'object.workplace', op: 'is_true' } } };

  assert.equal(
    evaluateRule(rule, { session: { object_facts: { workplace: true }, instances: [] }, instance: null }).status,
    'no_match',
  );
  assert.equal(
    evaluateRule(rule, { session: { object_facts: {}, instances: [] }, instance: null }).status,
    'indeterminate',
  );
});

test('Unbekannter Prüfzeitpunkt gilt als überfällig', () => {
  const rule = {
    ...testRule,
    conditions: { all: [{ fact: 'instance.last_inspection', op: 'older_than_months', value: 12 }] },
  };
  const session = { object_facts: {}, instances: [] };

  const unknown = { id: 'i1', system_type_id: 'SYS-AT-GATE-001', facts: { last_inspection: 'unknown' } };
  assert.equal(evaluateRule(rule, { session, instance: unknown, now: new Date('2026-08-09') }).status, 'match');

  const recent = { id: 'i2', system_type_id: 'SYS-AT-GATE-001', facts: { last_inspection: '2026-05-01' } };
  assert.equal(evaluateRule(rule, { session, instance: recent, now: new Date('2026-08-09') }).status, 'no_match');

  const old = { id: 'i3', system_type_id: 'SYS-AT-GATE-001', facts: { last_inspection: '2023-01-01' } };
  assert.equal(evaluateRule(rule, { session, instance: old, now: new Date('2026-08-09') }).status, 'match');
});

/* ---------------------------------------------------------------------------
 * Rule Engine – Freigabe und Priorität
 * ------------------------------------------------------------------------ */

test('Nur freigegebene Regeln erreichen externe Nutzer (Abschnitt 24)', () => {
  const draft = { ...testRule, state: RULE_STATES.DRAFT, approved: false };
  assert.equal(isRuleReleasable(draft, 'public'), false);
  assert.equal(isRuleReleasable(draft, 'internal'), true);

  assert.equal(isRuleReleasable(testRule, 'public'), true);

  const withdrawn = { ...testRule, state: RULE_STATES.WITHDRAWN };
  assert.equal(isRuleReleasable(withdrawn, 'public'), false);
  assert.equal(isRuleReleasable(withdrawn, 'internal'), false, 'zurückgezogene Regeln gelten nie');
});

test('Startregelwerk ist durchgängig unfreigegeben und wird extern zurückgehalten', () => {
  for (const rule of RULES) {
    assert.equal(rule.state, RULE_STATES.DRAFT, `${rule.code} darf nicht freigegeben sein`);
    assert.equal(rule.approved, false);
  }

  let session = setObjectType(createSession(), 'industrie');
  session = setObjectFact(session, 'permit_exists', true);
  session = addInstance(session, 'SYS-AT-GATE-001', { power_operated: true });

  const external = evaluateSession(session, { audience: 'public' });
  assert.equal(external.summary.requirement_count, 0);
  assert.ok(external.suppressed_rules > 0);
  assert.ok(external.release_notice.length > 0);

  const internal = evaluateSession(session, { audience: 'internal' });
  assert.ok(internal.summary.requirement_count > 0);
  assert.equal(internal.suppressed_rules, 0);
});

test('Regelpriorität steuert die Sortierung (Abschnitt 25)', () => {
  let session = setObjectType(createSession(), 'industrie');
  session = setObjectFact(session, 'permit_exists', true);
  session = addInstance(session, 'SYS-AT-GATE-001', { power_operated: true, report_available: false });

  const result = evaluateSession(session, { audience: 'internal' });
  const gate = result.systems[0];
  const priorities = gate.requirements.map((item) => item.priority);

  assert.deepEqual(priorities, [...priorities].sort((a, b) => a - b), 'nicht nach Priorität sortiert');
  assert.equal(gate.requirements[0].priority, 1, 'behördliche Vorgabe muss zuerst stehen');
  assert.match(gate.requirements[0].rule_code, /PERMIT/);
});

test('Alle Regeln tragen Priorität, Rechtsgrundlage, Version und Aussagequalität', () => {
  for (const rule of RULES) {
    assert.ok(rule.priority >= 1 && rule.priority <= 6, `${rule.code}: Priorität außerhalb 1..6`);
    assert.ok(rule.legal_basis.length > 0, `${rule.code}: keine Rechtsgrundlage`);
    assert.match(rule.version, /^\d+\.\d+$/, `${rule.code}: Version fehlt`);
    assert.ok(rule.assertion_quality.label.length > 0, `${rule.code}: keine Aussagequalität`);
    assert.ok(rule.outcome.statement.length > 20, `${rule.code}: kein Ergebnistext`);
    assert.equal(
      rule.priority,
      rule.assertion_quality.priority,
      `${rule.code}: Priorität passt nicht zur Aussagequalität`,
    );
  }
});

test('Regelcodes sind eindeutig', () => {
  const codes = RULES.map((rule) => rule.code);
  assert.equal(new Set(codes).size, codes.length);
});

test('Jede Regel verweist auf einen bekannten Anlagentyp', () => {
  for (const rule of RULES) {
    if (rule.system_type === ANY_SYSTEM) continue;
    assert.ok(getSystemType(rule.system_type), `${rule.code}: unbekannter Anlagentyp ${rule.system_type}`);
  }
});

/* ---------------------------------------------------------------------------
 * Rule Engine – Ergebnisaufbereitung
 * ------------------------------------------------------------------------ */

test('Offene Fragen entstehen aus unbestimmten Regeln', () => {
  let session = setObjectType(createSession(), 'industrie');
  session = addInstance(session, 'SYS-AT-GATE-001');

  const result = evaluateSession(session, { audience: 'internal' });
  const facts = result.open_questions.map((question) => question.fact);

  assert.ok(facts.includes('instance.power_operated'), 'Torfrage fehlt');
  for (const question of result.open_questions) {
    assert.ok(question.label.length > 0);
    assert.ok(question.triggered_by.length > 0, 'Frage ohne auslösende Regel');
  }
});

test('Beantwortete Frage verschwindet und erzeugt eine Anforderung', () => {
  let session = setObjectType(createSession(), 'industrie');
  session = addInstance(session, 'SYS-AT-GATE-001');

  const before = evaluateSession(session, { audience: 'internal' });
  const question = before.open_questions.find((item) => item.fact === 'instance.power_operated');
  assert.ok(question);

  session = answerQuestion(session, question, true);
  const after = evaluateSession(session, { audience: 'internal' });

  assert.equal(
    after.open_questions.some((item) => item.fact === 'instance.power_operated'),
    false,
    'Frage wird erneut gestellt',
  );
  assert.ok(
    after.systems[0].requirements.some((item) => item.rule_code === 'RULE-AMVO-GATE-001'),
    'Torprüfregel greift nicht',
  );
});

test('Kürzestes gefordertes Intervall gewinnt', () => {
  let session = setObjectType(createSession(), 'lager');
  session = addInstance(session, 'SYS-AT-RACK-001', { forklift_traffic: true });

  const result = evaluateSession(session, { audience: 'internal' });
  assert.equal(result.systems[0].effective_interval_months, 6, 'Staplerverkehr muss das Intervall verkürzen');
});

test('Ohne verkürzende Regel greift die typische Prüffrist des Anlagenstamms', () => {
  let session = setObjectType(createSession(), 'wohngebaeude');
  session = addInstance(session, 'SYS-AT-LPS-001');

  const result = evaluateSession(session, { audience: 'internal' });
  assert.equal(result.systems[0].effective_interval_months, 36);
});

test('Ergebnis fasst Unterlagenbedarf zusammen', () => {
  let session = setObjectType(createSession(), 'industrie');
  session = addInstance(session, 'SYS-AT-BMA-001');
  session = addInstance(session, 'SYS-AT-ELEC-001');

  const result = evaluateSession(session, { audience: 'internal' });
  assert.ok(result.summary.required_documents.includes('Betriebsbuch'));
  assert.ok(result.summary.required_documents.includes('Anlagenbefund (E-Befund)'));
  assert.equal(result.summary.system_count, 2);
});

test('Objektregeln werden unabhängig von Anlagen ausgewertet', () => {
  let session = setObjectType(createSession(), 'hotel');
  session = setObjectFact(session, 'sleeping_area', true);

  const result = evaluateSession(session, { audience: 'internal' });
  assert.ok(
    result.object_requirements.some((item) => item.rule_code === 'RULE-SLEEP-BMA-001'),
    'Schlafbereichsregel greift nicht',
  );

  session = addInstance(session, 'SYS-AT-BMA-001');
  const withBma = evaluateSession(session, { audience: 'internal' });
  assert.equal(
    withBma.object_requirements.some((item) => item.rule_code === 'RULE-SLEEP-BMA-001'),
    false,
    'Regel darf mit vorhandener BMA nicht mehr greifen',
  );
});

test('Score-Übergabe enthält keine Bewertung, nur das Eingangsprofil', () => {
  let session = setObjectType(createSession(), 'industrie');
  session = addInstance(session, 'SYS-AT-GATE-001', { power_operated: true });
  session = addInstance(session, 'SYS-AT-BMA-001');

  const result = evaluateSession(session, { audience: 'internal' });
  const scoreInput = buildScoreInput(result);

  assert.equal(scoreInput.reference, session.reference);
  assert.ok(scoreInput.categories['Arbeitsmittelsicherheit']);
  assert.ok(scoreInput.categories['Brandschutz – Detektion und Alarmierung']);
  assert.equal(scoreInput.totals.systems, 2);
  assert.equal('score' in scoreInput, false, 'der Navigator darf keinen Score berechnen');
});

test('Instanzfakten wirken nur auf ihre eigene Instanz', () => {
  let session = setObjectType(createSession(), 'lager');
  session = addInstance(session, 'SYS-AT-RACK-001', { location: 'Halle A' });
  session = addInstance(session, 'SYS-AT-RACK-001', { location: 'Halle B' });

  const [first] = session.instances;
  session = setInstanceFact(session, first.id, 'forklift_traffic', true);

  const result = evaluateSession(session, { audience: 'internal' });
  const [a, b] = result.systems;
  assert.equal(a.effective_interval_months, 6);
  assert.equal(b.effective_interval_months, 12);
});

/* ---------------------------------------------------------------------------
 * Suche
 * ------------------------------------------------------------------------ */

test('Suche nach "Tor" findet alle Torvarianten (Abschnitt 20)', () => {
  const names = searchSystemTypes('Tor').map((hit) => hit.system_type.name);
  assert.ok(names.includes('Kraftbetriebenes Tor'));
  assert.ok(names.includes('Brandschutztor'));
  assert.equal(names[0], 'Kraftbetriebenes Tor', 'bester Treffer muss zuerst stehen');
});

test('Suche findet Anlagen über Synonyme', () => {
  assert.equal(searchSystemTypes('Sektionaltor')[0].system_type.id, 'SYS-AT-GATE-001');
  assert.equal(searchSystemTypes('Lift')[0].system_type.id, 'SYS-AT-ELEV-001');
  assert.equal(searchSystemTypes('Rauchmelder')[0].system_type.id, 'SYS-AT-DET-001');
  assert.equal(searchSystemTypes('E-Befund')[0].system_type.id, 'SYS-AT-ELEC-001');
});

test('Suche ist tolerant gegenüber Umlauten und Schreibweisen', () => {
  assert.equal(searchSystemTypes('lüftung')[0].system_type.id, 'SYS-AT-HVAC-001');
  assert.equal(searchSystemTypes('LUEFTUNG')[0].system_type.id, 'SYS-AT-HVAC-001');
  assert.ok(searchSystemTypes('brandmelde').length >= 2);
});

test('Zu kurze Eingaben liefern keine Treffer', () => {
  assert.deepEqual(searchSystemTypes('a'), []);
  assert.deepEqual(searchSystemTypes(''), []);
});

/* ---------------------------------------------------------------------------
 * Objektart-Filter und Fragen
 * ------------------------------------------------------------------------ */

test('Objektart filtert die angebotenen Anlagen', () => {
  const residential = listSystemTypesForObjectType(getObjectType('wohngebaeude'));
  const industrial = listSystemTypesForObjectType(getObjectType('industrie'));

  assert.ok(industrial.length > residential.length);
  assert.equal(
    residential.some((item) => item.id === 'SYS-AT-MACHLINE-001'),
    false,
    'Fertigungslinie gehört nicht ins Wohngebäude',
  );
  assert.ok(residential.some((item) => item.id === 'SYS-AT-ELEV-001'));
});

test('Anlagenfragen sind typspezifisch', () => {
  const gate = listInstanceQuestions('SYS-AT-GATE-001').map((item) => item.fact);
  const rack = listInstanceQuestions('SYS-AT-RACK-001').map((item) => item.fact);

  assert.ok(gate.includes('instance.power_operated'));
  assert.equal(rack.includes('instance.power_operated'), false);
  assert.ok(rack.includes('instance.rack_height_above_3m'));

  // Allgemeine Fragen gelten für beide.
  assert.ok(gate.includes('instance.last_inspection'));
  assert.ok(rack.includes('instance.last_inspection'));
});

/* ---------------------------------------------------------------------------
 * Visualisierung
 * ------------------------------------------------------------------------ */

test('SVG trägt die Layerstruktur aus Abschnitt 16', () => {
  const svg = renderBuildingSvg();
  for (const layer of [
    'svg-building',
    'layer_building',
    'layer_fire_protection',
    'layer_work_equipment',
    'layer_energy',
  ]) {
    assert.ok(svg.includes(`id="${layer}"`), `Layer fehlt: ${layer}`);
  }
  for (const object of ['system_bma', 'system_rwa', 'system_sprinkler', 'system_crane', 'system_gate', 'system_pv']) {
    assert.ok(svg.includes(`id="${object}"`), `SVG-Objekt fehlt: ${object}`);
  }
});

test('Hotspots sind barrierefrei beschriftet', () => {
  const svg = renderBuildingSvg();
  assert.ok(svg.includes('role="button"'));
  assert.ok(svg.includes('tabindex="0"'));
  assert.ok(svg.includes('aria-label="Rauch- und Wärmeabzugsanlage – Hallendach"'));
  assert.ok(svg.includes('<title>Kraftbetriebenes Tor – Hallentor</title>'));
});

test('Auswahlzustand wird in der Grafik abgebildet', () => {
  const svg = renderBuildingSvg({ selection: { 'SYS-AT-GATE-001': 'has', 'SYS-AT-RWA-001': 'unsure' } });
  assert.match(svg, /class="sn-hotspot is-selected"[^>]*data-system-type="SYS-AT-GATE-001"/s);
  assert.match(svg, /class="sn-hotspot is-unsure"[^>]*data-system-type="SYS-AT-RWA-001"/s);
});

test('Jeder Anlagentyp der Bibliothek hat einen Hotspot', () => {
  const covered = new Set(listHotspots().map((hotspot) => hotspot.system_type_id));
  for (const systemType of SYSTEM_TYPES) {
    assert.ok(covered.has(systemType.id), `${systemType.id} fehlt in der Gebäudegrafik`);
  }
});

test('Hotspot-IDs sind eindeutig', () => {
  const ids = listHotspots().map((hotspot) => hotspot.hotspot_id);
  assert.equal(new Set(ids).size, ids.length);
  const objectIds = listHotspots().map((hotspot) => hotspot.svg_object_id);
  assert.equal(new Set(objectIds).size, objectIds.length);
});

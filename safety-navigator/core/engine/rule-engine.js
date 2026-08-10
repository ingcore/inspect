/**
 * INGTEC Safety Navigator – Rule Engine
 *
 * Spezifikation Abschnitt 22: Eine einfache boolesche Logik
 * ("prüfpflichtig = Ja/Nein") ist fachlich nicht ausreichend. Die Engine
 * arbeitet daher dreiwertig:
 *
 *   match          – die Regel greift, alle Bedingungen sind erfüllt
 *   no_match       – die Regel greift nicht
 *   indeterminate  – die Regel könnte greifen, es fehlen aber Angaben
 *
 * Der Zustand `indeterminate` ist der fachlich wichtigste: er erzeugt keine
 * falsche Sicherheit, sondern eine gezielte Rückfrage ("Prüfbedarf näher
 * bestimmen"). Genau dafür meldet die Engine die fehlenden Fakten zurück.
 *
 * Abschnitt 24: Im Audience-Modus `public` werden ausschließlich freigegebene
 * Regeln ausgewertet. Entwürfe werden gezählt, aber nicht ausgeliefert.
 *
 * Abschnitt 25: Ergebnisse werden nach Regelpriorität 1..6 sortiert.
 */

import { getSystemType, relevanceMatrix } from '../model/system-types.js';
import { getObjectType } from '../model/object-types.js';
import { getQuestion } from '../model/questions.js';
import { RULES, RULE_PRIORITIES, RULE_STATES, ANY_SYSTEM } from '../model/rules.js';

/** Dreiwertiges Ergebnis einer Bedingung. */
export const TRUTH = { TRUE: 'true', FALSE: 'false', UNKNOWN: 'unknown' };

/**
 * Ergebnis der Faktenauflösung.
 * @typedef {{known: boolean, value: any}} FactValue
 */

const UNKNOWN_FACT = { known: false, value: undefined };

/**
 * Löst einen Faktenschlüssel gegen Session und Anlageninstanz auf.
 *
 * Namensräume:
 *   object.*              Objektfakten der Session
 *   instance.*            Fakten der aktuell bewerteten Anlageninstanz
 *   system.present        Die Instanz existiert (immer wahr im Instanzkontext)
 *   system.is_*           Abgeleitete Eigenschaften des Anlagentyps
 *   system.<ID>.present   Eine Anlage dieses Typs wurde in der Session erfasst
 *
 * @param {string} fact
 * @param {object} context
 * @returns {FactValue}
 */
export function resolveFact(fact, context) {
  const { session, instance, systemType } = context;

  if (fact.startsWith('object.')) {
    const key = fact.slice('object.'.length);
    const facts = session.object_facts ?? {};
    if (!(key in facts) || facts[key] === undefined || facts[key] === null) return UNKNOWN_FACT;
    return { known: true, value: facts[key] };
  }

  if (fact.startsWith('instance.')) {
    if (!instance) return UNKNOWN_FACT;
    const key = fact.slice('instance.'.length);
    const facts = instance.facts ?? {};
    if (!(key in facts) || facts[key] === undefined || facts[key] === null) return UNKNOWN_FACT;
    return { known: true, value: facts[key] };
  }

  if (fact === 'system.present') {
    return { known: true, value: Boolean(instance) };
  }

  if (fact === 'system.is_work_equipment') {
    if (!systemType) return UNKNOWN_FACT;
    const categories = [systemType.category, ...systemType.secondary_categories];
    return { known: true, value: categories.includes('arbeitsmittel') };
  }

  if (fact.startsWith('system.') && fact.endsWith('.present')) {
    const systemTypeId = fact.slice('system.'.length, -'.present'.length);
    const present = (session.instances ?? []).some((item) => item.system_type_id === systemTypeId);
    return { known: true, value: present };
  }

  return UNKNOWN_FACT;
}

/**
 * Prüft, ob ein Datum länger als `months` zurückliegt.
 * Der explizite Wert 'unknown' (Antwortoption "Weiß ich nicht") gilt als
 * überfällig – ein nicht nachweisbarer Prüfstand ist fachlich wie ein
 * fehlender Prüfstand zu behandeln.
 *
 * @param {any} value
 * @param {number} months
 * @param {Date} now
 * @returns {string} TRUTH-Wert
 */
function evaluateOlderThan(value, months, now) {
  if (value === 'unknown') return TRUTH.TRUE;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return TRUTH.UNKNOWN;
  const limit = new Date(now.getTime());
  limit.setMonth(limit.getMonth() - months);
  return date.getTime() < limit.getTime() ? TRUTH.TRUE : TRUTH.FALSE;
}

/**
 * Wertet eine einzelne Bedingung dreiwertig aus.
 * @param {object} condition
 * @param {object} context
 * @returns {{truth: string, missing: string[]}}
 */
function evaluateCondition(condition, context) {
  const { fact, op, value } = condition;
  const resolved = resolveFact(fact, context);

  // Die Operatoren `known` und `unknown` sind immer entscheidbar.
  if (op === 'known') return { truth: resolved.known ? TRUTH.TRUE : TRUTH.FALSE, missing: [] };
  if (op === 'unknown') return { truth: resolved.known ? TRUTH.FALSE : TRUTH.TRUE, missing: [] };

  if (!resolved.known) return { truth: TRUTH.UNKNOWN, missing: [fact] };

  const actual = resolved.value;
  let truth;

  switch (op) {
    case 'is_true':
      truth = actual === true ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'is_false':
      truth = actual === false ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'eq':
      truth = actual === value ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'ne':
      truth = actual !== value ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'in':
      truth = Array.isArray(value) && value.includes(actual) ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'not_in':
      truth = Array.isArray(value) && !value.includes(actual) ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'gt':
      truth = Number(actual) > Number(value) ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'gte':
      truth = Number(actual) >= Number(value) ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'lt':
      truth = Number(actual) < Number(value) ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'lte':
      truth = Number(actual) <= Number(value) ? TRUTH.TRUE : TRUTH.FALSE;
      break;
    case 'older_than_months':
      truth = evaluateOlderThan(actual, Number(value), context.now);
      break;
    default:
      throw new Error(`Unbekannter Bedingungsoperator: ${op}`);
  }

  return { truth, missing: [] };
}

/**
 * Wertet einen Bedingungsbaum (all / any / not / Blatt) dreiwertig aus.
 * @param {object} node
 * @param {object} context
 * @returns {{truth: string, missing: string[]}}
 */
export function evaluateConditionTree(node, context) {
  if (!node) return { truth: TRUTH.TRUE, missing: [] };

  if (Array.isArray(node.all)) {
    const missing = [];
    let sawUnknown = false;
    for (const child of node.all) {
      const result = evaluateConditionTree(child, context);
      if (result.truth === TRUTH.FALSE) {
        // Eine falsche Bedingung entscheidet die Konjunktion – offene Fakten
        // der übrigen Zweige sind dann nicht mehr erforderlich.
        return { truth: TRUTH.FALSE, missing: [] };
      }
      if (result.truth === TRUTH.UNKNOWN) {
        sawUnknown = true;
        missing.push(...result.missing);
      }
    }
    return { truth: sawUnknown ? TRUTH.UNKNOWN : TRUTH.TRUE, missing };
  }

  if (Array.isArray(node.any)) {
    const missing = [];
    let sawUnknown = false;
    for (const child of node.any) {
      const result = evaluateConditionTree(child, context);
      if (result.truth === TRUTH.TRUE) return { truth: TRUTH.TRUE, missing: [] };
      if (result.truth === TRUTH.UNKNOWN) {
        sawUnknown = true;
        missing.push(...result.missing);
      }
    }
    return { truth: sawUnknown ? TRUTH.UNKNOWN : TRUTH.FALSE, missing };
  }

  if (node.not) {
    const result = evaluateConditionTree(node.not, context);
    if (result.truth === TRUTH.UNKNOWN) return result;
    return {
      truth: result.truth === TRUTH.TRUE ? TRUTH.FALSE : TRUTH.TRUE,
      missing: [],
    };
  }

  return evaluateCondition(node, context);
}

/**
 * Wertet eine einzelne Regel aus.
 * @param {object} rule
 * @param {object} context
 * @returns {{rule: object, status: 'match'|'no_match'|'indeterminate', missing_facts: string[]}}
 */
export function evaluateRule(rule, context) {
  const { truth, missing } = evaluateConditionTree(rule.conditions, context);
  const status =
    truth === TRUTH.TRUE ? 'match' : truth === TRUTH.FALSE ? 'no_match' : 'indeterminate';
  return { rule, status, missing_facts: [...new Set(missing)] };
}

/**
 * Wandelt eine gematchte Regel in eine Anforderung für die Ergebnisdarstellung.
 * @param {object} rule
 * @param {object} [instance]
 * @returns {object}
 */
function toRequirement(rule, instance) {
  return {
    rule_code: rule.code,
    title: rule.title,
    kind: rule.outcome.kind,
    statement: rule.outcome.statement,
    interval: rule.outcome.interval,
    required_documents: rule.outcome.required_documents ?? [],
    recommended_action: rule.outcome.recommended_action ?? '',
    priority: rule.priority,
    priority_label: RULE_PRIORITIES[rule.priority],
    assertion_quality: rule.assertion_quality.label,
    legal_basis: rule.legal_basis,
    version: rule.version,
    state: rule.state,
    source_status: rule.source_status,
    instance_id: instance ? instance.id : null,
  };
}

/**
 * Monatswert eines Intervalls – für den Vergleich "kürzestes Intervall".
 * @param {{value: number|null, unit: string|null}|null} interval
 * @returns {number|null}
 */
function intervalInMonths(interval) {
  if (!interval || interval.value === null || interval.value === undefined) return null;
  if (interval.unit === 'month') return interval.value;
  if (interval.unit === 'year') return interval.value * 12;
  return null;
}

/**
 * Baut aus einem fehlenden Fakt eine offene Frage für den QuestionRenderer.
 * @param {string} fact
 * @param {object|null} instance
 * @param {string[]} ruleCodes
 * @returns {object|null}
 */
function toOpenQuestion(fact, instance, ruleCodes) {
  const question = getQuestion(fact);
  if (!question) return null;
  return {
    fact,
    scope: question.scope,
    type: question.type,
    label: question.label,
    help: question.help,
    options: question.options,
    instance_id: question.scope === 'instance' && instance ? instance.id : null,
    triggered_by: ruleCodes,
  };
}

/**
 * Zusammenführen offener Fragen über alle Anlagen hinweg.
 * @param {object[]} questions
 * @returns {object[]}
 */
function mergeOpenQuestions(questions) {
  /** @type {Map<string, object>} */
  const merged = new Map();
  for (const question of questions) {
    const key = `${question.fact}::${question.instance_id ?? 'object'}`;
    const existing = merged.get(key);
    if (existing) {
      existing.triggered_by = [...new Set([...existing.triggered_by, ...question.triggered_by])];
    } else {
      merged.set(key, { ...question });
    }
  }
  return [...merged.values()];
}

/**
 * Prüft, ob eine Regel im gewählten Audience-Modus ausgeliefert werden darf.
 * Abschnitt 24: Nur freigegebene Regeln dürfen Ergebnisse für externe Nutzer
 * erzeugen.
 *
 * @param {object} rule
 * @param {'public'|'internal'} audience
 * @returns {boolean}
 */
export function isRuleReleasable(rule, audience) {
  if (rule.state === RULE_STATES.WITHDRAWN || rule.state === RULE_STATES.ARCHIVED) return false;
  if (audience === 'internal') return true;
  return rule.state === RULE_STATES.APPROVED && rule.approved === true;
}

/**
 * Wertet eine komplette Navigator-Session aus.
 *
 * @param {object} session
 * @param {object} [options]
 * @param {'public'|'internal'} [options.audience='public']
 * @param {object[]} [options.rules=RULES]
 * @param {Date} [options.now]
 * @returns {object} Ergebnisobjekt für RequirementResult / SafetyCheckSummary
 */
export function evaluateSession(session, options = {}) {
  const audience = options.audience ?? 'public';
  const ruleSet = options.rules ?? RULES;
  const now = options.now ?? new Date();

  const objectType = session.object_type_id ? getObjectType(session.object_type_id) : undefined;
  const instances = session.instances ?? [];

  /** @type {object[]} */
  const systems = [];
  /** @type {object[]} */
  const allOpenQuestions = [];
  /** @type {object[]} */
  const objectRequirements = [];
  let suppressedCount = 0;

  // 1) Objektbezogene Regeln (scope === 'object') einmal je Session auswerten.
  const objectRules = ruleSet.filter((rule) => rule.scope === 'object');
  for (const rule of objectRules) {
    const context = { session, instance: null, systemType: null, now };
    const result = evaluateRule(rule, context);
    if (result.status === 'match') {
      if (!isRuleReleasable(rule, audience)) {
        suppressedCount += 1;
        continue;
      }
      objectRequirements.push(toRequirement(rule, null));
    } else if (result.status === 'indeterminate') {
      for (const fact of result.missing_facts) {
        const question = toOpenQuestion(fact, null, [rule.code]);
        if (question) allOpenQuestions.push(question);
      }
    }
  }

  // 2) Je erfasster Anlageninstanz die einschlägigen Regeln auswerten.
  for (const instance of instances) {
    const systemType = getSystemType(instance.system_type_id);
    if (!systemType) continue;

    const applicable = ruleSet.filter(
      (rule) =>
        rule.scope !== 'object' &&
        (rule.system_type === instance.system_type_id || rule.system_type === ANY_SYSTEM),
    );

    /** @type {object[]} */
    const requirements = [];
    /** @type {object[]} */
    const openQuestions = [];

    for (const rule of applicable) {
      const context = { session, instance, systemType, now };
      const result = evaluateRule(rule, context);

      if (result.status === 'match') {
        if (!isRuleReleasable(rule, audience)) {
          suppressedCount += 1;
          continue;
        }
        requirements.push(toRequirement(rule, instance));
      } else if (result.status === 'indeterminate') {
        for (const fact of result.missing_facts) {
          const question = toOpenQuestion(fact, instance, [rule.code]);
          if (question) openQuestions.push(question);
        }
      }
    }

    requirements.sort((a, b) => a.priority - b.priority || a.rule_code.localeCompare(b.rule_code));

    // Kürzestes gefordertes Intervall gewinnt; sonst greift die typische
    // Prüffrist des Anlagenstamms.
    const intervals = requirements
      .map((requirement) => intervalInMonths(requirement.interval))
      .filter((months) => months !== null);
    const typical = intervalInMonths(systemType.typical_interval);
    const effectiveMonths = intervals.length
      ? Math.min(...intervals)
      : typical !== null
        ? typical
        : null;

    const documents = new Set();
    for (const requirement of requirements) {
      for (const document of requirement.required_documents) documents.add(document);
    }

    systems.push({
      instance_id: instance.id,
      system_type_id: systemType.id,
      system_type_name: systemType.name,
      category: systemType.category,
      count: instance.facts?.count ?? null,
      location: instance.facts?.location ?? '',
      relevance: relevanceMatrix(systemType),
      requirements,
      open_questions: mergeOpenQuestions(openQuestions),
      required_documents: [...documents],
      effective_interval_months: effectiveMonths,
      highest_priority: requirements.length ? requirements[0].priority : null,
      safety_score_category: systemType.safety_score_category,
      source_status: systemType.source_status,
    });

    allOpenQuestions.push(...openQuestions);
  }

  objectRequirements.sort((a, b) => a.priority - b.priority);

  const summary = buildSummary(systems, objectRequirements);

  return {
    reference: session.reference,
    audience,
    generated_at: now.toISOString(),
    object_type_id: session.object_type_id ?? null,
    object_type_name: objectType ? objectType.name : '',
    object_requirements: objectRequirements,
    systems,
    open_questions: mergeOpenQuestions(allOpenQuestions),
    summary,
    suppressed_rules: suppressedCount,
    release_notice:
      audience === 'public' && suppressedCount > 0
        ? 'Ein Teil des Regelwerks befindet sich noch in fachlicher Prüfung und wird extern nicht ausgegeben.'
        : '',
  };
}

/**
 * Kennzahlen für SafetyCheckSummary.
 * @param {object[]} systems
 * @param {object[]} objectRequirements
 * @returns {object}
 */
function buildSummary(systems, objectRequirements) {
  const allRequirements = [...objectRequirements, ...systems.flatMap((system) => system.requirements)];

  /** @type {Record<string, number>} */
  const byKind = {};
  /** @type {Record<number, number>} */
  const byPriority = {};
  const documents = new Set();

  for (const requirement of allRequirements) {
    byKind[requirement.kind] = (byKind[requirement.kind] ?? 0) + 1;
    byPriority[requirement.priority] = (byPriority[requirement.priority] ?? 0) + 1;
    for (const document of requirement.required_documents) documents.add(document);
  }

  const openQuestions = systems.reduce((total, system) => total + system.open_questions.length, 0);

  return {
    system_count: systems.length,
    requirement_count: allRequirements.length,
    by_kind: byKind,
    by_priority: byPriority,
    required_documents: [...documents].sort(),
    open_question_count: openQuestions,
    categories: [...new Set(systems.map((system) => system.category))],
    shortest_interval_months: systems
      .map((system) => system.effective_interval_months)
      .filter((months) => months !== null)
      .reduce((min, months) => (min === null ? months : Math.min(min, months)), null),
  };
}

/**
 * Übergabeobjekt an Safety-Score(R) Core.
 *
 * Der Navigator berechnet bewusst KEINEN Score. Bewertung, Risikoindikatoren
 * und Benchmarking liegen laut Spezifikation Abschnitt 4 im Safety-Score(R)
 * Core. Diese Funktion erzeugt ausschließlich das fachliche Eingangsprofil.
 *
 * @param {object} result Ergebnis aus `evaluateSession`
 * @returns {object}
 */
export function buildScoreInput(result) {
  /** @type {Record<string, {systems: number, requirements: number, open_questions: number}>} */
  const byScoreCategory = {};

  for (const system of result.systems) {
    const key = system.safety_score_category || 'Nicht zugeordnet';
    byScoreCategory[key] ??= { systems: 0, requirements: 0, open_questions: 0 };
    byScoreCategory[key].systems += 1;
    byScoreCategory[key].requirements += system.requirements.length;
    byScoreCategory[key].open_questions += system.open_questions.length;
  }

  return {
    reference: result.reference,
    generated_at: result.generated_at,
    object_type_id: result.object_type_id,
    categories: byScoreCategory,
    totals: {
      systems: result.summary.system_count,
      requirements: result.summary.requirement_count,
      open_questions: result.summary.open_question_count,
    },
  };
}

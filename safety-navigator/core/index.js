/**
 * INGTEC Safety Navigator Core
 *
 * Framework-agnostischer fachlicher Kern des Safety Navigators.
 *
 * Der Kern enthält Anlagenlogik, Anlagentypen, Entscheidungsbäume, Prüflogik,
 * Wartung/Prüfung/Revision, Rechtsgrundlagen, Normen, Regelwerke,
 * Dokumentenbedarf und das Safety-Check-Ergebnis (Zielarchitektur Abschnitt 4).
 *
 * Der Kern kennt weder Odoo noch ein UI-Framework. Er ist damit in allen drei
 * Bereitstellungsvarianten identisch verwendbar:
 *
 *   Variante A  natives Odoo-Modul        – Owl-Komponenten nutzen diesen Kern
 *   Variante B  externe Web-App im iFrame – der Prototyp in ../index.html
 *   Variante C  Hybridarchitektur         – Navigator-API kapselt diesen Kern
 *
 * Bewusst NICHT enthalten: Bewertung, Scores, Risikoindikatoren und
 * Benchmarking. Diese liegen im Safety-Score(R) Core. Die Übergabe erfolgt
 * über `buildScoreInput`.
 */

export { SYSTEM_CATEGORIES, getCategory, listCategories } from './model/system-categories.js';

export {
  OBJECT_TYPES,
  getObjectType,
  getObjectTypeBySlug,
  listObjectTypes,
} from './model/object-types.js';

export {
  SYSTEM_TYPES,
  INTERVAL_TYPES,
  TEST_TYPES,
  getSystemType,
  listSystemTypesByCategory,
  listSystemTypesForObjectType,
  relevanceMatrix,
} from './model/system-types.js';

export {
  QUESTIONS,
  getQuestion,
  listInstanceQuestions,
  listObjectQuestions,
} from './model/questions.js';

export {
  RULES,
  RULE_STATES,
  RULE_PRIORITIES,
  ASSERTION_QUALITY,
  OUTCOME_KINDS,
  OUTCOME_KIND_LABELS,
  ANY_SYSTEM,
  getRule,
  listRulesForSystemType,
  listObjectRules,
} from './model/rules.js';

export {
  TRUTH,
  resolveFact,
  evaluateConditionTree,
  evaluateRule,
  evaluateSession,
  isRuleReleasable,
  buildScoreInput,
} from './engine/rule-engine.js';

export {
  SESSION_STATES,
  SELECTION_STATES,
  CONSENT_STATES,
  STEPS,
  createSession,
  generateReference,
  setObjectType,
  setObjectFact,
  addInstance,
  removeInstance,
  toggleSystem,
  markUnsure,
  updateInstance,
  setInstanceFact,
  answerQuestion,
  addDocument,
  removeDocument,
  setStep,
  progress,
  setContact,
  completeSession,
  serializeSession,
  deserializeSession,
} from './engine/session.js';

export { normalize, searchSystemTypes, noResultFallback } from './engine/search.js';

export {
  BUILDING_VIEWBOX,
  HOTSPOT_GEOMETRY,
  LAYER_ORDER,
  listHotspots,
  getHotspotGeometry,
  renderBuildingSvg,
  hotspotTooltip,
} from './visual/building.js';

/** Version des fachlichen Kerns. */
export const CORE_VERSION = '1.0.0';

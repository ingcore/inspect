/*
 * Kopie aus safety-navigator/core – nicht direkt bearbeiten.
 * Änderungen im Kern vornehmen und anschließend ausführen:
 *   node safety-navigator/scripts/sync-core.mjs
 */
/**
 * INGTEC Safety Navigator – Session und Anwendungszustand
 *
 * Spezifikation Abschnitt 8 (Nutzerstatus), Abschnitt 9 (Session-Modell),
 * Abschnitt 10 (Datenmodell `ingtec.navigator.session`) und Abschnitt 21
 * (`ingtec.system.instance`).
 *
 * Der Check ist zunächst anonym möglich. Personenbezogene Daten werden erst
 * erhoben, wenn der Nutzer speichern, ein Angebot erhalten, Unterlagen
 * übermitteln, eine Beratung vereinbaren oder später fortsetzen möchte.
 */

import { getObjectType } from '../model/object-types.js';
import { getSystemType } from '../model/system-types.js';

/** Sessionstatus laut Abschnitt 10 (`state`). */
export const SESSION_STATES = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CONVERTED: 'converted',
  ABANDONED: 'abandoned',
};

/** Ablaufschritte laut Abschnitt 8. */
export const STEPS = [
  { id: 'object', label: 'Objektart' },
  { id: 'systems', label: 'Anlagen' },
  { id: 'questions', label: 'Angaben' },
  { id: 'documents', label: 'Unterlagen' },
  { id: 'result', label: 'Ergebnis' },
];

/** Einwilligungsstatus laut Abschnitt 10 (`consent_status`). */
export const CONSENT_STATES = {
  NONE: 'none',
  ANONYMOUS: 'anonymous',
  GRANTED: 'granted',
  WITHDRAWN: 'withdrawn',
};

/** Auswahlzustand einer Anlage laut Abschnitt 17. */
export const SELECTION_STATES = {
  HAS: 'has',
  UNSURE: 'unsure',
  NOT_PRESENT: 'not_present',
};

const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Kryptografisch zufällige Zeichen aus einem verwechslungsarmen Alphabet.
 * 256 ist ein Vielfaches von 32, daher ist `byte % 32` gleichverteilt.
 *
 * @param {number} length
 * @returns {string}
 */
function randomToken(length) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let token = '';
  for (const byte of bytes) token += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  return token;
}

/**
 * Erzeugt eine Session-Referenz im Format SN-2026-X8F72P (Abschnitt 9).
 * @param {Date} [now]
 * @returns {string}
 */
export function generateReference(now = new Date()) {
  return `SN-${now.getFullYear()}-${randomToken(6)}`;
}

/**
 * Erzeugt eine neue, anonyme Navigator-Session.
 *
 * @param {object} [options]
 * @param {string} [options.website_id]
 * @param {Date}   [options.now]
 * @returns {object}
 */
export function createSession(options = {}) {
  const now = options.now ?? new Date();
  return {
    reference: generateReference(now),
    state: SESSION_STATES.DRAFT,
    website_id: options.website_id ?? '',
    partner_id: null,
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    object_type_id: null,
    started_at: now.toISOString(),
    completed_at: null,
    lead_id: null,
    quotation_id: null,
    score_id: null,
    consent_status: CONSENT_STATES.ANONYMOUS,

    // Anwendungszustand (Abschnitt 8)
    step: 'object',
    object_facts: {},
    instances: [],
    documents: [],
    view_mode: 'building',
  };
}

/**
 * Setzt die Objektart und übernimmt deren vorbelegte Objektfakten.
 * Bereits beantwortete Fakten bleiben unverändert.
 *
 * @param {object} session
 * @param {string} objectTypeId
 * @returns {object} neue Session
 */
export function setObjectType(session, objectTypeId) {
  const objectType = getObjectType(objectTypeId);
  if (!objectType) throw new Error(`Unbekannte Objektart: ${objectTypeId}`);

  return {
    ...session,
    object_type_id: objectTypeId,
    state: session.state === SESSION_STATES.DRAFT ? SESSION_STATES.IN_PROGRESS : session.state,
    object_facts: { ...objectType.default_facts, ...session.object_facts },
  };
}

/**
 * @param {object} session
 * @param {string} key   Faktenschlüssel ohne Präfix, z. B. 'workplace'
 * @param {any}    value
 * @returns {object}
 */
export function setObjectFact(session, key, value) {
  return { ...session, object_facts: { ...session.object_facts, [key]: value } };
}

/**
 * Fügt eine Anlageninstanz hinzu (Abschnitt 21).
 *
 * Ein Anlagentyp beschreibt die Gattung, die Instanz die konkrete Anlage im
 * Kundenbetrieb. Mehrere Instanzen desselben Typs sind zulässig, etwa für
 * unterschiedliche Standorte.
 *
 * @param {object} session
 * @param {string} systemTypeId
 * @param {object} [facts]
 * @param {string} [selection]
 * @returns {object}
 */
export function addInstance(session, systemTypeId, facts = {}, selection = SELECTION_STATES.HAS) {
  const systemType = getSystemType(systemTypeId);
  if (!systemType) throw new Error(`Unbekannter Anlagentyp: ${systemTypeId}`);

  const instance = {
    id: `${systemTypeId}#${randomToken(4)}`,
    system_type_id: systemTypeId,
    selection,
    facts: { ...facts },
  };

  return { ...session, instances: [...session.instances, instance] };
}

/**
 * Entfernt eine Anlageninstanz.
 * @param {object} session
 * @param {string} instanceId
 * @returns {object}
 */
export function removeInstance(session, instanceId) {
  return { ...session, instances: session.instances.filter((item) => item.id !== instanceId) };
}

/**
 * Schaltet eine Anlage um: nicht erfasst -> erfasst -> entfernt.
 * Entspricht der Interaktion "[Habe ich]" aus Abschnitt 17.
 *
 * @param {object} session
 * @param {string} systemTypeId
 * @returns {object}
 */
export function toggleSystem(session, systemTypeId) {
  const existing = session.instances.find((item) => item.system_type_id === systemTypeId);
  if (existing) return removeInstance(session, existing.id);
  return addInstance(session, systemTypeId);
}

/**
 * Markiert eine Anlage als unsicher ("[Bin nicht sicher]", Abschnitt 17).
 * Unsichere Anlagen werden erfasst, aber im Ergebnis gesondert ausgewiesen.
 *
 * @param {object} session
 * @param {string} systemTypeId
 * @returns {object}
 */
export function markUnsure(session, systemTypeId) {
  const existing = session.instances.find((item) => item.system_type_id === systemTypeId);
  if (existing) {
    return updateInstance(session, existing.id, (instance) => ({
      ...instance,
      selection:
        instance.selection === SELECTION_STATES.UNSURE
          ? SELECTION_STATES.HAS
          : SELECTION_STATES.UNSURE,
    }));
  }
  return addInstance(session, systemTypeId, {}, SELECTION_STATES.UNSURE);
}

/**
 * @param {object} session
 * @param {string} instanceId
 * @param {(instance: object) => object} updater
 * @returns {object}
 */
export function updateInstance(session, instanceId, updater) {
  return {
    ...session,
    instances: session.instances.map((item) => (item.id === instanceId ? updater(item) : item)),
  };
}

/**
 * @param {object} session
 * @param {string} instanceId
 * @param {string} key   Faktenschlüssel ohne Präfix, z. B. 'power_operated'
 * @param {any}    value
 * @returns {object}
 */
export function setInstanceFact(session, instanceId, key, value) {
  return updateInstance(session, instanceId, (instance) => ({
    ...instance,
    facts: { ...instance.facts, [key]: value },
  }));
}

/**
 * Beantwortet eine offene Frage der Rule Engine.
 * Die Frage trägt bereits Scope und Instanzbezug, daher genügt ein Aufruf.
 *
 * @param {object} session
 * @param {object} question Offene Frage aus `evaluateSession`
 * @param {any}    value
 * @returns {object}
 */
export function answerQuestion(session, question, value) {
  const key = question.fact.replace(/^(object|instance)\./, '');
  if (question.scope === 'object') return setObjectFact(session, key, value);
  if (!question.instance_id) throw new Error('Anlagenfrage ohne Instanzbezug');
  return setInstanceFact(session, question.instance_id, key, value);
}

/**
 * Registriert ein Dokument (DocumentUploader).
 * Der Kern speichert nur Metadaten; der Dateitransport ist Sache der
 * jeweiligen Bereitstellungsvariante (Odoo `ir.attachment` bzw. Navigator-API).
 *
 * @param {object} session
 * @param {{name: string, size?: number, mimetype?: string, document_type?: string}} document
 * @returns {object}
 */
export function addDocument(session, document) {
  return {
    ...session,
    documents: [
      ...session.documents,
      {
        id: randomToken(8),
        name: document.name,
        size: document.size ?? 0,
        mimetype: document.mimetype ?? '',
        document_type: document.document_type ?? 'sonstiges',
        uploaded_at: new Date().toISOString(),
      },
    ],
  };
}

/**
 * @param {object} session
 * @param {string} documentId
 * @returns {object}
 */
export function removeDocument(session, documentId) {
  return { ...session, documents: session.documents.filter((item) => item.id !== documentId) };
}

/**
 * @param {object} session
 * @param {string} stepId
 * @returns {object}
 */
export function setStep(session, stepId) {
  if (!STEPS.some((step) => step.id === stepId)) throw new Error(`Unbekannter Schritt: ${stepId}`);
  return { ...session, step: stepId };
}

/**
 * Fortschritt für den ProgressHeader.
 * @param {object} session
 * @returns {{index: number, total: number, percent: number, steps: object[]}}
 */
export function progress(session) {
  const index = Math.max(0, STEPS.findIndex((step) => step.id === session.step));
  return {
    index,
    total: STEPS.length,
    percent: Math.round(((index + 1) / STEPS.length) * 100),
    steps: STEPS.map((step, position) => ({
      ...step,
      done: position < index,
      active: position === index,
    })),
  };
}

/**
 * Übernimmt Kontaktdaten (LeadForm) und dokumentiert die Einwilligung.
 *
 * @param {object} session
 * @param {{company_name?: string, contact_name?: string, email?: string, phone?: string, consent?: boolean}} contact
 * @returns {object}
 */
export function setContact(session, contact) {
  return {
    ...session,
    company_name: contact.company_name ?? session.company_name,
    contact_name: contact.contact_name ?? session.contact_name,
    email: contact.email ?? session.email,
    phone: contact.phone ?? session.phone,
    consent_status: contact.consent ? CONSENT_STATES.GRANTED : session.consent_status,
  };
}

/**
 * Schließt die Session fachlich ab.
 * @param {object} session
 * @param {Date} [now]
 * @returns {object}
 */
export function completeSession(session, now = new Date()) {
  return { ...session, state: SESSION_STATES.COMPLETED, completed_at: now.toISOString() };
}

/**
 * Serialisierung für localStorage bzw. Navigator-API.
 * @param {object} session
 * @returns {string}
 */
export function serializeSession(session) {
  return JSON.stringify({ schema: 1, session });
}

/**
 * Fehlertolerante Deserialisierung. Unbekannte oder beschädigte Daten führen
 * zu `null`, damit der Navigator mit einer frischen Session startet, statt
 * abzustürzen.
 *
 * @param {string|null|undefined} raw
 * @returns {object|null}
 */
export function deserializeSession(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const session = parsed && parsed.schema === 1 ? parsed.session : parsed;
    if (!session || typeof session !== 'object' || !session.reference) return null;
    return {
      ...createSession(),
      ...session,
      object_facts: session.object_facts ?? {},
      instances: Array.isArray(session.instances) ? session.instances : [],
      documents: Array.isArray(session.documents) ? session.documents : [],
    };
  } catch {
    return null;
  }
}

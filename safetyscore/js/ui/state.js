/**
 * Anwendungszustand der Safety-Score-Oberflaeche.
 *
 * Die Speicherung erfolgt fehlertolerant im Browser. Fachlich sind Bewertung,
 * Berechnung und Freigabe getrennt: der Score wird jederzeit als Vorschau
 * berechnet, aber erst nach bestandenem Quality Gate und ausdruecklicher
 * Freigabe durch eine berechtigte Person verwendbar (GOV-001).
 */

import { emptyEvaluation } from "../engine/score-engine.js";
import { auditEvent, AUDIT_TYPES } from "../engine/snapshot.js";
import { releasedProfiles } from "../engine/profiles.js";

const STORAGE_KEY = "ingtec.safetyscore.v1";

export const VIEWS = [
  ["scope", "Bewertungsobjekt", "▦"],
  ["assessment", "Bewertung", "✓"],
  ["result", "Ergebnis", "◉"],
  ["gates", "Gates", "!"],
  ["trace", "Trace", "≡"],
  ["release", "Freigabe & QS", "⛨"],
  ["report", "Bericht", "▤"],
  ["portfolio", "Portfolio", "▩"],
  ["model", "Modellkarte", "ⓘ"],
];

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyScope() {
  return {
    company: "",
    customerNo: "",
    site: "",
    objectId: "",
    buildingArea: "",
    system: "",
    component: "",
    inspectionType: "",
    referenceDate: new Date().toISOString().slice(0, 10),
    periodFrom: "",
    periodTo: "",
    validUntil: "",
    legalBasis: "",
    included: "",
    excluded: "",
    inaccessible: "",
    inspector: "",
    reviewer: "",
    approver: "",
    equipment: "",
  };
}

/** Pflichtangaben des Scopes nach PRD 5.2. */
export const SCOPE_REQUIRED = [
  ["company", "Rechtstraeger"],
  ["site", "Standort"],
  ["objectId", "Objekt-ID"],
  ["system", "Anlage oder System"],
  ["inspectionType", "Pruefart"],
  ["referenceDate", "Bewertungsstichtag"],
  ["legalBasis", "Anwendbare Grundlagen"],
  ["included", "Eingeschlossene Bereiche"],
  ["inspector", "Pruefer"],
];

export function scopeGaps(scope) {
  return SCOPE_REQUIRED.filter(([key]) => !String(scope?.[key] ?? "").trim()).map(([, label]) => label);
}

export function newAssessment(profileId = "T-BMA") {
  return {
    id: uuid(),
    profileId,
    scope: emptyScope(),
    evaluations: {},
    reviewLevel: "entwurf",
    gateEvents: [],
    aggregationWeights: { criticality: "mittel", exposure: "regulaer", redundancy: "teilredundant" },
    released: false,
    releaseInfo: null,
    snapshots: [],
    audit: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function demoAssessment() {
  const assessment = newAssessment("T-BMA");
  assessment.scope = {
    ...emptyScope(),
    company: "Reinbold GmbH",
    customerNo: "406",
    site: "9800 Spittal an der Drau",
    objectId: "BMA-01",
    buildingArea: "Produktionshalle, Brandabschnitt 2",
    system: "Brandmeldeanlage BMA-01",
    component: "Gesamtanlage",
    inspectionType: "Wiederkehrende Pruefung",
    referenceDate: "2026-08-01",
    periodFrom: "2026-08-01",
    periodTo: "2026-08-01",
    validUntil: "2027-08-01",
    legalBasis:
      "Betriebsanlagenbescheid BH Spittal, Auflagen 12-18; TRVB S 123; OENORM EN 54; Herstellervorgaben Wartung",
    included: "Gesamte Brandmeldeanlage inklusive Peripherie und Brandfallsteuerungen",
    excluded: "Sprinkleranlage, Rauch- und Waermeabzug (eigene Profile)",
    inaccessible: "Zwischendecke Buerotrakt Obergeschoss zum Pruefzeitpunkt nicht zugaenglich",
    inspector: "H. Schwinger",
    reviewer: "",
    approver: "",
    equipment: "Pruefgas, Schallpegelmesser, Multimeter",
  };
  assessment.audit.push(
    auditEvent(AUDIT_TYPES.BEWERTUNG_ERSTELLT, {
      actor: "Demodaten",
      reference: assessment.id,
      reason: "Demonstrationsdatensatz der Pilotphase",
    }),
  );
  return assessment;
}

function defaultState() {
  const assessment = demoAssessment();
  return {
    version: 1,
    view: "scope",
    activeId: assessment.id,
    activeModule: null,
    assessments: [assessment],
    actor: "H. Schwinger",
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed?.assessments?.length) return defaultState();
    const known = new Set(releasedProfiles().map((p) => p.id));
    parsed.assessments = parsed.assessments.map((a) => ({
      ...newAssessment(),
      ...a,
      profileId: known.has(a.profileId) ? a.profileId : "T-BMA",
      scope: { ...emptyScope(), ...(a.scope ?? {}) },
    }));
    if (!parsed.assessments.some((a) => a.id === parsed.activeId)) {
      parsed.activeId = parsed.assessments[0].id;
    }
    return parsed;
  } catch (error) {
    console.warn("Gespeicherter Zustand nicht lesbar, Demodaten werden verwendet.", error);
    return defaultState();
  }
}

export const state = load();

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Zustand konnte nicht gespeichert werden.", error);
  }
}

export function notify() {
  persist();
  for (const listener of listeners) listener();
}

export function activeAssessment() {
  return state.assessments.find((a) => a.id === state.activeId) ?? state.assessments[0];
}

export function setView(view) {
  state.view = view;
  notify();
}

export function logAudit(type, payload) {
  const assessment = activeAssessment();
  assessment.audit.unshift(auditEvent(type, { actor: state.actor, ...payload }));
  assessment.updatedAt = new Date().toISOString();
}

/**
 * Eine Kriteriumsbewertung aendern; erzeugt bei Aenderung ein AuditEvent.
 * Mit silent = true wird nur gespeichert, ohne die Oberflaeche neu zu zeichnen
 * (fuer laufende Texteingaben).
 */
export function updateEvaluation(criterionId, patch, { reason = "", silent = false } = {}) {
  const assessment = activeAssessment();
  if (assessment.released) return;
  const before = assessment.evaluations[criterionId] ?? null;
  const next = { ...emptyEvaluation(), ...(before ?? {}), ...patch };
  assessment.evaluations[criterionId] = next;
  logAudit(before ? AUDIT_TYPES.BEWERTUNG_GEAENDERT : AUDIT_TYPES.BEWERTUNG_ERSTELLT, {
    reference: criterionId,
    before: before ? { severity: before.severity, applicability: before.applicability } : null,
    after: { severity: next.severity, applicability: next.applicability },
    reason,
  });
  if (silent) persist();
  else notify();
}

export function updateScope(patch, { silent = false } = {}) {
  const assessment = activeAssessment();
  if (assessment.released) return;
  assessment.scope = { ...assessment.scope, ...patch };
  assessment.updatedAt = new Date().toISOString();
  if (silent) persist();
  else notify();
}

export function updateAssessment(patch) {
  const assessment = activeAssessment();
  Object.assign(assessment, patch);
  assessment.updatedAt = new Date().toISOString();
  notify();
}

export function addAssessment(profileId) {
  const assessment = newAssessment(profileId);
  state.assessments.push(assessment);
  state.activeId = assessment.id;
  state.view = "scope";
  notify();
  return assessment;
}

export function removeAssessment(id) {
  const index = state.assessments.findIndex((a) => a.id === id);
  if (index < 0 || state.assessments.length === 1) return;
  state.assessments.splice(index, 1);
  if (state.activeId === id) state.activeId = state.assessments[0].id;
  notify();
}

/** Korrekturrevision einer freigegebenen Bewertung (GOV-002). */
export function createRevision(id) {
  const source = state.assessments.find((a) => a.id === id);
  if (!source) return null;
  const copy = {
    ...structuredClone({ ...source, audit: [], snapshots: [] }),
    id: uuid(),
    released: false,
    releaseInfo: null,
    reviewLevel: "entwurf",
    revisionOf: source.id,
    revision: (source.revision ?? 1) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    audit: [
      auditEvent(AUDIT_TYPES.KORREKTUR, {
        actor: state.actor,
        reference: source.id,
        reason: "Neue Revision; das Originalergebnis bleibt unveraendert erhalten.",
      }),
    ],
    snapshots: [],
  };
  state.assessments.push(copy);
  state.activeId = copy.id;
  state.view = "assessment";
  notify();
  return copy;
}

export function resetAll() {
  const fresh = defaultState();
  Object.assign(state, fresh);
  notify();
}

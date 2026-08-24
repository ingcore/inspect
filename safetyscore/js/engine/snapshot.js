/**
 * Calculation Snapshot und Audit-Trail (PRD 12.2, Anhang D).
 *
 * Ein Snapshot ist unveraenderbar. Korrekturen erzeugen eine neue Revision
 * (GOV-002); das Original bleibt erhalten.
 */

import { hashObject } from "./hash.js";
import { MODEL_VERSION, ENGINE_VERSION } from "./model.js";

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Reduziert die Bewertungen auf den fuer den Hash relevanten Kern. */
function inputProjection(result) {
  return {
    profile_id: result.profile.id,
    profile_version: result.profile.version,
    model_version: result.modelVersion,
    criteria: result.entries.map((entry) => ({
      criterion_id: entry.criterion.id,
      dimension: entry.criterion.dimension,
      base_weight: entry.criterion.weight,
      applicability: entry.evaluation.applicability,
      severity: entry.scored ? entry.evaluation.severity : null,
      modifiers: {
        F_A: entry.evaluation.modifiers?.F_A ?? null,
        F_E: entry.evaluation.modifiers?.F_E ?? null,
        F_R: entry.evaluation.modifiers?.F_R ?? null,
        F_M: entry.evaluation.modifiers?.F_M ?? null,
      },
      evidence_quality: entry.evaluation.evidenceQuality,
      evidence_actuality: entry.evaluation.evidenceActuality,
      evidence_refs: entry.evaluation.evidenceRefs ?? [],
      measurement: entry.evaluation.measurement ?? null,
      assessment_reason: entry.evaluation.reason ?? "",
      gate_event: entry.evaluation.gate ?? null,
    })),
  };
}

/**
 * Erzeugt den unveraenderbaren Berechnungslauf zu einem Ergebnis.
 *
 * @param {object} result   Rueckgabe von calculateScore()
 * @param {object} meta     { reviewers, calculatedAt, revision, note }
 */
export async function createCalculationRun(result, meta = {}) {
  const scope = result.scope ?? {};
  const scopeHash = await hashObject(scope);
  const input = inputProjection(result);
  const inputHash = await hashObject(input);

  const snapshot = {
    calculation_id: meta.calculationId ?? uuid(),
    calculated_at: meta.calculatedAt ?? new Date().toISOString(),
    score_type: result.scoreType,
    model_version: MODEL_VERSION,
    profile_id: result.profile.id,
    profile_version: result.profile.version,
    scope_hash: scopeHash,
    input_hash: inputHash,
    criteria: input.criteria,
    dimension_weights_bp: Object.fromEntries(result.dimensions.map((d) => [d.code, d.weightBp])),
    dimension_values_bp: Object.fromEntries(result.dimensions.map((d) => [d.code, Number(d.valueBp)])),
    gate_events: result.gates.active.map((gate) => ({
      code: gate.code,
      level: gate.level,
      criterion_id: gate.criterionId,
      origin: gate.origin,
      effect: gate.effect,
      floor_bp: gate.floorBp,
      status: gate.status,
      reason: gate.reason,
    })),
    compliance_result: {
      status: result.compliance.code,
      label: result.compliance.label,
      findings: result.compliance.findings,
      sources: result.compliance.sources.map((s) => s.code),
    },
    confidence_result: {
      A_bp: Number(result.confidence.A),
      Q_bp: Number(result.confidence.Q),
      Z_bp: Number(result.confidence.Z),
      R_bp: Number(result.confidence.R),
      value_bp: Number(result.confidence.valueBp),
      class: result.confidence.klass,
    },
    coverage_bp: result.coverage.coverageBp === null ? null : Number(result.coverage.coverageBp),
    raw_score_bp: Number(result.rawScoreBp),
    final_score_bp: result.nb ? null : Number(result.finalScoreBp),
    class: result.class,
    reviewers: meta.reviewers ?? { pruefer: null, reviewer: null, freigabe: null },
    revision: meta.revision ?? 1,
    engine_version: ENGINE_VERSION,
    note: meta.note ?? null,
  };

  snapshot.signature_hash = await hashObject(snapshot);
  return snapshot;
}

/** Prueft, ob ein Snapshot unveraendert ist (Integritaetspruefung, R-10). */
export async function verifySnapshot(snapshot) {
  const { signature_hash: signature, ...rest } = snapshot;
  const recomputed = await hashObject(rest);
  return { valid: recomputed === signature, expected: signature, actual: recomputed };
}

/** Anhang D - Mindest-Audit-Trail. Append-only. */
export function auditEvent(type, payload = {}) {
  return {
    id: uuid(),
    at: new Date().toISOString(),
    type,
    actor: payload.actor ?? "unbekannt",
    device: payload.device ?? (typeof navigator === "undefined" ? "server" : navigator.platform ?? "browser"),
    reference: payload.reference ?? null,
    before: payload.before ?? null,
    after: payload.after ?? null,
    reason: payload.reason ?? null,
  };
}

export const AUDIT_TYPES = {
  BEWERTUNG_ERSTELLT: "Bewertung erstellt",
  BEWERTUNG_GEAENDERT: "Bewertung geaendert",
  GATE_AUSGELOEST: "Gate ausgeloest",
  GATE_GESCHLOSSEN: "Gate geschlossen",
  BERECHNUNG: "Berechnung ausgefuehrt",
  FACHREVIEW: "Fachreview",
  FREIGABE: "Freigabe",
  KORREKTUR: "Korrektur",
  MODELL_GEAENDERT: "Modell geaendert",
  EXPORT: "Export / Portal",
};

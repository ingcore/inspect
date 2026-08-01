/**
 * Safety-Score Berechnungsengine, Modellversion 1.0.0.
 *
 * Deterministische Umsetzung des Engine-Workflows nach PRD 12.3:
 *   1. Profil- und Modellversion laden und validieren
 *   2. Scope, Anwendbarkeit und Pflichtfelder pruefen
 *   3. nicht anwendbare Kriterien ausschliessen, nicht pruefbare kennzeichnen
 *   4. Kriteriumsbeitraege mit zugelassenen Modifikatoren berechnen (0-1)
 *   5. Dimensionswerte bilden
 *   6. Rohscore aus den Dimensionsgewichten bilden
 *   7. Compliance und Konfidenz getrennt berechnen
 *   8. Gates auswerten, Floor oder NB anwenden
 *   9. Klasse aus dem ungerundeten Finalwert bestimmen
 *  10. Trace und Snapshot erzeugen
 */

import { MICRO, HP, PCT, divRound, clamp, hpToBp, formatScore } from "./fixed.js";
import {
  MODEL_VERSION,
  ENGINE_VERSION,
  DIMENSIONS,
  DIMENSION_CODES,
  MAX_SEVERITY,
  MODIFIER_CODES,
  MODIFIERS,
  MODIFIER_MATRIX,
  GATE_BY_CODE,
  COMPLIANCE_STATUS,
  SOURCE_TYPES,
  CONFIDENCE_WEIGHTS,
  EVIDENCE_QUALITY,
  EVIDENCE_ACTUALITY,
  REVIEW_QUALITY,
  COVERAGE_RULES,
  PROTECTION_CRITICAL_WEIGHT,
  CLASS_NB,
  classifyHp,
  classByCode,
  worseClass,
  confidenceClass,
  confidenceAtLeast,
} from "./model.js";
import { getProfile, validateProfile } from "./profiles.js";

export const APPLICABILITY = {
  anwendbar: "anwendbar",
  nicht_anwendbar: "nicht_anwendbar",
  nicht_pruefbar: "nicht_pruefbar",
};

/** Leere Bewertung eines Kriteriums. */
export function emptyEvaluation() {
  return {
    applicability: APPLICABILITY.anwendbar,
    severity: null,
    modifiers: { F_A: null, F_E: null, F_R: null, F_M: null },
    evidenceQuality: "keine",
    evidenceActuality: "unbekannt",
    evidenceRefs: [],
    measurement: null,
    reason: "",
    gate: null,
    reviewStatus: "entwurf",
  };
}

function modifierValue(dimension, code, key) {
  const allowed = MODIFIER_MATRIX[dimension]?.[code] === true;
  const definition = MODIFIERS[code];
  if (!allowed) return { applied: false, value: 100n, key: null, reason: "im Profil fuer diese Dimension nicht zugelassen" };
  const option = definition.options.find((o) => o.key === key) ?? definition.options.find((o) => o.key === definition.neutral);
  return { applied: true, value: BigInt(option.value), key: option.key, label: option.label };
}

/**
 * PRD 7.6 - Risikodefizitwert eines Kriteriums.
 * r_i = min(1; (s_i / 4) * F_A * F_E * F_R * F_M), Ergebnis in MICRO-Einheiten.
 */
export function criterionRisk(dimension, severity, modifiers = {}) {
  const s = BigInt(clamp(Number(severity) || 0, 0, MAX_SEVERITY));
  const qMicro = (s * MICRO) / BigInt(MAX_SEVERITY);
  const factors = {};
  let product = qMicro;
  let divisor = 1n;
  for (const code of MODIFIER_CODES) {
    const factor = modifierValue(dimension, code, modifiers?.[code]);
    factors[code] = factor;
    product *= factor.value;
    divisor *= PCT;
  }
  const rMicro = clamp(divRound(product, divisor), 0n, MICRO);
  return { rMicro, qMicro, factors };
}

/**
 * PRD 7.8 - Rohscore aus Dimensionsgewichten und Dimensionswerten.
 * S_raw = sum(alpha_d * D_d) mit sum(alpha_d) = 1,00 (10 000 Basispunkte).
 * Zwischenwerte werden nicht fuer Folgeoperationen gerundet.
 *
 * @param {object} weightsBp   Dimensionsgewichte in Basispunkten
 * @param {object} valuesHp    Dimensionswerte in hochpraeziser Einheit (bp * 1e6)
 */
export function rawScoreHp(weightsBp, valuesHp) {
  let sum = 0n;
  let weightSum = 0n;
  for (const code of DIMENSION_CODES) {
    const weight = BigInt(weightsBp[code] ?? 0);
    weightSum += weight;
    sum += weight * BigInt(valuesHp[code] ?? 0n);
  }
  if (weightSum !== 10000n) {
    throw new Error(`Dimensionsgewichte ergeben ${weightSum} statt 10.000 Basispunkte (CALC-003).`);
  }
  return divRound(sum, 10000n);
}

function isScored(evaluation) {
  return (
    evaluation.applicability === APPLICABILITY.anwendbar &&
    evaluation.severity !== null &&
    evaluation.severity !== undefined
  );
}

function isApplicable(evaluation) {
  return evaluation.applicability !== APPLICABILITY.nicht_anwendbar;
}

function evidenceQualityValue(key) {
  return EVIDENCE_QUALITY[key]?.value ?? 0;
}

function evidenceActualityValue(key) {
  return EVIDENCE_ACTUALITY[key]?.value ?? 0;
}

/** Automatische und manuelle Gate-Ereignisse sammeln (PRD 8.1, M-05). */
function collectGates(profile, entries, manualGates, coverageBp) {
  const active = [];
  const add = (event) => {
    if (event.status === "closed") return;
    active.push(event);
  };

  for (const entry of entries) {
    const { criterion, evaluation } = entry;
    // Fachlich ausgeloestes Gate der Bewertung
    if (evaluation.gate?.code && GATE_BY_CODE[evaluation.gate.code]) {
      add({
        code: evaluation.gate.code,
        level: evaluation.gate.level ?? "standard",
        criterionId: criterion.id,
        origin: "bewertung",
        reason: evaluation.reason || GATE_BY_CODE[evaluation.gate.code].trigger,
        status: "open",
      });
    }
    // Profilregel des Kriteriums
    const rule = criterion.gateRule;
    if (rule && entry.scored && evaluation.severity >= rule.fromSeverity) {
      const already = active.some((g) => g.criterionId === criterion.id && g.code === rule.code);
      if (!already) {
        add({
          code: rule.code,
          level: rule.level,
          criterionId: criterion.id,
          origin: "profilregel",
          reason: `Schweregrad ${evaluation.severity} bei ${criterion.id}`,
          status: "open",
        });
      }
    }
    // KO-06: schutzkritisches Pflichtkriterium ohne Bewertung (PRD 9.3)
    const protectionCritical = criterion.mandatory && criterion.weight >= PROTECTION_CRITICAL_WEIGHT;
    if (protectionCritical && isApplicable(evaluation) && !entry.scored) {
      add({
        code: "KO-06",
        level: "standard",
        criterionId: criterion.id,
        origin: "abdeckungsregel",
        reason:
          evaluation.applicability === APPLICABILITY.nicht_pruefbar
            ? `Schutzkritisches Pflichtkriterium ${criterion.id} ist nicht pruefbar.`
            : `Schutzkritisches Pflichtkriterium ${criterion.id} ist nicht bewertet.`,
        status: "open",
      });
    }
  }

  for (const manual of manualGates ?? []) {
    if (!GATE_BY_CODE[manual.code]) continue;
    add({
      code: manual.code,
      level: manual.level ?? "standard",
      criterionId: manual.criterionId ?? null,
      origin: "manuell",
      reason: manual.reason ?? GATE_BY_CODE[manual.code].trigger,
      status: manual.status ?? "open",
      evidence: manual.evidence ?? null,
    });
  }

  if (coverageBp !== null && coverageBp < BigInt(COVERAGE_RULES.nbBelowBp)) {
    add({
      code: "KO-06",
      level: "standard",
      criterionId: null,
      origin: "abdeckungsregel",
      reason: `Gewichtete Pruefabdeckung ${formatScore(coverageBp)} % liegt unter der Mindestabdeckung von 70 %.`,
      status: "open",
    });
  }

  return active.map((event) => {
    const definition = GATE_BY_CODE[event.code];
    const level = definition.levels.find((l) => l.key === event.level) ?? definition.levels[0];
    return {
      ...event,
      level: level.key,
      levelLabel: level.label,
      effect: definition.effect,
      floorBp: level.floorBp,
      minClass: level.minClass,
      trigger: definition.trigger,
      requirement: definition.requirement,
      closing: definition.closing,
    };
  });
}

/** PRD 9.1 - Compliance-Status getrennt vom Punktwert. */
function evaluateCompliance(profile, entries, coverageBp) {
  if (profile.complianceStatement === false) {
    return { ...COMPLIANCE_STATUS.NA, findings: [], sources: [] };
  }
  const binding = entries.filter(
    (e) => SOURCE_TYPES[e.criterion.sourceType]?.binding && isApplicable(e.evaluation),
  );
  if (binding.length === 0) {
    return { ...COMPLIANCE_STATUS.NA, findings: [], sources: [] };
  }

  const findings = [];
  let unresolvedCritical = false;
  let unresolved = false;
  let nonconform = false;

  for (const entry of binding) {
    const { criterion, evaluation } = entry;
    if (!entry.scored) {
      unresolved = true;
      if (criterion.mandatory && criterion.weight >= PROTECTION_CRITICAL_WEIGHT) unresolvedCritical = true;
      findings.push({
        criterionId: criterion.id,
        sourceType: criterion.sourceType,
        sourceRef: criterion.sourceRef,
        status: "offen",
        text: `${criterion.id}: verpflichtende Anforderung ist nicht beurteilt (${evaluation.applicability}).`,
      });
      continue;
    }
    if (evaluation.severity >= 1) {
      nonconform = true;
      findings.push({
        criterionId: criterion.id,
        sourceType: criterion.sourceType,
        sourceRef: criterion.sourceRef,
        status: "nicht erfuellt",
        severity: evaluation.severity,
        text: `${criterion.id}: verpflichtende Anforderung nicht erfuellt (Schweregrad ${evaluation.severity}).`,
      });
    }
  }

  const sources = [...new Set(binding.map((e) => e.criterion.sourceType))].map((key) => SOURCE_TYPES[key]);
  let status = COMPLIANCE_STATUS.CONFORM;
  if (unresolvedCritical) status = COMPLIANCE_STATUS.NB;
  else if (nonconform) status = COMPLIANCE_STATUS.NONCONFORM;
  else if (unresolved || (coverageBp !== null && coverageBp < BigInt(COVERAGE_RULES.releaseMinCoverageBp))) {
    status = COMPLIANCE_STATUS.PARTIAL;
  }
  return { ...status, findings, sources };
}

/** PRD 9.2 - Konfidenz K = 0,40 A + 0,30 Q + 0,15 Z + 0,15 R, Werte in Basispunkten. */
function evaluateConfidence(entries, coverageBp, reviewLevel) {
  const scored = entries.filter((e) => e.scored);
  const weightSum = scored.reduce((acc, e) => acc + BigInt(e.criterion.weight), 0n);

  let qBp = 0n;
  let zBp = 0n;
  if (weightSum > 0n) {
    let qNum = 0n;
    let zNum = 0n;
    for (const entry of scored) {
      const w = BigInt(entry.criterion.weight);
      qNum += w * BigInt(evidenceQualityValue(entry.evaluation.evidenceQuality)) * 100n;
      zNum += w * BigInt(evidenceActualityValue(entry.evaluation.evidenceActuality)) * 100n;
    }
    qBp = divRound(qNum, weightSum);
    zBp = divRound(zNum, weightSum);
  }
  const aBp = coverageBp ?? 0n;
  const rBp = BigInt(REVIEW_QUALITY[reviewLevel]?.value ?? REVIEW_QUALITY.entwurf.value) * 100n;

  const kBp = divRound(
    aBp * BigInt(CONFIDENCE_WEIGHTS.A) +
      qBp * BigInt(CONFIDENCE_WEIGHTS.Q) +
      zBp * BigInt(CONFIDENCE_WEIGHTS.Z) +
      rBp * BigInt(CONFIDENCE_WEIGHTS.R),
    100n,
  );

  let klass = confidenceClass(kBp);
  const notes = [];
  if (
    coverageBp !== null &&
    coverageBp < BigInt(COVERAGE_RULES.provisionalBelowBp) &&
    coverageBp >= BigInt(COVERAGE_RULES.nbBelowBp)
  ) {
    notes.push(
      "Abdeckung zwischen 70 % und 85 %: nur vorlaeufiger interner Score, Konfidenz maximal K2 (PRD 9.3).",
    );
    if (confidenceAtLeast(klass.code, "K3")) {
      klass = confidenceClass(BigInt(COVERAGE_RULES.nbBelowBp)); // auf K2 begrenzen
    }
  }
  return {
    A: aBp,
    Q: qBp,
    Z: zBp,
    R: rBp,
    valueBp: kBp,
    klass: klass.code,
    klassLabel: klass.label,
    usage: klass.usage,
    notes,
  };
}

/**
 * Berechnet einen vollstaendigen Safety-Score.
 *
 * @param {object} input
 * @param {string} input.profileId       Freigegebenes Pruefprofil
 * @param {object} input.evaluations     Bewertungen je criterion_id
 * @param {object} [input.scope]         Scope-Pflichtangaben (PRD 5.2)
 * @param {string} [input.reviewLevel]   entwurf | selbstpruefung | vier_augen | senior_freigabe
 * @param {Array}  [input.gateEvents]    manuell erfasste Gate-Ereignisse
 */
export function calculateScore(input) {
  const profile = input.profile ?? getProfile(input.profileId);
  const profileCheck = validateProfile(profile);
  if (!profileCheck.valid) {
    throw new Error(`Profil ${profile.id} ist nicht berechenbar: ${profileCheck.errors.join(" | ")}`);
  }

  const evaluations = input.evaluations ?? {};
  const entries = profile.criteria.map((criterion) => {
    const evaluation = { ...emptyEvaluation(), ...(evaluations[criterion.id] ?? {}) };
    const scored = isScored(evaluation);
    const risk = scored ? criterionRisk(criterion.dimension, evaluation.severity, evaluation.modifiers) : null;
    return { criterion, evaluation, scored, risk };
  });

  // --- Abdeckung (PRD 9.2 A, 9.3) -----------------------------------------
  let applicableWeight = 0n;
  let coveredWeight = 0n;
  const coverageGaps = [];
  for (const entry of entries) {
    if (!isApplicable(entry.evaluation)) continue;
    const w = BigInt(entry.criterion.weight);
    applicableWeight += w;
    const hasEvidence = entry.evaluation.evidenceQuality && entry.evaluation.evidenceQuality !== "keine";
    if (entry.scored && hasEvidence) {
      coveredWeight += w;
    } else {
      coverageGaps.push({
        criterionId: entry.criterion.id,
        dimension: entry.criterion.dimension,
        weight: entry.criterion.weight,
        mandatory: !!entry.criterion.mandatory,
        reason: !entry.scored
          ? entry.evaluation.applicability === APPLICABILITY.nicht_pruefbar
            ? "nicht pruefbar"
            : "nicht bewertet"
          : "ohne ausreichende Evidenz",
      });
    }
  }
  const coverageBp = applicableWeight > 0n ? divRound(coveredWeight * 10000n, applicableWeight) : null;

  // --- Dimensionswerte (PRD 7.7) ------------------------------------------
  const dimensions = DIMENSIONS.map((dimension) => {
    const dimensionEntries = entries.filter((e) => e.criterion.dimension === dimension.code);
    const scoredEntries = dimensionEntries.filter((e) => e.scored);
    let weightedSum = 0n;
    let weightSum = 0n;
    for (const entry of scoredEntries) {
      const w = BigInt(entry.criterion.weight);
      weightedSum += w * entry.risk.rMicro;
      weightSum += w;
    }
    const valueHp = weightSum > 0n ? divRound(weightedSum * 10000n, weightSum) : 0n;
    return {
      code: dimension.code,
      label: dimension.label,
      name: dimension.name,
      weightBp: profile.weightsBp[dimension.code] ?? 0,
      valueHp,
      valueBp: hpToBp(valueHp),
      populated: weightSum > 0n,
      criteriaCount: dimensionEntries.length,
      scoredCount: scoredEntries.length,
      weightSum: Number(weightSum),
      drivers: scoredEntries
        .filter((e) => e.evaluation.severity > 0)
        .map((e) => ({
          criterionId: e.criterion.id,
          text: e.criterion.text,
          severity: e.evaluation.severity,
          weight: e.criterion.weight,
          contributionMicro: BigInt(e.criterion.weight) * e.risk.rMicro,
          rMicro: e.risk.rMicro,
        }))
        .sort((a, b) => Number(b.contributionMicro - a.contributionMicro)),
    };
  });

  // --- Rohscore (PRD 7.8) --------------------------------------------------
  const rawHp = rawScoreHp(
    profile.weightsBp,
    Object.fromEntries(dimensions.map((d) => [d.code, d.valueHp])),
  );
  const rawBp = hpToBp(rawHp);

  const unpopulated = dimensions.filter((d) => d.weightBp > 0 && !d.populated);

  // --- Gates (PRD 8.1 / 8.2) ----------------------------------------------
  const gates = collectGates(profile, entries, input.gateEvents, coverageBp);
  const nbGate = gates.find((g) => g.effect === "nb");
  const releaseLock = gates.find((g) => g.effect === "release_lock");
  const floors = gates.filter((g) => g.effect === "floor");
  const highestFloorBp = floors.reduce((acc, g) => (g.floorBp > acc ? g.floorBp : acc), 0);
  const floorGate = floors.find((g) => g.floorBp === highestFloorBp) ?? null;

  const nb = Boolean(nbGate);
  const finalHp = nb ? null : rawHp > BigInt(highestFloorBp) * HP ? rawHp : BigInt(highestFloorBp) * HP;
  const finalBp = nb ? null : hpToBp(finalHp);

  let klass = CLASS_NB;
  if (!nb) {
    // Klassenbestimmung mit dem ungerundeten Finalwert (CALC-008); zusaetzlich
    // wirkt die Mindestklasse aktiver Gates (PRD 8.1).
    const exact = classifyHp(finalHp);
    const gateMinClass = floors.reduce((acc, g) => worseClass(acc, g.minClass), null);
    klass = classByCode(worseClass(exact.code, gateMinClass) ?? exact.code);
  }

  // --- Compliance und Konfidenz (getrennte Achsen, PRD 9) ------------------
  const compliance = evaluateCompliance(profile, entries, coverageBp);
  const confidence = evaluateConfidence(entries, coverageBp, input.reviewLevel ?? "entwurf");

  // --- Freigabefaehigkeit (PRD 9.3, GOV-001, GOV-005) ---------------------
  const blockers = [];
  if (nb) blockers.push(`Ergebnis ist NB: ${nbGate.reason}`);
  if (releaseLock) blockers.push(`KO-08 aktiv: ${releaseLock.reason} - keine externe Veroeffentlichung.`);
  if (coverageBp !== null && coverageBp < BigInt(COVERAGE_RULES.releaseMinCoverageBp)) {
    blockers.push(
      `Gewichtete Abdeckung ${formatScore(coverageBp)} % unter der Freigabeschwelle von 85,0 %.`,
    );
  }
  if (!confidenceAtLeast(confidence.klass, COVERAGE_RULES.releaseMinConfidence)) {
    blockers.push(`Konfidenz ${confidence.klass} unter der Freigabeschwelle ${COVERAGE_RULES.releaseMinConfidence}.`);
  }
  for (const dimension of unpopulated) {
    blockers.push(
      `Dimension ${dimension.code} ist mit ${(dimension.weightBp / 100).toFixed(0)} % gewichtet, aber unbewertet. ` +
        "Ohne freigegebene Alternativgewichtung ist keine Freigabe zulaessig (PRD 7.7).",
    );
  }
  const trace = buildTrace(profile, entries, dimensions, {
    rawHp,
    finalHp,
    highestFloorBp,
    floorGate,
    nb,
  });

  return {
    modelVersion: MODEL_VERSION,
    engineVersion: ENGINE_VERSION,
    profile: { id: profile.id, version: profile.version, field: profile.field, area: profile.area },
    scoreType: profile.scoreType,
    scope: input.scope ?? null,
    calculatedAt: input.calculatedAt ?? null,
    dimensions,
    rawScoreHp: rawHp,
    rawScoreBp: rawBp,
    finalScoreHp: finalHp,
    finalScoreBp: finalBp,
    display: nb ? "NB" : formatScore(finalBp),
    nb,
    class: klass.code,
    classLabel: klass.label,
    classConsequence: klass.consequence,
    gates: {
      active: gates,
      appliedFloorBp: highestFloorBp,
      floorGate,
      nbGate: nbGate ?? null,
      releaseLock: releaseLock ?? null,
    },
    compliance,
    confidence,
    coverage: {
      applicableWeight: Number(applicableWeight),
      coveredWeight: Number(coveredWeight),
      coverageBp,
      gaps: coverageGaps,
      provisional:
        coverageBp !== null &&
        coverageBp < BigInt(COVERAGE_RULES.provisionalBelowBp) &&
        coverageBp >= BigInt(COVERAGE_RULES.nbBelowBp),
    },
    release: { eligible: blockers.length === 0, blockers },
    entries,
    trace,
  };
}

/** PRD 12.3 Schritt 10 / CALC-009 - vollstaendiger Berechnungstrace. */
function buildTrace(profile, entries, dimensions, totals) {
  const criteria = entries.map((entry) => {
    const { criterion, evaluation, risk } = entry;
    return {
      criterionId: criterion.id,
      module: criterion.module,
      dimension: criterion.dimension,
      weight: criterion.weight,
      mandatory: !!criterion.mandatory,
      sourceType: criterion.sourceType,
      sourceRef: criterion.sourceRef,
      applicability: evaluation.applicability,
      severity: entry.scored ? evaluation.severity : null,
      scored: entry.scored,
      qMicro: risk ? risk.qMicro : null,
      factors: risk
        ? Object.fromEntries(
            MODIFIER_CODES.map((code) => [
              code,
              {
                applied: risk.factors[code].applied,
                value: Number(risk.factors[code].value) / 100,
                key: risk.factors[code].key,
                label: risk.factors[code].label ?? risk.factors[code].reason,
              },
            ]),
          )
        : null,
      rMicro: risk ? risk.rMicro : null,
      contributionMicro: risk ? BigInt(criterion.weight) * risk.rMicro : null,
      evidenceQuality: evaluation.evidenceQuality,
      evidenceActuality: evaluation.evidenceActuality,
      evidenceRefs: evaluation.evidenceRefs ?? [],
      reason: evaluation.reason ?? "",
    };
  });

  return {
    formula: {
      criterion: "r_i = min(1; (s_i / 4) * F_A * F_E * F_R * F_M)",
      dimension: "D_d = 100 * [sum(w_i * r_i) / sum(w_i)]",
      raw: "S_raw = sum(alpha_d * D_d), sum(alpha_d) = 1,00",
      final: "S_final = max(S_raw; hoechster aktiver Gate-Floor)",
    },
    profile: { id: profile.id, version: profile.version },
    criteria,
    dimensions: dimensions.map((d) => ({
      code: d.code,
      weightBp: d.weightBp,
      weightSum: d.weightSum,
      valueHp: d.valueHp,
      valueBp: d.valueBp,
      populated: d.populated,
    })),
    rawScoreHp: totals.rawHp,
    highestFloorBp: totals.highestFloorBp,
    floorGate: totals.floorGate ? totals.floorGate.code : null,
    finalScoreHp: totals.finalHp,
    nb: totals.nb,
  };
}

/**
 * PRD 10.3 - Trend zweier Ergebnisse. Nur bei kompatiblem Scope, gleicher
 * Score-Art, gleicher Major-Version und gleichem Profil zulaessig (CALC-011).
 */
export function trend(current, previous) {
  const majorOf = (v) => String(v ?? "").split(".")[0];
  const compatible =
    !!current &&
    !!previous &&
    current.scoreType === previous.scoreType &&
    current.profile.id === previous.profile.id &&
    majorOf(current.modelVersion) === majorOf(previous.modelVersion) &&
    majorOf(current.profile.version) === majorOf(previous.profile.version) &&
    (current.scope?.objectId ?? null) === (previous.scope?.objectId ?? null);

  if (!compatible) {
    return {
      comparable: false,
      note:
        "Vergleich nicht zulaessig: Scope, Score-Art, Profil oder Major-Version stimmen nicht ueberein (PRD 10.3, CALC-011).",
    };
  }
  if (current.nb || previous.nb) {
    return { comparable: false, note: "Mindestens ein Ergebnis ist NB; ein Delta wird nicht ausgewiesen." };
  }
  const deltaBp = current.finalScoreBp - previous.finalScoreBp;
  return {
    comparable: true,
    deltaBp,
    direction: deltaBp < 0n ? "Verbesserung" : deltaBp > 0n ? "Verschlechterung" : "unveraendert",
    fromClass: previous.class,
    toClass: current.class,
  };
}

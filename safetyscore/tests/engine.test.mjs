/**
 * Validierungsstufe V0 (logische Validierung) und V1 (Golden Masters)
 * gemaess PRD 16.1 fuer die Safety-Score-Engine 1.0.0.
 *
 * Ausfuehrung:  npm run test:safety-score
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  PROFILES,
  PROFILES_BY_ID,
  getProfile,
  validateProfile,
  releasedProfiles,
} from "../js/engine/profiles.js";
import {
  calculateScore,
  criterionRisk,
  rawScoreHp,
  emptyEvaluation,
  trend,
  APPLICABILITY,
} from "../js/engine/score-engine.js";
import { aggregate } from "../js/engine/aggregate.js";
import { createCalculationRun, verifySnapshot } from "../js/engine/snapshot.js";
import { classifyHp, DIMENSION_CODES, COVERAGE_RULES } from "../js/engine/model.js";
import { formatScore, HP } from "../js/engine/fixed.js";

const BMA = getProfile("T-BMA");

/** Bewertet alle Kriterien eines Profils einheitlich. */
function assessAll(profile, options = {}) {
  const {
    severity = 0,
    quality = "primaer",
    actuality = "aktuell",
    modifiers = {},
    skip = [],
    overrides = {},
  } = options;
  const evaluations = {};
  for (const criterion of profile.criteria) {
    if (skip.includes(criterion.id)) continue;
    evaluations[criterion.id] = {
      ...emptyEvaluation(),
      severity,
      modifiers: { F_A: null, F_E: null, F_R: null, F_M: null, ...modifiers },
      evidenceQuality: quality,
      evidenceActuality: actuality,
      ...(overrides[criterion.id] ?? {}),
    };
  }
  for (const [id, override] of Object.entries(overrides)) {
    if (!evaluations[id] && !skip.includes(id)) {
      evaluations[id] = { ...emptyEvaluation(), ...override };
    }
  }
  return evaluations;
}

function run(profile, options = {}, extra = {}) {
  return calculateScore({
    profileId: profile.id,
    evaluations: assessAll(profile, options),
    reviewLevel: "senior_freigabe",
    scope: { objectId: "BMA-01", site: "Spittal" },
    ...extra,
  });
}

// ---------------------------------------------------------------- Profile

test("CALC-003: jedes Profil ergibt exakt 10.000 Basispunkte", () => {
  for (const profile of PROFILES) {
    const sum = DIMENSION_CODES.reduce((acc, code) => acc + profile.weightsBp[code], 0);
    assert.equal(sum, 10000, `${profile.id} ergibt ${sum} Basispunkte`);
  }
});

test("PROF-002: freigegebene Profile bestehen die Schemavalidierung", () => {
  for (const profile of releasedProfiles()) {
    const check = validateProfile(profile);
    assert.ok(check.valid, `${profile.id}: ${check.errors.join(" | ")}`);
  }
});

test("CALC-004: jedes Kriterium hat genau eine primaere Dimension und eine eindeutige ID", () => {
  const seen = new Set();
  for (const profile of releasedProfiles()) {
    for (const criterion of profile.criteria) {
      assert.ok(DIMENSION_CODES.includes(criterion.dimension), `${criterion.id}: unbekannte Dimension`);
      assert.ok(!seen.has(criterion.id), `Doppelte Kriteriums-ID ${criterion.id}`);
      seen.add(criterion.id);
    }
  }
});

test("ungueltiges Profil kann nicht berechnet werden", () => {
  const broken = { ...BMA, id: "T-BROKEN", weightsBp: { ...BMA.weightsBp, LRC: 1600 } };
  assert.throws(() => calculateScore({ profile: broken, evaluations: {} }), /10\.000 Basispunkte/);
});

// ------------------------------------------------- Anhang B - Rechenbeispiel

test("Anhang B: Pruefpunktformel r = min(1; q * F_A * F_E * F_R * F_M)", () => {
  const { rMicro, qMicro } = criterionRisk("TPF", 3, {
    F_A: "erheblich",
    F_E: "regulaer",
    F_R: "wiederholt",
    F_M: "keine",
  });
  assert.equal(qMicro, 750_000n, "q = 3/4 = 0,75");
  assert.equal(rMicro, 900_000n, "r = 0,75 * 1,20 = 0,90");
  // Gewichteter Beitrag bei Kontrollgewicht 5 = 4,50
  assert.equal(5n * rMicro, 4_500_000n);
});

test("Anhang B: r wird auf 1,0 begrenzt", () => {
  const { rMicro } = criterionRisk("IPH", 4, { F_A: "erheblich", F_E: "hoch", F_R: "rueckfall" });
  assert.equal(rMicro, 1_000_000n);
});

test("Anhang B: nicht zugelassene Modifikatoren wirken mit 1,00", () => {
  // LRC laesst F_E und F_M nicht zu (PRD 7.5).
  const mit = criterionRisk("LRC", 2, { F_E: "hoch", F_M: "wirksam" });
  const ohne = criterionRisk("LRC", 2, {});
  assert.equal(mit.rMicro, ohne.rMicro);
  assert.equal(mit.factors.F_E.applied, false);
  assert.equal(mit.factors.F_M.applied, false);
  assert.equal(mit.factors.F_A.applied, true);
});

test("Anhang B: S_raw aus den BMA-Dimensionswerten ergibt 27,68 und Klasse C", () => {
  const values = { LRC: 1800, TPF: 3680, IPH: 2800, ORG: 1000, EVD: 1500, MEA: 3000 };
  const valuesHp = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, BigInt(v) * HP]));
  const raw = rawScoreHp(BMA.weightsBp, valuesHp);
  assert.equal(raw, 2768n * HP, "S_raw = 27,68");
  assert.equal(formatScore(raw / HP), "27,7");
  assert.equal(classifyHp(raw).code, "C");
});

// ------------------------------------------------------------ Golden Masters

test("GM-01: vollstaendig erfuellte BMA-Pruefung ergibt 0,0 / Klasse A / K4 / konform", () => {
  const result = run(BMA, { severity: 0 });
  assert.equal(result.display, "0,0");
  assert.equal(result.class, "A");
  assert.equal(result.compliance.code, "CONFORM");
  assert.equal(result.confidence.klass, "K4");
  assert.equal(result.coverage.coverageBp, 10000n);
  assert.equal(result.gates.active.length, 0);
  assert.ok(result.release.eligible, result.release.blockers.join(" | "));
});

test("GM-02: durchgehend kritischer Zustand ist NB, weil die Evidenz nicht verifizierbar ist", () => {
  // Schweregrad 4 in EVD bedeutet "kritischer Sachverhalt nicht verifizierbar"
  // und loest KO-06 aus. Ein Zahlenwert waere in diesem Fall scheinpraezise.
  const result = run(BMA, {
    severity: 4,
    modifiers: { F_A: "erheblich", F_E: "hoch", F_R: "rueckfall", F_M: "keine" },
  });
  assert.equal(result.nb, true);
  assert.equal(result.class, "NB");
  assert.equal(result.compliance.code, "NONCONFORM");
  assert.ok(result.gates.active.some((g) => g.code === "KO-01"));
  assert.ok(result.gates.active.some((g) => g.code === "KO-06"));
  assert.ok(result.rawScoreBp > 9900n, "Der interne Rohwert bleibt erhalten");
});

test("GM-02b: maximal kritischer Zustand mit verifizierbarer Evidenz ergibt Klasse E nahe 100", () => {
  const result = run(BMA, {
    severity: 4,
    modifiers: { F_A: "erheblich", F_E: "hoch", F_R: "rueckfall", F_M: "keine" },
    overrides: {
      "T-BMA-EVD-01": { severity: 3, modifiers: { F_A: "erheblich", F_R: "rueckfall" } },
      "T-BMA-EVD-02": { severity: 3, modifiers: { F_A: "erheblich", F_R: "rueckfall" } },
    },
  });
  assert.equal(result.nb, false);
  assert.equal(result.class, "E");
  assert.equal(result.finalScoreBp, 9985n);
  assert.equal(result.display, "99,9");
  assert.equal(result.gates.appliedFloorBp, 8500);
});

test("GM-03: nicht anwendbare Kriterien werden aus Zaehler und Nenner entfernt (CALC-005)", () => {
  const naOverrides = {
    "T-BMA-MEA-01": { applicability: APPLICABILITY.nicht_anwendbar },
    "T-BMA-MEA-02": { applicability: APPLICABILITY.nicht_anwendbar },
    "T-BMA-MEA-04": { applicability: APPLICABILITY.nicht_anwendbar },
  };
  const mitAllen = run(BMA, { severity: 0, overrides: { "T-BMA-MEA-03": { severity: 4 } } });
  const mitNA = run(BMA, {
    severity: 0,
    overrides: { "T-BMA-MEA-03": { severity: 4 }, ...naOverrides },
  });
  // MEA: nur noch das kritische Kriterium ist anwendbar -> D_MEA = 100,0
  assert.equal(mitAllen.display, "3,2");
  assert.equal(mitAllen.class, "A");
  assert.equal(mitNA.display, "15,0");
  assert.equal(mitNA.class, "B");
  const mea = mitNA.dimensions.find((d) => d.code === "MEA");
  assert.equal(mea.valueBp, 10000n);
  assert.equal(mea.scoredCount, 1);
});

test("GM-04: nicht pruefbares schutzkritisches Pflichtkriterium loest KO-06 und NB aus (CALC-006)", () => {
  const result = run(BMA, {
    severity: 0,
    overrides: { "T-BMA-TPF-02": { applicability: APPLICABILITY.nicht_pruefbar } },
  });
  assert.equal(result.nb, true);
  assert.equal(result.class, "NB");
  assert.equal(result.display, "NB");
  assert.equal(result.finalScoreBp, null);
  assert.ok(result.gates.active.some((g) => g.code === "KO-06"));
  assert.equal(result.release.eligible, false);
});

test("GM-05: KO-03 setzt den Score-Floor 50,0 und mindestens Klasse D", () => {
  const result = run(BMA, { severity: 0, overrides: { "T-BMA-TPF-07": { severity: 3 } } });
  const gate = result.gates.active.find((g) => g.code === "KO-03");
  assert.ok(gate, "KO-03 muss ausgeloest sein");
  assert.equal(result.gates.appliedFloorBp, 5000);
  assert.equal(result.display, "50,0");
  assert.equal(result.class, "D");
});

test("GM-06: KO-01 setzt den Score-Floor 85,0 und Klasse E", () => {
  const result = run(BMA, { severity: 0, overrides: { "T-BMA-IPH-01": { severity: 4 } } });
  assert.ok(result.gates.active.some((g) => g.code === "KO-01"));
  assert.equal(result.display, "85,0");
  assert.equal(result.class, "E");
});

test("GM-07: Gesamtabdeckung unter 70 % fuehrt zu NB (PRD 9.3)", () => {
  const bewertet = [
    "T-BMA-LRC-01", "T-BMA-LRC-02", "T-BMA-LRC-03", "T-BMA-LRC-04",
    "T-BMA-TPF-01", "T-BMA-TPF-02", "T-BMA-TPF-03", "T-BMA-TPF-04", "T-BMA-TPF-05",
    "T-BMA-TPF-06", "T-BMA-TPF-07", "T-BMA-TPF-08", "T-BMA-TPF-09", "T-BMA-TPF-10",
    "T-BMA-IPH-01", "T-BMA-IPH-02",
  ];
  const skip = BMA.criteria.map((c) => c.id).filter((id) => !bewertet.includes(id));
  const result = run(BMA, { severity: 0, skip });
  assert.ok(result.coverage.coverageBp < BigInt(COVERAGE_RULES.nbBelowBp));
  assert.equal(result.nb, true);
  assert.ok(result.gates.active.some((g) => g.code === "KO-06" && g.origin === "abdeckungsregel"));
});

test("GM-08: Abdeckung zwischen 70 % und 85 % erlaubt nur einen vorlaeufigen Score mit maximal K2", () => {
  const skip = ["T-BMA-TPF-03", "T-BMA-TPF-04", "T-BMA-TPF-09", "T-BMA-MEA-03", "T-BMA-MEA-04",
    "T-BMA-ORG-03", "T-BMA-EVD-04", "T-BMA-IPH-04"];
  const result = run(BMA, { severity: 0, skip });
  assert.ok(result.coverage.coverageBp >= BigInt(COVERAGE_RULES.nbBelowBp));
  assert.ok(result.coverage.coverageBp < BigInt(COVERAGE_RULES.provisionalBelowBp));
  assert.equal(result.nb, false);
  assert.equal(result.coverage.provisional, true);
  assert.equal(result.confidence.klass, "K2");
  assert.equal(result.release.eligible, false);
});

test("GM-09: fehlende Evidenz senkt die Konfidenz, nicht den Score", () => {
  const mitEvidenz = run(BMA, { severity: 1, quality: "primaer", actuality: "aktuell" });
  const ohneEvidenz = run(BMA, { severity: 1, quality: "vorperiode", actuality: "abgelaufen" });
  assert.equal(mitEvidenz.finalScoreBp, ohneEvidenz.finalScoreBp);
  assert.ok(ohneEvidenz.confidence.valueBp < mitEvidenz.confidence.valueBp);
});

// ------------------------------------------------------- Logische Validierung

test("CALC-001/M-02: Monotonie - eine Verschlechterung verbessert den Score nie", () => {
  let seed = 42;
  const rand = (n) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };
  for (let iteration = 0; iteration < 200; iteration += 1) {
    const evaluations = {};
    for (const criterion of BMA.criteria) {
      evaluations[criterion.id] = {
        ...emptyEvaluation(),
        severity: rand(4),
        evidenceQuality: "primaer",
        evidenceActuality: "aktuell",
      };
    }
    const target = BMA.criteria[rand(BMA.criteria.length)];
    const before = calculateScore({ profileId: BMA.id, evaluations });
    const worse = {
      ...evaluations,
      [target.id]: { ...evaluations[target.id], severity: evaluations[target.id].severity + 1 },
    };
    const after = calculateScore({ profileId: BMA.id, evaluations: worse });
    if (before.nb || after.nb) continue;
    assert.ok(
      after.finalScoreHp >= before.finalScoreHp,
      `Monotonieverletzung bei ${target.id}: ${before.display} -> ${after.display}`,
    );
  }
});

test("CALC-008: Klassengrenzen 10/25/45/70 sind eindeutig", () => {
  const cases = [
    [0, "A"], [1000, "A"], [1001, "B"], [2500, "B"], [2501, "C"],
    [4500, "C"], [4501, "D"], [7000, "D"], [7001, "E"], [10000, "E"],
  ];
  for (const [bp, expected] of cases) {
    assert.equal(classifyHp(BigInt(bp) * HP).code, expected, `${bp} bp`);
  }
  // Ungerundeter Wert entscheidet: 10,004 ist bereits Klasse B.
  assert.equal(classifyHp(1000n * HP + 400_000n).code, "B");
});

test("M-05: Gate-Floor kann nicht durch viele unauffaellige Kriterien kompensiert werden", () => {
  const result = run(BMA, { severity: 0, overrides: { "T-BMA-IPH-02": { severity: 4 } } });
  assert.ok(result.rawScoreBp < 2000n, "Rohscore bleibt niedrig");
  assert.ok(result.finalScoreBp >= 7500n, "Gate hebt den Finalwert auf mindestens 75,0");
  assert.equal(result.class, "E");
});

test("PRD 9.1: verpflichtende Anforderung mit Schweregrad 1 ergibt NONCONFORM", () => {
  const result = run(BMA, { severity: 0, overrides: { "T-BMA-LRC-02": { severity: 1 } } });
  assert.equal(result.compliance.code, "NONCONFORM");
  assert.equal(result.class, "A", "Compliance wird nicht aus dem Punktwert abgeleitet");
});

test("PRD 9.2: Konfidenzformel K = 0,40 A + 0,30 Q + 0,15 Z + 0,15 R", () => {
  const result = run(BMA, { severity: 0, quality: "vorperiode", actuality: "alternd" }, { reviewLevel: "vier_augen" });
  // A = 100, Q = 60, Z = 70, R = 80  ->  40 + 18 + 10,5 + 12 = 80,5
  assert.equal(result.confidence.A, 10000n);
  assert.equal(result.confidence.Q, 6000n);
  assert.equal(result.confidence.Z, 7000n);
  assert.equal(result.confidence.R, 8000n);
  assert.equal(result.confidence.valueBp, 8050n);
  assert.equal(result.confidence.klass, "K3");
});

test("GOV-001/GOV-005: KO-08 sperrt die externe Freigabe, der interne Rohwert bleibt erhalten", () => {
  const result = calculateScore({
    profileId: BMA.id,
    evaluations: assessAll(BMA, { severity: 1 }),
    reviewLevel: "senior_freigabe",
    gateEvents: [{ code: "KO-08", reason: "Unabhaengigkeit nicht dokumentiert" }],
  });
  assert.equal(result.nb, false);
  assert.ok(result.finalScoreBp > 0n);
  assert.equal(result.release.eligible, false);
  assert.ok(result.release.blockers.some((b) => b.includes("KO-08")));
});

// ---------------------------------------------------------- Snapshot / Audit

test("CALC-002/OFF-002: identische Eingangsdaten erzeugen identische Hashes", async () => {
  const evaluations = assessAll(BMA, { severity: 2 });
  const a = calculateScore({ profileId: BMA.id, evaluations, scope: { objectId: "BMA-01" } });
  const b = calculateScore({ profileId: BMA.id, evaluations, scope: { objectId: "BMA-01" } });
  const meta = { calculationId: "fix", calculatedAt: "2026-08-01T08:00:00.000Z" };
  const snapA = await createCalculationRun(a, meta);
  const snapB = await createCalculationRun(b, meta);
  assert.equal(snapA.input_hash, snapB.input_hash);
  assert.equal(snapA.signature_hash, snapB.signature_hash);
  assert.equal(snapA.raw_score_bp, Number(a.rawScoreBp));

  const changed = calculateScore({
    profileId: BMA.id,
    evaluations: { ...evaluations, "T-BMA-LRC-01": { ...evaluations["T-BMA-LRC-01"], severity: 3 } },
    scope: { objectId: "BMA-01" },
  });
  const snapC = await createCalculationRun(changed, meta);
  assert.notEqual(snapC.input_hash, snapA.input_hash);
});

test("R-10: manipulierter Snapshot wird erkannt", async () => {
  const result = run(BMA, { severity: 1 });
  const snapshot = await createCalculationRun(result);
  assert.equal((await verifySnapshot(snapshot)).valid, true);
  const tampered = { ...snapshot, final_score_bp: 0 };
  assert.equal((await verifySnapshot(tampered)).valid, false);
});

test("PRD 12.2: Snapshot enthaelt alle Pflichtfelder", async () => {
  const snapshot = await createCalculationRun(run(BMA, { severity: 1 }));
  for (const field of [
    "calculation_id", "calculated_at", "score_type", "model_version", "profile_id",
    "profile_version", "scope_hash", "input_hash", "criteria", "dimension_weights_bp",
    "gate_events", "compliance_result", "confidence_result", "raw_score_bp",
    "final_score_bp", "class", "reviewers", "engine_version", "signature_hash",
  ]) {
    assert.ok(field in snapshot, `Pflichtfeld ${field} fehlt`);
  }
  const sum = Object.values(snapshot.dimension_weights_bp).reduce((a, b) => a + b, 0);
  assert.equal(sum, 10000);
});

// ------------------------------------------------------------- Aggregation

test("CALC-010: Aggregation zeigt Verteilung, P90 und den schlechtesten Einzelwert", () => {
  const gut = run(BMA, { severity: 0 });
  const mittel = run(BMA, { severity: 2 });
  const kritisch = run(BMA, { severity: 0, overrides: { "T-BMA-IPH-01": { severity: 4 } } });
  const portfolio = aggregate([
    { result: gut, label: "Standort A", weights: { criticality: "mittel", exposure: "regulaer", redundancy: "teilredundant" } },
    { result: mittel, label: "Standort B", weights: { criticality: "mittel", exposure: "regulaer", redundancy: "teilredundant" } },
    { result: kritisch, label: "Standort C", weights: { criticality: "hoch", exposure: "hoch", redundancy: "einzelfehler" } },
  ]);
  assert.equal(portfolio.count, 3);
  assert.equal(portfolio.worst.label, "Standort C");
  assert.equal(portfolio.distribution.E, 1);
  assert.ok(portfolio.finalBp >= 8500n, "Gate-Floor des kritischen Standorts wirkt weiter");
  assert.ok(portfolio.gates.some((g) => g.code === "KO-01" && g.object === "Standort C"));
});

test("PRD 10: inkompatible Score-Arten und NB-Ergebnisse werden nicht mitgemittelt", () => {
  const cond = run(BMA, { severity: 1 });
  const mgmt = run(getProfile("B-COM"), { severity: 1 });
  const nbResult = run(BMA, {
    severity: 0,
    overrides: { "T-BMA-TPF-02": { applicability: APPLICABILITY.nicht_pruefbar } },
  });
  const portfolio = aggregate([
    { result: cond, label: "A" },
    { result: mgmt, label: "B" },
    { result: nbResult, label: "C" },
  ]);
  assert.equal(portfolio.count, 1);
  assert.equal(portfolio.excluded.length, 1);
  assert.equal(portfolio.nbItems.length, 1);
});

// ------------------------------------------------------------------ Trend

test("CALC-011: unzulaessiger Zeitreihenvergleich wird verhindert", () => {
  const bma = run(BMA, { severity: 1 });
  const mgmt = run(getProfile("B-COM"), { severity: 1 });
  assert.equal(trend(bma, mgmt).comparable, false);

  const spaeter = run(BMA, { severity: 2 });
  const delta = trend(spaeter, bma);
  assert.equal(delta.comparable, true);
  assert.equal(delta.direction, "Verschlechterung");
  assert.ok(delta.deltaBp > 0n);
});

// ------------------------------------------------------------- Performance

test("PRD 16.2: Profil mit 2.000 Kriterien wird in unter 2 Sekunden berechnet", () => {
  const criteria = [];
  for (let i = 0; i < 2000; i += 1) {
    const dimension = DIMENSION_CODES[i % DIMENSION_CODES.length];
    criteria.push({
      id: `PERF-${dimension}-${i}`,
      module: "PERF",
      dimension,
      weight: (i % 5) + 1,
      mandatory: false,
      text: `Lasttestkriterium ${i}`,
      sourceType: "fachbewertung",
      sourceRef: "Lasttest",
    });
  }
  const profile = { ...BMA, id: "T-PERF", criteria, status: "released" };
  const evaluations = {};
  for (const criterion of criteria) {
    evaluations[criterion.id] = {
      ...emptyEvaluation(),
      severity: criterion.weight % 5,
      evidenceQuality: "primaer",
      evidenceActuality: "aktuell",
    };
  }
  const start = performance.now();
  const result = calculateScore({ profile, evaluations });
  const duration = performance.now() - start;
  assert.ok(result.finalScoreBp !== null);
  assert.ok(duration < 2000, `Berechnung dauerte ${duration.toFixed(0)} ms`);
});

test("Profilregister enthaelt alle Geschaeftsbereiche des PRD", () => {
  assert.equal(PROFILES.length, 35);
  assert.ok(PROFILES_BY_ID["T-82B"], "TECHNIK-Profil § 82b fehlt");
  assert.ok(PROFILES_BY_ID["C-BAG"], "CONSULTING-Profil fehlt");
  assert.ok(PROFILES_BY_ID["B-PROT"], "BUSINESS-Profil fehlt");
  assert.equal(releasedProfiles().length, 3);
});

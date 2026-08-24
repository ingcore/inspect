/**
 * Validierungsstufe V1 - Golden Masters T-BMA 1.0.0 (PRD 16.1, 16.2).
 *
 * Neben den fachlich begruendeten Erwartungen aus golden-masters.mjs prueft
 * dieser Test den Rohscore gegen eine unabhaengige Referenzrechnung. Die
 * Referenz ist bewusst eine zweite, direkt aus dem PRD transkribierte
 * Implementierung in Gleitkommaarithmetik - sie teilt keinen Code mit der
 * Engine und deckt daher Transkriptions- und Vorzeichenfehler auf.
 *
 * Ausfuehrung:  npm run test:safety-score
 */

import assert from "node:assert/strict";
import test from "node:test";

import { GOLDEN_MASTERS, buildCase } from "./golden-masters.mjs";
import { getProfile } from "../js/engine/profiles.js";
import { calculateScore, criterionRisk } from "../js/engine/score-engine.js";
import { formatScore } from "../js/engine/fixed.js";

const BMA = getProfile("T-BMA");

/* ------------------------------------------------ Unabhaengige Referenz */

// Transkription der Modifikatortabelle aus PRD 7.5.
const REFERENCE_MODIFIERS = {
  F_A: { isoliert: 0.8, begrenzt: 0.9, erheblich: 1.0 },
  F_E: { gering: 0.9, regulaer: 1.0, hoch: 1.1 },
  F_R: { neu: 1.0, ueberfaellig: 1.1, wiederholt: 1.2, rueckfall: 1.3 },
  F_M: { keine: 1.0, wirksam: 0.85 },
};
const REFERENCE_NEUTRAL = { F_A: "erheblich", F_E: "regulaer", F_R: "neu", F_M: "keine" };

// Transkription der Zulaessigkeitsmatrix aus PRD 7.5.
const REFERENCE_MATRIX = {
  LRC: { F_A: 1, F_E: 0, F_R: 1, F_M: 0 },
  TPF: { F_A: 1, F_E: 1, F_R: 1, F_M: 1 },
  IPH: { F_A: 1, F_E: 1, F_R: 1, F_M: 1 },
  ORG: { F_A: 1, F_E: 1, F_R: 1, F_M: 1 },
  EVD: { F_A: 1, F_E: 0, F_R: 1, F_M: 0 },
  MEA: { F_A: 1, F_E: 0, F_R: 1, F_M: 1 },
};

/** S_raw und Abdeckung nach PRD 7.6 bis 7.8 in Gleitkommaarithmetik. */
function referenceCalculation(profile, evaluations) {
  const sums = {};
  let applicableWeight = 0;
  let coveredWeight = 0;

  for (const criterion of profile.criteria) {
    const evaluation = evaluations[criterion.id];
    const applicability = evaluation?.applicability ?? "anwendbar";
    if (applicability === "nicht_anwendbar") continue;

    applicableWeight += criterion.weight;
    const scored = applicability === "anwendbar" && evaluation && evaluation.severity !== null &&
      evaluation.severity !== undefined;
    if (scored && evaluation.evidenceQuality && evaluation.evidenceQuality !== "keine") {
      coveredWeight += criterion.weight;
    }
    if (!scored) continue;

    let r = evaluation.severity / 4;
    for (const code of ["F_A", "F_E", "F_R", "F_M"]) {
      if (!REFERENCE_MATRIX[criterion.dimension][code]) continue;
      const key = evaluation.modifiers?.[code] ?? REFERENCE_NEUTRAL[code];
      r *= REFERENCE_MODIFIERS[code][key] ?? 1;
    }
    r = Math.min(1, r);

    sums[criterion.dimension] ??= { weighted: 0, weight: 0 };
    sums[criterion.dimension].weighted += criterion.weight * r;
    sums[criterion.dimension].weight += criterion.weight;
  }

  let raw = 0;
  const dimensions = {};
  for (const [code, weightBp] of Object.entries(profile.weightsBp)) {
    const sum = sums[code];
    const value = sum && sum.weight > 0 ? (100 * sum.weighted) / sum.weight : 0;
    dimensions[code] = value;
    raw += (weightBp / 10000) * value;
  }
  return {
    raw,
    dimensions,
    coverage: applicableWeight > 0 ? (100 * coveredWeight) / applicableWeight : null,
  };
}

/* ------------------------------------------------------- Fallausfuehrung */

for (const golden of GOLDEN_MASTERS) {
  test(`${golden.id}: ${golden.titel}`, () => {
    const input = buildCase(golden);
    const result = calculateScore(input);
    const erwartung = golden.erwartung;

    // Score und Klasse
    if (erwartung.score === null) {
      assert.equal(result.nb, true, "NB erwartet");
      assert.equal(result.display, "NB");
      assert.equal(result.finalScoreBp, null, "Bei NB wird kein Zahlenwert veroeffentlicht");
    } else {
      assert.equal(result.nb, false, "kein NB erwartet");
      assert.equal(result.display, erwartung.score, "Finalwert");
    }
    assert.equal(result.class, erwartung.klasse, "Klasse");

    // Gates
    const gates = [...new Set(result.gates.active.map((gate) => gate.code))].sort();
    assert.deepEqual(gates, [...erwartung.gates].sort(), "aktive Gates");

    // Compliance und Konfidenz als getrennte Achsen
    assert.equal(result.compliance.code, erwartung.compliance, "Compliance");
    assert.equal(result.confidence.klass, erwartung.konfidenz, "Konfidenzklasse");
    assert.equal(formatScore(result.coverage.coverageBp), erwartung.abdeckung, "gewichtete Abdeckung");
    assert.equal(result.release.eligible, erwartung.freigabefaehig, "Freigabefaehigkeit");
    if (erwartung.vorlaeufig) {
      assert.equal(result.coverage.provisional, true, "nur vorlaeufiger interner Score");
    }

    // Unabhaengige Referenzrechnung des Rohscores
    const reference = referenceCalculation(BMA, input.evaluations);
    const engineRaw = Number(result.rawScoreBp) / 100;
    assert.ok(
      Math.abs(engineRaw - reference.raw) < 0.01,
      `Rohscore weicht von der Referenzrechnung ab: Engine ${engineRaw}, Referenz ${reference.raw.toFixed(4)}`,
    );
    for (const dimension of result.dimensions) {
      const engineValue = Number(dimension.valueBp) / 100;
      assert.ok(
        Math.abs(engineValue - reference.dimensions[dimension.code]) < 0.01,
        `Dimension ${dimension.code}: Engine ${engineValue}, Referenz ${reference.dimensions[dimension.code].toFixed(4)}`,
      );
    }
    if (reference.coverage !== null) {
      assert.ok(
        Math.abs(Number(result.coverage.coverageBp) / 100 - reference.coverage) < 0.01,
        "Abdeckung weicht von der Referenzrechnung ab",
      );
    }

    // Optionale Pruefpunktkontrolle (Anhang B)
    if (golden.pruefpunkt) {
      const entry = result.entries.find((e) => e.criterion.id === golden.pruefpunkt.criterionId);
      assert.equal(Number(entry.risk.rMicro) / 1e6, golden.pruefpunkt.r, "r des Pruefpunkts");
      assert.equal(
        (entry.criterion.weight * Number(entry.risk.rMicro)) / 1e6,
        golden.pruefpunkt.beitrag,
        "gewichteter Beitrag w · r",
      );
    }
  });
}

test("Golden-Master-Satz erfuellt den Mindestumfang und ist eindeutig", () => {
  assert.ok(GOLDEN_MASTERS.length >= 15, "PRD fordert mindestens 15 BMA-Golden-Master-Faelle");
  const ids = GOLDEN_MASTERS.map((golden) => golden.id);
  assert.equal(new Set(ids).size, ids.length, "Doppelte Fall-IDs");
  for (const golden of GOLDEN_MASTERS) {
    assert.ok(golden.begruendung?.length > 60, `${golden.id}: fachliche Begruendung fehlt oder ist zu knapp`);
    assert.ok(golden.erwartung, `${golden.id}: Erwartung fehlt`);
  }
});

test("Golden-Master-Satz deckt alle Gate-Wirkungen und Ergebnisachsen ab", () => {
  const gates = new Set(GOLDEN_MASTERS.flatMap((golden) => golden.erwartung.gates));
  for (const code of ["KO-01", "KO-03", "KO-04", "KO-05", "KO-06", "KO-07", "KO-08"]) {
    assert.ok(gates.has(code), `Gate ${code} ist in keinem Referenzfall abgedeckt`);
  }
  const klassen = new Set(GOLDEN_MASTERS.map((golden) => golden.erwartung.klasse));
  for (const klasse of ["A", "D", "E", "NB"]) {
    assert.ok(klassen.has(klasse), `Klasse ${klasse} ist in keinem Referenzfall abgedeckt`);
  }
  const compliance = new Set(GOLDEN_MASTERS.map((golden) => golden.erwartung.compliance));
  for (const status of ["CONFORM", "NONCONFORM", "PARTIAL"]) {
    assert.ok(compliance.has(status), `Compliance-Status ${status} ist nicht abgedeckt`);
  }
  const konfidenz = new Set(GOLDEN_MASTERS.map((golden) => golden.erwartung.konfidenz));
  for (const klasse of ["K2", "K3", "K4"]) {
    assert.ok(konfidenz.has(klasse), `Konfidenzklasse ${klasse} ist nicht abgedeckt`);
  }
});

test("Golden Masters sind reproduzierbar (SS-G01)", () => {
  for (const golden of GOLDEN_MASTERS) {
    const input = buildCase(golden);
    const first = calculateScore(input);
    const second = calculateScore(buildCase(golden));
    assert.equal(first.display, second.display, `${golden.id} nicht reproduzierbar`);
    assert.equal(first.class, second.class);
    assert.equal(String(first.rawScoreBp), String(second.rawScoreBp));
  }
});

/** Pruefpunkt-Kontrolle aus Anhang B, unabhaengig vom Fallsatz. */
test("Anhang B: r = 0,90 und gewichteter Beitrag 4,50", () => {
  const { rMicro } = criterionRisk("TPF", 3, { F_R: "wiederholt" });
  assert.equal(Number(rMicro) / 1e6, 0.9);
  assert.equal((5 * Number(rMicro)) / 1e6, 4.5);
});

/** Das eingecheckte Trace-Dokument muss dem erzeugten Stand entsprechen. */
test("GOLDEN-MASTERS.md ist aktuell (Regressionskontrolle)", async () => {
  const { buildDocument } = await import("./export-traces.mjs");
  const { readFileSync } = await import("node:fs");
  const committed = readFileSync(new URL("./GOLDEN-MASTERS.md", import.meta.url), "utf8");
  assert.equal(
    `${await buildDocument()}\n`,
    committed,
    "Trace-Dokument weicht ab. Bitte `npm run trace:golden-masters` ausfuehren und das Ergebnis einchecken.",
  );
});

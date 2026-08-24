/**
 * Aggregation von Anlage bis Portfolio (PRD 10, CALC-010).
 *
 * Aggregiert werden ausschliesslich freigegebene Ergebnisse derselben
 * Score-Art und kompatibler Major-Versionen. Ein Portfolio wird nie auf eine
 * einzelne Zahl reduziert: Verteilung, schlechtester Wert, aktive Gates,
 * Abdeckung und Konfidenz sind Pflichtbestandteile der Ausgabe.
 */

import { HP, divRound, hpToBp } from "./fixed.js";
import {
  AGGREGATION_FACTORS,
  AGGREGATION_MIX,
  CLASS_ORDER,
  CLASS_NB,
  classifyHp,
  classByCode,
  worseClass,
  confidenceClass,
} from "./model.js";

function factorValue(group, key) {
  const options = AGGREGATION_FACTORS[group].options;
  const option = options.find((o) => o.key === key) ?? options[0];
  return BigInt(option.value);
}

/** PRD 10.1 - v_j = K_j * X_j * U_j, Referenzklassen statt freier Werte. */
export function aggregationWeight(weights = {}) {
  return (
    factorValue("criticality", weights.criticality) *
    factorValue("exposure", weights.exposure) *
    factorValue("redundancy", weights.redundancy)
  );
}

/** Gewichtetes Perzentil ueber die aufsteigend sortierten Einzelwerte. */
function weightedPercentileHp(items, percentile) {
  const sorted = [...items].sort((a, b) => (a.scoreHp < b.scoreHp ? -1 : a.scoreHp > b.scoreHp ? 1 : 0));
  const totalWeight = sorted.reduce((acc, item) => acc + item.weight, 0n);
  if (totalWeight === 0n) return 0n;
  const threshold = divRound(totalWeight * BigInt(percentile), 100n);
  let cumulative = 0n;
  for (const item of sorted) {
    cumulative += item.weight;
    if (cumulative >= threshold) return item.scoreHp;
  }
  return sorted[sorted.length - 1].scoreHp;
}

/**
 * Aggregiert freigegebene Ergebnisse.
 *
 * @param {Array} results Liste von { result, weights, label } oder Score-Ergebnissen
 * @param {object} options { scoreType, requireReleased }
 */
export function aggregate(results, options = {}) {
  const items = [];
  const excluded = [];
  const nbItems = [];
  const scoreType = options.scoreType ?? results[0]?.result?.scoreType ?? null;

  for (const record of results) {
    const result = record.result ?? record;
    const label = record.label ?? result.scope?.objectId ?? result.profile?.id ?? "Objekt";
    if (scoreType && result.scoreType !== scoreType) {
      excluded.push({ label, reason: `abweichende Score-Art ${result.scoreType} (PRD 10)` });
      continue;
    }
    const majorSelf = String(result.modelVersion).split(".")[0];
    const majorRef = String(results[0].result?.modelVersion ?? results[0].modelVersion).split(".")[0];
    if (majorSelf !== majorRef) {
      excluded.push({ label, reason: `inkompatible Major-Version ${result.modelVersion}` });
      continue;
    }
    if (options.requireReleased && !record.released) {
      excluded.push({ label, reason: "nicht freigegeben" });
      continue;
    }
    if (result.nb) {
      nbItems.push({ label, reason: result.gates.nbGate?.reason ?? "NB" });
      continue;
    }
    items.push({
      label,
      result,
      scoreHp: result.finalScoreHp,
      weight: aggregationWeight(record.weights),
      weightsKey: record.weights ?? {},
    });
  }

  if (items.length === 0) {
    return {
      scoreType,
      count: 0,
      nb: true,
      class: CLASS_NB.code,
      note: "Keine kompatiblen und belastbaren Einzelergebnisse fuer eine Aggregation vorhanden.",
      excluded,
      nbItems,
      distribution: Object.fromEntries(CLASS_ORDER.map((c) => [c, 0])),
    };
  }

  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0n);
  const muHp = divRound(
    items.reduce((acc, item) => acc + item.weight * item.scoreHp, 0n),
    totalWeight,
  );
  const p90Hp = weightedPercentileHp(items, AGGREGATION_MIX.percentile);
  const rawHp = divRound(muHp * BigInt(AGGREGATION_MIX.meanBp) + p90Hp * BigInt(AGGREGATION_MIX.p90Bp), 10000n);

  // Gates der Einzelergebnisse wirken weiter (PRD 10.2, R-03).
  const activeGates = [];
  for (const item of items) {
    for (const gate of item.result.gates.active) {
      activeGates.push({ ...gate, object: item.label });
    }
  }
  const highestFloorBp = activeGates
    .filter((g) => g.effect === "floor")
    .reduce((acc, g) => (g.floorBp > acc ? g.floorBp : acc), 0);
  const finalHp = rawHp > BigInt(highestFloorBp) * HP ? rawHp : BigInt(highestFloorBp) * HP;

  const exact = classifyHp(finalHp);
  const gateMinClass = activeGates
    .filter((g) => g.effect === "floor")
    .reduce((acc, g) => worseClass(acc, g.minClass), null);
  const klass = classByCode(worseClass(exact.code, gateMinClass) ?? exact.code);

  const worst = items.reduce((acc, item) => (item.scoreHp > acc.scoreHp ? item : acc), items[0]);
  const best = items.reduce((acc, item) => (item.scoreHp < acc.scoreHp ? item : acc), items[0]);

  const distribution = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]));
  for (const item of items) distribution[item.result.class] = (distribution[item.result.class] ?? 0) + 1;

  const coverageValues = items
    .map((item) => item.result.coverage.coverageBp)
    .filter((value) => value !== null);
  const coverageBp = coverageValues.length
    ? divRound(coverageValues.reduce((a, b) => a + b, 0n), BigInt(coverageValues.length))
    : null;
  const confidenceBp = divRound(
    items.reduce((acc, item) => acc + item.result.confidence.valueBp, 0n),
    BigInt(items.length),
  );

  return {
    scoreType,
    count: items.length,
    nb: false,
    meanHp: muHp,
    meanBp: hpToBp(muHp),
    p90Hp,
    p90Bp: hpToBp(p90Hp),
    rawHp,
    rawBp: hpToBp(rawHp),
    finalHp,
    finalBp: hpToBp(finalHp),
    class: klass.code,
    classLabel: klass.label,
    worst: { label: worst.label, bp: hpToBp(worst.scoreHp), class: worst.result.class },
    best: { label: best.label, bp: hpToBp(best.scoreHp), class: best.result.class },
    distribution,
    items: items.map((item) => ({
      label: item.label,
      bp: hpToBp(item.scoreHp),
      class: item.result.class,
      weight: Number(item.weight),
      compliance: item.result.compliance.code,
      confidence: item.result.confidence.klass,
      gates: item.result.gates.active.map((g) => g.code),
    })),
    gates: activeGates,
    appliedFloorBp: highestFloorBp,
    coverageBp,
    confidenceBp,
    confidenceClass: confidenceClass(confidenceBp).code,
    nbItems,
    excluded,
    mix: AGGREGATION_MIX,
    note:
      "Aggregat aus 80 % gewichtetem Mittelwert und 20 % gewichtetem P90 (Startkonfiguration 1.0, " +
      "sensitivitaetspflichtig). Kritische Einzelstandorte werden zusaetzlich ueber Gates gefuehrt.",
  };
}

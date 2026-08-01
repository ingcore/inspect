/**
 * Wiederverwendbare Darstellungsbausteine.
 *
 * PRD 14.1: Farbe ist nie das einzige Merkmal. Jede Ergebnisdarstellung
 * fuehrt Klasse, Text und Symbol mit; bei NB wird kein scheinpraeziser
 * Zahlenwert angezeigt.
 */

import { formatScore } from "../engine/fixed.js";
import { CLASS_ORDER, WORDING } from "../engine/model.js";

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const CLASS_SYMBOL = { A: "●", B: "◐", C: "◑", D: "◕", E: "■", NB: "?" };

const COMPLIANCE_TONE = {
  CONFORM: "ok",
  NONCONFORM: "bad",
  PARTIAL: "warn",
  NB: "warn",
  NA: "neutral",
};

const CONFIDENCE_TONE = { K4: "ok", K3: "ok", K2: "warn", K1: "bad" };

/** Verbindliche Score-Box (REP-001). */
export function scoreBox(result, options = {}) {
  const nb = result.nb;
  const value = nb
    ? '<div class="value">NB</div>'
    : `<div class="value">${esc(result.display)} <span class="unit">von 100</span></div>`;
  const chevrons = CLASS_ORDER.map(
    (code) => `<div class="chev ${code} ${!nb && result.class === code ? "active" : ""}">${code}</div>`,
  ).join("");
  const nbChev = nb ? '<div class="chev NB active">NB</div>' : "";
  return `
    <div class="scorebox">
      <span class="eyebrow">INGTEC Safety-Score®</span>
      ${value}
      <div class="direction">Risikopunkte · ${esc(WORDING.direction)}</div>
      <div class="chevrons">${chevrons}${nbChev}</div>
      <div class="classline">${CLASS_SYMBOL[result.class] ?? ""} Klasse ${esc(result.class)} · ${esc(result.classLabel ?? "")}</div>
      ${options.compact ? "" : `<p style="margin-top:8px">${esc(result.classConsequence ?? "")}</p>`}
    </div>`;
}

/** Die vier getrennten Ergebnisachsen (PRD 4.2). */
export function axes(result) {
  const gateCodes = [...new Set(result.gates.active.map((g) => g.code))];
  const gate = gateCodes.length ? gateCodes.join(", ") : "kein Gate";
  const gateTone = result.gates.active.length ? "bad" : "ok";
  return `
    <div class="axes">
      <div class="axis">
        <small>Score und Klasse</small>
        <b>${result.nb ? "NB" : `${esc(result.display)} · ${esc(result.class)}`}</b>
      </div>
      <div class="axis">
        <small>Compliance</small>
        <b><span class="pill ${COMPLIANCE_TONE[result.compliance.code]}">${esc(result.compliance.label)}</span></b>
      </div>
      <div class="axis">
        <small>Konfidenz</small>
        <b><span class="pill ${CONFIDENCE_TONE[result.confidence.klass]}">${esc(result.confidence.klass)} · ${formatScore(result.confidence.valueBp)}</span></b>
      </div>
      <div class="axis">
        <small>Gate</small>
        <b><span class="pill ${gateTone}">${esc(gate)}</span></b>
      </div>
    </div>`;
}

export function compliancePill(result) {
  return `<span class="pill ${COMPLIANCE_TONE[result.compliance.code]}">${esc(result.compliance.label)}</span>`;
}

export function confidencePill(result) {
  return `<span class="pill ${CONFIDENCE_TONE[result.confidence.klass]}">Konfidenz ${esc(result.confidence.klass)}</span>`;
}

export function classPill(klass) {
  const tone = klass === "A" || klass === "B" ? "ok" : klass === "C" ? "warn" : klass === "NB" ? "neutral" : "bad";
  return `<span class="pill ${tone}">${CLASS_SYMBOL[klass] ?? ""} Klasse ${esc(klass)}</span>`;
}

/** Kopfzeile mit Scope, Stichtag und Modellversion (PRD 14.1). */
export function scopeLine(result, scope) {
  const parts = [
    scope?.company,
    scope?.site,
    scope?.system,
    `Stichtag ${scope?.referenceDate || "offen"}`,
    `Profil ${result.profile.id} ${result.profile.version}`,
    `Modell ${result.modelVersion}`,
    result.scoreType,
  ].filter(Boolean);
  return `<p>${parts.map(esc).join(" · ")}</p>`;
}

export function bar(valueBp, risk = true) {
  const width = Math.max(0, Math.min(100, Number(valueBp ?? 0) / 100));
  return `<div class="bar ${risk ? "risk" : ""}"><span style="width:${width}%"></span></div>`;
}

export function selectOptions(options, selected) {
  return options
    .map(
      ([value, label]) =>
        `<option value="${esc(value)}" ${String(selected) === String(value) ? "selected" : ""}>${esc(label)}</option>`,
    )
    .join("");
}

export function emptyState(text) {
  return `<div class="empty">${esc(text)}</div>`;
}

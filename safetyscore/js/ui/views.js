/**
 * Ansichten der Safety-Score-Oberflaeche.
 * Jede Ansicht rendert reines HTML; Interaktionen laufen ueber data-action
 * und werden in app.js zentral behandelt.
 */

import { formatScore, bpToNumber } from "../engine/fixed.js";
import {
  DIMENSIONS,
  SEVERITY_SCALE,
  SEVERITY_ANCHORS,
  MODIFIERS,
  MODIFIER_CODES,
  MODIFIER_MATRIX,
  MODIFIER_MATRIX_NOTES,
  CONTROL_WEIGHTS,
  GATES,
  CLASSES,
  CLASS_ORDER,
  COMPLIANCE_STATUS,
  CONFIDENCE_CLASSES,
  COVERAGE_RULES,
  EVIDENCE_QUALITY,
  EVIDENCE_ACTUALITY,
  REVIEW_QUALITY,
  SOURCE_TYPES,
  SCORE_TYPES,
  WORDING,
  MODEL_VERSION,
  ENGINE_VERSION,
  AGGREGATION_FACTORS,
} from "../engine/model.js";
import { PROFILES, NON_SCORED_PROFILES, releasedProfiles, STANDARD_WEIGHTS } from "../engine/profiles.js";
import { APPLICABILITY, criterionRisk, trend } from "../engine/score-engine.js";
import { aggregate } from "../engine/aggregate.js";
import { SCOPE_REQUIRED, scopeGaps } from "./state.js";
import {
  esc,
  scoreBox,
  axes,
  classPill,
  compliancePill,
  confidencePill,
  scopeLine,
  bar,
  selectOptions,
  emptyState,
  CLASS_SYMBOL,
} from "./components.js";

const APPLICABILITY_LABELS = [
  [APPLICABILITY.anwendbar, "anwendbar"],
  [APPLICABILITY.nicht_anwendbar, "nicht anwendbar"],
  [APPLICABILITY.nicht_pruefbar, "nicht pruefbar"],
];

/* ------------------------------------------------------------------ Scope */

export function viewScope({ assessment, profile, result }) {
  const scope = assessment.scope;
  const gaps = scopeGaps(scope);
  const field = (key, label, type = "text", span = false) => `
    <label class="${span ? "span2" : ""}">${esc(label)}
      <input type="${type}" data-scope="${key}" value="${esc(scope[key])}" ${assessment.released ? "disabled" : ""}>
    </label>`;
  const area = (key, label) => `
    <label class="span2">${esc(label)}
      <textarea data-scope="${key}" ${assessment.released ? "disabled" : ""}>${esc(scope[key])}</textarea>
    </label>`;

  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">Schritt 1 · Bewertungsgegenstand</span>
        <h2>Scope und Prueflprofil festlegen</h2>
        <p>Der Score gilt ausschliesslich innerhalb dieses Scopes. Unklare Systemgrenzen, unbekannte Nutzungen
        oder nicht zugaengliche Bereiche werden als Scope-Luecke protokolliert und wirken auf Konfidenz oder Gate.</p>
      </div>
      <div class="toolbar">
        <button class="secondary" data-action="new-assessment">Neue Bewertung</button>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <h3>Objekt- und Auftragsdaten</h3>
        <div class="form-grid">
          ${field("company", "Rechtstraeger *")}
          ${field("customerNo", "Kundennummer")}
          ${field("site", "Standort / Betriebsstaette *")}
          ${field("objectId", "Objekt-ID *")}
          ${field("buildingArea", "Gebaeude, Bereich oder Brandabschnitt")}
          ${field("system", "Anlage oder System *")}
          ${field("component", "Komponente / Teilprozess")}
          ${field("inspectionType", "Pruefart *")}
          ${field("referenceDate", "Bewertungsstichtag *", "date")}
          ${field("validUntil", "Gueltig bis", "date")}
          ${field("periodFrom", "Pruefzeitraum von", "date")}
          ${field("periodTo", "Pruefzeitraum bis", "date")}
          ${area("legalBasis", "Anwendbare Rechts-, Bescheid-, Normen-, Hersteller- und Vertragsgrundlagen *")}
          ${area("included", "Explizit eingeschlossene Bereiche *")}
          ${area("excluded", "Explizit ausgeschlossene Bereiche")}
          ${area("inaccessible", "Nicht zugaengliche oder nicht pruefbare Teile und deren Bedeutung")}
          ${field("inspector", "Pruefer *")}
          ${field("equipment", "Verwendete Messmittel")}
          ${field("reviewer", "Reviewer")}
          ${field("approver", "Freigabeberechtigt")}
        </div>
      </div>

      <div>
        <div class="card evaluation">
          <h3>Pruefprofil und Score-Art</h3>
          <label>Freigegebenes Pruefprofil
            <select data-action="profile-select" ${assessment.released ? "disabled" : ""}>
              ${releasedProfiles()
                .map(
                  (p) =>
                    `<option value="${p.id}" ${p.id === profile.id ? "selected" : ""}>${esc(
                      `${p.id} · ${p.field}`,
                    )}</option>`,
                )
                .join("")}
            </select>
          </label>
          <div class="status-card">
            <b>${esc(profile.id)} ${esc(profile.version)}</b>
            <p>${esc(profile.field)} · Geschaeftsbereich ${esc(profile.area)}</p>
            <p><b>${esc(profile.scoreType)}</b> – ${esc(SCORE_TYPES[profile.scoreType]?.label ?? "")}<br>
            <small>${esc(SCORE_TYPES[profile.scoreType]?.subject ?? "")}</small></p>
          </div>
          <table>
            <tr><th>Dimension</th><th class="num">Gewicht</th><th class="num">Kriterien</th></tr>
            ${DIMENSIONS.map(
              (d) => `<tr>
                <td>${d.code} · ${esc(d.label)}</td>
                <td class="num">${(profile.weightsBp[d.code] / 100).toFixed(0)} %</td>
                <td class="num">${profile.criteria.filter((c) => c.dimension === d.code).length}</td>
              </tr>`,
            ).join("")}
          </table>
          <p class="fieldnote">Gewichte sind Bestandteil der freigegebenen Profilversion und im Einzelfall nicht veraenderbar.</p>
        </div>

        <div class="card ${gaps.length ? "" : "evaluation"}" style="margin-top:16px">
          <h3>Scope-Vollstaendigkeit</h3>
          ${
            gaps.length
              ? `<div class="status-card warn"><b>${gaps.length} Pflichtangabe(n) offen</b>
                 <p>${gaps.map(esc).join(", ")}</p>
                 <p class="fieldnote">Fehlende Pflichtangaben sperren die Freigabe des Ergebnisses.</p></div>`
              : `<div class="status-card ok"><b>Alle Pflichtangaben nach PRD 5.2 erfasst</b></div>`
          }
          ${scoreBox(result, { compact: true })}
          ${scopeLine(result, scope)}
        </div>
      </div>
    </div>`;
}

/* ------------------------------------------------------------- Bewertung */

function modifierControl(criterion, evaluation) {
  return MODIFIER_CODES.map((code) => {
    const allowed = MODIFIER_MATRIX[criterion.dimension][code];
    const definition = MODIFIERS[code];
    const note = MODIFIER_MATRIX_NOTES[criterion.dimension]?.[code];
    if (!allowed) {
      return `<label>${code} · ${esc(definition.label)}
        <select disabled><option>nicht zugelassen (1,00)</option></select>
        <span class="fieldnote">In ${criterion.dimension} nicht zulaessig (PRD 7.5).</span>
      </label>`;
    }
    const options = definition.options.map((option) => [
      option.key,
      `${option.value / 100} – ${option.label}`,
    ]);
    const selected = evaluation.modifiers?.[code] ?? definition.neutral;
    return `<label>${code} · ${esc(definition.label)}
      <select data-action="modifier" data-criterion="${criterion.id}" data-code="${code}">
        ${selectOptions(options, selected)}
      </select>
      ${note ? `<span class="fieldnote">${esc(note)}</span>` : ""}
    </label>`;
  }).join("");
}

function criterionCard(entry, assessment) {
  const { criterion, evaluation, scored } = entry;
  const disabled = assessment.released ? "disabled" : "";
  const anchors = SEVERITY_ANCHORS[criterion.dimension];
  const risk = scored ? criterionRisk(criterion.dimension, evaluation.severity, evaluation.modifiers) : null;
  const gateRule = criterion.gateRule;
  const gateActive = gateRule && scored && evaluation.severity >= gateRule.fromSeverity;
  const measurement = criterion.measurement;
  const measurementValue = evaluation.measurement?.value ?? "";
  const outOfRange =
    measurement && measurementValue !== "" && Number.isFinite(Number(measurementValue))
      ? Number(measurementValue) < measurement.min || Number(measurementValue) > measurement.max
      : false;

  const stateClass = gateActive ? "gate" : scored ? "done" : "gap";

  return `
    <article class="criterion ${stateClass}">
      <header>
        <div>
          <div class="cid">${esc(criterion.id)} · ${criterion.dimension} · Gewicht ${criterion.weight} (${esc(
            CONTROL_WEIGHTS.find((w) => w.value === criterion.weight)?.label ?? "",
          )})${criterion.mandatory ? " · Pflichtkriterium" : ""}</div>
          <div class="ctext">${esc(criterion.text)}</div>
        </div>
        <div>${scored ? classPillForSeverity(evaluation.severity) : '<span class="pill neutral">offen</span>'}</div>
      </header>
      <div class="guidance">${esc(criterion.guidance ?? "")}</div>
      <div class="legend">
        <span class="pill neutral">${esc(SOURCE_TYPES[criterion.sourceType]?.label ?? criterion.sourceType)}</span>
        <span>${esc(criterion.sourceRef ?? "")}</span>
        ${gateRule ? `<span class="pill warn">Gate-Regel ${gateRule.code} ab Schweregrad ${gateRule.fromSeverity}</span>` : ""}
      </div>

      <div class="choices">
        ${APPLICABILITY_LABELS.map(
          ([value, label]) =>
            `<button ${disabled} data-action="applicability" data-criterion="${criterion.id}" data-value="${value}"
              class="${evaluation.applicability === value ? "active" : ""}">${esc(label)}</button>`,
        ).join("")}
      </div>

      ${
        evaluation.applicability === APPLICABILITY.anwendbar
          ? `<div class="choices">
              ${SEVERITY_SCALE.map(
                (severity) => `<button ${disabled} data-action="severity" data-criterion="${criterion.id}"
                  data-value="${severity.value}" title="${esc(
                    severity.value === 0 ? severity.definition : anchors[severity.value - 1],
                  )}"
                  class="sev-${severity.value} ${evaluation.severity === severity.value ? "active" : ""}">
                  ${severity.value} · ${esc(severity.label)}</button>`,
              ).join("")}
            </div>
            ${
              scored && evaluation.severity > 0
                ? `<div class="fieldnote">Ankerbeispiel ${criterion.dimension}: ${esc(anchors[evaluation.severity - 1])}</div>`
                : ""
            }`
          : `<div class="fieldnote">${
              evaluation.applicability === APPLICABILITY.nicht_anwendbar
                ? "Kriterium wird aus Zaehler und Nenner entfernt (CALC-005)."
                : "Nicht pruefbar: wird nicht als erfuellt gewertet, senkt die Konfidenz und kann KO-06 ausloesen."
            }</div>`
      }

      <div class="detailgrid">
        ${modifierControl(criterion, evaluation)}
        <label>Evidenzqualitaet
          <select data-action="evidence-quality" data-criterion="${criterion.id}" ${disabled}>
            ${selectOptions(
              Object.values(EVIDENCE_QUALITY).map((q) => [q.key, `${q.label} (${q.value})`]),
              evaluation.evidenceQuality,
            )}
          </select>
        </label>
        <label>Aktualitaet
          <select data-action="evidence-actuality" data-criterion="${criterion.id}" ${disabled}>
            ${selectOptions(
              Object.values(EVIDENCE_ACTUALITY).map((z) => [z.key, `${z.label} (${z.value})`]),
              evaluation.evidenceActuality,
            )}
          </select>
        </label>
        <label class="span2">Beweismittel (Fotos, Messwerte, Dokumente)
          <input data-action="evidence-refs" data-criterion="${criterion.id}" ${disabled}
            value="${esc((evaluation.evidenceRefs ?? []).join(", "))}" placeholder="z. B. Foto_01.jpg, Messprotokoll 12">
        </label>
        ${
          measurement
            ? `<label class="span2">${esc(measurement.label)} in ${esc(measurement.unit)}
                <input type="number" step="any" data-action="measurement" data-criterion="${criterion.id}" ${disabled}
                  value="${esc(measurementValue)}" placeholder="${measurement.min} – ${measurement.max}">
                <span class="fieldnote ${outOfRange ? "bad" : ""}">
                  Plausibilitaetsgrenzen ${measurement.min}–${measurement.max} ${esc(measurement.unit)}${
                    outOfRange ? " · Wert ausserhalb der Plausibilitaetsgrenzen (PROF-004)" : ""
                  }
                </span>
              </label>`
            : ""
        }
        <label class="span2">Manuelles Gate-Ereignis
          <select data-action="gate-select" data-criterion="${criterion.id}" ${disabled}>
            <option value="">kein zusaetzliches Gate</option>
            ${GATES.flatMap((gate) =>
              gate.levels.map((level) => {
                const value = `${gate.code}|${level.key}`;
                const selected = evaluation.gate && `${evaluation.gate.code}|${evaluation.gate.level}` === value;
                return `<option value="${value}" ${selected ? "selected" : ""}>${gate.code} · ${esc(level.label)}${
                  level.floorBp ? ` (Floor ${(level.floorBp / 100).toFixed(1)})` : ""
                }</option>`;
              }),
            ).join("")}
          </select>
        </label>
        <label class="span4">Fachliche Begruendung der Einstufung
          <textarea data-action="reason" data-criterion="${criterion.id}" ${disabled}
            placeholder="Ist-Zustand, Soll-Zustand, Grundlage und Schlussfolgerung">${esc(evaluation.reason ?? "")}</textarea>
        </label>
      </div>

      ${
        risk
          ? `<div class="calcline">
              q = ${evaluation.severity} / 4 = ${(evaluation.severity / 4).toFixed(2).replace(".", ",")} ·
              ${MODIFIER_CODES.map(
                (code) =>
                  `${code} ${(Number(risk.factors[code].value) / 100).toFixed(2).replace(".", ",")}${
                    risk.factors[code].applied ? "" : "*"
                  }`,
              ).join(" · ")} →
              <b>r = ${(Number(risk.rMicro) / 1e6).toFixed(3).replace(".", ",")}</b> ·
              gewichteter Beitrag w · r = <b>${((criterion.weight * Number(risk.rMicro)) / 1e6)
                .toFixed(2)
                .replace(".", ",")}</b>
              ${MODIFIER_CODES.some((code) => !risk.factors[code].applied) ? " · * nicht zugelassen, wirkt mit 1,00" : ""}
            </div>`
          : ""
      }
      ${
        gateActive
          ? `<div class="status-card bad"><b>Gate ${gateRule.code} ausgeloest</b>
              <p>${esc(GATES.find((g) => g.code === gateRule.code)?.trigger ?? "")} · nicht kompensierbar</p></div>`
          : ""
      }
    </article>`;
}

function classPillForSeverity(severity) {
  const tone = severity === 0 ? "ok" : severity <= 2 ? "warn" : "bad";
  const label = SEVERITY_SCALE[severity]?.label ?? "";
  return `<span class="pill ${tone}">Grad ${severity} · ${esc(label)}</span>`;
}

export function viewAssessment({ assessment, profile, result, activeModule }) {
  const modules = profile.modules.length ? profile.modules : [{ key: "ALL", label: "Alle Kriterien" }];
  const current = activeModule && modules.some((m) => m.key === activeModule) ? activeModule : modules[0].key;
  const entries = result.entries.filter((e) => e.criterion.module === current || current === "ALL");

  const moduleButtons = modules
    .map((module) => {
      const moduleEntries = result.entries.filter((e) => e.criterion.module === module.key);
      const done = moduleEntries.filter((e) => e.scored || e.evaluation.applicability !== APPLICABILITY.anwendbar).length;
      return `<button data-action="module" data-module="${module.key}" class="${module.key === current ? "active" : ""}">
        <span>${esc(module.label)}</span><b>${done}/${moduleEntries.length}</b>
      </button>`;
    })
    .join("");

  const coverage = result.coverage.coverageBp;
  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">Schritt 2 · ${esc(profile.id)} ${esc(profile.version)} · ${esc(assessment.scope.objectId || "Objekt")}</span>
        <h2>Kriterienbewertung</h2>
        ${scopeLine(result, assessment.scope)}
      </div>
      <div class="toolbar">
        ${assessment.released ? '<span class="pill ok">freigegeben · schreibgeschuetzt</span>' : ""}
        <button class="secondary" data-action="nav" data-view="trace">Trace</button>
        <button class="primary" data-action="nav" data-view="result">Ergebnis</button>
      </div>
    </div>

    <div class="assessment">
      <div class="card modulelist">
        <h3>Module</h3>
        ${moduleButtons}
        <div class="status-card" style="margin-top:12px">
          <small>Gewichtete Abdeckung</small>
          <b>${coverage === null ? "–" : `${formatScore(coverage)} %`}</b>
          ${bar(coverage ?? 0n, false)}
        </div>
      </div>

      <div>
        ${entries.length ? entries.map((entry) => criterionCard(entry, assessment)).join("") : emptyState("Keine Kriterien in diesem Modul.")}
      </div>

      <div class="sidepanel">
        <div class="card evaluation sticky">
          ${scoreBox(result, { compact: true })}
          ${axes(result)}
          <h4 style="margin-top:14px">Dimensionen</h4>
          ${result.dimensions
            .map(
              (d) => `<div class="status-card">
                <div style="display:flex;justify-content:space-between">
                  <b>${d.code} <small>${(d.weightBp / 100).toFixed(0)} %</small></b>
                  <b>${d.populated ? formatScore(d.valueBp) : "–"}</b>
                </div>
                ${bar(d.valueBp)}
                <small>${d.scoredCount}/${d.criteriaCount} bewertet</small>
              </div>`,
            )
            .join("")}
          ${
            result.release.blockers.length
              ? `<div class="status-card warn"><b>Offen bis zur Freigabe</b><ul>${result.release.blockers
                  .map((b) => `<li>${esc(b)}</li>`)
                  .join("")}</ul></div>`
              : '<div class="status-card ok"><b>Quality Gate erfuellt</b></div>'
          }
        </div>
      </div>
    </div>`;
}

/* --------------------------------------------------------------- Ergebnis */

export function viewResult({ assessment, result, previousResult }) {
  const delta = previousResult ? trend(result, previousResult) : null;
  const drivers = result.dimensions
    .flatMap((d) => d.drivers.map((driver) => ({ ...driver, dimension: d.code })))
    .sort((a, b) => Number(b.contributionMicro - a.contributionMicro))
    .slice(0, 8);

  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">Schritt 3 · Ergebnis</span>
        <h2>Safety-Score® Ergebnis</h2>
        ${scopeLine(result, assessment.scope)}
      </div>
      <div class="toolbar">
        <button class="secondary" data-action="nav" data-view="trace">Berechnungstrace</button>
        <button class="primary" data-action="nav" data-view="release">Zur Freigabe</button>
      </div>
    </div>

    <div class="grid two">
      <div class="card evaluation">
        ${scoreBox(result)}
        ${axes(result)}
        <div class="status-card" style="margin-top:14px">
          <p>${esc(result.nb ? WORDING.nbSentence : WORDING.scoreSentence(result.display, result.class))}</p>
        </div>
        ${
          delta
            ? delta.comparable
              ? `<div class="status-card"><b>Vergleich zur Vorperiode</b>
                  <p>${delta.direction} um ${formatScore(delta.deltaBp < 0n ? -delta.deltaBp : delta.deltaBp)} Punkte ·
                  Klasse ${esc(delta.fromClass)} → ${esc(delta.toClass)}</p></div>`
              : `<div class="status-card warn"><b>Kein Vergleich zur Vorperiode</b><p>${esc(delta.note)}</p></div>`
            : ""
        }
        <p class="fieldnote">${esc(WORDING.disclaimer)}</p>
      </div>

      <div class="card">
        <h3>Dimensionswerte und Treiber</h3>
        <table>
          <tr><th>Dimension</th><th class="num">Gewicht</th><th class="num">Wert</th><th class="num">Beitrag</th></tr>
          ${result.dimensions
            .map(
              (d) => `<tr>
                <td><b>${d.code}</b> ${esc(d.label)}${d.populated ? "" : ' <span class="pill warn">unbewertet</span>'}</td>
                <td class="num">${(d.weightBp / 100).toFixed(0)} %</td>
                <td class="num">${d.populated ? formatScore(d.valueBp) : "–"}</td>
                <td class="num">${((d.weightBp * bpToNumber(d.valueBp)) / 10000).toFixed(2).replace(".", ",")}</td>
              </tr>`,
            )
            .join("")}
          <tr><td colspan="3"><b>Rohscore S_raw</b></td><td class="num"><b>${formatScore(result.rawScoreBp, 2)}</b></td></tr>
          <tr><td colspan="3"><b>Finalwert nach Gates</b></td><td class="num"><b>${
            result.nb ? "NB" : formatScore(result.finalScoreBp, 2)
          }</b></td></tr>
        </table>

        <h4 style="margin-top:16px">Wesentliche Treiber</h4>
        ${
          drivers.length
            ? `<table><tr><th>Kriterium</th><th>Dim.</th><th class="num">Grad</th><th class="num">w · r</th></tr>
              ${drivers
                .map(
                  (driver) => `<tr>
                    <td>${esc(driver.criterionId)}<br><small>${esc(driver.text)}</small></td>
                    <td>${driver.dimension}</td>
                    <td class="num">${driver.severity}</td>
                    <td class="num">${(Number(driver.contributionMicro) / 1e6).toFixed(2).replace(".", ",")}</td>
                  </tr>`,
                )
                .join("")}</table>`
            : emptyState("Keine bewertungsrelevanten Abweichungen erfasst.")
        }
      </div>
    </div>

    <div class="grid three" style="margin-top:16px">
      <div class="card">
        <h3>Compliance</h3>
        <p>${compliancePill(result)} ${esc(COMPLIANCE_STATUS[result.compliance.code]?.definition ?? "")}</p>
        ${
          result.compliance.findings?.length
            ? `<div class="list">${result.compliance.findings
                .map(
                  (f) => `<div class="status-card ${f.status === "nicht erfuellt" ? "bad" : "warn"}">
                    <b>${esc(f.criterionId)}</b>
                    <p>${esc(f.text)}<br><small>${esc(SOURCE_TYPES[f.sourceType]?.label ?? f.sourceType)} · ${esc(
                      f.sourceRef ?? "",
                    )}</small></p>
                  </div>`,
                )
                .join("")}</div>`
            : '<div class="status-card ok">Keine offenen verpflichtenden Anforderungen im Scope.</div>'
        }
        <p class="fieldnote">Compliance wird nicht aus dem Punktwert abgeleitet. Eine Normabweichung ist nicht
        automatisch ein Rechtsverstoss.</p>
      </div>

      <div class="card">
        <h3>Konfidenz</h3>
        <p>${confidencePill(result)} K = ${formatScore(result.confidence.valueBp)} · ${esc(result.confidence.usage)}</p>
        <table>
          <tr><td>A · Abdeckung (40 %)</td><td class="num">${formatScore(result.confidence.A)}</td></tr>
          <tr><td>Q · Evidenzqualitaet (30 %)</td><td class="num">${formatScore(result.confidence.Q)}</td></tr>
          <tr><td>Z · Aktualitaet (15 %)</td><td class="num">${formatScore(result.confidence.Z)}</td></tr>
          <tr><td>R · Review (15 %)</td><td class="num">${formatScore(result.confidence.R)}</td></tr>
        </table>
        ${result.confidence.notes.map((note) => `<div class="status-card warn">${esc(note)}</div>`).join("")}
      </div>

      <div class="card">
        <h3>Abdeckung und Luecken</h3>
        <p>Gewichtete Abdeckung <b>${
          result.coverage.coverageBp === null ? "–" : `${formatScore(result.coverage.coverageBp)} %`
        }</b> (${result.coverage.coveredWeight} von ${result.coverage.applicableWeight} Gewichtspunkten)</p>
        ${bar(result.coverage.coverageBp ?? 0n, false)}
        ${
          result.coverage.gaps.length
            ? `<table style="margin-top:10px"><tr><th>Kriterium</th><th>Grund</th></tr>
              ${result.coverage.gaps
                .slice(0, 12)
                .map(
                  (gap) =>
                    `<tr><td>${esc(gap.criterionId)}${gap.mandatory ? " <small>(Pflicht)</small>" : ""}</td><td>${esc(
                      gap.reason,
                    )}</td></tr>`,
                )
                .join("")}</table>
              ${result.coverage.gaps.length > 12 ? `<small>… und ${result.coverage.gaps.length - 12} weitere</small>` : ""}`
            : '<div class="status-card ok">Keine Abdeckungsluecken.</div>'
        }
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ Gates */

export function viewGates({ assessment, result }) {
  const active = result.gates.active;
  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">Nichtkompensierbarkeit</span>
        <h2>Gates und Mindestwirkungen</h2>
        <p>Gates wirken nach der Rohberechnung. Sie setzen Mindestwerte, Mindestklassen, NB oder eine Freigabesperre
        und koennen nicht durch guenstige Einzelkriterien ausgeglichen werden.</p>
      </div>
    </div>

    <div class="grid two">
      <div class="card evaluation">
        <h3>Aktive Gates (${active.length})</h3>
        ${
          active.length
            ? active
                .map(
                  (gate, index) => `<div class="status-card bad">
                    <div style="display:flex;justify-content:space-between;gap:10px">
                      <b>${esc(gate.code)} · ${esc(gate.levelLabel)}</b>
                      <span class="pill ${gate.effect === "nb" ? "warn" : "bad"}">${
                        gate.effect === "floor"
                          ? `Floor ${(gate.floorBp / 100).toFixed(1).replace(".", ",")} · mind. Klasse ${gate.minClass}`
                          : gate.effect === "nb"
                            ? "NB – kein Zahlenwert"
                            : "Freigabesperre"
                      }</span>
                    </div>
                    <p>${esc(gate.trigger)}</p>
                    <p><small>Ausloeser: ${esc(gate.reason)} · Herkunft: ${esc(gate.origin)}${
                      gate.criterionId ? ` · ${esc(gate.criterionId)}` : ""
                    }</small></p>
                    <p><small><b>Anforderung:</b> ${esc(gate.requirement)}<br>
                    <b>Schliessbedingung:</b> ${esc(gate.closing)}</small></p>
                    ${
                      gate.origin === "manuell" && !assessment.released
                        ? `<button class="secondary" data-action="close-gate" data-index="${index}">Gate mit Nachweis schliessen</button>`
                        : ""
                    }
                  </div>`,
                )
                .join("")
            : '<div class="status-card ok"><b>Kein aktives Gate</b><p>Es liegt kein nichtkompensierbarer Sachverhalt vor.</p></div>'
        }
        ${
          result.gates.appliedFloorBp
            ? `<div class="status-card"><b>Wirksamer Score-Floor</b>
                <p>S_final = max(S_raw ${formatScore(result.rawScoreBp, 2)}; Floor ${(
                  result.gates.appliedFloorBp / 100
                )
                  .toFixed(1)
                  .replace(".", ",")}) = <b>${result.nb ? "NB" : formatScore(result.finalScoreBp, 2)}</b></p></div>`
            : ""
        }
      </div>

      <div class="card">
        <h3>Gate-Katalog der Modellversion ${esc(MODEL_VERSION)}</h3>
        <table>
          <tr><th>Gate</th><th>Ausloeser</th><th>Wirkung</th></tr>
          ${GATES.map(
            (gate) => `<tr>
              <td><b>${gate.code}</b></td>
              <td>${esc(gate.trigger)}</td>
              <td>${gate.levels
                .map((level) =>
                  gate.effect === "floor"
                    ? `${(level.floorBp / 100).toFixed(1).replace(".", ",")} / Klasse ${level.minClass}`
                    : gate.effect === "nb"
                      ? "NB"
                      : "Freigabesperre",
                )
                .join("<br>")}</td>
            </tr>`,
          ).join("")}
        </table>
        <p class="fieldnote">Ein Gate darf nur ueber die definierte Schliessbedingung und einen verifizierten
        Nachweis beendet werden. Ein freies Ueberschreiben des Zahlenwertes ist technisch gesperrt (GOV-004).</p>
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ Trace */

export function viewTrace({ result }) {
  const formula = result.trace.formula;
  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">CALC-009 · Rueckverfolgbarkeit</span>
        <h2>Berechnungstrace</h2>
        <p>Jeder Ergebnisbestandteil ist bis zum einzelnen Kriterium, seinen Faktoren und seiner Quelle erklaerbar.</p>
      </div>
      <div class="toolbar"><button class="secondary" data-action="print">Drucken / PDF</button></div>
    </div>

    <div class="card">
      <h3>Formeln der Modellversion ${esc(result.modelVersion)}</h3>
      <div class="calcline mono">${esc(formula.criterion)}</div>
      <div class="calcline mono">${esc(formula.dimension)}</div>
      <div class="calcline mono">${esc(formula.raw)}</div>
      <div class="calcline mono">${esc(formula.final)}</div>
      <p class="fieldnote">Berechnung in dezimaler Festkommaarithmetik (Basispunkte). Zwischenwerte werden nicht
      gerundet; der Anzeigewert wird auf eine Dezimalstelle gerundet, die Klasse aus dem ungerundeten Wert bestimmt.</p>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Dimensionsebene</h3>
      <table>
        <tr><th>Dim.</th><th class="num">Σ w</th><th class="num">D_d</th><th class="num">alpha_d</th><th class="num">alpha · D</th></tr>
        ${result.trace.dimensions
          .map(
            (d) => `<tr>
              <td>${d.code}</td>
              <td class="num">${d.weightSum}</td>
              <td class="num">${d.populated ? formatScore(d.valueBp, 2) : "–"}</td>
              <td class="num">${(d.weightBp / 10000).toFixed(4).replace(".", ",")}</td>
              <td class="num">${((d.weightBp * bpToNumber(d.valueBp)) / 10000).toFixed(4).replace(".", ",")}</td>
            </tr>`,
          )
          .join("")}
      </table>
      <div class="calcline">
        S_raw = <b>${formatScore(result.rawScoreBp, 2)}</b> ·
        hoechster Gate-Floor = <b>${(result.trace.highestFloorBp / 100).toFixed(2).replace(".", ",")}</b>
        ${result.trace.floorGate ? `(${esc(result.trace.floorGate)})` : ""} ·
        S_final = <b>${result.nb ? "NB" : formatScore(result.finalScoreBp, 2)}</b> · Klasse <b>${esc(result.class)}</b>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Kriteriumsebene</h3>
      <table>
        <tr>
          <th>Kriterium</th><th>Dim.</th><th class="num">w</th><th>Anwendbarkeit</th><th class="num">s</th>
          <th>F_A / F_E / F_R / F_M</th><th class="num">r</th><th class="num">w · r</th><th>Quelle</th>
        </tr>
        ${result.trace.criteria
          .map(
            (c) => `<tr>
              <td>${esc(c.criterionId)}</td>
              <td>${c.dimension}</td>
              <td class="num">${c.weight}</td>
              <td>${esc(c.applicability)}</td>
              <td class="num">${c.severity ?? "–"}</td>
              <td>${
                c.factors
                  ? ["F_A", "F_E", "F_R", "F_M"]
                      .map((code) => `${c.factors[code].value.toFixed(2).replace(".", ",")}${c.factors[code].applied ? "" : "*"}`)
                      .join(" / ")
                  : "–"
              }</td>
              <td class="num">${c.rMicro === null ? "–" : (Number(c.rMicro) / 1e6).toFixed(3).replace(".", ",")}</td>
              <td class="num">${
                c.contributionMicro === null ? "–" : (Number(c.contributionMicro) / 1e6).toFixed(2).replace(".", ",")
              }</td>
              <td><small>${esc(SOURCE_TYPES[c.sourceType]?.label ?? c.sourceType)}</small></td>
            </tr>`,
          )
          .join("")}
      </table>
      <p class="fieldnote">* Modifikator ist fuer diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).</p>
    </div>`;
}

/* --------------------------------------------------------------- Freigabe */

export function viewRelease({ assessment, result }) {
  const gaps = scopeGaps(assessment.scope);
  const checks = [
    ["Scope-Pflichtangaben vollstaendig (PRD 5.2)", gaps.length === 0, gaps.join(", ")],
    [
      `Gewichtete Abdeckung mindestens ${(COVERAGE_RULES.releaseMinCoverageBp / 100).toFixed(1).replace(".", ",")} %`,
      result.coverage.coverageBp !== null && result.coverage.coverageBp >= BigInt(COVERAGE_RULES.releaseMinCoverageBp),
      result.coverage.coverageBp === null ? "keine anwendbaren Kriterien" : `aktuell ${formatScore(result.coverage.coverageBp)} %`,
    ],
    ["Kein KO-06 (kritische Evidenz- oder Pruefumfangsluecke)", !result.nb, result.gates.nbGate?.reason ?? ""],
    [
      `Konfidenz mindestens ${COVERAGE_RULES.releaseMinConfidence}`,
      ["K3", "K4"].includes(result.confidence.klass),
      `aktuell ${result.confidence.klass}`,
    ],
    ["Keine Freigabesperre KO-08", !result.gates.releaseLock, result.gates.releaseLock?.reason ?? ""],
    ["Alle gewichteten Dimensionen bewertet", result.dimensions.every((d) => d.weightBp === 0 || d.populated), ""],
    [
      "Fachreview durchgefuehrt (Vier-Augen oder Senior-Freigabe)",
      ["vier_augen", "senior_freigabe"].includes(assessment.reviewLevel),
      `aktuell ${REVIEW_QUALITY[assessment.reviewLevel]?.label ?? "-"}`,
    ],
    ["Freigabeberechtigte Person benannt", Boolean(assessment.scope.approver?.trim()), ""],
  ];
  const open = checks.filter(([, ok]) => !ok);

  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">Schritt 4 · Qualitaetssicherung</span>
        <h2>Quality Gate und Freigabe</h2>
        <p>Kein finaler Score ohne berechtigte menschliche Freigabe. Finalisierte Ergebnisse sind unveraenderbar;
        Korrekturen erzeugen eine neue Revision.</p>
      </div>
      <div class="toolbar">
        ${
          assessment.released
            ? `<button class="secondary" data-action="revision">Korrekturrevision anlegen</button>`
            : `<button class="primary" data-action="release" ${open.length ? "disabled" : ""}>Ergebnis freigeben</button>`
        }
      </div>
    </div>

    <div class="grid two">
      <div class="card evaluation">
        <h3>Freigabekriterien</h3>
        <div class="list">
          ${checks
            .map(
              ([label, ok, note]) => `<div class="status-card ${ok ? "ok" : "warn"}">
                <b>${ok ? "✓" : "○"} ${esc(label)}</b>
                ${note ? `<p><small>${esc(note)}</small></p>` : ""}
              </div>`,
            )
            .join("")}
        </div>
        ${
          assessment.released
            ? `<div class="status-card ok" style="margin-top:12px">
                <b>Freigegeben</b>
                <p>${esc(assessment.releaseInfo?.by ?? "")} · ${esc(assessment.releaseInfo?.at ?? "")}</p>
                <p class="mono">Ergebnis-ID ${esc(assessment.releaseInfo?.calculationId ?? "")}</p>
              </div>`
            : ""
        }
      </div>

      <div class="card">
        <h3>Review und Rollen</h3>
        <label>Review- und Freigabequalitaet (Teilwert R der Konfidenz)
          <select data-action="review-level" ${assessment.released ? "disabled" : ""}>
            ${selectOptions(
              Object.values(REVIEW_QUALITY).map((r) => [r.key, `${r.label} (${r.value})`]),
              assessment.reviewLevel,
            )}
          </select>
        </label>
        <div class="form-grid" style="margin-top:12px">
          <label>Pruefer<input data-scope="inspector" value="${esc(assessment.scope.inspector)}" ${
            assessment.released ? "disabled" : ""
          }></label>
          <label>Reviewer<input data-scope="reviewer" value="${esc(assessment.scope.reviewer)}" ${
            assessment.released ? "disabled" : ""
          }></label>
          <label class="span2">Freigabeberechtigt<input data-scope="approver" value="${esc(
            assessment.scope.approver,
          )}" ${assessment.released ? "disabled" : ""}></label>
        </div>
        <p class="fieldnote">Ein freies manuelles Ueberschreiben des Zahlenwertes ist nicht zulaessig (GOV-004).
        Korrekturen erfolgen ueber die Eingangsbewertung, eine freigegebene Ausnahmeregel oder ein dokumentiertes Gate.</p>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Berechnungslaeufe und Integritaet</h3>
      ${
        assessment.snapshots.length
          ? `<table>
              <tr><th>Zeitpunkt</th><th>Score</th><th>Klasse</th><th>Input-Hash</th><th>Signatur</th></tr>
              ${assessment.snapshots
                .map(
                  (snapshot) => `<tr>
                    <td>${esc(new Date(snapshot.calculated_at).toLocaleString("de-AT"))}</td>
                    <td class="num">${snapshot.final_score_bp === null ? "NB" : formatScore(snapshot.final_score_bp, 1)}</td>
                    <td>${esc(snapshot.class)}</td>
                    <td class="mono">${esc(snapshot.input_hash.slice(0, 16))}…</td>
                    <td class="mono">${esc(snapshot.signature_hash.slice(0, 16))}…</td>
                  </tr>`,
                )
                .join("")}
            </table>`
          : emptyState("Noch kein finaler Berechnungslauf gespeichert. Der Snapshot entsteht mit der Freigabe.")
      }
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Auditprotokoll (append-only)</h3>
      <table>
        <tr><th>Zeitpunkt</th><th>Ereignis</th><th>Benutzer</th><th>Referenz</th><th>Vorher → Nachher</th></tr>
        ${assessment.audit
          .slice(0, 40)
          .map(
            (event) => `<tr>
              <td>${esc(new Date(event.at).toLocaleString("de-AT"))}</td>
              <td>${esc(event.type)}</td>
              <td>${esc(event.actor)}</td>
              <td>${esc(event.reference ?? "")}</td>
              <td><small>${esc(
                [event.before ? JSON.stringify(event.before) : null, event.after ? JSON.stringify(event.after) : null]
                  .filter(Boolean)
                  .join(" → "),
              )}${event.reason ? ` · ${esc(event.reason)}` : ""}</small></td>
            </tr>`,
          )
          .join("")}
      </table>
    </div>`;
}

/* ---------------------------------------------------------------- Bericht */

export function viewReport({ assessment, result, previousResult }) {
  const scope = assessment.scope;
  const delta = previousResult ? trend(result, previousResult) : null;
  const snapshot = assessment.snapshots[0] ?? null;

  return `
    <div class="section-head no-print">
      <div>
        <span class="eyebrow">Schritt 5 · Kundendokument</span>
        <h2>Safety-Score® Assessment</h2>
        <p>Berichtsausgabe nach REP-001 bis REP-008. Interne Rohbeitraege und QS-Kommentare sind nicht enthalten.</p>
      </div>
      <div class="toolbar"><button class="secondary" data-action="print">Drucken / PDF</button></div>
    </div>

    ${
      assessment.released
        ? ""
        : '<div class="status-card warn no-print"><b>Entwurf</b><p>Das Dokument ist noch nicht freigegeben und darf nicht extern verwendet werden.</p></div>'
    }

    <div class="card">
      <div class="grid two">
        <div>
          <span class="eyebrow">INGTEC GmbH · Safety-Score® Assessment</span>
          <h2>${esc(scope.system || "Bewertungsobjekt")}</h2>
          <p>
            ${esc(scope.company)}${scope.customerNo ? ` · Kundennummer ${esc(scope.customerNo)}` : ""}<br>
            ${esc(scope.site)}${scope.buildingArea ? ` · ${esc(scope.buildingArea)}` : ""}<br>
            Objekt-ID ${esc(scope.objectId)} · ${esc(scope.inspectionType)}
          </p>
          <table>
            <tr><td>Pruefprofil</td><td>${esc(result.profile.id)} ${esc(result.profile.version)} · ${esc(
              result.profile.field,
            )}</td></tr>
            <tr><td>Score-Art</td><td>${esc(result.scoreType)} · ${esc(SCORE_TYPES[result.scoreType]?.label ?? "")}</td></tr>
            <tr><td>Modellversion</td><td>${esc(result.modelVersion)}</td></tr>
            <tr><td>Bewertungsstichtag</td><td>${esc(scope.referenceDate)}</td></tr>
            <tr><td>Gueltig bis</td><td>${esc(scope.validUntil || "nicht festgelegt")}</td></tr>
            <tr><td>Pruefer / Reviewer / Freigabe</td><td>${esc(
              [scope.inspector, scope.reviewer, scope.approver].filter(Boolean).join(" · ") || "offen",
            )}</td></tr>
          </table>
        </div>
        <div>
          ${scoreBox(result)}
          ${axes(result)}
        </div>
      </div>
      <div class="status-card" style="margin-top:14px">
        <p><b>${esc(result.nb ? WORDING.nbSentence : WORDING.scoreSentence(result.display, result.class))}</b></p>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Pruefumfang und Grenzen</h3>
      <table>
        <tr><td>Eingeschlossen</td><td>${esc(scope.included)}</td></tr>
        <tr><td>Ausgeschlossen</td><td>${esc(scope.excluded || "keine Ausschluesse angegeben")}</td></tr>
        <tr><td>Nicht zugaenglich / nicht pruefbar</td><td>${esc(scope.inaccessible || "keine")}</td></tr>
        <tr><td>Grundlagen</td><td>${esc(scope.legalBasis)}</td></tr>
        <tr><td>Messmittel</td><td>${esc(scope.equipment || "–")}</td></tr>
      </table>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Dimensionswerte</h3>
      <table>
        <tr><th>Dimension</th><th>Inhalt</th><th class="num">Gewicht</th><th class="num">Wert</th></tr>
        ${result.dimensions
          .map((d) => {
            const definition = DIMENSIONS.find((dim) => dim.code === d.code);
            return `<tr>
              <td><b>${d.code}</b> ${esc(d.label)}</td>
              <td><small>${esc(definition.content)}</small></td>
              <td class="num">${(d.weightBp / 100).toFixed(0)} %</td>
              <td class="num">${d.populated ? formatScore(d.valueBp) : "–"}</td>
            </tr>`;
          })
          .join("")}
      </table>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Aktive Gates und Handlungsbedarf</h3>
      ${
        result.gates.active.length
          ? `<table><tr><th>Gate</th><th>Ausloeser</th><th>Wirkung</th><th>Schliessbedingung</th></tr>
            ${result.gates.active
              .map(
                (gate) => `<tr>
                  <td><b>${esc(gate.code)}</b></td>
                  <td>${esc(gate.trigger)}<br><small>${esc(gate.reason)}</small></td>
                  <td>${
                    gate.effect === "floor"
                      ? `Mindestwert ${(gate.floorBp / 100).toFixed(1).replace(".", ",")} · Klasse ${gate.minClass}`
                      : gate.effect === "nb"
                        ? "kein belastbarer Zahlenwert"
                        : "Freigabesperre"
                  }</td>
                  <td><small>${esc(gate.closing)}</small></td>
                </tr>`,
              )
              .join("")}</table>`
          : '<p>Es liegt kein aktives Gate vor.</p>'
      }
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Compliance, Konfidenz und Vergleichbarkeit</h3>
      <table>
        <tr><td>Compliance</td><td>${compliancePill(result)} ${esc(
          COMPLIANCE_STATUS[result.compliance.code]?.definition ?? "",
        )}</td></tr>
        <tr><td>Konfidenz</td><td>${confidencePill(result)} K = ${formatScore(result.confidence.valueBp)} · ${esc(
          result.confidence.usage,
        )}</td></tr>
        <tr><td>Vorperiode</td><td>${
          delta
            ? delta.comparable
              ? `${esc(delta.direction)} um ${formatScore(delta.deltaBp < 0n ? -delta.deltaBp : delta.deltaBp)} Punkte (Klasse ${esc(
                  delta.fromClass,
                )} → ${esc(delta.toClass)})`
              : esc(delta.note)
            : "kein kompatibles Vorergebnis vorhanden"
        }</td></tr>
      </table>
      <p class="fieldnote">${esc(WORDING.disclaimer)} Dieses Dokument ist ein Safety-Score® Assessment und keine
      behoerdliche, akkreditierte oder ISO-zertifizierte Bescheinigung.</p>
      ${
        snapshot
          ? `<p class="mono">Ergebnis-ID ${esc(snapshot.calculation_id)}<br>Signatur ${esc(snapshot.signature_hash)}</p>`
          : '<p class="fieldnote">Ergebnis-ID und pruefbarer Hash entstehen mit der Freigabe.</p>'
      }
    </div>`;
}

/* -------------------------------------------------------------- Portfolio */

/** Zeigt das Aggregationsgewicht v = K · X · U als nachvollziehbare Rechnung. */
function aggregationWeightNote(weights = {}) {
  const factor = (group) => {
    const options = AGGREGATION_FACTORS[group].options;
    const option = options.find((o) => o.key === weights?.[group]) ?? options[0];
    return option.value / 100;
  };
  const k = factor("criticality");
  const x = factor("exposure");
  const u = factor("redundancy");
  const format = (value) => value.toFixed(2).replace(".", ",");
  return `v = K · X · U = ${format(k)} · ${format(x)} · ${format(u)} = ${(k * x * u).toFixed(3).replace(".", ",")}`;
}

export function viewPortfolio({ assessments, results, state }) {
  const records = assessments.map((assessment, index) => ({
    result: results[index],
    label: assessment.scope.objectId || assessment.scope.system || `Objekt ${index + 1}`,
    weights: assessment.aggregationWeights,
    released: assessment.released,
    id: assessment.id,
  }));
  const portfolio = aggregate(records, { scoreType: records[0]?.result?.scoreType });

  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">Aggregation</span>
        <h2>Portfolioauswertung</h2>
        <p>Aggregiert werden nur kompatible Score-Arten und Modellversionen. Ein Portfolio wird nie auf eine
        einzelne Zahl reduziert: Verteilung, schlechtester Einzelwert und aktive Gates sind Pflichtangaben.</p>
      </div>
      <div class="toolbar"><button class="secondary" data-action="new-assessment">Bewertung hinzufuegen</button></div>
    </div>

    <div class="grid two">
      <div class="card evaluation">
        ${
          portfolio.nb
            ? `<div class="status-card warn"><b>Keine Aggregation moeglich</b><p>${esc(portfolio.note)}</p></div>`
            : `<div class="scorebox">
                <span class="eyebrow">Safety Portfolio Score</span>
                <div class="value">${formatScore(portfolio.finalBp)} <span class="unit">von 100</span></div>
                <div class="direction">Risikopunkte · niedriger ist besser</div>
                <div class="classline">${CLASS_SYMBOL[portfolio.class]} Klasse ${esc(portfolio.class)} · ${esc(
                  portfolio.classLabel,
                )}</div>
              </div>
              <div class="axes">
                <div class="axis"><small>Gewichteter Mittelwert</small><b>${formatScore(portfolio.meanBp)}</b></div>
                <div class="axis"><small>Gewichtetes P90</small><b>${formatScore(portfolio.p90Bp)}</b></div>
                <div class="axis"><small>Schlechtester Einzelwert</small><b>${formatScore(portfolio.worst.bp)} · ${esc(
                  portfolio.worst.label,
                )}</b></div>
                <div class="axis"><small>Mittlere Konfidenz</small><b>${esc(portfolio.confidenceClass)} · ${formatScore(
                  portfolio.confidenceBp,
                )}</b></div>
              </div>
              <h4 style="margin-top:14px">Klassenverteilung</h4>
              <table>
                <tr>${CLASS_ORDER.map((c) => `<th class="num">${c}</th>`).join("")}</tr>
                <tr>${CLASS_ORDER.map((c) => `<td class="num">${portfolio.distribution[c] ?? 0}</td>`).join("")}</tr>
              </table>
              <p class="fieldnote">${esc(portfolio.note)}</p>`
        }
        ${
          portfolio.nbItems?.length
            ? `<div class="status-card warn"><b>Nicht belastbare Einzelergebnisse</b><ul>${portfolio.nbItems
                .map((item) => `<li>${esc(item.label)}: ${esc(item.reason)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
        ${
          portfolio.excluded?.length
            ? `<div class="status-card"><b>Nicht aggregierbar</b><ul>${portfolio.excluded
                .map((item) => `<li>${esc(item.label)}: ${esc(item.reason)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
      </div>

      <div class="card">
        <h3>Bewertungen</h3>
        <table>
          <tr><th>Objekt</th><th>Profil</th><th class="num">Score</th><th>Klasse</th><th>Compliance</th><th>Aggregationsgewicht</th></tr>
          ${records
            .map(
              (record, index) => `<tr>
                <td>
                  <button class="ghost" data-action="select-assessment" data-id="${record.id}">${esc(record.label)}</button>
                  <br><small>${esc(assessments[index].scope.company || "")}${record.released ? " · freigegeben" : " · Entwurf"}</small>
                </td>
                <td>${esc(record.result.profile.id)}<br><small>${esc(record.result.scoreType)}</small></td>
                <td class="num">${record.result.nb ? "NB" : formatScore(record.result.finalScoreBp)}</td>
                <td>${classPill(record.result.class)}</td>
                <td>${compliancePill(record.result)}</td>
                <td>
                  ${Object.entries(AGGREGATION_FACTORS)
                    .map(
                      ([group, definition]) => `<select data-action="agg-weight" data-id="${record.id}" data-group="${group}"
                        style="margin-bottom:4px">
                        ${selectOptions(
                          definition.options.map((o) => [o.key, `${definition.label}: ${o.label}`]),
                          record.weights?.[group],
                        )}
                      </select>`,
                    )
                    .join("")}
                  <div class="fieldnote">${aggregationWeightNote(record.weights)}</div>
                </td>
              </tr>`,
            )
            .join("")}
        </table>
        <p class="fieldnote">Aggregationsformel: mu = Σ(v · S) / Σ v · S_agg = 0,80 · mu + 0,20 · P90 ·
        S_final = max(S_agg; aktive Gate-Floors).</p>
      </div>
    </div>`;
}

/* ------------------------------------------------------------ Modellkarte */

export function viewModel() {
  return `
    <div class="section-head">
      <div>
        <span class="eyebrow">GOV-008 · Modellkarte</span>
        <h2>Safety-Score® Modell ${esc(MODEL_VERSION)}</h2>
        <p>Zweck, Grenzen, Datengrundlage und Validierungsstand der freigegebenen Modellversion.</p>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <h3>Zweck und Abgrenzung</h3>
        <p>Der INGTEC Safety-Score® ist ein normorientiertes, proprietaeres Risikodefizitmodell fuer technische
        Anlagen, Gebaeude, Betriebsorganisationen, Projekte und Sicherheitsmanagementsysteme. Die Skala reicht von
        0 bis 100 Risikopunkten; 0 bezeichnet den bestmoeglichen nachgewiesenen Zustand innerhalb des Scopes.</p>
        <div class="status-card warn">
          <b>Nichtziele</b>
          <ul>
            <li>Ersetzt keine gesetzlich vorgeschriebene Pruefung, Abnahme oder Bescheinigung.</li>
            <li>Ist keine Unfall-, Brand-, Ausfall- oder Schadenswahrscheinlichkeit.</li>
            <li>Ist keine behoerdliche, akkreditierte oder zertifizierte Aussage.</li>
            <li>Unterschiedliche Score-Arten oder Major-Versionen werden nicht ohne Harmonisierung verglichen.</li>
            <li>KI darf strukturieren und vorschlagen, aber nicht fachlich freigeben.</li>
          </ul>
        </div>
        <p class="fieldnote">Engine ${esc(ENGINE_VERSION)}</p>
      </div>

      <div class="card">
        <h3>Klassen und Managementkonsequenz</h3>
        <table>
          <tr><th>Klasse</th><th>Score</th><th>Bewertung</th><th>Konsequenz</th></tr>
          ${CLASSES.map(
            (klass) => `<tr>
              <td>${CLASS_SYMBOL[klass.code]} <b>${klass.code}</b></td>
              <td>${klass.minInclusive ? "" : ">"}${(klass.minBp / 100).toFixed(1).replace(".", ",")}–${(
                klass.maxBp / 100
              )
                .toFixed(1)
                .replace(".", ",")}</td>
              <td>${esc(klass.label)}</td>
              <td><small>${esc(klass.consequence)}</small></td>
            </tr>`,
          ).join("")}
          <tr><td>? <b>NB</b></td><td>kein Zahlenwert</td><td>nicht belastbar beurteilbar</td>
            <td><small>Kritischer Scope-, Evidenz- oder Integritaetsmangel.</small></td></tr>
        </table>
        <h4 style="margin-top:14px">Konfidenzklassen</h4>
        <table>
          ${CONFIDENCE_CLASSES.map(
            (k) => `<tr><td><b>${k.code}</b></td><td>${k.minBp / 100}–${k.maxBp / 100}</td><td><small>${esc(
              k.usage,
            )}</small></td></tr>`,
          ).join("")}
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Modifikatormatrix (PRD 7.5)</h3>
      <table>
        <tr><th>Dimension</th>${MODIFIER_CODES.map((code) => `<th>${code} · ${esc(MODIFIERS[code].label)}</th>`).join("")}</tr>
        ${DIMENSIONS.map(
          (dimension) => `<tr>
            <td><b>${dimension.code}</b> ${esc(dimension.label)}</td>
            ${MODIFIER_CODES.map((code) => {
              const allowed = MODIFIER_MATRIX[dimension.code][code];
              const note = MODIFIER_MATRIX_NOTES[dimension.code]?.[code];
              return `<td>${allowed ? "ja" : "nein"}${note ? `<br><small>${esc(note)}</small>` : ""}</td>`;
            }).join("")}
          </tr>`,
        ).join("")}
      </table>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Profilregister</h3>
      <table>
        <tr><th>Profil</th><th>Geschaeftsfeld</th><th>Art</th>${DIMENSIONS.map((d) => `<th class="num">${d.code}</th>`).join(
          "",
        )}<th>Status</th></tr>
        ${PROFILES.map(
          (profile) => `<tr>
            <td><b>${esc(profile.id)}</b><br><small>${esc(profile.area)}</small></td>
            <td><small>${esc(profile.field)}</small></td>
            <td>${esc(profile.scoreType)}</td>
            ${DIMENSIONS.map((d) => `<td class="num">${(profile.weightsBp[d.code] / 100).toFixed(0)}</td>`).join("")}
            <td>${
              profile.status === "released"
                ? `<span class="pill ok">freigegeben · ${profile.criteria.length} Kriterien</span>`
                : '<span class="pill neutral">geplant</span>'
            }</td>
          </tr>`,
        ).join("")}
      </table>
      ${NON_SCORED_PROFILES.map(
        (profile) => `<div class="status-card"><b>${esc(profile.id)} · ${esc(profile.field)}</b><p>${esc(
          profile.note,
        )}</p></div>`,
      ).join("")}
      <h4 style="margin-top:14px">Standardgewichtungen (Anhang A)</h4>
      <table>
        <tr><th>Konfiguration</th>${DIMENSIONS.map((d) => `<th class="num">${d.code}</th>`).join("")}</tr>
        ${Object.entries(STANDARD_WEIGHTS)
          .map(
            ([key, weights]) =>
              `<tr><td>${esc(key)}</td>${DIMENSIONS.map((d) => `<td class="num">${weights[d.code]}</td>`).join("")}</tr>`,
          )
          .join("")}
      </table>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Offene Entscheidungen und Validierungsstand</h3>
      <p>Die Gewichtungen der Version 1.0 sind die fachliche Startkonfiguration. Externe Benchmarkfaehigkeit setzt
      die Validierung nach PRD 16 voraus.</p>
      <table>
        <tr><th>Stufe</th><th>Inhalt</th><th>Status</th></tr>
        <tr><td>V0</td><td>Logische Validierung: Formeln, Monotonie, Wertebereiche, N/A, Rundung, Gates, Aggregation</td>
          <td><span class="pill ok">automatisierte Tests vorhanden</span></td></tr>
        <tr><td>V1</td><td>Golden Masters je priorisiertem Profil</td>
          <td><span class="pill warn">Basissatz T-BMA implementiert, Ausbau auf 15 Faelle offen</span></td></tr>
        <tr><td>V2</td><td>Interrater-Pilot mit mindestens 30 Doppelbewertungen</td>
          <td><span class="pill neutral">offen</span></td></tr>
        <tr><td>V3–V5</td><td>Kalibrierung, externe Kriteriumsvaliditaet, laufende Ueberwachung</td>
          <td><span class="pill neutral">offen</span></td></tr>
      </table>
    </div>`;
}

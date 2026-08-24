/**
 * Anwendungssteuerung: Berechnung, Routing und Ereignisbehandlung.
 *
 * Die Oberflaeche berechnet den Score bei jeder Aenderung als Vorschau mit
 * derselben Engine, die auch serverseitig verwendet wird (OFF-002). Die
 * Freigabe erzeugt den unveraenderbaren Snapshot mit Hash (GOV-002/GOV-003).
 */

import { calculateScore } from "../engine/score-engine.js";
import { getProfile } from "../engine/profiles.js";
import { createCalculationRun, AUDIT_TYPES } from "../engine/snapshot.js";
import { formatScore } from "../engine/fixed.js";
import {
  state,
  VIEWS,
  activeAssessment,
  subscribe,
  notify,
  setView,
  updateEvaluation,
  updateScope,
  updateAssessment,
  addAssessment,
  removeAssessment,
  createRevision,
  logAudit,
  scopeGaps,
} from "./state.js";
import { esc, CLASS_SYMBOL } from "./components.js";
import {
  viewScope,
  viewAssessment,
  viewResult,
  viewGates,
  viewTrace,
  viewRelease,
  viewReport,
  viewPortfolio,
  viewModel,
} from "./views.js";

const nav = document.getElementById("nav");
const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const headline = document.getElementById("headline");

/** Berechnet das Ergebnis einer Bewertung. */
function resultFor(assessment) {
  return calculateScore({
    profileId: assessment.profileId,
    evaluations: assessment.evaluations,
    scope: assessment.scope,
    reviewLevel: assessment.reviewLevel,
    gateEvents: assessment.gateEvents,
  });
}

/** Letztes freigegebenes Ergebnis desselben Objekts fuer den Trendvergleich. */
function previousReleasedResult(assessment) {
  const candidates = state.assessments.filter(
    (other) =>
      other.id !== assessment.id &&
      other.released &&
      other.scope.objectId &&
      other.scope.objectId === assessment.scope.objectId,
  );
  if (!candidates.length) return null;
  candidates.sort((a, b) => String(b.releaseInfo?.at ?? "").localeCompare(String(a.releaseInfo?.at ?? "")));
  return resultFor(candidates[0]);
}

function render() {
  const assessment = activeAssessment();
  const profile = getProfile(assessment.profileId);
  const result = resultFor(assessment);
  const ctx = {
    assessment,
    profile,
    result,
    state,
    activeModule: state.activeModule,
    previousResult: previousReleasedResult(assessment),
  };

  nav.innerHTML = VIEWS.map(([key, label, icon]) => {
    const badge =
      key === "gates" && result.gates.active.length
        ? `<em class="badge">${result.gates.active.length}</em>`
        : key === "portfolio"
          ? `<em class="badge">${state.assessments.length}</em>`
          : "";
    return `<button data-action="nav" data-view="${key}" class="${state.view === key ? "active" : ""}">
      <b>${icon}</b><span>${esc(label)}</span>${badge}</button>`;
  }).join("");

  const title = VIEWS.find(([key]) => key === state.view)?.[1] ?? "Safety-Score";
  pageTitle.textContent = title;
  headline.innerHTML = `
    <span class="pill ${result.nb ? "neutral" : result.class === "A" || result.class === "B" ? "ok" : result.class === "C" ? "warn" : "bad"}">
      ${CLASS_SYMBOL[result.class]} ${result.nb ? "NB" : `${formatScore(result.finalScoreBp)} · Klasse ${result.class}`}
    </span>
    <span class="pill neutral">${esc(assessment.scope.objectId || "ohne Objekt-ID")}</span>
    <span class="pill neutral">${esc(profile.id)} ${esc(profile.version)}</span>
    ${assessment.released ? '<span class="pill ok">freigegeben</span>' : '<span class="pill warn">Entwurf</span>'}`;

  const views = {
    scope: viewScope,
    assessment: viewAssessment,
    result: viewResult,
    gates: viewGates,
    trace: viewTrace,
    release: viewRelease,
    report: viewReport,
    model: viewModel,
  };

  if (state.view === "portfolio") {
    content.innerHTML = viewPortfolio({
      assessments: state.assessments,
      results: state.assessments.map(resultFor),
      state,
    });
  } else {
    content.innerHTML = (views[state.view] ?? viewScope)(ctx);
  }

  if (renderedView !== state.view) {
    renderedView = state.view;
    window.scrollTo(0, 0);
  }
}

let renderedView = null;

/* ----------------------------------------------------------- Ereignisse */

function criterionOf(element) {
  return element.dataset.criterion;
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case "nav":
      setView(target.dataset.view);
      break;
    case "module":
      state.activeModule = target.dataset.module;
      notify();
      break;
    case "applicability":
      updateEvaluation(criterionOf(target), {
        applicability: target.dataset.value,
        ...(target.dataset.value === "anwendbar" ? {} : { severity: null }),
      });
      break;
    case "severity":
      updateEvaluation(criterionOf(target), { severity: Number(target.dataset.value) });
      break;
    case "new-assessment":
      addAssessment(activeAssessment().profileId);
      break;
    case "select-assessment":
      state.activeId = target.dataset.id;
      state.view = "assessment";
      notify();
      break;
    case "remove-assessment":
      if (confirm("Diese Bewertung entfernen?")) removeAssessment(target.dataset.id);
      break;
    case "revision":
      createRevision(activeAssessment().id);
      break;
    case "print":
      window.print();
      break;
    case "close-gate":
      closeGate(Number(target.dataset.index));
      break;
    case "release":
      await release();
      break;
    default:
      break;
  }
});

document.addEventListener("change", (event) => {
  const element = event.target;
  const action = element.dataset.action;

  if (element.dataset.scope) {
    updateScope({ [element.dataset.scope]: element.value });
    return;
  }

  switch (action) {
    case "profile-select":
      updateAssessment({ profileId: element.value, evaluations: {} });
      logAudit(AUDIT_TYPES.MODELL_GEAENDERT, {
        reference: element.value,
        reason: "Pruefprofil gewechselt; Bewertungen zurueckgesetzt.",
      });
      notify();
      break;
    case "modifier": {
      const criterionId = criterionOf(element);
      const current = activeAssessment().evaluations[criterionId]?.modifiers ?? {};
      updateEvaluation(criterionId, { modifiers: { ...current, [element.dataset.code]: element.value } });
      break;
    }
    case "evidence-quality":
      updateEvaluation(criterionOf(element), { evidenceQuality: element.value });
      break;
    case "evidence-actuality":
      updateEvaluation(criterionOf(element), { evidenceActuality: element.value });
      break;
    case "evidence-refs":
      updateEvaluation(criterionOf(element), {
        evidenceRefs: element.value.split(",").map((s) => s.trim()).filter(Boolean),
      });
      break;
    case "measurement":
      updateEvaluation(criterionOf(element), {
        measurement: element.value === "" ? null : { value: Number(element.value) },
      });
      break;
    case "reason":
      updateEvaluation(criterionOf(element), { reason: element.value });
      break;
    case "gate-select": {
      const [code, level] = element.value ? element.value.split("|") : [null, null];
      updateEvaluation(criterionOf(element), { gate: code ? { code, level } : null });
      break;
    }
    case "review-level":
      updateAssessment({ reviewLevel: element.value });
      logAudit(AUDIT_TYPES.FACHREVIEW, { reason: `Reviewstufe: ${element.value}` });
      notify();
      break;
    case "agg-weight": {
      const assessment = state.assessments.find((a) => a.id === element.dataset.id);
      if (!assessment) break;
      assessment.aggregationWeights = {
        ...assessment.aggregationWeights,
        [element.dataset.group]: element.value,
      };
      notify();
      break;
    }
    default:
      break;
  }
});

// Laufende Texteingaben werden gespeichert, ohne die Ansicht neu zu zeichnen.
document.addEventListener("input", (event) => {
  const element = event.target;
  if (element.tagName !== "TEXTAREA" && element.type !== "text" && element.type !== "number") return;
  if (element.dataset.scope) {
    updateScope({ [element.dataset.scope]: element.value }, { silent: true });
    return;
  }
  if (element.dataset.action === "reason") {
    updateEvaluation(criterionOf(element), { reason: element.value }, { silent: true });
  }
});

/* -------------------------------------------------------------- Aktionen */

function closeGate(index) {
  const assessment = activeAssessment();
  const result = resultFor(assessment);
  const gate = result.gates.active[index];
  if (!gate || gate.origin !== "manuell") return;
  const evidence = prompt(`Schliessnachweis fuer ${gate.code}\n${gate.closing}`);
  if (!evidence) return;
  const entry = assessment.gateEvents.find((g) => g.code === gate.code && (g.status ?? "open") !== "closed");
  if (!entry) return;
  entry.status = "closed";
  entry.evidence = evidence;
  logAudit(AUDIT_TYPES.GATE_GESCHLOSSEN, { reference: gate.code, reason: evidence });
  notify();
}

async function release() {
  const assessment = activeAssessment();
  const result = resultFor(assessment);
  const gaps = scopeGaps(assessment.scope);
  if (gaps.length || !result.release.eligible || !assessment.scope.approver?.trim()) {
    alert(
      "Freigabe gesperrt:\n" +
        [...gaps.map((g) => `Scope-Pflichtangabe fehlt: ${g}`), ...result.release.blockers]
          .concat(assessment.scope.approver?.trim() ? [] : ["Freigabeberechtigte Person fehlt"])
          .join("\n"),
    );
    return;
  }
  const snapshot = await createCalculationRun(result, {
    reviewers: {
      pruefer: assessment.scope.inspector,
      reviewer: assessment.scope.reviewer,
      freigabe: assessment.scope.approver,
    },
    revision: assessment.revision ?? 1,
  });
  assessment.snapshots.unshift(snapshot);
  assessment.released = true;
  assessment.releaseInfo = {
    by: assessment.scope.approver,
    at: new Date().toLocaleString("de-AT"),
    calculationId: snapshot.calculation_id,
  };
  logAudit(AUDIT_TYPES.BERECHNUNG, {
    reference: snapshot.calculation_id,
    reason: `Engine ${snapshot.engine_version}, Input-Hash ${snapshot.input_hash.slice(0, 16)}…`,
  });
  logAudit(AUDIT_TYPES.FREIGABE, {
    reference: snapshot.calculation_id,
    reason: `Freigabe durch ${assessment.scope.approver}`,
    after: { class: snapshot.class, final_score_bp: snapshot.final_score_bp },
  });
  state.view = "report";
  notify();
}

subscribe(render);
// notify() zeichnet die Oberflaeche und sichert den Ausgangszustand lokal.
notify();

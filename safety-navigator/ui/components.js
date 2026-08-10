/**
 * INGTEC Safety Navigator – Komponenten
 *
 * Die Funktionen dieser Datei entsprechen eins zu eins den in Abschnitt 7
 * vorgesehenen Owl-Komponenten. Sie sind hier als reine Renderfunktionen
 * umgesetzt (Zustand rein, Markup raus), damit die Portierung nach Owl
 * geradlinig bleibt: aus jeder Funktion wird eine Owl-Komponente mit
 * gleichnamigem Template, aus den `data-action`-Attributen werden
 * `t-on-click`-Handler.
 *
 *   SafetyNavigator                     -> ui/app.js
 *   ProgressHeader                      -> ProgressHeader
 *   ObjectTypeSelector                  -> ObjectTypeSelector
 *   BuildingVisualizer / SystemHotspot  -> BuildingVisualizer
 *   SystemSearch                        -> SystemSearch
 *   SystemDetailPanel                   -> SystemDetailPanel
 *   QuestionRenderer                    -> QuestionRenderer
 *   DocumentUploader                    -> DocumentUploader
 *   Portfolio                           -> Portfolio
 *   RequirementResult                   -> RequirementResult
 *   SafetyCheckSummary                  -> SafetyCheckSummary
 *   LeadForm                            -> LeadForm
 *   KnowledgeTooltip                    -> KnowledgeTooltip
 *   MaintenanceInspectionRevisionInfo   -> MaintenanceInspectionRevisionInfo
 *   SaveAndContinue                     -> SaveAndContinue
 *   ResultExport                        -> ResultExport
 */

import { listObjectTypes, getObjectType } from '../core/model/object-types.js';
import { getCategory, listCategories } from '../core/model/system-categories.js';
import {
  getSystemType,
  listSystemTypesForObjectType,
  relevanceMatrix,
} from '../core/model/system-types.js';
import { listInstanceQuestions } from '../core/model/questions.js';
import { OUTCOME_KIND_LABELS } from '../core/model/rules.js';
import { progress, SELECTION_STATES } from '../core/engine/session.js';
import { searchSystemTypes, noResultFallback } from '../core/engine/search.js';
import { renderBuildingSvg } from '../core/visual/building.js';

/**
 * HTML-Escaping für alle eingesetzten Textinhalte.
 * @param {any} value
 * @returns {string}
 */
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Quellenampel laut INGTEC-Systematik.
 * @param {'red'|'yellow'|'green'} status
 * @returns {string}
 */
function sourcePill(status) {
  if (status === 'green') return '<span class="sn-pill sn-pill--green">Fachlich verifiziert</span>';
  if (status === 'yellow') return '<span class="sn-pill sn-pill--yellow">Vorperiode – aktualisieren</span>';
  return '<span class="sn-pill sn-pill--red">Entwurf – fachlich zu prüfen</span>';
}

/**
 * Intervall in lesbarer Form.
 * @param {number|null} months
 * @returns {string}
 */
function formatInterval(months) {
  if (months === null || months === undefined) return 'im Einzelfall zu bestimmen';
  if (months % 12 === 0) return months === 12 ? 'jährlich' : `alle ${months / 12} Jahre`;
  return months === 1 ? 'monatlich' : `alle ${months} Monate`;
}

/* =========================================================================
 * ProgressHeader
 * ====================================================================== */

/**
 * @param {object} session
 * @returns {string}
 */
export function ProgressHeader(session) {
  const state = progress(session);
  const steps = state.steps
    .map(
      (step, index) => `
        <button class="sn-progress-step ${step.done ? 'is-done' : ''} ${step.active ? 'is-active' : ''}"
                data-action="goto-step" data-step="${esc(step.id)}"
                aria-current="${step.active ? 'step' : 'false'}">
          <span class="sn-progress-bar"></span>
          <span class="sn-progress-label">${index + 1}. ${esc(step.label)}</span>
        </button>`,
    )
    .join('');
  return `<nav class="sn-progress" aria-label="Fortschritt">${steps}</nav>`;
}

/* =========================================================================
 * Landingpage (Abschnitt 5)
 * ====================================================================== */

/**
 * @returns {string}
 */
export function LandingPage() {
  return `
    <section class="sn-card">
      <div class="sn-hero">
        <div>
          <span class="sn-eyebrow">INGTEC Safety Navigator</span>
          <h1>Was müssen Sie prüfen lassen?</h1>
          <p>Finden Sie in wenigen Minuten heraus, welche technischen Anlagen und Prüfbereiche
             für Ihren Betrieb relevant sind.</p>
          <div class="sn-btn-row" style="margin-top:16px">
            <button class="sn-btn sn-btn--primary" data-action="start-check">Safety Check starten</button>
          </div>
          <div class="sn-hero-secondary">
            <button class="sn-btn" data-action="entry-known-system">Ich kenne meine Anlage</button>
            <button class="sn-btn" data-action="entry-permit">Ich habe einen Bescheid</button>
            <button class="sn-btn" data-action="entry-quote">Ich benötige ein Angebot</button>
          </div>
        </div>
        <div class="sn-hero-art" aria-hidden="true">
          ${renderBuildingSvg({ title: 'Schematische Gebäudedarstellung' })}
        </div>
      </div>
    </section>

    <section class="sn-card sn-card--eval">
      <h3>So funktioniert der Safety Check</h3>
      <div class="sn-grid sn-grid--4" style="margin-top:12px">
        <div class="sn-metric"><small>Schritt 1</small><strong>Objektart</strong><small>Art des Objekts wählen</small></div>
        <div class="sn-metric"><small>Schritt 2</small><strong>Anlagen</strong><small>Anlagen am Gebäude, in der Liste oder über die Suche markieren</small></div>
        <div class="sn-metric"><small>Schritt 3</small><strong>Angaben</strong><small>Nur die Fragen, die für eine Aussage nötig sind</small></div>
        <div class="sn-metric"><small>Schritt 4</small><strong>Ergebnis</strong><small>Prüfbedarf, Fristen, Unterlagen und Rechtsgrundlagen</small></div>
      </div>
      <p style="margin-top:14px">Der Check ist anonym. Persönliche Daten werden erst erhoben, wenn Sie das
         Ergebnis speichern, ein Angebot erhalten, Unterlagen übermitteln oder eine Beratung vereinbaren möchten.</p>
    </section>`;
}

/* =========================================================================
 * ObjectTypeSelector (Abschnitt 11)
 * ====================================================================== */

/**
 * @param {object} session
 * @returns {string}
 */
export function ObjectTypeSelector(session) {
  const cards = listObjectTypes()
    .map(
      (objectType) => `
        <button class="sn-objecttype ${session.object_type_id === objectType.id ? 'is-active' : ''}"
                data-action="select-object-type" data-object-type="${esc(objectType.id)}"
                aria-pressed="${session.object_type_id === objectType.id}">
          <b>${esc(objectType.name)}</b>
          <span>${esc(objectType.short)}</span>
        </button>`,
    )
    .join('');

  return `
    <section class="sn-card">
      <span class="sn-eyebrow">Schritt 1</span>
      <h2>Um welche Art von Objekt geht es?</h2>
      <p>Die Objektart bestimmt, welche Anlagen und Prüfbereiche überhaupt in Frage kommen.</p>
      <div class="sn-objecttype-grid" style="margin-top:16px">${cards}</div>
    </section>`;
}

/* =========================================================================
 * Ansichtsumschalter (Abschnitt 19)
 * ====================================================================== */

/**
 * @param {object} ui
 * @returns {string}
 */
export function ViewSwitch(ui) {
  const modes = [
    ['building', 'Gebäude'],
    ['list', 'Liste'],
    ['search', 'Suche'],
  ];
  return `
    <div class="sn-viewswitch" role="tablist" aria-label="Ansicht der Anlagenauswahl">
      ${modes
        .map(
          ([id, label]) => `
        <button role="tab" aria-selected="${ui.viewMode === id}"
                class="${ui.viewMode === id ? 'is-active' : ''}"
                data-action="set-view-mode" data-mode="${id}">${label}</button>`,
        )
        .join('')}
    </div>`;
}

/* =========================================================================
 * BuildingVisualizer + SystemHotspot (Abschnitt 16–18)
 * ====================================================================== */

/**
 * @param {object} session
 * @param {object} ui
 * @returns {string}
 */
export function BuildingVisualizer(session, ui) {
  const objectType = getObjectType(session.object_type_id);
  const systemTypes = objectType ? listSystemTypesForObjectType(objectType) : [];

  /** @type {Record<string, string>} */
  const selection = {};
  for (const instance of session.instances) {
    selection[instance.system_type_id] =
      instance.selection === SELECTION_STATES.UNSURE ? 'unsure' : 'has';
  }

  const svg = renderBuildingSvg({
    systemTypes,
    selection,
    focusId: ui.focusSystemTypeId ?? '',
  });

  const transform = `transform:translate(${ui.pan.x}px, ${ui.pan.y}px) scale(${ui.zoom});transform-origin:center center`;

  return `
    <div class="sn-building">
      <div class="sn-building-stage" id="sn-stage">
        <div style="${transform}">${svg}</div>
        <div class="sn-building-controls">
          <button data-action="zoom-in" aria-label="Vergrößern">+</button>
          <button data-action="zoom-out" aria-label="Verkleinern">−</button>
          <button data-action="zoom-reset" aria-label="Ansicht zurücksetzen">⤢</button>
        </div>
        <div class="sn-tooltip" id="sn-tooltip" hidden></div>
      </div>
      <p class="sn-building-hint">
        Anlage antippen oder anklicken, um Details zu öffnen. Am Smartphone markiert der erste Tipp die Anlage,
        der zweite öffnet die Detailansicht. Das Gebäude lässt sich zoomen und verschieben.
        Kleine oder verdeckte Anlagen finden Sie über <b>Liste</b> oder <b>Suche</b>.
      </p>
    </div>`;
}

/* =========================================================================
 * SystemSearch (Abschnitt 20)
 * ====================================================================== */

/**
 * @param {object} session
 * @param {object} ui
 * @returns {string}
 */
export function SystemSearch(session, ui) {
  const objectType = getObjectType(session.object_type_id);
  const pool = objectType ? listSystemTypesForObjectType(objectType) : undefined;
  const hits = ui.query ? searchSystemTypes(ui.query, { pool }) : [];
  const selected = new Set(session.instances.map((instance) => instance.system_type_id));

  let body;
  if (!ui.query) {
    body = `<div class="sn-empty">Geben Sie einen Begriff ein – zum Beispiel <b>Tor</b>, <b>Lift</b>,
              <b>Rauchmelder</b> oder <b>E-Befund</b>. Auch Alltagsbezeichnungen funktionieren.</div>`;
  } else if (hits.length === 0) {
    const fallback = noResultFallback(ui.query);
    body = `
      <div class="sn-empty">
        <p>${esc(fallback.message)}</p>
        <div class="sn-btn-row" style="justify-content:center;margin-top:12px">
          ${fallback.actions
            .map(
              (action) =>
                `<button class="sn-btn" data-action="search-fallback" data-fallback="${esc(action.id)}">${esc(action.label)}</button>`,
            )
            .join('')}
        </div>
      </div>`;
  } else {
    body = `<div class="sn-search-hits">${hits
      .map((hit) => systemRow(hit.system_type, selected, hit.matched_on))
      .join('')}</div>`;
  }

  return `
    <div>
      <label class="sn-field" for="sn-search">
        <span style="font-size:12px;font-weight:800;color:#475467;display:block;margin-bottom:5px">
          Welche Anlage suchen Sie?
        </span>
      </label>
      <input class="sn-search-field" id="sn-search" type="search" autocomplete="off"
             placeholder="Anlage, Synonym oder Alltagsbegriff eingeben"
             value="${esc(ui.query)}" data-action="search-input">
      <div style="margin-top:14px">${body}</div>
    </div>`;
}

/**
 * Eine Zeile der Anlagenliste bzw. Trefferliste.
 * @param {object} systemType
 * @param {Set<string>} selected
 * @param {string} [matchedOn]
 * @returns {string}
 */
function systemRow(systemType, selected, matchedOn) {
  const category = getCategory(systemType.category);
  const isSelected = selected.has(systemType.id);
  const subtitle = matchedOn && matchedOn !== systemType.name ? `Treffer: ${matchedOn}` : systemType.layman_description;

  return `
    <button class="sn-system ${isSelected ? 'is-selected' : ''}"
            data-action="open-detail" data-system-type="${esc(systemType.id)}"
            aria-pressed="${isSelected}">
      <span class="sn-system-icon" style="background:${esc(category ? category.color : '#475467')}">${esc(systemType.icon)}</span>
      <span>
        <b>${esc(systemType.name)}</b>
        <small>${esc(subtitle)}</small>
      </span>
      <span class="sn-system-mark">${isSelected ? '✓' : '+'}</span>
    </button>`;
}

/* =========================================================================
 * Anlagenliste (Abschnitt 19)
 * ====================================================================== */

/**
 * @param {object} session
 * @returns {string}
 */
export function SystemList(session) {
  const objectType = getObjectType(session.object_type_id);
  if (!objectType) return '';
  const systemTypes = listSystemTypesForObjectType(objectType);
  const selected = new Set(session.instances.map((instance) => instance.system_type_id));

  const blocks = listCategories()
    .map((category) => {
      const items = systemTypes.filter(
        (systemType) =>
          systemType.category === category.id ||
          systemType.secondary_categories.includes(category.id),
      );
      if (items.length === 0) return '';
      return `
        <div class="sn-category-block">
          <div class="sn-category-head">
            <span class="sn-category-dot" style="background:${esc(category.color)}"></span>
            <b>${esc(category.name)}</b>
            <span class="sn-pill sn-pill--muted">${items.length}</span>
          </div>
          <div class="sn-system-list">${items.map((item) => systemRow(item, selected)).join('')}</div>
        </div>`;
    })
    .join('');

  return `<div>${blocks}</div>`;
}

/* =========================================================================
 * Portfolio – erfasste Anlagen
 * ====================================================================== */

/**
 * @param {object} session
 * @returns {string}
 */
export function Portfolio(session) {
  if (session.instances.length === 0) {
    return `
      <section class="sn-card sn-card--eval">
        <h3>Ihre Anlagen</h3>
        <p>Noch keine Anlage erfasst. Markieren Sie die Anlagen, die in Ihrem Objekt vorhanden sind.</p>
      </section>`;
  }

  const rows = session.instances
    .map((instance) => {
      const systemType = getSystemType(instance.system_type_id);
      if (!systemType) return '';
      const category = getCategory(systemType.category);
      const unsure = instance.selection === SELECTION_STATES.UNSURE;
      return `
        <div class="sn-system ${unsure ? 'is-unsure' : 'is-selected'}">
          <span class="sn-system-icon" style="background:${esc(category ? category.color : '#475467')}">${esc(systemType.icon)}</span>
          <span>
            <b>${esc(systemType.name)}</b>
            <small>${unsure ? 'Als unsicher markiert – wird fachlich geklärt' : esc(instance.facts.location || 'Standort offen')}</small>
          </span>
          <span>
            <button class="sn-btn sn-btn--link" data-action="open-detail" data-system-type="${esc(systemType.id)}">Details</button>
            <button class="sn-btn sn-btn--link" data-action="remove-instance" data-instance="${esc(instance.id)}">Entfernen</button>
          </span>
        </div>`;
    })
    .join('');

  return `
    <section class="sn-card sn-card--eval">
      <h3>Ihre Anlagen <span class="sn-pill sn-pill--muted">${session.instances.length}</span></h3>
      <div class="sn-system-list" style="margin-top:12px">${rows}</div>
    </section>`;
}

/* =========================================================================
 * MaintenanceInspectionRevisionInfo (Abschnitt 14)
 * ====================================================================== */

/**
 * @param {object} systemType
 * @returns {string}
 */
export function MaintenanceInspectionRevisionInfo(systemType) {
  const pills = relevanceMatrix(systemType)
    .map((entry) => `<span class="sn-pill ${entry.relevant ? 'is-on' : ''}">${esc(entry.label)}</span>`)
    .join('');
  return `<div class="sn-relevance">${pills}</div>`;
}

/* =========================================================================
 * SystemDetailPanel (Abschnitt 17)
 * ====================================================================== */

/**
 * @param {object} session
 * @param {object} ui
 * @returns {string}
 */
export function SystemDetailPanel(session, ui) {
  if (!ui.detailSystemTypeId) return '<div class="sn-drawer" id="sn-drawer"></div>';
  const systemType = getSystemType(ui.detailSystemTypeId);
  if (!systemType) return '<div class="sn-drawer" id="sn-drawer"></div>';

  const instance = session.instances.find((item) => item.system_type_id === systemType.id);
  const isSelected = Boolean(instance);
  const isUnsure = instance?.selection === SELECTION_STATES.UNSURE;
  const category = getCategory(systemType.category);

  const list = (items) => items.map((item) => `<li>${esc(item)}</li>`).join('');
  const standards = [
    ...systemType.standards.trvb,
    ...systemType.standards.onorm,
    ...systemType.standards.en,
    ...systemType.standards.iso,
  ];

  return `
    <div class="sn-drawer is-open" id="sn-drawer" data-action="close-detail-backdrop">
      <div class="sn-drawer-panel" role="dialog" aria-modal="true" aria-label="${esc(systemType.name)}">
        <div class="sn-drawer-head">
          <span class="sn-system-icon" style="background:${esc(category ? category.color : '#475467')}">${esc(systemType.icon)}</span>
          <div>
            <span class="sn-eyebrow">${esc(category ? category.name : '')}</span>
            <h3 style="margin:2px 0 0">${esc(systemType.name)}</h3>
          </div>
          <button class="sn-drawer-close" data-action="close-detail" aria-label="Schließen">Schließen</button>
        </div>

        <p>${esc(systemType.layman_description)}</p>
        ${MaintenanceInspectionRevisionInfo(systemType)}

        <div class="sn-btn-row" style="margin:16px 0">
          <button class="sn-btn ${isSelected && !isUnsure ? 'sn-btn--dark' : 'sn-btn--primary'}"
                  data-action="toggle-system" data-system-type="${esc(systemType.id)}">
            ${isSelected && !isUnsure ? 'Erfasst – wieder entfernen' : 'Habe ich'}
          </button>
          <button class="sn-btn ${isUnsure ? 'sn-btn--dark' : ''}"
                  data-action="mark-unsure" data-system-type="${esc(systemType.id)}">
            ${isUnsure ? 'Unsicher – zurücknehmen' : 'Bin nicht sicher'}
          </button>
        </div>

        <dl class="sn-deflist">
          <div>
            <dt>Auch bekannt als</dt>
            <dd>${esc(systemType.synonyms.join(', '))}</dd>
          </div>
          <div>
            <dt>Technische Beschreibung</dt>
            <dd>${esc(systemType.technical_description)}</dd>
          </div>
          <div>
            <dt>Typische Prüffrist und Prüfart</dt>
            <dd>${esc(formatInterval(
              systemType.typical_interval.unit === 'year'
                ? systemType.typical_interval.value * 12
                : systemType.typical_interval.value,
            ))} · ${esc(systemType.test_type)} · Fristart: ${esc(systemType.interval_type)}
            ${systemType.typical_interval.note ? `<br><small>${esc(systemType.typical_interval.note)}</small>` : ''}</dd>
          </div>
          <div>
            <dt>Zuständigkeit und Fachkunde</dt>
            <dd>${esc(systemType.department)}<br><small>${esc(systemType.expertise)}</small></dd>
          </div>
          <div>
            <dt>Benötigte Unterlagen</dt>
            <dd><ul>${list(systemType.required_documents)}</ul></dd>
          </div>
          <div>
            <dt>Typische Gefährdungen</dt>
            <dd><ul>${list(systemType.typical_hazards)}</ul></dd>
          </div>
          <div>
            <dt>Typische Mängel</dt>
            <dd><ul>${list(systemType.typical_defects)}</ul></dd>
          </div>
          <div>
            <dt>Mögliche Rechtsgrundlagen</dt>
            <dd><ul>${list(systemType.legal_bases)}</ul></dd>
          </div>
          ${
            standards.length
              ? `<div><dt>Normen und Regelwerke</dt><dd><ul>${list(standards)}</ul></dd></div>`
              : ''
          }
          <div>
            <dt>Herstelleranforderungen</dt>
            <dd>${esc(systemType.manufacturer_requirements)}</dd>
          </div>
          <div>
            <dt>Bescheidrelevanz</dt>
            <dd>${systemType.permit_relevant ? 'Ja – behördliche Auflagen sind zu prüfen.' : 'In der Regel nicht bescheidrelevant.'}</dd>
          </div>
          <div>
            <dt>Safety-Score(R)-Kategorie</dt>
            <dd>${esc(systemType.safety_score_category)}</dd>
          </div>
          <div>
            <dt>Quellenstatus</dt>
            <dd>${sourcePill(systemType.source_status)}</dd>
          </div>
        </dl>
      </div>
    </div>`;
}

/* =========================================================================
 * QuestionRenderer
 * ====================================================================== */

/**
 * Rendert die Antwortmöglichkeiten einer Frage.
 * @param {object} question
 * @param {any} current
 * @returns {string}
 */
function answerControls(question, current) {
  const target = `data-fact="${esc(question.fact)}" data-instance="${esc(question.instance_id ?? '')}" data-scope="${esc(question.scope)}"`;

  if (question.type === 'number' || question.type === 'text') {
    return `<input class="sn-answer-input" type="${question.type === 'number' ? 'number' : 'text'}"
                   value="${esc(current ?? '')}" ${target} data-action="answer-input"
                   aria-label="${esc(question.label)}">`;
  }

  if (question.type === 'date_or_unknown') {
    const isUnknown = current === 'unknown';
    return `
      <input type="date" value="${esc(isUnknown ? '' : (current ?? ''))}" ${target}
             data-action="answer-input" aria-label="${esc(question.label)}">
      <button class="${isUnknown ? 'is-active' : ''}" ${target} data-action="answer" data-value="unknown">
        Weiß ich nicht
      </button>`;
  }

  return question.options
    .map((option) => {
      const value = option.value === null ? 'null' : String(option.value);
      const active = String(current ?? '') === value || (current === null && option.value === null);
      return `<button class="${active ? 'is-active' : ''}" ${target} data-action="answer" data-value="${esc(value)}">
                ${esc(option.label)}
              </button>`;
    })
    .join('');
}

/**
 * Liest den aktuellen Wert eines Fakts aus der Session.
 * @param {object} session
 * @param {object} question
 * @returns {any}
 */
function currentAnswer(session, question) {
  const key = question.fact.replace(/^(object|instance)\./, '');
  if (question.scope === 'object') return session.object_facts[key];
  const instance = session.instances.find((item) => item.id === question.instance_id);
  return instance?.facts?.[key];
}

/**
 * @param {object} session
 * @param {object} result Ergebnis aus evaluateSession
 * @returns {string}
 */
export function QuestionRenderer(session, result) {
  // Offene Fragen der Rule Engine zuerst – sie entscheiden über das Ergebnis.
  const open = result.open_questions;

  // Ergänzend die beschreibenden Angaben je erfasster Anlage (Abschnitt 21).
  /** @type {object[]} */
  const descriptive = [];
  for (const instance of session.instances) {
    for (const question of listInstanceQuestions(instance.system_type_id)) {
      const alreadyOpen = open.some(
        (item) => item.fact === question.fact && item.instance_id === instance.id,
      );
      if (alreadyOpen) continue;
      descriptive.push({ ...question, instance_id: instance.id, triggered_by: [] });
    }
  }

  const renderQuestion = (question) => {
    const instance = question.instance_id
      ? session.instances.find((item) => item.id === question.instance_id)
      : null;
    const systemType = instance ? getSystemType(instance.system_type_id) : null;
    const value = currentAnswer(session, question);

    return `
      <div class="sn-question">
        ${systemType ? `<div class="sn-question-context">${esc(systemType.name)}${instance.facts.location ? ` · ${esc(instance.facts.location)}` : ''}</div>` : '<div class="sn-question-context">Objektangabe</div>'}
        <b>${esc(question.label)}</b>
        ${question.help ? `<p class="sn-question-help">${esc(question.help)}</p>` : ''}
        <div class="sn-answers">${answerControls(question, value)}</div>
        ${
          question.triggered_by.length
            ? `<div class="sn-rulehint">Erforderlich für: ${esc(question.triggered_by.join(', '))}</div>`
            : ''
        }
      </div>`;
  };

  if (open.length === 0 && descriptive.length === 0) {
    return `
      <section class="sn-card">
        <span class="sn-eyebrow">Schritt 3</span>
        <h2>Angaben</h2>
        <p>Es sind derzeit keine weiteren Angaben erforderlich. Erfassen Sie zuerst Ihre Anlagen.</p>
      </section>`;
  }

  return `
    <section class="sn-card">
      <span class="sn-eyebrow">Schritt 3</span>
      <h2>Diese Angaben fehlen noch</h2>
      <p>Gefragt wird nur, was für eine belastbare Aussage tatsächlich erforderlich ist.
         Jede Frage stammt aus einer konkreten Regel des Regelwerks.</p>
      ${
        open.length
          ? `<h3 style="margin-top:18px">Entscheidungsrelevant <span class="sn-pill sn-pill--yellow">${open.length}</span></h3>
             ${open.map(renderQuestion).join('')}`
          : `<div class="sn-notice sn-notice--green">Alle entscheidungsrelevanten Fragen sind beantwortet.</div>`
      }
      ${
        descriptive.length
          ? `<h3 style="margin-top:22px">Ergänzende Angaben zur Anlage</h3>
             <p>Diese Angaben ändern das Ergebnis nicht, präzisieren aber Aufwand und Angebot.</p>
             ${descriptive.map(renderQuestion).join('')}`
          : ''
      }
    </section>`;
}

/* =========================================================================
 * DocumentUploader
 * ====================================================================== */

/**
 * @param {object} session
 * @returns {string}
 */
export function DocumentUploader(session) {
  const documents = session.documents
    .map(
      (document) => `
        <div class="sn-doc">
          <span class="sn-system-icon" style="background:#475467">▤</span>
          <span style="flex:1">
            <b>${esc(document.name)}</b>
            <small>${esc(document.document_type)}${document.size ? ` · ${Math.round(document.size / 1024)} kB` : ''}</small>
          </span>
          <button class="sn-btn sn-btn--link" data-action="remove-document" data-document="${esc(document.id)}">Entfernen</button>
        </div>`,
    )
    .join('');

  return `
    <section class="sn-card">
      <span class="sn-eyebrow">Schritt 4</span>
      <h2>Unterlagen</h2>
      <p>Bescheide, Prüfbefunde und Anlagendokumentation präzisieren das Ergebnis erheblich.
         Die Übermittlung ist freiwillig.</p>

      <div class="sn-dropzone" id="sn-dropzone">
        <p style="margin:0 0 10px"><b>Dateien hierher ziehen</b> oder ausw&auml;hlen</p>
        <input type="file" id="sn-file-input" multiple hidden>
        <div class="sn-btn-row" style="justify-content:center">
          <button class="sn-btn sn-btn--primary" data-action="pick-file">Dateien ausw&auml;hlen</button>
          <button class="sn-btn" data-action="pick-photo">Foto aufnehmen</button>
        </div>
      </div>

      ${documents ? `<div class="sn-doclist">${documents}</div>` : ''}

      <div class="sn-notice sn-notice--yellow" style="margin-top:14px">
        Im Prototyp bleiben Dateien ausschließlich im Browser. Es findet keine Übertragung statt.
        In der produktiven Umsetzung erfolgt die Ablage als <code>ir.attachment</code> an der Session
        beziehungsweise über die Navigator-API.
      </div>
    </section>`;
}

/* =========================================================================
 * RequirementResult und SafetyCheckSummary
 * ====================================================================== */

/**
 * @param {object} requirement
 * @returns {string}
 */
function requirementRow(requirement) {
  return `
    <div class="sn-requirement">
      <span class="sn-prio sn-prio-${requirement.priority}" title="Priorität ${requirement.priority}: ${esc(requirement.priority_label)}">
        ${requirement.priority}
      </span>
      <div>
        <b>${esc(requirement.title)}</b>
        <p>${esc(requirement.statement)}</p>
        ${requirement.recommended_action ? `<p><b>Empfohlener Schritt:</b> ${esc(requirement.recommended_action)}</p>` : ''}
        <div class="sn-requirement-meta">
          <span class="sn-pill sn-pill--muted">${esc(requirement.priority_label)}</span>
          <span class="sn-pill sn-pill--muted">${esc(requirement.assertion_quality)}</span>
          ${
            requirement.interval
              ? `<span class="sn-pill sn-pill--muted">${esc(
                  formatInterval(
                    requirement.interval.unit === 'year'
                      ? requirement.interval.value * 12
                      : requirement.interval.value,
                  ),
                )}</span>`
              : ''
          }
          ${sourcePill(requirement.source_status)}
          <code>${esc(requirement.rule_code)} v${esc(requirement.version)}</code>
        </div>
        <p style="margin-top:7px;font-size:13px"><b>Grundlage:</b> ${esc(requirement.legal_basis)}</p>
        ${
          requirement.required_documents.length
            ? `<p style="font-size:13px;margin:4px 0 0"><b>Unterlagen:</b> ${esc(requirement.required_documents.join(', '))}</p>`
            : ''
        }
      </div>
    </div>`;
}

/**
 * @param {object} result
 * @returns {string}
 */
export function SafetyCheckSummary(result) {
  const summary = result.summary;
  const kinds = Object.entries(summary.by_kind)
    .map(
      ([kind, count]) =>
        `<span class="sn-pill sn-pill--muted">${esc(OUTCOME_KIND_LABELS[kind] ?? kind)}: ${count}</span>`,
    )
    .join(' ');

  return `
    <section class="sn-card sn-card--eval">
      <span class="sn-eyebrow">Safety-Check-Ergebnis</span>
      <h2>${esc(result.object_type_name || 'Objekt')} · ${esc(result.reference)}</h2>
      <div class="sn-grid sn-grid--4" style="margin:14px 0">
        <div class="sn-metric"><small>Erfasste Anlagen</small><strong>${summary.system_count}</strong></div>
        <div class="sn-metric"><small>Ermittelte Anforderungen</small><strong>${summary.requirement_count}</strong></div>
        <div class="sn-metric"><small>Offene Fragen</small><strong>${summary.open_question_count}</strong></div>
        <div class="sn-metric"><small>Kürzeste Frist</small><strong>${esc(formatInterval(summary.shortest_interval_months))}</strong></div>
      </div>
      ${kinds ? `<div class="sn-btn-row">${kinds}</div>` : ''}
      ${
        summary.required_documents.length
          ? `<h3 style="margin-top:18px">Benötigte Unterlagen</h3>
             <ul>${summary.required_documents.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
          : ''
      }
      <p style="margin-top:14px;font-size:13px">
        Bewertung, Safety-Score(R) und Benchmarking werden nicht im Navigator berechnet.
        Das Ergebnis wird als Eingangsprofil an den Safety-Score(R) Core übergeben.
      </p>
    </section>`;
}

/**
 * @param {object} result
 * @param {object} session
 * @returns {string}
 */
export function RequirementResult(result, session) {
  if (result.systems.length === 0 && result.object_requirements.length === 0) {
    return `
      <section class="sn-card">
        <h2>Noch kein Ergebnis</h2>
        <p>Erfassen Sie zuerst mindestens eine Anlage.</p>
      </section>`;
  }

  const objectBlock = result.object_requirements.length
    ? `<section class="sn-card">
         <h3>Objektbezogene Feststellungen</h3>
         ${result.object_requirements.map(requirementRow).join('')}
       </section>`
    : '';

  const systemBlocks = result.systems
    .map((system) => {
      const instance = session.instances.find((item) => item.id === system.instance_id);
      const systemType = getSystemType(system.system_type_id);
      const unsure = instance?.selection === SELECTION_STATES.UNSURE;
      const category = getCategory(system.category);

      return `
        <div class="sn-result-system">
          <div class="sn-result-system-head">
            <span class="sn-system-icon" style="background:${esc(category ? category.color : '#475467')}">${esc(systemType ? systemType.icon : '▢')}</span>
            <b style="font-size:16px">${esc(system.system_type_name)}</b>
            ${system.location ? `<span class="sn-pill sn-pill--muted">${esc(system.location)}</span>` : ''}
            ${system.count ? `<span class="sn-pill sn-pill--muted">Anzahl: ${esc(system.count)}</span>` : ''}
            ${unsure ? '<span class="sn-pill sn-pill--yellow">Als unsicher markiert</span>' : ''}
            <span class="sn-pill sn-pill--muted">Frist: ${esc(formatInterval(system.effective_interval_months))}</span>
          </div>
          ${systemType ? MaintenanceInspectionRevisionInfo(systemType) : ''}
          ${
            system.requirements.length
              ? system.requirements.map(requirementRow).join('')
              : `<p style="margin-top:10px">Für diese Anlage konnte noch keine Anforderung abgeleitet werden.
                 ${system.open_questions.length ? 'Beantworten Sie die offenen Fragen in Schritt 3.' : ''}</p>`
          }
          ${
            system.open_questions.length
              ? `<div class="sn-notice sn-notice--yellow" style="margin-top:12px">
                   ${system.open_questions.length} offene Frage(n) – das Ergebnis ist noch nicht abschließend.
                   <button class="sn-btn sn-btn--link" data-action="goto-step" data-step="questions">Jetzt beantworten</button>
                 </div>`
              : ''
          }
        </div>`;
    })
    .join('');

  return `
    ${objectBlock}
    <section class="sn-card">
      <h3>Prüfbedarf je Anlage</h3>
      <p>Sortiert nach Regelpriorität: 1 behördliche Vorgabe, 2 Rechtsvorschrift, 3 technisches Regelwerk,
         4 Norm, 5 Herstelleranforderung, 6 fachliche INGTEC-Empfehlung.</p>
      ${systemBlocks}
    </section>`;
}

/* =========================================================================
 * LeadForm (Abschnitt 9)
 * ====================================================================== */

/**
 * @param {object} session
 * @returns {string}
 */
export function LeadForm(session) {
  return `
    <section class="sn-card" id="sn-leadform">
      <span class="sn-eyebrow">Nächster Schritt</span>
      <h2>Ergebnis sichern oder Angebot anfordern</h2>
      <p>Bis hierher war der Check anonym. Für Angebot, Beratung, Unterlagenübermittlung oder das
         spätere Fortsetzen benötigen wir Kontaktdaten.</p>
      <form class="sn-form-grid" data-action="submit-lead" style="margin-top:14px">
        <div class="sn-field">
          <label for="sn-company">Unternehmen</label>
          <input id="sn-company" name="company_name" value="${esc(session.company_name)}" autocomplete="organization">
        </div>
        <div class="sn-field">
          <label for="sn-contact">Ansprechperson</label>
          <input id="sn-contact" name="contact_name" value="${esc(session.contact_name)}" autocomplete="name">
        </div>
        <div class="sn-field">
          <label for="sn-email">E-Mail</label>
          <input id="sn-email" name="email" type="email" required value="${esc(session.email)}" autocomplete="email">
        </div>
        <div class="sn-field">
          <label for="sn-phone">Telefon</label>
          <input id="sn-phone" name="phone" type="tel" value="${esc(session.phone)}" autocomplete="tel">
        </div>
        <div class="sn-field sn-field--full">
          <label for="sn-intent">Anliegen</label>
          <select id="sn-intent" name="intent">
            <option value="offer">Angebot erhalten</option>
            <option value="advice">Beratung vereinbaren</option>
            <option value="documents">Unterlagen übermitteln</option>
            <option value="save">Ergebnis speichern und später fortsetzen</option>
          </select>
        </div>
        <div class="sn-field sn-field--full">
          <label class="sn-consent">
            <input type="checkbox" name="consent" required>
            <span>Ich stimme zu, dass INGTEC meine Angaben zur Bearbeitung dieser Anfrage verarbeitet.
                  Die Einwilligung ist jederzeit widerrufbar.</span>
          </label>
        </div>
        <div class="sn-field sn-field--full sn-btn-row">
          <button class="sn-btn sn-btn--primary" type="submit">Absenden</button>
          <button class="sn-btn" type="button" data-action="hide-lead">Abbrechen</button>
        </div>
      </form>
      <p style="margin-top:12px;font-size:13px">
        Im Prototyp wird nichts übertragen. In der produktiven Umsetzung entsteht hier ein
        <code>crm.lead</code> mit Verweis auf die Session-Referenz.
      </p>
    </section>`;
}

/* =========================================================================
 * SaveAndContinue und ResultExport
 * ====================================================================== */

/**
 * @param {object} session
 * @param {object} ui
 * @returns {string}
 */
export function SaveAndContinue(session, ui) {
  return `
    <section class="sn-card">
      <h3>Vorgang speichern und später fortsetzen</h3>
      <p>Ihr Vorgang wird unter der Referenz <b>${esc(session.reference)}</b> im Browser gespeichert.
         Notieren Sie die Referenz, um den Check auf diesem Gerät fortzusetzen.</p>
      <div class="sn-btn-row" style="margin-top:12px">
        <button class="sn-btn sn-btn--primary" data-action="save-session">Vorgang speichern</button>
        <button class="sn-btn" data-action="show-lead">Ergebnis per E-Mail sichern</button>
        <button class="sn-btn" data-action="reset-session">Neuen Check starten</button>
      </div>
      <div class="sn-form-grid" style="margin-top:16px">
        <div class="sn-field">
          <label for="sn-resume">Vorgang fortsetzen</label>
          <input id="sn-resume" placeholder="SN-2026-XXXXXX" value="">
        </div>
        <div class="sn-field" style="display:flex;align-items:flex-end">
          <button class="sn-btn" data-action="resume-session">Fortsetzen</button>
        </div>
      </div>
      ${ui.savedAt ? `<p style="margin-top:10px"><b>Gespeichert:</b> ${esc(new Date(ui.savedAt).toLocaleString('de-AT'))}</p>` : ''}
      ${
        !ui.storageAvailable
          ? `<div class="sn-notice sn-notice--red" style="margin-top:12px">
               Der Browserspeicher ist nicht verfügbar. Der Vorgang kann auf diesem Gerät nicht gesichert werden.
             </div>`
          : ''
      }
    </section>`;
}

/**
 * @returns {string}
 */
export function ResultExport() {
  return `
    <div class="sn-btn-row">
      <button class="sn-btn" data-action="export-print">Als PDF drucken</button>
      <button class="sn-btn" data-action="export-json">Ergebnis als JSON</button>
      <button class="sn-btn" data-action="export-score">Safety-Score(R)-Übergabe ansehen</button>
    </div>`;
}

/* =========================================================================
 * Hinweisleisten
 * ====================================================================== */

/**
 * Hinweis zum Freigabestatus des Regelwerks (Abschnitt 24).
 * @param {object} result
 * @param {object} ui
 * @returns {string}
 */
export function ReleaseNotice(result, ui) {
  const internal = ui.audience === 'internal';
  return `
    <div class="sn-notice ${internal ? 'sn-notice--red' : 'sn-notice--yellow'}">
      <b>${internal ? 'Interne Vorschau' : 'Externe Ansicht'}:</b>
      ${
        internal
          ? `Es werden auch Regeln im Entwurfsstatus angezeigt. Diese sind fachlich noch nicht freigegeben
             und dürfen externen Nutzern nicht ausgegeben werden.`
          : `Es werden ausschließlich fachlich freigegebene Regeln ausgegeben.
             ${result.suppressed_rules > 0 ? `${result.suppressed_rules} Regel(n) werden derzeit zurückgehalten.` : ''}`
      }
      <button class="sn-btn sn-btn--link" data-action="toggle-audience">
        ${internal ? 'Externe Ansicht zeigen' : 'Interne Vorschau zeigen'}
      </button>
    </div>`;
}

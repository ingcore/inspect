/**
 * INGTEC Safety Navigator – SafetyNavigator (Wurzelkomponente)
 *
 * Diese Datei entspricht der Owl-Wurzelkomponente `SafetyNavigator` aus
 * Abschnitt 7. Sie montiert den Navigator in einen Container, hält den
 * gemeinsamen Application State und verteilt die Ereignisse an die
 * Teilkomponenten.
 *
 * Montagepunkt ist bewusst identisch mit dem Odoo-Website-Baustein aus
 * Abschnitt 6:
 *
 *   <section class="s_ingtec_safety_navigator"></section>
 */

import {
  addDocument,
  answerQuestion,
  completeSession,
  markUnsure,
  removeDocument,
  removeInstance,
  setContact,
  setObjectFact,
  setObjectType,
  setStep,
  toggleSystem,
} from '../core/engine/session.js';
import { evaluateSession, buildScoreInput } from '../core/engine/rule-engine.js';
import { hotspotTooltip } from '../core/visual/building.js';
import { createStore } from './state.js';
import {
  BuildingVisualizer,
  DocumentUploader,
  LandingPage,
  LeadForm,
  ObjectTypeSelector,
  Portfolio,
  ProgressHeader,
  QuestionRenderer,
  ReleaseNotice,
  RequirementResult,
  ResultExport,
  SafetyCheckSummary,
  SaveAndContinue,
  SystemDetailPanel,
  SystemList,
  SystemSearch,
  ViewSwitch,
  esc,
} from './components.js';

const ZOOM_MIN = 0.7;
const ZOOM_MAX = 3;

/**
 * Wandelt einen data-value-String in den fachlichen Wert zurück.
 * @param {string} raw
 * @returns {any}
 */
function parseValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  return raw;
}

/**
 * Baut aus einem DOM-Element die Frageninformation für `answerQuestion`.
 * @param {HTMLElement} element
 * @returns {{fact: string, scope: string, instance_id: string|null}}
 */
function questionFromElement(element) {
  const instance = element.dataset.instance;
  return {
    fact: element.dataset.fact,
    scope: element.dataset.scope,
    instance_id: instance ? instance : null,
  };
}

/**
 * Montiert den Safety Navigator.
 *
 * @param {HTMLElement} container
 * @returns {{store: object, refresh: Function}}
 */
export function mountSafetyNavigator(container) {
  const store = createStore();

  /** Merkt sich, welcher Hotspot bereits einmal angetippt wurde (Abschnitt 18). */
  let pendingTapId = null;
  /** Zustand des Verschiebens der Gebäudegrafik. */
  const drag = { active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false };

  const hasHover = globalThis.matchMedia?.('(hover: hover)').matches ?? true;

  /* --------------------------------------------------------------------
   * Rendern
   * ----------------------------------------------------------------- */

  function currentResult() {
    const { session, ui } = store.getState();
    return evaluateSession(session, { audience: ui.audience });
  }

  function renderWizard(session, ui, result) {
    switch (session.step) {
      case 'object':
        return ObjectTypeSelector(session);

      case 'systems':
        return `
          <section class="sn-card">
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px">
              <div style="flex:1;min-width:220px">
                <span class="sn-eyebrow">Schritt 2</span>
                <h2 style="margin:2px 0 0">Welche Anlagen sind vorhanden?</h2>
              </div>
              ${ViewSwitch(ui)}
            </div>
            ${
              ui.viewMode === 'building'
                ? BuildingVisualizer(session, ui)
                : ui.viewMode === 'list'
                  ? SystemList(session)
                  : SystemSearch(session, ui)
            }
          </section>
          ${Portfolio(session)}`;

      case 'questions':
        return QuestionRenderer(session, result);

      case 'documents':
        return DocumentUploader(session);

      case 'result':
        return `
          ${ReleaseNotice(result, ui)}
          ${SafetyCheckSummary(result)}
          ${RequirementResult(result, session)}
          <section class="sn-card">
            <h3>Ergebnis weitergeben</h3>
            ${ResultExport()}
          </section>
          ${SaveAndContinue(session, ui)}
          ${ui.showLeadForm ? LeadForm(session) : ''}`;

      default:
        return '';
    }
  }

  function actionBar(session) {
    const steps = ['object', 'systems', 'questions', 'documents', 'result'];
    const index = steps.indexOf(session.step);
    const canForward = session.step !== 'object' || Boolean(session.object_type_id);

    return `
      <div class="sn-actionbar">
        <button class="sn-btn" data-action="step-back" ${index <= 0 ? 'disabled' : ''}>Zurück</button>
        <span class="sn-spacer"></span>
        ${
          session.step === 'result'
            ? `<button class="sn-btn sn-btn--primary" data-action="show-lead">Angebot anfordern</button>`
            : `<button class="sn-btn sn-btn--primary" data-action="step-forward" ${canForward ? '' : 'disabled'}>Weiter</button>`
        }
      </div>`;
  }

  function render() {
    const { session, ui } = store.getState();
    const result = ui.view === 'wizard' ? currentResult() : null;

    const active = document.activeElement;
    const activeId = active && active.id ? active.id : null;
    const selectionStart = active && 'selectionStart' in active ? active.selectionStart : null;

    container.innerHTML = `
      <div class="sn-shell">
        <header class="sn-top">
          <div class="sn-brand">
            <span class="sn-brandmark" aria-hidden="true">I</span>
            <span>
              <strong>INGTEC</strong>
              <small>SAFETY NAVIGATOR</small>
            </span>
          </div>
          <span class="sn-reference">${esc(session.reference)}</span>
        </header>

        ${ui.view === 'wizard' ? ProgressHeader(session) : ''}
        ${ui.message ? `<div class="sn-notice sn-notice--green">${esc(ui.message)}</div>` : ''}
        ${ui.view === 'landing' ? LandingPage() : renderWizard(session, ui, result)}
        ${ui.view === 'wizard' ? actionBar(session) : ''}

        <p class="sn-footnote">
          Prototyp mit Demodaten. Anlagenbibliothek und Regelwerk befinden sich im Entwurfsstatus und sind
          fachlich zu prüfen und freizugeben. Das Ergebnis ersetzt keine sicherheitstechnische Begutachtung
          im Einzelfall.
        </p>
      </div>
      ${ui.view === 'wizard' && session.step === 'systems' ? SystemDetailPanel(session, ui) : ''}`;

    // Fokus und Cursorposition nach dem Neuzeichnen wiederherstellen.
    if (activeId) {
      const restored = container.querySelector(`#${CSS.escape(activeId)}`);
      if (restored) {
        restored.focus();
        if (selectionStart !== null && 'setSelectionRange' in restored) {
          try {
            restored.setSelectionRange(selectionStart, selectionStart);
          } catch {
            /* Eingabetypen ohne Textauswahl ignorieren das. */
          }
        }
      }
    }
  }

  store.subscribe(render);

  /* --------------------------------------------------------------------
   * Aktionen
   * ----------------------------------------------------------------- */

  const steps = ['object', 'systems', 'questions', 'documents', 'result'];

  /** @type {Record<string, (element: HTMLElement, event: Event) => void>} */
  const actions = {
    'start-check': () => store.updateUi({ view: 'wizard', message: '' }),

    'entry-known-system': () => {
      store.updateUi({ view: 'wizard', viewMode: 'search', message: '' });
      store.update((session) => setStep(session, 'systems'));
    },

    'entry-permit': () => {
      store.updateUi({ view: 'wizard', message: 'Bescheid vermerkt – Auflagen werden vorrangig ausgewertet.' });
      store.update((session) => setObjectFact(session, 'permit_exists', true));
    },

    'entry-quote': () => {
      store.updateUi({ view: 'wizard', showLeadForm: true, message: '' });
      store.update((session) => setStep(session, 'result'));
    },

    'select-object-type': (element) => {
      store.update((session) => setStep(setObjectType(session, element.dataset.objectType), 'systems'));
      store.updateUi({ message: '' });
    },

    'goto-step': (element) => store.update((session) => setStep(session, element.dataset.step)),

    'step-forward': () => {
      const { session } = store.getState();
      const next = steps[Math.min(steps.length - 1, steps.indexOf(session.step) + 1)];
      store.update((current) => (next === 'result' ? completeSession(setStep(current, next)) : setStep(current, next)));
      globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
    },

    'step-back': () => {
      const { session } = store.getState();
      const previous = steps[Math.max(0, steps.indexOf(session.step) - 1)];
      store.update((current) => setStep(current, previous));
      globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
    },

    'set-view-mode': (element) => store.updateUi({ viewMode: element.dataset.mode }),

    'open-detail': (element) => store.updateUi({ detailSystemTypeId: element.dataset.systemType }),

    'close-detail': () => store.updateUi({ detailSystemTypeId: null }),

    'close-detail-backdrop': (element, event) => {
      if (event.target === element) store.updateUi({ detailSystemTypeId: null });
    },

    'toggle-system': (element) => {
      store.update((session) => toggleSystem(session, element.dataset.systemType));
      store.updateUi({ detailSystemTypeId: null });
    },

    'mark-unsure': (element) => {
      store.update((session) => markUnsure(session, element.dataset.systemType));
      store.updateUi({ detailSystemTypeId: null });
    },

    'remove-instance': (element) => store.update((session) => removeInstance(session, element.dataset.instance)),

    'search-fallback': (element) => {
      const fallback = element.dataset.fallback;
      if (fallback === 'browse') store.updateUi({ viewMode: 'list' });
      else if (fallback === 'photo') openFilePicker(true);
      else if (fallback === 'advice') store.updateUi({ showLeadForm: true, view: 'wizard' });
      else store.updateUi({ viewMode: 'list', message: 'Kein Problem – suchen Sie die Anlage in der Kategorieliste.' });
    },

    answer: (element) => {
      const question = questionFromElement(element);
      store.update((session) => answerQuestion(session, question, parseValue(element.dataset.value)));
    },

    'zoom-in': () => {
      const { ui } = store.getState();
      store.updateUi({ zoom: Math.min(ZOOM_MAX, ui.zoom * 1.25) });
    },

    'zoom-out': () => {
      const { ui } = store.getState();
      store.updateUi({ zoom: Math.max(ZOOM_MIN, ui.zoom / 1.25) });
    },

    'zoom-reset': () => store.updateUi({ zoom: 1, pan: { x: 0, y: 0 } }),

    'pick-file': () => openFilePicker(false),
    'pick-photo': () => openFilePicker(true),

    'remove-document': (element) => store.update((session) => removeDocument(session, element.dataset.document)),

    'toggle-audience': () => {
      const { ui } = store.getState();
      store.updateUi({ audience: ui.audience === 'internal' ? 'public' : 'internal' });
    },

    'show-lead': () => {
      store.updateUi({ showLeadForm: true });
      requestAnimationFrame(() =>
        container.querySelector('#sn-leadform')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    },

    'hide-lead': () => store.updateUi({ showLeadForm: false }),

    'save-session': () => {
      const ok = store.save();
      store.updateUi({
        message: ok
          ? `Vorgang ${store.getState().session.reference} gespeichert.`
          : 'Speichern nicht möglich – der Browserspeicher ist blockiert.',
      });
    },

    'resume-session': () => {
      const field = container.querySelector('#sn-resume');
      const reference = field ? field.value : '';
      if (!store.resume(reference)) {
        store.updateUi({ message: `Kein gespeicherter Vorgang zu "${reference}" gefunden.` });
      }
    },

    'reset-session': () => {
      store.reset();
      store.updateUi({ view: 'landing' });
    },

    'export-print': () => globalThis.print?.(),

    'export-json': () => {
      const { session } = store.getState();
      downloadJson(`${session.reference}-safety-check.json`, {
        session,
        result: currentResult(),
      });
    },

    'export-score': () => {
      const scoreInput = buildScoreInput(currentResult());
      downloadJson(`${scoreInput.reference}-score-input.json`, scoreInput);
    },
  };

  /* --------------------------------------------------------------------
   * Hilfsfunktionen
   * ----------------------------------------------------------------- */

  function openFilePicker(camera) {
    const input = container.querySelector('#sn-file-input');
    if (!input) return;
    if (camera) input.setAttribute('capture', 'environment');
    else input.removeAttribute('capture');
    input.click();
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Tooltip der Gebäudegrafik (KnowledgeTooltip, Abschnitt 17).
   * @param {HTMLElement|null} hotspot
   */
  function showTooltip(hotspot) {
    const tooltip = container.querySelector('#sn-tooltip');
    const stage = container.querySelector('#sn-stage');
    if (!tooltip || !stage) return;

    if (!hotspot) {
      tooltip.hidden = true;
      return;
    }

    const info = hotspotTooltip(hotspot.dataset.systemType);
    if (!info) return;

    tooltip.innerHTML = `<b>${esc(info.title)}</b><span>${esc(info.text)}</span>`;
    tooltip.hidden = false;

    const stageBox = stage.getBoundingClientRect();
    const spotBox = hotspot.getBoundingClientRect();
    const left = spotBox.left - stageBox.left + spotBox.width / 2;
    const top = spotBox.top - stageBox.top;

    tooltip.style.left = `${Math.max(8, Math.min(left - 140, stageBox.width - 288))}px`;
    tooltip.style.top = `${Math.max(8, top - tooltip.offsetHeight - 12)}px`;
  }

  /* --------------------------------------------------------------------
   * Ereignisse
   * ----------------------------------------------------------------- */

  container.addEventListener('click', (event) => {
    const hotspot = event.target.closest?.('.sn-hotspot');
    if (hotspot && !drag.moved) {
      const systemTypeId = hotspot.dataset.systemType;
      // Abschnitt 18: am Touchgerät markiert der erste Tipp, der zweite öffnet.
      if (!hasHover && pendingTapId !== systemTypeId) {
        pendingTapId = systemTypeId;
        store.updateUi({ focusSystemTypeId: systemTypeId });
        return;
      }
      pendingTapId = null;
      store.updateUi({ detailSystemTypeId: systemTypeId, focusSystemTypeId: systemTypeId });
      return;
    }

    const target = event.target.closest?.('[data-action]');
    if (!target) return;
    const action = actions[target.dataset.action];
    if (!action) return;
    if (target.tagName === 'BUTTON' && target.type !== 'submit') event.preventDefault();
    action(target, event);
  });

  container.addEventListener('keydown', (event) => {
    const hotspot = event.target.closest?.('.sn-hotspot');
    if (hotspot && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      store.updateUi({ detailSystemTypeId: hotspot.dataset.systemType });
      return;
    }
    if (event.key === 'Escape') store.updateUi({ detailSystemTypeId: null });
  });

  container.addEventListener('input', (event) => {
    const element = event.target;
    if (element.id === 'sn-search') {
      store.updateUi({ query: element.value });
      return;
    }
    if (element.dataset?.action === 'answer-input') {
      const question = questionFromElement(element);
      const raw = element.value;
      const value = element.type === 'number' ? (raw === '' ? null : Number(raw)) : raw;
      store.update((session) => answerQuestion(session, question, value));
    }
  });

  container.addEventListener('change', (event) => {
    if (event.target.id !== 'sn-file-input') return;
    const files = [...(event.target.files ?? [])];
    for (const file of files) {
      store.update((session) =>
        addDocument(session, { name: file.name, size: file.size, mimetype: file.type }),
      );
    }
  });

  container.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-action="submit-lead"]');
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    store.update((session) =>
      setContact(session, {
        company_name: data.get('company_name'),
        contact_name: data.get('contact_name'),
        email: data.get('email'),
        phone: data.get('phone'),
        consent: data.get('consent') === 'on',
      }),
    );
    store.updateUi({
      showLeadForm: false,
      message:
        'Danke. Im Prototyp wird nichts übertragen – produktiv entsteht hier ein Lead in Odoo CRM mit Verweis auf die Session-Referenz.',
    });
  });

  // Tooltip nur auf Zeigegeräten (Abschnitt 18: kein Hover-Zwang am Smartphone).
  if (hasHover) {
    container.addEventListener('mouseover', (event) => {
      const hotspot = event.target.closest?.('.sn-hotspot');
      if (hotspot) showTooltip(hotspot);
    });
    container.addEventListener('mouseout', (event) => {
      if (event.target.closest?.('.sn-hotspot')) showTooltip(null);
    });
  }

  // Verschieben der Gebäudegrafik.
  container.addEventListener('pointerdown', (event) => {
    const stage = event.target.closest?.('#sn-stage');
    if (!stage || event.target.closest('.sn-building-controls')) return;
    const { ui } = store.getState();
    drag.active = true;
    drag.moved = false;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.originX = ui.pan.x;
    drag.originY = ui.pan.y;
  });

  container.addEventListener('pointermove', (event) => {
    if (!drag.active) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      drag.moved = true;
      store.updateUi({ pan: { x: drag.originX + dx, y: drag.originY + dy } });
    }
  });

  const endDrag = () => {
    drag.active = false;
    // Der Klick folgt unmittelbar nach dem Pointer-Up; erst danach zurücksetzen.
    setTimeout(() => {
      drag.moved = false;
    }, 0);
  };
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);

  render();
  return { store, refresh: render };
}

/**
 * Automatische Montage: alle Container mit der Baustein-Klasse aus Abschnitt 6.
 * @returns {object[]}
 */
export function autoMount() {
  const containers = document.querySelectorAll('.s_ingtec_safety_navigator, #safety-navigator');
  return [...containers].map((container) => mountSafetyNavigator(container));
}

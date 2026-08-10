/**
 * INGTEC Safety Navigator – Application State
 *
 * Spezifikation Abschnitt 7: "Die Komponenten kommunizieren über einen
 * gemeinsamen Application State."
 *
 * Der Store hält zwei Dinge getrennt:
 *   session – der fachliche Zustand (wird gespeichert und übertragen)
 *   ui      – reiner Darstellungszustand (Ansicht, Panel, Zoom, Tooltip)
 *
 * Nur `session` wird persistiert. Damit bleibt der gespeicherte Vorgang frei
 * von Darstellungsdetails und ist zwischen den Bereitstellungsvarianten
 * austauschbar.
 */

import {
  createSession,
  deserializeSession,
  serializeSession,
} from '../core/engine/session.js';

const STORAGE_KEY = 'ingtec.safety-navigator.session';
const ARCHIVE_KEY = 'ingtec.safety-navigator.archive';

/**
 * Fehlertolerantes Lesen aus dem localStorage. Ein blockierter oder voller
 * Speicher darf den Navigator nie unbenutzbar machen.
 *
 * @param {string} key
 * @returns {string|null}
 */
function readStorage(key) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {boolean} true, wenn gespeichert werden konnte
 */
function writeStorage(key, value) {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Anfangszustand der Darstellung. */
function initialUi() {
  return {
    view: 'landing',
    viewMode: 'building',
    detailSystemTypeId: null,
    focusSystemTypeId: null,
    query: '',
    zoom: 1,
    pan: { x: 0, y: 0 },
    tooltip: null,
    audience: 'internal',
    showLeadForm: false,
    savedAt: null,
    storageAvailable: true,
    message: '',
  };
}

/**
 * Erzeugt den Store.
 * @returns {{getState: Function, subscribe: Function, update: Function, updateUi: Function, save: Function, reset: Function, resume: Function, listArchive: Function}}
 */
export function createStore() {
  const restored = deserializeSession(readStorage(STORAGE_KEY));

  let state = {
    session: restored ?? createSession(),
    ui: initialUi(),
  };

  // Ein wiederhergestellter Vorgang startet nicht auf der Landingpage.
  if (restored && restored.object_type_id) {
    state.ui.view = 'wizard';
  }

  /** @type {Set<Function>} */
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) listener(state);
  }

  function persist() {
    const ok = writeStorage(STORAGE_KEY, serializeSession(state.session));
    state.ui.storageAvailable = ok;
    return ok;
  }

  return {
    getState: () => state,

    /**
     * @param {(state: object) => void} listener
     * @returns {() => void} Abmeldefunktion
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /**
     * Aktualisiert die fachliche Session und persistiert sie.
     * @param {(session: object) => object} updater
     */
    update(updater) {
      state = { ...state, session: updater(state.session) };
      persist();
      notify();
    },

    /**
     * Aktualisiert ausschließlich den Darstellungszustand.
     * @param {Partial<ReturnType<typeof initialUi>>} patch
     */
    updateUi(patch) {
      state = { ...state, ui: { ...state.ui, ...patch } };
      notify();
    },

    /**
     * Legt den Vorgang zusätzlich im Archiv ab, damit er über die Referenz
     * wieder aufgenommen werden kann (SaveAndContinue).
     * @returns {boolean}
     */
    save() {
      const ok = persist();
      try {
        const archive = JSON.parse(readStorage(ARCHIVE_KEY) ?? '{}');
        archive[state.session.reference] = serializeSession(state.session);
        writeStorage(ARCHIVE_KEY, JSON.stringify(archive));
      } catch {
        /* Archiv ist optional – ein Fehler darf den Vorgang nicht stoppen. */
      }
      state = { ...state, ui: { ...state.ui, savedAt: new Date().toISOString() } };
      notify();
      return ok;
    },

    /**
     * Nimmt einen archivierten Vorgang über die Session-Referenz wieder auf.
     * @param {string} reference
     * @returns {boolean}
     */
    resume(reference) {
      try {
        const archive = JSON.parse(readStorage(ARCHIVE_KEY) ?? '{}');
        const session = deserializeSession(archive[String(reference).trim().toUpperCase()]);
        if (!session) return false;
        state = { session, ui: { ...initialUi(), view: 'wizard' } };
        persist();
        notify();
        return true;
      } catch {
        return false;
      }
    },

    /** @returns {string[]} bekannte Referenzen */
    listArchive() {
      try {
        return Object.keys(JSON.parse(readStorage(ARCHIVE_KEY) ?? '{}'));
      } catch {
        return [];
      }
    },

    /** Startet einen neuen, leeren Vorgang. */
    reset() {
      state = { session: createSession(), ui: initialUi() };
      persist();
      notify();
    },
  };
}

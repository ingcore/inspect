/**
 * INGTEC Safety Navigator – Anlagen-Suchmaschine
 *
 * Spezifikation Abschnitt 20. Der Nutzer kennt die fachlich korrekte
 * Bezeichnung einer Anlage in der Regel nicht. Die Suche muss daher über
 * Synonyme, Teilwörter und Laienbegriffe funktionieren.
 *
 * Beispiel: die Eingabe "Tor" findet unter anderem
 *   Kraftbetriebenes Tor, Brandschutztor, Garagentor, Schnelllauftor.
 */

import { SYSTEM_TYPES } from '../model/system-types.js';
import { getCategory } from '../model/system-categories.js';

/**
 * Normalisiert Suchbegriffe: Kleinschreibung, Umlaute, Satzzeichen.
 * @param {string} value
 * @returns {string}
 */
export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Bewertet einen einzelnen Treffer.
 *  100  exakter Name
 *   80  Name beginnt mit dem Suchbegriff
 *   75  Suchbegriff ist ein eigenes Wort im Namen
 *   60  Name enthält den Suchbegriff als Wortbestandteil
 *   50  exaktes Synonym
 *   45  Synonym beginnt mit dem Suchbegriff
 *   42  Suchbegriff ist ein eigenes Wort im Synonym
 *   30  Synonym enthält den Suchbegriff als Wortbestandteil
 *   15  Laienbeschreibung enthält den Suchbegriff
 *   10  technische Beschreibung enthält den Suchbegriff
 *
 * Die Unterscheidung zwischen eigenem Wort und Wortbestandteil ist im
 * Deutschen wesentlich: die Eingabe "Tor" soll "Kraftbetriebenes Tor" vor
 * "Brandschutztor" listen, weil der Begriff dort als eigenständiges Wort
 * vorkommt und nicht nur als Bestandteil einer Zusammensetzung.
 *
 * @param {import('../model/system-types.js').SystemType} systemType
 * @param {string} needle normalisierter Suchbegriff
 * @returns {{score: number, matched_on: string}}
 */
function scoreSystemType(systemType, needle) {
  const name = normalize(systemType.name);
  if (name === needle) return { score: 100, matched_on: systemType.name };
  if (name.startsWith(needle)) return { score: 80, matched_on: systemType.name };
  if (name.split(' ').includes(needle)) return { score: 75, matched_on: systemType.name };
  if (name.includes(needle)) return { score: 60, matched_on: systemType.name };

  let best = { score: 0, matched_on: '' };
  for (const synonym of systemType.synonyms) {
    const value = normalize(synonym);
    let score = 0;
    if (value === needle) score = 50;
    else if (value.startsWith(needle)) score = 45;
    else if (value.split(' ').includes(needle)) score = 42;
    else if (value.includes(needle)) score = 30;
    if (score > best.score) best = { score, matched_on: synonym };
  }
  if (best.score > 0) return best;

  if (normalize(systemType.layman_description).includes(needle)) {
    return { score: 15, matched_on: systemType.layman_description };
  }
  if (normalize(systemType.technical_description).includes(needle)) {
    return { score: 10, matched_on: systemType.technical_description };
  }
  return { score: 0, matched_on: '' };
}

/**
 * Sucht Anlagentypen.
 *
 * @param {string} query
 * @param {object} [options]
 * @param {import('../model/system-types.js').SystemType[]} [options.pool]
 * @param {number} [options.limit=12]
 * @returns {{system_type: object, score: number, matched_on: string, category_name: string}[]}
 */
export function searchSystemTypes(query, options = {}) {
  const pool = options.pool ?? SYSTEM_TYPES;
  const limit = options.limit ?? 12;
  const needle = normalize(query);
  if (needle.length < 2) return [];

  // Mehrwortsuche: jeder Begriff muss irgendwo treffen, gewertet wird der beste.
  const terms = needle.split(' ').filter(Boolean);

  const results = [];
  for (const systemType of pool) {
    if (!systemType.active) continue;
    const scores = terms.map((term) => scoreSystemType(systemType, term));
    if (scores.some((entry) => entry.score === 0)) continue;
    const best = scores.reduce((max, entry) => (entry.score > max.score ? entry : max), scores[0]);
    const total = scores.reduce((sum, entry) => sum + entry.score, 0) / scores.length;
    const category = getCategory(systemType.category);
    results.push({
      system_type: systemType,
      score: total,
      matched_on: best.matched_on,
      category_name: category ? category.name : '',
    });
  }

  return results
    .sort((a, b) => b.score - a.score || a.system_type.sequence - b.system_type.sequence)
    .slice(0, limit);
}

/**
 * Vorschläge, wenn die Suche nichts findet (Abschnitt 20:
 * "Ich kenne die genaue Bezeichnung nicht").
 *
 * @param {string} query
 * @returns {{message: string, actions: {id: string, label: string}[]}}
 */
export function noResultFallback(query) {
  return {
    message: `Zu "${query}" wurde keine Anlage gefunden. Das ist kein Problem – die Anlage lässt sich auch anders bestimmen.`,
    actions: [
      { id: 'photo', label: 'Foto aufnehmen oder hochladen' },
      { id: 'browse', label: 'Nach Kategorie durchsehen' },
      { id: 'unknown', label: 'Ich kenne die genaue Bezeichnung nicht' },
      { id: 'advice', label: 'Beratung anfordern' },
    ],
  };
}

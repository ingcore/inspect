#!/usr/bin/env node
/**
 * Spiegelt den fachlichen Kern in das Odoo-Modul.
 *
 * Der Kern lebt unter `safety-navigator/core`. Odoo lädt Assets nur aus dem
 * `static`-Verzeichnis eines Moduls, deshalb wird der Kern dorthin kopiert.
 * Ein Symlink wäre kürzer, wird aber von manchen Deployment-Werkzeugen und
 * von Odoo.sh nicht zuverlässig übernommen.
 *
 *   node safety-navigator/scripts/sync-core.mjs          kopieren
 *   node safety-navigator/scripts/sync-core.mjs --check   nur prüfen
 *
 * Der Prüfmodus meldet einen Fehler, wenn Kopie und Quelle auseinanderlaufen.
 */

import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MODULE = join(HERE, '..', 'odoo', 'ingtec_safety_navigator');
const SOURCE = join(HERE, '..', 'core');
const TARGET = join(MODULE, 'static', 'src', 'core');

// Das Stylesheet wird ebenfalls gespiegelt: Odoo kann SCSS-Importe außerhalb
// des Modulverzeichnisses nicht auflösen.
const STYLE_SOURCE = join(HERE, '..', 'ui', 'navigator.css');
const STYLE_TARGET = join(MODULE, 'static', 'src', 'scss', '_navigator.scss');

const BANNER = `/*
 * Kopie aus safety-navigator/core – nicht direkt bearbeiten.
 * Änderungen im Kern vornehmen und anschließend ausführen:
 *   node safety-navigator/scripts/sync-core.mjs
 */
`;

/**
 * @param {string} directory
 * @returns {string[]} relative Pfade aller .js-Dateien
 */
function listFiles(directory) {
  const found = [];
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      found.push(...listFiles(full).map((item) => join(entry, item)));
    } else if (entry.endsWith('.js')) {
      found.push(entry);
    }
  }
  return found;
}

const checkOnly = process.argv.includes('--check');
const files = listFiles(SOURCE).sort();
const problems = [];

for (const file of files) {
  const source = BANNER + readFileSync(join(SOURCE, file), 'utf8');
  const destination = join(TARGET, file);

  if (checkOnly) {
    let current = null;
    try {
      current = readFileSync(destination, 'utf8');
    } catch {
      problems.push(`fehlt: static/src/core/${file}`);
      continue;
    }
    if (current !== source) problems.push(`veraltet: static/src/core/${file}`);
    continue;
  }

  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, source, 'utf8');
}

// Stylesheet spiegeln
const styleContent = BANNER.replace('safety-navigator/core', 'safety-navigator/ui/navigator.css')
  + readFileSync(STYLE_SOURCE, 'utf8');

if (checkOnly) {
  let current = null;
  try {
    current = readFileSync(STYLE_TARGET, 'utf8');
  } catch {
    problems.push('fehlt: static/src/scss/_navigator.scss');
  }
  if (current !== null && current !== styleContent) {
    problems.push('veraltet: static/src/scss/_navigator.scss');
  }
} else {
  mkdirSync(dirname(STYLE_TARGET), { recursive: true });
  writeFileSync(STYLE_TARGET, styleContent, 'utf8');
}

if (!checkOnly) {
  // Verwaiste Dateien entfernen, damit gelöschte Kernmodule nicht im Modul
  // zurückbleiben und dort weiter geladen werden.
  const expected = new Set(files);
  let existing = [];
  try {
    existing = listFiles(TARGET);
  } catch {
    existing = [];
  }
  for (const file of existing) {
    if (!expected.has(file)) {
      rmSync(join(TARGET, file));
      console.log(`entfernt: static/src/core/${file}`);
    }
  }
  console.log(`${files.length} Kerndateien und 1 Stylesheet nach ${relative(process.cwd(), MODULE)} gespiegelt.`);
} else if (problems.length) {
  console.error('Der Kern im Odoo-Modul ist nicht aktuell:\n  ' + problems.join('\n  '));
  console.error('\nBeheben mit: node safety-navigator/scripts/sync-core.mjs');
  process.exit(1);
} else {
  console.log(`Kern und Stylesheet im Odoo-Modul sind aktuell (${files.length + 1} Dateien).`);
}

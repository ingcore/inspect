#!/usr/bin/env node
/**
 * Erzeugt die Odoo-Stammdaten aus dem gemeinsamen Kern.
 *
 * Die Anlagenbibliothek und das Regelwerk werden an genau einer Stelle
 * gepflegt – im Kern unter `safety-navigator/core/model`. Dieses Skript
 * erzeugt daraus die Odoo-Datendateien, damit Modul und Web-App nie
 * auseinanderlaufen.
 *
 *   node safety-navigator/scripts/generate-odoo-data.mjs
 *
 * Die erzeugten Dateien sind versioniert; `npm run navigator:check` prüft,
 * ob sie zum Kern passen.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SYSTEM_CATEGORIES } from '../core/model/system-categories.js';
import { OBJECT_TYPES } from '../core/model/object-types.js';
import { SYSTEM_TYPES } from '../core/model/system-types.js';
import { RULES, ANY_SYSTEM } from '../core/model/rules.js';
import { HOTSPOT_GEOMETRY } from '../core/visual/building.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..', 'odoo', 'ingtec_safety_navigator', 'data');

const HEADER = `<?xml version="1.0" encoding="utf-8"?>
<!--
    AUTOMATISCH ERZEUGT – NICHT VON HAND BEARBEITEN.

    Quelle: safety-navigator/core/model
    Neu erzeugen: node safety-navigator/scripts/generate-odoo-data.mjs

    Änderungen an Anlagenbibliothek oder Regelwerk werden im Kern vorgenommen.
    Dadurch bleiben Odoo-Modul (Variante A/C) und externe Web-App (Variante B)
    fachlich identisch.
-->
`;

/** @param {any} value */
function xml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Wandelt eine ID in eine XML-ID-taugliche Form. */
function xmlId(prefix, value) {
  return `${prefix}_${String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

/** JSON -> Python-Literal für `eval`-Attribute. */
function pythonLiteral(value) {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
  if (Array.isArray(value)) return `[${value.map(pythonLiteral).join(', ')}]`;
  return `{${Object.entries(value)
    .map(([key, item]) => `${pythonLiteral(key)}: ${pythonLiteral(item)}`)
    .join(', ')}}`;
}

/** Mehrzeiliges Textfeld aus einer Liste. */
function lines(values) {
  return xml(values.join('\n'));
}

/* -------------------------------------------------------------------------
 * Kategorien
 * ---------------------------------------------------------------------- */

function buildCategories() {
  const records = SYSTEM_CATEGORIES.map(
    (category) => `
        <record id="${xmlId('category', category.id)}" model="ingtec.system.category">
            <field name="code">${xml(category.id)}</field>
            <field name="name">${xml(category.name)}</field>
            <field name="short_description">${xml(category.short)}</field>
            <field name="svg_layer_id">${xml(category.svg_layer_id)}</field>
            <field name="color">${xml(category.color)}</field>
            <field name="icon">${xml(category.icon)}</field>
            <field name="department">${xml(category.department)}</field>
            <field name="sequence">${category.sequence}</field>
            <field name="active" eval="${category.active ? 'True' : 'False'}"/>
        </record>`,
  ).join('\n');

  return `${HEADER}<odoo>
    <data noupdate="0">
${records}
    </data>
</odoo>
`;
}

/* -------------------------------------------------------------------------
 * Objektarten
 * ---------------------------------------------------------------------- */

function buildObjectTypes() {
  const records = OBJECT_TYPES.map((objectType) => {
    const categories = objectType.categories
      .map((category) => `ref('${xmlId('category', category)}')`)
      .join(', ');
    return `
        <record id="${xmlId('object_type', objectType.id)}" model="ingtec.navigator.object_type">
            <field name="code">${xml(objectType.id)}</field>
            <field name="name">${xml(objectType.name)}</field>
            <field name="short_description">${xml(objectType.short)}</field>
            <field name="svg_variant">${xml(objectType.svg_variant)}</field>
            <field name="category_ids" eval="[(6, 0, [${categories}])]"/>
            <field name="priority">${objectType.priority}</field>
            <field name="slug">${xml(objectType.slug)}</field>
            <field name="seo_title">${xml(objectType.seo.title)}</field>
            <field name="seo_description">${xml(objectType.seo.description)}</field>
            <field name="default_facts" eval="${xml(pythonLiteral(objectType.default_facts))}"/>
            <field name="active" eval="${objectType.active ? 'True' : 'False'}"/>
        </record>`;
  }).join('\n');

  return `${HEADER}<odoo>
    <data noupdate="0">
${records}
    </data>
</odoo>
`;
}

/* -------------------------------------------------------------------------
 * Anlagenstamm
 * ---------------------------------------------------------------------- */

function buildSystemTypes() {
  const records = SYSTEM_TYPES.map((systemType) => {
    const geometry = HOTSPOT_GEOMETRY[systemType.id] ?? { x: 0, y: 0, area: '' };
    const secondary = systemType.secondary_categories
      .map((category) => `ref('${xmlId('category', category)}')`)
      .join(', ');
    const synonyms = systemType.synonyms
      .map((synonym, index) => `(0, 0, {'name': ${pythonLiteral(synonym)}, 'sequence': ${(index + 1) * 10}})`)
      .join(', ');

    return `
        <record id="${xmlId('system_type', systemType.id)}" model="ingtec.system.type">
            <field name="code">${xml(systemType.id)}</field>
            <field name="name">${xml(systemType.name)}</field>
            <field name="category_id" ref="${xmlId('category', systemType.category)}"/>
            <field name="secondary_category_ids" eval="[(6, 0, [${secondary}])]"/>
            <field name="synonym_ids" eval="[${synonyms}]"/>
            <field name="layman_description">${xml(systemType.layman_description)}</field>
            <field name="technical_description">${xml(systemType.technical_description)}</field>
            <field name="icon">${xml(systemType.icon)}</field>
            <field name="svg_layer_id">${xml(systemType.svg_layer_id)}</field>
            <field name="svg_object_id">${xml(systemType.svg_object_id)}</field>
            <field name="hotspot_id">${xml(systemType.hotspot_id)}</field>
            <field name="hotspot_x">${geometry.x}</field>
            <field name="hotspot_y">${geometry.y}</field>
            <field name="hotspot_area">${xml(geometry.area)}</field>
            <field name="maintenance_relevant" eval="${systemType.maintenance_relevant ? 'True' : 'False'}"/>
            <field name="inspection_relevant" eval="${systemType.inspection_relevant ? 'True' : 'False'}"/>
            <field name="test_relevant" eval="${systemType.test_relevant ? 'True' : 'False'}"/>
            <field name="revision_relevant" eval="${systemType.revision_relevant ? 'True' : 'False'}"/>
            <field name="interval_value">${systemType.typical_interval.value ?? 0}</field>
            <field name="interval_unit">${xml(systemType.typical_interval.unit ?? 'year')}</field>
            <field name="interval_note">${xml(systemType.typical_interval.note)}</field>
            <field name="interval_type">recurring</field>
            <field name="test_type">${xml(systemType.test_type)}</field>
            <field name="department">${xml(systemType.department)}</field>
            <field name="expertise">${xml(systemType.expertise)}</field>
            <field name="required_documents">${lines(systemType.required_documents)}</field>
            <field name="typical_hazards">${lines(systemType.typical_hazards)}</field>
            <field name="typical_defects">${lines(systemType.typical_defects)}</field>
            <field name="legal_bases">${lines(systemType.legal_bases)}</field>
            <field name="standard_trvb">${lines(systemType.standards.trvb)}</field>
            <field name="standard_onorm">${lines(systemType.standards.onorm)}</field>
            <field name="standard_en">${lines(systemType.standards.en)}</field>
            <field name="standard_iso">${lines(systemType.standards.iso)}</field>
            <field name="manufacturer_requirements">${xml(systemType.manufacturer_requirements)}</field>
            <field name="permit_relevant" eval="${systemType.permit_relevant ? 'True' : 'False'}"/>
            <field name="safety_score_category">${xml(systemType.safety_score_category)}</field>
            <field name="source_status">${xml(systemType.source_status)}</field>
            <field name="sequence">${systemType.sequence}</field>
            <field name="active" eval="${systemType.active ? 'True' : 'False'}"/>
        </record>`;
  }).join('\n');

  return `${HEADER}<odoo>
    <data noupdate="0">
${records}
    </data>
</odoo>
`;
}

/* -------------------------------------------------------------------------
 * Regelwerk
 * ---------------------------------------------------------------------- */

function buildRules() {
  const records = RULES.map((rule) => {
    const systemRef =
      rule.system_type === ANY_SYSTEM
        ? ''
        : `\n            <field name="system_type_id" ref="${xmlId('system_type', rule.system_type)}"/>`;
    const interval = rule.outcome.interval;

    return `
        <record id="${xmlId('rule', rule.code)}" model="ingtec.rule">
            <field name="code">${xml(rule.code)}</field>
            <field name="title">${xml(rule.title)}</field>${systemRef}
            <field name="scope">${rule.scope === 'object' ? 'object' : 'instance'}</field>
            <field name="conditions" eval="${xml(pythonLiteral(rule.conditions))}"/>
            <field name="outcome_kind">${xml(rule.outcome.kind)}</field>
            <field name="outcome_statement">${xml(rule.outcome.statement)}</field>
            <field name="outcome_interval_value">${interval ? interval.value : 0}</field>
            <field name="outcome_interval_unit">${interval ? xml(interval.unit) : 'year'}</field>
            <field name="outcome_documents">${lines(rule.outcome.required_documents ?? [])}</field>
            <field name="recommended_action">${xml(rule.outcome.recommended_action ?? '')}</field>
            <field name="assertion_quality">${xml(rule.assertion_quality.key)}</field>
            <field name="priority">${rule.priority}</field>
            <field name="legal_basis">${xml(rule.legal_basis)}</field>
            <field name="version">${xml(rule.version)}</field>
            <field name="valid_from">${xml(rule.valid_from)}</field>
            <field name="state">${xml(rule.state)}</field>
            <field name="source_status">${xml(rule.source_status)}</field>
        </record>`;
  }).join('\n');

  return `${HEADER}<odoo>
    <!--
        Alle Regeln werden im Status "draft" ausgeliefert. Sie erzeugen damit
        keine Ergebnisse für externe Nutzer (Spezifikation Abschnitt 24).
        Die Freigabe erfolgt im Backend über "Regelwerk > Freigabe offen"
        durch die fachliche Leitung.

        noupdate="1": ein Modul-Upgrade darf einen bereits freigegebenen
        Regelstand nicht wieder auf "draft" zurücksetzen.
    -->
    <data noupdate="1">
${records}
    </data>
</odoo>
`;
}

/* -------------------------------------------------------------------------
 * Ausgabe
 * ---------------------------------------------------------------------- */

const files = [
  ['system_category_data.xml', buildCategories()],
  ['object_type_data.xml', buildObjectTypes()],
  ['system_type_data.xml', buildSystemTypes()],
  ['rule_data.xml', buildRules()],
];

const checkOnly = process.argv.includes('--check');

if (checkOnly) {
  const stale = [];
  for (const [name, content] of files) {
    let current = null;
    try {
      current = readFileSync(join(DATA_DIR, name), 'utf8');
    } catch {
      stale.push(`fehlt: data/${name}`);
      continue;
    }
    if (current !== content) stale.push(`veraltet: data/${name}`);
  }
  if (stale.length) {
    console.error('Die Odoo-Stammdaten passen nicht zum Kern:\n  ' + stale.join('\n  '));
    console.error('\nBeheben mit: node safety-navigator/scripts/generate-odoo-data.mjs');
    process.exit(1);
  }
  console.log(`Odoo-Stammdaten sind aktuell (${files.length} Dateien).`);
} else {
  mkdirSync(DATA_DIR, { recursive: true });
  for (const [name, content] of files) {
    writeFileSync(join(DATA_DIR, name), content, 'utf8');
    console.log(`geschrieben: data/${name}`);
  }
  console.log(
    `\n${SYSTEM_CATEGORIES.length} Kategorien, ${OBJECT_TYPES.length} Objektarten, ` +
      `${SYSTEM_TYPES.length} Anlagentypen, ${RULES.length} Regeln.`,
  );
}

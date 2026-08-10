/*
 * Kopie aus safety-navigator/core – nicht direkt bearbeiten.
 * Änderungen im Kern vornehmen und anschließend ausführen:
 *   node safety-navigator/scripts/sync-core.mjs
 */
/**
 * INGTEC Safety Navigator – Anlagenkategorien
 *
 * Modell laut Spezifikation Abschnitt 12: `ingtec.system.category`
 *
 * Die Kategorien bilden die oberste fachliche Gliederung der Anlagenbibliothek.
 * Sie steuern zugleich die Layer der SVG-Gebäudevisualisierung und die
 * Zuständigkeit der INGTEC-Fachbereiche.
 *
 * @typedef {object} SystemCategory
 * @property {string}  id            Technische ID (Odoo: XML-ID Suffix)
 * @property {string}  name          Anzeigename
 * @property {string}  short         Kurzbeschreibung für Laien
 * @property {string}  svg_layer_id  Zugehöriger Layer in der Gebäudegrafik
 * @property {string}  color         Darstellungsfarbe (Hotspots, Chips, Badges)
 * @property {string}  icon          Textuelles Icon (Prototyp; in Odoo: SVG)
 * @property {string}  department    Zuständiger INGTEC-Fachbereich
 * @property {number}  sequence      Sortierreihenfolge
 * @property {boolean} active
 */

/** @type {SystemCategory[]} */
export const SYSTEM_CATEGORIES = [
  {
    id: 'brandschutz',
    name: 'Brandschutz',
    short: 'Anlagen zur Branderkennung, Alarmierung, Rauchableitung und Löschung.',
    svg_layer_id: 'layer_fire_protection',
    color: '#d92d20',
    icon: '△',
    department: 'Brandschutztechnik',
    sequence: 10,
    active: true,
  },
  {
    id: 'arbeitsmittel',
    name: 'Arbeitsmittel',
    short: 'Geräte, Maschinen und Anlagen, die im Betrieb zur Arbeit verwendet werden.',
    svg_layer_id: 'layer_work_equipment',
    color: '#5f7600',
    icon: '⚙',
    department: 'Arbeitsmittel und Maschinensicherheit',
    sequence: 20,
    active: true,
  },
  {
    id: 'maschinensicherheit',
    name: 'Maschinensicherheit',
    short: 'Sicherheitstechnische Beurteilung von Maschinen und verketteten Anlagen.',
    svg_layer_id: 'layer_work_equipment',
    color: '#7a5af8',
    icon: '⛭',
    department: 'Arbeitsmittel und Maschinensicherheit',
    sequence: 30,
    active: true,
  },
  {
    id: 'elektrotechnik',
    name: 'Elektrotechnik',
    short: 'Elektrische Anlagen, Betriebsmittel, Blitz- und Überspannungsschutz.',
    svg_layer_id: 'layer_energy',
    color: '#b77900',
    icon: '↯',
    department: 'Elektrotechnik',
    sequence: 40,
    active: true,
  },
  {
    id: 'gebaeudetechnik',
    name: 'Gebäudetechnik',
    short: 'Haustechnische Anlagen wie Aufzug, Lüftung, Energie- und Druckanlagen.',
    svg_layer_id: 'layer_building_services',
    color: '#0d7490',
    icon: '▤',
    department: 'Gebäude- und Anlagentechnik',
    sequence: 50,
    active: true,
  },
  {
    id: 'arbeitnehmerschutz',
    name: 'Arbeitnehmerschutz',
    short: 'Organisatorische und bauliche Anforderungen an Arbeitsstätten.',
    svg_layer_id: 'layer_building',
    color: '#344054',
    icon: '☗',
    department: 'Arbeitnehmerschutz',
    sequence: 60,
    active: true,
  },
  {
    id: 'absturzsicherung',
    name: 'Absturzsicherung',
    short: 'Anschlagpunkte, Geländer, Sekuranten und Systeme gegen Absturz.',
    svg_layer_id: 'layer_fall_protection',
    color: '#e04f16',
    icon: '↥',
    department: 'Absturzsicherung und PSAgA',
    sequence: 70,
    active: true,
  },
  {
    id: 'verkehrstechnik',
    name: 'Verkehrstechnik',
    short: 'Innerbetrieblicher Verkehr, Verkehrsanlagen und Eisenbahnanlagen.',
    svg_layer_id: 'layer_traffic',
    color: '#475467',
    icon: '⇄',
    department: 'Verkehrs- und Eisenbahntechnik',
    sequence: 80,
    active: true,
  },
];

/** @type {Map<string, SystemCategory>} */
const BY_ID = new Map(SYSTEM_CATEGORIES.map((category) => [category.id, category]));

/**
 * @param {string} id
 * @returns {SystemCategory | undefined}
 */
export function getCategory(id) {
  return BY_ID.get(id);
}

/**
 * Kategorien in Anzeigereihenfolge.
 * @returns {SystemCategory[]}
 */
export function listCategories() {
  return SYSTEM_CATEGORIES.filter((category) => category.active).sort(
    (a, b) => a.sequence - b.sequence,
  );
}

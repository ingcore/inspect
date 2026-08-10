/**
 * INGTEC Safety Navigator – Gebäudevisualisierung
 *
 * Spezifikation Abschnitt 16: Primärformat ist SVG, nicht JPG. Die Grafik ist
 * skalierbar, responsive, hotspot- und statusfähig, unterstützt Hover- und
 * Statusfarben, ist datensparsam und erlaubt barrierefreie Labels.
 *
 * Layerstruktur laut Abschnitt 16:
 *
 *   svg-building
 *    ├── layer_building
 *    ├── layer_fire_protection      (system_bma, system_rwa, system_sprinkler, …)
 *    ├── layer_work_equipment       (system_crane, system_gate, system_lift, …)
 *    ├── layer_energy               (system_pv, system_battery, …)
 *    ├── layer_building_services
 *    ├── layer_fall_protection
 *    └── layer_traffic
 *
 * Die Hotspot-Positionen sind bewusst hier hinterlegt und nicht im Frontend:
 * damit nutzen die Odoo-Owl-Komponente und die externe Web-App exakt dieselbe
 * Geometrie (Variante A, B und C der Zielarchitektur).
 */

import { SYSTEM_TYPES, getSystemType } from '../model/system-types.js';
import { getCategory } from '../model/system-categories.js';

export const BUILDING_VIEWBOX = { width: 1000, height: 560 };

/**
 * Hotspot-Geometrie je Anlagentyp.
 * @type {Record<string, {x: number, y: number, area: string}>}
 */
export const HOTSPOT_GEOMETRY = {
  // Brandschutz
  'SYS-AT-BMA-001': { x: 150, y: 243, area: 'Produktionshalle' },
  'SYS-AT-BMZ-001': { x: 612, y: 432, area: 'Büroteil Erdgeschoss' },
  'SYS-AT-DET-001': { x: 390, y: 205, area: 'Hallendecke' },
  'SYS-AT-MCP-001': { x: 545, y: 405, area: 'Hallenausgang' },
  'SYS-AT-FCTRL-001': { x: 762, y: 262, area: 'Büroteil Technik' },
  'SYS-AT-RWA-001': { x: 240, y: 168, area: 'Hallendach' },
  'SYS-AT-BRE-001': { x: 402, y: 178, area: 'Hallendach' },
  'SYS-AT-DBA-001': { x: 905, y: 300, area: 'Stiegenhaus' },
  'SYS-AT-SPR-001': { x: 310, y: 214, area: 'Hallendecke' },
  'SYS-AT-HYD-001': { x: 85, y: 332, area: 'Hallenwand' },
  'SYS-AT-RISER-001': { x: 862, y: 400, area: 'Gebäudekern' },
  'SYS-AT-EXT-001': { x: 480, y: 400, area: 'Halle' },
  'SYS-AT-FDOOR-001': { x: 570, y: 432, area: 'Übergang Halle/Büro' },
  'SYS-AT-FGATE-001': { x: 200, y: 332, area: 'Hallenabschnitt' },
  'SYS-AT-HOLD-001': { x: 690, y: 400, area: 'Bürogang' },
  'SYS-AT-EMLIGHT-001': { x: 650, y: 265, area: 'Büroteil Obergeschoss' },
  'SYS-AT-EXITSIGN-001': { x: 930, y: 440, area: 'Notausgang' },

  // Arbeitsmittel
  'SYS-AT-GATE-001': { x: 110, y: 425, area: 'Hallentor' },
  'SYS-AT-CRANE-001': { x: 155, y: 300, area: 'Halle' },
  'SYS-AT-OHCRANE-001': { x: 300, y: 268, area: 'Kranbahn' },
  'SYS-AT-MEWP-001': { x: 440, y: 355, area: 'Halle' },
  'SYS-AT-LIFTTBL-001': { x: 355, y: 400, area: 'Halle' },
  'SYS-AT-LIFTGEAR-001': { x: 255, y: 330, area: 'Halle' },
  'SYS-AT-RACK-001': { x: 502, y: 330, area: 'Lagerbereich' },
  'SYS-AT-LADDER-001': { x: 135, y: 382, area: 'Halle' },
  'SYS-AT-CONV-001': { x: 300, y: 440, area: 'Hallenboden' },
  'SYS-AT-MACH-001': { x: 390, y: 440, area: 'Fertigung' },
  'SYS-AT-MACHLINE-001': { x: 460, y: 440, area: 'Fertigungslinie' },

  // Energie und Elektrotechnik
  'SYS-AT-PV-001': { x: 150, y: 178, area: 'Dachfläche' },
  'SYS-AT-LPS-001': { x: 310, y: 116, area: 'Firstbereich' },
  'SYS-AT-ELEC-001': { x: 700, y: 500, area: 'Technikraum' },
  'SYS-AT-BATT-001': { x: 770, y: 500, area: 'Technikraum' },

  // Gebäudetechnik
  'SYS-AT-ELEV-001': { x: 800, y: 340, area: 'Gebäudekern' },
  'SYS-AT-HVAC-001': { x: 700, y: 222, area: 'Dachzentrale' },
  'SYS-AT-PRESS-001': { x: 840, y: 500, area: 'Technikraum' },

  // Absturzsicherung
  'SYS-AT-FALL-001': { x: 520, y: 190, area: 'Dachzugang' },
};

/** Reihenfolge der Layer (unten nach oben). */
export const LAYER_ORDER = [
  'layer_building',
  'layer_traffic',
  'layer_building_services',
  'layer_energy',
  'layer_work_equipment',
  'layer_fall_protection',
  'layer_fire_protection',
];

/**
 * Baut die Hotspot-Liste für eine Menge von Anlagentypen.
 *
 * @param {import('../model/system-types.js').SystemType[]} [systemTypes]
 * @returns {{system_type_id: string, hotspot_id: string, svg_object_id: string, layer: string, x: number, y: number, area: string, name: string, layman_description: string, color: string, icon: string}[]}
 */
export function listHotspots(systemTypes = SYSTEM_TYPES) {
  const hotspots = [];
  for (const systemType of systemTypes) {
    const geometry = HOTSPOT_GEOMETRY[systemType.id];
    if (!geometry) continue;
    const category = getCategory(systemType.category);
    hotspots.push({
      system_type_id: systemType.id,
      hotspot_id: systemType.hotspot_id,
      svg_object_id: systemType.svg_object_id,
      layer: systemType.svg_layer_id,
      x: geometry.x,
      y: geometry.y,
      area: geometry.area,
      name: systemType.name,
      layman_description: systemType.layman_description,
      color: category ? category.color : '#475467',
      icon: systemType.icon,
    });
  }
  return hotspots;
}

/**
 * @param {string} systemTypeId
 * @returns {{x: number, y: number, area: string} | undefined}
 */
export function getHotspotGeometry(systemTypeId) {
  return HOTSPOT_GEOMETRY[systemTypeId];
}

/**
 * Minimales Escaping für Attributwerte.
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Statischer Gebäudekörper (`layer_building`).
 * Querschnittsdarstellung: Produktionshalle links, Büroteil rechts,
 * Technikraum im Untergeschoss.
 *
 * @returns {string}
 */
function buildingBody() {
  const windows = [];
  // Büroteil – zwei Geschosse mit Fensterband
  for (let floor = 0; floor < 2; floor += 1) {
    const y = 272 + floor * 115;
    for (let column = 0; column < 5; column += 1) {
      const x = 600 + column * 66;
      windows.push(
        `<rect class="sn-window" x="${x}" y="${y}" width="46" height="42" rx="3"/>`,
      );
    }
  }
  // Halle – Lichtband
  for (let column = 0; column < 6; column += 1) {
    const x = 92 + column * 78;
    windows.push(`<rect class="sn-window" x="${x}" y="286" width="52" height="30" rx="3"/>`);
  }

  return `
    <g id="layer_building" class="sn-layer sn-layer-building" aria-hidden="true">
      <rect class="sn-sky" x="0" y="0" width="1000" height="560"/>
      <rect class="sn-ground" x="0" y="470" width="1000" height="90"/>
      <line class="sn-groundline" x1="0" y1="470" x2="1000" y2="470"/>

      <!-- Technikraum Untergeschoss -->
      <rect class="sn-basement" x="580" y="470" width="360" height="62" rx="4"/>
      <text class="sn-room-label" x="592" y="507">Technikraum</text>

      <!-- Produktionshalle -->
      <polygon class="sn-wall" points="60,470 60,215 310,140 560,215 560,470"/>
      <polyline class="sn-roof" points="48,222 310,130 572,222"/>
      <line class="sn-crane-rail" x1="78" y1="258" x2="542" y2="258"/>
      <rect class="sn-gate" x="76" y="382" width="92" height="88" rx="3"/>

      <!-- Büroteil -->
      <rect class="sn-wall" x="580" y="240" width="360" height="230" rx="3"/>
      <rect class="sn-roof-flat" x="570" y="230" width="380" height="12" rx="3"/>
      <line class="sn-floor" x1="580" y1="355" x2="940" y2="355"/>
      <rect class="sn-door" x="906" y="418" width="30" height="52" rx="2"/>

      <!-- Beschriftung außerhalb der Hotspot-Flächen, damit sie nicht verdeckt wird -->
      <text class="sn-room-label" x="310" y="552" text-anchor="middle">Produktionshalle</text>
      <text class="sn-room-label" x="760" y="552" text-anchor="middle">Büroteil</text>

      ${windows.join('\n      ')}
    </g>`;
}

/**
 * Rendert die vollständige Gebäudegrafik inklusive Hotspots.
 *
 * @param {object} [options]
 * @param {import('../model/system-types.js').SystemType[]} [options.systemTypes] Anzuzeigende Anlagentypen
 * @param {Record<string, string>} [options.selection] system_type_id -> 'has' | 'unsure'
 * @param {string} [options.focusId] hervorgehobener Anlagentyp
 * @param {string} [options.title] Titel für Screenreader
 * @returns {string} SVG-Markup
 */
export function renderBuildingSvg(options = {}) {
  const systemTypes = options.systemTypes ?? SYSTEM_TYPES;
  const selection = options.selection ?? {};
  const focusId = options.focusId ?? '';
  const title = options.title ?? 'Schematische Gebäudedarstellung mit auswählbaren Anlagen';

  const hotspots = listHotspots(systemTypes);

  /** @type {Record<string, string[]>} */
  const byLayer = {};
  for (const layer of LAYER_ORDER) byLayer[layer] = [];

  for (const hotspot of hotspots) {
    const layer = byLayer[hotspot.layer] ? hotspot.layer : 'layer_building_services';
    const state = selection[hotspot.system_type_id] ?? '';
    const classes = [
      'sn-hotspot',
      state === 'has' ? 'is-selected' : '',
      state === 'unsure' ? 'is-unsure' : '',
      focusId === hotspot.system_type_id ? 'is-focus' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const label = `${hotspot.name} – ${hotspot.area}`;

    byLayer[layer].push(`
        <g id="${escapeXml(hotspot.svg_object_id)}"
           class="${classes}"
           data-system-type="${escapeXml(hotspot.system_type_id)}"
           data-hotspot="${escapeXml(hotspot.hotspot_id)}"
           transform="translate(${hotspot.x} ${hotspot.y})"
           role="button"
           tabindex="0"
           aria-pressed="${state === 'has' ? 'true' : 'false'}"
           aria-label="${escapeXml(label)}">
          <title>${escapeXml(label)}</title>
          <circle class="sn-hotspot-halo" r="21"/>
          <circle class="sn-hotspot-dot" r="13" style="--sn-hotspot-color:${escapeXml(hotspot.color)}"/>
          <text class="sn-hotspot-icon" y="5" text-anchor="middle">${escapeXml(hotspot.icon)}</text>
        </g>`);
  }

  const layers = LAYER_ORDER.filter((layer) => layer !== 'layer_building')
    .map(
      (layer) => `
      <g id="${layer}" class="sn-layer" data-layer="${layer}">${byLayer[layer].join('')}
      </g>`,
    )
    .join('');

  return `<svg id="svg-building" class="sn-building-svg"
     viewBox="0 0 ${BUILDING_VIEWBOX.width} ${BUILDING_VIEWBOX.height}"
     xmlns="http://www.w3.org/2000/svg"
     role="group"
     aria-label="${escapeXml(title)}">
    <title>${escapeXml(title)}</title>
    ${buildingBody()}
    ${layers}
  </svg>`;
}

/**
 * Tooltipinhalt laut Abschnitt 17.
 *
 * Beispiel:
 *   Rauch- und Wärmeabzugsanlage
 *   "Öffnet im Brandfall Rauchabzugsöffnungen bzw. unterstützt die
 *    Rauchableitung."
 *
 * @param {string} systemTypeId
 * @returns {{title: string, text: string, area: string} | null}
 */
export function hotspotTooltip(systemTypeId) {
  const systemType = getSystemType(systemTypeId);
  if (!systemType) return null;
  const geometry = HOTSPOT_GEOMETRY[systemTypeId];
  return {
    title: systemType.name,
    text: systemType.layman_description,
    area: geometry ? geometry.area : '',
  };
}

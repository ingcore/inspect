/**
 * Profilregister der Modellversion 1.0.0.
 *
 * Die Dimensionsgewichte sind die verbindliche Startkonfiguration aus PRD 11
 * und werden als Basispunkte gefuehrt (Anhang A). Jede Profilzeile muss exakt
 * 10 000 Basispunkte ergeben (CALC-003).
 *
 * Profile mit freigegebenem Kriterienkatalog sind "released"; Profile ohne
 * Katalog sind als "geplant" gefuehrt und koennen nicht berechnet werden
 * (PROF-001: Profile werden ohne Codeaenderung ergaenzt).
 */

import tBma from "./criteria/t-bma.js";
import cBag from "./criteria/c-bag.js";
import bCom from "./criteria/b-com.js";
import { DIMENSION_CODES } from "./model.js";

const CATALOGS = {
  "T-BMA": tBma,
  "C-BAG": cBag,
  "B-COM": bCom,
};

/** [id, Geschaeftsfeld, Score-Art, LRC, TPF, IPH, ORG, EVD, MEA] in Prozent. */
const TECHNIK = [
  ["T-BMA", "Brandmeldeanlagen", "SS-COND", 15, 35, 20, 5, 10, 15],
  ["T-RWA", "Rauch- und Waermeabzug / Brandrauchentlueftung", "SS-COND", 15, 35, 20, 5, 10, 15],
  ["T-DBA", "Druckbelueftungsanlagen", "SS-COND", 15, 40, 20, 5, 10, 10],
  ["T-SPA", "Sprinkler- und stationaere Loeschanlagen", "SS-COND", 15, 40, 20, 5, 10, 10],
  ["T-SBL", "Sicherheits- und Fluchtwegbeleuchtung", "SS-COND", 15, 35, 20, 5, 10, 15],
  ["T-FSA", "Feststellanlagen und Brandschutzabschluesse", "SS-COND", 15, 35, 20, 5, 10, 15],
  ["T-LWV", "Loeschwasserversorgung, Wandhydranten und trockene Steigleitungen", "SS-COND", 15, 35, 20, 5, 10, 15],
  ["T-FL", "Tragbare Feuerloescher und erste Loeschhilfe", "SS-COND", 15, 25, 15, 10, 15, 20],
  ["T-ELT", "Elektrische Anlagen und Blitzschutz", "SS-COND", 20, 35, 20, 5, 10, 10],
  ["T-PV", "Photovoltaik- und Batteriespeichersysteme", "SS-COND", 20, 35, 20, 5, 10, 10],
  ["T-BSB", "Brandschutzbegehung und Betriebsbrandschutz", "SS-COND", 20, 20, 20, 20, 10, 10],
  ["T-FBS", "Feuerbeschau", "SS-COND", 25, 20, 20, 15, 10, 10],
  ["T-82B", "Wiederkehrende Pruefung gemaess § 82b GewO", "SS-COND", 35, 20, 15, 10, 10, 10],
  ["T-ASG", "Arbeitsplatzevaluierung / ASchG", "SS-COND", 20, 15, 25, 20, 10, 10],
  ["T-MAS", "Maschinen- und Arbeitsmittelsicherheit", "SS-COND", 15, 30, 30, 10, 5, 10],
  ["T-VEX", "Explosionsschutz / VEXAT", "SS-COND", 20, 25, 25, 15, 10, 5],
  ["T-BAU", "Baustellensicherheit / BauKG", "SS-COND", 15, 20, 30, 20, 5, 10],
  ["T-GEB", "Gebaeudesicherheit / OENORM B 1300 und B 1301", "SS-COND", 20, 25, 25, 10, 10, 10],
];

const CONSULTING = [
  ["C-BAG", "Betriebsanlagengenehmigung / Einreichprojekt", "SS-READ", 30, 25, 20, 5, 15, 5],
  ["C-BSK", "Brandschutzkonzept / Abweichungsbeurteilung", "SS-READ", 20, 30, 25, 5, 15, 5],
  ["C-PLAN", "Planpruefung und Ausfuehrungskontrolle", "SS-READ", 25, 30, 20, 5, 15, 5],
  ["C-ABN", "Abnahme- und Inbetriebnahmebereitschaft", "SS-READ", 20, 35, 20, 5, 10, 10],
  ["C-TDD", "Technische Due Diligence", "SS-COND", 20, 25, 20, 10, 15, 10],
  ["C-INS", "Versicherungs- und Risikobeurteilung", "SS-COND", 15, 25, 30, 10, 10, 10],
  ["C-ORG", "Sicherheits- und Organisationsberatung", "SS-MGMT", 20, 10, 10, 25, 15, 20],
];

const BUSINESS = [
  ["B-SMM", "Safety Management Maturity", "SS-MGMT", 20, 10, 10, 25, 15, 20],
  ["B-COM", "Betreiberpflichten und Compliance-Management", "SS-MGMT", 25, 10, 15, 20, 15, 15],
  ["B-AIM", "Pruef-, Anlagen- und Asset-Management", "SS-MGMT", 15, 20, 10, 15, 15, 25],
  ["B-MSR", "Massnahmen- und Wirksamkeitsmanagement", "SS-MGMT", 10, 10, 15, 20, 15, 30],
  ["B-ECM", "Notfall-, Evakuierungs- und Krisenmanagement", "SS-MGMT", 15, 15, 25, 25, 10, 10],
  ["B-TRN", "Unterweisung, Ausbildung und Kompetenzmanagement", "SS-MGMT", 15, 5, 20, 35, 10, 15],
  ["B-PORT", "Portfolio- und Filialsteuerung", "SS-PORT", 20, 10, 15, 25, 15, 15],
  ["B-START", "INGTEC START - Eroeffnungs- und Genehmigungsreife", "SS-READ", 30, 20, 20, 10, 15, 5],
  ["B-OPER", "INGTEC OPERATE - laufende Betreiberbeherrschung", "SS-MGMT", 20, 20, 20, 15, 10, 15],
  ["B-PROT", "INGTEC PROTECT - erweiterte Fuehrungs- und Haftungsabsicherung", "SS-MGMT", 20, 15, 20, 20, 10, 15],
];

/** Anhang A - Standardgewichtungen als Ausweichkonfiguration. */
export const STANDARD_WEIGHTS = {
  objekt: { LRC: 2500, TPF: 2500, IPH: 2000, ORG: 1000, EVD: 1000, MEA: 1000 },
  readiness: { LRC: 2500, TPF: 2500, IPH: 2000, ORG: 1000, EVD: 1500, MEA: 500 },
  management: { LRC: 2000, TPF: 1000, IPH: 1000, ORG: 2500, EVD: 1500, MEA: 2000 },
};

function buildProfile(row, area) {
  const [id, field, scoreType, lrc, tpf, iph, org, evd, mea] = row;
  const catalog = CATALOGS[id];
  return {
    id,
    version: "1.0.0",
    area,
    field,
    scoreType,
    weightsBp: {
      LRC: lrc * 100,
      TPF: tpf * 100,
      IPH: iph * 100,
      ORG: org * 100,
      EVD: evd * 100,
      MEA: mea * 100,
    },
    complianceStatement: true,
    status: catalog ? "released" : "planned",
    modules: catalog ? catalog.modules : [],
    criteria: catalog ? catalog.criteria : [],
  };
}

export const PROFILES = [
  ...TECHNIK.map((row) => buildProfile(row, "TECHNIK")),
  ...CONSULTING.map((row) => buildProfile(row, "CONSULTING")),
  ...BUSINESS.map((row) => buildProfile(row, "BUSINESS")),
];

/** C-GUT wird bewusst ohne eigenstaendigen Score gefuehrt (PRD 11.2). */
export const NON_SCORED_PROFILES = [
  {
    id: "C-GUT",
    area: "CONSULTING",
    field: "Gutachten / Unfallanalyse",
    note:
      "Kein eigenstaendiger Gutachten-Score. Der untersuchte Zustand wird mit dem passenden " +
      "Objektprofil bewertet; die Aussagequalitaet wird ueber Konfidenz, Quellenstatus und Review dokumentiert.",
  },
];

export const PROFILES_BY_ID = Object.fromEntries(PROFILES.map((p) => [p.id, p]));

export function getProfile(id) {
  const profile = PROFILES_BY_ID[id];
  if (!profile) throw new Error(`Unbekanntes Pruefprofil: ${id}`);
  return profile;
}

export function releasedProfiles() {
  return PROFILES.filter((p) => p.status === "released");
}

/**
 * Schema- und Konsistenzvalidierung eines Profils
 * (CALC-003, CALC-004, PROF-002).
 */
export function validateProfile(profile) {
  const errors = [];
  const sum = DIMENSION_CODES.reduce((acc, code) => acc + (profile.weightsBp[code] ?? 0), 0);
  if (sum !== 10000) {
    errors.push(`Dimensionsgewichte ergeben ${sum} statt exakt 10.000 Basispunkte.`);
  }
  const seen = new Set();
  for (const criterion of profile.criteria) {
    if (seen.has(criterion.id)) errors.push(`Doppelte Kriteriums-ID: ${criterion.id}`);
    seen.add(criterion.id);
    if (!DIMENSION_CODES.includes(criterion.dimension)) {
      errors.push(`${criterion.id}: unbekannte Dimension ${criterion.dimension}`);
    }
    if (!Number.isInteger(criterion.weight) || criterion.weight < 1 || criterion.weight > 5) {
      errors.push(`${criterion.id}: Kontrollgewicht muss ganzzahlig 1-5 sein.`);
    }
    if (!criterion.text) errors.push(`${criterion.id}: Pruefpunkttext fehlt.`);
    if (!criterion.sourceType) errors.push(`${criterion.id}: Quellenkategorie fehlt.`);
  }
  if (profile.status === "released") {
    for (const code of DIMENSION_CODES) {
      const weightBp = profile.weightsBp[code];
      const hasCriteria = profile.criteria.some((c) => c.dimension === code);
      if (weightBp > 0 && !hasCriteria) {
        errors.push(`Dimension ${code} ist gewichtet, enthaelt aber kein Kriterium.`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

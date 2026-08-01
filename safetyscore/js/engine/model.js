/**
 * Safety-Score Modellversion 1.0.0 - versionierte Regelkonstanten.
 *
 * Aenderungen an Skalenrichtung, Formeln, Klassen, Dimensionen, Gates,
 * Compliance-Logik, Konfidenz oder Aggregation duerfen ausschliesslich ueber
 * ein versioniertes Change-Verfahren erfolgen (PRD Verbindlichkeitsregel).
 */

import { HP } from "./fixed.js";

export const MODEL_VERSION = "1.0.0";
export const ENGINE_VERSION = "ingtec-score-engine/1.0.0";

/** PRD 4.1 - Score-Familien. */
export const SCORE_TYPES = {
  "SS-COND": {
    code: "SS-COND",
    label: "Safety Condition Score",
    subject: "Technische Anlage, Gebaeude, Arbeitsplatz, Maschine oder konkreter Istzustand",
  },
  "SS-READ": {
    code: "SS-READ",
    label: "Safety Readiness Score",
    subject: "Planung, Konzept, Einreichung, Ausfuehrungs- oder Abnahmereife",
  },
  "SS-MGMT": {
    code: "SS-MGMT",
    label: "Safety Management Score",
    subject: "Organisation, Governance, Betreiberpflichten und Sicherheitssteuerung",
  },
  "SS-PORT": {
    code: "SS-PORT",
    label: "Safety Portfolio Score",
    subject: "Aggregation kompatibler freigegebener Einzelwerte",
  },
  "SS-TREND": {
    code: "SS-TREND",
    label: "Safety Trend Indicator",
    subject: "Veraenderung eines identischen Bewertungsobjekts ueber Zeit",
  },
};

/** PRD 6 - Universelle Bewertungsdimensionen. */
export const DIMENSIONS = [
  {
    code: "LRC",
    name: "Legal and Regulatory Compliance",
    label: "Recht und Bescheid",
    content:
      "Rechtsvorschriften, Bescheide, Genehmigungen, Auflagen, verpflichtende Pruefungen und verbindliche Betreiberpflichten.",
  },
  {
    code: "TPF",
    name: "Technical Protective Functions",
    label: "Technische Schutzfunktion",
    content:
      "Technischer Zustand, Verfuegbarkeit, Wirksamkeit, Redundanz und sicherheitsrelevante Schutzfunktionen.",
  },
  {
    code: "IPH",
    name: "Immediate Person Hazard",
    label: "Personengefaehrdung",
    content:
      "Moeglicher Personenschaden, Exposition, Zugaenglichkeit, Flucht- und Rettungsmoeglichkeiten sowie unmittelbare Gefaehrdung.",
  },
  {
    code: "ORG",
    name: "Organisation and Human Factors",
    label: "Organisation und Human Factors",
    content:
      "Verantwortlichkeiten, Qualifikation, Unterweisung, Bedienung, Eigenkontrolle, Notfallorganisation und menschliche Faktoren.",
  },
  {
    code: "EVD",
    name: "Evidence and Verification",
    label: "Evidenz und Nachweis",
    content:
      "Vollstaendigkeit, Aktualitaet, Plausibilitaet, Messung, Plaene, Nachweise und Rueckverfolgbarkeit.",
  },
  {
    code: "MEA",
    name: "Measures and Effectiveness",
    label: "Massnahmen und Wirksamkeit",
    content:
      "Wartung, Prueffristen, offene Massnahmen, Ueberfaelligkeit, Wiederholungsmaengel und Wirksamkeitskontrolle.",
  },
];

export const DIMENSION_CODES = DIMENSIONS.map((d) => d.code);

/** PRD 7.2 - Schweregrad 0-4. */
export const SEVERITY_SCALE = [
  { value: 0, key: "erfuellt", label: "erfuellt", definition: "Anforderung nachgewiesen erfuellt; keine bewertungsrelevante Abweichung." },
  { value: 1, key: "geringfuegig", label: "geringfuegig", definition: "Begrenzte Abweichung ohne wesentliche Einschraenkung der Schutzwirkung." },
  { value: 2, key: "relevant", label: "relevant", definition: "Teilweise Erfuellung, eingeschraenkte Wirkung oder relevanter organisatorischer beziehungsweise dokumentarischer Mangel." },
  { value: 3, key: "schwerwiegend", label: "schwerwiegend", definition: "Wesentliche Beeintraechtigung, erhebliche verbindliche Abweichung oder systemischer Mangel." },
  { value: 4, key: "kritisch", label: "kritisch", definition: "Schutzfunktion ausgefallen, unmittelbare beziehungsweise naheliegende erhebliche Gefahr oder unzulaessiger Zustand." },
];

export const MAX_SEVERITY = 4;

/** PRD 7.3 - Dimensionale Ankerbeispiele des Schweregrades (Grad 1-4). */
export const SEVERITY_ANCHORS = {
  LRC: [
    "formale Nebenabweichung",
    "begrenzte verbindliche Abweichung",
    "wesentliche Nichterfuellung einer verpflichtenden Anforderung",
    "unzulaessiger Betrieb, unmittelbare Pflichtverletzung oder vergleichbarer Zustand",
  ],
  TPF: [
    "geringe Zustandsabweichung",
    "Teilfunktion eingeschraenkt",
    "wesentliche Schutzfunktion beeintraechtigt",
    "zentrale Schutzfunktion ausgefallen",
  ],
  IPH: [
    "geringe zusaetzliche Exposition",
    "relevante Gefaehrdung mit vorhandener Beherrschung",
    "hohes Schadenspotenzial oder unzureichende Beherrschung",
    "unmittelbare erhebliche Gefahr",
  ],
  ORG: [
    "isolierte organisatorische Luecke",
    "mehrere oder wiederkehrende Luecken",
    "systemisches Organisationsversagen",
    "fehlende kritische Notfall- oder Betreiberorganisation",
  ],
  EVD: [
    "unwesentliche Nachweisluecke",
    "teilweise fehlende oder veraltete Evidenz",
    "wesentliche Beurteilungsgrundlage fehlt",
    "kritischer Sachverhalt nicht verifizierbar",
  ],
  MEA: [
    "geringe Terminabweichung",
    "relevante Ueberfaelligkeit",
    "wiederholt ueberfaellige wesentliche Massnahme",
    "kritische Massnahme nicht umgesetzt oder Wirksamkeit widerlegt",
  ],
};

/** PRD 7.4 - Kontrollgewicht 1-5. Nur im freigegebenen Profil festlegbar. */
export const CONTROL_WEIGHTS = [
  { value: 1, label: "unterstuetzend", definition: "Begrenzte Sicherheitsrelevanz; kein wesentlicher Einfluss auf Schutzziel." },
  { value: 2, label: "maessig", definition: "Relevanter Pruefpunkt mit begrenzter Auswirkung." },
  { value: 3, label: "wesentlich", definition: "Direkter Beitrag zu Schutzwirkung, Rechtskonformitaet oder Betriebsbeherrschung." },
  { value: 4, label: "hoch", definition: "Wesentliche Schutzfunktion oder zentrale Betreiberpflicht." },
  { value: 5, label: "schutzkritisch", definition: "Zentrale Sicherheitsfunktion, unmittelbare Personenschutzwirkung oder zwingende Kernanforderung." },
];

/** Ab diesem Kontrollgewicht gilt ein Pflichtkriterium als schutzkritisch (PRD 9.3). */
export const PROTECTION_CRITICAL_WEIGHT = 5;

/**
 * PRD 7.5 - Modifikatoren. Werte in Hundertsteln (0,80 -> 80).
 * Der erste Eintrag je Faktor ist der Neutralwert, wenn nichts gewaehlt wird.
 */
export const MODIFIERS = {
  F_A: {
    label: "Ausmass",
    neutral: "erheblich",
    options: [
      { key: "isoliert", value: 80, label: "isoliert / Einzelpunkt" },
      { key: "begrenzt", value: 90, label: "begrenzter Anteil" },
      { key: "erheblich", value: 100, label: "erheblicher Anteil, zentrale Funktion oder systemisch" },
    ],
  },
  F_E: {
    label: "Exposition",
    neutral: "regulaer",
    options: [
      { key: "gering", value: 90, label: "geringe oder seltene Exposition" },
      { key: "regulaer", value: 100, label: "regulaere Exposition" },
      { key: "hoch", value: 110, label: "hohe, dauernde oder besonders schutzbeduerftige Exposition" },
    ],
  },
  F_R: {
    label: "Wiederholung",
    neutral: "neu",
    options: [
      { key: "neu", value: 100, label: "neu festgestellt, Frist offen" },
      { key: "ueberfaellig", value: 110, label: "Frist ueberschritten" },
      { key: "wiederholt", value: 120, label: "wiederholt festgestellt" },
      { key: "rueckfall", value: 130, label: "trotz bestaetigter Behebung erneut vorhanden" },
    ],
  },
  F_M: {
    label: "Uebergangsmassnahme",
    neutral: "keine",
    options: [
      { key: "keine", value: 100, label: "keine verifizierte wirksame Uebergangsmassnahme" },
      { key: "wirksam", value: 85, label: "befristete, fachlich geprueefte und ueberwachte Uebergangsmassnahme" },
    ],
  },
};

export const MODIFIER_CODES = ["F_A", "F_E", "F_R", "F_M"];

/**
 * PRD 7.5 - Zulaessigkeitsmatrix der Modifikatoren je Dimension.
 * Nicht zugelassene Modifikatoren werden mit 1,00 angesetzt (PRD 7.6).
 */
export const MODIFIER_MATRIX = {
  LRC: { F_A: true, F_E: false, F_R: true, F_M: false },
  TPF: { F_A: true, F_E: true, F_R: true, F_M: true },
  IPH: { F_A: true, F_E: true, F_R: true, F_M: true },
  ORG: { F_A: true, F_E: true, F_R: true, F_M: true },
  EVD: { F_A: true, F_E: false, F_R: true, F_M: false },
  MEA: { F_A: true, F_E: false, F_R: true, F_M: true },
};

/** Erlaeuterung der eingeschraenkten Zulaessigkeit (PRD 7.5, Fussnoten). */
export const MODIFIER_MATRIX_NOTES = {
  ORG: { F_M: "nur formalisierte Kontrolle" },
  MEA: { F_M: "nur bei ueberprueefter Ersatzmassnahme" },
};

/**
 * PRD 8 - Klassen. Grenzen in Basispunkten, Vergleich mit dem
 * ungerundeten Finalwert (CALC-008).
 */
export const CLASSES = [
  { code: "A", minBp: 0, maxBp: 1000, minInclusive: true, label: "robuster Zustand", consequence: "Keine wesentliche Abweichung; Routineueberwachung." },
  { code: "B", minBp: 1000, maxBp: 2500, minInclusive: false, label: "geringe Abweichungen", consequence: "Planbare Verbesserung; kein schwerwiegendes oder kritisches Gate." },
  { code: "C", minBp: 2500, maxBp: 4500, minInclusive: false, label: "relevanter Handlungsbedarf", consequence: "Massnahmen zeitnah priorisieren und nachverfolgen." },
  { code: "D", minBp: 4500, maxBp: 7000, minInclusive: false, label: "schwerwiegender Zustand", consequence: "Dringende Massnahmen, erhoehte Fuehrungskontrolle und kurze Verifikation." },
  { code: "E", minBp: 7000, maxBp: 10000, minInclusive: false, label: "kritischer Zustand", consequence: "Sofortige fachliche Eskalation; betriebliche oder rechtliche Konsequenzen gesondert beurteilen." },
];

export const CLASS_NB = {
  code: "NB",
  label: "nicht belastbar beurteilbar",
  consequence: "Kritischer Scope-, Evidenz- oder Integritaetsmangel verhindert eine belastbare Aussage.",
};

export const CLASS_ORDER = ["A", "B", "C", "D", "E"];

/**
 * PRD 8.1 - Gates. Floors in Basispunkten.
 * effect: "floor" | "nb" | "release_lock"
 */
export const GATES = [
  {
    code: "KO-01",
    trigger: "Unmittelbare erhebliche Gefahr",
    effect: "floor",
    levels: [{ key: "standard", floorBp: 8500, minClass: "E", label: "unmittelbare erhebliche Gefahr" }],
    requirement: "Soforteskalation, Begruendung, Beweismittel und Massnahmenpflicht.",
    closing: "Gefahr nachweislich beseitigt, verifiziert und dokumentiert.",
  },
  {
    code: "KO-02",
    trigger: "Unzulaessiger Weiterbetrieb, behoerdliche Sperre oder fachlich erforderliche Nutzungsunterbrechung",
    effect: "floor",
    levels: [{ key: "standard", floorBp: 9000, minClass: "E", label: "unzulaessiger Weiterbetrieb" }],
    requirement: "Betriebsstatus separat; keine automatische Rechtsentscheidung durch Software.",
    closing: "Zulaessigkeit des Betriebs durch berechtigte Stelle wiederhergestellt und nachgewiesen.",
  },
  {
    code: "KO-03",
    trigger: "Ausfall wesentlicher Schutzfunktion",
    effect: "floor",
    levels: [
      { key: "standard", floorBp: 5000, minClass: "D", label: "Ausfall ohne unmittelbare Exposition" },
      { key: "exponiert", floorBp: 7500, minClass: "E", label: "Ausfall mit unmittelbarer Exposition" },
    ],
    requirement: "Schutzfunktion wiederherstellen und Wirksamkeit verifizieren.",
    closing: "Funktionsnachweis der Schutzfunktion durch Fachpruefung.",
  },
  {
    code: "KO-04",
    trigger: "Wesentliche Rechts-, Bescheid- oder verbindliche Vertragsabweichung",
    effect: "floor",
    levels: [
      { key: "stufe_c", floorBp: 3000, minClass: "C", label: "wesentliche Abweichung" },
      { key: "stufe_d", floorBp: 5000, minClass: "D", label: "schwere Abweichung" },
      { key: "stufe_e", floorBp: 7500, minClass: "E", label: "schwerste Abweichung" },
    ],
    requirement: "Rechtliche Einordnung und Herstellung des rechtskonformen Zustands.",
    closing: "Nachweis der erfuellten Rechts-, Bescheid- oder Vertragsanforderung.",
  },
  {
    code: "KO-05",
    trigger: "Kritischer Flucht-, Rettungs- oder Evakuierungsmangel",
    effect: "floor",
    levels: [
      { key: "standard", floorBp: 5500, minClass: "D", label: "kritischer Mangel ohne akute Personengefaehrdung" },
      { key: "exponiert", floorBp: 7500, minClass: "E", label: "kritischer Mangel mit Personengefaehrdung" },
    ],
    requirement: "Sofortmassnahmen fuer Flucht- und Rettungswege; Ersatzmassnahmen dokumentieren.",
    closing: "Flucht- und Rettungswegfunktion wiederhergestellt und geprueft.",
  },
  {
    code: "KO-06",
    trigger: "Kritische Evidenz- oder Pruefumfangsluecke",
    effect: "nb",
    levels: [{ key: "standard", floorBp: 0, minClass: null, label: "kritische Evidenzluecke" }],
    requirement: "Kein veroeffentlichter Zahlenwert; Nachpruefung erforderlich.",
    closing: "Fehlende Evidenz beigebracht und Pruefumfang vollstaendig bewertet.",
  },
  {
    code: "KO-07",
    trigger: "Ueberfaellige kritische Massnahme oder wiederholte Nichtbehebung",
    effect: "floor",
    levels: [{ key: "standard", floorBp: 5000, minClass: "D", label: "ueberfaellige kritische Massnahme" }],
    requirement: "Score-Floor 50,0; Eskalation an definierte Fuehrungsebene.",
    closing: "Massnahme umgesetzt und Wirksamkeit verifiziert.",
  },
  {
    code: "KO-08",
    trigger: "Fehlende Unabhaengigkeit, Freigabeintegritaet oder manipulierter Datensatz",
    effect: "release_lock",
    levels: [{ key: "standard", floorBp: 0, minClass: null, label: "Integritaets- oder Unabhaengigkeitsmangel" }],
    requirement: "Interner Rohwert darf existieren; keine externe Veroeffentlichung.",
    closing: "Integritaet und Unabhaengigkeit durch unabhaengige Stelle wiederhergestellt.",
  },
];

export const GATE_BY_CODE = Object.fromEntries(GATES.map((g) => [g.code, g]));

/** PRD 9.1 - Compliance-Status. */
export const COMPLIANCE_STATUS = {
  CONFORM: { code: "CONFORM", label: "konform", definition: "Alle im Scope bewerteten verpflichtenden Rechts- und Bescheidanforderungen sind auf aktueller Evidenz erfuellt." },
  NONCONFORM: { code: "NONCONFORM", label: "nicht konform", definition: "Mindestens eine anwendbare verpflichtende Anforderung ist nicht erfuellt." },
  PARTIAL: { code: "PARTIAL", label: "teilweise beurteilbar", definition: "Teilbereiche sind beurteilbar; die Gesamtaussage ist wegen begrenztem Scope oder offenen Grundlagen eingeschraenkt." },
  NB: { code: "NB", label: "nicht beurteilbar", definition: "Kritische Grundlagen fehlen oder Widersprueche verhindern eine belastbare Compliance-Aussage." },
  NA: { code: "NA", label: "nicht anwendbar", definition: "Fuer den definierten Bewertungsgegenstand wird keine Compliance-Aussage erzeugt." },
};

/** PRD 9.1 / PROF-005 - getrennte Quellenkategorien. */
export const SOURCE_TYPES = {
  gesetz: { code: "gesetz", label: "Rechtsvorschrift", binding: true },
  bescheid: { code: "bescheid", label: "Bescheid / Auflage", binding: true },
  vertrag: { code: "vertrag", label: "Vertragsvorgabe", binding: true },
  norm: { code: "norm", label: "Norm / Stand der Technik", binding: false },
  hersteller: { code: "hersteller", label: "Herstelleranforderung", binding: false },
  fachbewertung: { code: "fachbewertung", label: "Fachliche Bewertung", binding: false },
};

/** PRD 9.2 - Konfidenzgewichte in Prozentpunkten. */
export const CONFIDENCE_WEIGHTS = { A: 40, Q: 30, Z: 15, R: 15 };

/** PRD 9.2 - Evidenzqualitaet Q, Teilwerte 0-100. */
export const EVIDENCE_QUALITY = {
  primaer: { key: "primaer", label: "Primaermessung / aktueller Originalnachweis", value: 100 },
  original: { key: "original", label: "Aktueller Originalnachweis Dritter", value: 90 },
  vorperiode: { key: "vorperiode", label: "Nachweis aus Vorperiode", value: 60 },
  kundenangabe: { key: "kundenangabe", label: "Kundenangabe", value: 40 },
  ableitung: { key: "ableitung", label: "Ungeprueefte Ableitung", value: 25 },
  keine: { key: "keine", label: "Keine Evidenz", value: 0 },
};

/** PRD 9.2 - Aktualitaet Z, Teilwerte 0-100. */
export const EVIDENCE_ACTUALITY = {
  aktuell: { key: "aktuell", label: "Innerhalb der Profilgueltigkeit", value: 100 },
  alternd: { key: "alternd", label: "Gueltigkeit laeuft ab", value: 70 },
  abgelaufen: { key: "abgelaufen", label: "Gueltigkeit abgelaufen", value: 30 },
  unbekannt: { key: "unbekannt", label: "Aktualitaet unbekannt", value: 0 },
};

/** PRD 9.2 - Review- und Freigabequalitaet R, Teilwerte 0-100. */
export const REVIEW_QUALITY = {
  entwurf: { key: "entwurf", label: "Entwurf", value: 25 },
  selbstpruefung: { key: "selbstpruefung", label: "Selbstpruefung", value: 50 },
  vier_augen: { key: "vier_augen", label: "Vier-Augen-Pruefung", value: 80 },
  senior_freigabe: { key: "senior_freigabe", label: "Senior-Freigabe", value: 100 },
};

/** PRD 9.2 - Konfidenzklassen. Grenzen in Basispunkten (K = 0-10 000). */
export const CONFIDENCE_CLASSES = [
  { code: "K4", minBp: 9000, maxBp: 10000, label: "hohe Belastbarkeit", usage: "externe Verwendung im freigegebenen Umfang moeglich" },
  { code: "K3", minBp: 7500, maxBp: 9000, label: "ausreichend belastbar", usage: "normale Berichts- und Managementverwendung" },
  { code: "K2", minBp: 5000, maxBp: 7500, label: "eingeschraenkt belastbar", usage: "deutlicher Hinweis und Nachforderung erforderlich" },
  { code: "K1", minBp: 0, maxBp: 5000, label: "nicht belastbar", usage: "nicht fuer belastbare Aggregation oder externe Aussage geeignet" },
];

export const CONFIDENCE_ORDER = ["K1", "K2", "K3", "K4"];

/** PRD 9.3 - Mindestabdeckung, Werte in Basispunkten der gewichteten Abdeckung. */
export const COVERAGE_RULES = {
  nbBelowBp: 7000,
  provisionalBelowBp: 8500,
  provisionalMaxConfidence: "K2",
  releaseMinCoverageBp: 8500,
  releaseMinConfidence: "K3",
};

/** PRD 10.1 - Referenzklassen der Aggregationsgewichte (v = K * X * U). */
export const AGGREGATION_FACTORS = {
  criticality: {
    label: "Kritikalitaet des Systems",
    options: [
      { key: "gering", value: 100, label: "gering" },
      { key: "mittel", value: 150, label: "mittel" },
      { key: "hoch", value: 200, label: "hoch" },
      { key: "schutzkritisch", value: 300, label: "schutzkritisch" },
    ],
  },
  exposure: {
    label: "Personen- oder Nutzungsexposition",
    options: [
      { key: "gering", value: 100, label: "gering" },
      { key: "regulaer", value: 150, label: "regulaer" },
      { key: "hoch", value: 200, label: "hoch oder besonders schutzbeduerftig" },
    ],
  },
  redundancy: {
    label: "Fehlende Redundanz / Einzelfehlerrelevanz",
    options: [
      { key: "redundant", value: 100, label: "redundant" },
      { key: "teilredundant", value: 150, label: "teilredundant" },
      { key: "einzelfehler", value: 200, label: "Einzelfehlerrelevanz" },
    ],
  },
};

/** PRD 10.2 - Aggregationsmischung 80 % Mittelwert / 20 % gewichtetes P90. */
export const AGGREGATION_MIX = { meanBp: 8000, p90Bp: 2000, percentile: 90 };

/** PRD 14.3 - verbindlicher Wortlaut. */
export const WORDING = {
  scoreSentence: (display, klasse) =>
    `INGTEC Safety-Score®: ${display} von 100 Risikopunkten – Klasse ${klasse}. ` +
    "Der Wert beschreibt das gewichtete Sicherheitsdefizit innerhalb des angefuehrten Pruefumfangs. " +
    "Niedrigere Werte bedeuten einen guenstigeren bewerteten Zustand. " +
    "Rechtskonformitaet, Konfidenz und kritische Gate-Ereignisse werden gesondert ausgewiesen.",
  nbSentence:
    "Fuer den festgelegten Pruefumfang kann derzeit kein belastbarer Safety-Score® veroeffentlicht werden. " +
    "Die Beurteilung ist wegen der angefuehrten kritischen Evidenz- oder Scope-Luecken nicht abschliessend moeglich.",
  direction: "niedriger ist besser",
  disclaimer:
    "Der Safety-Score® ist ein proprietaeres, normorientiertes Modell der INGTEC GmbH. " +
    "Er ist keine behoerdliche, akkreditierte oder normativ zertifizierte Aussage und keine Eintrittswahrscheinlichkeit.",
};

/** Ermittelt die Klasse aus dem ungerundeten Finalwert (CALC-008). */
export function classifyBp(finalBp) {
  for (const klass of CLASSES) {
    const lowerOk = klass.minInclusive ? finalBp >= BigInt(klass.minBp) : finalBp > BigInt(klass.minBp);
    if (lowerOk && finalBp <= BigInt(klass.maxBp)) return klass;
  }
  return CLASSES[CLASSES.length - 1];
}

/**
 * Klassenbestimmung mit dem ungerundeten Finalwert in hochpraeziser Einheit
 * (CALC-008). Die Grenzen 10/25/45/70 sind dadurch eindeutig.
 */
export function classifyHp(finalHp) {
  for (const klass of CLASSES) {
    const min = BigInt(klass.minBp) * HP;
    const max = BigInt(klass.maxBp) * HP;
    const lowerOk = klass.minInclusive ? finalHp >= min : finalHp > min;
    if (lowerOk && finalHp <= max) return klass;
  }
  return CLASSES[CLASSES.length - 1];
}

/** Klassendefinition zu einem Klassencode. */
export function classByCode(code) {
  return CLASSES.find((c) => c.code === code) ?? CLASS_NB;
}

/** Klassenvergleich: gibt die strengere (schlechtere) Klasse zurueck. */
export function worseClass(a, b) {
  if (!a) return b;
  if (!b) return a;
  return CLASS_ORDER.indexOf(a) >= CLASS_ORDER.indexOf(b) ? a : b;
}

/** Konfidenzklasse aus dem Konfidenzwert in Basispunkten. */
export function confidenceClass(kBp) {
  for (const klass of CONFIDENCE_CLASSES) {
    if (kBp >= BigInt(klass.minBp) && (kBp < BigInt(klass.maxBp) || klass.code === "K4")) return klass;
  }
  return CONFIDENCE_CLASSES[CONFIDENCE_CLASSES.length - 1];
}

/** true, wenn a mindestens so belastbar ist wie b (K3 >= K2). */
export function confidenceAtLeast(a, b) {
  return CONFIDENCE_ORDER.indexOf(a) >= CONFIDENCE_ORDER.indexOf(b);
}

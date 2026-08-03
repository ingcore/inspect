/**
 * Golden-Master-Satz T-BMA 1.0.0 (Validierungsstufe V1, PRD 16.1).
 *
 * Jeder Fall beschreibt eine fachlich begruendete Pruefsituation und die daraus
 * erwarteten Ergebnisse aller vier Ergebnisachsen. Die Erwartungen sind aus dem
 * Regelwerk abgeleitet, nicht aus einem Programmlauf uebernommen: Klasse, Gates,
 * Compliance und Konfidenzklasse folgen unmittelbar aus PRD 8, 9 und 11.
 *
 * Basis jedes Falls ist eine vollstaendig gepruefte Anlage mit Primaerevidenz.
 * "abweichungen" beschreibt ausschliesslich die Punkte, die vom Sollzustand
 * abweichen; "nichtBewertet" bildet Pruefumfangsluecken ab.
 */

import { emptyEvaluation } from "../js/engine/score-engine.js";
import { getProfile } from "../js/engine/profiles.js";

export const BASIS = {
  severity: 0,
  quality: "primaer",
  actuality: "aktuell",
  reviewLevel: "senior_freigabe",
};

export const GOLDEN_MASTERS = [
  {
    id: "GM-BMA-01",
    titel: "Vollstaendig erfuellte wiederkehrende Pruefung",
    begruendung:
      "Alle Kriterien nachgewiesen erfuellt, Primaerevidenz, Senior-Freigabe. Kein Risikodefizit, " +
      "daher r_i = 0 fuer alle Kriterien und S_raw = 0,0. Klasse A, konform, K4, freigabefaehig.",
    abweichungen: {},
    erwartung: {
      score: "0,0",
      klasse: "A",
      gates: [],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-02",
    titel: "Unwesentliche Nachweisluecke im Betriebsbuch",
    begruendung:
      "Einzelne Eintraege im Betriebsbuch fehlen (ORG Grad 1, isoliert). Ein Kriterium mit Gewicht 2 " +
      "in einer mit 5 % gewichteten Dimension kann den Score nur marginal heben. Klasse A bleibt, " +
      "die Anlage ist konform, da keine verpflichtende Anforderung betroffen ist.",
    abweichungen: {
      "T-BMA-ORG-03": { severity: 1, modifiers: { F_A: "isoliert" } },
    },
    erwartung: {
      score: "0,2",
      klasse: "A",
      gates: [],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-03",
    titel: "Wartungsnachweise der laufenden Periode unvollstaendig",
    begruendung:
      "Wartungsprotokolle liegen nur teilweise vor (EVD Grad 2) und die Melderreinigung ist ueberfaellig " +
      "(MEA Grad 2, Frist ueberschritten). Beides sind relevante, aber beherrschte Maengel ohne " +
      "Schutzfunktionsausfall: Klasse A ohne Gate. Keine verpflichtende Anforderung verletzt. " +
      "Rechenweg: D_EVD = 100 · 3 · 0,45 / 13 = 10,38 (Beitrag 1,04), " +
      "D_MEA = 100 · 3 · 0,495 / 14 = 10,61 (Beitrag 1,59), S_raw = 2,63.",
    abweichungen: {
      "T-BMA-EVD-03": { severity: 2, modifiers: { F_A: "begrenzt" } },
      "T-BMA-MEA-03": { severity: 2, modifiers: { F_A: "begrenzt", F_R: "ueberfaellig" } },
    },
    erwartung: {
      score: "2,6",
      klasse: "A",
      gates: [],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-04",
    titel: "Formale Abweichung von einer Bescheidauflage",
    begruendung:
      "Die Pruefung wurde fristgerecht, aber ohne vollstaendigen Nachweis der Pruefbefugnis dokumentiert " +
      "(LRC Grad 1). Punktemaessig unwesentlich, jedoch ist eine verpflichtende Anforderung nicht " +
      "nachgewiesen erfuellt: Compliance NONCONFORM bei Klasse A. Trennung von Score und Rechtsaussage. " +
      "Rechenweg: r = 0,25 · 0,80 = 0,20, D_LRC = 100 · 4 · 0,20 / 17 = 4,71, S_raw = 0,15 · 4,71 = 0,71.",
    abweichungen: {
      "T-BMA-LRC-02": { severity: 1, modifiers: { F_A: "isoliert" } },
    },
    erwartung: {
      score: "0,7",
      klasse: "A",
      gates: [],
      compliance: "NONCONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-05",
    titel: "Mehrere relevante technische Abweichungen ohne Schutzfunktionsausfall",
    begruendung:
      "Handfeuermelder verstellt, Stoerungsmeldungen offen, Feuerwehrperipherie teilweise falsch beschriftet " +
      "(TPF Grad 2, systemisch). Die Schutzwirkung ist eingeschraenkt, aber nicht ausgefallen. Erwartet wird " +
      "ein Wert im Bereich geringer bis relevanter Abweichungen ohne Gate.",
    abweichungen: {
      "T-BMA-TPF-03": { severity: 2 },
      "T-BMA-TPF-04": { severity: 2 },
      "T-BMA-TPF-10": { severity: 2 },
    },
    erwartung: {
      score: "4,3",
      klasse: "A",
      gates: [],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-06",
    titel: "Wiederholungsmangel mit wirksamer Uebergangsmassnahme",
    begruendung:
      "Die Ersatzstromversorgung erreicht die geforderte Ueberbrueckungsdauer nicht (TPF Grad 3), der Mangel " +
      "wurde bereits in der Vorperiode festgestellt (F_R = 1,20). Eine befristete, fachlich geprueefte " +
      "Uebergangsmassnahme ist wirksam (F_M = 0,85). r = min(1; 0,75 · 1,20 · 0,85) = 0,765 statt 0,90 - die " +
      "Uebergangsmassnahme senkt den Risikobeitrag, hebt aber kein Gate auf. Kein Gate, da die Profilregel " +
      "erst ab Grad 4 greift.",
    abweichungen: {
      "T-BMA-TPF-08": { severity: 3, modifiers: { F_R: "wiederholt", F_M: "wirksam" } },
    },
    erwartung: {
      score: "2,6",
      klasse: "A",
      gates: [],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-07",
    titel: "Brandfallsteuerung ohne Funktion",
    begruendung:
      "Eine wesentliche Brandfallsteuerung loest nicht aus (TPF Grad 3). Die Profilregel loest KO-03 aus, " +
      "Floor 50,0 und mindestens Klasse D. Der Rohwert liegt deutlich darunter - der Fall belegt die " +
      "Nichtkompensierbarkeit: zahlreiche unauffaellige Kriterien heben das Ergebnis nicht.",
    abweichungen: {
      "T-BMA-TPF-07": { severity: 3 },
    },
    erwartung: {
      score: "50,0",
      klasse: "D",
      gates: ["KO-03"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-08",
    titel: "Alarmierung im erforderlichen Bereich unwirksam",
    begruendung:
      "Die akustische Alarmierung erreicht den ungueensigsten Aufenthaltsbereich nicht (TPF Grad 4) bei " +
      "dauernder Personenexposition. KO-03 in der Stufe mit unmittelbarer Exposition wirkt mit Floor 75,0 " +
      "und Klasse E.",
    abweichungen: {
      "T-BMA-TPF-05": { severity: 4, modifiers: { F_E: "hoch" } },
    },
    erwartung: {
      score: "75,0",
      klasse: "E",
      gates: ["KO-03"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-09",
    titel: "Unmittelbare erhebliche Gefahr durch fehlende Personenwarnung",
    begruendung:
      "In einem Beherbergungsbereich mit eingeschraenkter Selbstrettung erfolgt keine rechtzeitige Warnung " +
      "(IPH Grad 4). KO-01 wirkt mit Floor 85,0 und Klasse E; zusaetzlich ist Soforteskalation erforderlich.",
    abweichungen: {
      "T-BMA-IPH-01": { severity: 4, modifiers: { F_E: "hoch" } },
    },
    erwartung: {
      score: "85,0",
      klasse: "E",
      gates: ["KO-01"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-10",
    titel: "Fluchtweg durch Brandfallsteuerung blockiert",
    begruendung:
      "Fluchttueren verriegeln im Alarmfall (IPH Grad 4). KO-05 in der Stufe mit Personengefaehrdung wirkt " +
      "mit Floor 75,0 und Klasse E. Der Fall trennt den Flucht- und Rettungswegmangel von der allgemeinen " +
      "Gefahrenlage nach KO-01.",
    abweichungen: {
      "T-BMA-IPH-02": { severity: 4 },
    },
    erwartung: {
      score: "75,0",
      klasse: "E",
      gates: ["KO-05"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-11",
    titel: "Geforderte Alarmweiterleitung nicht verfuegbar",
    begruendung:
      "Die beauflagte Uebertragung zur Feuerwehr ist nicht betriebsbereit (LRC Grad 3, Bescheidauflage) und " +
      "die Uebertragungseinrichtung leitet nicht weiter (TPF Grad 4). KO-04 Stufe D (Floor 50,0) und KO-03 " +
      "(Floor 50,0) wirken gemeinsam; massgeblich ist der hoechste Floor. Compliance NONCONFORM, weil eine " +
      "verpflichtende Bescheidanforderung nicht erfuellt ist.",
    abweichungen: {
      "T-BMA-LRC-03": { severity: 3 },
      "T-BMA-TPF-06": { severity: 4 },
    },
    erwartung: {
      score: "50,0",
      klasse: "D",
      gates: ["KO-03", "KO-04"],
      compliance: "NONCONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-12",
    titel: "Ueberwachungsumfang weicht wesentlich vom Bescheid ab",
    begruendung:
      "Mehrere ueberwachungspflichtige Bereiche sind nicht erfasst (LRC Grad 3, TPF Grad 3). KO-04 Stufe D " +
      "setzt Floor 50,0; die Anlage ist nicht konform. Der Fall zeigt, dass Rechtsabweichung und technischer " +
      "Zustand getrennt bewertet und getrennt ausgewiesen werden.",
    abweichungen: {
      "T-BMA-LRC-01": { severity: 3 },
      "T-BMA-TPF-01": { severity: 3, modifiers: { F_A: "begrenzt" } },
    },
    erwartung: {
      score: "50,0",
      klasse: "D",
      gates: ["KO-04"],
      compliance: "NONCONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-13",
    titel: "Kritische Massnahme aus der Vorperiode nicht umgesetzt",
    begruendung:
      "Ein wesentlicher Mangel der Vorpruefung wurde trotz bestaetigter Behebung erneut festgestellt " +
      "(MEA Grad 4, F_R = 1,30). KO-07 wirkt mit Floor 50,0 und Klasse D und eskaliert an die " +
      "definierte Fuehrungsebene.",
    abweichungen: {
      "T-BMA-MEA-01": { severity: 4, modifiers: { F_R: "rueckfall" } },
    },
    erwartung: {
      score: "50,0",
      klasse: "D",
      gates: ["KO-07"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-14",
    titel: "Freigegebene Brandfallsteuermatrix fehlt",
    begruendung:
      "Ohne freigegebene Steuermatrix ist die Wirksamkeit der Brandfallsteuerungen nicht verifizierbar " +
      "(EVD Grad 4). KO-06 setzt NB: es wird kein scheinpraeziser Zahlenwert veroeffentlicht. Der interne " +
      "Rohwert bleibt erhalten, die Freigabe ist gesperrt.",
    abweichungen: {
      "T-BMA-EVD-02": { severity: 4 },
    },
    erwartung: {
      score: null,
      klasse: "NB",
      gates: ["KO-06"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: false,
    },
  },
  {
    id: "GM-BMA-15",
    titel: "Schutzkritisches Pflichtkriterium nicht pruefbar",
    begruendung:
      "Die Melderstichprobe war wegen laufender Produktion nicht durchfuehrbar. Ein schutzkritisches " +
      "Pflichtkriterium ohne Bewertung darf nicht als erfuellt gelten: KO-06 setzt NB und fordert die " +
      "Nachpruefung. Die Abdeckung sinkt nur um das Gewicht des Kriteriums auf 95,5 %, die Konfidenz bleibt " +
      "K4. Der Fall belegt, dass die Belastbarkeit hier nicht ueber die Konfidenz, sondern ueber das Gate " +
      "gesichert wird - eine einzelne schutzkritische Luecke waere sonst rechnerisch unauffaellig.",
    abweichungen: {
      "T-BMA-TPF-02": { applicability: "nicht_pruefbar" },
    },
    erwartung: {
      score: null,
      klasse: "NB",
      gates: ["KO-06"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "95,5",
      freigabefaehig: false,
    },
  },
  {
    id: "GM-BMA-16",
    titel: "Teilpruefung mit 80 Prozent Abdeckung",
    begruendung:
      "Die Pruefung konnte nur teilweise durchgefuehrt werden. Alle schutzkritischen Pflichtkriterien sind " +
      "bewertet, acht Kriterien mit zusammen 22 von 111 Gewichtspunkten fehlen: 89 / 111 = 80,2 %. Damit " +
      "liegt die Abdeckung zwischen 70 % und 85 %, zulaessig ist nur ein vorlaeufiger interner Score mit " +
      "maximal K2 - obwohl der rechnerische Konfidenzwert hoeher laege. Externe Freigabe ist gesperrt, " +
      "die Compliance-Aussage bleibt wegen des begrenzten Umfangs PARTIAL.",
    abweichungen: {},
    nichtBewertet: [
      "T-BMA-TPF-03",
      "T-BMA-TPF-04",
      "T-BMA-TPF-09",
      "T-BMA-ORG-03",
      "T-BMA-EVD-04",
      "T-BMA-IPH-04",
      "T-BMA-MEA-03",
      "T-BMA-MEA-04",
    ],
    erwartung: {
      score: "0,0",
      klasse: "A",
      gates: [],
      compliance: "PARTIAL",
      konfidenz: "K2",
      abdeckung: "80,2",
      freigabefaehig: false,
      vorlaeufig: true,
    },
  },
  {
    id: "GM-BMA-17",
    titel: "Nicht anwendbare Kriterien bei Anlage ohne Uebertragungseinrichtung",
    begruendung:
      "Fuer die Anlage ist keine Alarmweiterleitung gefordert; die drei Uebertragungskriterien sind nicht " +
      "anwendbar und werden aus Zaehler und Nenner entfernt. Der verbleibende Wartungsrueckstand " +
      "(MEA Grad 2) bestimmt das Ergebnis. Die Abdeckung bleibt bei 100 %, da nur anwendbare Kriterien " +
      "in den Nenner eingehen.",
    abweichungen: {
      "T-BMA-LRC-03": { applicability: "nicht_anwendbar" },
      "T-BMA-TPF-06": { applicability: "nicht_anwendbar" },
      "T-BMA-EVD-04": { applicability: "nicht_anwendbar" },
      "T-BMA-MEA-02": { severity: 2, modifiers: { F_R: "ueberfaellig" } },
    },
    erwartung: {
      score: "2,4",
      klasse: "A",
      gates: [],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-18",
    titel: "Belastbare Bewertung auf Basis von Vorperiodenevidenz",
    begruendung:
      "Alle Kriterien sind bewertet, die Evidenz stammt aber ueberwiegend aus der Vorperiode und ist " +
      "alternd. Der Score bleibt unveraendert - fehlende Evidenzqualitaet senkt nie den Punktwert, sondern " +
      "ausschliesslich die Konfidenz. K = 0,40 · 100 + 0,30 · 60 + 0,15 · 70 + 0,15 · 100 = 83,5 -> K3.",
    basisOverride: { quality: "vorperiode", actuality: "alternd" },
    abweichungen: {},
    erwartung: {
      score: "0,0",
      klasse: "A",
      gates: [],
      compliance: "CONFORM",
      konfidenz: "K3",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
  },
  {
    id: "GM-BMA-19",
    titel: "Integritaetsmangel sperrt die externe Veroeffentlichung",
    begruendung:
      "Die Unabhaengigkeit des Pruefers ist nicht dokumentiert. KO-08 sperrt die Freigabe, ohne den " +
      "berechneten internen Rohwert zu veraendern: D_EVD = 100 · 3 · 0,50 / 13 = 11,54, S_raw = 1,15. " +
      "Der Wert bleibt bestehen, darf aber nicht extern verwendet werden.",
    abweichungen: {
      "T-BMA-EVD-03": { severity: 2 },
    },
    manuelleGates: [{ code: "KO-08", reason: "Unabhaengigkeit des Pruefers nicht dokumentiert" }],
    erwartung: {
      score: "1,2",
      klasse: "A",
      gates: ["KO-08"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: false,
    },
  },
  {
    id: "GM-BMA-20",
    titel: "Anhang B - Rechenbeispiel des PRD",
    begruendung:
      "Nachbildung des Rechenbeispiels aus Anhang B: ein Pruefpunkt mit Schweregrad 3, erheblichem Ausmass, " +
      "regulaerer Exposition, wiederholter Feststellung und ohne Uebergangsmassnahme ergibt " +
      "r = min(1; 0,75 · 1,20) = 0,90 und bei Kontrollgewicht 5 den gewichteten Beitrag 4,50. " +
      "Die Profilregel des Kriteriums loest zusaetzlich KO-03 aus.",
    abweichungen: {
      "T-BMA-TPF-07": { severity: 3, modifiers: { F_A: "erheblich", F_E: "regulaer", F_R: "wiederholt", F_M: "keine" } },
    },
    erwartung: {
      score: "50,0",
      klasse: "D",
      gates: ["KO-03"],
      compliance: "CONFORM",
      konfidenz: "K4",
      abdeckung: "100,0",
      freigabefaehig: true,
    },
    pruefpunkt: { criterionId: "T-BMA-TPF-07", r: 0.9, beitrag: 4.5 },
  },
];

export default GOLDEN_MASTERS;

/**
 * Baut die Berechnungseingabe eines Referenzfalls: Basiszustand fuer alle
 * Kriterien, darueber die beschriebenen Abweichungen und Pruefumfangsluecken.
 */
export function buildCase(golden, profileId = "T-BMA") {
  const profile = getProfile(profileId);
  const basis = { ...BASIS, ...(golden.basisOverride ?? {}) };
  const evaluations = {};
  for (const criterion of profile.criteria) {
    if (golden.nichtBewertet?.includes(criterion.id)) continue;
    evaluations[criterion.id] = {
      ...emptyEvaluation(),
      severity: basis.severity,
      evidenceQuality: basis.quality,
      evidenceActuality: basis.actuality,
      evidenceRefs: ["Pruefprotokoll"],
    };
  }
  for (const [criterionId, abweichung] of Object.entries(golden.abweichungen ?? {})) {
    const base = evaluations[criterionId] ?? { ...emptyEvaluation() };
    evaluations[criterionId] = {
      ...base,
      ...abweichung,
      modifiers: { ...base.modifiers, ...(abweichung.modifiers ?? {}) },
    };
  }
  return {
    profileId: profile.id,
    evaluations,
    reviewLevel: basis.reviewLevel,
    gateEvents: golden.manuelleGates ?? [],
    scope: { objectId: golden.id, company: "Golden Master", site: "Referenzfall" },
  };
}

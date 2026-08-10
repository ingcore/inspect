/**
 * INGTEC Safety Navigator – Anlagenstamm ("Erste Anlagenbibliothek")
 *
 * Modell laut Spezifikation Abschnitt 13/14: `ingtec.system.type`
 * Bibliotheksumfang laut Abschnitt 15.
 *
 * WICHTIGER HINWEIS ZUR QUELLENQUALITAET
 * --------------------------------------
 * Sämtliche in dieser Datei hinterlegten Rechtsgrundlagen, Normen, Fristen und
 * Prüfarten sind ENTWURFSVORSCHLAEGE für den Aufbau des Regelwerks. Sie sind
 * mit `source_status: 'red'` gekennzeichnet (Quellenampel der INGTEC-Systematik:
 * rot = ungeprüft/aus Muster, gelb = Vorperiode, grün = fachlich verifiziert).
 *
 * Erst nach fachlicher Prüfung und Freigabe durch den zuständigen
 * INGTEC-Fachbereich darf ein Datensatz auf 'green' gesetzt werden. Die Rule
 * Engine gibt gegenüber externen Nutzern ausschließlich freigegebene Inhalte
 * aus (siehe Spezifikation Abschnitt 24 und `engine/rule-engine.js`).
 *
 * KATEGORIEZUORDNUNG
 * ------------------
 * Abschnitt 15 gruppiert die Startbibliothek in Brandschutz, Arbeitsmittel und
 * Gebäudetechnik. Abschnitt 12 kennt darüber hinaus Maschinensicherheit,
 * Elektrotechnik, Arbeitnehmerschutz, Absturzsicherung und Verkehrstechnik.
 * Umsetzung: `category` folgt der Gruppierung aus Abschnitt 15,
 * `secondary_categories` bildet die feinere fachliche Zuordnung ab. Damit
 * bleiben beide Abschnitte der Spezifikation erfüllt.
 *
 * @typedef {object} Interval
 * @property {number|null} value
 * @property {'month'|'year'|null} unit
 * @property {string} note
 *
 * @typedef {object} SystemType
 * @property {string}   id                       z. B. SYS-AT-GATE-001
 * @property {string}   category                 Primäre Anlagenkategorie
 * @property {string[]} secondary_categories     Weitere fachliche Zuordnungen
 * @property {string}   name                     Bezeichnung
 * @property {string[]} synonyms                 Synonyme für die Suche
 * @property {string}   layman_description       Laienbeschreibung
 * @property {string}   technical_description    Fachlich vollständiger Text
 * @property {string}   image                    Detailansicht (Odoo: ir.attachment)
 * @property {string}   icon                     Icon für Liste und Chips
 * @property {string}   svg_layer_id             Layer der Gebäudegrafik
 * @property {string}   svg_object_id            SVG Layer/Objekt-ID
 * @property {string}   hotspot_id               Hotspot-ID in der Grafik
 * @property {boolean}  maintenance_relevant     Wartung relevant
 * @property {boolean}  inspection_relevant      Inspektion relevant
 * @property {boolean}  test_relevant            Prüfung relevant
 * @property {boolean}  revision_relevant        Revision relevant
 * @property {Interval} typical_interval         Typische Prüffrist
 * @property {string}   interval_type            Fristart
 * @property {string}   test_type                Prüfart
 * @property {string}   department               Zuständiger INGTEC-Fachbereich
 * @property {string}   expertise                Erforderliche Fachkunde
 * @property {string[]} required_documents       Benötigte Unterlagen
 * @property {string[]} typical_hazards          Typische Gefährdungen
 * @property {string[]} typical_defects          Typische Mängel
 * @property {string[]} legal_bases              Mögliche Rechtsgrundlagen
 * @property {{trvb: string[], onorm: string[], en: string[], iso: string[]}} standards
 * @property {string}   manufacturer_requirements
 * @property {boolean}  permit_relevant          Bescheidrelevanz
 * @property {string}   safety_score_category    Safety-Score(R)-Kategorie
 * @property {'red'|'yellow'|'green'} source_status
 * @property {number}   sequence
 * @property {boolean}  active
 */

/** Fristart-Ausprägungen. */
export const INTERVAL_TYPES = {
  RECURRING: 'wiederkehrend',
  INITIAL: 'erstmalig vor Inbetriebnahme',
  EVENT: 'anlassbezogen',
  CONTINUOUS: 'laufend',
};

/** Prüfart-Ausprägungen. */
export const TEST_TYPES = {
  RECURRING: 'Wiederkehrende Prüfung',
  ACCEPTANCE: 'Abnahmeprüfung',
  REVISION: 'Revision',
  INSPECTION: 'Inspektion',
  MAINTENANCE: 'Wartung',
};

let sequenceCounter = 0;

/**
 * Erzeugt einen Anlagenstammsatz mit Standardwerten.
 * @param {Partial<SystemType> & {id: string, category: string, name: string}} data
 * @returns {SystemType}
 */
function sys(data) {
  sequenceCounter += 10;
  return {
    secondary_categories: [],
    synonyms: [],
    layman_description: '',
    technical_description: '',
    image: '',
    icon: '▢',
    svg_layer_id: '',
    svg_object_id: '',
    hotspot_id: '',
    maintenance_relevant: false,
    inspection_relevant: false,
    test_relevant: false,
    revision_relevant: false,
    typical_interval: { value: null, unit: null, note: '' },
    interval_type: INTERVAL_TYPES.RECURRING,
    test_type: TEST_TYPES.RECURRING,
    department: '',
    expertise: '',
    required_documents: [],
    typical_hazards: [],
    typical_defects: [],
    legal_bases: [],
    standards: { trvb: [], onorm: [], en: [], iso: [] },
    manufacturer_requirements: 'Herstellervorgaben laut Betriebs- und Wartungsanleitung beachten.',
    permit_relevant: false,
    safety_score_category: '',
    source_status: 'red',
    sequence: sequenceCounter,
    active: true,
    ...data,
  };
}

/* -------------------------------------------------------------------------
 * Brandschutz
 * ---------------------------------------------------------------------- */

const FIRE = 'brandschutz';
const FIRE_LAYER = 'layer_fire_protection';
const FIRE_DEPT = 'Brandschutztechnik';

/** @type {SystemType[]} */
const FIRE_PROTECTION = [
  sys({
    id: 'SYS-AT-BMA-001',
    category: FIRE,
    name: 'Brandmeldeanlage',
    synonyms: ['BMA', 'Brandmeldesystem', 'Feuermeldeanlage', 'Brandmelder Anlage'],
    icon: '◉',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_bma',
    hotspot_id: 'hotspot_bma_01',
    layman_description:
      'Anlage, die einen Brand automatisch erkennt, Alarm auslöst und in der Regel die Feuerwehr verständigt.',
    technical_description:
      'Gesamtanlage aus Brandmeldezentrale, automatischen und nichtautomatischen Meldern, Alarmierungseinrichtungen, Übertragungseinrichtung und Peripherie zur Früherkennung von Bränden sowie zur Ansteuerung von Brandfallsteuerungen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'zusätzlich laufende Eigenkontrollen des Betreibers' },
    test_type: TEST_TYPES.RECURRING,
    department: FIRE_DEPT,
    expertise: 'Akkreditierte bzw. fachkundige Prüfstelle für Brandmeldeanlagen',
    required_documents: [
      'Brandschutzkonzept oder behördlicher Bescheid',
      'Anlagenbeschreibung und Meldergruppenverzeichnis',
      'Brandfallsteuermatrix',
      'Betriebsbuch der Brandmeldeanlage',
      'Wartungsnachweise der Errichterfirma',
      'letzter Prüfbefund',
    ],
    typical_hazards: [
      'verzögerte oder unterbliebene Brandentdeckung',
      'fehlende Alarmweiterleitung an die Feuerwehr',
      'Fehlalarme mit Betriebsunterbrechung',
    ],
    typical_defects: [
      'Störungsmeldungen dauerhaft anstehend',
      'Melder verschmutzt, überklebt oder verstellt',
      'Brandfallsteuerungen nicht mit der Matrix übereinstimmend',
      'Betriebsbuch unvollständig geführt',
    ],
    legal_bases: [
      'behördlicher Betriebsanlagenbescheid',
      'landesrechtliche Bauvorschriften und Feuerpolizeigesetze',
    ],
    standards: { trvb: ['TRVB S 123 – Brandmeldeanlagen'], onorm: ['ÖNORM F 3001'], en: ['EN 54'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Detektion und Alarmierung',
  }),
  sys({
    id: 'SYS-AT-BMZ-001',
    category: FIRE,
    name: 'Brandmeldezentrale',
    synonyms: ['BMZ', 'Zentrale', 'Brandmelderzentrale', 'Feuerwehrbedienfeld'],
    icon: '▣',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_bmz',
    hotspot_id: 'hotspot_bmz_01',
    layman_description:
      'Das Steuergerät der Brandmeldeanlage. Hier laufen alle Meldungen zusammen und werden angezeigt.',
    technical_description:
      'Zentrale Auswerte- und Steuereinheit einer Brandmeldeanlage inklusive Energieversorgung, Anzeige- und Bedieneinrichtungen sowie Schnittstellen zu Feuerwehrperipherie und Brandfallsteuerungen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'Batterie- und Notstromversorgung gesondert beurteilen' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Prüfstelle für Brandmeldeanlagen',
    required_documents: ['Zentralenbeschreibung', 'Programmierprotokoll', 'Batterieprüfprotokoll', 'Betriebsbuch'],
    typical_hazards: ['Ausfall der Auswertung im Brandfall', 'unzureichende Notstromreserve'],
    typical_defects: ['Akkus überaltert', 'Zugang zur Zentrale verstellt', 'Beschriftung fehlt'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB S 123'], onorm: [], en: ['EN 54-2', 'EN 54-4'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Detektion und Alarmierung',
  }),
  sys({
    id: 'SYS-AT-DET-001',
    category: FIRE,
    name: 'Automatische Brandmelder',
    synonyms: ['Rauchmelder', 'Rauchwarnmelder', 'Wärmemelder', 'Melder', 'Punktmelder', 'Ansaugrauchmelder'],
    icon: '◎',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_detector',
    hotspot_id: 'hotspot_detector_01',
    layman_description: 'Geräte an der Decke, die Rauch oder Wärme selbsttätig erkennen.',
    technical_description:
      'Automatische Melder zur Detektion von Brandkenngrößen (Rauch, Wärme, Flamme) einschließlich Ansaugrauchmeldeanlagen und linienförmiger Melder.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'Stichprobenprüfung nach festgelegtem Schlüssel' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Prüfstelle für Brandmeldeanlagen',
    required_documents: ['Meldergruppenverzeichnis', 'Melderplan', 'Wartungsnachweis'],
    typical_hazards: ['unerkannte Brandentstehung', 'Täuschungsalarme'],
    typical_defects: ['Melder verschmutzt', 'Melder abgehängt oder abgedeckt', 'ungeeigneter Meldertyp im Bereich'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB S 123'], onorm: [], en: ['EN 54-5', 'EN 54-7', 'EN 54-20'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Detektion und Alarmierung',
  }),
  sys({
    id: 'SYS-AT-MCP-001',
    category: FIRE,
    name: 'Handfeuermelder',
    synonyms: ['Druckknopfmelder', 'Handmelder', 'Feuermelder', 'Alarmtaster'],
    icon: '■',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_mcp',
    hotspot_id: 'hotspot_mcp_01',
    layman_description: 'Roter Melder an der Wand, mit dem Personen im Brandfall selbst Alarm auslösen können.',
    technical_description:
      'Nichtautomatische Brandmelder in Flucht- und Rettungswegen sowie an Ausgängen zur manuellen Alarmauslösung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Prüfstelle für Brandmeldeanlagen',
    required_documents: ['Melderplan', 'Wartungsnachweis'],
    typical_hazards: ['keine manuelle Alarmierungsmöglichkeit'],
    typical_defects: ['Melder verstellt oder verdeckt', 'Kennzeichnung fehlt', 'Glas beschädigt'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB S 123'], onorm: [], en: ['EN 54-11'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Detektion und Alarmierung',
  }),
  sys({
    id: 'SYS-AT-FCTRL-001',
    category: FIRE,
    name: 'Brandfallsteuerungen',
    synonyms: ['Brandfallsteuerung', 'Ansteuerungen', 'Steuermatrix', 'Brandfallmatrix', 'Aufzugsteuerung Brandfall'],
    icon: '⇉',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_fire_control',
    hotspot_id: 'hotspot_fire_control_01',
    layman_description:
      'Automatische Reaktionen im Brandfall, zum Beispiel Türen schließen, Aufzüge ins Erdgeschoss fahren oder Lüftungen abschalten.',
    technical_description:
      'Steuerungsfunktionen, die durch die Brandmeldeanlage ausgelöst werden: Feststellanlagen, Brandschutzklappen, Aufzugsevakuierungsfahrt, Abschaltung von Lüftungsanlagen, Ansteuerung von RWA und Druckbelüftung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'Funktionsprüfung gegen die freigegebene Steuermatrix' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Prüfstelle für Brandmeldeanlagen; Einbindung der Gewerke',
    required_documents: ['freigegebene Brandfallsteuermatrix', 'Funktionsprüfprotokolle', 'Schnittstellenliste'],
    typical_hazards: ['Rauchausbreitung über offene Abschlüsse', 'Personen im Aufzug eingeschlossen'],
    typical_defects: ['Matrix nicht aktuell', 'einzelne Steuerungen ohne Funktion', 'Gewerke nicht abgestimmt'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB S 123', 'TRVB S 112'], onorm: [], en: [], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Wirksamkeit im Ereignisfall',
  }),
  sys({
    id: 'SYS-AT-RWA-001',
    category: FIRE,
    name: 'Rauch- und Wärmeabzugsanlage',
    synonyms: ['RWA', 'Rauchabzug', 'Wärmeabzug', 'RWA-Anlage', 'Rauchklappe', 'Lichtkuppel RWA'],
    icon: '△',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_rwa',
    hotspot_id: 'hotspot_rwa_01',
    layman_description:
      'Öffnet im Brandfall Rauchabzugsöffnungen bzw. unterstützt die Rauchableitung.',
    technical_description:
      'Anlage zur Abführung von Rauch und Wärme aus einem Brandabschnitt, bestehend aus Rauchabzugsgeräten, Nachströmöffnungen, Auslöse- und Energieversorgungseinrichtungen sowie Bedienstellen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Prüfstelle für Rauch- und Wärmeabzugsanlagen',
    required_documents: [
      'Anlagenbeschreibung und Auslegungsnachweis',
      'Bedienstellenplan',
      'Wartungsnachweise',
      'letzter Prüfbefund',
    ],
    typical_hazards: ['Verrauchung von Flucht- und Rettungswegen', 'Behinderung des Löschangriffs'],
    typical_defects: [
      'Antriebe ohne Funktion',
      'Nachströmöffnungen blockiert',
      'Bedienstelle nicht gekennzeichnet oder verstellt',
    ],
    legal_bases: ['behördlicher Betriebsanlagenbescheid', 'landesrechtliche Bauvorschriften'],
    standards: { trvb: ['TRVB S 125 – Rauch- und Wärmeabzugsanlagen'], onorm: [], en: ['EN 12101'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Entrauchung',
  }),
  sys({
    id: 'SYS-AT-BRE-001',
    category: FIRE,
    name: 'Brandrauchentlüftung',
    synonyms: ['BRE', 'maschinelle Entrauchung', 'Entrauchungsanlage', 'Entrauchungsventilator'],
    icon: '≋',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_bre',
    hotspot_id: 'hotspot_bre_01',
    layman_description: 'Ventilatoren, die im Brandfall Rauch aktiv aus dem Gebäude fördern.',
    technical_description:
      'Maschinelle Entrauchungsanlage mit Entrauchungsventilatoren, Kanalnetz, Entrauchungsklappen und zugehöriger Steuerung, ausgelegt für den Betrieb bei erhöhter Temperatur.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Prüfstelle für Entrauchungsanlagen',
    required_documents: ['Auslegungsnachweis', 'Steuerungsbeschreibung', 'Wartungsnachweise'],
    typical_hazards: ['unwirksame Entrauchung', 'Rauchübertragung in andere Brandabschnitte'],
    typical_defects: ['Klappen ohne Funktion', 'Ventilator ohne Notstromversorgung', 'Volumenstrom nicht nachgewiesen'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB S 125'], onorm: [], en: ['EN 12101-3'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Entrauchung',
  }),
  sys({
    id: 'SYS-AT-DBA-001',
    category: FIRE,
    name: 'Druckbelüftungsanlage',
    synonyms: ['DBA', 'Überdrucklüftung', 'Stiegenhausdruckbelüftung', 'Rauchfreihaltung'],
    icon: '⇧',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_dba',
    hotspot_id: 'hotspot_dba_01',
    layman_description:
      'Hält Stiegenhäuser und Fluchtwege durch Überdruck rauchfrei, damit Personen flüchten können.',
    technical_description:
      'Anlage zur Rauchfreihaltung von Sicherheitsstiegenhäusern, Schleusen und Aufzugsschächten durch Erzeugung eines definierten Überdrucks bzw. einer Mindestströmungsgeschwindigkeit.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Prüfstelle für Druckbelüftungsanlagen',
    required_documents: ['Auslegungs- und Messnachweis', 'Wartungsnachweise', 'letzter Prüfbefund'],
    typical_hazards: ['Verrauchung des Fluchtstiegenhauses', 'Türen nicht mehr zu öffnen bei zu hohem Druck'],
    typical_defects: ['Druckdifferenz außerhalb des Sollbereichs', 'Abströmöffnung blockiert'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB S 127 – Druckbelüftungsanlagen'], onorm: [], en: ['EN 12101-6'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Entrauchung',
  }),
  sys({
    id: 'SYS-AT-SPR-001',
    category: FIRE,
    name: 'Sprinkleranlage',
    synonyms: ['Sprinkler', 'Löschanlage', 'ortsfeste Löschanlage', 'Sprinklerzentrale', 'Nassanlage'],
    icon: '☂',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_sprinkler',
    hotspot_id: 'hotspot_sprinkler_01',
    layman_description:
      'Fest installierte Löschanlage, die im Brandfall automatisch Wasser abgibt.',
    technical_description:
      'Ortsfeste Wasserlöschanlage mit Sprinklerzentrale, Wasserversorgung, Pumpen, Alarmventilstationen, Rohrnetz und Sprinklern zur selbsttätigen Brandbekämpfung und Alarmierung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: {
      value: 1,
      unit: 'year',
      note: 'zusätzlich wöchentliche und monatliche Eigenkontrollen des Betreibers',
    },
    department: FIRE_DEPT,
    expertise: 'Akkreditierte Prüfstelle für ortsfeste Löschanlagen',
    required_documents: [
      'Anlagenbuch der Sprinkleranlage',
      'hydraulische Berechnung',
      'Wartungs- und Eigenkontrollnachweise',
      'letzter Prüfbefund',
    ],
    typical_hazards: ['Versagen der Löschwirkung', 'Wasserschaden durch Fehlauslösung', 'unzureichende Wasserversorgung'],
    typical_defects: [
      'Sprinkler überlagert, verschmutzt oder überstrichen',
      'Lagerhöhe überschritten, Schutzziel nicht mehr erfüllt',
      'Pumpenprobelauf nicht dokumentiert',
    ],
    legal_bases: ['behördlicher Betriebsanlagenbescheid', 'Auflagen des Sachversicherers'],
    standards: { trvb: ['TRVB S 151 – Sprinkleranlagen'], onorm: [], en: ['EN 12845'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Löschtechnik',
  }),
  sys({
    id: 'SYS-AT-HYD-001',
    category: FIRE,
    name: 'Wandhydranten',
    synonyms: ['Wandhydrant', 'Löschwasserschlauch', 'Hydrant im Gebäude', 'Löschhilfe'],
    icon: '⊡',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_hydrant',
    hotspot_id: 'hotspot_hydrant_01',
    layman_description:
      'Schlauchanschluss im Gebäude, mit dem ein Entstehungsbrand bekämpft werden kann.',
    technical_description:
      'Wandhydranten für die erweiterte Löschhilfe bzw. für die Feuerwehr, einschließlich Schlauchhaspel, Armaturen, Versorgungsleitung und Druckerhöhungsanlage.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Person für Löschwassereinrichtungen',
    required_documents: ['Hydrantenplan', 'Druck- und Durchflussnachweis', 'Wartungsnachweise'],
    typical_hazards: ['keine wirksame Löschhilfe bei Entstehungsbrand'],
    typical_defects: ['Hydrant verstellt', 'Druck unzureichend', 'Schlauch beschädigt', 'Kennzeichnung fehlt'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB F 128'], onorm: [], en: ['EN 671'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Löschtechnik',
  }),
  sys({
    id: 'SYS-AT-RISER-001',
    category: FIRE,
    name: 'Steigleitung',
    synonyms: ['trockene Steigleitung', 'nasse Steigleitung', 'Löschwasserleitung', 'Steigleitung trocken'],
    icon: '⌷',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_riser',
    hotspot_id: 'hotspot_riser_01',
    layman_description:
      'Fest verlegte Leitung im Gebäude, über die die Feuerwehr Löschwasser in obere Geschosse fördert.',
    technical_description:
      'Trockene oder nasse Steigleitung mit Einspeise- und Entnahmestellen zur Löschwasserversorgung durch die Feuerwehr.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'Dichtheits- und Druckprüfung in längeren Intervallen' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Person für Löschwassereinrichtungen',
    required_documents: ['Leitungsplan', 'Druckprüfprotokoll', 'Wartungsnachweise'],
    typical_hazards: ['verzögerter Löschangriff in Obergeschossen'],
    typical_defects: ['Einspeisestelle nicht zugänglich', 'Kupplungen beschädigt', 'Leitung undicht'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB F 128'], onorm: [], en: [], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Löschtechnik',
  }),
  sys({
    id: 'SYS-AT-EXT-001',
    category: FIRE,
    name: 'Feuerlöscher',
    synonyms: ['Handfeuerlöscher', 'Löscher', 'Pulverlöscher', 'CO2-Löscher', 'Fahrbarer Löscher'],
    icon: '⊗',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_extinguisher',
    hotspot_id: 'hotspot_extinguisher_01',
    layman_description: 'Tragbares Gerät zur Bekämpfung von Entstehungsbränden.',
    technical_description:
      'Tragbare und fahrbare Feuerlöscher der ersten Löschhilfe, ausgewählt nach Brandklasse, Löschmitteleinheiten und Bereichsnutzung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 2, unit: 'year', note: 'Überprüfung durch Fachkundige; Druckbehälterprüfung gesondert' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Person für Feuerlöscher',
    required_documents: ['Löscherverzeichnis', 'Prüfplaketten', 'Nachweis der Löschmitteleinheiten'],
    typical_hazards: ['Entstehungsbrand kann nicht bekämpft werden'],
    typical_defects: ['Prüfintervall überschritten', 'Löscher verstellt oder nicht gekennzeichnet', 'Druckverlust'],
    legal_bases: ['ASchG', 'AStV', 'behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB F 124'], onorm: ['ÖNORM F 1053'], en: ['EN 3'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – Erste Löschhilfe',
  }),
  sys({
    id: 'SYS-AT-FDOOR-001',
    category: FIRE,
    name: 'Brandschutztür',
    synonyms: ['Brandschutztüre', 'T30', 'T90', 'Feuerschutztür', 'Rauchschutztür'],
    icon: '▯',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_fire_door',
    hotspot_id: 'hotspot_fire_door_01',
    layman_description:
      'Tür, die im Brandfall Feuer und Rauch für eine bestimmte Zeit zurückhält.',
    technical_description:
      'Feuer- und/oder rauchhemmender Türabschluss in Brandabschnittsbildungen, einschließlich Beschlägen, Schließmitteln und gegebenenfalls Feststellanlage.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'zusätzlich laufende Sichtkontrollen' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Person für bauliche Brandschutzabschlüsse',
    required_documents: ['Verwendbarkeitsnachweis', 'Türbuch bzw. Abschlussverzeichnis', 'Wartungsnachweise'],
    typical_hazards: ['Brand- und Rauchübertragung in andere Brandabschnitte'],
    typical_defects: [
      'Tür aufgekeilt oder dauerhaft offen gehalten',
      'Schließmittel defekt, Tür schließt nicht vollständig',
      'Dichtungen beschädigt',
    ],
    legal_bases: ['behördlicher Betriebsanlagenbescheid', 'landesrechtliche Bauvorschriften'],
    standards: { trvb: [], onorm: ['ÖNORM B 3850'], en: ['EN 16034'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – baulicher Brandschutz',
  }),
  sys({
    id: 'SYS-AT-FGATE-001',
    category: FIRE,
    name: 'Brandschutztor',
    synonyms: ['Brandschutzschiebetor', 'Feuerschutztor', 'Rolltor Brandschutz', 'Brandschutzabschluss Tor'],
    icon: '⊟',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_fire_gate',
    hotspot_id: 'hotspot_fire_gate_01',
    layman_description:
      'Großes Tor, das im Brandfall automatisch schließt und Hallenbereiche trennt.',
    technical_description:
      'Feuerhemmender Torabschluss, in der Regel mit Feststellanlage und Auslöseeinrichtung, zur Abtrennung von Brandabschnitten in Hallen- und Produktionsbereichen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Person für Brandschutzabschlüsse und Feststellanlagen',
    required_documents: ['Verwendbarkeitsnachweis', 'Wartungsnachweise', 'Funktionsprüfprotokoll'],
    typical_hazards: ['Brandausbreitung über Hallenbereiche', 'Quetschgefahr beim Schließvorgang'],
    typical_defects: ['Laufbahn verstellt oder verschmutzt', 'Auslösung ohne Funktion', 'Schließgeschwindigkeit unzulässig'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: [], onorm: ['ÖNORM B 3850'], en: ['EN 16034'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – baulicher Brandschutz',
  }),
  sys({
    id: 'SYS-AT-HOLD-001',
    category: FIRE,
    name: 'Feststellanlage',
    synonyms: ['FSA', 'Haftmagnet', 'Türfeststellanlage', 'Rauchschalter Tür'],
    icon: '⌾',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_hold_open',
    hotspot_id: 'hotspot_hold_open_01',
    layman_description:
      'Hält Brandschutztüren im Alltag offen und schließt sie im Brandfall automatisch.',
    technical_description:
      'Anlage aus Brandmelder, Energieversorgung, Feststellvorrichtung und Auslösetaster zur zulässigen Offenhaltung von Brandschutzabschlüssen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'zusätzlich monatliche Funktionskontrolle durch den Betreiber' },
    department: FIRE_DEPT,
    expertise: 'Fachkundige Person für Feststellanlagen',
    required_documents: ['Anlagenbeschreibung', 'Wartungs- und Kontrollnachweise'],
    typical_hazards: ['Brandschutzabschluss bleibt im Brandfall offen'],
    typical_defects: ['Rauchmelder verschmutzt', 'Auslösetaster fehlt', 'Feststellung ohne Anlage improvisiert'],
    legal_bases: ['behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: [], onorm: ['ÖNORM B 3850'], en: ['EN 14637'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Brandschutz – baulicher Brandschutz',
  }),
  sys({
    id: 'SYS-AT-EMLIGHT-001',
    category: FIRE,
    secondary_categories: ['elektrotechnik', 'arbeitnehmerschutz'],
    name: 'Sicherheitsbeleuchtung',
    synonyms: ['Notbeleuchtung', 'Notlicht', 'Ersatzbeleuchtung', 'Sicherheitsleuchte'],
    icon: '☀',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_emergency_light',
    hotspot_id: 'hotspot_emergency_light_01',
    layman_description:
      'Beleuchtung, die bei Stromausfall automatisch einschaltet, damit Personen das Gebäude verlassen können.',
    technical_description:
      'Sicherheitsbeleuchtungsanlage mit Sicherheitsstromversorgung (Zentralbatterie, Gruppenbatterie oder Einzelbatterie) für Flucht- und Rettungswege, Arbeitsplätze mit besonderer Gefährdung und Antipanikbereiche.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: {
      value: 1,
      unit: 'year',
      note: 'Bemessungsbetriebsdauerprüfung jährlich, Kurzprüfungen monatlich',
    },
    department: 'Elektrotechnik',
    expertise: 'Elektrofachkraft mit Kenntnis der Sicherheitsbeleuchtung',
    required_documents: ['Anlagenbuch der Sicherheitsbeleuchtung', 'Prüfbuch', 'Beleuchtungsberechnung'],
    typical_hazards: ['Panik und Sturzgefahr bei Stromausfall', 'Fluchtweg nicht auffindbar'],
    typical_defects: [
      'Leuchten ohne Funktion',
      'Batterien überaltert',
      'Bemessungsbetriebsdauer nicht erreicht',
      'Prüfbuch nicht geführt',
    ],
    legal_bases: ['ASchG', 'AStV', 'behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: ['TRVB E 102'], onorm: [], en: ['EN 1838', 'EN 50172'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Flucht- und Rettungswege',
  }),
  sys({
    id: 'SYS-AT-EXITSIGN-001',
    category: FIRE,
    secondary_categories: ['arbeitnehmerschutz'],
    name: 'Fluchtwegorientierungsbeleuchtung',
    synonyms: ['Fluchtwegbeleuchtung', 'Rettungszeichenleuchte', 'Notausgangsschild beleuchtet', 'Piktogrammleuchte'],
    icon: '⇥',
    svg_layer_id: FIRE_LAYER,
    svg_object_id: 'system_exit_sign',
    hotspot_id: 'hotspot_exit_sign_01',
    layman_description: 'Beleuchtete grüne Schilder, die den Weg zum Notausgang zeigen.',
    technical_description:
      'Hinterleuchtete oder beleuchtete Rettungszeichen zur Kennzeichnung von Flucht- und Rettungswegen, Notausgängen und sicherheitsrelevanten Einrichtungen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'analog Sicherheitsbeleuchtung' },
    department: 'Elektrotechnik',
    expertise: 'Elektrofachkraft mit Kenntnis der Sicherheitsbeleuchtung',
    required_documents: ['Fluchtwegplan', 'Prüfbuch', 'Erkennungsweitennachweis'],
    typical_hazards: ['Fluchtweg wird nicht gefunden'],
    typical_defects: ['Zeichen verdeckt oder falsch orientiert', 'Leuchte ohne Funktion', 'veraltete Piktogramme'],
    legal_bases: ['ASchG', 'Kennzeichnungsverordnung', 'AStV'],
    standards: { trvb: ['TRVB E 102'], onorm: [], en: ['EN 1838', 'EN ISO 7010'], iso: ['ISO 7010'] },
    permit_relevant: true,
    safety_score_category: 'Flucht- und Rettungswege',
  }),
];

/* -------------------------------------------------------------------------
 * Arbeitsmittel
 * ---------------------------------------------------------------------- */

const EQUIP = 'arbeitsmittel';
const EQUIP_LAYER = 'layer_work_equipment';
const EQUIP_DEPT = 'Arbeitsmittel und Maschinensicherheit';
const AMVO = 'AM-VO – Arbeitsmittelverordnung';
const ASCHG = 'ASchG – ArbeitnehmerInnenschutzgesetz';

/** @type {SystemType[]} */
const WORK_EQUIPMENT = [
  sys({
    id: 'SYS-AT-GATE-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit'],
    name: 'Kraftbetriebenes Tor',
    synonyms: ['Rolltor', 'Sektionaltor', 'Schnelllauftor', 'Schiebetor', 'Garagentor', 'Drehflügeltor', 'Falttor', 'Tor'],
    icon: '⊞',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_gate',
    hotspot_id: 'hotspot_gate_01',
    layman_description:
      'Motorisch betriebenes Tor zum Öffnen oder Schließen einer Gebäudeöffnung.',
    technical_description:
      'Kraftbetriebener Torabschluss einschließlich Antrieb, Steuerung, Sicherheitseinrichtungen gegen Quetschen und Scheren, Absturzsicherung des Torblatts und Notentriegelung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: false,
    typical_interval: { value: 1, unit: 'year', note: 'häufigeres Intervall bei hoher Zyklenzahl' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person für kraftbetriebene Tore',
    required_documents: [
      'Betriebsanleitung des Herstellers',
      'Konformitätserklärung',
      'Prüfbuch bzw. Tordokumentation',
      'Wartungsnachweise',
    ],
    typical_hazards: [
      'Quetschen und Scheren an Schließkanten',
      'Absturz des Torblatts bei Federbruch',
      'Einzug an Laufrollen und Ketten',
    ],
    typical_defects: [
      'Sicherheitsleiste oder Lichtschranke ohne Funktion',
      'Federbruchsicherung nicht geprüft',
      'Notentriegelung fehlt oder unbekannt',
      'kein Prüfbuch vorhanden',
    ],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: [], en: ['EN 12453', 'EN 13241'], iso: [] },
    manufacturer_requirements:
      'Wartungsintervalle und Zyklenzahlen laut Herstellervorgabe; Federwechsel nach Lastspielzahl.',
    permit_relevant: true,
    safety_score_category: 'Arbeitsmittelsicherheit',
  }),
  sys({
    id: 'SYS-AT-CRANE-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit'],
    name: 'Krananlage',
    synonyms: ['Kran', 'Portalkran', 'Schwenkkran', 'Säulenschwenkkran', 'Ladekran', 'Hebezeug'],
    icon: '⌐',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_crane',
    hotspot_id: 'hotspot_crane_01',
    layman_description: 'Anlage zum Heben und Bewegen schwerer Lasten.',
    technical_description:
      'Hebezeug mit Tragkonstruktion, Hubwerk, Fahrwerken, Steuerung, Lastaufnahmemitteln und Sicherheitseinrichtungen wie Überlastsicherung und Endschaltern.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'zusätzlich wiederkehrende Begutachtung in längeren Intervallen' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person bzw. Ziviltechniker für Hebeanlagen',
    required_documents: [
      'Kranbuch',
      'Konformitätserklärung und Betriebsanleitung',
      'Lastdiagramm',
      'letzter Prüfbefund',
      'Nachweis der theoretischen Restnutzungsdauer',
    ],
    typical_hazards: ['Lastabsturz', 'Quetschen zwischen Last und Bauteil', 'Anprall an Personen'],
    typical_defects: [
      'Überlastsicherung nicht geprüft',
      'Seil- oder Kettenschäden',
      'Kranbuch unvollständig',
      'Endschalter unwirksam',
    ],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: ['ÖNORM M 9600'], en: ['EN 13001'], iso: ['ISO 9927', 'ISO 12482'] },
    permit_relevant: true,
    safety_score_category: 'Hebetechnik',
  }),
  sys({
    id: 'SYS-AT-OHCRANE-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit'],
    name: 'Laufkran',
    synonyms: ['Brückenkran', 'Hallenkran', 'Deckenkran', 'Zweiträgerkran', 'Einträgerkran'],
    icon: '⌂',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_overhead_crane',
    hotspot_id: 'hotspot_overhead_crane_01',
    layman_description: 'Kran, der auf Schienen unter dem Hallendach fährt.',
    technical_description:
      'Auf Kranbahn verfahrbarer Brückenkran mit Katze, Hubwerk, Kranbahn, Stromzuführung und zugehörigen Sicherheitseinrichtungen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'Kranbahn gesondert beurteilen' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person bzw. Ziviltechniker für Hebeanlagen',
    required_documents: ['Kranbuch', 'Kranbahnnachweis', 'Betriebsanleitung', 'letzter Prüfbefund'],
    typical_hazards: ['Lastabsturz', 'Kollision auf der Kranbahn', 'Absturz bei Wartungsarbeiten in Höhe'],
    typical_defects: ['Kranbahnschienen verschlissen', 'Puffer beschädigt', 'Notendschalter unwirksam'],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: ['ÖNORM M 9600'], en: ['EN 15011'], iso: ['ISO 9927'] },
    permit_relevant: true,
    safety_score_category: 'Hebetechnik',
  }),
  sys({
    id: 'SYS-AT-MEWP-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit', 'absturzsicherung'],
    name: 'Hebebühne',
    synonyms: ['Arbeitsbühne', 'Hubarbeitsbühne', 'Scherenbühne', 'Gelenkteleskopbühne', 'Kfz-Hebebühne'],
    icon: '⇱',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_lift_platform',
    hotspot_id: 'hotspot_lift_platform_01',
    layman_description: 'Gerät, mit dem Personen oder Fahrzeuge angehoben werden.',
    technical_description:
      'Hubarbeitsbühne oder Fahrzeughebebühne mit Hubwerk, Standsicherheits- und Absturzsicherungseinrichtungen, Notablasseinrichtung und Steuerung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person für Hebebühnen',
    required_documents: ['Prüfbuch', 'Betriebsanleitung', 'Konformitätserklärung', 'letzter Prüfbefund'],
    typical_hazards: ['Absturz von Personen', 'Umkippen der Bühne', 'Quetschen unter der Last'],
    typical_defects: ['Notablass ohne Funktion', 'Hydraulikleckage', 'Tragmutterverschleiß nicht dokumentiert'],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: [], en: ['EN 280', 'EN 1493'], iso: [] },
    permit_relevant: false,
    safety_score_category: 'Hebetechnik',
  }),
  sys({
    id: 'SYS-AT-LIFTTBL-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit'],
    name: 'Hubtisch',
    synonyms: ['Scherenhubtisch', 'Hebetisch', 'Palettenhubtisch', 'Hubplattform'],
    icon: '⌸',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_lift_table',
    hotspot_id: 'hotspot_lift_table_01',
    layman_description: 'Tisch, der Lasten auf Arbeitshöhe anhebt.',
    technical_description:
      'Scherenhubtisch oder Hubplattform zur Lastenhandhabung mit Quetschschutz, Sicherungen gegen unbeabsichtigtes Absenken und Steuerung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person für Hebeeinrichtungen',
    required_documents: ['Prüfbuch', 'Betriebsanleitung', 'Konformitätserklärung'],
    typical_hazards: ['Quetschen unter der Plattform', 'unbeabsichtigtes Absenken'],
    typical_defects: ['Scherenschutz fehlt', 'Abstützung nicht vorhanden', 'Hydraulik undicht'],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: [], en: ['EN 1570'], iso: [] },
    permit_relevant: false,
    safety_score_category: 'Hebetechnik',
  }),
  sys({
    id: 'SYS-AT-LIFTGEAR-001',
    category: EQUIP,
    name: 'Lastaufnahmemittel',
    synonyms: ['Anschlagmittel', 'Kettengehänge', 'Hebeband', 'Rundschlinge', 'Traverse', 'Lasthaken', 'Schäkel'],
    icon: '⚯',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_lifting_gear',
    hotspot_id: 'hotspot_lifting_gear_01',
    layman_description: 'Ketten, Bänder und Traversen, mit denen Lasten am Kran befestigt werden.',
    technical_description:
      'Lastaufnahme- und Anschlagmittel einschließlich Traversen, Ketten, Seilen, Hebebändern, Schäkeln und Sondervorrichtungen mit Kennzeichnung der Tragfähigkeit.',
    maintenance_relevant: false,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'zusätzlich Sichtkontrolle vor jeder Verwendung' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person für Anschlag- und Lastaufnahmemittel',
    required_documents: ['Herstellerbescheinigung', 'Prüfnachweise', 'Ablegekriterienliste'],
    typical_hazards: ['Lastabsturz durch Bruch des Anschlagmittels'],
    typical_defects: ['Kennzeichnung unleserlich', 'Ablegereife nicht erkannt', 'unzulässige Reparaturen'],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: [], en: ['EN 818', 'EN 1492'], iso: [] },
    permit_relevant: false,
    safety_score_category: 'Hebetechnik',
  }),
  sys({
    id: 'SYS-AT-RACK-001',
    category: EQUIP,
    name: 'Regalanlage',
    synonyms: ['Palettenregal', 'Hochregal', 'Kragarmregal', 'Fachbodenregal', 'Regal', 'Lagerregal'],
    icon: '▤',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_rack',
    hotspot_id: 'hotspot_rack_01',
    layman_description: 'Lagerregale, in denen Waren und Paletten gelagert werden.',
    technical_description:
      'Ortsfeste Lagereinrichtung aus Ständern, Trägern, Anfahrschutz und Kennzeichnung der zulässigen Feld- und Fachlasten; einschließlich Hochregal- und Kragarmregalanlagen.',
    maintenance_relevant: false,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'zusätzlich laufende Sichtkontrollen durch den Betreiber' },
    department: EQUIP_DEPT,
    expertise: 'Regalinspektor bzw. geeignete fachkundige Person',
    required_documents: ['Regalplan und Lastenschild', 'Aufbau- und Montageanleitung', 'letzter Inspektionsbericht'],
    typical_hazards: ['Einsturz der Regalanlage', 'herabfallende Ladeeinheiten'],
    typical_defects: [
      'Anfahrschäden an Ständern',
      'Lastenschild fehlt oder ist unleserlich',
      'Trägersicherungen fehlen',
      'Anfahrschutz nicht vorhanden',
    ],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: [], en: ['EN 15635'], iso: [] },
    permit_relevant: false,
    safety_score_category: 'Lager- und Logistiksicherheit',
  }),
  sys({
    id: 'SYS-AT-LADDER-001',
    category: EQUIP,
    secondary_categories: ['absturzsicherung'],
    name: 'Leitern und Tritte',
    synonyms: ['Leiter', 'Stehleiter', 'Anlegeleiter', 'Podestleiter', 'Tritt', 'Steigleiter'],
    icon: '☰',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_ladder',
    hotspot_id: 'hotspot_ladder_01',
    layman_description: 'Leitern und Tritte, mit denen höher gelegene Bereiche erreicht werden.',
    technical_description:
      'Tragbare Leitern, Podestleitern, Tritte und ortsfeste Steigleitern einschließlich Steigschutzeinrichtungen.',
    maintenance_relevant: false,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'zusätzlich Sichtkontrolle vor jeder Verwendung' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person; Leiterprüfung nach Prüfliste',
    required_documents: ['Leiterverzeichnis', 'Prüfnachweise', 'Herstellerangaben'],
    typical_hazards: ['Absturz von der Leiter', 'Wegrutschen der Leiter'],
    typical_defects: ['Holme oder Sprossen verformt', 'Leiterfüße fehlen', 'Spreizsicherung defekt'],
    legal_bases: [AMVO, ASCHG],
    standards: { trvb: [], onorm: [], en: ['EN 131'], iso: [] },
    permit_relevant: false,
    safety_score_category: 'Arbeitsmittelsicherheit',
  }),
  sys({
    id: 'SYS-AT-CONV-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit'],
    name: 'Förderanlage',
    synonyms: ['Förderband', 'Rollenbahn', 'Kettenförderer', 'Stetigförderer', 'Sorter', 'Elevator'],
    icon: '⇢',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_conveyor',
    hotspot_id: 'hotspot_conveyor_01',
    layman_description: 'Anlage, die Waren oder Material automatisch transportiert.',
    technical_description:
      'Stetigförderer und Fördertechnik einschließlich Antrieben, Umlenkungen, trennenden und nichttrennenden Schutzeinrichtungen sowie Not-Halt-Einrichtungen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person für Fördertechnik',
    required_documents: ['Betriebsanleitung', 'Konformitätserklärung', 'Schutzeinrichtungskonzept', 'Wartungsnachweise'],
    typical_hazards: ['Einzug an Umlenkstellen', 'Quetschen an Übergabestellen'],
    typical_defects: ['Einzugstellen nicht gesichert', 'Not-Halt nicht erreichbar', 'Abdeckungen entfernt'],
    legal_bases: [AMVO, ASCHG, 'MSV 2010 – Maschinen-Sicherheitsverordnung'],
    standards: { trvb: [], onorm: [], en: ['EN ISO 13857', 'EN 619'], iso: ['ISO 13857'] },
    permit_relevant: true,
    safety_score_category: 'Maschinensicherheit',
  }),
  sys({
    id: 'SYS-AT-MACH-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit'],
    name: 'Maschine',
    synonyms: ['Werkzeugmaschine', 'Produktionsmaschine', 'Presse', 'Säge', 'Drehmaschine', 'Fräse', 'Roboter'],
    icon: '⛭',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_machine',
    hotspot_id: 'hotspot_machine_01',
    layman_description: 'Maschinen, mit denen im Betrieb gearbeitet oder produziert wird.',
    technical_description:
      'Einzelmaschine mit Antrieben, Steuerung, trennenden und nichttrennenden Schutzeinrichtungen, Not-Halt-Funktion und sicherheitsbezogenen Teilen der Steuerung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'abhängig von Gefährdung und Einsatzbedingungen' },
    department: EQUIP_DEPT,
    expertise: 'Geeignete fachkundige Person für Maschinensicherheit',
    required_documents: [
      'Konformitätserklärung und CE-Kennzeichnung',
      'Betriebsanleitung',
      'Risikobeurteilung',
      'Wartungs- und Prüfnachweise',
    ],
    typical_hazards: ['Erfassen und Einziehen', 'Schneiden', 'Auswurf von Teilen', 'elektrische Gefährdung'],
    typical_defects: [
      'Schutzeinrichtung manipuliert oder überbrückt',
      'Not-Halt ohne Funktion',
      'Betriebsanleitung nicht verfügbar',
      'CE-Konformität nach Umbau nicht nachgewiesen',
    ],
    legal_bases: [AMVO, ASCHG, 'MSV 2010 – Maschinen-Sicherheitsverordnung'],
    standards: { trvb: [], onorm: [], en: ['EN ISO 12100', 'EN ISO 13849'], iso: ['ISO 12100', 'ISO 13849'] },
    permit_relevant: true,
    safety_score_category: 'Maschinensicherheit',
  }),
  sys({
    id: 'SYS-AT-MACHLINE-001',
    category: EQUIP,
    secondary_categories: ['maschinensicherheit'],
    name: 'Verkettete Maschinenanlage',
    synonyms: ['Anlagenverkettung', 'Fertigungslinie', 'Produktionslinie', 'Gesamtheit von Maschinen', 'Zelle'],
    icon: '⛓',
    svg_layer_id: EQUIP_LAYER,
    svg_object_id: 'system_machine_line',
    hotspot_id: 'hotspot_machine_line_01',
    layman_description: 'Mehrere Maschinen, die zu einer durchgehenden Anlage verbunden sind.',
    technical_description:
      'Gesamtheit von Maschinen im Sinne der Maschinen-Sicherheitsvorschriften mit übergeordneter Steuerung, gemeinsamem Not-Halt-Konzept, Zugangs- und Zutrittssicherung sowie Schnittstellenbetrachtung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'anlassbezogen bei jeder wesentlichen Veränderung' },
    department: EQUIP_DEPT,
    expertise: 'Fachkundige Person für Gesamtheiten von Maschinen',
    required_documents: [
      'Gesamt-Konformitätserklärung',
      'Risikobeurteilung der Gesamtanlage',
      'Not-Halt- und Sicherheitskonzept',
      'Schnittstellenliste',
    ],
    typical_hazards: ['Gefährdung an Schnittstellen', 'unerwarteter Anlauf benachbarter Maschinen'],
    typical_defects: [
      'keine Gesamt-Konformitätsbewertung nach Verkettung',
      'Not-Halt wirkt nicht anlagenweit',
      'Zugangsschutz unvollständig',
    ],
    legal_bases: [AMVO, ASCHG, 'MSV 2010 – Maschinen-Sicherheitsverordnung'],
    standards: { trvb: [], onorm: [], en: ['EN ISO 12100', 'EN ISO 13849'], iso: ['ISO 12100'] },
    permit_relevant: true,
    safety_score_category: 'Maschinensicherheit',
  }),
];

/* -------------------------------------------------------------------------
 * Gebäudetechnik
 * ---------------------------------------------------------------------- */

const BUILDING = 'gebaeudetechnik';
const BUILDING_LAYER = 'layer_building_services';
const ENERGY_LAYER = 'layer_energy';

/** @type {SystemType[]} */
const BUILDING_SERVICES = [
  sys({
    id: 'SYS-AT-PV-001',
    category: BUILDING,
    secondary_categories: ['elektrotechnik', 'brandschutz'],
    name: 'Photovoltaikanlage',
    synonyms: ['PV', 'PV-Anlage', 'Solaranlage', 'Solarstrom', 'Photovoltaik', 'Wechselrichter'],
    icon: '▦',
    svg_layer_id: ENERGY_LAYER,
    svg_object_id: 'system_pv',
    hotspot_id: 'hotspot_pv_01',
    layman_description: 'Solarmodule am Dach, die Strom erzeugen.',
    technical_description:
      'Photovoltaikanlage bestehend aus Modulen, Unterkonstruktion, DC-Verkabelung, Wechselrichtern, Freischalteinrichtung für die Feuerwehr, Überspannungsschutz und Einspeisepunkt.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'wiederkehrende Prüfung der elektrischen Anlage gesondert' },
    department: 'Elektrotechnik',
    expertise: 'Elektrofachkraft mit PV-Kenntnis',
    required_documents: [
      'Anlagendokumentation und Strangplan',
      'Prüfprotokoll der Erstinbetriebnahme',
      'Nachweis Feuerwehrschalter bzw. Freischaltung',
      'Blitz- und Überspannungsschutzkonzept',
    ],
    typical_hazards: ['DC-Lichtbogen und Brandgefahr', 'Gefährdung der Einsatzkräfte durch DC-Spannung', 'Absturz bei Dacharbeiten'],
    typical_defects: [
      'Feuerwehrschalter fehlt oder nicht gekennzeichnet',
      'DC-Leitungen ungeschützt verlegt',
      'Anlagendokumentation nicht aktuell',
      'kein Zugangskonzept für Dacharbeiten',
    ],
    legal_bases: ['ETV 2012 – Elektroschutzverordnung', 'behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: [], onorm: ['ÖVE/ÖNORM E 8001'], en: ['EN 62446'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Energie- und Elektrotechnik',
  }),
  sys({
    id: 'SYS-AT-BATT-001',
    category: BUILDING,
    secondary_categories: ['elektrotechnik', 'brandschutz'],
    name: 'Batteriespeicher',
    synonyms: ['Stromspeicher', 'Akkuspeicher', 'Energiespeicher', 'Lithium-Speicher', 'BESS'],
    icon: '▮',
    svg_layer_id: ENERGY_LAYER,
    svg_object_id: 'system_battery',
    hotspot_id: 'hotspot_battery_01',
    layman_description: 'Große Batterie, die erzeugten Strom speichert.',
    technical_description:
      'Stationärer elektrischer Energiespeicher mit Batteriemodulen, Batteriemanagementsystem, Wechselrichter, Aufstellraum-Anforderungen, Brandschutz- und Lüftungskonzept.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: '' },
    department: 'Elektrotechnik',
    expertise: 'Elektrofachkraft mit Kenntnis stationärer Speichersysteme',
    required_documents: [
      'Anlagendokumentation',
      'Brandschutz- und Lüftungskonzept des Aufstellraums',
      'Herstellerangaben zum Aufstellort',
      'Prüfprotokolle',
    ],
    typical_hazards: ['thermisches Durchgehen einzelner Zellen', 'Brandlast im Aufstellraum', 'elektrische Gefährdung'],
    typical_defects: ['Aufstellraum ohne geeignete Abtrennung', 'Lüftung nicht ausgeführt', 'Kennzeichnung fehlt'],
    legal_bases: ['ETV 2012', 'behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: [], onorm: ['ÖVE/ÖNORM E 8001'], en: ['EN 62619'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Energie- und Elektrotechnik',
  }),
  sys({
    id: 'SYS-AT-LPS-001',
    category: BUILDING,
    secondary_categories: ['elektrotechnik'],
    name: 'Blitzschutzanlage',
    synonyms: ['Blitzschutz', 'Blitzableiter', 'Fangeinrichtung', 'Erdung', 'Überspannungsschutz'],
    icon: '↯',
    svg_layer_id: ENERGY_LAYER,
    svg_object_id: 'system_lightning',
    hotspot_id: 'hotspot_lightning_01',
    layman_description: 'Schutzsystem am Gebäude, das Blitze sicher zur Erde ableitet.',
    technical_description:
      'Äußerer und innerer Blitzschutz mit Fangeinrichtungen, Ableitungen, Erdungsanlage, Potentialausgleich und Überspannungsschutzeinrichtungen.',
    maintenance_relevant: false,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: {
      value: 3,
      unit: 'year',
      note: 'Intervall abhängig von Schutzklasse und Bescheidlage; im Einzelfall zu bestimmen',
    },
    department: 'Elektrotechnik',
    expertise: 'Blitzschutzfachkraft',
    required_documents: ['Blitzschutzbefund', 'Risikoanalyse bzw. Schutzklassenfestlegung', 'Anlagenplan'],
    typical_hazards: ['Brand durch Blitzeinschlag', 'Zerstörung elektronischer Anlagen', 'Personengefährdung'],
    typical_defects: ['Ableitung unterbrochen', 'Erdungswiderstand zu hoch', 'Anbauten nicht eingebunden'],
    legal_bases: ['ETV 2012', 'landesrechtliche Bauvorschriften', 'behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: [], onorm: ['ÖVE/ÖNORM EN 62305'], en: ['EN 62305'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Energie- und Elektrotechnik',
  }),
  sys({
    id: 'SYS-AT-ELEV-001',
    category: BUILDING,
    name: 'Aufzug',
    synonyms: ['Lift', 'Personenaufzug', 'Lastenaufzug', 'Aufzugsanlage', 'Hebeanlage Personen'],
    icon: '⇕',
    svg_layer_id: BUILDING_LAYER,
    svg_object_id: 'system_elevator',
    hotspot_id: 'hotspot_elevator_01',
    layman_description: 'Anlage zur Personen- oder Lastenbeförderung zwischen Geschossen.',
    technical_description:
      'Aufzugsanlage mit Fahrkorb, Schacht, Antrieb, Steuerung, Fangvorrichtung, Notrufsystem mit Zweiwegkommunikation und Brandfallsteuerung.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: {
      value: 1,
      unit: 'year',
      note: 'zusätzlich wiederkehrende Überprüfung durch akkreditierte Stelle in längeren Intervallen',
    },
    department: 'Gebäude- und Anlagentechnik',
    expertise: 'Akkreditierte Inspektionsstelle bzw. befugte Fachperson für Aufzugsanlagen',
    required_documents: [
      'Aufzugsbuch',
      'letzter Überprüfungsbefund',
      'Wartungsvertrag und Wartungsnachweise',
      'Notbefreiungsanleitung',
    ],
    typical_hazards: ['Absturz', 'Einschließen von Personen', 'Quetschen im Schachtbereich'],
    typical_defects: [
      'Notruf ohne ständig besetzte Stelle',
      'Wartungsintervalle überschritten',
      'Schachtzugang ungesichert',
      'Aufzugsbuch nicht geführt',
    ],
    legal_bases: [
      'ASV 2008 – Aufzüge-Sicherheitsverordnung',
      'HBV 2009 – Hebeanlagen-Betriebsverordnung',
      'landesrechtliche Aufzugsvorschriften',
    ],
    standards: { trvb: ['TRVB S 112'], onorm: [], en: ['EN 81-20', 'EN 81-50'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Gebäudetechnik',
  }),
  sys({
    id: 'SYS-AT-HVAC-001',
    category: BUILDING,
    name: 'Lüftungsanlage',
    synonyms: ['Lüftung', 'RLT-Anlage', 'Klimaanlage', 'Absauganlage', 'Lüftungstechnik'],
    icon: '≈',
    svg_layer_id: BUILDING_LAYER,
    svg_object_id: 'system_hvac',
    hotspot_id: 'hotspot_hvac_01',
    layman_description: 'Anlage, die Räume mit Frischluft versorgt oder Luft absaugt.',
    technical_description:
      'Raumlufttechnische Anlage mit Zentralgerät, Kanalnetz, Brandschutzklappen, Filtern, Wärmerückgewinnung sowie prozesstechnischen Absauganlagen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'Brandschutzklappen gesondert prüfen' },
    department: 'Gebäude- und Anlagentechnik',
    expertise: 'Fachkundige Person für raumlufttechnische Anlagen',
    required_documents: ['Anlagenschema', 'Hygienenachweis', 'Brandschutzklappenverzeichnis', 'Wartungsnachweise'],
    typical_hazards: ['Rauchübertragung über Kanäle', 'hygienische Belastung', 'Explosionsgefahr bei Staubabsaugung'],
    typical_defects: ['Brandschutzklappen nicht geprüft', 'Filter überlagert', 'Revisionsöffnungen nicht zugänglich'],
    legal_bases: ['ASchG', 'AStV', 'behördlicher Betriebsanlagenbescheid'],
    standards: { trvb: [], onorm: ['ÖNORM H 6021'], en: ['EN 15780'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Gebäudetechnik',
  }),
  sys({
    id: 'SYS-AT-ELEC-001',
    category: BUILDING,
    secondary_categories: ['elektrotechnik'],
    name: 'Elektrische Anlage',
    synonyms: ['Elektroanlage', 'E-Anlage', 'Verteiler', 'Elektroinstallation', 'Niederspannungsanlage', 'E-Befund'],
    icon: '⌁',
    svg_layer_id: ENERGY_LAYER,
    svg_object_id: 'system_electric',
    hotspot_id: 'hotspot_electric_01',
    layman_description: 'Die gesamte Stromversorgung des Objekts mit Verteilern und Leitungen.',
    technical_description:
      'Ortsfeste elektrische Anlage einschließlich Hauptverteilung, Unterverteilungen, Schutzmaßnahmen, Fehlerstromschutzeinrichtungen, Potentialausgleich und ortsveränderlicher Betriebsmittel.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: {
      value: 1,
      unit: 'year',
      note: 'Intervall abhängig von Anlagenart und Nutzung; im Einzelfall zu bestimmen',
    },
    department: 'Elektrotechnik',
    expertise: 'Elektrofachkraft bzw. befugtes Elektrounternehmen',
    required_documents: [
      'Anlagenbefund (E-Befund)',
      'Verteilerpläne und Stromlaufpläne',
      'Prüfprotokolle ortsveränderlicher Betriebsmittel',
      'Mängelbehebungsnachweise',
    ],
    typical_hazards: ['elektrischer Schlag', 'Brand durch Leitungs- oder Kontaktfehler', 'Lichtbogen'],
    typical_defects: [
      'E-Befund abgelaufen',
      'Fehlerstromschutzschalter nicht geprüft',
      'Verteiler nicht beschriftet oder nicht zugänglich',
      'provisorische Installationen im Dauerbetrieb',
    ],
    legal_bases: ['ETV 2012 – Elektroschutzverordnung', 'ESV 2012', 'ASchG'],
    standards: { trvb: [], onorm: ['ÖVE/ÖNORM E 8001-6-61', 'ÖVE/ÖNORM E 8001-6-63'], en: [], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Energie- und Elektrotechnik',
  }),
  sys({
    id: 'SYS-AT-FALL-001',
    category: BUILDING,
    secondary_categories: ['absturzsicherung', 'arbeitnehmerschutz'],
    name: 'Absturzsicherung',
    synonyms: ['Sekurant', 'Anschlagpunkt', 'Seilsicherung', 'Dachhaken', 'Geländer', 'PSAgA', 'Lifeline'],
    icon: '↥',
    svg_layer_id: 'layer_fall_protection',
    svg_object_id: 'system_fall_protection',
    hotspot_id: 'hotspot_fall_protection_01',
    layman_description: 'Einrichtungen, die verhindern, dass Personen aus der Höhe abstürzen.',
    technical_description:
      'Kollektive und persönliche Absturzsicherungen: Geländer, Seitenschutz, Anschlagpunkte, horizontale Seilsysteme, Steigschutz sowie zugehörige persönliche Schutzausrüstung gegen Absturz.',
    maintenance_relevant: false,
    inspection_relevant: true,
    test_relevant: true,
    typical_interval: { value: 1, unit: 'year', note: 'PSAgA und Anschlageinrichtungen jährlich' },
    department: 'Absturzsicherung und PSAgA',
    expertise: 'Sachkundige Person für Anschlageinrichtungen und PSAgA',
    required_documents: [
      'Montage- und Verwendungsdokumentation der Anschlageinrichtung',
      'Prüfnachweise der PSAgA',
      'Zugangs- und Rettungskonzept für Dacharbeiten',
    ],
    typical_hazards: ['Absturz aus der Höhe', 'Hängetrauma nach Sturz ohne Rettungskonzept'],
    typical_defects: [
      'Anschlagpunkte nicht geprüft',
      'kein Rettungskonzept vorhanden',
      'PSAgA überlagert',
      'Geländerhöhe unzureichend',
    ],
    legal_bases: [ASCHG, 'BauV – Bauarbeiterschutzverordnung', 'AStV', 'PSA-V'],
    standards: { trvb: [], onorm: [], en: ['EN 795', 'EN 365', 'EN ISO 14122'], iso: ['ISO 14122'] },
    permit_relevant: false,
    safety_score_category: 'Absturzsicherung',
  }),
  sys({
    id: 'SYS-AT-PRESS-001',
    category: BUILDING,
    secondary_categories: ['arbeitsmittel'],
    name: 'Druckanlage',
    synonyms: ['Druckbehälter', 'Kompressor', 'Druckluftanlage', 'Dampfkessel', 'Druckgerät', 'Windkessel'],
    icon: '◍',
    svg_layer_id: BUILDING_LAYER,
    svg_object_id: 'system_pressure',
    hotspot_id: 'hotspot_pressure_01',
    layman_description: 'Behälter und Anlagen, die unter Druck stehen, zum Beispiel Druckluft oder Dampf.',
    technical_description:
      'Druckgeräte, Druckbehälter, Rohrleitungen und Baugruppen einschließlich Sicherheitseinrichtungen gegen Drucküberschreitung, Aufstellungsbedingungen und wiederkehrender Überprüfungen.',
    maintenance_relevant: true,
    inspection_relevant: true,
    test_relevant: true,
    revision_relevant: true,
    typical_interval: {
      value: 1,
      unit: 'year',
      note: 'äußere, innere und Druckprüfung in unterschiedlichen Intervallen je Kategorie',
    },
    department: 'Gebäude- und Anlagentechnik',
    expertise: 'Akkreditierte Inspektionsstelle bzw. befugte Fachperson für Druckgeräte',
    required_documents: [
      'Druckgerätedokumentation und Kennblatt',
      'Aufstellungsprüfbefund',
      'Protokolle der wiederkehrenden Prüfungen',
      'Nachweis der Sicherheitseinrichtungen',
    ],
    typical_hazards: ['Bersten des Druckbehälters', 'Austritt heißer Medien', 'Lärmbelastung'],
    typical_defects: [
      'Sicherheitsventil nicht geprüft',
      'innere Prüfung überfällig',
      'Kennzeichnung und Kennblatt fehlen',
      'Aufstellraum nicht geeignet',
    ],
    legal_bases: [
      'DGÜW-V – Druckgeräteüberwachungsverordnung',
      'Kesselgesetz',
      'AM-VO',
      'behördlicher Betriebsanlagenbescheid',
    ],
    standards: { trvb: [], onorm: [], en: ['EN 13445'], iso: [] },
    permit_relevant: true,
    safety_score_category: 'Druck- und Anlagentechnik',
  }),
];

/** @type {SystemType[]} */
export const SYSTEM_TYPES = [...FIRE_PROTECTION, ...WORK_EQUIPMENT, ...BUILDING_SERVICES];

/** @type {Map<string, SystemType>} */
const BY_ID = new Map(SYSTEM_TYPES.map((systemType) => [systemType.id, systemType]));

/**
 * @param {string} id
 * @returns {SystemType | undefined}
 */
export function getSystemType(id) {
  return BY_ID.get(id);
}

/**
 * Alle Anlagentypen einer Kategorie – primäre und sekundäre Zuordnung.
 * @param {string} categoryId
 * @returns {SystemType[]}
 */
export function listSystemTypesByCategory(categoryId) {
  return SYSTEM_TYPES.filter(
    (systemType) =>
      systemType.active &&
      (systemType.category === categoryId || systemType.secondary_categories.includes(categoryId)),
  );
}

/**
 * Anlagentypen, die für eine Objektart in Frage kommen.
 * @param {import('./object-types.js').ObjectType} objectType
 * @returns {SystemType[]}
 */
export function listSystemTypesForObjectType(objectType) {
  const allowed = new Set(objectType.categories);
  return SYSTEM_TYPES.filter(
    (systemType) =>
      systemType.active &&
      (allowed.has(systemType.category) ||
        systemType.secondary_categories.some((category) => allowed.has(category))),
  ).sort((a, b) => a.sequence - b.sequence);
}

/**
 * Prüfarten-Relevanz kompakt – speist `MaintenanceInspectionRevisionInfo`.
 * @param {SystemType} systemType
 * @returns {{key: string, label: string, relevant: boolean}[]}
 */
export function relevanceMatrix(systemType) {
  return [
    { key: 'maintenance', label: 'Wartung', relevant: systemType.maintenance_relevant },
    { key: 'inspection', label: 'Inspektion', relevant: systemType.inspection_relevant },
    { key: 'test', label: 'Prüfung', relevant: systemType.test_relevant },
    { key: 'revision', label: 'Revision', relevant: systemType.revision_relevant },
  ];
}

/**
 * INGTEC Safety Navigator – Objektarten
 *
 * Modell laut Spezifikation Abschnitt 11: `ingtec.navigator.object_type`
 *
 * Die Objektart ist der erste fachliche Filter des Navigators. Sie bestimmt,
 * welche Anlagenkategorien überhaupt angeboten werden, welche Gebäudegrafik
 * dargestellt wird und welche Objektfakten (Nutzung, Standort) für die Rule
 * Engine erhoben werden müssen.
 *
 * @typedef {object} ObjectType
 * @property {string}   id
 * @property {string}   name
 * @property {string}   short              Kurzbeschreibung
 * @property {string}   image              Bildpfad (Prototyp: leer, Odoo: ir.attachment)
 * @property {string}   svg_variant        Variante der SVG-Visualisierung
 * @property {string[]} categories         Aktive Anlagenkategorien
 * @property {number}   priority           Priorisierung in der Auswahl
 * @property {string}   slug               URL-Slug
 * @property {{title: string, description: string}} seo
 * @property {Record<string, boolean|string>} default_facts Vorbelegte Objektfakten
 * @property {boolean}  active
 */

/**
 * Objektfakten, die der Navigator je Objektart vorbelegt. Vorbelegte Fakten
 * sind nachträglich durch Nutzerantworten überschreibbar; sie dienen nur der
 * Reduktion der Rückfragen.
 */
const WORKPLACE = { workplace: true };
const NO_WORKPLACE = { workplace: false };

/** @type {ObjectType[]} */
export const OBJECT_TYPES = [
  {
    id: 'industrie',
    name: 'Industrie',
    short: 'Produktionsbetrieb mit Fertigung, Halle, Technik und Lagerbereichen.',
    image: '',
    svg_variant: 'industrial_hall',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'maschinensicherheit',
      'elektrotechnik',
      'gebaeudetechnik',
      'arbeitnehmerschutz',
      'absturzsicherung',
      'verkehrstechnik',
    ],
    priority: 10,
    slug: 'industrie',
    seo: {
      title: 'Prüfpflichten Industriebetrieb – INGTEC Safety Navigator',
      description:
        'Welche technischen Anlagen muss ein Industriebetrieb prüfen lassen? Der Safety Navigator zeigt Prüfbedarf, Fristen und Rechtsgrundlagen.',
    },
    default_facts: { ...WORKPLACE, production: true },
    active: true,
  },
  {
    id: 'gewerbe',
    name: 'Gewerbe',
    short: 'Gewerbebetrieb, Handel oder Dienstleistung mit Kundenverkehr.',
    image: '',
    svg_variant: 'commercial',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'elektrotechnik',
      'gebaeudetechnik',
      'arbeitnehmerschutz',
    ],
    priority: 20,
    slug: 'gewerbe',
    seo: {
      title: 'Prüfpflichten Gewerbebetrieb – INGTEC Safety Navigator',
      description:
        'Prüfpflichtige Anlagen im Gewerbebetrieb: Brandschutz, Elektrotechnik, Arbeitsmittel und Gebäudetechnik im Überblick.',
    },
    default_facts: { ...WORKPLACE, public_access: true },
    active: true,
  },
  {
    id: 'buero',
    name: 'Büro',
    short: 'Verwaltungsgebäude und Büroflächen.',
    image: '',
    svg_variant: 'office',
    categories: ['brandschutz', 'elektrotechnik', 'gebaeudetechnik', 'arbeitnehmerschutz'],
    priority: 30,
    slug: 'buero',
    seo: {
      title: 'Prüfpflichten Bürogebäude – INGTEC Safety Navigator',
      description:
        'Welche Prüfungen sind im Bürogebäude erforderlich? Sicherheitsbeleuchtung, Elektroanlage, Aufzug und Brandschutz.',
    },
    default_facts: { ...WORKPLACE },
    active: true,
  },
  {
    id: 'lager',
    name: 'Lager',
    short: 'Lagerhalle, Logistikzentrum oder Distributionslager.',
    image: '',
    svg_variant: 'warehouse',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'elektrotechnik',
      'gebaeudetechnik',
      'arbeitnehmerschutz',
      'absturzsicherung',
      'verkehrstechnik',
    ],
    priority: 40,
    slug: 'lager',
    seo: {
      title: 'Prüfpflichten Lager und Logistik – INGTEC Safety Navigator',
      description:
        'Regalanlagen, Tore, Förderanlagen und Brandschutz: Prüfbedarf für Lager- und Logistikobjekte ermitteln.',
    },
    default_facts: { ...WORKPLACE, storage: true },
    active: true,
  },
  {
    id: 'werkstaette',
    name: 'Werkstätte',
    short: 'Handwerks-, Kfz- oder Instandhaltungswerkstätte.',
    image: '',
    svg_variant: 'workshop',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'maschinensicherheit',
      'elektrotechnik',
      'gebaeudetechnik',
      'arbeitnehmerschutz',
    ],
    priority: 50,
    slug: 'werkstaette',
    seo: {
      title: 'Prüfpflichten Werkstätte – INGTEC Safety Navigator',
      description:
        'Hebebühnen, Maschinen, Tore und Elektroanlagen: Prüfpflichten in der Werkstätte prüfen.',
    },
    default_facts: { ...WORKPLACE, production: true },
    active: true,
  },
  {
    id: 'hotel',
    name: 'Hotel',
    short: 'Beherbergungsbetrieb mit Gastbereich und Nachtbetrieb.',
    image: '',
    svg_variant: 'hospitality',
    categories: ['brandschutz', 'elektrotechnik', 'gebaeudetechnik', 'arbeitnehmerschutz'],
    priority: 60,
    slug: 'hotel',
    seo: {
      title: 'Prüfpflichten Hotel und Beherbergung – INGTEC Safety Navigator',
      description:
        'Brandmeldeanlage, Sicherheitsbeleuchtung, Aufzug und Fluchtwege: Prüfbedarf im Beherbergungsbetrieb.',
    },
    default_facts: { ...WORKPLACE, public_access: true, sleeping_area: true },
    active: true,
  },
  {
    id: 'schule',
    name: 'Schule',
    short: 'Schule, Kindergarten oder Bildungseinrichtung.',
    image: '',
    svg_variant: 'education',
    categories: ['brandschutz', 'elektrotechnik', 'gebaeudetechnik', 'arbeitnehmerschutz'],
    priority: 70,
    slug: 'schule',
    seo: {
      title: 'Prüfpflichten Schule und Bildungseinrichtung – INGTEC Safety Navigator',
      description:
        'Prüfpflichten für Schulen: Brandschutz, Elektrotechnik, Sicherheitsbeleuchtung und Fluchtwege.',
    },
    default_facts: { ...WORKPLACE, public_access: true, vulnerable_persons: true },
    active: true,
  },
  {
    id: 'garage',
    name: 'Garage',
    short: 'Tiefgarage, Parkdeck oder Sammelgarage.',
    image: '',
    svg_variant: 'garage',
    categories: ['brandschutz', 'arbeitsmittel', 'elektrotechnik', 'gebaeudetechnik', 'verkehrstechnik'],
    priority: 80,
    slug: 'garage',
    seo: {
      title: 'Prüfpflichten Garage und Tiefgarage – INGTEC Safety Navigator',
      description:
        'Entrauchung, CO-Warnanlage, Tore und Ladeinfrastruktur: Prüfbedarf für Garagen ermitteln.',
    },
    default_facts: { public_access: true, underground: true },
    active: true,
  },
  {
    id: 'wohngebaeude',
    name: 'Wohngebäude',
    short: 'Wohnhausanlage oder Mehrparteienhaus.',
    image: '',
    svg_variant: 'residential',
    categories: ['brandschutz', 'elektrotechnik', 'gebaeudetechnik'],
    priority: 90,
    slug: 'wohngebaeude',
    seo: {
      title: 'Prüfpflichten Wohngebäude – INGTEC Safety Navigator',
      description:
        'Aufzug, Blitzschutz, Rauchabzug und Elektroanlage: wiederkehrende Prüfungen in der Wohnhausanlage.',
    },
    default_facts: { ...NO_WORKPLACE, residential: true },
    active: true,
  },
  {
    id: 'gesundheitseinrichtung',
    name: 'Gesundheitseinrichtung',
    short: 'Krankenhaus, Pflegeheim oder medizinische Einrichtung.',
    image: '',
    svg_variant: 'healthcare',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'elektrotechnik',
      'gebaeudetechnik',
      'arbeitnehmerschutz',
    ],
    priority: 100,
    slug: 'gesundheitseinrichtung',
    seo: {
      title: 'Prüfpflichten Gesundheitseinrichtung – INGTEC Safety Navigator',
      description:
        'Sicherheitsstromversorgung, Brandschutz und medizinische Gebäudetechnik: Prüfbedarf systematisch ermitteln.',
    },
    default_facts: {
      ...WORKPLACE,
      public_access: true,
      vulnerable_persons: true,
      sleeping_area: true,
    },
    active: true,
  },
  {
    id: 'veranstaltungsstaette',
    name: 'Veranstaltungsstätte',
    short: 'Veranstaltungshalle, Bühne oder Versammlungsstätte.',
    image: '',
    svg_variant: 'venue',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'elektrotechnik',
      'gebaeudetechnik',
      'absturzsicherung',
    ],
    priority: 110,
    slug: 'veranstaltungsstaette',
    seo: {
      title: 'Prüfpflichten Veranstaltungsstätte – INGTEC Safety Navigator',
      description:
        'Bühnentechnik, Rauchabzug, Sicherheitsbeleuchtung und Fluchtwege: Prüfbedarf für Veranstaltungsstätten.',
    },
    default_facts: { ...WORKPLACE, public_access: true, assembly: true },
    active: true,
  },
  {
    id: 'baustelle',
    name: 'Baustelle',
    short: 'Bauvorhaben mit temporärer Baustelleneinrichtung.',
    image: '',
    svg_variant: 'construction',
    categories: [
      'arbeitsmittel',
      'maschinensicherheit',
      'elektrotechnik',
      'arbeitnehmerschutz',
      'absturzsicherung',
    ],
    priority: 120,
    slug: 'baustelle',
    seo: {
      title: 'Prüfpflichten Baustelle – INGTEC Safety Navigator',
      description:
        'Krane, Hebebühnen, Gerüst und Baustromverteiler: Prüfpflichten auf der Baustelle im Überblick.',
    },
    default_facts: { ...WORKPLACE, temporary: true },
    active: true,
  },
  {
    id: 'verkehrsanlage',
    name: 'Verkehrsanlage',
    short: 'Straßen-, Tunnel- oder sonstige Verkehrsinfrastruktur.',
    image: '',
    svg_variant: 'infrastructure',
    categories: ['brandschutz', 'elektrotechnik', 'gebaeudetechnik', 'verkehrstechnik', 'absturzsicherung'],
    priority: 130,
    slug: 'verkehrsanlage',
    seo: {
      title: 'Prüfpflichten Verkehrsanlage – INGTEC Safety Navigator',
      description:
        'Prüfbedarf für Verkehrsanlagen: Sicherheitstechnik, Elektro, Entrauchung und Absturzsicherung.',
    },
    default_facts: { public_access: true, infrastructure: true },
    active: true,
  },
  {
    id: 'eisenbahnanlage',
    name: 'Eisenbahnanlage',
    short: 'Eisenbahnbetriebsanlage, Anschlussbahn oder Werksbahn.',
    image: '',
    svg_variant: 'railway',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'elektrotechnik',
      'arbeitnehmerschutz',
      'verkehrstechnik',
      'absturzsicherung',
    ],
    priority: 140,
    slug: 'eisenbahnanlage',
    seo: {
      title: 'Prüfpflichten Eisenbahnanlage und Anschlussbahn – INGTEC Safety Navigator',
      description:
        'Anschlussbahn, Werksbahn und Eisenbahnbetriebsanlagen: wiederkehrende Überprüfungen ermitteln.',
    },
    default_facts: { ...WORKPLACE, railway: true },
    active: true,
  },
  {
    id: 'sonderobjekt',
    name: 'Sonderobjekt',
    short: 'Objekt, das keiner der vorgenannten Objektarten eindeutig zuordenbar ist.',
    image: '',
    svg_variant: 'industrial_hall',
    categories: [
      'brandschutz',
      'arbeitsmittel',
      'maschinensicherheit',
      'elektrotechnik',
      'gebaeudetechnik',
      'arbeitnehmerschutz',
      'absturzsicherung',
      'verkehrstechnik',
    ],
    priority: 150,
    slug: 'sonderobjekt',
    seo: {
      title: 'Prüfpflichten Sonderobjekt – INGTEC Safety Navigator',
      description:
        'Sonderobjekte individuell beurteilen: Anlagen erfassen, Prüfbedarf ermitteln, Beratung anfordern.',
    },
    default_facts: {},
    active: true,
  },
];

/** @type {Map<string, ObjectType>} */
const BY_ID = new Map(OBJECT_TYPES.map((objectType) => [objectType.id, objectType]));

/**
 * @param {string} id
 * @returns {ObjectType | undefined}
 */
export function getObjectType(id) {
  return BY_ID.get(id);
}

/**
 * @param {string} slug
 * @returns {ObjectType | undefined}
 */
export function getObjectTypeBySlug(slug) {
  return OBJECT_TYPES.find((objectType) => objectType.slug === slug);
}

/**
 * Objektarten in Anzeigereihenfolge.
 * @returns {ObjectType[]}
 */
export function listObjectTypes() {
  return OBJECT_TYPES.filter((objectType) => objectType.active).sort(
    (a, b) => a.priority - b.priority,
  );
}

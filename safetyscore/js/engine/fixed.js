/**
 * Dezimale Festkommaarithmetik der Safety-Score-Engine.
 *
 * PRD 7.8 / CALC-002: Die Berechnung erfolgt ausschliesslich mit ganzzahliger
 * Festkommaarithmetik (BigInt), damit Server, Offline-Vorschau und Testsystem
 * fuer identische Eingangsdaten bitgenau denselben Wert erzeugen.
 *
 * Einheiten
 *   MICRO  1.0     = 1 000 000            Risikodefizitwert r_i
 *   BP     100,00  = 10 000               Score, Dimensionswert, Gewichte
 *   HP     1 bp    = 1 000 000            interne Zwischenpraezision (bp * 1e6)
 *   PCT    1,00    = 100                  Modifikatoren (0,80 -> 80)
 */

export const MICRO = 1_000_000n;
export const BP = 10_000n;
export const HP = 1_000_000n;
export const PCT = 100n;

/** Ganzzahlige Division mit kaufmaennischer Rundung (half-up), a >= 0, b > 0. */
export function divRound(a, b) {
  if (b <= 0n) throw new RangeError("Divisor muss groesser als 0 sein");
  return (2n * a + b) / (2n * b);
}

/** Begrenzt einen Wert auf [min, max]. */
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Hochpraeziser Wert (bp * 1e6) -> Basispunkte, gerundet. */
export function hpToBp(hp) {
  return divRound(hp, HP);
}

/** Basispunkte -> hochpraeziser Wert. */
export function bpToHp(bp) {
  return BigInt(bp) * HP;
}

/**
 * Basispunkte als Anzeigewert (PRD 7.8). Die Rundung erfolgt ganzzahlig
 * (half-up), damit die Anzeige nicht von Gleitkommaeffekten abhaengt:
 * 2768 bp -> "27,7", 9985 bp -> "99,9".
 */
export function formatScore(bp, decimals = 1) {
  if (bp === null || bp === undefined) return "NB";
  const value = BigInt(bp);
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const factor = 10n ** BigInt(Math.max(0, 2 - decimals));
  const scaled = divRound(magnitude, factor);
  const unit = 10n ** BigInt(decimals);
  const whole = scaled / unit;
  const fraction = scaled % unit;
  const sign = negative ? "-" : "";
  if (decimals === 0) return `${sign}${whole}`;
  return `${sign}${whole},${fraction.toString().padStart(decimals, "0")}`;
}

/** Basispunkte -> Number (nur fuer Anzeige und Diagramme, nie fuer Rechnung). */
export function bpToNumber(bp) {
  return Number(bp) / 100;
}

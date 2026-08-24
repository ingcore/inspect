/**
 * Kanonische Serialisierung und SHA-256-Hashes fuer den Calculation Snapshot
 * (PRD 12.2, GOV-003, R-10).
 *
 * Die Serialisierung ist schluesselsortiert und typstabil, damit identische
 * Eingangsdaten plattformunabhaengig denselben Hash erzeugen.
 */

/** Kanonisches JSON: Objektschluessel sortiert, BigInt als Dezimalstring. */
export function canonicalize(value) {
  if (value === null || value === undefined) return "null";
  const type = typeof value;
  if (type === "bigint") return `"${value.toString()}"`;
  if (type === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Nicht endliche Zahl im Snapshot");
    return Number.isInteger(value) ? String(value) : JSON.stringify(value);
  }
  if (type === "boolean") return value ? "true" : "false";
  if (type === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (type === "object") {
    const keys = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  }
  throw new TypeError(`Nicht serialisierbarer Typ im Snapshot: ${type}`);
}

const encoder = new TextEncoder();

/** SHA-256 als Hex-String. */
export async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 ueber die kanonische Form eines Objekts. */
export async function hashObject(value) {
  return sha256(canonicalize(value));
}

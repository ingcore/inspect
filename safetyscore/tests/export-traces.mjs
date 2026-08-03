/**
 * Erzeugt den vollstaendigen Berechnungstrace des Golden-Master-Satzes als
 * pruefbares Dokument (PRD "Naechster verbindlicher Schritt", CALC-009).
 *
 * Ausfuehrung:  npm run trace:golden-masters
 * Ergebnis:     safetyscore/tests/GOLDEN-MASTERS.md
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { GOLDEN_MASTERS, buildCase } from "./golden-masters.mjs";

import { calculateScore } from "../js/engine/score-engine.js";
import { createCalculationRun } from "../js/engine/snapshot.js";
import { getProfile } from "../js/engine/profiles.js";
import { formatScore } from "../js/engine/fixed.js";
import { MODEL_VERSION, ENGINE_VERSION, SOURCE_TYPES } from "../js/engine/model.js";

const BMA = getProfile("T-BMA");
const num = (value, decimals = 2) => Number(value).toFixed(decimals).replace(".", ",");

function factorCell(factors) {
  if (!factors) return "–";
  return ["F_A", "F_E", "F_R", "F_M"]
    .map((code) => `${num(factors[code].value)}${factors[code].applied ? "" : "*"}`)
    .join(" / ");
}

function caseSection(golden, result, snapshot) {
  const lines = [];
  const e = golden.erwartung;

  lines.push(`## ${golden.id} · ${golden.titel}`, "");
  lines.push(`**Fachliche Begründung.** ${golden.begruendung}`, "");

  lines.push("| Ergebnisachse | Erwartet | Berechnet |", "| --- | --- | --- |");
  lines.push(`| Safety-Score® | ${e.score ?? "NB"} | ${result.display} |`);
  lines.push(`| Klasse | ${e.klasse} | ${result.class} |`);
  lines.push(
    `| Compliance | ${e.compliance} | ${result.compliance.code} |`,
    `| Konfidenz | ${e.konfidenz} | ${result.confidence.klass} (K = ${formatScore(result.confidence.valueBp)}) |`,
    `| Gate | ${e.gates.length ? e.gates.join(", ") : "kein Gate"} | ${
      result.gates.active.length ? [...new Set(result.gates.active.map((g) => g.code))].join(", ") : "kein Gate"
    } |`,
    `| Gewichtete Abdeckung | ${e.abdeckung} % | ${formatScore(result.coverage.coverageBp)} % |`,
    `| Freigabefähig | ${e.freigabefaehig ? "ja" : "nein"} | ${result.release.eligible ? "ja" : "nein"} |`,
    "",
  );

  // Abweichende oder nicht bewertete Kriterien mit vollem Rechenweg
  const relevant = result.trace.criteria.filter(
    (criterion) => !criterion.scored || (criterion.severity ?? 0) > 0,
  );
  lines.push("### Kriterien mit Bewertungsbeitrag", "");
  if (relevant.length === 0) {
    lines.push("Alle Kriterien sind mit Schweregrad 0 bewertet; kein Kriterium liefert einen Beitrag.", "");
  } else {
    lines.push(
      "| Kriterium | Dim. | w | Anwendbarkeit | s | q | F_A / F_E / F_R / F_M | r | w · r | Quelle |",
      "| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |",
    );
    for (const criterion of relevant) {
      lines.push(
        `| ${criterion.criterionId} | ${criterion.dimension} | ${criterion.weight} | ${criterion.applicability} | ` +
          `${criterion.severity ?? "–"} | ${criterion.qMicro === null ? "–" : num(Number(criterion.qMicro) / 1e6)} | ` +
          `${factorCell(criterion.factors)} | ${criterion.rMicro === null ? "–" : num(Number(criterion.rMicro) / 1e6, 3)} | ` +
          `${criterion.contributionMicro === null ? "–" : num(Number(criterion.contributionMicro) / 1e6)} | ` +
          `${SOURCE_TYPES[criterion.sourceType]?.label ?? criterion.sourceType} |`,
      );
    }
    lines.push("", "\\* Modifikator ist für diese Dimension nicht zugelassen und wirkt mit 1,00 (PRD 7.5).", "");
  }

  // Dimensionsebene und Rohscore
  lines.push("### Dimensionsebene", "");
  lines.push("| Dim. | Σ w | D_d | alpha_d | alpha_d · D_d |", "| --- | ---: | ---: | ---: | ---: |");
  for (const dimension of result.trace.dimensions) {
    lines.push(
      `| ${dimension.code} | ${dimension.weightSum} | ${dimension.populated ? formatScore(dimension.valueBp, 2) : "–"} | ` +
        `${num(dimension.weightBp / 10000, 4)} | ${num((dimension.weightBp * (Number(dimension.valueBp) / 100)) / 10000, 4)} |`,
    );
  }
  lines.push("");
  lines.push(
    `**S_raw = ${formatScore(result.rawScoreBp, 2)}** · höchster aktiver Gate-Floor = ` +
      `${num(result.gates.appliedFloorBp / 100)}${result.gates.floorGate ? ` (${result.gates.floorGate.code})` : ""} · ` +
      `**S_final = ${result.nb ? "NB" : formatScore(result.finalScoreBp, 2)}** · Klasse **${result.class}**`,
    "",
  );

  // Gates
  if (result.gates.active.length) {
    lines.push("### Gate-Auswertung", "");
    lines.push("| Gate | Stufe | Auslöser | Wirkung | Herkunft |", "| --- | --- | --- | --- | --- |");
    for (const gate of result.gates.active) {
      const wirkung =
        gate.effect === "floor"
          ? `Floor ${num(gate.floorBp / 100, 1)} · mindestens Klasse ${gate.minClass}`
          : gate.effect === "nb"
            ? "NB – kein veröffentlichter Zahlenwert"
            : "Freigabesperre";
      lines.push(`| ${gate.code} | ${gate.levelLabel} | ${gate.reason} | ${wirkung} | ${gate.origin} |`);
    }
    lines.push("");
  }

  // Konfidenz und Compliance
  lines.push("### Konfidenz und Compliance", "");
  lines.push(
    `K = 0,40 · ${formatScore(result.confidence.A)} + 0,30 · ${formatScore(result.confidence.Q)} + ` +
      `0,15 · ${formatScore(result.confidence.Z)} + 0,15 · ${formatScore(result.confidence.R)} = ` +
      `**${formatScore(result.confidence.valueBp)}** → **${result.confidence.klass}**`,
    "",
  );
  if (result.compliance.findings?.length) {
    for (const finding of result.compliance.findings) {
      lines.push(`- ${finding.text} (${SOURCE_TYPES[finding.sourceType]?.label ?? finding.sourceType})`);
    }
  } else {
    lines.push(`- Compliance-Status ${result.compliance.code}: keine offene verpflichtende Anforderung im Scope.`);
  }
  lines.push("");
  if (result.release.blockers.length) {
    lines.push("**Freigabesperren:**");
    for (const blocker of result.release.blockers) lines.push(`- ${blocker}`);
    lines.push("");
  }

  lines.push(
    "### Snapshot",
    "",
    "| Feld | Wert |",
    "| --- | --- |",
    `| input_hash | \`${snapshot.input_hash}\` |`,
    `| scope_hash | \`${snapshot.scope_hash}\` |`,
    `| signature_hash | \`${snapshot.signature_hash}\` |`,
    `| raw_score_bp | ${snapshot.raw_score_bp} |`,
    `| final_score_bp | ${snapshot.final_score_bp ?? "null (NB)"} |`,
    "",
  );
  return lines.join("\n");
}

export async function buildDocument() {
  const head = [
    "# Golden-Master-Satz T-BMA 1.0.0",
    "",
    "Referenzfälle der Validierungsstufe V1 nach PRD 16.1 mit vollständigem Berechnungstrace.",
    "Dieses Dokument wird aus `golden-masters.mjs` erzeugt und darf nicht von Hand geändert werden:",
    "`npm run trace:golden-masters`.",
    "",
    "| Merkmal | Festlegung |",
    "| --- | --- |",
    `| Modellversion | ${MODEL_VERSION} |`,
    `| Engine | ${ENGINE_VERSION} |`,
    `| Prüfprofil | ${BMA.id} ${BMA.version} · ${BMA.field} |`,
    `| Score-Art | ${BMA.scoreType} |`,
    `| Kriterien im Profil | ${BMA.criteria.length} |`,
    `| Referenzfälle | ${GOLDEN_MASTERS.length} |`,
    "",
    "Die Hashes dienen der Regressionskontrolle: Ändert sich ein Referenzfall, ändert sich sein",
    "`input_hash`. Berechnungs-ID und Zeitstempel sind für den Export bewusst fixiert (Fall-ID und",
    "1970-01-01), damit auch der `signature_hash` über Läufe hinweg vergleichbar bleibt.",
    "",
    "## Übersicht",
    "",
    "| Fall | Situation | Score | Klasse | Compliance | Konfidenz | Gate | Freigabe |",
    "| --- | --- | ---: | --- | --- | --- | --- | --- |",
  ];

  const sections = [];
  for (const golden of GOLDEN_MASTERS) {
    const input = buildCase(golden);
    const result = calculateScore(input);
    const snapshot = await createCalculationRun(result, {
      calculationId: golden.id,
      calculatedAt: "1970-01-01T00:00:00.000Z",
      reviewers: { pruefer: "Golden Master", reviewer: "Methodikboard", freigabe: "Product Owner" },
    });
    head.push(
      `| [${golden.id}](#${golden.id.toLowerCase()}--${golden.titel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}) | ${golden.titel} | ${result.display} | ${result.class} | ` +
        `${result.compliance.code} | ${result.confidence.klass} | ${
          result.gates.active.length ? [...new Set(result.gates.active.map((g) => g.code))].join(", ") : "–"
        } | ${result.release.eligible ? "ja" : "gesperrt"} |`,
    );
    sections.push(caseSection(golden, result, snapshot));
  }

  return `${head.join("\n")}\n\n${sections.join("\n---\n\n")}`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const target = new URL("./GOLDEN-MASTERS.md", import.meta.url);
  writeFileSync(target, `${await buildDocument()}\n`);
  console.log(`Trace geschrieben: ${fileURLToPath(target)} (${GOLDEN_MASTERS.length} Referenzfaelle)`);
}

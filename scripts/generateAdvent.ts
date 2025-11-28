// scripts/generateAdvent.ts
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { DailyAssignment } from "../lib/domain";
import { participants } from "../lib/data"; // 👈 on importe SEULEMENT les participants
import { generateMonthAssignmentsWithJokers } from "../lib/giftGenerator";

const YEAR = 2025;
const MONTH = 12; // décembre

function main() {
  const assignments: DailyAssignment[] = generateMonthAssignmentsWithJokers(
    participants,
    YEAR,
    MONTH,
    Math.random
  );

  const outputPath = resolve(process.cwd(), "advent.json");

  // ⚠️ C'EST ICI qu'on écrit le JSON complet
  writeFileSync(outputPath, JSON.stringify(assignments, null, 2), "utf-8");

  // Ce log va UNIQUEMENT dans la console, PAS dans le fichier
  console.log(
    `✅ Advent généré : ${assignments.length} lignes écrites dans ${outputPath}`
  );
}

main();

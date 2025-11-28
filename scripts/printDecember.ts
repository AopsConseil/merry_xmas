// scripts/printDecember.ts (ts-node / tsx)
import { participants } from "@/lib/data"; // ou recopie les participants ici
import { generateMonthAssignmentsWithJokers } from "@/lib/giftGenerator";

const assignments = generateMonthAssignmentsWithJokers(participants, 2025, 12);

console.log(JSON.stringify(assignments, null, 2));

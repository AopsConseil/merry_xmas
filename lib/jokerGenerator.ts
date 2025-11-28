// lib/jokerGenerator.ts
import type { DailyAssignment, JokerType } from "./domain";

const JOKER_TYPES: JokerType[] = ["VOL", "PARTAGE", "GENTILLESSE", "MYSTERE"];

function shuffleInPlace<T>(array: T[], random: () => number = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Assigne les jokers pour UNE semaine (lun–ven) :
 * - 4 de chaque type (dans la limite de ce qui est possible)
 * - pas 2 fois le même joker pour une même personne (en tant que receveur)
 * - ne modifie pas les jokers déjà présents
 */
export function assignWeeklyJokers(
  weekAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const updated = weekAssignments.map((a) => ({ ...a }));

  for (const jokerType of JOKER_TYPES) {
    const receiversAlreadySelected = new Set<string>();
    let assignedCount = 0;

    const candidateIndices = updated
      .map((a, index) => ({ a, index }))
      .filter(({ a }) => !a.joker) // ne touche pas aux jokers déjà définis
      .map(({ index }) => index);

    shuffleInPlace(candidateIndices, random);

    for (const index of candidateIndices) {
      if (assignedCount >= 4) break;

      const assignment = updated[index];
      const receiverId = assignment.receiverId;

      if (receiversAlreadySelected.has(receiverId)) continue;

      assignment.joker = jokerType;
      receiversAlreadySelected.add(receiverId);
      assignedCount++;
    }
  }

  return updated;
}

/**
 * Clé de semaine basée sur le lundi de la semaine.
 */
function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay(); // 0 = dim, 6 = sam

  const diffToMonday = (day + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);

  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Applique assignWeeklyJokers à toutes les semaines (lun–ven).
 * Les week-ends sont laissés vides (gérés comme Chocolat collectif).
 */
export function assignJokersForAllWeeks(
  allAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const weekdayAssignments: DailyAssignment[] = [];
  const weekendAssignments: DailyAssignment[] = [];

  for (const a of allAssignments) {
    const dateObj = new Date(a.date + "T02:00:00");
    const day = dateObj.getDay(); // 0 = dim, 6 = sam

    if (day === 0 || day === 6) {
      weekendAssignments.push(a);
    } else {
      weekdayAssignments.push(a);
    }
  }

  const byWeek = new Map<string, DailyAssignment[]>();

  for (const a of weekdayAssignments) {
    const key = getWeekKey(a.date);
    const group = byWeek.get(key) ?? [];
    group.push(a);
    byWeek.set(key, group);
  }

  const result: DailyAssignment[] = [];

  for (const [, weekList] of byWeek.entries()) {
    const withJokers = assignWeeklyJokers(weekList, random);
    result.push(...withJokers);
  }

  // Ajout des éventuels week-ends (en pratique il n’y en a pas car on ne les génère pas)
  result.push(...weekendAssignments);

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

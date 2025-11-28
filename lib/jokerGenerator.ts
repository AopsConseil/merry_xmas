// lib/jokerGenerator.ts
import type { DailyAssignment, JokerType } from "./domain";

// Jokers hebdo (on exclut "COMMUN" qui sert pour le collectif / week-end)
const WEEK_JOKERS: JokerType[] = ["VOL", "PARTAGE", "GENTILLESSE", "MYSTERE"];

// nb max *théorique* par type et par semaine
const MAX_PER_TYPE = 4;

function shuffleInPlace<T>(array: T[], random: () => number = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Assigne les jokers pour UNE semaine (lun–ven) en respectant :
 * - pas 2 fois le même joker pour une même personne sur la semaine (en tant que receveur)
 * - au maximum MAX_PER_TYPE jokers de chaque type (sauf si pas assez de “slots”)
 * - **chaque receveur a au moins 1 joker dans la semaine** si la capacité le permet
 * - ne modifie pas les jokers déjà présents
 */
export function assignWeeklyJokers(
  weekAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const updated = weekAssignments.map((a) => ({ ...a }));

  // Stats actuelles (cas où certains jokers seraient déjà pré-remplis)
  const jokerUsage: Record<JokerType, number> = {
    VOL: 0,
    PARTAGE: 0,
    GENTILLESSE: 0,
    MYSTERE: 0,
    COMMUN: 0,
  };

  // Pour savoir quels types un receveur a déjà dans la semaine
  const receiverHasType = new Map<string, Set<JokerType>>();

  updated.forEach((a) => {
    if (!a.joker) return;
    const type = a.joker as JokerType;
    jokerUsage[type] = (jokerUsage[type] ?? 0) + 1;

    if (!receiverHasType.has(a.receiverId)) {
      receiverHasType.set(a.receiverId, new Set());
    }
    receiverHasType.get(a.receiverId)!.add(type);
  });

  // Slots encore libres par receveur (assignments sans joker)
  const freeSlotsPerReceiver = new Map<string, number[]>();
  updated.forEach((a, index) => {
    if (a.joker) return;
    const list = freeSlotsPerReceiver.get(a.receiverId) ?? [];
    list.push(index);
    freeSlotsPerReceiver.set(a.receiverId, list);
  });

  const allReceivers = Array.from(new Set(updated.map((a) => a.receiverId)));

  // Receveurs qui n'ont encore aucun joker (sur VOL/PARTAGE/GENTILLESSE/MYSTERE)
  const needingJoker = allReceivers.filter((rid) => {
    const set = receiverHasType.get(rid);
    if (!set) return true;
    // Si le set ne contient que "COMMUN", on considère qu'il n'a pas encore de joker "hebdo"
    const hasWeekJoker = WEEK_JOKERS.some((t) => set.has(t));
    return !hasWeekJoker;
  });

  shuffleInPlace(needingJoker, random);

  // --- Étape A : garantir au moins 1 joker par receveur ---
  for (const rid of needingJoker) {
    const freeSlots = freeSlotsPerReceiver.get(rid);
    if (!freeSlots || freeSlots.length === 0) {
      // aucun slot libre pour cette personne → on ne peut pas faire de miracle
      continue;
    }

    const existingSet = receiverHasType.get(rid) ?? new Set<JokerType>();

    // Types encore possibles pour cette personne
    const availableTypes = WEEK_JOKERS.filter((t) => {
      const used = jokerUsage[t] ?? 0;
      if (used >= MAX_PER_TYPE) return false;
      if (existingSet.has(t)) return false;
      return true;
    });

    if (availableTypes.length === 0) {
      // plus de capacité disponible pour cette personne
      continue;
    }

    shuffleInPlace(freeSlots, random);
    const chosenSlot = freeSlots.shift()!; // on prend un slot libre

    const chosenType =
      availableTypes[Math.floor(random() * availableTypes.length)];

    updated[chosenSlot].joker = chosenType;
    jokerUsage[chosenType] = (jokerUsage[chosenType] ?? 0) + 1;

    existingSet.add(chosenType);
    receiverHasType.set(rid, existingSet);
  }

  // --- Étape B : remplir le reste de la capacité par type ---
  for (const jokerType of WEEK_JOKERS) {
    while ((jokerUsage[jokerType] ?? 0) < MAX_PER_TYPE) {
      // Chercher les assignments sans joker
      const candidateIndices: number[] = [];

      updated.forEach((a, index) => {
        if (a.joker) return;
        const set = receiverHasType.get(a.receiverId) ?? new Set();
        if (!set.has(jokerType)) {
          candidateIndices.push(index);
        }
      });

      if (candidateIndices.length === 0) {
        // plus de slots libres pour ce type
        break;
      }

      shuffleInPlace(candidateIndices, random);
      const chosenIndex = candidateIndices[0];
      const r = updated[chosenIndex].receiverId;

      updated[chosenIndex].joker = jokerType;
      jokerUsage[jokerType] = (jokerUsage[jokerType] ?? 0) + 1;

      const set = receiverHasType.get(r) ?? new Set<JokerType>();
      set.add(jokerType);
      receiverHasType.set(r, set);
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

  // On rajoute les éventuels week-ends
  result.push(...weekendAssignments);

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

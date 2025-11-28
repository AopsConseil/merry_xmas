// lib/giftGenerator.ts
import type { Participant, DailyAssignment } from "./domain";
import { assignJokersForAllWeeks } from "./jokerGenerator";

/**
 * Mélange un tableau (Fisher–Yates)
 */
function shuffleInPlace<T>(array: T[], random: () => number = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Derangement : permutation sans point fixe
 * (personne ne se donne un chocolat à elle-même).
 */
function generateDerangement<T>(
  items: T[],
  random: () => number = Math.random
): T[] {
  const result = [...items];
  const n = result.length;

  if (n <= 1) return result;

  // Shuffle d'abord
  shuffleInPlace(result, random);

  // Corrige les cas où result[i] === items[i] en swapant avec un voisin
  for (let i = 0; i < n; i++) {
    if (result[i] === items[i]) {
      const j = i === n - 1 ? i - 1 : i + 1;
      [result[i], result[j]] = [result[j], result[i]];
    }
  }

  return result;
}

/**
 * Génère les assignations d'un jour donné (dateStr = "YYYY-MM-DD")
 * pour tous les participants :
 * - chacun est donneur exactement une fois
 * - chacun reçoit exactement une fois
 * - personne ne se donne à soi-même
 */
export function generateDailyAssignments(
  dateStr: string,
  participants: Participant[],
  random: () => number = Math.random
): DailyAssignment[] {
  const giverIds = participants.map((p) => p.id);
  const receiverIds = generateDerangement(giverIds, random);

  return giverIds.map((giverId, index) => ({
    date: dateStr,
    giverId,
    receiverId: receiverIds[index],
    joker: undefined,
  }));
}

/**
 * Génère toutes les assignations pour un mois complet,
 * pour les jours de semaine uniquement (lun–ven).
 * Puis applique assignJokersForAllWeeks pour respecter
 * les règles des 4 jokers par semaine.
 */
export function generateMonthAssignmentsWithJokers(
  participants: Participant[],
  year: number,
  month: number, // 1–12 (12 = décembre)
  random: () => number = Math.random
): DailyAssignment[] {
  const result: DailyAssignment[] = [];

  const jsMonth = month - 1; // JS: 0-11
  const date = new Date(year, jsMonth, 1);

  while (date.getMonth() === jsMonth) {
    const dayOfMonth = date.getDate();

    // On s'arrête au 24 inclus
    if (dayOfMonth > 24) {
      break;
    }

    const dayOfWeek = date.getDay(); // 0 = dim, 6 = sam

    // On ne génère que pour les jours de semaine (lun–ven)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // ⚠️ NE PAS utiliser toISOString → on formate à la main
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(dayOfMonth).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`; // ex: "2025-12-03"

      const daily = generateDailyAssignments(dateStr, participants, random);
      result.push(...daily);
    }

    // On avance d'un jour
    date.setDate(dayOfMonth + 1);
  }

  // Ici on applique la logique des Jokers semaine par semaine
  return assignJokersForAllWeeks(result, random);
}

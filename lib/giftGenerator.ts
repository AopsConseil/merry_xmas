// lib/giftGenerator.ts
import type { Participant, DailyAssignment } from "./domain";
import { assignJokersForAllWeeks } from "./jokerGenerator";

/**
 * Mélange un tableau (Fisher–Yates)
 */
function shuffleInPlace<T>(
  array: T[],
  random: () => number = Math.random
): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Dérangement : permutation sans point fixe
 * (personne ne se donne un chocolat à elle-même).
 */
function generateDerangement<T>(
  items: T[],
  random: () => number = Math.random
): T[] {
  const result = [...items];
  const n = result.length;

  if (n <= 1) return result;

  // Mélange d'abord
  shuffleInPlace(result, random);

  // Corrige les cas où result[i] === items[i] en swappant avec un voisin
  for (let i = 0; i < n; i++) {
    if (result[i] === items[i]) {
      const j = i === n - 1 ? i - 1 : i + 1;
      [result[i], result[j]] = [result[j], result[i]];
    }
  }

  return result;
}

/**
 * Essaie de générer un dérangement en évitant que
 * giverId -> receiverId soit identique au jour précédent.
 *
 * - On interdit: receiver == giver (dérangement)
 * - On interdit: receiver == previousDayMap[giver]
 */
function generateConstrainedDerangement(
  giverIds: string[],
  previousDayAssignments: DailyAssignment[] | null,
  random: () => number = Math.random,
  maxTries = 1000
): string[] {
  const n = giverIds.length;
  if (n <= 1) {
    // avec 1 seul participant, pas grand-chose à faire
    return [...giverIds];
  }

  // Map donneur -> receveur de la veille
  const prevMap = new Map<string, string>();
  if (previousDayAssignments) {
    for (const a of previousDayAssignments) {
      prevMap.set(a.giverId, a.receiverId);
    }
  }

  const baseReceivers = [...giverIds];

  // Pré-calcul des interdits par donneur
  const forbidden = new Map<string, Set<string>>();
  for (const giver of giverIds) {
    const set = new Set<string>();
    // ne pas se donner à soi-même
    set.add(giver);
    // ne pas refaire la même paire qu'hier si elle existe
    const prevReceiver = prevMap.get(giver);
    if (prevReceiver) {
      set.add(prevReceiver);
    }
    forbidden.set(giver, set);
  }

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const receiverIds = [...baseReceivers];
    shuffleInPlace(receiverIds, random);

    let ok = true;
    for (let i = 0; i < n; i++) {
      const giver = giverIds[i];
      const receiver = receiverIds[i];
      const forb = forbidden.get(giver);
      if (forb && forb.has(receiver)) {
        ok = false;
        break;
      }
    }

    if (ok) {
      return receiverIds;
    }
  }

  // Si on n'y arrive pas (cas très rare / très petit n),
  // on retombe sur un dérangement simple (on accepte éventuellement
  // la même paire qu'à la veille).
  return generateDerangement(giverIds, random);
}

/**
 * Génère les assignations d'un jour donné (dateStr = "YYYY-MM-DD")
 * pour tous les participants :
 * - chacun est donneur exactement une fois
 * - chacun reçoit exactement une fois
 * - personne ne se donne à soi-même
 *
 * 👉 Version de base (sans contrainte sur la veille)
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
 * Variante avec contrainte "pas la même paire que la veille".
 */
function generateDailyAssignmentsWithPreviousDay(
  dateStr: string,
  participants: Participant[],
  previousDayAssignments: DailyAssignment[] | null,
  random: () => number = Math.random
): DailyAssignment[] {
  const giverIds = participants.map((p) => p.id);
  const receiverIds = generateConstrainedDerangement(
    giverIds,
    previousDayAssignments,
    random
  );

  return giverIds.map((giverId, index) => ({
    date: dateStr,
    giverId,
    receiverId: receiverIds[index],
    joker: undefined,
  }));
}

/**
 * Génère toutes les assignations pour un mois complet,
 * pour les jours de semaine uniquement (lun–ven) et du 1er au 24 inclus.
 *
 * Contraintes :
 * - chaque jour est un dérangement
 * - on évite qu'un même donneur ait le même receveur que la veille
 * - puis on applique assignJokersForAllWeeks pour les règles de Jokers
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

  // On garde en mémoire les assignations du dernier jour ouvré
  let previousWorkingDayAssignments: DailyAssignment[] | null = null;

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

      const daily = generateDailyAssignmentsWithPreviousDay(
        dateStr,
        participants,
        previousWorkingDayAssignments,
        random
      );

      result.push(...daily);

      // On mémorise pour le prochain jour ouvré
      previousWorkingDayAssignments = daily;
    }

    // On avance d'un jour
    date.setDate(dayOfMonth + 1);
  }

  // Ici on applique la logique des Jokers semaine par semaine + passes de couverture
  return assignJokersForAllWeeks(result, random);
}

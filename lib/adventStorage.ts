// lib/adventStorage.ts
import { kv } from "@vercel/kv";
import type { DailyAssignment } from "./domain";
import { participants } from "./data";
import { generateMonthAssignmentsWithJokers } from "./giftGenerator";

const ADVENT_YEAR = 2025;
const ADVENT_MONTH = 12;
const KV_KEY = `advent:${ADVENT_YEAR}`;

/**
 * Génère toutes les assignations du 1er au 24/12
 * (en respectant tes règles via generateMonthAssignmentsWithJokers)
 * puis les stocke dans KV.
 */
export async function regenerateAdventAssignments(): Promise<
  DailyAssignment[]
> {
  const generated = generateMonthAssignmentsWithJokers(
    participants,
    ADVENT_YEAR,
    ADVENT_MONTH
  );

  await kv.set(KV_KEY, generated);
  return generated;
}

/**
 * Récupère les assignations.
 * - Si déjà en KV → on les retourne
 * - Sinon → on les génère une fois, on les stocke, puis on les retourne
 *   (pratique en dev, même sans cron).
 */
export async function getAdventAssignments(): Promise<DailyAssignment[]> {
  const existing = await kv.get<DailyAssignment[]>(KV_KEY);

  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  // Fallback : première génération
  return regenerateAdventAssignments();
}

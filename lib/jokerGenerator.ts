// lib/jokerGenerator.ts
import type { DailyAssignment, JokerType } from "./domain";

// Jokers hebdo (on exclut "COMMUN" qui sert pour le collectif / week-end)
const WEEK_JOKERS: JokerType[] = ["VOL", "PARTAGE", "GENTILLESSE", "MYSTERE"];
const GENTILLESSE: JokerType = "GENTILLESSE";

// valeur par défaut (si aucune règle spéciale)
const DEFAULT_MAX_PER_TYPE = 4;

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

function isWeekday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

/**
 * Règles spéciales de capacité hebdo par type :
 *
 * - Semaine du 1→5 déc 2025 (lundi 2025-12-01) : 5 par type
 * - Semaine du 8→12 déc 2025 (lundi 2025-12-08) : 5 par type
 * - Semaine du 15→19 déc 2025 (lundi 2025-12-15) : 5 par type
 * - Semaine du 22→24 déc 2025 (lundi 2025-12-22) : 2 par type
 * - Sinon : 4 par type
 */
function getMaxPerTypeForWeek(weekKey: string): number {
  switch (weekKey) {
    case "2025-12-01":
    case "2025-12-08":
    case "2025-12-15":
      return 5;
    case "2025-12-22":
      return 2;
    default:
      return DEFAULT_MAX_PER_TYPE;
  }
}

type WeekState = {
  weekKey: string;
  maxPerType: number;
  jokerUsage: Record<JokerType, number>;
  giverHasType: Map<string, Set<JokerType>>;
  receiverHasType: Map<string, Set<JokerType>>;
};

function makeEmptyUsage(): Record<JokerType, number> {
  return {
    VOL: 0,
    PARTAGE: 0,
    GENTILLESSE: 0,
    MYSTERE: 0,
    COMMUN: 0,
  };
}

/**
 * Construit l'état hebdo à partir des assignations (jours de semaine uniquement).
 */
function buildWeekStates(
  assignments: DailyAssignment[]
): Map<string, WeekState> {
  const weekStates = new Map<string, WeekState>();

  function getOrCreateWeekState(weekKey: string): WeekState {
    let ws = weekStates.get(weekKey);
    if (!ws) {
      ws = {
        weekKey,
        maxPerType: getMaxPerTypeForWeek(weekKey),
        jokerUsage: makeEmptyUsage(),
        giverHasType: new Map(),
        receiverHasType: new Map(),
      };
      weekStates.set(weekKey, ws);
    }
    return ws;
  }

  assignments.forEach((a) => {
    if (!isWeekday(a.date)) return;

    const weekKey = getWeekKey(a.date);
    const ws = getOrCreateWeekState(weekKey);

    if (!a.joker) return;
    const type = a.joker as JokerType;
    if (!WEEK_JOKERS.includes(type)) return;

    ws.jokerUsage[type] = (ws.jokerUsage[type] ?? 0) + 1;

    const gSet = ws.giverHasType.get(a.giverId) ?? new Set<JokerType>();
    gSet.add(type);
    ws.giverHasType.set(a.giverId, gSet);

    const rSet = ws.receiverHasType.get(a.receiverId) ?? new Set<JokerType>();
    rSet.add(type);
    ws.receiverHasType.set(a.receiverId, rSet);
  });

  return weekStates;
}

/**
 * Assigne les jokers pour UNE semaine (lun–ven) en respectant :
 * - pas 2 fois le même joker pour une même personne en tant que RECEVEUR
 * - pas 2 fois le même joker pour une même personne en tant que DONNEUR
 * - au maximum maxPerType jokers de chaque type
 * - chaque receveur a au moins 1 joker dans la semaine si la capacité le permet
 * - ne modifie pas les jokers déjà présents
 */
export function assignWeeklyJokers(
  weekAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const updated = weekAssignments.map((a) => ({ ...a }));

  if (updated.length === 0) return updated;

  const weekKey = getWeekKey(updated[0].date);
  const maxPerType = getMaxPerTypeForWeek(weekKey);

  const jokerUsage: Record<JokerType, number> = makeEmptyUsage();
  const receiverHasType = new Map<string, Set<JokerType>>();
  const giverHasType = new Map<string, Set<JokerType>>();

  // Comptage initial
  updated.forEach((a) => {
    if (!a.joker) return;
    const type = a.joker as JokerType;
    if (!WEEK_JOKERS.includes(type)) return;

    jokerUsage[type] = (jokerUsage[type] ?? 0) + 1;

    const rSet = receiverHasType.get(a.receiverId) ?? new Set<JokerType>();
    rSet.add(type);
    receiverHasType.set(a.receiverId, rSet);

    const gSet = giverHasType.get(a.giverId) ?? new Set<JokerType>();
    gSet.add(type);
    giverHasType.set(a.giverId, gSet);
  });

  // Slots libres par receveur
  const freeSlotsPerReceiver = new Map<string, number[]>();
  updated.forEach((a, index) => {
    if (a.joker) return;
    const list = freeSlotsPerReceiver.get(a.receiverId) ?? [];
    list.push(index);
    freeSlotsPerReceiver.set(a.receiverId, list);
  });

  const allReceivers = Array.from(new Set(updated.map((a) => a.receiverId)));

  const needingJoker = allReceivers.filter((rid) => {
    const set = receiverHasType.get(rid);
    if (!set) return true;
    const hasWeekJoker = WEEK_JOKERS.some((t) => set.has(t));
    return !hasWeekJoker;
  });

  shuffleInPlace(needingJoker, random);

  // Étape A : au moins 1 joker par receveur (si possible)
  for (const rid of needingJoker) {
    const freeSlots = freeSlotsPerReceiver.get(rid);
    if (!freeSlots || freeSlots.length === 0) continue;

    let receiverSet = receiverHasType.get(rid);
    if (!receiverSet) {
      receiverSet = new Set<JokerType>();
      receiverHasType.set(rid, receiverSet);
    }

    shuffleInPlace(freeSlots, random);

    let assigned = false;

    for (const slotIndex of freeSlots) {
      const slot = updated[slotIndex];
      if (slot.joker) continue;

      const giverId = slot.giverId;
      let giverSet = giverHasType.get(giverId);
      if (!giverSet) {
        giverSet = new Set<JokerType>();
        giverHasType.set(giverId, giverSet);
      }

      const possibleTypes = WEEK_JOKERS.filter((t) => {
        const used = jokerUsage[t] ?? 0;
        if (used >= maxPerType) return false;
        if (receiverSet!.has(t)) return false;
        if (giverSet!.has(t)) return false;
        return true;
      });

      if (possibleTypes.length === 0) continue;

      const chosenType =
        possibleTypes[Math.floor(random() * possibleTypes.length)];

      slot.joker = chosenType;
      jokerUsage[chosenType] = (jokerUsage[chosenType] ?? 0) + 1;

      receiverSet.add(chosenType);
      giverSet.add(chosenType);

      assigned = true;
      break;
    }

    if (!assigned) continue;
  }

  // Étape B : remplir la capacité par type
  for (const jokerType of WEEK_JOKERS) {
    while ((jokerUsage[jokerType] ?? 0) < maxPerType) {
      const candidateIndices: number[] = [];

      updated.forEach((a, index) => {
        if (a.joker) return;

        const rSet = receiverHasType.get(a.receiverId) ?? new Set<JokerType>();
        if (rSet.has(jokerType)) return;

        const gSet = giverHasType.get(a.giverId) ?? new Set<JokerType>();
        if (gSet.has(jokerType)) return;

        candidateIndices.push(index);
      });

      if (candidateIndices.length === 0) break;

      shuffleInPlace(candidateIndices, random);
      const chosenIndex = candidateIndices[0];
      const chosen = updated[chosenIndex];

      chosen.joker = jokerType;
      jokerUsage[jokerType] = (jokerUsage[jokerType] ?? 0) + 1;

      const rSet =
        receiverHasType.get(chosen.receiverId) ?? new Set<JokerType>();
      rSet.add(jokerType);
      receiverHasType.set(chosen.receiverId, rSet);

      const gSet = giverHasType.get(chosen.giverId) ?? new Set<JokerType>();
      gSet.add(jokerType);
      giverHasType.set(chosen.giverId, gSet);
    }
  }

  return updated;
}

/**
 * Passe de rattrapage mensuelle :
 * tout le monde doit avoir reçu au moins 1 joker (quel qu'il soit)
 * sur l’ensemble de la période (1er → 24).
 */
function ensureMonthlyCoverage(
  allAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const updated = allAssignments.map((a) => ({ ...a }));

  const ids = new Set<string>();
  updated.forEach((a) => {
    ids.add(a.receiverId);
    ids.add(a.giverId);
  });

  const hasJokerAsReceiver = new Set<string>();
  updated.forEach((a) => {
    if (!a.joker) return;
    const type = a.joker as JokerType;
    if (!WEEK_JOKERS.includes(type)) return;
    hasJokerAsReceiver.add(a.receiverId);
  });

  const everyone = Array.from(ids);
  const missing = everyone.filter((id) => !hasJokerAsReceiver.has(id));

  if (missing.length === 0) return updated;

  type WeekStateMini = {
    receiverHasType: Map<string, Set<JokerType>>;
    giverHasType: Map<string, Set<JokerType>>;
    jokerUsage: Record<JokerType, number>;
    maxPerType: number;
  };

  const weekStates = new Map<string, WeekStateMini>();

  function getOrCreateWeekState(key: string): WeekStateMini {
    let ws = weekStates.get(key);
    if (!ws) {
      ws = {
        receiverHasType: new Map(),
        giverHasType: new Map(),
        jokerUsage: makeEmptyUsage(),
        maxPerType: getMaxPerTypeForWeek(key),
      };
      weekStates.set(key, ws);
    }
    return ws;
  }

  updated.forEach((a) => {
    if (!a.joker) return;
    const type = a.joker as JokerType;
    if (!WEEK_JOKERS.includes(type)) return;

    const key = getWeekKey(a.date);
    const ws = getOrCreateWeekState(key);

    ws.jokerUsage[type] = (ws.jokerUsage[type] ?? 0) + 1;

    const rSet = ws.receiverHasType.get(a.receiverId) ?? new Set<JokerType>();
    rSet.add(type);
    ws.receiverHasType.set(a.receiverId, rSet);

    const gSet = ws.giverHasType.get(a.giverId) ?? new Set<JokerType>();
    gSet.add(type);
    ws.giverHasType.set(a.giverId, gSet);
  });

  for (const id of missing) {
    const candidateIndices: number[] = [];
    updated.forEach((a, index) => {
      if (a.receiverId === id && !a.joker && isWeekday(a.date)) {
        candidateIndices.push(index);
      }
    });

    if (candidateIndices.length === 0) continue;

    shuffleInPlace(candidateIndices, random);
    let assigned = false;

    for (const idx of candidateIndices) {
      const a = updated[idx];
      const key = getWeekKey(a.date);
      const ws = getOrCreateWeekState(key);

      const rSet = ws.receiverHasType.get(a.receiverId) ?? new Set<JokerType>();
      const gSet = ws.giverHasType.get(a.giverId) ?? new Set<JokerType>();

      const possibleTypes = WEEK_JOKERS.filter((t) => {
        if (rSet.has(t)) return false;
        if (gSet.has(t)) return false;
        if ((ws.jokerUsage[t] ?? 0) >= ws.maxPerType) return false;
        return true;
      });

      if (possibleTypes.length === 0) continue;

      const chosenType =
        possibleTypes[Math.floor(random() * possibleTypes.length)];

      a.joker = chosenType;
      hasJokerAsReceiver.add(id);

      rSet.add(chosenType);
      ws.receiverHasType.set(a.receiverId, rSet);

      gSet.add(chosenType);
      ws.giverHasType.set(a.giverId, gSet);

      ws.jokerUsage[chosenType] = (ws.jokerUsage[chosenType] ?? 0) + 1;

      assigned = true;
      break;
    }
  }

  return updated;
}

/**
 * Calcule qui n'a JAMAIS reçu GENTILLESSE (sur toute la période).
 */
function computeGentilMissing(
  allAssignments: DailyAssignment[]
): Record<string, boolean> {
  const ids = new Set<string>();
  const hasGentil = new Set<string>();

  allAssignments.forEach((a) => {
    ids.add(a.giverId);
    ids.add(a.receiverId);
    if (a.joker === GENTILLESSE) {
      hasGentil.add(a.receiverId);
    }
  });

  const result: Record<string, boolean> = {};
  for (const id of ids) {
    result[id] = !hasGentil.has(id);
  }
  return result;
}

function checkGentilCoverage(allAssignments: DailyAssignment[]): void {
  const missing = computeGentilMissing(allAssignments);
  const missingIds = Object.entries(missing)
    .filter(([, v]) => v)
    .map(([id]) => id);

  if (missingIds.length === 0) {
    console.log(
      "✅ Couverture GENTILLESSE : chaque personne a reçu au moins une fois GENTILLESSE sur la période."
    );
  } else {
    console.warn(
      "⚠️ Couverture GENTILLESSE incomplète (ces personnes n'ont jamais reçu GENTILLESSE) :"
    );
    console.warn(JSON.stringify(missingIds, null, 2));
  }
}

/**
 * Essaye de donner au moins une GENTILLESSE à une personne qui n'en a pas encore reçu,
 * en réaffectant un joker sur un de ses slots comme receveur, en respectant :
 *  - maxPerType par semaine,
 *  - pas 2× GENTILLESSE pour la même personne (receveur) sur la même semaine,
 *  - pas 2× GENTILLESSE pour le même donneur sur la même semaine.
 */
function tryGiveGentilToReceiver(
  assignments: DailyAssignment[],
  weekStates: Map<string, WeekState>,
  personId: string,
  random: () => number
): boolean {
  const candidateIndices: number[] = [];

  assignments.forEach((a, index) => {
    if (!isWeekday(a.date)) return;
    if (a.receiverId !== personId) return;
    candidateIndices.push(index);
  });

  if (candidateIndices.length === 0) return false;

  shuffleInPlace(candidateIndices, random);

  for (const idx of candidateIndices) {
    const a = assignments[idx];
    const weekKey = getWeekKey(a.date);
    let ws = weekStates.get(weekKey);
    if (!ws) {
      ws = {
        weekKey,
        maxPerType: getMaxPerTypeForWeek(weekKey),
        jokerUsage: makeEmptyUsage(),
        giverHasType: new Map(),
        receiverHasType: new Map(),
      };
      weekStates.set(weekKey, ws);
    }

    const maxPerType = ws.maxPerType;
    const currentType = a.joker as JokerType | undefined;

    if (currentType === GENTILLESSE) {
      return true; // déjà gentil sur ce slot (cas limite)
    }

    const giverId = a.giverId;
    const receiverId = a.receiverId;

    const giverSet = ws.giverHasType.get(giverId) ?? new Set<JokerType>();
    const receiverSet =
      ws.receiverHasType.get(receiverId) ?? new Set<JokerType>();

    if ((ws.jokerUsage[GENTILLESSE] ?? 0) >= maxPerType) continue;
    if (receiverSet.has(GENTILLESSE)) continue; // déjà GENTILLESSE pour ce receveur cette semaine
    if (giverSet.has(GENTILLESSE)) continue; // déjà GENTILLESSE pour ce donneur cette semaine

    // Réaffectation : on enlève l'ancien type, on pose GENTILLESSE
    if (currentType && WEEK_JOKERS.includes(currentType)) {
      ws.jokerUsage[currentType] = (ws.jokerUsage[currentType] ?? 0) - 1;
      const oldG = ws.giverHasType.get(giverId);
      const oldR = ws.receiverHasType.get(receiverId);
      oldG?.delete(currentType);
      oldR?.delete(currentType);
    }

    a.joker = GENTILLESSE;
    ws.jokerUsage[GENTILLESSE] = (ws.jokerUsage[GENTILLESSE] ?? 0) + 1;

    giverSet.add(GENTILLESSE);
    receiverSet.add(GENTILLESSE);
    ws.giverHasType.set(giverId, giverSet);
    ws.receiverHasType.set(receiverId, receiverSet);

    return true;
  }

  return false;
}

/**
 * Passe globale pour essayer de satisfaire :
 *  - sur toute la période, chaque personne reçoit au moins une GENTILLESSE.
 */
function ensureEveryoneGetsGentil(
  allAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const updated = allAssignments.map((a) => ({ ...a }));
  const weekStates = buildWeekStates(updated);

  const maxPasses = 40;

  for (let pass = 0; pass < maxPasses; pass++) {
    const missing = computeGentilMissing(updated);
    const missingIds = Object.entries(missing)
      .filter(([, v]) => v)
      .map(([id]) => id);

    if (missingIds.length === 0) break;

    shuffleInPlace(missingIds, random);

    let fixedSomething = false;
    for (const pid of missingIds) {
      const ok = tryGiveGentilToReceiver(updated, weekStates, pid, random);
      if (ok) fixedSomething = true;
    }

    if (!fixedSomething) break;
  }

  return updated;
}

/**
 * Version de base : applique "assignWeeklyJokers" à chaque semaine,
 * puis "ensureMonthlyCoverage".
 */
function baseAssignJokersForAllWeeks(
  allAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const weekdayAssignments: DailyAssignment[] = [];
  const weekendAssignments: DailyAssignment[] = [];

  for (const a of allAssignments) {
    if (!isWeekday(a.date)) {
      weekendAssignments.push({ ...a });
    } else {
      weekdayAssignments.push({ ...a });
    }
  }

  const byWeek = new Map<string, DailyAssignment[]>();

  for (const a of weekdayAssignments) {
    const key = getWeekKey(a.date);
    const group = byWeek.get(key) ?? [];
    group.push(a);
    byWeek.set(key, group);
  }

  const weekdayWithJokers: DailyAssignment[] = [];

  for (const [, weekList] of byWeek.entries()) {
    const withJokers = assignWeeklyJokers(weekList, random);
    weekdayWithJokers.push(...withJokers);
  }

  const weekdayCovered = ensureMonthlyCoverage(weekdayWithJokers, random);

  const result: DailyAssignment[] = [...weekdayCovered, ...weekendAssignments];
  result.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

/**
 * Applique la logique hebdo + rattrapage mensuel,
 * puis plusieurs tentatives pour obtenir la meilleure couverture possible
 * pour la règle :
 *  - tout le monde reçoit au moins 1 fois GENTILLESSE.
 */
export function assignJokersForAllWeeks(
  allAssignments: DailyAssignment[],
  random: () => number = Math.random
): DailyAssignment[] {
  const maxAttempts = 40;

  let best: DailyAssignment[] | null = null;
  let bestMissingCount = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const base = baseAssignJokersForAllWeeks(allAssignments, random);
    const improved = ensureEveryoneGetsGentil(base, random);

    const missing = computeGentilMissing(improved);
    const missingCount = Object.values(missing).filter((v) => v).length;

    if (missingCount === 0) {
      console.log(
        `✅ Couverture GENTILLESSE complète après ${attempt + 1} tentative(s).`
      );
      checkGentilCoverage(improved);
      return improved;
    }

    if (missingCount < bestMissingCount || !best) {
      bestMissingCount = missingCount;
      best = improved;
    }
  }

  if (best) {
    console.warn(
      `⚠️ Impossible d'obtenir une couverture GENTILLESSE parfaite après ${maxAttempts} tentatives. ` +
        `On renvoie la meilleure configuration trouvée (personnes encore sans GENTILLESSE = ${bestMissingCount}).`
    );
    checkGentilCoverage(best);
    return best;
  }

  const fallback = baseAssignJokersForAllWeeks(allAssignments, random);
  checkGentilCoverage(fallback);
  return fallback;
}

// lib/adventStorage.ts
import type { DailyAssignment } from "./domain";
import { dailyAssignments } from "./data";

export async function getAdventAssignments(): Promise<DailyAssignment[]> {
  // plus de KV, juste les données générées au build
  return dailyAssignments;
}

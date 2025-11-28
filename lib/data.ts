// lib/data.ts
import type { Participant, DailyAssignment } from "./domain";
import { generateMonthAssignmentsWithJokers } from "./giftGenerator";

export const participants: Participant[] = [
  { id: "ivan", firstName: "Ivan" },
  { id: "vincent", firstName: "Vincent" },
  { id: "nathalie", firstName: "Nathalie" },
  { id: "josephine", firstName: "Joséphine" },
  { id: "jc", firstName: "Jean-Christophe" },
  { id: "jp", firstName: "Jean-Paul" },
  { id: "fx", firstName: "François-Xavier" },
  { id: "maxime", firstName: "Maxime" },
  { id: "charlotte", firstName: "Charlotte" },
  { id: "anna", firstName: "Anna-Louisa" },
  { id: "florence", firstName: "Florence" },
  { id: "sebastien", firstName: "Sébastien" },
  { id: "eliot", firstName: "Eliot" },
  { id: "sylvain", firstName: "Sylvain" },
];

// Génération automatique : toutes les journées de semaine de décembre 2025
// + jokers assignés semaine par semaine avec les règles
export const dailyAssignments: DailyAssignment[] =
  generateMonthAssignmentsWithJokers(participants, 2025, 12);

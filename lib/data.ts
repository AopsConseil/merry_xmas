// lib/data.ts
import type { DailyAssignment, Participant, JokerType } from "./domain";
// import { generateMonthAssignmentsWithJokers } from "./giftGenerator";
// import { createSeededRandom } from "./seededRandom";
import advent from "../advent.json";

export const participants: Participant[] = [
  { id: "ivan", firstName: "Ivan", email: "ivan.lilla@aops.fr" },
  //   { id: "vincent", firstName: "Vincent", email: "vincent.morot@aops.fr" },
  //   { id: "nathalie", firstName: "Nathalie", email: "nathalie.sassier@aops.fr" },
  //   { id: "josephine", firstName: "Joséphine", email: "josephine.coat@aops.fr" },
  //   {
  //     id: "jc",
  //     firstName: "Jean-Christophe",
  //     email: "jean-christophe.menguy@aops.fr",
  //   },
  //   { id: "jp", firstName: "Jean-Paul", email: "jean-paul.verret@aops.fr" },
  //   {
  //     id: "fx",
  //     firstName: "François-Xavier",
  //     email: "francois-xavier.idee@aops.fr",
  //   },
  //   { id: "maxime", firstName: "Maxime", email: "maxime.genet@aops.fr" },
  //   {
  //     id: "charlotte",
  //     firstName: "Charlotte",
  //     email: "charlotte.cotier@aops.fr",
  //   },
  //   { id: "anna", firstName: "Anna-Louisa", email: "anna-louisa.marin@aops.fr" },
  //   { id: "florence", firstName: "Florence", email: "florence.cirou@aops.fr" },
  //   { id: "sebastien", firstName: "Sébastien", email: "sebastien.nouet@aops.fr" },
  //   { id: "eliot", firstName: "Eliot", email: "eliot.burgun@aops.fr" },
  //   { id: "sylvain", firstName: "Sylvain", email: "sylvain.rousseau@aops.fr" },
];

// // Seed fixe (tu peux le mettre en dur, ou venir d'une env var)
// const SEED = Number(process.env.NEXT_PUBLIC_ADVENT_SEED ?? 20251201);

// // On crée un random déterministe
// const rng = createSeededRandom(SEED);

// // Et on l’injecte dans le générateur
// export const dailyAssignments = generateMonthAssignmentsWithJokers(
//   participants,
//   2025,
//   12,
//   rng
// );
// On décrit la forme brute du JSON
type AdventJsonItem = {
  date: string;
  giverId: string;
  receiverId: string;
  joker?: string; // dans le fichier, c'est une string simple
};

// On caste le JSON dans ce type intermédiaire
const adventRaw = advent as AdventJsonItem[];

// Et on le remappe proprement vers DailyAssignment
export const dailyAssignments: DailyAssignment[] = adventRaw.map((item) => ({
  date: item.date,
  giverId: item.giverId,
  receiverId: item.receiverId,
  joker: item.joker as JokerType | undefined,
}));

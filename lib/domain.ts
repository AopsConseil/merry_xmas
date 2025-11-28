// lib/domain.ts

export type JokerType =
  | "VOL"
  | "PARTAGE"
  | "GENTILLESSE"
  | "MYSTERE"
  | "COMMUN";

export type Participant = {
  id: string;
  firstName: string;
  email?: string;
};

export type DailyAssignment = {
  date: string; // '2025-12-01'
  giverId: string; // la personne qui donne
  receiverId: string; // la personne qui reçoit
  joker?: JokerType; // éventuellement
};

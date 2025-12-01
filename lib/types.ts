import type { JokerType } from "./domain";

export const jokerStyles: Record<
  JokerType,
  { label: string; description: string; color: string }
> = {
  VOL: {
    label: "JOKER PERE FOUETTARD",
    description: "Tu gardes ton chocolat pour toi 😈",
    color: "bg-rose-900/60 text-rose-100 border-rose-500/60",
  },
  PARTAGE: {
    label: "JOKER PARTAGE",
    description: "Vous mangez le chocolat ensemble 🍫",
    color: "bg-amber-900/60 text-amber-100 border-amber-500/60",
  },
  GENTILLESSE: {
    label: "JOKER GENTILLESSE",
    description: "Tu dois ajouter un mot gentil 💬",
    color: "bg-emerald-900/60 text-emerald-100 border-emerald-500/60",
  },
  MYSTERE: {
    label: "JOKER MYSTÈRE",
    description: "Tu dois déposer le chocolat en secret 🕵️‍♀️",
    color: "bg-indigo-900/60 text-indigo-100 border-indigo-500/60",
  },
  COMMUN: {
    label: "CHOCOLAT COLLECTIF",
    description: "Tout le monde partage le chocolat aujourd’hui 🎉",
    color: "bg-sky-900/60 text-sky-100 border-sky-500/60",
  },
};

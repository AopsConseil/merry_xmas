// lib/messages.ts
import type { DailyAssignment, Participant, JokerType } from "./domain";

function findParticipant(
  participants: Participant[],
  id: string
): Participant | undefined {
  return participants.find((p) => p.id === id);
}

export type DailyMessage = {
  title: string;
  subtitle?: string;
  details?: string;
};

function buildMessageForJoker(
  joker: JokerType,
  giverName: string,
  receiverName: string
): DailyMessage {
  switch (joker) {
    case "VOL":
      return {
        title: `Aujourd’hui tu aurais dû donner un chocolat à ${receiverName},`,
        subtitle: `mais tu as un JOKER VOL 😈`,
        details: `👉 C’est toi qui manges ton chocolat aujourd’hui 😈`,
      };
    case "PARTAGE":
      return {
        title: `Aujourd’hui tu aurais dû donner ton chocolat à ${receiverName},`,
        subtitle: `mais tu as un JOKER PARTAGE 🍫`,
        details: `👉 Vous mangez le chocolat ensemble (moitié-moitié… ou comme vous voulez 😏)`,
      };
    case "GENTILLESSE":
      return {
        title: `Aujourd’hui, tu donnes ton chocolat à ${receiverName} comme prévu 🍫`,
        subtitle: `💌 JOKER GENTILLESSE`,
        details: `👉 Tu dois l’accompagner d’un mot gentil (post-it, mail, Slack, comme tu veux 💬)`,
      };
    case "MYSTERE":
      return {
        title: `Aujourd’hui, tu dois déposer ton chocolat en cachette sur le bureau de ${receiverName} 🕵️‍♀️`,
        subtitle: `🕵️‍♀️ JOKER MYSTÈRE`,
        details: `👉 Essaye qu’elle ne te voie pas !`,
      };
    default:
      // Cas de secours : joker inconnu / non géré
      return {
        title: "Joker inconnu",
        details: "Aucun message n’est défini pour ce type de Joker.",
      };
  }
}

export function buildDailyMessage(
  assignment: DailyAssignment,
  participants: Participant[]
): DailyMessage | null {
  const giver = findParticipant(participants, assignment.giverId);
  const receiver = findParticipant(participants, assignment.receiverId);

  if (!giver || !receiver) return null;

  // Pas de joker → message standard
  if (!assignment.joker) {
    return {
      title: `Aujourd’hui, tu donnes ton chocolat à ${receiver.firstName} 🍫`,
      details: `Pas de joker pour toi aujourd’hui… mais le sourire de ${receiver.firstName}, c’est déjà un cadeau 😇`,
    };
  }

  return buildMessageForJoker(
    assignment.joker,
    giver.firstName,
    receiver.firstName
  );
}

// Message spécial "Chocolat collectif"
export function buildCollectiveMessage(): DailyMessage {
  return {
    title: "Aujourd’hui : Journée Chocolat Collectif 🎉",
    details:
      "Tout le monde ramène / partage quelque chose… et tout le monde se sert !",
  };
}

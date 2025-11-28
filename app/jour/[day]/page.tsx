// app/jour/[day]/page.tsx

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Common/Logo";
import { participants, dailyAssignments } from "@/lib/data";
import type { Participant, JokerType } from "@/lib/domain";
import { buildCollectiveMessage, buildDailyMessage } from "@/lib/messages";
import { jokerStyles } from "@/lib/types";

type JourPageParams = {
  day: string;
};

// Mapping optionnel pour prévoir de vraies photos
// (tu pourras remplir ces chemins quand tu auras les fichiers dans /public)
const participantPhotos: Partial<Record<string, string>> = {
  // ivan: "/photos/ivan.jpg",
  // vincent: "/photos/vincent.jpg",
};

const jokerIcons: Record<JokerType, string> = {
  VOL: "😈",
  PARTAGE: "🍫",
  GENTILLESSE: "💌",
  MYSTERE: "🕵️‍♀️",
  COMMUN: "🎉",
};

function ParticipantCell({ participantId }: { participantId: string }) {
  const participant: Participant | undefined = participants.find(
    (p) => p.id === participantId
  );
  const name = participant?.firstName ?? participantId;
  const photo = participant ? participantPhotos[participant.id] : undefined;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {photo ? (
        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-600 bg-slate-800">
          <Image
            src={photo}
            alt={name}
            fill
            className="object-cover"
            sizes="32px"
          />
        </div>
      ) : (
        <div className="h-8 w-8 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-100">
          {initial}
        </div>
      )}
      <span className="font-medium text-slate-100">{name}</span>
    </div>
  );
}

export default async function JourPage({
  params,
}: {
  params: Promise<JourPageParams>;
}) {
  const { day } = await params;
  const dayNumber = Number(day);

  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 24) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center space-y-3">
          <p className="text-sm text-slate-300">
            Jour invalide. Le calendrier va de 1 à 24 🎄
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400 transition-colors"
          >
            ← Retour au calendrier
          </Link>
        </div>
      </main>
    );
  }

  // Pour tester en décembre :
  // const now = new Date();
  const now = new Date(new Date().getFullYear(), 11, 3); // 3 décembre (test)
  const year = now.getFullYear(); // même année que celle utilisée pour générer dailyAssignments
  const dateObj = new Date(year, 11, dayNumber); // 11 = décembre
  const dateKey = `${year}-12-${String(dayNumber).padStart(2, "0")}`;
  const isFuture = dateObj > now;
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  const dateLabel = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const assignmentsForDay = dailyAssignments.filter((a) => a.date === dateKey);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-4xl w-full space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-amber-300 transition-colors"
          >
            <span className="text-lg">←</span>
            Retour au calendrier
          </Link>

          <Logo width={70} height={55} />
        </div>

        <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-2xl p-6 sm:p-8 space-y-4">
          {/* Titre + date */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Jour {dayNumber} • Décembre {year}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-100">
                {dateLabel}
              </h1>
            </div>

            {isFuture && (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 border border-slate-600">
                🔒 Ce jour n&apos;est pas encore débloqué
              </span>
            )}
          </div>

          {/* Contenu principal selon le cas */}
          {isFuture ? (
            <p className="mt-4 text-sm text-slate-400">
              Reviens le jour J pour découvrir qui donne du chocolat à qui… et
              quels Jokers s&apos;activent 😈
            </p>
          ) : isWeekend ? (
            (() => {
              const msg = buildCollectiveMessage();
              return (
                <div className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4 sm:p-5 text-sm space-y-2">
                  <p className="text-base font-semibold text-amber-100">
                    {msg.title}
                  </p>
                  {msg.details && (
                    <p className="text-amber-50/90">{msg.details}</p>
                  )}
                  <p className="text-xs text-amber-100/70">
                    Pas de Jokers individuels aujourd&apos;hui : tout le monde
                    partage 🎉
                  </p>
                </div>
              );
            })()
          ) : assignmentsForDay.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Aucun échange de chocolat n&apos;est configuré pour ce jour.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                Voici la liste des{" "}
                <span className="font-semibold text-amber-200">
                  donneurs & receveurs
                </span>{" "}
                pour ce jour, avec les Jokers et le{" "}
                <span className="font-semibold text-amber-200">
                  message du jour
                </span>{" "}
                pour chacun.
              </p>

              {/* Tableau donneurs / receveurs / jokers / message */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800/80">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">
                        Donneur
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Receveur
                      </th>
                      <th className="px-4 py-2 text-left font-medium">Joker</th>
                      <th className="px-4 py-2 text-left font-medium">
                        Message du jour
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                    {assignmentsForDay.map((a, idx) => {
                      const joker = a.joker as JokerType | undefined;
                      const jokerInfo = joker
                        ? jokerStyles[joker as JokerType]
                        : undefined;

                      const msg = buildDailyMessage(a, participants);

                      return (
                        <tr key={`${a.giverId}-${a.receiverId}-${idx}`}>
                          <td className="px-4 py-2 align-top">
                            <ParticipantCell participantId={a.giverId} />
                          </td>
                          <td className="px-4 py-2 align-top">
                            <ParticipantCell participantId={a.receiverId} />
                          </td>
                          <td className="px-4 py-2 align-top">
                            {jokerInfo && joker ? (
                              <div
                                className={[
                                  "inline-flex whitespace-nowrap items-start gap-2 rounded-2xl border px-3 py-2 text-xs sm:text-[0.8rem]",
                                  jokerInfo.color,
                                ].join(" ")}
                              >
                                <span className="text-base">
                                  {jokerIcons[joker]}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold uppercase tracking-wide">
                                    {jokerInfo.label}
                                  </span>
                                  <span className="text-[0.7rem] text-slate-100/90">
                                    {jokerInfo.description}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Aucun joker (échange classique)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 align-top">
                            {msg ? (
                              <div className="text-xs sm:text-[0.8rem] space-y-1">
                                <p className="font-medium text-slate-50">
                                  {msg.title}
                                </p>
                                {msg.subtitle && (
                                  <p className="text-amber-200">
                                    {msg.subtitle}
                                  </p>
                                )}
                                {msg.details && (
                                  <p className="text-slate-300">
                                    {msg.details}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Message non disponible
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

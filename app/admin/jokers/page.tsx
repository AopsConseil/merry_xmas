// app/admin/jokers/page.tsx

import Link from "next/link";
import Logo from "@/components/Common/Logo";

import { dailyAssignments, participants } from "@/lib/data";
import type { DailyAssignment, JokerType, Participant } from "@/lib/domain";
import { jokerStyles } from "@/lib/types";

const WEEK_JOKERS: JokerType[] = ["VOL", "PARTAGE", "GENTILLESSE", "MYSTERE"];

/**
 * Récupère le prénom depuis la liste des participants
 */
function getFirstName(id: string, list: Participant[]): string {
  return list.find((p) => p.id === id)?.firstName ?? id;
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

type WeekGroup = {
  weekKey: string;
  assignments: DailyAssignment[];
};

function groupByWeek(assignments: DailyAssignment[]): WeekGroup[] {
  const map = new Map<string, DailyAssignment[]>();

  for (const a of assignments) {
    const weekKey = getWeekKey(a.date);
    const group = map.get(weekKey) ?? [];
    group.push(a);
    map.set(weekKey, group);
  }

  const result: WeekGroup[] = [];
  for (const [weekKey, group] of map.entries()) {
    group.sort((a, b) => a.date.localeCompare(b.date));
    result.push({ weekKey, assignments: group });
  }

  result.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  return result;
}

type JokerBuckets = Record<JokerType, DailyAssignment[]>;

function makeEmptyBuckets(): JokerBuckets {
  return {
    VOL: [],
    PARTAGE: [],
    GENTILLESSE: [],
    MYSTERE: [],
    COMMUN: [],
  };
}

export default function JokersAdminPage() {
  // 🔹 On lit directement la constante
  const weeks = groupByWeek(dailyAssignments);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-amber-300 transition-colors"
          >
            <span className="text-lg">←</span>
            Retour au calendrier
          </Link>

          <div className="flex items-center gap-3">
            <Logo width={70} height={55} />
            <span className="text-sm text-slate-300">
              Vue admin • Répartition des Jokers
            </span>
          </div>
        </div>

        {weeks.map((week) => {
          const [year, month, day] = week.weekKey.split("-");
          const mondayDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
          );
          const weekLabel = mondayDate.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          });

          // Récap nb de jokers par type (tous rôles confondus)
          const summary: Record<string, number> = {};
          for (const a of week.assignments) {
            if (!a.joker) continue;
            summary[a.joker] = (summary[a.joker] ?? 0) + 1;
          }

          // Vue par personne (en tant que receveur)
          const perPerson: Record<string, JokerBuckets> = {};
          for (const a of week.assignments) {
            if (!a.joker) continue;
            const joker = a.joker as JokerType;
            if (!WEEK_JOKERS.includes(joker)) continue;

            const pid = a.receiverId;
            if (!perPerson[pid]) {
              perPerson[pid] = makeEmptyBuckets();
            }
            perPerson[pid][joker].push(a);
          }

          const perPersonEntries = Object.entries(perPerson).sort(
            ([idA], [idB]) => {
              const nameA = getFirstName(idA, participants).toLowerCase();
              const nameB = getFirstName(idB, participants).toLowerCase();
              return nameA.localeCompare(nameB);
            }
          );

          return (
            <section
              key={week.weekKey}
              className="rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-xl p-5 sm:p-6 space-y-5"
            >
              {/* En-tête semaine + résumé jokers */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Semaine du
                  </p>
                  <h2 className="text-lg sm:text-xl font-semibold text-amber-100">
                    {weekLabel} (lundi) – clé {week.weekKey}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2 text-[0.7rem]">
                  {Object.entries(summary).map(([type, count]) => {
                    const info = jokerStyles[type as JokerType];
                    return (
                      <span
                        key={type}
                        className={[
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1",
                          info?.color ?? "bg-slate-800 border-slate-600",
                        ].join(" ")}
                      >
                        <span className="font-semibold uppercase">
                          {info?.label ?? type}
                        </span>
                        <span className="text-slate-100/80">× {count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Tableau détaillé jour par jour */}
              <div className="overflow-hidden rounded-2xl border border-slate-800/80">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Donneur
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Receveur
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Joker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                    {week.assignments.map((a, idx) => {
                      const dateObj = new Date(a.date + "T00:00:00");
                      const dateLabel = dateObj.toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      });

                      const giverName = getFirstName(a.giverId, participants);
                      const receiverName = getFirstName(
                        a.receiverId,
                        participants
                      );

                      const joker = a.joker as JokerType | undefined;
                      const info = joker ? jokerStyles[joker] : undefined;

                      return (
                        <tr
                          key={`${a.date}-${a.giverId}-${a.receiverId}-${idx}`}
                        >
                          <td className="px-3 py-2 align-top text-slate-200">
                            {dateLabel}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="font-medium text-slate-100">
                              {giverName}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="font-medium text-slate-100">
                              {receiverName}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            {info ? (
                              <span
                                className={[
                                  "inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide",
                                  info.color,
                                ].join(" ")}
                              >
                                {info.label}
                              </span>
                            ) : a.joker ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-3 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-100">
                                {a.joker}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Aucun joker
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vue par personne (en tant que receveur) */}
              {perPersonEntries.length > 0 && (
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 sm:p-4 space-y-2">
                  <p className="text-xs text-slate-300 mb-1">
                    Vue par personne (en tant que receveur) – vérification des
                    Jokers par semaine (pas 2 fois le même type, au moins 1
                    joker si possible).
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs sm:text-[0.8rem]">
                      <thead className="bg-slate-900/80 text-slate-300">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Participant
                          </th>
                          {WEEK_JOKERS.map((j) => {
                            const info = jokerStyles[j];
                            return (
                              <th
                                key={j}
                                className="px-3 py-2 text-left font-medium"
                              >
                                {info?.label ?? j}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {perPersonEntries.map(([pid, buckets]) => {
                          const name = getFirstName(pid, participants);

                          return (
                            <tr key={pid}>
                              <td className="px-3 py-2 text-slate-100">
                                {name}
                              </td>
                              {WEEK_JOKERS.map((j) => {
                                const list = buckets[j];
                                if (!list || list.length === 0) {
                                  return (
                                    <td
                                      key={j}
                                      className="px-3 py-2 text-slate-500"
                                    >
                                      —
                                    </td>
                                  );
                                }

                                const isProblem = list.length > 1;

                                const dates = list
                                  .map((a) =>
                                    new Date(
                                      a.date + "T00:00:00"
                                    ).toLocaleDateString("fr-FR", {
                                      weekday: "short",
                                      day: "2-digit",
                                    })
                                  )
                                  .join(", ");

                                const info = jokerStyles[j];

                                return (
                                  <td key={j} className="px-3 py-2">
                                    <div
                                      className={[
                                        "inline-flex flex-col rounded-xl border px-2 py-1",
                                        info?.color ??
                                          "bg-slate-800/80 border-slate-600",
                                        isProblem
                                          ? "border-rose-500/70 ring-1 ring-rose-500/60"
                                          : "",
                                      ].join(" ")}
                                    >
                                      <span className="font-semibold uppercase tracking-wide text-[0.65rem]">
                                        {info?.label ?? j} × {list.length}
                                      </span>
                                      <span className="text-[0.65rem] text-slate-100/90">
                                        {dates}
                                      </span>
                                      {isProblem && (
                                        <span className="mt-0.5 text-[0.6rem] text-rose-200">
                                          ⚠ Règle violée : même joker &gt; 1
                                          fois cette semaine pour ce receveur.
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {weeks.length === 0 && (
          <p className="text-sm text-slate-400">
            Aucun dailyAssignment n&apos;est défini pour l&apos;instant.
          </p>
        )}
      </div>
    </main>
  );
}

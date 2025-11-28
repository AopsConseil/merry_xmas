// app/admin/jokers/page.tsx

import Link from "next/link";
import Logo from "@/components/Common/Logo";
import { dailyAssignments, participants } from "@/lib/data";
import type { DailyAssignment, JokerType, Participant } from "@/lib/domain";

const jokerStyles: Partial<
  Record<JokerType, { label: string; color: string }>
> = {
  VOL: {
    label: "VOL",
    color: "bg-rose-900/60 text-rose-100 border-rose-500/60",
  },
  PARTAGE: {
    label: "PARTAGE",
    color: "bg-amber-900/60 text-amber-100 border-amber-500/60",
  },
  GENTILLESSE: {
    label: "GENTILLESSE",
    color: "bg-emerald-900/60 text-emerald-100 border-emerald-500/60",
  },
  MYSTERE: {
    label: "MYSTÈRE",
    color: "bg-indigo-900/60 text-indigo-100 border-indigo-500/60",
  },
};

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
    // const dateObj = new Date(a.date + "T00:00:00");
    // const day = dateObj.getDay();

    // On veut voir aussi les week-ends dans la vue admin, donc on ne filtre pas ici
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

  // trier par semaine
  result.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  return result;
}

export default function JokersAdminPage() {
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

          // petit récap nb de jokers par type
          const summary: Record<string, number> = {};
          for (const a of week.assignments) {
            if (!a.joker) continue;
            summary[a.joker] = (summary[a.joker] ?? 0) + 1;
          }

          return (
            <section
              key={week.weekKey}
              className="rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-xl p-5 sm:p-6 space-y-4"
            >
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
                      const info = joker && jokerStyles[joker];

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

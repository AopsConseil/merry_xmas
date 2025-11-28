// app/page.tsx

import Link from "next/link";
import Logo from "@/components/Common/Logo";
import { Snow } from "@/components/Common/Snow";
import { ChristmasPlayer } from "@/components/Common/ChristmasPlayer";

const adventDays = Array.from({ length: 24 }, (_, i) => i + 1);
const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekdayForDecemberDay(day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const date = new Date(year, 11, day); // 11 = décembre (0-based)
  const jsDay = date.getDay(); // 0 = Dim, 6 = Sam
  const mondayIndex = (jsDay + 6) % 7; // 0 = Lun, 6 = Dim
  return weekdayLabels[mondayIndex];
}

export default function HomePage() {
  // Pour tester le déblocage : 3 décembre forcé
  // const now = new Date(new Date().getFullYear(), 11, 3);

  const now = new Date();
  const year = now.getFullYear();
  const isDecember = now.getMonth() === 11;
  const todayDate = now.getDate();

  return (
    <main className="relative min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Neige */}
      <Snow />

      <div className="max-w-400 w-full space-y-10 relative z-10">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-200">
            🎄 Calendrier de l&apos;Avent • Jeu Chocolat
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Chaque jour, un chocolat…
            <span className="text-amber-400"> et parfois un Joker 😈</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Clique sur un jour pour découvrir à qui tu dois donner ton chocolat,
            ou si tu as droit à un Joker VOL, PARTAGE, GENTILLESSE ou MYSTÈRE.
          </p>
          <p className="text-[0.75rem] text-slate-400">
            Les cases se débloquent jour par jour : les jours futurs restent
            verrouillés.
          </p>

          {/* Musique de Noël (random côté client) */}
          <div className="mt-3 flex justify-center">
            <ChristmasPlayer />
          </div>
        </header>

        {/* Calendrier + panneau latéral (4/5 - 1/5) */}
        <section className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Calendrier = 4/5 */}
          <div className="w-full lg:w-4/5 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-2xl shadow-amber-500/10 p-6 sm:p-8 backdrop-blur">
            {/* En-tête mois */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <Logo width={80} height={63} />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Décembre
                </p>
                <p className="text-xl font-semibold text-amber-100">
                  Calendrier d&apos;Avent {year}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-800/80 px-4 py-2 text-right text-xs">
                <p className="text-slate-400">Aujourd&apos;hui</p>
                <p className="font-medium text-amber-200">
                  {now.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
            </div>

            {/* Labels jours de semaine */}
            <div className="grid grid-cols-7 mb-2 text-[0.7rem] sm:text-xs font-medium text-slate-400 gap-2">
              {weekdayLabels.map((label) => (
                <div key={label} className="text-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {adventDays.map((day) => {
                const weekday = getWeekdayForDecemberDay(day);
                const isToday = isDecember && day === todayDate;
                const isUnlocked = isDecember && day <= todayDate;
                const date = new Date(year, 11, day);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Dimanche ou samedi

                const subtitle = isWeekend
                  ? "Chocolat collectif 🎉"
                  : isUnlocked
                  ? "Surprises & Jokers"
                  : "Bientôt 🎁";

                return (
                  <Link
                    key={day}
                    href={isUnlocked ? `/jour/${day}` : "#"}
                    aria-disabled={!isUnlocked}
                    className={[
                      "relative aspect-square rounded-2xl border text-left p-1.5 sm:p-2 flex flex-col justify-between overflow-hidden group transition-transform duration-150",
                      isUnlocked
                        ? isToday
                          ? "border-amber-400/80 bg-amber-500/15 shadow-lg shadow-amber-500/30 scale-[1.02] cursor-pointer"
                          : "border-slate-800 bg-slate-900/60 hover:border-amber-400/60 hover:bg-slate-900 cursor-pointer"
                        : "border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed",
                    ].join(" ")}
                  >
                    {/* Halo de fond */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" />
                    </div>

                    {/* Numéro du jour + weekday */}
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-slate-400">{weekday}</span>
                      {isToday && (
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/60">
                          Aujourd&apos;hui
                        </span>
                      )}
                    </div>

                    {/* Centre de la case */}
                    <div className="flex flex-col items-start justify-center flex-1">
                      <span className="text-xl sm:text-2xl font-semibold text-amber-100">
                        {day}
                      </span>
                      <span className="text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        Voir le détail →
                      </span>
                      <span className="mt-1 text-[0.7rem] sm:text-xs text-slate-400">
                        {subtitle}
                      </span>
                    </div>

                    {/* Bulle bas */}
                    <div className="flex items-center whitespace-nowrap justify-between text-[0.65rem] sm:text-[0.7rem] text-slate-300">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Disponible
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Verrouillé
                          </span>
                          <span className="text-slate-500">Patience…</span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Panneau latéral = 1/5 */}
          <aside className="w-full lg:w-1/5 space-y-4">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 sm:p-6 shadow-lg shadow-slate-900/50">
              <h2 className="text-lg font-semibold mb-3">
                Comment ça marche ? 🍫
              </h2>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li>
                  • Chaque jour, quelqu&apos;un doit donner un chocolat à
                  quelqu&apos;un d&apos;autre.
                </li>
                <li>
                  • Certains jours, un{" "}
                  <span className="font-medium">Joker</span> s&apos;active :
                  VOL, PARTAGE, GENTILLESSE ou MYSTÈRE.
                </li>
                <li>
                  • Le site affichera un message personnalisé :
                  <br />
                  <span className="text-amber-200 italic">
                    “Aujourd&apos;hui tu aurais dû donner un chocolat à Vincent,
                    mais tu as un JOKER VOL…😈”
                  </span>
                </li>
                <li>
                  • Le samedi et le dimanche : journée Chocolat collectif.{" "}
                  <span className="font-medium">
                    Les chocolats doivent être déposés dans un pot commun le
                    vendredi, à partager en équipe !
                  </span>{" "}
                  🎉
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 p-4 sm:p-5 shadow-lg shadow-slate-900/60 space-y-3 text-xs sm:text-sm">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <span>📎</span> Légende des Jokers
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-base">😈</span>
                  <p>
                    <span className="font-semibold text-rose-200">
                      Joker VOL
                    </span>{" "}
                    : tu gardes ton chocolat pour toi.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🍫</span>
                  <p>
                    <span className="font-semibold text-amber-200">
                      Joker PARTAGE
                    </span>{" "}
                    : vous mangez le chocolat ensemble.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">💌</span>
                  <p>
                    <span className="font-semibold text-emerald-200">
                      Joker GENTILLESSE
                    </span>{" "}
                    : tu dois ajouter un petit mot gentil.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🕵️‍♀️</span>
                  <p>
                    <span className="font-semibold text-indigo-200">
                      Joker MYSTÈRE
                    </span>{" "}
                    : tu déposes le chocolat en cachette.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🎉</span>
                  <p>
                    <span className="font-semibold text-amber-200">
                      Chocolat collectif
                    </span>{" "}
                    (week-end) : tout le monde ramène / se sert.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

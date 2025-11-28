// app/api/cron/daily-reminder/route.ts
import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { participants, dailyAssignments } from "@/lib/data";

export const runtime = "nodejs";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

function getDateFromRequest(request: Request): Date {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date"); // ex: "2025-12-03"
  const overrideSecret = url.searchParams.get("secret");

  // En dev, si ?date=YYYY-MM-DD est passé → on l'utilise
  if (
    process.env.NODE_ENV !== "production" &&
    dateParam &&
    overrideSecret === process.env.CRON_OVERRIDE_SECRET
  ) {
    return new Date(dateParam + "T12:00:00");
  }

  // Sinon : date réelle (UTC sur Vercel)
  return new Date();
}

function buildDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildEmailContent(params: {
  dateKey: string;
  dayOfMonth: number;
  isFriday: boolean;
  firstName?: string;
}) {
  const { dayOfMonth, isFriday, firstName } = params;
  const link = `${process.env.NEXTAUTH_URL}/jour/${dayOfMonth}`;

  const subjectBase = `Calendrier Chocolat – Jour ${dayOfMonth}`;
  const subject = isFriday
    ? `${subjectBase} – Pense au pot commun du week-end 🎉`
    : `${subjectBase} – Ta dose de chocolat t’attend 🍫`;

  const greeting = firstName ? `Bonjour ${firstName} 👋,` : "Bonjour 👋,";

  const intro = isFriday
    ? `On arrive à la fin de la semaine, et le chocolat du week-end se prépare…`
    : `Une nouvelle journée, un nouveau chocolat à offrir (ou à jouer avec un Joker 😈)…`;

  const weekendExtra = isFriday
    ? `<p style="margin:8px 0 0 0;">
         🔔 <strong>Petit rappel :</strong> le week-end, c'est
         <strong>chocolat en pot commun</strong> — n'oublie pas :) ! 🎉
       </p>`
    : "";

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
      <p>${greeting}</p>
      <p>${intro}</p>
      <p>
        👉 Clique ici pour voir le détail du jour :
        <br />
        <a href="${link}" style="color:#f97316;font-weight:600;text-decoration:none;">
          Voir le jour ${dayOfMonth} du calendrier
        </a>
      </p>
      ${weekendExtra}
      <p style="margin-top:16px;font-size:12px;color:#64748b;">
        (Astuce : tu peux garder ce mail pour retrouver le lien du jour facilement.)
      </p>
      <p style="margin-top:12px;font-size:11px;color:#94a3b8;">
        Calendrier de l'avent Chocolat - AOPS 🎄🍫
      </p>
    </div>
  `;

  return { subject, html };
}

export async function GET(request: Request) {
  try {
    const now = getDateFromRequest(request);
    const month = now.getMonth(); // 0–11
    const dayOfMonth = now.getDate();
    const weekDay = now.getDay(); // 0 = dim, 5 = ven

    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dryRun") === "1";

    // Période de l'Avent uniquement : 1–24 décembre
    if (!(month === 11 && dayOfMonth >= 1 && dayOfMonth <= 24)) {
      return NextResponse.json(
        { status: "skipped", reason: "hors période d'Avent" },
        { status: 200 }
      );
    }

    // Lundi–vendredi seulement
    if (weekDay === 0 || weekDay === 6) {
      return NextResponse.json(
        { status: "skipped", reason: "week-end" },
        { status: 200 }
      );
    }

    const dateKey = buildDateKey(now);
    const isFriday = weekDay === 5;

    const hasAssignments = dailyAssignments.some((a) => a.date === dateKey);
    if (!hasAssignments) {
      return NextResponse.json(
        { status: "skipped", reason: `aucune assignation pour ${dateKey}` },
        { status: 200 }
      );
    }

    // 👉 en dev tu peux limiter à ton mail / un petit sous-ensemble
    const recipients =
      process.env.NODE_ENV !== "production"
        ? participants.filter((p) => p.email === "ivan.lilla@aops.fr")
        : participants;

    const messages = recipients
      .filter((p) => !!p.email)
      .map((p) => {
        const { subject, html } = buildEmailContent({
          dateKey,
          dayOfMonth,
          isFriday,
          firstName: p.firstName,
        });

        return {
          to: p.email,
          from: process.env.SENDGRID_FROM_EMAIL!,
          subject,
          html,
        };
      });

    if (messages.length === 0) {
      return NextResponse.json(
        { status: "skipped", reason: "aucun participant avec email" },
        { status: 200 }
      );
    }

    if (dryRun) {
      console.log("[DRY RUN] Emails qui seraient envoyés :", messages);
      return NextResponse.json(
        {
          status: "dry-run",
          dateKey,
          subject: messages[0]?.subject ?? "(inconnu)",
          count: messages.length,
          to: messages.map((m) => m.to),
        },
        { status: 200 }
      );
    }

    await sgMail.send(messages);

    return NextResponse.json(
      {
        status: "sent",
        dateKey,
        subject: messages[0]?.subject ?? "(inconnu)",
        count: messages.length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur envoi daily reminder:", err);
    return NextResponse.json(
      { status: "error", error: "sendgrid_error" },
      { status: 500 }
    );
  }
}

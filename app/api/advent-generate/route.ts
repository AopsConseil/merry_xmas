// app/api/advent-generate/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import type { DailyAssignment } from "@/lib/domain";
import { regenerateAdventAssignments } from "@/lib/adventStorage";

const ADVENT_YEAR = 2025;
const KV_KEY = `advent:${ADVENT_YEAR}`;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const existing = await kv.get<DailyAssignment[]>(KV_KEY);

    // Si déjà généré, on ne touche à rien → idempotent
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({
        ok: true,
        alreadyGenerated: true,
        count: existing.length,
      });
    }

    const generated = await regenerateAdventAssignments();

    return NextResponse.json({
      ok: true,
      alreadyGenerated: false,
      count: generated.length,
    });
  } catch (error) {
    console.error("Error in /api/advent-generate:", error);
    return NextResponse.json(
      { ok: false, error: "Generation failed" },
      { status: 500 }
    );
  }
}

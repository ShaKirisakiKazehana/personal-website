import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  readStore,
  writeStore,
  getOrCreateUser,
  topLeaderboard,
  updateBestScore,
  type GameKey,
} from "./store";

export const dynamic = "force-dynamic";

function parseGame(u: URL): GameKey | null {
  const g = (u.searchParams.get("game") || "").toLowerCase();
  if (g === "tetris" || g === "brickbreaker") return g as GameKey;
  return null;
}

// GET /api/scoreboard?game=tetris|brickbreaker
export async function GET(req: Request) {
  const url = new URL(req.url);
  const game = parseGame(url);
  if (!game) {
    return NextResponse.json({ error: "Missing/invalid game. Use ?game=tetris|brickbreaker" }, { status: 400 });
  }

  const store = await readStore();

  const cookieJar = await cookies();
  const uidCookie = cookieJar.get("arcade_uid")?.value;

  const { store: nextStore, user, uid, isNew } = getOrCreateUser(store, uidCookie);

  if (isNew) await writeStore(nextStore);

  const res = NextResponse.json({
    game,
    user: { id: uid, name: user.name, best: user.best[game] ?? 0 },
    leaderboard: topLeaderboard(nextStore, game, 10),
  });

  if (!uidCookie || uidCookie !== uid) {
    res.cookies.set("arcade_uid", uid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}

// POST /api/scoreboard?game=tetris|brickbreaker  body: { score: number }
export async function POST(req: Request) {
  const url = new URL(req.url);
  const game = parseGame(url);
  if (!game) {
    return NextResponse.json({ error: "Missing/invalid game. Use ?game=tetris|brickbreaker" }, { status: 400 });
  }

  const cookieJar = await cookies();
  const uid = cookieJar.get("arcade_uid")?.value;
  if (!uid) {
    return NextResponse.json({ error: "No user assigned yet. Call GET /api/scoreboard first." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const score = typeof (body as any)?.score === "number" ? Math.floor((body as any).score) : NaN;
  if (!Number.isFinite(score) || score < 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const store = await readStore();
  const updated = updateBestScore(store, uid, game, score);
  await writeStore(updated);

  return NextResponse.json({
    ok: true,
    game,
    leaderboard: topLeaderboard(updated, game, 10),
  });
}

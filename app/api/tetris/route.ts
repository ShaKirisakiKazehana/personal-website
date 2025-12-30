import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readStore, writeStore, getOrCreateUser, topLeaderboard, updateBestScore } from "./store";

export const dynamic = "force-dynamic"; // 避免缓存

export async function GET() {
  const store = await readStore();

  const cookieJar = await cookies();
  const uidCookie = cookieJar.get("tetris_uid")?.value;

  const { store: nextStore, user, uid, isNew } = getOrCreateUser(store, uidCookie);

  if (isNew) {
    await writeStore(nextStore);
  }

  const res = NextResponse.json({
    user: { id: uid, name: user.name, best: user.best },
    leaderboard: topLeaderboard(nextStore, 10),
  });

  // 没有 cookie 才 set
  if (!uidCookie || uidCookie !== uid) {
    res.cookies.set("tetris_uid", uid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}

export async function POST(req: Request) {
  const cookieJar = await cookies();
  const uid = cookieJar.get("tetris_uid")?.value;

  if (!uid) {
    return NextResponse.json({ error: "No user assigned yet. Call GET /api/tetris first." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const score = typeof body?.score === "number" ? Math.floor(body.score) : NaN;

  if (!Number.isFinite(score) || score < 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const store = await readStore();
  const updated = updateBestScore(store, uid, score);
  await writeStore(updated);

  return NextResponse.json({
    ok: true,
    leaderboard: topLeaderboard(updated, 10),
  });
}

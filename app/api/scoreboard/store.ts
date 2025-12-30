import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export type GameKey = "tetris" | "brickbreaker";

type UserRec = { name: string; best: Record<GameKey, number> };

type Store = {
  users: Record<string, UserRec>;
  nextUserNum: number; // global user1, user2... across the whole arcade
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "arcade_scoreboard.json");

const defaultStore = (): Store => ({
  users: {},
  nextUserNum: 1,
});

export async function readStore(): Promise<Store> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(txt);
    if (!parsed?.users || typeof parsed?.nextUserNum !== "number") return defaultStore();
    return parsed as Store;
  } catch {
    return defaultStore();
  }
}

export async function writeStore(store: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export function getOrCreateUser(store: Store, uidCookie?: string) {
  let uid = uidCookie;
  let isNew = false;

  if (!uid || !store.users[uid]) {
    uid = crypto.randomUUID();
    const name = `user${store.nextUserNum}`;
    store = {
      ...store,
      nextUserNum: store.nextUserNum + 1,
      users: {
        ...store.users,
        [uid]: { name, best: { tetris: 0, brickbreaker: 0 } },
      },
    };
    isNew = true;
  }

  return { store, uid, user: store.users[uid], isNew };
}

export function updateBestScore(store: Store, uid: string, game: GameKey, score: number): Store {
  const u = store.users[uid];
  if (!u) return store;

  const cur = u.best[game] ?? 0;
  if (score <= cur) return store;

  return {
    ...store,
    users: {
      ...store.users,
      [uid]: { ...u, best: { ...u.best, [game]: score } },
    },
  };
}

export function topLeaderboard(store: Store, game: GameKey, limit = 10) {
  return Object.values(store.users)
    .map((u) => ({ name: u.name, best: u.best[game] ?? 0 }))
    .sort((a, b) => b.best - a.best)
    .slice(0, limit);
}

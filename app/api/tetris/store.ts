import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

type UserRec = { name: string; best: number };
type Store = {
  users: Record<string, UserRec>;
  nextUserNum: number;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "tetris.json");

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
        [uid]: { name, best: 0 },
      },
    };
    isNew = true;
  }

  return { store, uid, user: store.users[uid], isNew };
}

export function updateBestScore(store: Store, uid: string, score: number): Store {
  const u = store.users[uid];
  if (!u) return store;

  if (score <= u.best) return store;

  return {
    ...store,
    users: {
      ...store.users,
      [uid]: { ...u, best: score },
    },
  };
}

export function topLeaderboard(store: Store, limit = 10) {
  return Object.values(store.users)
    .map((u) => ({ name: u.name, best: u.best }))
    .sort((a, b) => b.best - a.best)
    .slice(0, limit);
}

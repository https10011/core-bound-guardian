// Local SQLite data layer.
// On Android (Capacitor): uses @capacitor-community/sqlite native plugin.
// In the browser (dev preview): uses jeep-sqlite (sql.js + IndexedDB persistence).

import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

const DB_NAME = 'memora';
const DB_VERSION = 1;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  nickname TEXT DEFAULT '',
  birthday TEXT,
  anniversary TEXT,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  hobbies TEXT DEFAULT '[]',
  favorites TEXT DEFAULT '{}',
  lifestyle TEXT DEFAULT '',
  my_avatar_url TEXT DEFAULT '',
  my_name TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  memory_date TEXT,
  location TEXT DEFAULT '',
  mood TEXT DEFAULT '',
  photos TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'mine',
  cover_url TEXT DEFAULT '',
  photos TEXT DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_albums_user ON albums(user_id);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'personal',
  color TEXT DEFAULT 'pink',
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
`;

// JSON / boolean coercion helpers per table column.
export const TABLE_COLUMNS: Record<string, string[]> = {
  users: ['id', 'email', 'password_hash', 'created_at'],
  sessions: ['token', 'user_id', 'created_at', 'expires_at'],
  relationships: [
    'id', 'user_id', 'name', 'nickname', 'birthday', 'anniversary',
    'avatar_url', 'bio', 'hobbies', 'favorites', 'lifestyle',
    'my_avatar_url', 'my_name', 'created_at', 'updated_at',
  ],
  memories: [
    'id', 'user_id', 'title', 'description', 'memory_date', 'location',
    'mood', 'photos', 'tags', 'is_favorite', 'created_at', 'updated_at',
  ],
  albums: ['id', 'user_id', 'name', 'owner', 'cover_url', 'photos', 'created_at'],
  notes: [
    'id', 'user_id', 'title', 'content', 'category', 'color',
    'is_pinned', 'created_at', 'updated_at',
  ],
};

const JSON_COLUMNS: Record<string, string[]> = {
  relationships: ['hobbies', 'favorites'],
  memories: ['photos', 'tags'],
  albums: ['photos'],
};

const BOOL_COLUMNS: Record<string, string[]> = {
  memories: ['is_favorite'],
  notes: ['is_pinned'],
};

export function encodeRowForWrite(table: string, row: Record<string, any>) {
  const out: Record<string, any> = { ...row };
  for (const c of JSON_COLUMNS[table] ?? []) {
    if (out[c] !== undefined && typeof out[c] !== 'string') {
      out[c] = JSON.stringify(out[c] ?? (Array.isArray(out[c]) ? [] : {}));
    }
  }
  for (const c of BOOL_COLUMNS[table] ?? []) {
    if (out[c] !== undefined && typeof out[c] === 'boolean') {
      out[c] = out[c] ? 1 : 0;
    }
  }
  return out;
}

export function decodeRowAfterRead(table: string, row: Record<string, any> | null): any {
  if (!row) return row;
  const out: Record<string, any> = { ...row };
  for (const c of JSON_COLUMNS[table] ?? []) {
    if (typeof out[c] === 'string') {
      try { out[c] = JSON.parse(out[c]); } catch { out[c] = c === 'favorites' ? {} : []; }
    }
  }
  for (const c of BOOL_COLUMNS[table] ?? []) {
    if (out[c] !== undefined) out[c] = !!out[c];
  }
  return out;
}

type RunResult = { changes?: number };
type QueryResult = { values?: any[] };

export interface Db {
  run(sql: string, params?: any[]): Promise<RunResult>;
  query(sql: string, params?: any[]): Promise<QueryResult>;
  execute(sql: string): Promise<void>;
}

let dbPromise: Promise<Db> | null = null;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

async function initWeb(): Promise<Db> {
  // jeep-sqlite is a custom element backing the SQLite plugin on the web.
  await import('jeep-sqlite/loader').then((m: any) => m.defineCustomElements(window));
  const jeep = document.createElement('jeep-sqlite');
  document.body.appendChild(jeep);
  // Wait for the element to upgrade.
  await customElements.whenDefined('jeep-sqlite');
  await CapacitorSQLite.initWebStore();
  return openConnection();
}

async function openConnection(): Promise<Db> {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  let conn: SQLiteDBConnection;
  if (isConn) {
    conn = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    conn = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
  }
  await conn.open();
  await conn.execute(SCHEMA);
  if (!isNative()) {
    // Persist web store after schema bootstrap.
    await sqlite.saveToStore(DB_NAME).catch(() => {});
  }

  const adapter: Db = {
    async run(sql, params = []) {
      const r = await conn.run(sql, params, false);
      if (!isNative()) await sqlite.saveToStore(DB_NAME).catch(() => {});
      return { changes: r.changes?.changes ?? 0 };
    },
    async query(sql, params = []) {
      const r = await conn.query(sql, params);
      return { values: r.values ?? [] };
    },
    async execute(sql) {
      await conn.execute(sql);
      if (!isNative()) await sqlite.saveToStore(DB_NAME).catch(() => {});
    },
  };
  return adapter;
}

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = isNative() ? openConnection() : initWeb();
  }
  return dbPromise;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (very old WebViews)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}
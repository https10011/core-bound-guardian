// Supabase-compatible shim backed by local SQLite + bcryptjs.
// Preserves the exact call sites already used across the app:
//   supabase.from(table).select('*' | 'id' | 'name', { count?: 'exact' })
//     .eq(col, val).order(col, { ascending }).limit(n).maybeSingle()
//   supabase.from(table).insert(rowOrRows)
//   supabase.from(table).update(patch).eq(col, val)
//   supabase.from(table).delete().eq(col, val)
//   supabase.auth.getSession() | onAuthStateChange | signInWithPassword | signUp | signOut

import { Preferences } from '@capacitor/preferences';
import {
  getDb,
  newId,
  nowIso,
  encodeRowForWrite,
  decodeRowAfterRead,
  TABLE_COLUMNS,
} from './db';

// PERF: bcryptjs is ~80 KB minified and only needed during sign-in/sign-up,
// which happens at most once per cold start. Lazy-import it so the initial
// JS payload (and parse time on low-end Android) stays small.
let _bcrypt: typeof import('bcryptjs') | null = null;
async function bcryptLib() {
  if (!_bcrypt) _bcrypt = (await import('bcryptjs')).default ?? (await import('bcryptjs'));
  return _bcrypt;
}

// ─── Auth shapes (subset of @supabase/supabase-js used by this app) ──────────
export interface ShimUser {
  id: string;
  email: string;
}
export interface ShimSession {
  user: ShimUser;
  access_token: string;
}
type AuthChangeEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT';
type AuthChangeCb = (event: AuthChangeEvent, session: ShimSession | null) => void;

const SESSION_KEY = 'memora.session.token';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year (offline)

let cachedSession: ShimSession | null = null;
const listeners = new Set<AuthChangeCb>();

function emit(event: AuthChangeEvent) {
  for (const cb of listeners) {
    try { cb(event, cachedSession); } catch (e) { console.error(e); }
  }
}

async function loadSessionFromDisk(): Promise<ShimSession | null> {
  const { value: token } = await Preferences.get({ key: SESSION_KEY });
  if (!token) return null;
  const db = await getDb();
  const r = await db.query(
    `SELECT s.token, s.expires_at, u.id as uid, u.email as email
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
    [token],
  );
  const row = r.values?.[0];
  if (!row) { await Preferences.remove({ key: SESSION_KEY }); return null; }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.run('DELETE FROM sessions WHERE token = ?', [token]);
    await Preferences.remove({ key: SESSION_KEY });
    return null;
  }
  return { user: { id: row.uid, email: row.email }, access_token: token };
}

async function createSession(userId: string): Promise<ShimSession> {
  const db = await getDb();
  const token = newId() + newId().replace(/-/g, '');
  const created = nowIso();
  const expires = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.run(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    [token, userId, created, expires],
  );
  await Preferences.set({ key: SESSION_KEY, value: token });
  const u = await db.query('SELECT id, email FROM users WHERE id = ?', [userId]);
  const row = u.values?.[0];
  return { user: { id: row.id, email: row.email }, access_token: token };
}

async function ensureRelationship(userId: string) {
  const db = await getDb();
  const r = await db.query('SELECT id FROM relationships WHERE user_id = ?', [userId]);
  if (r.values?.length) return;
  const ts = nowIso();
  await db.run(
    `INSERT INTO relationships (id, user_id, name, nickname, birthday, anniversary,
       avatar_url, bio, hobbies, favorites, lifestyle, my_avatar_url, my_name, created_at, updated_at)
     VALUES (?, ?, '', '', NULL, NULL, '', '', '[]', '{}', '', '', '', ?, ?)`,
    [newId(), userId, ts, ts],
  );
}

// ─── Query builder ──────────────────────────────────────────────────────────
type Op = 'eq';
interface Filter { op: Op; col: string; val: any; }
interface Order { col: string; ascending: boolean; }

type Resolved<T> = { data: T; error: null; count?: number } | { data: null; error: Error; count?: number };

class QueryBuilder<T = any> implements PromiseLike<Resolved<T>> {
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private columns = '*';
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitN: number | null = null;
  private single = false;
  private wantCount: 'exact' | null = null;
  private writeRows: any[] = [];
  private patch: Record<string, any> | null = null;

  constructor(private table: string) {}

  select(columns: string = '*', opts?: { count?: 'exact' }) {
    this.mode = 'select';
    this.columns = columns;
    if (opts?.count) this.wantCount = opts.count;
    return this;
  }
  insert(rowOrRows: any | any[]) {
    this.mode = 'insert';
    this.writeRows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    return this;
  }
  update(patch: Record<string, any>) {
    this.mode = 'update';
    this.patch = patch;
    return this;
  }
  delete() {
    this.mode = 'delete';
    return this;
  }
  eq(col: string, val: any) { this.filters.push({ op: 'eq', col, val }); return this; }
  order(col: string, opts: { ascending: boolean }) {
    this.orders.push({ col, ascending: opts.ascending });
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  maybeSingle() { this.single = true; return this; }

  private whereClause(): { sql: string; params: any[] } {
    if (!this.filters.length) return { sql: '', params: [] };
    const parts = this.filters.map((f) => `${f.col} = ?`);
    return { sql: ' WHERE ' + parts.join(' AND '), params: this.filters.map((f) => f.val) };
  }

  private async run(): Promise<Resolved<T>> {
    try {
      const db = await getDb();
      const cols = TABLE_COLUMNS[this.table];
      if (!cols) throw new Error(`[shim] Unknown table: ${this.table}`);

      if (this.mode === 'select') {
        const sel = this.columns === '*' ? cols.join(', ') : this.columns;
        let sql = `SELECT ${sel} FROM ${this.table}`;
        const w = this.whereClause();
        sql += w.sql;
        for (const o of this.orders) {
          sql += ` ORDER BY ${o.col} ${o.ascending ? 'ASC' : 'DESC'}`;
        }
        if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
        const r = await db.query(sql, w.params);
        const decoded = (r.values ?? []).map((row) => decodeRowAfterRead(this.table, row));

        let count: number | undefined;
        if (this.wantCount === 'exact') {
          const c = await db.query(`SELECT COUNT(*) as c FROM ${this.table}${w.sql}`, w.params);
          count = (c.values?.[0]?.c as number) ?? 0;
        }

        if (this.single) {
          return { data: (decoded[0] ?? null) as any, error: null, count };
        }
        return { data: decoded as any, error: null, count };
      }

      if (this.mode === 'insert') {
        const inserted: any[] = [];
        for (const raw of this.writeRows) {
          const id = raw.id ?? newId();
          const ts = nowIso();
          const row: any = { ...raw, id };
          if (cols.includes('created_at') && !row.created_at) row.created_at = ts;
          if (cols.includes('updated_at') && !row.updated_at) row.updated_at = ts;
          // Fill missing JSON/text defaults to keep schema NOT NULLs happy.
          for (const c of cols) if (row[c] === undefined) row[c] = defaultFor(this.table, c);
          const encoded = encodeRowForWrite(this.table, row);
          const fields = cols.filter((c) => encoded[c] !== undefined);
          const placeholders = fields.map(() => '?').join(', ');
          await db.run(
            `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${placeholders})`,
            fields.map((f) => encoded[f]),
          );
          inserted.push(decodeRowAfterRead(this.table, row));
        }
        return { data: inserted as any, error: null };
      }

      if (this.mode === 'update') {
        const patch = encodeRowForWrite(this.table, this.patch ?? {});
        const keys = Object.keys(patch).filter((k) => cols.includes(k));
        if (!keys.length) return { data: [] as any, error: null };
        const setSql = keys.map((k) => `${k} = ?`).join(', ');
        const w = this.whereClause();
        await db.run(
          `UPDATE ${this.table} SET ${setSql}${w.sql}`,
          [...keys.map((k) => patch[k]), ...w.params],
        );
        return { data: [] as any, error: null };
      }

      if (this.mode === 'delete') {
        const w = this.whereClause();
        await db.run(`DELETE FROM ${this.table}${w.sql}`, w.params);
        return { data: [] as any, error: null };
      }

      throw new Error('[shim] unreachable');
    } catch (e: any) {
      console.error('[shim] query error', e);
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  then<TR1 = Resolved<T>, TR2 = never>(
    onfulfilled?: ((value: Resolved<T>) => TR1 | PromiseLike<TR1>) | null,
    onrejected?: ((reason: any) => TR2 | PromiseLike<TR2>) | null,
  ): PromiseLike<TR1 | TR2> {
    return this.run().then(onfulfilled as any, onrejected as any);
  }
}

function defaultFor(table: string, col: string): any {
  // Match the SQL defaults; non-nullable text columns get '', json columns get '[]'/'{}'
  if (col === 'owner') return 'mine';
  if (col === 'category') return 'personal';
  if (col === 'color') return 'pink';
  if (col === 'is_pinned' || col === 'is_favorite') return 0;
  if (col === 'hobbies' || col === 'photos' || col === 'tags') return '[]';
  if (col === 'favorites') return '{}';
  if (col === 'birthday' || col === 'anniversary' || col === 'memory_date') return null;
  // any other text-ish column
  return '';
}

// ─── Public `supabase` shim ─────────────────────────────────────────────────
export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async getSession(): Promise<{ data: { session: ShimSession | null } }> {
      if (!cachedSession) {
        cachedSession = await loadSessionFromDisk();
      }
      return { data: { session: cachedSession } };
    },
    onAuthStateChange(cb: AuthChangeCb) {
      listeners.add(cb);
      // Mirror supabase-js: deliver an INITIAL_SESSION event soon after subscribe.
      Promise.resolve().then(async () => {
        if (!cachedSession) cachedSession = await loadSessionFromDisk();
        try { cb('INITIAL_SESSION', cachedSession); } catch (e) { console.error(e); }
      });
      return { data: { subscription: { unsubscribe: () => { listeners.delete(cb); } } } };
    },
    async signInWithPassword(args: { email: string; password: string }): Promise<{ error: Error | null }> {
      try {
        const email = args.email.trim().toLowerCase();
        const db = await getDb();
        const r = await db.query('SELECT id, password_hash FROM users WHERE email = ?', [email]);
        const row = r.values?.[0];
        if (!row) return { error: new Error('Invalid email or password') };
        const bcrypt = await bcryptLib();
        const ok = await bcrypt.compare(args.password, row.password_hash);
        if (!ok) return { error: new Error('Invalid email or password') };
        cachedSession = await createSession(row.id);
        emit('SIGNED_IN');
        return { error: null };
      } catch (e: any) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
    async signUp(args: { email: string; password: string }): Promise<{ error: Error | null }> {
      try {
        const email = args.email.trim().toLowerCase();
        if (!email || !args.password) return { error: new Error('Email and password are required') };
        if (args.password.length < 6) return { error: new Error('Password must be at least 6 characters') };
        const db = await getDb();
        const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.values?.length) return { error: new Error('An account with that email already exists') };
        const id = newId();
        const bcrypt = await bcryptLib();
        const hash = await bcrypt.hash(args.password, 10);
        await db.run(
          'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
          [id, email, hash, nowIso()],
        );
        await ensureRelationship(id);
        return { error: null };
      } catch (e: any) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
    async signOut(): Promise<{ error: null }> {
      try {
        if (cachedSession) {
          const db = await getDb();
          await db.run('DELETE FROM sessions WHERE token = ?', [cachedSession.access_token]);
        }
      } catch (e) { console.error(e); }
      await Preferences.remove({ key: SESSION_KEY });
      cachedSession = null;
      emit('SIGNED_OUT');
      return { error: null };
    },
  },
};

export type User = ShimUser;
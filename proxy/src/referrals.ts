// Referral ledger and rewards.
//
// Each install is identified by its RevenueCat anonymous app user ID and gets
// a short code to share. When a friend redeems the code:
//   - the friend is owed one month of Pro straight away
//   - the referrer is owed one month once the friend writes a statement,
//     for up to MAX_REFERRALS friends
//
// Months owed are turned into Pro time by granting RevenueCat's promotional
// entitlement. While someone has a paid subscription the months stay banked,
// and are granted the first time the app checks in after it lapses.

export const MAX_REFERRALS = 6;

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const RC_API = 'https://api.revenuecat.com/v1';
// No 0/O or 1/I/L, so a code survives being read aloud or typed from a text.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export interface ReferralEnv {
  DB?: D1Database;
  REVENUECAT_SECRET_KEY?: string;
  REVENUECAT_ENTITLEMENT_ID?: string;
}

export class ReferralError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ReferralStatus {
  code: string;
  /** Friends who redeemed the code and wrote a statement. */
  credited: number;
  /** Friends who redeemed the code but have not written a statement yet. */
  pending: number;
  maxReferrals: number;
  /** Months earned but held back because a paid plan is active. */
  bankedMonths: number;
  /** True once this install has used someone else's code. */
  hasRedeemed: boolean;
  /** Months turned into Pro time by this request, so the app knows to refresh. */
  justGranted: number;
}

interface UserRow {
  app_user_id: string;
  code: string;
  months_owed: number;
  months_granted: number;
}

export function isValidAppUserId(value: unknown): value is string {
  return typeof value === 'string' && /^[\w$:.\-]{8,100}$/.test(value);
}

export function normalizeCode(value: unknown): string {
  return typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
}

function requireDb(env: ReferralEnv): D1Database {
  if (!env.DB) throw new ReferralError(503, 'Referrals are not available yet.');
  return env.DB;
}

function makeCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let code = '';
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

async function findUser(db: D1Database, appUserId: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT app_user_id, code, months_owed, months_granted FROM users WHERE app_user_id = ?')
    .bind(appUserId)
    .first<UserRow>();
}

async function ensureUser(db: D1Database, appUserId: string): Promise<UserRow> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await findUser(db, appUserId);
    if (existing) return existing;
    try {
      await db
        .prepare(
          'INSERT INTO users (app_user_id, code, created_at) VALUES (?, ?, ?) ON CONFLICT (app_user_id) DO NOTHING'
        )
        .bind(appUserId, makeCode(), new Date().toISOString())
        .run();
    } catch {
      // The generated code collided with an existing one. Try another.
    }
  }
  throw new ReferralError(500, 'Could not set up a referral code. Try again.');
}

// ── RevenueCat ───────────────────────────────────────────────────────────────

interface RcSubscriber {
  entitlements?: Record<string, { expires_date: string | null }>;
  subscriptions?: Record<string, { expires_date: string | null; store: string }>;
}

function rcHeaders(env: ReferralEnv): HeadersInit {
  return {
    Authorization: `Bearer ${env.REVENUECAT_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function rcGetSubscriber(env: ReferralEnv, appUserId: string): Promise<RcSubscriber> {
  const response = await fetch(`${RC_API}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: rcHeaders(env),
  });
  if (!response.ok) throw new Error(`RevenueCat subscriber lookup failed (${response.status})`);
  const data = (await response.json()) as { subscriber?: RcSubscriber };
  return data.subscriber ?? {};
}

async function rcGrantUntil(
  env: ReferralEnv,
  appUserId: string,
  entitlementId: string,
  endTimeMs: number
): Promise<void> {
  const response = await fetch(
    `${RC_API}/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/promotional`,
    {
      method: 'POST',
      headers: rcHeaders(env),
      body: JSON.stringify({ end_time_ms: endTimeMs }),
    }
  );
  if (!response.ok) throw new Error(`RevenueCat grant failed (${response.status})`);
}

/**
 * Turns any months the user is owed into Pro time. Returns how many months
 * were granted. Grants nothing (months stay banked) while the user has an
 * active paid subscription or a lifetime purchase.
 */
async function grantOwed(env: ReferralEnv, db: D1Database, appUserId: string): Promise<number> {
  const user = await findUser(db, appUserId);
  if (!user) return 0;
  const months = user.months_owed - user.months_granted;
  if (months <= 0) return 0;
  if (!env.REVENUECAT_SECRET_KEY) {
    console.error('REVENUECAT_SECRET_KEY secret is not set; referral months stay banked');
    return 0;
  }

  const entitlementId = env.REVENUECAT_ENTITLEMENT_ID || 'pro';
  const subscriber = await rcGetSubscriber(env, appUserId);
  const now = Date.now();

  // A null expiry on the entitlement means a lifetime purchase.
  const entitlement = subscriber.entitlements?.[entitlementId];
  if (entitlement && entitlement.expires_date === null) return 0;

  let promoEndsAt = 0;
  for (const subscription of Object.values(subscriber.subscriptions ?? {})) {
    const expiresAt = subscription.expires_date ? Date.parse(subscription.expires_date) : NaN;
    if (Number.isNaN(expiresAt) || expiresAt <= now) continue;
    if (subscription.store !== 'promotional') return 0; // paid plan is active
    promoEndsAt = Math.max(promoEndsAt, expiresAt);
  }

  // Claim the months before calling RevenueCat so two requests arriving
  // together cannot both grant them.
  const claim = await db
    .prepare(
      'UPDATE users SET months_granted = months_granted + ? WHERE app_user_id = ? AND months_granted = ?'
    )
    .bind(months, appUserId, user.months_granted)
    .run();
  if (claim.meta.changes !== 1) return 0;

  try {
    // Extend from the end of any reward time they already have.
    await rcGrantUntil(env, appUserId, entitlementId, Math.max(now, promoEndsAt) + months * MONTH_MS);
  } catch (err) {
    await db
      .prepare('UPDATE users SET months_granted = months_granted - ? WHERE app_user_id = ?')
      .bind(months, appUserId)
      .run();
    throw err;
  }
  return months;
}

async function grantOwedQuietly(env: ReferralEnv, db: D1Database, appUserId: string): Promise<number> {
  try {
    return await grantOwed(env, db, appUserId);
  } catch (err) {
    // The months stay owed and are retried the next time the app checks in.
    console.error('Could not grant referral months', err);
    return 0;
  }
}

// ── Endpoints ────────────────────────────────────────────────────────────────

async function buildStatus(
  db: D1Database,
  appUserId: string,
  justGranted: number
): Promise<ReferralStatus> {
  const user = await ensureUser(db, appUserId);
  const counts = await db
    .prepare('SELECT status, COUNT(*) AS n FROM referrals WHERE referrer_id = ? GROUP BY status')
    .bind(appUserId)
    .all<{ status: string; n: number }>();
  const redeemed = await db
    .prepare('SELECT 1 AS found FROM referrals WHERE referee_id = ?')
    .bind(appUserId)
    .first();

  const count = (status: string) => counts.results.find((row) => row.status === status)?.n ?? 0;
  return {
    code: user.code,
    credited: count('credited'),
    pending: count('pending'),
    maxReferrals: MAX_REFERRALS,
    bankedMonths: Math.max(0, user.months_owed - user.months_granted),
    hasRedeemed: redeemed !== null,
    justGranted,
  };
}

/** The user's code and progress. Also grants any months they are owed. */
export async function getReferralStatus(env: ReferralEnv, appUserId: string): Promise<ReferralStatus> {
  const db = requireDb(env);
  await ensureUser(db, appUserId);
  const justGranted = await grantOwedQuietly(env, db, appUserId);
  return buildStatus(db, appUserId, justGranted);
}

/** Records that this install used a friend's code and gives it a month of Pro. */
export async function redeemReferralCode(
  env: ReferralEnv,
  appUserId: string,
  rawCode: unknown
): Promise<ReferralStatus> {
  const db = requireDb(env);
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) {
    throw new ReferralError(400, `Referral codes are ${CODE_LENGTH} characters. Check it and try again.`);
  }

  await ensureUser(db, appUserId);
  const referrer = await db
    .prepare('SELECT app_user_id FROM users WHERE code = ?')
    .bind(code)
    .first<{ app_user_id: string }>();
  if (!referrer) throw new ReferralError(404, 'That code was not found. Check it and try again.');
  if (referrer.app_user_id === appUserId) {
    throw new ReferralError(400, 'That is your own code. Share it with a friend instead.');
  }

  // Two people cannot refer each other.
  const reverse = await db
    .prepare('SELECT 1 AS found FROM referrals WHERE referee_id = ? AND referrer_id = ?')
    .bind(referrer.app_user_id, appUserId)
    .first();
  if (reverse) {
    throw new ReferralError(400, 'This person joined with your code, so you cannot use theirs.');
  }

  const insert = await db
    .prepare(
      "INSERT INTO referrals (referee_id, referrer_id, status, created_at) VALUES (?, ?, 'pending', ?) ON CONFLICT (referee_id) DO NOTHING"
    )
    .bind(appUserId, referrer.app_user_id, new Date().toISOString())
    .run();
  if (insert.meta.changes !== 1) {
    throw new ReferralError(409, 'A referral code has already been used on this device.');
  }

  await db
    .prepare('UPDATE users SET months_owed = months_owed + 1 WHERE app_user_id = ?')
    .bind(appUserId)
    .run();
  const justGranted = await grantOwedQuietly(env, db, appUserId);
  return buildStatus(db, appUserId, justGranted);
}

/**
 * Call after an install successfully writes a statement. If it joined with a
 * friend's code and has not been counted yet, the friend earns a month.
 * Never throws.
 */
export async function creditReferrerOnWrite(env: ReferralEnv, refereeId: string): Promise<void> {
  if (!env.DB) return;
  const db = env.DB;
  try {
    // One statement decides credited vs capped, so the cap holds even if
    // several friends write their first statement at the same moment.
    const updated = await db
      .prepare(
        `UPDATE referrals
         SET status = CASE
               WHEN (SELECT COUNT(*) FROM referrals AS r
                     WHERE r.referrer_id = referrals.referrer_id AND r.status = 'credited') < ?
               THEN 'credited' ELSE 'capped' END,
             credited_at = ?
         WHERE referee_id = ? AND status = 'pending'
         RETURNING referrer_id, status`
      )
      .bind(MAX_REFERRALS, new Date().toISOString(), refereeId)
      .first<{ referrer_id: string; status: string }>();
    if (!updated || updated.status !== 'credited') return;

    await db
      .prepare('UPDATE users SET months_owed = months_owed + 1 WHERE app_user_id = ?')
      .bind(updated.referrer_id)
      .run();
    await grantOwedQuietly(env, db, updated.referrer_id);
  } catch (err) {
    console.error('Could not credit referral', err);
  }
}

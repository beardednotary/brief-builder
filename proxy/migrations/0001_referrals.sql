-- Referral ledger. The only identity stored is RevenueCat's anonymous app
-- user ID; no names, emails, or log content ever reach this database.

CREATE TABLE users (
  app_user_id    TEXT PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  -- Months of Pro this user is owed: one per credited referral (capped),
  -- plus one if they redeemed a friend's code.
  months_owed    INTEGER NOT NULL DEFAULT 0,
  -- Months already turned into Pro time through RevenueCat. The difference
  -- from months_owed is "banked" (held while a paid subscription is active).
  months_granted INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);

CREATE TABLE referrals (
  -- One row per person who redeemed a code, so a code can be used once per install.
  referee_id  TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  -- pending: code redeemed, friend has not written a statement yet
  -- credited: friend wrote a statement and the referrer earned a month
  -- capped: friend wrote a statement but the referrer was already at the limit
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL,
  credited_at TEXT
);

CREATE INDEX referrals_by_referrer ON referrals (referrer_id, status);

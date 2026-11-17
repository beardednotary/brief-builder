// Referral client. The ledger lives in the Worker (proxy/src/referrals.ts);
// this install is identified only by its anonymous RevenueCat app user ID.

import { getAppUserId } from './revenueCat';
import * as storage from './storage';
import { APP_SHARE_URL } from '../constants/links';

const PROXY_URL = (process.env.EXPO_PUBLIC_PROXY_URL ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 20_000;

export interface ReferralStatus {
  code: string;
  /** Friends who used the code and wrote a statement. */
  credited: number;
  /** Friends who used the code but have not written a statement yet. */
  pending: number;
  maxReferrals: number;
  /** Months earned but held while a paid plan is active. */
  bankedMonths: number;
  /** True once this install has used someone else's code. */
  hasRedeemed: boolean;
  /** Months turned into Pro time by this request. */
  justGranted: number;
}

async function post(path: string, body: Record<string, unknown>): Promise<ReferralStatus> {
  if (!PROXY_URL) throw new Error('Referrals are not available in this build.');
  const appUserId = await getAppUserId();
  if (!appUserId) throw new Error('Referrals are not available in this build.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${PROXY_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, appUserId }),
      signal: controller.signal,
    });
  } catch {
    throw new Error('Could not reach the referral service. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  const data = (await response.json().catch(() => null)) as
    | (Partial<ReferralStatus> & { error?: string })
    | null;
  if (!response.ok || !data?.code) {
    throw new Error(data?.error ?? `The referral service returned an error (${response.status}).`);
  }
  return data as ReferralStatus;
}

/** This install's code and progress. Also collects any months it is owed. */
export function getReferralStatus(): Promise<ReferralStatus> {
  return post('/v1/referral/status', {});
}

/** Uses a friend's code. Throws with a readable message if it is not accepted. */
export async function redeemReferralCode(code: string): Promise<ReferralStatus> {
  const status = await post('/v1/referral/redeem', { code });
  await storage.setReferralJoined();
  return status;
}

export function buildShareMessage(code: string): string {
  return (
    `I use BriefBuilder to log what I get done all year and turn it into EPB statements. ` +
    `Enter my code ${code} for a free month of Pro: ${APP_SHARE_URL}`
  );
}

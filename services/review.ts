// In-app review prompt.
//
// The dialog itself cannot be customized: Apple (guideline 5.6.1) and Google
// both require their system prompt, and Google forbids asking "Do you like
// the app?" before it. What this app controls is when to ask, so it asks only
// at the moments an Airman actually feels the payoff:
//
//   block_complete  a block just reached its two statements
//   epb_complete    all four blocks have their statements
//   block_copied    a finished block was copied, on its way into myEval
//   referral_shared they just sent their referral code to a friend
//
// Each moment is used at most once per EPB cycle (keyed by close-out date),
// so next year's EPB can ask again. The system still decides whether the
// prompt appears; Apple shows it at most three times a year.

import * as StoreReview from 'expo-store-review';
import * as storage from './storage';

export type ReviewMoment =
  | 'block_complete'
  | 'epb_complete'
  | 'block_copied'
  | 'referral_shared';

const MAX_ASKS_PER_YEAR = 3;
const MIN_DAYS_BETWEEN_ASKS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;

/**
 * Ask for a review at one of the moments above, if that moment has not been
 * used this EPB cycle and the yearly and spacing limits allow it. Call after
 * the win has registered on screen, never on launch or mid-task. Never throws.
 *
 * @param cycle The profile's close-out date, so each EPB cycle gets its own moments.
 */
export async function maybeRequestReview(
  moment: ReviewMoment,
  cycle: string | undefined
): Promise<void> {
  try {
    const key = `${moment}:${cycle ?? 'none'}`;
    const state = await storage.getReviewState();
    if (state.moments.includes(key)) return;

    const now = Date.now();
    const thisYear = state.askedAt.filter((iso) => now - Date.parse(iso) < YEAR_MS);
    if (thisYear.length >= MAX_ASKS_PER_YEAR) return;

    // Finishing the whole EPB is worth asking about even soon after a smaller
    // win; the other moments wait so two asks never land close together.
    const lastAsk = thisYear.length > 0 ? Math.max(...thisYear.map((iso) => Date.parse(iso))) : 0;
    if (moment !== 'epb_complete' && lastAsk > 0 && now - lastAsk < MIN_DAYS_BETWEEN_ASKS * DAY_MS) {
      return;
    }

    if (!(await StoreReview.isAvailableAsync())) return;

    await storage.saveReviewState({
      askedAt: [...thisYear, new Date(now).toISOString()],
      moments: [...state.moments, key],
    });
    await StoreReview.requestReview();
  } catch (err) {
    console.warn('Review prompt failed', err);
  }
}

/**
 * Which review moment, if any, a statement just added to a block creates.
 * blockCount is that block's statement count after the add.
 */
export function momentForSavedStatement(
  blockCount: number,
  target: number,
  allBlocksDone: boolean
): ReviewMoment | null {
  if (allBlocksDone) return 'epb_complete';
  if (blockCount === target) return 'block_complete';
  return null;
}

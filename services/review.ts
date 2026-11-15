// In-app review prompt. The system decides whether the prompt actually
// appears (Apple shows it at most three times a year), so this only decides
// when it is reasonable to ask: right after the user gets real value.

import * as StoreReview from 'expo-store-review';
import * as storage from './storage';

const MIN_FINALIZED_STATEMENTS = 2;
const MAX_ASKS = 3;
const MIN_DAYS_BETWEEN_ASKS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ask for a review if the user has finished enough statements and has not
 * been asked recently. Call after a win (a statement added to the builder, a
 * block copied), never on launch or in the middle of a task. Never throws.
 */
export async function maybeRequestReview(finalizedStatements: number): Promise<void> {
  try {
    if (finalizedStatements < MIN_FINALIZED_STATEMENTS) return;

    const state = await storage.getReviewState();
    if (state.askCount >= MAX_ASKS) return;
    if (state.lastAskedAt) {
      const sinceMs = Date.now() - new Date(state.lastAskedAt).getTime();
      if (sinceMs < MIN_DAYS_BETWEEN_ASKS * DAY_MS) return;
    }

    if (!(await StoreReview.isAvailableAsync())) return;

    await storage.saveReviewState({
      askCount: state.askCount + 1,
      lastAskedAt: new Date().toISOString(),
    });
    await StoreReview.requestReview();
  } catch (err) {
    console.warn('Review prompt failed', err);
  }
}

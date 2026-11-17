import { useCallback } from 'react';
import { LogEntry, UserProfile } from '../types';
import { polishEntry } from '../services/anthropic';
import * as storage from '../services/storage';

export const FREE_POLISH_LIMIT = 5;

export class PaywallError extends Error {
  constructor() {
    super('PAYWALL');
    this.name = 'PaywallError';
  }
}

/**
 * How many times AI has written statements for this entry. Entries saved
 * before writeCount existed count as one write if they already have drafts.
 */
export function getWriteCount(entry: LogEntry): number {
  return entry.writeCount ?? (entry.draftStatements?.length ? 1 : 0);
}

/**
 * The first regenerate on each entry does not use a free write, so one
 * disappointing result never costs a free user two of their five.
 */
export function isFreeRegenerate(entry: LogEntry): boolean {
  return getWriteCount(entry) === 1;
}

export function usePolish(profile: UserProfile | null) {
  const getRemainingFreePolishes = useCallback(async (): Promise<number> => {
    const count = await storage.getPolishCount();
    return Math.max(0, FREE_POLISH_LIMIT - count);
  }, []);

  const polish = useCallback(
    async (entry: LogEntry): Promise<string[]> => {
      if (!profile) throw new Error('Profile required before writing statements.');

      const free = isFreeRegenerate(entry);

      if (!profile.isPro && !free) {
        const count = await storage.getPolishCount();
        if (count >= FREE_POLISH_LIMIT) throw new PaywallError();
      }

      // The proxy builds the prompt (constants/prompts.ts) and calls Claude.
      const result = await polishEntry(entry, profile);

      if (!free) await storage.incrementPolishCount();
      return result.statements;
    },
    [profile]
  );

  return { polish, getRemainingFreePolishes };
}

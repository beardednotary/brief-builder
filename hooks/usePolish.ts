import { useCallback } from 'react';
import { LogEntry, UserProfile } from '../types';
import { buildPrompt } from '../constants/prompts';
import { polishEntry } from '../services/anthropic';
import * as storage from '../services/storage';

export const FREE_POLISH_LIMIT = 5;

export class PaywallError extends Error {
  constructor() {
    super('PAYWALL');
    this.name = 'PaywallError';
  }
}

export function usePolish(profile: UserProfile | null) {
  const getRemainingFreePolishes = useCallback(async (): Promise<number> => {
    const count = await storage.getPolishCount();
    return Math.max(0, FREE_POLISH_LIMIT - count);
  }, []);

  const polish = useCallback(
    async (entry: LogEntry): Promise<string[]> => {
      if (!profile) throw new Error('Profile required before polishing.');

      if (!profile.isPro) {
        const count = await storage.getPolishCount();
        if (count >= FREE_POLISH_LIMIT) throw new PaywallError();
      }

      const payload = buildPrompt(entry, profile);
      const result = await polishEntry(payload);

      await storage.incrementPolishCount();
      return result.statements;
    },
    [profile]
  );

  return { polish, getRemainingFreePolishes };
}

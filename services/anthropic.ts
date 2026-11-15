import { LogEntry, UserProfile } from '../types';

// The app never holds an Anthropic key. It calls the BriefBuilder proxy
// (see proxy/), which builds the prompt and calls Claude server-side.
const PROXY_URL = (process.env.EXPO_PUBLIC_PROXY_URL ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 45_000;

export interface PolishResult {
  statements: string[];
}

export async function polishEntry(entry: LogEntry, profile: UserProfile): Promise<PolishResult> {
  if (!PROXY_URL) {
    throw new Error('EXPO_PUBLIC_PROXY_URL is not set. Add it to your .env file and restart Expo.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${PROXY_URL}/v1/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry: {
          inputMode: entry.inputMode,
          rawText: entry.rawText,
          action: entry.action,
          outcome: entry.outcome,
          metrics: entry.metrics,
          context: entry.context,
          mpa: entry.mpa,
          alq: entry.alq,
          proficiencyTarget: entry.proficiencyTarget,
        },
        profile: {
          rank: profile.rank,
          afsc: profile.afsc,
          afscTitle: profile.afscTitle,
          component: profile.component,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('The request timed out. Check your connection and try again.');
    }
    throw new Error('Could not reach the writing service. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  const data = (await response.json().catch(() => null)) as
    | { statements?: string[]; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.error ?? `The writing service returned an error (${response.status}).`);
  }

  const statements = data?.statements ?? [];
  if (statements.length === 0) {
    throw new Error('No statements were returned. Try again.');
  }

  return { statements };
}

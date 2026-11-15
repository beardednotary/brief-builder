import { PromptPayload } from '../constants/prompts';

// MVP: key is bundled via EXPO_PUBLIC_ANTHROPIC_API_KEY in .env
// This is acceptable for a local-only app with no backend.
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 300;

export interface PolishResult {
  statements: string[];
  raw: string;
}

export async function polishEntry(payload: PromptPayload): Promise<PolishResult> {
  if (!API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: payload.system,
      messages: [{ role: 'user', content: payload.user }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${body}`);
  }

  const data = await response.json();
  const raw: string = data.content?.[0]?.text ?? '';
  const statements = parseStatements(raw);

  return { statements, raw };
}

function parseStatements(raw: string): string[] {
  return raw
    .split('\n')
    .filter((line) => /^Option [12]:/i.test(line))
    .map((line) =>
      line
        .replace(/^Option [12]:\s*/i, '')
        .replace(/\s*\(\d+ chars?\)\s*$/i, '')
        .trim()
    )
    .slice(0, 2);
}

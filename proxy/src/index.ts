// BriefBuilder statement-writing proxy (Cloudflare Worker).
//
// The app sends a log entry + profile; this Worker builds the prompt, calls
// Claude with the server-held key, and returns the parsed statements. The
// Anthropic key never ships inside the app, and because the prompt is built
// here the endpoint can only be used to write EPB statements.

import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt } from '../../constants/prompts';
import type {
  AirmanRank,
  ALQ,
  Component,
  LogEntry,
  MPA,
  ProficiencyLevel,
  UserProfile,
} from '../../types';

interface Env {
  ANTHROPIC_API_KEY: string;
  WRITE_LIMITER: RateLimit;
}

const MODEL = 'claude-sonnet-5-5';
// Thinking counts toward max_tokens on this model, so leave plenty of headroom
// above the ~100 tokens the two statements need (1024 cut option 2 off).
const MAX_TOKENS = 4096;

const MAX_BODY_BYTES = 16_000;
const MAX_FREEFORM_CHARS = 4000;
const MAX_FIELD_CHARS = 1000;

const RANKS: readonly AirmanRank[] = [
  'AB', 'Amn', 'A1C', 'SrA', 'SSgt', 'TSgt', 'MSgt', 'SMSgt', 'CMSgt',
];
const COMPONENTS: readonly Component[] = ['RegAF', 'AFR', 'ANG'];
const MPAS: readonly MPA[] = [
  'executing_the_mission', 'leading_people', 'managing_resources', 'improving_the_unit',
];
const ALQS: readonly ALQ[] = [
  'job_proficiency', 'initiative', 'adaptability',
  'inclusion_teamwork', 'emotional_intelligence', 'communication',
  'stewardship', 'accountability',
  'decision_making', 'innovation',
];
const PROFICIENCY_LEVELS: readonly ProficiencyLevel[] = [
  'needs_improvement', 'developing', 'proficient', 'highly_proficient', 'exceptionally_skilled',
];

class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new RequestError(400, `Invalid ${field}.`);
}

function optionalOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string
): T | undefined {
  return value === undefined || value === null ? undefined : oneOf(value, allowed, field);
}

function optionalText(value: unknown, max: number, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new RequestError(400, `Invalid ${field}.`);
  const text = value.trim();
  if (text.length > max) {
    throw new RequestError(400, `${field} is too long (max ${max} characters). Shorten it and try again.`);
  }
  return text || undefined;
}

// Rebuild both objects from validated fields only — nothing else the client
// sends reaches the prompt.
function parseRequest(body: unknown): { entry: LogEntry; profile: UserProfile } {
  if (typeof body !== 'object' || body === null) throw new RequestError(400, 'Invalid request body.');
  const { entry: e, profile: p } = body as { entry?: Record<string, unknown>; profile?: Record<string, unknown> };
  if (typeof e !== 'object' || e === null || typeof p !== 'object' || p === null) {
    throw new RequestError(400, 'Request must include entry and profile.');
  }

  const afsc = optionalText(p.afsc, 10, 'AFSC');
  if (!afsc || !/^[0-9A-Za-z]+$/.test(afsc)) throw new RequestError(400, 'Invalid AFSC.');

  const profile: UserProfile = {
    rank: oneOf(p.rank, RANKS, 'rank'),
    afsc,
    afscTitle: optionalText(p.afscTitle, 80, 'AFSC title'),
    component: optionalOneOf(p.component, COMPONENTS, 'component') ?? 'RegAF',
    isPro: false,
  };

  const inputMode = oneOf(e.inputMode, ['freeform', 'structured'] as const, 'input mode');
  const entry: LogEntry = {
    id: 'proxy',
    createdAt: '',
    isFavorited: false,
    status: 'draft',
    inputMode,
    mpa: oneOf(e.mpa, MPAS, 'MPA'),
    alq: optionalOneOf(e.alq, ALQS, 'ALQ'),
    proficiencyTarget: optionalOneOf(e.proficiencyTarget, PROFICIENCY_LEVELS, 'proficiency level'),
    rawText: optionalText(e.rawText, MAX_FREEFORM_CHARS, 'Entry text'),
    action: optionalText(e.action, MAX_FIELD_CHARS, 'Action'),
    outcome: optionalText(e.outcome, MAX_FIELD_CHARS, 'Outcome'),
    metrics: optionalText(e.metrics, MAX_FIELD_CHARS, 'Metrics'),
    context: optionalText(e.context, MAX_FIELD_CHARS, 'Context'),
  };

  const hasInput =
    inputMode === 'freeform'
      ? Boolean(entry.rawText)
      : Boolean(entry.action || entry.outcome || entry.metrics || entry.context);
  if (!hasInput) throw new RequestError(400, 'The entry is empty. Add some detail and try again.');

  return { entry, profile };
}

function parseStatements(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^Option [12]:/i.test(line))
    .map((line) =>
      line
        .replace(/^Option [12]:\s*/i, '')
        .replace(/\s*\(\d+ chars?\)\s*$/i, '')
        .trim()
    )
    .filter(Boolean)
    .slice(0, 2);
}

async function writeStatements(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const { success } = await env.WRITE_LIMITER.limit({ key: ip });
  if (!success) return json(429, { error: 'Too many requests. Wait a minute and try again.' });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new RequestError(413, 'Request is too large.');

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new RequestError(400, 'Request body must be JSON.');
  }

  const { entry, profile } = parseRequest(body);
  const prompt = buildPrompt(entry, profile);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: 'low' },
    // If a safety classifier declines the request, let the API retry it on
    // its default fallback model instead of failing outright.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  });

  if (response.stop_reason === 'refusal') {
    return json(422, { error: 'The AI declined to write statements for this entry. Try rewording it.' });
  }

  const raw = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n');
  const statements = parseStatements(raw);
  // If the response hit the token cap, the last option is cut off mid-sentence.
  if (response.stop_reason === 'max_tokens') statements.pop();
  if (statements.length === 0) {
    console.error('No statements parsed', { stop_reason: response.stop_reason });
    return json(502, { error: 'The AI returned an unexpected response. Try again.' });
  }

  return json(200, { statements });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname !== '/v1/write') return json(404, { error: 'Not found.' });
    if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' });
    if (!env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY secret is not set');
      return json(500, { error: 'The writing service is not configured.' });
    }

    try {
      return await writeStatements(request, env);
    } catch (err) {
      if (err instanceof RequestError) return json(err.status, { error: err.message });
      if (err instanceof Anthropic.RateLimitError) {
        return json(429, { error: 'The writing service is busy. Try again in a moment.' });
      }
      if (err instanceof Anthropic.APIError) {
        console.error('Anthropic API error', err.status, err.message);
        return json(502, { error: 'The writing service had a problem. Try again.' });
      }
      console.error('Unexpected error', err);
      return json(500, { error: 'Something went wrong. Try again.' });
    }
  },
} satisfies ExportedHandler<Env>;

# BriefBuilder — Claude Code Project Instructions

## What We're Building
An iOS/Android app (React Native + Expo) that helps enlisted Air Force members prepare EPB (Enlisted Performance Brief) content year-round. Users log accomplishments as they happen ("thought dumps"), then AI polishes them into regulation-compliant performance statements for their annual evaluation.

## Stack
- React Native + Expo (managed workflow)
- Expo Router (file-based navigation)
- AsyncStorage / MMKV for local persistence
- Anthropic Claude API for AI writing (`claude-sonnet-5-5`), called through the Cloudflare Worker in `proxy/` — the app never holds the key
- RevenueCat for IAP (monthly $3.99 / annual $14.99 / lifetime $24.99)
- EAS Build + EAS Submit
- TypeScript throughout
- No backend beyond the stateless AI proxy — all user data stays local for MVP

## Developer Preferences
- **PowerShell-compatible commands** — never use bash-only syntax
- Complete working files, not partial diffs
- Accuracy over speed on technical details
- Expo managed workflow — no bare ejection

## Project Structure
```
app/
  (onboarding)/     — rank, AFSC, component, SCOD setup
  (tabs)/           — dashboard, log, builder, profile
  log/              — new entry, edit entry
  polish/           — AI polish flow
  paywall.tsx
components/
  mpa/              — MPA card, character counter, statement list
  log/              — entry card, structured input form
  ai/               — polish modal, statement options
  shared/           — buttons, inputs, headers
constants/
  alq.ts            — all 10 ALQs with definitions
  mpa.ts            — 4 MPAs with definitions
  proficiency.ts    — 5 proficiency levels with descriptions
  afsc.ts           — AFSC list for onboarding search
  prompts.ts        — AI system prompt builder function
hooks/
  useLogEntries.ts
  useEPBBlocks.ts
  useProfile.ts
  usePolish.ts      — Claude API call + RevenueCat gate
services/
  anthropic.ts      — API wrapper
  revenueCat.ts     — IAP wrapper
  storage.ts        — AsyncStorage abstraction
types/
  index.ts          — all shared types/enums
```

## Core Types (use these everywhere)
```typescript
type AirmanRank = 'AB' | 'Amn' | 'A1C' | 'SrA' | 'SSgt' | 'TSgt' | 'MSgt' | 'SMSgt' | 'CMSgt';
type MPA = 'executing_the_mission' | 'leading_people' | 'managing_resources' | 'improving_the_unit';
type ALQ = 'job_proficiency' | 'initiative' | 'adaptability' | 'inclusion_teamwork' | 'emotional_intelligence' | 'communication' | 'stewardship' | 'accountability' | 'decision_making' | 'innovation';
type ProficiencyLevel = 'needs_improvement' | 'developing' | 'proficient' | 'highly_proficient' | 'exceptionally_skilled';
type Component = 'RegAF' | 'AFR' | 'ANG';
```

## EPB Rules (enforce these in UI and AI)
- Each MPA block: **350 character max**
- Target 2 statements per MPA block
- Each statement: ~150–175 characters
- Statement format: **[action] + [impact/result/outcome]**
- Plain language, no uncommon acronyms
- No clichés ("consummate professional", "go-to Airman", etc.)
- Quantify everything possible (numbers, %, $, time)

## AI Polish Flow
1. User selects a log entry
2. App POSTs the entry + profile to the proxy (`services/anthropic.ts` → `EXPO_PUBLIC_PROXY_URL/v1/write`)
3. Proxy (`proxy/src/index.ts`) validates the input, calls `buildPrompt(entry, profile)` from `constants/prompts.ts`, and calls Claude — model: `claude-sonnet-5-5`, effort low
4. Proxy parses 2 statement options and returns them
5. Show options with character counts
6. User taps to select, can edit inline
7. Accepted statement saved back to entry + added to MPA block

## Monetization Gate
- 5 free AI polishes total (tracked in AsyncStorage)
- On 6th attempt → RevenueCat paywall
- Pro unlocks: unlimited polishes, AFSC-specific context injection, reminders
- Check `usePolish.ts` before every API call

## ALQ → MPA Mapping
```
executing_the_mission: ['job_proficiency', 'initiative', 'adaptability']
leading_people: ['inclusion_teamwork', 'emotional_intelligence', 'communication']
managing_resources: ['stewardship', 'accountability']
improving_the_unit: ['decision_making', 'innovation']
```

## Key Files to Build First
1. `types/index.ts` — all types
2. `constants/alq.ts` + `constants/mpa.ts` + `constants/proficiency.ts`
3. `constants/prompts.ts` — the AI prompt builder
4. `services/anthropic.ts` — API wrapper
5. `services/storage.ts` — storage abstraction
6. `hooks/useProfile.ts` — user profile state
7. `hooks/useLogEntries.ts` — log CRUD
8. Onboarding screens
9. Dashboard tab
10. Log entry + polish flow

## Environment Variables
```
EXPO_PUBLIC_PROXY_URL=      # App .env — URL of the deployed Worker (not a secret)
ANTHROPIC_API_KEY=          # Worker secret only (`npx wrangler secret put`), never in the app's .env
REVENUECAT_IOS_KEY=         # RevenueCat iOS public key
REVENUECAT_ANDROID_KEY=     # RevenueCat Android public key
```

## Do Not
- Eject from Expo managed workflow
- Add any backend/server beyond the AI proxy for MVP
- Put an Anthropic key in the app or in any `EXPO_PUBLIC_` variable
- Use bash-only commands (use PowerShell-compatible)
- Write partial files — always write complete, working files
- Use `expo install` alternatives — always use `npx expo install` for Expo packages

## Full Context
See `BRIEFBUILDER_CONTEXT.md` for complete domain knowledge including:
- All 10 ALQ definitions
- Proficiency level examples
- Full AI prompt template
- Competitive landscape
- ASO metadata
- Feature roadmap

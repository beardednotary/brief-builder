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
- No backend beyond the Worker in `proxy/` — it is the AI proxy plus a small referral ledger (Cloudflare D1). Profile, log entries, and EPB content stay on the device.

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
  usePolish.ts      — Claude API call + free-write gate
  useProSync.ts     — keeps profile.isPro in step with RevenueCat
services/
  anthropic.ts      — API wrapper
  revenueCat.ts     — IAP wrapper (entitlement `pro`; also the install's anonymous ID)
  referrals.ts      — referral client (code, status, redeem)
  storage.ts        — AsyncStorage abstraction
proxy/
  src/index.ts      — Worker routes: /v1/write, /v1/referral/status, /v1/referral/redeem
  src/referrals.ts  — referral ledger + RevenueCat promotional grants
  migrations/       — D1 schema
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
- The first regenerate on each entry is free; later ones count as a write
- Pro unlocks: unlimited polishes, AFSC-specific context injection (reminders are free for everyone)
- Check `usePolish.ts` before every API call
- RevenueCat is the source of truth for Pro. `profile.isPro` is a local mirror kept current by `useProSync`.

## Referrals
- Every install gets a 6-character code (profile tab). A friend enters it in onboarding or on the profile tab.
- The friend gets 1 month of Pro on redeeming. The referrer gets 1 month when that friend first writes a statement, for up to 6 friends.
- Rewards are RevenueCat promotional entitlements granted by the Worker. A month is 30 days and stacks onto any reward time already running.
- Paid subscribers: earned months are banked in the ledger and granted when the app checks in after the subscription lapses. Lifetime buyers earn nothing; for them the card is "give a friend a free month".
- Identity is RevenueCat's anonymous app user ID. There are no accounts.

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
EXPO_PUBLIC_REVENUECAT_IOS_KEY=      # App .env + eas.json — RevenueCat iOS public SDK key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=  # App .env + eas.json — RevenueCat Android public SDK key
REVENUECAT_SECRET_KEY=      # Worker secret only — RevenueCat secret API key (v1), grants referral months
```

## Do Not
- Eject from Expo managed workflow
- Add any backend/server beyond the Worker in `proxy/` for MVP, or send log entries or profile data anywhere to be stored
- Put an Anthropic key or the RevenueCat secret key in the app or in any `EXPO_PUBLIC_` variable
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

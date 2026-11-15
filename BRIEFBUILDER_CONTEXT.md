# BriefBuilder — Full Project Context
> Air Force EPB Performance Statement Assistant
> DahVio Studios | Solo Dev: Ray

---

## What This App Does

BriefBuilder helps enlisted Air Force members (E-1 through E-9) prepare their Enlisted Performance Brief (EPB) content throughout the year — not just at deadline crunch. Users log "thought dumps" of their accomplishments and behaviors as they happen, then use AI to polish them into regulation-compliant performance statements ready to paste into myEval or AF Form 716.

**Core loop:** Capture raw memory → AI polish → organized by MPA → copy to myEval

---

## The Problem Being Solved

Airmen write EPB bullets under pressure at the end of a reporting period, trying to remember what they did 8 months ago. They also don't know how to translate plain English into AF action-behavior-impact format. BriefBuilder solves both: continuous capture throughout the year, AI polish on demand.

---

## Target Users

- Primary: Junior enlisted (SrA E-4 through SSgt E-5) — most anxious about EPBs, least experienced writing bullets
- Secondary: Full E-1 through E-9 enlisted, Regular Air Force + AFR + ANG
- NOT Space Force (separate evaluation system)

---

## Tech Stack

- **Framework:** React Native + Expo (managed workflow)
- **Navigation:** Expo Router
- **Storage:** AsyncStorage (local) + iCloud sync via Expo SecureStore / MMKV
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Monetization:** RevenueCat
- **Build/Deploy:** EAS Build + EAS Submit
- **Backend:** None for MVP — fully local

---

## EPB Domain Knowledge

### The Form

**AF Form 716** is the universal offline EPB form for all enlisted grades (E-1 through E-9). The myEval system generates the digital equivalent (the "EPB"). Both use identical structure.

**From the ratee's perspective, there are 5 content blocks to fill:**

1. **Duty Description** — narrative of position, scope, responsibilities
2. **Executing the Mission** — 350 char max
3. **Leading People** — 350 char max
4. **Managing Resources** — 350 char max
5. **Improving the Unit** — 350 char max
6. **Mandatory Comments (Housing/Voting)** — conditional, only if applicable

Everything else (stratification, HLR assessment, Future Roles, Higher Responsibility) is above the ratee's pay grade — not the user's problem.

### Target Statement Length

- 350 characters per MPA block
- Target 2 performance statements per MPA
- Each statement: ~150–175 characters
- Statements are standalone sentences: **[action] + [impact/result/outcome]**

### Static Close-Out Dates (SCODs) by Grade

Source: AFI 36-2406 (22 Aug 2025), Tables 4.4 and 4.5. Grades include selects.

| Grade | SCOD | RegAF / AGR / Stat Tour | AFR/ANG non-AGR |
|-------|------|-------------------------|-----------------|
| SrA and below (E1–E4) | 31 March | Annual | Even years |
| SSgt (E5) | 31 January | Annual | Odd years |
| TSgt (E6) | 30 November | Annual | Even years |
| MSgt (E7) | 30 September | Annual | Odd years |
| SMSgt (E8) | 31 July | Annual | Even years |
| CMSgt (E9) | 31 May | Annual | Annual for AFR, odd years for ANG |

The AFI does not state a character count for the four MPA blocks; it says comments are "limited to the space provided". The 350-character figure is the myEval / AF Form 716 field size, not a number from the AFI.

---

## The 10 Airman Leadership Qualities (ALQs)

Full definitions from the official AF ALQ Writing Guide (Jan 2023):

### MPA 1: Executing the Mission
*Effectively uses knowledge, initiative, and adaptability to produce timely, high quality/quantity results to positively impact the mission.*

| ALQ | Definition |
|-----|-----------|
| **Job Proficiency** | Demonstrates knowledge and professional skill in assigned duties, achieving positive results and impact in support of the mission. |
| **Initiative** | Assesses and takes independent or directed action to complete a task or mission that influences the mission or organization. |
| **Adaptability** | Adjusts to changing conditions, to include plans, information, processes, requirements and obstacles in accomplishing the mission. |

### MPA 2: Leading People
*Fosters cohesive teams, effectively communicates, and uses emotional intelligence to take care of people and accomplish the mission.*

| ALQ | Definition |
|-----|-----------|
| **Inclusion & Teamwork** | Collaborates effectively with others to achieve an inclusive climate in pursuit of a common goal or to complete a task or mission. |
| **Emotional Intelligence** | Exercises self-awareness, manages their own emotions effectively; demonstrates an understanding of others' emotions, and appropriately manages relationships. |
| **Communication** | Articulates information in a clear and timely manner, both verbally and non-verbally, through active listening and messaging tailored to the appropriate audience. |

### MPA 3: Managing Resources
*Manages assigned resources effectively and takes responsibility for actions/behaviors to maximize organizational performance.*

| ALQ | Definition |
|-----|-----------|
| **Stewardship** | Demonstrates responsible management of assigned resources, which may include time, equipment, people, funds and/or facilities. |
| **Accountability** | Takes responsibility for the actions and behaviors of self and/or team; demonstrates reliability and transparency. |

### MPA 4: Improving the Unit
*Demonstrates critical thinking and fosters innovation to find creative solutions and improve mission execution.*

| ALQ | Definition |
|-----|-----------|
| **Decision Making** | Makes well-informed, effective and timely decisions under one's control that weigh constraints, risks, and benefits. |
| **Innovation** | Thinks creatively about different ways to solve problems, implements improvements and demonstrates calculated risk-taking. |

---

## Proficiency Levels (5-point scale)

Used internally for feedback only — does NOT appear on the EPB output. But drives the language of the AI-generated statements.

| Level | Description |
|-------|-------------|
| **Needs Improvement** | Member needs further growth to enhance understanding and/or performance. |
| **Developing** | Member understands the quality and how that quality is illustrated in behavior but requires prompting to consistently demonstrate. |
| **Proficient** | Member understands the quality and demonstrates it consistently, illustrated through the Airman's behavior, forming a part of their character. |
| **Highly Proficient** | Member understands the quality and consistently illustrates it in their behavior while influencing other members in the organization to further develop the same quality. |
| **Exceptionally Skilled** | Member consistently illustrates this quality in their behavior and proactively influences others' growth in this quality at an organizational scale. |

### Real Example (from AF Writing Guide) — ALQ: Adaptability

**Needs Improvement:**
> "MSgt Bailey learned a Primary Care Team member tested COVID positive, and, after being prompted, notified her Flight Commander at morning huddle, while waiting for direction on future actions to take."

**Developing:**
> "When MSgt Bailey learned a Primary Care Team member tested COVID positive, she notified her Flight Commander, and, with direction from her leadership, her team was able to determine a plan to resolve the issue."

**Proficient:**
> "Learning a Primary Care Team member tested COVID positive, MSgt Bailey responded professionally with appropriate action adjusting the daily schedule and created a new plan ensuring team coverage."

**Highly Proficient:**
> "MSgt Bailey learned a Primary Care Team member tested COVID positive and, without prompting, empowered a SSgt as Team leader deciding on adjustments, ensuring team coverage and mission accomplishment."

**Exceptionally Skilled:**
> "When a Primary Care Team member tested COVID positive, MSgt Bailey independently acted to empower a SSgt as Team lead ensuring coverage, mentoring them to create/brief new plans to Medical Group for process improvement."

---

## Performance Statement Rules

From AFI 36-2406 and ALQ Writing Guide:

- **Standalone:** Each is a complete sentence — action + impact/result/outcome
- **Plain language:** No uncommon acronyms; only approved AF Acronym & Abbreviation List
- **No clichés:** Avoid "go-to Airman," "consummate professional," "truly outstanding," etc.
- **Specific:** Who, what, when, where, why readable by an outsider
- **Quantified:** Include numbers, percentages, dollar values, timeframes where possible
- **Narrative elements:** Scene (context) + person + action + tool/means = strong statement
- **Character limit:** ~150–175 chars per statement; 350 max per MPA block

### Writing Guide Key Guidance

> "Raters are encouraged to refer to the 10 ALQs when writing Performance Statements, but should not attempt to include them all. Instead, select noteworthy anecdotes that are representative of the Airman's behaviors and achievements in the context of their position and rank."

> AVOID: Overly clichéd superlatives, over-the-top praise, or overly common descriptors.
> AVOID: Overly general or vague statements.

---

## Data Model

### UserProfile
```typescript
interface UserProfile {
  name?: string;
  rank: AirmanRank;           // E1–E9
  afsc: string;               // e.g. "3P0X1"
  afscTitle?: string;         // e.g. "Security Forces"
  component: 'RegAF' | 'AFR' | 'ANG';
  reportingPeriodEnd?: string; // ISO date string (SCOD)
  isPro: boolean;
}
```

### LogEntry (Thought Dump)
```typescript
interface LogEntry {
  id: string;
  createdAt: string;          // ISO date
  eventDate?: string;         // when it happened
  
  // Input mode
  inputMode: 'freeform' | 'structured';
  
  // Freeform
  rawText?: string;
  
  // Structured (guided input)
  action?: string;            // What did you do?
  outcome?: string;           // What was the result?
  metrics?: string;           // Any numbers? (people, $, %, time)
  context?: string;           // Scene-setting (optional)
  
  // Tagging
  mpa: MPA;                   // Which of 4 MPAs
  alq?: ALQ;                  // Optional: which of 10 ALQs
  proficiencyTarget?: ProficiencyLevel; // What level to write toward
  
  // AI output
  draftStatements?: string[]; // AI-generated options (usually 2)
  selectedStatement?: string; // User-approved final
  characterCount?: number;
  
  isFavorited: boolean;
  status: 'draft' | 'polished' | 'finalized';
}
```

### MPABlock
```typescript
interface MPABlock {
  mpa: MPA;
  statements: string[];       // ordered, finalized statements
  characterCount: number;     // sum, must stay ≤ 350
}
```

### Enums
```typescript
type AirmanRank = 'AB' | 'Amn' | 'A1C' | 'SrA' | 'SSgt' | 'TSgt' | 'MSgt' | 'SMSgt' | 'CMSgt';

type MPA = 
  | 'executing_the_mission'
  | 'leading_people'
  | 'managing_resources'
  | 'improving_the_unit';

type ALQ =
  // Executing the Mission
  | 'job_proficiency' | 'initiative' | 'adaptability'
  // Leading People
  | 'inclusion_teamwork' | 'emotional_intelligence' | 'communication'
  // Managing Resources
  | 'stewardship' | 'accountability'
  // Improving the Unit
  | 'decision_making' | 'innovation';

type ProficiencyLevel = 
  | 'needs_improvement' | 'developing' | 'proficient' 
  | 'highly_proficient' | 'exceptionally_skilled';
```

---

## AI Prompt Template

```
SYSTEM:
You are an expert Air Force EPB (Enlisted Performance Brief) performance statement writer.
You write in narrative-style plain language per the official AF ALQ Writing Guide (Jan 2023).
You are helping an enlisted Airman prepare their own self-assessment input.

RULES:
- Each statement is standalone: [action] + [at least one impact, result, or outcome]
- Target length: 150–175 characters per statement (hard max: 175)
- Use plain English. Only approved AF acronyms (per AFPC list)
- No clichés: avoid "go-to Airman", "consummate professional", "truly outstanding", etc.
- Include quantified data (numbers, percentages, dollar amounts, timeframes) where provided
- Narrative formula: scene + person + action + tool/means = strong statement
- Write in third person (e.g., "SrA Smith led..." or use rank + last name)

CONTEXT:
- Ratee Rank: {rank}
- AFSC: {afsc} ({afscTitle})
- MPA: {mpaLabel}
- MPA Definition: {mpaDefinition}
- ALQ Focus: {alqLabel}
- ALQ Definition: {alqDefinition}
- Target Proficiency Level: {proficiencyLevel}
- Proficiency Description: {proficiencyDescription}

PROFICIENCY EXAMPLE FOR THIS ALQ:
{fewShotExample}

INPUT FROM AIRMAN:
{userInput}

OUTPUT:
Generate exactly 2 performance statement options.
Format as:
Option 1: [statement] ({charCount} chars)
Option 2: [statement] ({charCount} chars)

Do not include any preamble, explanation, or markdown. Just the two options.
```

---

## AFSC Context Strategy

The eprbulletsafsc.com site has example bullets for 100+ AFSCs. For each AFSC in user onboarding, inject 2–3 examples from that AFSC as additional few-shot examples in the system prompt. This is the primary competitive moat vs. generic AI tools.

AFSCs to prioritize for launch (highest enlisted headcount):
- 3P0X1 Security Forces
- 2A5X1 Aerospace Maintenance
- 1C7X1 Airfield Management
- 3D1X2 Cyber Transport
- 4N0X1 Aerospace Medical Service
- 2T1X1 Vehicle Operations
- 6F0X1 Financial Management
- 3F0X1 Personnel

---

## Screen Architecture

```
app/
  (onboarding)/
    index.tsx         — Welcome + value prop
    rank.tsx          — Rank selection
    afsc.tsx          — AFSC search/select
    component.tsx     — RegAF / AFR / ANG
    scod.tsx          — Reporting period end date
  
  (tabs)/
    index.tsx         — Dashboard / MPA overview
    log.tsx           — Thought dump log list
    builder.tsx       — EPB builder (4 MPA blocks)
    profile.tsx       — Settings + subscription
  
  log/
    new.tsx           — New log entry (freeform or structured)
    [id].tsx          — Edit / view log entry
  
  polish/
    [id].tsx          — AI polish flow for a log entry
  
  paywall.tsx         — RevenueCat paywall
```

---

## Monetization

| Tier | Price | What's Included |
|------|-------|-----------------|
| Free | $0 | Unlimited logging, 5 AI polishes/month |
| Pro Monthly | $3.99/mo | Unlimited AI polishes, export, AFSC context, reminders |
| Pro Annual | $24.99/yr | Same as monthly |
| Lifetime | $14.99 | Everything, forever |

**Paywall trigger:** Day 7 gate — user hits paywall on their 6th AI polish attempt.

**RevenueCat product IDs (suggested):**
- `briefbuilder_pro_monthly`
- `briefbuilder_pro_annual`
- `briefbuilder_lifetime`

---

## Feature Roadmap

### MVP (Ship This)
- [x] Onboarding (rank, AFSC, component, SCOD)
- [x] Thought dump log — freeform + structured input
- [x] MPA + ALQ tagging per entry
- [x] AI polish flow (2 statement options)
- [x] 4 MPA blocks with 350-char counters
- [x] Copy-to-clipboard per block
- [x] RevenueCat paywall (day 7, 5 free polishes)

### Phase 2
- [ ] Push notification reminders ("You haven't logged in 2 weeks")
- [ ] Duty Description AI builder
- [ ] Bullet strength scorer (specificity, quantification, verb strength)
- [ ] EPB preview mockup (visual representation of filled form)
- [ ] iCloud sync

### Phase 3
- [ ] Rater mode — supervisor reviews subordinate bullets
- [ ] Export as formatted PDF
- [ ] Widget (iOS) — quick-add from home screen

---

## ASO

**App Name:** `BriefBuilder: AF EPB Bullet Writer`
*(alt: `EPB Bullets: AF Eval Assistant`)*

**Subtitle:** `Write Your EPB Bullets All Year`

**Keywords (high intent):**
epb bullets, epr bullets, air force epb, epb writer, af evaluation, afsc bullets, enlisted eval, epb helper, af epr tool, air force promotion, performance brief, airman evaluation

**Target demographic:** ~330,000 active duty enlisted AF members; primary SrA–SSgt

---

## Competitive Landscape

| Tool | What it does | Gap |
|------|-------------|-----|
| eprbulletsafsc.com | Static bullet examples by AFSC | No AI, no app, no capture |
| rapidepr.com | Web-based EPR generator | No year-round capture, generic |
| narrative-buddy.com | Narrative writing helper | Not AF-specific |
| ChatGPT direct | AI generation | No AF structure, no capture habit |

**Our moat:** Year-round capture habit + AFSC-specific AI + 350-char enforced format + ALQ alignment

---

## Key References

- AFI 36-2406 (22 Aug 2025, with guidance memo AFGM2026-01 dated 7 Aug 2026) — governing instruction
- AF Form 716 (20240109) — universal EPB offline form
- ALQ Writing Guide v1 (10 Jan 2023) — official performance statement guide
- EPB-AI-Workshop slides — AF-produced training on AI for EPB writing
- eprbulletsafsc.com — AFSC-specific example bullets
- AFPC Acronym & Abbreviation List: https://www.afpc.af.mil/Career-Management/Acronyms/

---

## Developer Notes

- Ray's standard: PowerShell-compatible commands (not bash)
- Prefer complete working files over partial diffs
- Accuracy over speed on technical details
- Same stack as other DahVio apps: RN + Expo + RevenueCat + EAS
- No backend for MVP — all local storage
- Claude API key handled via environment variable `ANTHROPIC_API_KEY`

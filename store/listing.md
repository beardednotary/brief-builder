# BriefBuilder store listing

Lengths were counted by Applyra's `check_metadata` on 2026-11-16 and every
field passed for its store. Keyword scores are Applyra `inspect_keyword`,
App Store, US, en-US, 2026-11-16.

## App Store (iOS)

| Field | Value | Length |
|---|---|---|
| App name | `BriefBuilder: Air Force EPB` | 27 / 30 |
| Subtitle | `USAF Eval & EPR Bullet Writer` | 29 / 30 |
| Keywords | `myeval,airman,enlisted,performance,statement,review,brag,sheet,waps,afsc,nco,log,military,evals,alq` | 99 / 100 |
| Primary category | Productivity | |
| Secondary category | Business | |
| Age rating | 4+ | |
| Price | Free, with in-app purchases | |
| Support URL | https://dahvio.com/epb-builder-support | |
| Marketing URL | https://dahvio.com/epb-builder | |
| Privacy Policy URL | https://dahvio.com/epb-builder-privacy | |
| Licence agreement | Apple's standard EULA (linked in the description and on the paywall) | |

### Why these words

| Keyword | Difficulty | Traffic | Where it is covered |
|---|---|---|---|
| epb | 34 | 92 | Name. Mostly people looking for the EPB utility company, but it is the word Airmen type. |
| usaf | 24 | 84 | Subtitle |
| epr | 18 | 96 | Subtitle. Mostly off-intent, but low difficulty, and "EPR Writer" ranks #5 on it. |
| myeval | 16 | 59 | Keywords |
| evals | 12 | 48 | Keywords |
| air force waps | 21 | 25 | Name + keywords. Same audience as WAPS Study. |
| air force epb | 17 | 15 | Name. The exact-intent phrase. No app with "EPB" in an Air Force sense ranks in its top 20 today. |
| epr bullets, epb bullets, air force eval, bullet writer | 14-15 | 8 | Name + subtitle. 8 looks like Applyra's floor value, so read it as "too small to measure". |

Left out on purpose: `promotion` (Applyra flagged it as reading like a price
promotion under App Review 2.3.7), `ncoer` (Army), `1206` (Chinese rail apps
own it).

### Promotional text (170 max, editable without a new build)

```
Stop rebuilding your year from memory. Log wins in 30 seconds, then let AI write EPB performance statements that fit the 350-character block.
```

### Description

```
Most EPBs get written in one stressful week, from a year you can barely remember. BriefBuilder fixes that.

Log what you did in 30 seconds, the day it happens. When your close-out date gets close, BriefBuilder turns each entry into a performance statement the way AFI 36-2406 asks for it: action first, then impact, in plain language, inside the 350-character limit for each block.

LOG IT WHILE YOU REMEMBER IT
• Quick entries: what you did, who it helped, and the numbers
• Tag each entry to a Major Performance Area and an Airman Leadership Quality
• Reminders, so a busy month does not go unrecorded
• A countdown to your static close-out date, set by your rank

WRITE PERFORMANCE STATEMENTS, NOT OLD EPR BULLETS
• AI writes two statement options from each log entry
• Action plus impact, with your numbers, dollars, percentages and time saved kept in
• Plain language. No "consummate professional", no "go-to Airman"
• A live character count on every statement and every block
• Not quite right? Ask for another version

BUILD ALL FOUR BLOCKS
• Executing the Mission
• Leading People
• Managing Resources
• Improving the Unit
See which blocks are done and which still need a statement, then copy a finished block and paste it into myEval.

MADE FOR ENLISTED AIRMEN
• Every rank from AB to CMSgt
• Regular Air Force, Air Force Reserve and Air National Guard
• All 10 Airman Leadership Qualities, sorted under the block each belongs to
• Links to AFI 36-2406, AF Form 716 and the approved acronym list

YOUR NOTES STAY ON YOUR PHONE
There is no account and no sign-up. Your profile, log entries and EPB blocks are stored on your device. When you ask for a statement, that one entry is sent to an AI service to write it, and BriefBuilder does not keep it. Never enter classified or controlled information.

FREE AND PRO
Free: unlimited logging, the full EPB builder, reminders, and 5 AI-written statements.
Pro: unlimited AI writing, plus statements tuned to your AFSC. Choose monthly, annual, or a one-time lifetime purchase.
Have a friend who is behind on their EPB? Share your code. They get a free month of Pro, and you get one when they write their first statement.

BriefBuilder is an independent app. It is not affiliated with, endorsed by, or sponsored by the U.S. Air Force or the Department of Defense. Evaluation rules come from AFI 36-2406, published at e-publishing.af.mil. You are responsible for the accuracy of your own evaluation.

Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://dahvio.com/epb-builder-privacy
```

2,585 / 4,000 (rechecked 2026-11-17 after removing two claims the app does not
back up: editing a statement's text, and ALQ definitions).

### What's New (version 1.0.0)

```
First release. Log accomplishments all year and let AI write your EPB performance statements.
```

## In-app purchases

Product IDs must match `services/revenueCat.ts` exactly.

| Product ID | Type | Price | Display name | Description (45 max) |
|---|---|---|---|---|
| `briefbuilder_pro_monthly` | Auto-renewable, 1 month | $3.99 | Pro Monthly | Unlimited AI statement writing |
| `briefbuilder_pro_annual` | Auto-renewable, 1 year | $14.99 | Pro Annual | Unlimited AI statement writing, billed yearly |
| `briefbuilder_lifetime1` | Non-consumable | $24.99 | Pro Lifetime | Unlimited AI statement writing, pay once |

- Subscription group: `BriefBuilder Pro`, with Annual ranked above Monthly so
  a switch from monthly to annual counts as an upgrade.
- Each product needs a review screenshot: use the paywall.
- Google Play: one subscription per ID with a single base plan each (the app
  matches `product_id:base_plan_id`), and `briefbuilder_lifetime1` as a one-time
  product.

RevenueCat: entitlement `pro` with all three products attached, and one
current offering holding the three packages.

## App privacy answers (App Store Connect)

Tracking: **No**.

| Data type | Collected | Purpose | Linked to the user |
|---|---|---|---|
| Purchases → Purchase History | Yes (RevenueCat) | App Functionality | No |
| Identifiers → User ID | Yes (RevenueCat anonymous ID, also kept in the referral ledger) | App Functionality | No |
| User Content → Other User Content | Yes (the log entry, rank, AFSC and component sent to Anthropic to write a statement) | App Functionality | No |

The Worker does not store entry text, but the AI provider keeps API inputs
for a limited time, so declaring User Content is the safe answer. The privacy
page on dahvio.com says the same three things and names Anthropic and
RevenueCat (updated 2026-11-17).

Google Play Data safety: same three items, "collected", not "shared" for
advertising, encrypted in transit. Data deletion: there is no account; data on
the device goes when the app is removed, and the referral record is deleted on
request by emailing the referral code (as the privacy page says).

## Notes for App Review

```
BriefBuilder needs no account or sign-in.

To reach the AI feature: finish the four onboarding screens (any rank, any AFSC). The paywall appears once after onboarding; tap "Start with 5 free writes" or the close button to continue. Then tap Log, add an entry, and tap Write. The app asks permission before the entry is sent to Anthropic's Claude API, which writes the statements. Five AI writes are free; the sixth opens the paywall.

The paywall is also reachable from the Profile tab. Purchases use RevenueCat. Terms of Use and Privacy Policy links are at the bottom of the paywall.

The app is independent and is not affiliated with the U.S. Air Force or the Department of Defense; this is stated in the app on the Profile tab and in the description. The regulations it references (AFI 36-2406, AF Form 716) are public documents linked from the Profile tab.
```

## Google Play

| Field | Value | Length |
|---|---|---|
| App name | `BriefBuilder: Air Force EPB` | 27 / 30 |
| Short description | `Log accomplishments all year. AI writes your Air Force EPB statements.` | 70 / 80 |
| Category | Productivity | |

Full description: the App Store description above, minus the "Terms of Use"
line (that link is Apple's EULA). Play indexes the description, so keep the
"EPR bullets", "myEval" and "Air Force" wording. Play also requires the
"not affiliated with the government" statement and the source link for
government information, both of which the description already has.

## Screenshots

Six, in this order. 6.9" iPhone (1320 x 2868) is the only required iPhone size.
An iPad set is required too while `supportsTablet` is true in `app.json`.

| # | Screen | Caption |
|---|---|---|
| 1 | Statement Writer showing two options with character counts | AI writes your EPB statements |
| 2 | New log entry form | Log it in 30 seconds |
| 3 | EPB Builder with the four blocks and 350 counters | All four blocks, 350 characters each |
| 4 | Dashboard with progress and the close-out countdown | Know where your EPB stands |
| 5 | Statement saved, block progress, "Write the next one" | Action and impact, in plain language |
| 6 | Profile tab referral card | Give a friend a free month |

## Before submitting

- [x] In-app purchases created in App Store Connect, all three Ready to Submit (2026-11-17)
- [ ] In-app purchases created in Play Console
- [x] RevenueCat (iOS): entitlement `pro`, three products, `default` offering; iOS SDK key in `.env` and `eas.json`
- [ ] RevenueCat (Android): Google Play app, products, Android SDK key
- [x] `REVENUECAT_SECRET_KEY` set on the Worker, Worker deployed (2026-11-17)
- [x] dahvio.com privacy page updated (Anthropic, RevenueCat, anonymous install ID, referral counts): live 2026-11-17
- [x] dahvio.com/epb-builder, /epb-builder-support and /epb-builder-privacy respond (checked 2026-11-16)
- [x] Sandbox purchase: Annual (2026-11-17)
- [ ] Sandbox purchase: Monthly and Lifetime, plus a restore
- [ ] Referral redeem between two installs
- [ ] Sandbox check that a second referral grant extends the first
- [ ] Screenshots captured from a real build

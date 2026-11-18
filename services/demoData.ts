// Demo data for App Store screenshots. Development builds only: the button
// that calls this is behind __DEV__ on the Profile tab.
//
// The persona is a Senior Airman in Cyber Transport Systems partway through
// the year, so every screen has something real to show: 5 of 8 statements
// written, one entry with two AI drafts waiting in the Statement Writer, and
// three logged entries not yet written. All numbers are invented.

import { DevSettings } from 'react-native';
import { LogEntry, MPABlock, UserProfile } from '../types';
import * as storage from './storage';

const STATEMENTS = {
  em1: 'Restored network service to 1,200 users after a fiber cut in 3 hrs, 5 hrs faster than standard; kept the command post and flight line online',
  em2: 'Led install of 48 network switches across 6 buildings with zero downtime; quadrupled network capacity for 2,000 wing users',
  lp1: 'Trained 6 Airmen on fiber splicing and testing; flight certified 2 weeks early and repair callbacks dropped 30%',
  lp2: 'Mentored 3 Airmen through their career development courses; all passed end-of-course exams on the first try, averaging 88%',
  mr1: 'Managed $1.4M in network equipment across 3 accounts; zero discrepancies in annual inventory of 2,300 items',
  iuA: 'Built a trouble ticket tracker for 412 network outages; cut average repair time from 3 days to 1.5, restoring service 50% faster for 2,000 users',
  iuB: 'Designed a flight-wide ticket tracker; sped network repairs 50% and gave leaders a live view of all 412 outages across 26 buildings',
};

function block(mpa: MPABlock['mpa'], statements: string[]): MPABlock {
  return { mpa, statements, characterCount: statements.join(' ').length };
}

function finalized(
  id: string,
  createdAt: string,
  mpa: LogEntry['mpa'],
  alq: LogEntry['alq'],
  rawText: string,
  statement: string
): LogEntry {
  return {
    id,
    createdAt,
    inputMode: 'freeform',
    rawText,
    mpa,
    alq,
    draftStatements: [statement],
    writeCount: 1,
    selectedStatement: statement,
    characterCount: statement.length,
    isFavorited: false,
    status: 'finalized',
  };
}

function waiting(
  id: string,
  createdAt: string,
  mpa: LogEntry['mpa'],
  alq: LogEntry['alq'],
  rawText: string
): LogEntry {
  return { id, createdAt, inputMode: 'freeform', rawText, mpa, alq, isFavorited: false, status: 'draft' };
}

// Newest first, the order the app stores them in.
const ENTRIES: LogEntry[] = [
  {
    id: 'demo-iu-tracker',
    createdAt: '2026-11-12T15:20:00.000Z',
    inputMode: 'freeform',
    rawText:
      'Built a SharePoint tracker for trouble tickets so the flight can see open tickets by building. Average fix time went from 3 days to 1.5 days. 412 tickets tracked so far.',
    mpa: 'improving_the_unit',
    alq: 'innovation',
    draftStatements: [STATEMENTS.iuA, STATEMENTS.iuB],
    writeCount: 1,
    isFavorited: false,
    status: 'polished',
  },
  waiting(
    'demo-mr-phone-lines',
    '2026-11-05T19:05:00.000Z',
    'managing_resources',
    'stewardship',
    'Found 40 phone lines nobody was using that we were still paying for. Got them shut off. Saves about $19K a year.'
  ),
  waiting(
    'demo-lp-food-drive',
    '2026-10-24T22:40:00.000Z',
    'leading_people',
    'inclusion_teamwork',
    'Ran the dorm council food drive. 30 volunteers, collected 1,100 lbs of food for the base food pantry.'
  ),
  waiting(
    'demo-em-alert-facility',
    '2026-10-09T13:15:00.000Z',
    'executing_the_mission',
    'adaptability',
    'Fixed the comm outage at the alert facility during the exercise in 45 minutes, crews never lost contact with the command post.'
  ),
  finalized(
    'demo-mr-inventory',
    '2026-09-18T17:30:00.000Z',
    'managing_resources',
    'accountability',
    'Annual inventory done. 3 accounts, 2,300 items, about $1.4M. Zero discrepancies.',
    STATEMENTS.mr1
  ),
  finalized(
    'demo-lp-cdc',
    '2026-08-27T16:00:00.000Z',
    'leading_people',
    'communication',
    'Mentored 3 Airmen through CDCs. All 3 passed EOC first try, avg 88%.',
    STATEMENTS.lp2
  ),
  finalized(
    'demo-lp-fiber-training',
    '2026-07-15T14:45:00.000Z',
    'leading_people',
    'inclusion_teamwork',
    'Taught 6 Airmen fiber splicing and OTDR testing. Flight got certified 2 weeks early. Callbacks on fiber repairs down about 30%.',
    STATEMENTS.lp1
  ),
  finalized(
    'demo-em-switches',
    '2026-06-03T20:10:00.000Z',
    'executing_the_mission',
    'job_proficiency',
    'Led the switch upgrade: 48 switches, 6 buildings, zero downtime. Network capacity is 4x what it was. About 2,000 users.',
    STATEMENTS.em2
  ),
  finalized(
    'demo-em-fiber-cut',
    '2026-04-22T11:25:00.000Z',
    'executing_the_mission',
    'initiative',
    'Contractor cut a fiber line, 1,200 users down. Got it spliced and back up in 3 hours, standard is 8. Command post and flight line stayed up.',
    STATEMENTS.em1
  ),
];

const BLOCKS: MPABlock[] = [
  block('executing_the_mission', [STATEMENTS.em1, STATEMENTS.em2]),
  block('leading_people', [STATEMENTS.lp1, STATEMENTS.lp2]),
  block('managing_resources', [STATEMENTS.mr1]),
  block('improving_the_unit', []),
];

/**
 * Replaces this device's profile, log and EPB blocks with the demo set, then
 * reloads the app so every screen picks it up. Keeps the current Pro status,
 * which RevenueCat controls anyway.
 */
export async function loadDemoData(): Promise<void> {
  const current = await storage.getProfile();
  const profile: UserProfile = {
    rank: 'SrA',
    afsc: '3D1X2',
    afscTitle: 'Cyber Transport Systems',
    component: 'RegAF',
    reportingPeriodEnd: '2027-03-31',
    isPro: current?.isPro ?? false,
  };
  await storage.saveProfile(profile);
  await storage.saveLogEntries(ENTRIES);
  await storage.saveMPABlocks(BLOCKS);
  await storage.resetPolishCount();
  await storage.setOnboardingComplete();
  // Skip the one-time AI permission prompt so it is not in a screenshot.
  await storage.setAiConsent();
  DevSettings.reload();
}

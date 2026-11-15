import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry, MPABlock, UserProfile } from '../types';

const KEYS = {
  PROFILE: '@briefbuilder/profile',
  LOG_ENTRIES: '@briefbuilder/log_entries',
  MPA_BLOCKS: '@briefbuilder/mpa_blocks',
  POLISH_COUNT: '@briefbuilder/polish_count',
  ONBOARDING_COMPLETE: '@briefbuilder/onboarding_complete',
} as const;

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// ── Log Entries ───────────────────────────────────────────────────────────────

export async function getLogEntries(): Promise<LogEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.LOG_ENTRIES);
  return raw ? (JSON.parse(raw) as LogEntry[]) : [];
}

export async function saveLogEntries(entries: LogEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.LOG_ENTRIES, JSON.stringify(entries));
}

// ── MPA Blocks ────────────────────────────────────────────────────────────────

export async function getMPABlocks(): Promise<MPABlock[]> {
  const raw = await AsyncStorage.getItem(KEYS.MPA_BLOCKS);
  return raw ? (JSON.parse(raw) as MPABlock[]) : [];
}

export async function saveMPABlocks(blocks: MPABlock[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MPA_BLOCKS, JSON.stringify(blocks));
}

// ── Polish Count (free tier gate) ─────────────────────────────────────────────

export async function getPolishCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.POLISH_COUNT);
  return raw ? parseInt(raw, 10) : 0;
}

export async function incrementPolishCount(): Promise<number> {
  const count = await getPolishCount();
  const next = count + 1;
  await AsyncStorage.setItem(KEYS.POLISH_COUNT, String(next));
  return next;
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export async function isOnboardingComplete(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
  return raw === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
}

// ── Dev / Reset ───────────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

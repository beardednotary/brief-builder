import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry, MPABlock, UserProfile } from '../types';

const KEYS = {
  PROFILE: '@briefbuilder/profile',
  LOG_ENTRIES: '@briefbuilder/log_entries',
  MPA_BLOCKS: '@briefbuilder/mpa_blocks',
  POLISH_COUNT: '@briefbuilder/polish_count',
  ONBOARDING_COMPLETE: '@briefbuilder/onboarding_complete',
  REMINDER_SETTINGS: '@briefbuilder/reminder_settings',
  REVIEW_STATE: '@briefbuilder/review_state',
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

// ── Reminders ─────────────────────────────────────────────────────────────────

export type ReminderFrequencyDays = 7 | 14 | 30;

export interface ReminderSettings {
  enabled: boolean;
  frequencyDays: ReminderFrequencyDays;
  /** True once the app has offered reminders, so it only offers once. */
  prompted: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  frequencyDays: 14,
  prompted: false,
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(KEYS.REMINDER_SETTINGS);
  return raw
    ? { ...DEFAULT_REMINDER_SETTINGS, ...(JSON.parse(raw) as Partial<ReminderSettings>) }
    : DEFAULT_REMINDER_SETTINGS;
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.REMINDER_SETTINGS, JSON.stringify(settings));
}

// ── Review prompt ─────────────────────────────────────────────────────────────

export interface ReviewState {
  askCount: number;
  lastAskedAt?: string; // ISO date
}

export async function getReviewState(): Promise<ReviewState> {
  const raw = await AsyncStorage.getItem(KEYS.REVIEW_STATE);
  return raw ? (JSON.parse(raw) as ReviewState) : { askCount: 0 };
}

export async function saveReviewState(state: ReviewState): Promise<void> {
  await AsyncStorage.setItem(KEYS.REVIEW_STATE, JSON.stringify(state));
}

// ── Dev / Reset ───────────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

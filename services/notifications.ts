// Local reminders. Everything is scheduled on the device — there is no push
// server and no push token is ever requested or stored.

import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as storage from './storage';
import { ReminderSettings } from './storage';

const CHANNEL_ID = 'reminders';
const LOG_NUDGE_COUNT = 6;
const LOG_NUDGE_HOUR = 18; // 6 PM local
const SCOD_HOUR = 9; // 9 AM local
const SCOD_MILESTONES = [90, 60, 30, 14, 7]; // days before close-out
const DAY_MS = 24 * 60 * 60 * 1000;

const LOG_NUDGES: { title: string; body: string }[] = [
  {
    title: 'Log it while you remember',
    body: 'What did you get done lately? Thirty seconds now saves you at EPB time.',
  },
  {
    title: 'Anything worth an EPB statement?',
    body: 'A task you led, a problem you fixed, a number you moved. Add it to your log.',
  },
  {
    title: 'Your EPB is built all year',
    body: "Drop in what you've done since your last entry before the details fade.",
  },
  {
    title: 'Quick log check',
    body: 'Training, inspections, extra duties, volunteer work. If it happened, log it.',
  },
];

let configured = false;

/** Call once before scheduling or presenting notifications. */
export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      description: 'Reminders to log accomplishments and prepare for your close-out date.',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

function isGranted(status: Notifications.NotificationPermissionsStatus): boolean {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function hasNotificationPermission(): Promise<boolean> {
  return isGranted(await Notifications.getPermissionsAsync());
}

/** Shows the system permission prompt if it has not been answered yet. */
export async function requestNotificationPermission(): Promise<boolean> {
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (isGranted(current)) return true;
  if (!current.canAskAgain) return false;
  return isGranted(await Notifications.requestPermissionsAsync());
}

function atHour(date: Date, hour: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0);
}

function parseLocalDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

async function schedule(date: Date, title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

export interface ReminderContext {
  /** ISO timestamp of the most recent log entry, if any. */
  lastEntryAt?: string;
  /** Close-out date as YYYY-MM-DD, if set. */
  scod?: string;
}

/**
 * Replaces every scheduled reminder with a fresh set based on the user's
 * settings, their most recent log entry, and their close-out date. Safe to
 * call often: it is how reminders stay "N days since your last entry".
 */
export async function syncReminders(
  settings: ReminderSettings,
  context: ReminderContext
): Promise<void> {
  await configureNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return;
  if (!(await hasNotificationPermission())) return;

  const now = new Date();
  const intervalMs = settings.frequencyDays * DAY_MS;

  // Log nudges: every N days counted from the last entry, so logging pushes
  // the next reminder back and nobody is nagged right after they log.
  const last = context.lastEntryAt ? new Date(context.lastEntryAt) : now;
  const base = isNaN(last.getTime()) ? now : last;
  let next = atHour(new Date(base.getTime() + intervalMs), LOG_NUDGE_HOUR);
  if (next <= now) {
    next = atHour(new Date(now.getTime() + DAY_MS), LOG_NUDGE_HOUR);
  }
  for (let i = 0; i < LOG_NUDGE_COUNT; i += 1) {
    const when = new Date(next.getTime() + i * intervalMs);
    const message = LOG_NUDGES[i % LOG_NUDGES.length];
    await schedule(atHour(when, LOG_NUDGE_HOUR), message.title, message.body);
  }

  // Close-out countdown.
  const scod = context.scod ? parseLocalDate(context.scod) : null;
  if (scod) {
    for (const days of SCOD_MILESTONES) {
      const when = atHour(new Date(scod.getTime() - days * DAY_MS), SCOD_HOUR);
      if (when <= now) continue;
      await schedule(
        when,
        `${days} days to your close-out date`,
        days > 30
          ? 'Turn your log into EPB statements now, while there is time to revise them.'
          : 'Check your four EPB blocks and finish any statements you still need.'
      );
    }
  }
}

/** Reads settings from storage and re-syncs. Never throws. */
export async function syncRemindersFromStorage(context: ReminderContext): Promise<void> {
  try {
    const settings = await storage.getReminderSettings();
    await syncReminders(settings, context);
  } catch (err) {
    console.warn('Could not sync reminders', err);
  }
}

/**
 * Offers reminders one time, after the user has saved a log entry and so has
 * a reason to want them. The system permission prompt only appears if they
 * say yes. Never throws.
 */
export async function offerRemindersOnce(context: ReminderContext): Promise<void> {
  try {
    const settings = await storage.getReminderSettings();
    if (settings.prompted || settings.enabled) return;
    await storage.saveReminderSettings({ ...settings, prompted: true });

    Alert.alert(
      'Keep the habit going?',
      'BriefBuilder can remind you every 2 weeks to log what you have done, and count down to your close-out date. You can change this any time in Profile.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Remind me',
          onPress: async () => {
            try {
              if (!(await requestNotificationPermission())) return;
              const next: ReminderSettings = { ...settings, enabled: true, prompted: true };
              await storage.saveReminderSettings(next);
              await syncReminders(next, context);
            } catch (err) {
              console.warn('Could not enable reminders', err);
            }
          },
        },
      ]
    );
  } catch (err) {
    console.warn('Could not offer reminders', err);
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Could not cancel reminders', err);
  }
}

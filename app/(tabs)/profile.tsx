import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useLogEntries } from '../../hooks/useLogEntries';
import * as storage from '../../services/storage';
import {
  DEFAULT_REMINDER_SETTINGS,
  ReminderFrequencyDays,
  ReminderSettings,
} from '../../services/storage';
import {
  cancelAllReminders,
  requestNotificationPermission,
  syncReminders,
} from '../../services/notifications';
import { FREE_POLISH_LIMIT } from '../../hooks/usePolish';
import ReferralCard from '../../components/referral/ReferralCard';
import {
  DAHVIO_APPS,
  ExternalLink,
  OFFICIAL_REFERENCES,
  PRIVACY_URL,
  SUPPORT_URL,
} from '../../constants/links';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const FREQUENCIES: { days: ReminderFrequencyDays; label: string }[] = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Every 2 weeks' },
  { days: 30, label: 'Monthly' },
];

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open link', url);
  }
}

function LinkRow({ link, last }: { link: ExternalLink; last: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.linkRow, !last && styles.linkRowDivider]}
      onPress={() => openLink(link.url)}
      activeOpacity={0.7}
    >
      <View style={styles.linkText}>
        <Text style={styles.linkLabel}>{link.label}</Text>
        <Text style={styles.linkDetail}>{link.detail}</Text>
      </View>
      <Text style={styles.linkArrow}>↗</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { entries } = useLogEntries();
  const [polishCount, setPolishCount] = useState(0);
  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);

  // Tabs stay mounted, so reload each time the tab comes into focus.
  useFocusEffect(
    useCallback(() => {
      storage.getPolishCount().then(setPolishCount);
      storage.getReminderSettings().then(setReminders);
    }, [])
  );

  const applyReminders = async (next: ReminderSettings) => {
    setReminders(next);
    await storage.saveReminderSettings(next);
    await syncReminders(next, {
      lastEntryAt: entries[0]?.createdAt,
      scod: profile?.reportingPeriodEnd,
    });
  };

  const toggleReminders = async (enabled: boolean) => {
    if (!enabled) {
      await applyReminders({ ...reminders, enabled: false, prompted: true });
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        'Notifications are off',
        'Turn on notifications for BriefBuilder in your device settings, then try again.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    await applyReminders({ ...reminders, enabled: true, prompted: true });
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset App',
      'This will delete all log entries, EPB blocks, and your profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await cancelAllReminders();
            await storage.clearAll();
            router.replace('/(onboarding)');
          },
        },
      ]
    );
  };

  if (!profile) return null;

  const remaining = Math.max(0, FREE_POLISH_LIMIT - polishCount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Profile</Text>

        {/* Identity card */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{profile.rank}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.afsc}>
                {profile.afsc}
                {profile.afscTitle ? ` · ${profile.afscTitle}` : ''}
              </Text>
              <Text style={styles.component}>{profile.component}</Text>
              {profile.reportingPeriodEnd && (
                <Text style={styles.scod}>
                  SCOD: {formatDate(profile.reportingPeriodEnd)}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/(onboarding)/rank')}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* AI usage */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Writes</Text>
          {profile.isPro ? (
            <Text style={styles.proStatus}>✓ Pro — Unlimited AI writing</Text>
          ) : (
            <>
              <Text style={styles.usageText}>
                {polishCount} of {FREE_POLISH_LIMIT} free writes used
              </Text>
              <View style={styles.usageTrack}>
                <View
                  style={[
                    styles.usageFill,
                    { width: `${Math.min(polishCount / FREE_POLISH_LIMIT, 1) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.usageSub}>
                {remaining} free write{remaining !== 1 ? 's' : ''} remaining
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => router.push('/paywall')}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Pro →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <ReferralCard />

        {/* Reminders */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reminders</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Remind me to log</Text>
              <Text style={styles.switchDetail}>
                A nudge when you haven't logged in a while, plus a countdown to your close-out
                date.
              </Text>
            </View>
            <Switch
              value={reminders.enabled}
              onValueChange={toggleReminders}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor="#fff"
            />
          </View>

          {reminders.enabled && (
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => {
                const active = reminders.frequencyDays === f.days;
                return (
                  <TouchableOpacity
                    key={f.days}
                    style={[styles.freqChip, active && styles.freqChipActive]}
                    onPress={() => applyReminders({ ...reminders, frequencyDays: f.days })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.freqText, active && styles.freqTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Official references */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Official References</Text>
          {OFFICIAL_REFERENCES.map((link, i) => (
            <LinkRow key={link.label} link={link} last={i === OFFICIAL_REFERENCES.length - 1} />
          ))}
        </View>

        {/* Other apps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>More Air Force Apps from DahVio Studios</Text>
          {DAHVIO_APPS.map((link, i) => (
            <LinkRow key={link.label} link={link} last={i === DAHVIO_APPS.length - 1} />
          ))}
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.aboutText}>
            BriefBuilder v1.0.0{'\n'}
            EPB performance statements in plain language, per AFI 36-2406 and the ALQ Writing
            Guide.
          </Text>
          <Text style={styles.disclaimer}>
            BriefBuilder is an independent app. It is not affiliated with or endorsed by the U.S.
            Air Force or the Department of Defense. Never enter classified or controlled
            information.
          </Text>
          <View style={styles.aboutLinks}>
            <TouchableOpacity onPress={() => openLink(SUPPORT_URL)}>
              <Text style={styles.aboutLink}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(PRIVACY_URL)}>
              <Text style={styles.aboutLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <TouchableOpacity style={styles.resetBtn} onPress={confirmReset}>
          <Text style={styles.resetText}>Reset App Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  heading: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  rankBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },
  identityInfo: { flex: 1 },
  afsc: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  component: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  scod: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  editBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  editBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  cardTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  proStatus: { fontSize: FontSize.md, color: Colors.success, fontWeight: '600' },
  usageText: { fontSize: FontSize.sm, color: Colors.text, marginBottom: Spacing.sm },
  usageTrack: {
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  usageFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
  usageSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  upgradeBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  upgradeBtnText: { color: Colors.onAccent, fontWeight: '700', fontSize: FontSize.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  switchText: { flex: 1 },
  switchLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  switchDetail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  freqRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  freqChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  freqChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  freqText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.text },
  freqTextActive: { color: '#fff' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  linkRowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  linkText: { flex: 1 },
  linkLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primaryLight },
  linkDetail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  linkArrow: { fontSize: FontSize.lg, color: Colors.textLight },
  aboutText: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20 },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 17,
    marginTop: Spacing.sm,
  },
  aboutLinks: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  aboutLink: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primaryLight },
  resetBtn: {
    borderWidth: 1.5,
    borderColor: Colors.error + '44',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resetText: { color: Colors.error, fontWeight: '600', fontSize: FontSize.sm },
});

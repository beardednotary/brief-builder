import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AirmanRank, Component } from '../../types';
import { useProfile } from '../../hooks/useProfile';
import { checkProStatus } from '../../services/revenueCat';
import { redeemReferralCode } from '../../services/referrals';
import * as storage from '../../services/storage';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

// Static close-out dates per AFI 36-2406 (22 Aug 2025), Tables 4.4 and 4.5.
// [month, day, Guard/Reserve non-AGR cycle]. RegAF closes out every year;
// Guard/Reserve non-AGR close out every two years on the listed year parity.
type ArcCycle = 'even' | 'odd';
const RANK_SCOD: Record<AirmanRank, [number, number, ArcCycle]> = {
  AB:    [3, 31, 'even'],
  Amn:   [3, 31, 'even'],
  A1C:   [3, 31, 'even'],
  SrA:   [3, 31, 'even'],
  SSgt:  [1, 31, 'odd'],
  TSgt:  [11, 30, 'even'],
  MSgt:  [9, 30, 'odd'],
  SMSgt: [7, 31, 'even'],
  CMSgt: [5, 31, 'odd'],
};

function closesOutIn(year: number, rank: AirmanRank, component: Component): boolean {
  if (component === 'RegAF') return true;
  // AFR CMSgts close out annually; ANG CMSgts on odd years.
  if (rank === 'CMSgt' && component === 'AFR') return true;
  const cycle = RANK_SCOD[rank][2];
  return cycle === 'even' ? year % 2 === 0 : year % 2 === 1;
}

function calcSCOD(rank: AirmanRank, component: Component): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [month, day] = RANK_SCOD[rank];
  let year = today.getFullYear();
  while (!closesOutIn(year, rank, component) || new Date(year, month - 1, day) < today) {
    year += 1;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SCODScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  const rank: AirmanRank = profile?.rank ?? 'SrA';
  const component: Component = profile?.component ?? 'RegAF';
  const suggestedSCOD = calcSCOD(rank, component);
  const [scod, setScod] = useState(suggestedSCOD);
  const [overriding, setOverriding] = useState(false);
  const [overrideText, setOverrideText] = useState('');

  // This screen is also the last step of Edit Profile. The referral code
  // field only belongs in first-time setup.
  const [firstRun, setFirstRun] = useState(false);
  useEffect(() => {
    storage.isOnboardingComplete().then((done) => setFirstRun(!done));
  }, []);

  const [hasCode, setHasCode] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [finishing, setFinishing] = useState(false);

  // offerPro: show the paywall once, right after first-time setup, so new
  // users see what Pro adds before they start. Never when editing the
  // profile, and never right after a referral code has given them Pro.
  const finish = async (offerPro = false) => {
    await saveProfile({ reportingPeriodEnd: scod });
    await storage.setOnboardingComplete();
    router.replace('/(tabs)');
    if (offerPro && firstRun) {
      router.push({ pathname: '/paywall', params: { from: 'onboarding' } });
    }
  };

  const handleFinish = async () => {
    if (finishing) return;
    const code = referralCode.trim();
    if (!code) {
      await finish(true);
      return;
    }

    setFinishing(true);
    try {
      const status = await redeemReferralCode(code);
      // The free month arrives through RevenueCat, so ask it for fresh status.
      const isPro = await checkProStatus(true);
      if (isPro !== null) await saveProfile({ isPro });
      Alert.alert(
        'Code accepted',
        status.justGranted > 0
          ? 'You have a free month of Pro: unlimited AI writing, starting now.'
          : 'Your free month has been saved to this device.',
        [{ text: 'Start Building', onPress: () => finish() }],
        { cancelable: false }
      );
    } catch (err) {
      setFinishing(false);
      Alert.alert('Code not accepted', err instanceof Error ? err.message : 'Try again.', [
        { text: 'Fix it', style: 'cancel' },
        { text: 'Skip for now', onPress: () => finish(true) },
      ]);
    }
  };

  const applyOverride = () => {
    const trimmed = overrideText.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      setScod(trimmed);
      setOverriding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 4 of 4</Text>
        <Text style={styles.title}>Your close-out date</Text>
        <Text style={styles.subtitle}>
          This is your Static Close-Out Date (SCOD) — the end of your EPB reporting period.
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.scodCard}>
          <Text style={styles.scodLabel}>
            Based on {rank} ({component}), your SCOD is:
          </Text>
          <Text style={styles.scodDate}>{formatDate(scod)}</Text>
          {component !== 'RegAF' && scod === suggestedSCOD && (
            <Text style={styles.arcNote}>
              Guard and Reserve non-AGR Airmen close out every two years. If you are AGR or on a
              Stat Tour, you follow the active-duty schedule — change the date below.
            </Text>
          )}
          {scod !== suggestedSCOD && (
            <Text style={styles.overrideNote}>
              (Manually set — suggested: {formatDate(suggestedSCOD)})
            </Text>
          )}
        </View>

        {!overriding ? (
          <TouchableOpacity onPress={() => setOverriding(true)}>
            <Text style={styles.overrideLink}>This doesn't look right — change it</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.overrideBox}>
            <Text style={styles.overrideHint}>Enter date as YYYY-MM-DD</Text>
            <View style={styles.overrideRow}>
              <TextInput
                style={styles.overrideInput}
                value={overrideText}
                onChangeText={setOverrideText}
                placeholder="e.g. 2027-03-31"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity style={styles.applyBtn} onPress={applyOverride}>
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Referral code: only on first-time setup, not when editing the profile */}
        {firstRun && (
          <View style={styles.referral}>
            {!hasCode ? (
              <TouchableOpacity onPress={() => setHasCode(true)}>
                <Text style={styles.overrideLink}>Have a referral code from a friend?</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.overrideHint}>
                  Enter your friend's code for a free month of Pro
                </Text>
                <TextInput
                  style={styles.referralInput}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="e.g. K7M2QX"
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                  editable={!finishing}
                />
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleFinish}
          disabled={finishing}
          activeOpacity={0.85}
        >
          {finishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Start Building →</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.note}>You can change this later with Edit Profile</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  step: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  body: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  scodCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  scodLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  scodDate: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary },
  overrideNote: { fontSize: FontSize.xs, color: Colors.warning, marginTop: Spacing.xs },
  arcNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 17,
  },
  overrideLink: {
    textAlign: 'center',
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  overrideBox: { marginTop: Spacing.sm },
  overrideHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  overrideRow: { flexDirection: 'row', gap: Spacing.sm },
  overrideInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  referral: { marginTop: Spacing.lg },
  referralInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    letterSpacing: 2,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  buttonText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  note: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs },
});

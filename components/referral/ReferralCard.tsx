import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useProfile } from '../../hooks/useProfile';
import { checkProStatus, getProPlan, ProPlan } from '../../services/revenueCat';
import {
  buildShareMessage,
  getReferralStatus,
  redeemReferralCode,
  ReferralStatus,
} from '../../services/referrals';
import * as storage from '../../services/storage';
import { maybeRequestReview } from '../../services/review';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function pitch(plan: ProPlan, max: number): { title: string; body: string } {
  if (plan === 'lifetime') {
    return {
      title: 'Give a friend a free month',
      body: 'Anyone who joins with your code gets a free month of Pro. You already have Pro for life, so this one is all for them.',
    };
  }
  if (plan === 'subscription') {
    return {
      title: 'Give a friend a free month',
      body: `Anyone who joins with your code gets a free month of Pro. Each friend who writes a statement also banks a month for you, up to ${max}. Banked months start on their own if your subscription ever ends.`,
    };
  }
  return {
    title: 'Give a month, get a month',
    body: `Anyone who joins with your code gets a free month of Pro. You get a month too each time one of them writes their first statement, up to ${max} months.`,
  };
}

/** Profile-tab card: share your code, track progress, and use a friend's code. */
export default function ReferralCard() {
  const { profile, saveProfile } = useProfile();
  const [status, setStatus] = useState<ReferralStatus | null>(null);
  const [plan, setPlan] = useState<ProPlan>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextStatus, nextPlan] = await Promise.all([getReferralStatus(), getProPlan()]);
      setStatus(nextStatus);
      if (nextPlan) setPlan(nextPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Referrals are not available right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tabs stay mounted, so reload each time the tab comes into focus.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCopy = async () => {
    if (!status) return;
    await Clipboard.setStringAsync(status.code);
    await storage.setReferralJoined();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!status) return;
    try {
      const result = await Share.share({ message: buildShareMessage(status.code) });
      await storage.setReferralJoined();
      // Someone who just recommended the app is a good person to ask for a
      // review. iOS reports a dismissed share sheet; only ask if it went out.
      if (result.action === Share.sharedAction) {
        setTimeout(() => maybeRequestReview('referral_shared', profile?.reportingPeriodEnd), 1000);
      }
    } catch {
      // Share sheet unavailable. Nothing to do.
    }
  };

  const handleRedeem = async () => {
    if (redeeming || codeInput.trim().length === 0) return;
    setRedeeming(true);
    try {
      const next = await redeemReferralCode(codeInput);
      setStatus(next);
      setCodeInput('');

      // The reward arrives through RevenueCat, so ask it for fresh status.
      const isPro = await checkProStatus(true);
      if (isPro !== null) await saveProfile({ isPro });
      const nextPlan = await getProPlan();
      if (nextPlan) setPlan(nextPlan);

      Alert.alert(
        'Code accepted',
        next.justGranted > 0
          ? 'You have a free month of Pro: unlimited AI writing, starting now.'
          : 'Your free month is banked. It starts on its own if your current plan ends.'
      );
    } catch (err) {
      Alert.alert('Code not accepted', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Refer a Friend</Text>
        <ActivityIndicator color={Colors.primary} style={styles.loading} />
      </View>
    );
  }

  if (error || !status) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Refer a Friend</Text>
        <Text style={styles.body}>{error ?? 'Referrals are not available right now.'}</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            load();
          }}
        >
          <Text style={styles.retry}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { title, body } = pitch(plan, status.maxReferrals);
  const earning = plan !== 'lifetime';
  const credited = Math.min(status.credited, status.maxReferrals);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Refer a Friend</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {/* Code */}
      <TouchableOpacity style={styles.codeBox} onPress={handleCopy} activeOpacity={0.8}>
        <Text style={styles.codeLabel}>YOUR CODE</Text>
        <Text style={styles.code}>{status.code}</Text>
        <Text style={styles.codeHint}>{copied ? '✓ Copied' : 'Tap to copy'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
        <Text style={styles.shareBtnText}>Share My Code</Text>
      </TouchableOpacity>

      {/* Progress */}
      {earning ? (
        <View style={styles.progress}>
          <View style={styles.pips}>
            {Array.from({ length: status.maxReferrals }, (_, i) => (
              <View key={i} style={[styles.pip, i < credited && styles.pipFilled]} />
            ))}
          </View>
          <Text style={styles.progressText}>
            {credited} of {plural(status.maxReferrals, 'month')} earned
          </Text>
        </View>
      ) : (
        status.credited > 0 && (
          <Text style={styles.note}>
            {plural(status.credited, 'friend')} joined with your code.
          </Text>
        )
      )}
      {status.pending > 0 && (
        <Text style={styles.note}>
          {status.pending === 1
            ? '1 friend has joined but has not written a statement yet.'
            : `${status.pending} friends have joined but have not written a statement yet.`}
        </Text>
      )}
      {earning && status.bankedMonths > 0 && (
        <Text style={styles.note}>
          {plural(status.bankedMonths, 'month')} banked for when your current plan ends.
        </Text>
      )}

      {/* Use a friend's code */}
      {!status.hasRedeemed && (
        <View style={styles.redeem}>
          <Text style={styles.redeemLabel}>Have a friend's code?</Text>
          <View style={styles.redeemRow}>
            <TextInput
              style={styles.redeemInput}
              value={codeInput}
              onChangeText={setCodeInput}
              placeholder="e.g. K7M2QX"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
              editable={!redeeming}
            />
            <TouchableOpacity
              style={[styles.redeemBtn, codeInput.trim().length === 0 && styles.redeemBtnDisabled]}
              onPress={handleRedeem}
              disabled={redeeming || codeInput.trim().length === 0}
            >
              {redeeming ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.redeemBtnText}>Redeem</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  loading: { marginVertical: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
  body: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20 },
  retry: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primaryLight, marginTop: Spacing.sm },
  codeBox: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  codeLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  code: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 6,
    marginVertical: Spacing.xs,
  },
  codeHint: { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: '600' },
  shareBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  shareBtnText: { color: Colors.onAccent, fontWeight: '800', fontSize: FontSize.md },
  progress: { marginTop: Spacing.md },
  pips: { flexDirection: 'row', gap: Spacing.xs },
  pip: { flex: 1, height: 6, borderRadius: Radius.full, backgroundColor: Colors.divider },
  pipFilled: { backgroundColor: Colors.success },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  note: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm, lineHeight: 16 },
  redeem: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  redeemLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  redeemRow: { flexDirection: 'row', gap: Spacing.sm },
  redeemInput: {
    flex: 1,
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
  redeemBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnDisabled: { opacity: 0.35 },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
});

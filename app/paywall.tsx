import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../hooks/useProfile';
import { useUpgradePitch, plural, UpgradePitch } from '../hooks/useUpgradePitch';
import {
  getPlanDetails,
  purchasePro,
  restorePurchases,
  PlanDetails,
  ProductId,
} from '../services/revenueCat';
import { EPB_TARGET_STATEMENTS } from '../constants/mpa';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';
import { PRIVACY_URL, TERMS_URL } from '../constants/links';

const STORE_NAME = Platform.OS === 'android' ? 'Google Play' : 'App Store';

// List prices, shown until the store's localized prices load.
const PLANS: {
  id: ProductId;
  label: string;
  price: string;
  period: string;
  perMonth?: string;
  highlight?: boolean;
}[] = [
  { id: 'briefbuilder_lifetime1', label: 'Lifetime', price: '$24.99', period: 'one-time', highlight: true },
  { id: 'briefbuilder_pro_annual', label: 'Annual', price: '$14.99', period: 'per year', perMonth: '$1.25' },
  { id: 'briefbuilder_pro_monthly', label: 'Monthly', price: '$3.99', period: 'per month' },
];

const BENEFITS = [
  'Unlimited AI statement writing',
  'Regenerate any statement until it reads right',
  'AFSC-specific context in every prompt',
];

function heading(pitch: UpgradePitch): string {
  return pitch.statementsNeeded > 0 && pitch.entriesLogged > 0
    ? 'Finish your EPB with Pro'
    : 'Unlock BriefBuilder Pro';
}

function subheading(pitch: UpgradePitch): string {
  const needed = pitch.statementsNeeded;
  if (needed > 0 && pitch.entriesLogged > 0) {
    const statements = plural(needed, 'statement');
    if (pitch.closeOutLabel && pitch.daysToCloseOut !== null) {
      return `Your EPB closes out ${pitch.closeOutLabel}, ${plural(pitch.daysToCloseOut, 'day')} from now. It still needs ${statements}, and Pro writes every one.`;
    }
    return `Your EPB still needs ${statements}. Pro writes every one, tailored to your AFSC.`;
  }
  return 'Write unlimited EPB statements with AI, tailored to your AFSC.';
}

function periodText(
  plan: (typeof PLANS)[number],
  details: PlanDetails | undefined
): string {
  const price = details?.price ?? plan.price;
  if (details?.freeTrial) return `${details.freeTrial} free, then ${price} ${plan.period}`;
  const perMonth = details ? details.pricePerMonth : plan.perMonth;
  if (plan.perMonth && perMonth) return `${plan.period} (about ${perMonth}/mo)`;
  return plan.period;
}

export default function Paywall() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const pitch = useUpgradePitch();
  const [busy, setBusy] = useState(false);
  // Store prices and free trials replace the list prices above once they load.
  const [details, setDetails] = useState<Partial<Record<ProductId, PlanDetails>>>({});

  useEffect(() => {
    getPlanDetails().then(setDetails);
  }, []);

  const anyTrial = PLANS.some((plan) => details[plan.id]?.freeTrial);
  const showProgress = pitch.entriesLogged > 0 || pitch.statementsDone > 0;
  const progressPct = Math.min(pitch.statementsDone / EPB_TARGET_STATEMENTS, 1);

  const handlePurchase = async (productId: ProductId) => {
    if (busy) return;
    setBusy(true);
    try {
      const success = await purchasePro(productId);
      if (success) {
        await saveProfile({ isPro: true });
        router.back();
      }
    } catch (err) {
      Alert.alert('Purchase not completed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const success = await restorePurchases();
      if (success) {
        await saveProfile({ isPro: true });
        router.back();
      } else {
        Alert.alert('Nothing to restore', 'No previous Pro purchase was found for this account.');
      }
    } catch (err) {
      Alert.alert('Restore failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.badge}>PRO</Text>
          <Text style={styles.heading}>{heading(pitch)}</Text>
          <Text style={styles.subheading}>{subheading(pitch)}</Text>
        </View>

        {showProgress && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              {pitch.statementsDone} of {EPB_TARGET_STATEMENTS} statements written
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
            </View>
            <Text style={styles.progressNote}>
              {pitch.freeWritesLeft === 0
                ? 'Free writes used'
                : pitch.freeWritesLeft !== null
                  ? `${plural(pitch.freeWritesLeft, 'free write')} left`
                  : ''}
              {pitch.freeWritesLeft !== null && pitch.entriesWaiting > 0 ? ' · ' : ''}
              {pitch.entriesWaiting > 0
                ? `${plural(pitch.entriesWaiting, 'logged entry', 'logged entries')} waiting`
                : ''}
            </Text>
          </View>
        )}

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const planDetails = details[plan.id];
            const hasTrial = Boolean(planDetails?.freeTrial);
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, plan.highlight && styles.planCardHighlight]}
                onPress={() => handlePurchase(plan.id)}
                disabled={busy}
                activeOpacity={0.85}
              >
                {(plan.highlight || hasTrial) && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>
                      {hasTrial ? 'Free trial' : 'Best Value'}
                    </Text>
                  </View>
                )}
                <View style={styles.planInfo}>
                  <Text style={[styles.planLabel, plan.highlight && styles.planLabelHighlight]}>
                    {plan.label}
                  </Text>
                  <Text style={[styles.planPeriod, plan.highlight && styles.planPeriodHighlight]}>
                    {periodText(plan, planDetails)}
                  </Text>
                </View>
                {/* Apple requires the billed amount to be the most prominent price,
                    so this stays the real price even when a free trial applies. */}
                <Text style={[styles.planPrice, plan.highlight && styles.planPriceHighlight]}>
                  {planDetails?.price ?? plan.price}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {busy && <ActivityIndicator color="#fff" style={styles.busy} />}

        <TouchableOpacity
          style={styles.referBtn}
          onPress={() => {
            // Close this modal, then switch the tabs underneath to Profile.
            router.back();
            router.navigate('/(tabs)/profile');
          }}
          disabled={busy}
        >
          <Text style={styles.referText}>
            Or earn free months of Pro: refer a friend →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={busy}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Monthly and Annual renew automatically at the price shown until cancelled. Cancel
          anytime in your {STORE_NAME} settings.
          {anyTrial
            ? ' A free trial becomes a paid subscription when it ends unless you cancel at least 24 hours before.'
            : ''}{' '}
          Lifetime is a one-time purchase.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  nav: { padding: Spacing.lg, alignItems: 'flex-end' },
  dismiss: { fontSize: FontSize.xl, color: 'rgba(255,255,255,0.6)', fontWeight: '300' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', marginBottom: Spacing.lg },
  badge: {
    backgroundColor: Colors.accent,
    color: Colors.onAccent,
    fontWeight: '800',
    fontSize: FontSize.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  heading: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: Spacing.sm },
  subheading: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 21,
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    marginVertical: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radius.full },
  progressNote: { color: 'rgba(255,255,255,0.65)', fontSize: FontSize.xs },
  benefits: { marginBottom: Spacing.xl },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  check: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '700', marginRight: Spacing.sm, width: 22 },
  benefitText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.9)', flex: 1 },
  plans: { gap: Spacing.md, marginBottom: Spacing.lg },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardHighlight: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  planBadgeText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.primary },
  planInfo: { flex: 1, marginRight: Spacing.sm },
  planLabel: { fontSize: FontSize.md, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  planLabelHighlight: { color: Colors.onAccent },
  planPeriod: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  planPeriodHighlight: { color: Colors.onAccent, opacity: 0.75 },
  planPrice: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
  planPriceHighlight: { color: Colors.onAccent },
  busy: { marginBottom: Spacing.md },
  referBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  referText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  restoreText: { color: 'rgba(255,255,255,0.55)', fontSize: FontSize.sm },
  legal: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  legalLink: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
    paddingVertical: Spacing.xs,
  },
  legalDot: { color: 'rgba(255,255,255,0.4)', marginHorizontal: Spacing.sm },
});

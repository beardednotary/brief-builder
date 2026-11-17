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
import { getPrices, purchasePro, restorePurchases, ProductId } from '../services/revenueCat';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';
import { PRIVACY_URL, TERMS_URL } from '../constants/links';

const STORE_NAME = Platform.OS === 'android' ? 'Google Play' : 'App Store';

const PLANS: { id: ProductId; label: string; price: string; period: string; highlight?: boolean }[] = [
  { id: 'briefbuilder_lifetime1', label: 'Lifetime', price: '$24.99', period: 'one-time', highlight: true },
  { id: 'briefbuilder_pro_annual', label: 'Annual', price: '$14.99', period: 'per year (~$1.25/mo)' },
  { id: 'briefbuilder_pro_monthly', label: 'Monthly', price: '$3.99', period: 'per month' },
];

const BENEFITS = [
  'Unlimited AI statement writing',
  'AFSC-specific context in every prompt',
];

export default function Paywall() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [busy, setBusy] = useState(false);
  // Store-localized prices replace the defaults above once they load.
  const [prices, setPrices] = useState<Partial<Record<ProductId, string>>>({});

  useEffect(() => {
    getPrices().then(setPrices);
  }, []);

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
          <Text style={styles.heading}>Unlock BriefBuilder Pro</Text>
          <Text style={styles.subheading}>
            Write unlimited EPB statements with AI, tailored to your AFSC.
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, plan.highlight && styles.planCardHighlight]}
              onPress={() => handlePurchase(plan.id)}
              disabled={busy}
              activeOpacity={0.85}
            >
              {plan.highlight && (
                <View style={styles.bestValue}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              )}
              <View style={styles.planInfo}>
                <Text style={[styles.planLabel, plan.highlight && styles.planLabelHighlight]}>
                  {plan.label}
                </Text>
                <Text style={[styles.planPeriod, plan.highlight && styles.planPeriodHighlight]}>
                  {plan.period}
                </Text>
              </View>
              <Text style={[styles.planPrice, plan.highlight && styles.planPriceHighlight]}>
                {prices[plan.id] ?? plan.price}
              </Text>
            </TouchableOpacity>
          ))}
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
          anytime in your {STORE_NAME} settings. Lifetime is a one-time purchase.
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
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
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
  subheading: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  benefits: { marginBottom: Spacing.xl },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  check: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '700', marginRight: Spacing.sm, width: 22 },
  benefitText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.9)', flex: 1 },
  plans: { gap: Spacing.sm, marginBottom: Spacing.lg },
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
  bestValue: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  bestValueText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.primary },
  planInfo: { flex: 1 },
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

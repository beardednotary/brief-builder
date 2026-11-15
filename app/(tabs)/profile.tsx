import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import * as storage from '../../services/storage';
import { FREE_POLISH_LIMIT } from '../../hooks/usePolish';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import { useEffect, useState } from 'react';

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  const [polishCount, setPolishCount] = useState(0);

  useEffect(() => {
    storage.getPolishCount().then(setPolishCount);
  }, []);

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

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.aboutText}>
            BriefBuilder v1.0.0{'\n'}
            EPB bullets in plain language per AFI 36-2406 and the ALQ Writing Guide.
          </Text>
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
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  aboutText: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20 },
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

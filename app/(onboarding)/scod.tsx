import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AirmanRank } from '../../types';
import { useProfile } from '../../hooks/useProfile';
import * as storage from '../../services/storage';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const RANK_SCOD: Record<AirmanRank, [number, number]> = {
  AB:    [3, 31],
  Amn:   [3, 31],
  A1C:   [3, 31],
  SrA:   [3, 31],
  SSgt:  [6, 30],
  TSgt:  [9, 30],
  MSgt:  [5, 31],
  SMSgt: [5, 31],
  CMSgt: [5, 31],
};

function calcSCOD(rank: AirmanRank): string {
  const today = new Date();
  const [month, day] = RANK_SCOD[rank];
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  const year = thisYear > today ? today.getFullYear() : today.getFullYear() + 1;
  const d = new Date(year, month - 1, day);
  return d.toISOString().split('T')[0];
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SCODScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  const rank = profile?.rank ?? 'SrA';
  const suggestedSCOD = calcSCOD(rank as AirmanRank);
  const [scod, setScod] = useState(suggestedSCOD);
  const [overriding, setOverriding] = useState(false);
  const [overrideText, setOverrideText] = useState('');

  const handleFinish = async () => {
    await saveProfile({ reportingPeriodEnd: scod });
    await storage.setOnboardingComplete();
    router.replace('/(tabs)');
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
          <Text style={styles.scodLabel}>Based on {rank}, your SCOD is:</Text>
          <Text style={styles.scodDate}>{formatDate(scod)}</Text>
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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleFinish}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Start Building →</Text>
        </TouchableOpacity>
        <Text style={styles.note}>You can change this later in Profile</Text>
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

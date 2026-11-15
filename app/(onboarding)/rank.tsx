import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AirmanRank } from '../../types';
import { useProfile } from '../../hooks/useProfile';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const RANKS: { key: AirmanRank; pay: string }[] = [
  { key: 'AB', pay: 'E-1' },
  { key: 'Amn', pay: 'E-2' },
  { key: 'A1C', pay: 'E-3' },
  { key: 'SrA', pay: 'E-4' },
  { key: 'SSgt', pay: 'E-5' },
  { key: 'TSgt', pay: 'E-6' },
  { key: 'MSgt', pay: 'E-7' },
  { key: 'SMSgt', pay: 'E-8' },
  { key: 'CMSgt', pay: 'E-9' },
];

export default function RankScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  const [selected, setSelected] = useState<AirmanRank | null>(profile?.rank ?? null);

  const handleNext = async () => {
    if (!selected) return;
    await saveProfile({ rank: selected });
    router.push('/(onboarding)/afsc');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 4</Text>
        <Text style={styles.title}>What's your rank?</Text>
      </View>

      <View style={styles.grid}>
        {RANKS.map(({ key, pay }) => (
          <TouchableOpacity
            key={key}
            style={[styles.card, selected === key && styles.cardSelected]}
            onPress={() => setSelected(key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.rankLabel, selected === key && styles.labelSelected]}>
              {key}
            </Text>
            <Text style={[styles.payLabel, selected === key && styles.paySelected]}>
              {pay}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Next →</Text>
        </TouchableOpacity>
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
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    alignContent: 'flex-start',
  },
  card: {
    width: '30%',
    aspectRatio: 1.2,
    margin: '1.5%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rankLabel: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  labelSelected: { color: '#fff' },
  payLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  paySelected: { color: 'rgba(255,255,255,0.65)' },
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
  },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});

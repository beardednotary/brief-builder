import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Component } from '../../types';
import { useProfile } from '../../hooks/useProfile';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const OPTIONS: { key: Component; label: string; sub: string }[] = [
  { key: 'RegAF', label: 'Regular Air Force', sub: 'Active duty' },
  { key: 'AFR', label: 'Air Force Reserve', sub: 'Reserve component' },
  { key: 'ANG', label: 'Air National Guard', sub: 'Guard component' },
];

export default function ComponentScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  const [selected, setSelected] = useState<Component | null>(profile?.component ?? null);

  const handleNext = async () => {
    if (!selected) return;
    await saveProfile({ component: selected });
    router.push('/(onboarding)/scod');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 4</Text>
        <Text style={styles.title}>Which component?</Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map(({ key, label, sub }) => (
          <TouchableOpacity
            key={key}
            style={[styles.card, selected === key && styles.cardSelected]}
            onPress={() => setSelected(key)}
            activeOpacity={0.75}
          >
            <View style={styles.cardInner}>
              <Text style={[styles.label, selected === key && styles.labelSelected]}>
                {label}
              </Text>
              <Text style={[styles.sub, selected === key && styles.subSelected]}>
                {sub}
              </Text>
            </View>
            {selected === key && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
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
    paddingBottom: Spacing.lg,
  },
  step: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  options: { flex: 1, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: '#EEF3FF' },
  cardInner: { flex: 1 },
  label: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  labelSelected: { color: Colors.primary },
  sub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  subSelected: { color: Colors.primaryLight },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
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

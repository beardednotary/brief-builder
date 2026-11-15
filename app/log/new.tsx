import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLogEntries } from '../../hooks/useLogEntries';
import { useProfile } from '../../hooks/useProfile';
import { offerRemindersOnce } from '../../services/notifications';
import { MPA_DEFINITIONS, MPA_ORDER } from '../../constants/mpa';
import { ALQ_DEFINITIONS, ALQ_MPA_MAP } from '../../constants/alq';
import { PROFICIENCY_ORDER, PROFICIENCY_DEFINITIONS } from '../../constants/proficiency';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { MPA, ALQ, ProficiencyLevel } from '../../types';

export default function NewLogEntry() {
  const router = useRouter();
  const { addEntry } = useLogEntries();
  const { profile } = useProfile();
  const { mpa: mpaParam, autoWrite } = useLocalSearchParams<{ mpa?: string; autoWrite?: string }>();

  const [mode, setMode] = useState<'freeform' | 'structured'>('freeform');
  const [rawText, setRawText] = useState('');
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState('');
  const [metrics, setMetrics] = useState('');
  const [context, setContext] = useState('');
  const [mpa, setMpa] = useState<MPA>((mpaParam as MPA) ?? 'executing_the_mission');
  const [alq, setAlq] = useState<ALQ | null>(null);
  const [proficiency, setProficiency] = useState<ProficiencyLevel | null>(null);

  const isValid =
    mode === 'freeform' ? rawText.trim().length > 0 : action.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    const entry = await addEntry({
      inputMode: mode,
      rawText: mode === 'freeform' ? rawText.trim() : undefined,
      action: mode === 'structured' ? action.trim() : undefined,
      outcome: mode === 'structured' ? outcome.trim() : undefined,
      metrics: mode === 'structured' ? metrics.trim() : undefined,
      context: mode === 'structured' ? context.trim() : undefined,
      mpa,
      alq: alq ?? undefined,
      proficiencyTarget: proficiency ?? undefined,
      isFavorited: false,
      status: 'draft',
    });

    if (autoWrite === 'true') {
      router.replace(`/polish/${entry.id}`);
    } else {
      router.back();
      // A saved entry is the moment reminders make sense. Offered only once.
      offerRemindersOnce({ lastEntryAt: entry.createdAt, scod: profile?.reportingPeriodEnd });
    }
  };

  const alqsForMPA = ALQ_MPA_MAP[mpa];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Entry</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveText}>{autoWrite === 'true' ? 'Save & Write' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Mode toggle */}
        <View style={styles.modeRow}>
          {(['freeform', 'structured'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'freeform' ? 'Freeform' : 'Structured'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        {mode === 'freeform' ? (
          <View style={styles.section}>
            <Text style={styles.label}>What happened?</Text>
            <TextInput
              style={styles.textArea}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Dump it here — what did you do, what was the result? Numbers are gold."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>
              What did you do? <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={action}
              onChangeText={setAction}
              placeholder="e.g. Coordinated refueling for 4 aircraft"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.label}>What was the result/outcome?</Text>
            <TextInput
              style={styles.input}
              value={outcome}
              onChangeText={setOutcome}
              placeholder="e.g. Maintained 100% sortie rate during surge"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.label}>Any numbers? (people, $, %, time)</Text>
            <TextInput
              style={styles.input}
              value={metrics}
              onChangeText={setMetrics}
              placeholder="e.g. 12 personnel, $40K in equipment, 3 days ahead"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.label}>Context / scene (optional)</Text>
            <TextInput
              style={styles.input}
              value={context}
              onChangeText={setContext}
              placeholder="e.g. During AEF rotation at Al Udeid"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        )}

        {/* MPA */}
        <Text style={styles.sectionTitle}>MPA Block</Text>
        <View style={styles.chipRow}>
          {MPA_ORDER.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, mpa === m && styles.chipActive]}
              onPress={() => {
                setMpa(m);
                setAlq(null);
              }}
            >
              <Text style={[styles.chipText, mpa === m && styles.chipTextActive]}>
                {MPA_DEFINITIONS[m].shortLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ALQ */}
        <Text style={styles.sectionTitle}>ALQ Focus (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
          <View style={styles.chipRowH}>
            {alqsForMPA.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, alq === a && styles.chipActive]}
                onPress={() => setAlq(alq === a ? null : a)}
              >
                <Text style={[styles.chipText, alq === a && styles.chipTextActive]}>
                  {ALQ_DEFINITIONS[a].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Proficiency */}
        <Text style={styles.sectionTitle}>Target Proficiency (optional)</Text>
        <View style={styles.chipRow}>
          {PROFICIENCY_ORDER.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, proficiency === p && styles.chipActive]}
              onPress={() => setProficiency(proficiency === p ? null : p)}
            >
              <Text style={[styles.chipText, proficiency === p && styles.chipTextActive]}>
                {PROFICIENCY_DEFINITIONS[p].shortLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancel: { fontSize: FontSize.md, color: Colors.textMuted },
  navTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  modeBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm - 2, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  modeBtnTextActive: { color: '#fff' },
  section: { marginBottom: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  required: { color: Colors.error },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 140,
    lineHeight: 22,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  hScroll: { marginBottom: Spacing.sm },
  chipRowH: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: '#fff' },
});

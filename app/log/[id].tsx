import { useState, useEffect } from 'react';
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
import { MPA_DEFINITIONS, MPA_ORDER } from '../../constants/mpa';
import { ALQ_DEFINITIONS, ALQ_MPA_MAP } from '../../constants/alq';
import { PROFICIENCY_ORDER, PROFICIENCY_DEFINITIONS } from '../../constants/proficiency';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { MPA, ALQ, ProficiencyLevel, LogEntry } from '../../types';

export default function EditLogEntry() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEntry, updateEntry } = useLogEntries();

  const entry = getEntry(id);

  const [mode, setMode] = useState<'freeform' | 'structured'>(
    entry?.inputMode ?? 'freeform'
  );
  const [rawText, setRawText] = useState(entry?.rawText ?? '');
  const [action, setAction] = useState(entry?.action ?? '');
  const [outcome, setOutcome] = useState(entry?.outcome ?? '');
  const [metrics, setMetrics] = useState(entry?.metrics ?? '');
  const [context, setContext] = useState(entry?.context ?? '');
  const [mpa, setMpa] = useState<MPA>(entry?.mpa ?? 'executing_the_mission');
  const [alq, setAlq] = useState<ALQ | null>(entry?.alq ?? null);
  const [proficiency, setProficiency] = useState<ProficiencyLevel | null>(
    entry?.proficiencyTarget ?? null
  );

  const isValid =
    mode === 'freeform' ? rawText.trim().length > 0 : action.trim().length > 0;

  const handleSave = async () => {
    if (!isValid || !entry) return;
    await updateEntry(id, {
      inputMode: mode,
      rawText: mode === 'freeform' ? rawText.trim() : undefined,
      action: mode === 'structured' ? action.trim() : undefined,
      outcome: mode === 'structured' ? outcome.trim() : undefined,
      metrics: mode === 'structured' ? metrics.trim() : undefined,
      context: mode === 'structured' ? context.trim() : undefined,
      mpa,
      alq: alq ?? undefined,
      proficiencyTarget: proficiency ?? undefined,
    });
    router.back();
  };

  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Entry not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const alqsForMPA = ALQ_MPA_MAP[mpa];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Entry</Text>
        <View style={styles.navRight}>
          {entry.status !== 'finalized' && (
            <TouchableOpacity
              style={styles.polishBtn}
              onPress={() => router.push(`/polish/${id}`)}
            >
              <Text style={styles.polishBtnText}>✨ Write</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid}
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
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
              placeholder="What did you do? What was the result?"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
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
            <Text style={styles.label}>Result/outcome?</Text>
            <TextInput
              style={styles.input}
              value={outcome}
              onChangeText={setOutcome}
              placeholder="e.g. Maintained 100% sortie rate"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.label}>Numbers? (people, $, %, time)</Text>
            <TextInput
              style={styles.input}
              value={metrics}
              onChangeText={setMetrics}
              placeholder="e.g. 12 personnel, $40K, 3 days ahead"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.label}>Context (optional)</Text>
            <TextInput
              style={styles.input}
              value={context}
              onChangeText={setContext}
              placeholder="e.g. During AEF rotation at Al Udeid"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        )}

        {/* Selected statement (if polished) */}
        {entry.selectedStatement && (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedLabel}>Selected Statement</Text>
            <Text style={styles.selectedText}>{entry.selectedStatement}</Text>
            <Text style={styles.selectedChar}>{entry.selectedStatement.length} chars</Text>
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
  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  polishBtn: {
    backgroundColor: Colors.accent + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
  },
  polishBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.accent },
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
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs, marginTop: Spacing.sm },
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
  selectedCard: {
    backgroundColor: '#E8F4EC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  selectedLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.success, marginBottom: Spacing.xs },
  selectedText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  selectedChar: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
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
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFoundText: { fontSize: FontSize.md, color: Colors.textMuted },
  backLink: { color: Colors.primaryLight, fontWeight: '600' },
});

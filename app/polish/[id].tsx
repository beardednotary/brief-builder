import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLogEntries } from '../../hooks/useLogEntries';
import { useEPBBlocks } from '../../hooks/useEPBBlocks';
import { usePolish, PaywallError, FREE_POLISH_LIMIT } from '../../hooks/usePolish';
import { useProfile } from '../../hooks/useProfile';
import { MPA_DEFINITIONS } from '../../constants/mpa';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function PolishScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEntry, updateEntry } = useLogEntries();
  const { addStatement } = useEPBBlocks();
  const { profile } = useProfile();
  const { polish } = usePolish(profile);

  const entry = getEntry(id);

  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState<string[]>(entry?.draftStatements ?? []);
  const [selected, setSelected] = useState<string | null>(entry?.selectedStatement ?? null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      const result = await polish(entry);
      setStatements(result);
      setSelected(null);
      setSaved(false);
      await updateEntry(id, { draftStatements: result, status: 'polished' });
    } catch (err) {
      if (err instanceof PaywallError) {
        router.push('/paywall');
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Error', `Failed to generate statements.\n\n${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (statement: string) => {
    if (!entry) return;
    const added = await addStatement(entry.mpa, statement);
    if (!added) {
      Alert.alert(
        'Block Full',
        `Adding this statement would exceed the 350-character limit for ${MPA_DEFINITIONS[entry.mpa].label}. Remove an existing statement first.`
      );
      return;
    }
    await updateEntry(id, {
      selectedStatement: statement,
      characterCount: statement.length,
      status: 'finalized',
    });
    setSelected(statement);
    setSaved(true);
  };

  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Entry not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const preview =
    entry.inputMode === 'freeform'
      ? entry.rawText ?? ''
      : [entry.action, entry.outcome, entry.metrics, entry.context]
          .filter(Boolean)
          .join(' / ');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Statement Writer</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Entry preview */}
        <View style={styles.entryCard}>
          <Text style={styles.entryLabel}>
            {MPA_DEFINITIONS[entry.mpa].label}
            {entry.alq ? ` · ${entry.alq.replace(/_/g, ' ')}` : ''}
          </Text>
          <Text style={styles.entryPreview} numberOfLines={4}>
            {preview}
          </Text>
        </View>

        {/* Generate button */}
        {!loading && (
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={handleGenerate}
            activeOpacity={0.85}
          >
            <Text style={styles.generateBtnText}>
              {statements.length > 0 ? '↻ Regenerate' : '✨ Generate Statements'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Writing your statements…</Text>
          </View>
        )}

        {/* Statement options */}
        {!loading && statements.length > 0 && (
          <>
            <Text style={styles.optionsTitle}>Select a Statement</Text>
            {statements.map((stmt, i) => {
              const isSelected = selected === stmt;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.statementCard,
                    isSelected && styles.statementCardSelected,
                    saved && isSelected && styles.statementCardSaved,
                  ]}
                  onPress={() => !saved && handleAccept(stmt)}
                  activeOpacity={saved ? 1 : 0.8}
                >
                  <View style={styles.statementHeader}>
                    <Text style={styles.optionLabel}>Option {i + 1}</Text>
                    <Text
                      style={[
                        styles.charCount,
                        stmt.length > 175 ? { color: Colors.error } : { color: Colors.textMuted },
                      ]}
                    >
                      {stmt.length} chars
                    </Text>
                  </View>
                  <Text style={styles.statementText}>{stmt}</Text>
                  {isSelected && saved ? (
                    <Text style={styles.savedBadge}>✓ Added to {MPA_DEFINITIONS[entry.mpa].shortLabel} block</Text>
                  ) : !saved ? (
                    <Text style={styles.tapToSelect}>Tap to select & add to builder</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Success state */}
        {saved && (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.push('/(tabs)/builder')}
          >
            <Text style={styles.doneBtnText}>View in Builder →</Text>
          </TouchableOpacity>
        )}

        {!profile?.isPro && (
          <Text style={styles.freeNote}>
            {FREE_POLISH_LIMIT} free AI writes included — upgrade for unlimited.
          </Text>
        )}
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
  back: { fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: '600' },
  navTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  entryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  entryPreview: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.lg },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: { fontSize: FontSize.md, color: Colors.textMuted },
  optionsTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  statementCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.divider,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  statementCardSelected: { borderColor: Colors.primary, backgroundColor: '#EEF3FF' },
  statementCardSaved: { borderColor: Colors.success, backgroundColor: '#E8F4EC' },
  statementHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  optionLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted },
  charCount: { fontSize: FontSize.xs, fontWeight: '700' },
  statementText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  tapToSelect: { fontSize: FontSize.xs, color: Colors.primaryLight, marginTop: Spacing.sm, fontWeight: '600' },
  savedBadge: { fontSize: FontSize.xs, color: Colors.success, marginTop: Spacing.sm, fontWeight: '700' },
  doneBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.lg },
  freeNote: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFound: { fontSize: FontSize.md, color: Colors.textMuted },
  backLink: { color: Colors.primaryLight, fontWeight: '600' },
});

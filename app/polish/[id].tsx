import { useEffect, useState } from 'react';
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
import {
  usePolish,
  PaywallError,
  FREE_POLISH_LIMIT,
  getWriteCount,
  isFreeRegenerate,
} from '../../hooks/usePolish';
import { useProfile } from '../../hooks/useProfile';
import { maybeRequestReview, momentForSavedStatement } from '../../services/review';
import * as storage from '../../services/storage';
import {
  MPA_DEFINITIONS,
  MPA_ORDER,
  MPA_TARGET_STATEMENTS,
  EPB_TARGET_STATEMENTS,
} from '../../constants/mpa';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import { plural } from '../../hooks/useUpgradePitch';
import { MPA } from '../../types';

function freeWritesText(remaining: number): string {
  if (remaining <= 0) return 'No free writes left. Upgrade for unlimited →';
  if (remaining === 1) return `1 of ${FREE_POLISH_LIMIT} free writes left`;
  return `${remaining} of ${FREE_POLISH_LIMIT} free writes left`;
}

// Keyed by entry id so "Write the next one" always starts from clean state,
// even if the navigator reuses this screen for the new entry.
export default function PolishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StatementWriter key={id} id={id} />;
}

function StatementWriter({ id }: { id: string }) {
  const router = useRouter();
  const { entries, getEntry, updateEntry } = useLogEntries();
  const { blocks, addStatement, getBlock } = useEPBBlocks();
  const { profile } = useProfile();
  const { polish, getRemainingFreePolishes } = usePolish(profile);

  const entry = getEntry(id);

  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState<string[]>(entry?.draftStatements ?? []);
  const [selected, setSelected] = useState<string | null>(entry?.selectedStatement ?? null);
  const [saved, setSaved] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    getRemainingFreePolishes().then(setRemaining);
  }, [getRemainingFreePolishes]);

  // App Review (5.1.2) requires explicit permission before personal data goes
  // to a third-party AI service. Asked once, before the first write.
  const confirmAiConsent = async (): Promise<boolean> => {
    if (await storage.hasAiConsent()) return true;
    const agreed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Before AI writes your statement',
        "This entry and your rank, AFSC and component are sent to Anthropic's Claude AI to write the statement. BriefBuilder does not store them.\n\nNever include classified or controlled information.",
        [
          { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Agree and write', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
    if (agreed) await storage.setAiConsent();
    return agreed;
  };

  const handleGenerate = async () => {
    if (!entry) return;
    if (!(await confirmAiConsent())) return;
    setLoading(true);
    try {
      const result = await polish(entry);
      setStatements(result);
      setSelected(null);
      setSaved(false);
      await updateEntry(id, {
        draftStatements: result,
        writeCount: getWriteCount(entry) + 1,
        status: 'polished',
      });
      setRemaining(await getRemainingFreePolishes());
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

    // Ask for a review only when this statement finished a block or the whole
    // EPB, once the success state has had a moment to register. Not when it
    // used the last free write: the upsell card is on screen then.
    const moment = momentForSavedStatement(
      getBlock(entry.mpa).statements.length,
      MPA_TARGET_STATEMENTS,
      MPA_ORDER.every((m) => getBlock(m).statements.length >= MPA_TARGET_STATEMENTS)
    );
    const upsellShowing = !profile?.isPro && remaining === 0;
    if (moment && !upsellShowing) {
      setTimeout(() => maybeRequestReview(moment, profile?.reportingPeriodEnd), 1500);
    }
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

  const isPro = Boolean(profile?.isPro);
  const mpaLabel = MPA_DEFINITIONS[entry.mpa].label;

  // ── Progress and what to write next ────────────────────────────────────────
  const blockDone = getBlock(entry.mpa).statements.length;
  const epbDone = blocks.reduce((sum, b) => sum + b.statements.length, 0);
  const needsStatements = (mpa: MPA) =>
    getBlock(mpa).statements.length < MPA_TARGET_STATEMENTS;

  // Logged entries that have not been turned into a statement yet. Prefer one
  // that finishes this block, then one for any block still short of target.
  const waiting = entries.filter((e) => e.id !== id && e.status !== 'finalized');
  const nextEntry =
    waiting.find((e) => e.mpa === entry.mpa && needsStatements(e.mpa)) ??
    waiting.find((e) => needsStatements(e.mpa)) ??
    waiting[0];
  const nextMpaToLog = MPA_ORDER.find(needsStatements) ?? entry.mpa;

  const progressTitle =
    blockDone <= MPA_TARGET_STATEMENTS
      ? `${mpaLabel}: ${blockDone} of ${MPA_TARGET_STATEMENTS} statements done`
      : `${mpaLabel}: ${blockDone} statements done`;
  const epbComplete = MPA_ORDER.every((mpa) => !needsStatements(mpa));

  let nextPrompt: string;
  if (epbComplete) {
    nextPrompt = 'All four blocks have their statements. Review them in the builder.';
  } else if (nextEntry) {
    nextPrompt =
      waiting.length === 1
        ? 'You have 1 more entry logged. Write that one next?'
        : `You have ${waiting.length} more entries logged. Write the next one?`;
  } else {
    nextPrompt = `Nothing else is waiting. Log your next ${MPA_DEFINITIONS[nextMpaToLog].label} accomplishment while it is fresh.`;
  }

  const outOfFreeWrites = !isPro && remaining === 0;
  // Free writes left but not enough to finish the EPB: say so while the
  // result is on screen. At zero, the upsell card below takes over.
  const epbNeeded = Math.max(0, EPB_TARGET_STATEMENTS - epbDone);
  const freeFallsShort =
    !isPro && remaining !== null && remaining > 0 && remaining < epbNeeded;

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
            {mpaLabel}
            {entry.alq ? ` · ${entry.alq.replace(/_/g, ' ')}` : ''}
          </Text>
          <Text style={styles.entryPreview} numberOfLines={4}>
            {preview}
          </Text>
        </View>

        {/* Generate button */}
        {!loading && (
          <>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerate}
              activeOpacity={0.85}
            >
              <Text style={styles.generateBtnText}>
                {statements.length > 0 ? '↻ Regenerate' : '✨ Generate Statements'}
              </Text>
            </TouchableOpacity>
            {!isPro && statements.length > 0 && isFreeRegenerate(entry) && (
              <Text style={styles.regenHint}>
                Not quite right? Your first regenerate on each entry is free.
              </Text>
            )}
            {!isPro &&
              statements.length > 0 &&
              !isFreeRegenerate(entry) &&
              remaining !== null &&
              remaining > 0 && (
                <Text style={styles.regenHint}>Regenerating again uses 1 free write.</Text>
              )}
          </>
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

        {/* Success state: show progress and point at the next thing to write */}
        {saved && !loading && (
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>{progressTitle}</Text>
            {epbDone <= EPB_TARGET_STATEMENTS && (
              <>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(epbDone / EPB_TARGET_STATEMENTS) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {epbDone} of {EPB_TARGET_STATEMENTS} statements across your EPB
                </Text>
              </>
            )}
            <Text style={styles.nextPrompt}>{nextPrompt}</Text>

            {freeFallsShort && remaining !== null && (
              <TouchableOpacity
                style={styles.shortfall}
                onPress={() => router.push('/paywall')}
                activeOpacity={0.8}
              >
                <Text style={styles.shortfallText}>
                  Your EPB needs {plural(epbNeeded, 'more statement', 'more statements')} and you
                  have {plural(remaining, 'free write')} left.{' '}
                  <Text style={styles.shortfallLink}>Pro writes them all →</Text>
                </Text>
              </TouchableOpacity>
            )}

            {epbComplete ? (
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => router.push('/(tabs)/builder')}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>View in Builder →</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={() =>
                    nextEntry
                      ? router.replace(`/polish/${nextEntry.id}`)
                      : router.replace(`/log/new?mpa=${nextMpaToLog}&autoWrite=true`)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextBtnText}>
                    {nextEntry ? '✨ Write the next one' : '+ Log another'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.builderLink}
                  onPress={() => router.push('/(tabs)/builder')}
                >
                  <Text style={styles.builderLinkText}>View in Builder →</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Out of free writes: make the offer while the result is on screen */}
        {saved && !loading && outOfFreeWrites && (
          <View style={styles.upsellCard}>
            <Text style={styles.upsellTitle}>That was your last free write</Text>
            <Text style={styles.upsellBody}>
              Go Pro to keep turning your log into statements: unlimited AI writing, tailored to
              your AFSC.
            </Text>
            <TouchableOpacity
              style={styles.upsellBtn}
              onPress={() => router.push('/paywall')}
              activeOpacity={0.85}
            >
              <Text style={styles.upsellBtnText}>See Pro options</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.upsellLink}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.upsellLinkText}>
                Or give a friend a free month and get one yourself →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isPro && remaining !== null && (
          <TouchableOpacity
            disabled={remaining > 0}
            onPress={() => router.push('/paywall')}
          >
            <Text style={[styles.freeNote, remaining <= 1 && styles.freeNoteLow]}>
              {freeWritesText(remaining)}
            </Text>
          </TouchableOpacity>
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
  regenHint: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
  },
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
  nextCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  nextTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.divider,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: Radius.full, backgroundColor: Colors.success },
  progressLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  nextPrompt: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  shortfall: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  shortfallText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 19 },
  shortfallLink: { fontWeight: '800', color: Colors.accentText },
  nextBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextBtnText: { color: Colors.onAccent, fontWeight: '800', fontSize: FontSize.lg },
  builderLink: { alignItems: 'center', paddingTop: Spacing.md },
  builderLinkText: { color: Colors.primaryLight, fontWeight: '600', fontSize: FontSize.sm },
  upsellCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.lifted,
  },
  upsellTitle: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff', marginBottom: Spacing.xs },
  upsellBody: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  upsellBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  upsellBtnText: { color: Colors.onAccent, fontWeight: '800', fontSize: FontSize.md },
  upsellLink: { alignItems: 'center', paddingTop: Spacing.md },
  upsellLinkText: { color: Colors.accent, fontWeight: '700', fontSize: FontSize.sm, textAlign: 'center' },
  freeNote: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  freeNoteLow: { color: Colors.warning, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFound: { fontSize: FontSize.md, color: Colors.textMuted },
  backLink: { color: Colors.primaryLight, fontWeight: '600' },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useEPBBlocks } from '../../hooks/useEPBBlocks';
import { useLogEntries } from '../../hooks/useLogEntries';
import { useUpgradePitch, daysUntil, plural, UpgradePitch } from '../../hooks/useUpgradePitch';
import { FREE_POLISH_LIMIT } from '../../hooks/usePolish';
import { MPA_DEFINITIONS, MPA_ORDER, MPA_CHAR_LIMIT } from '../../constants/mpa';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import { LogEntry, MPA } from '../../types';

const MPA_ACCENT: Record<MPA, string> = {
  executing_the_mission: Colors.mpaBlue,
  leading_people: Colors.mpaGreen,
  managing_resources: Colors.mpaAmber,
  improving_the_unit: Colors.mpaPurple,
};

/**
 * What the free-writes card says, or null when it should not show: for Pro
 * users, before anything is logged, and once the EPB has all its statements.
 */
function proCardCopy(pitch: UpgradePitch): { title: string; body: string; strong: boolean } | null {
  const left = pitch.freeWritesLeft;
  const needed = pitch.statementsNeeded;
  if (pitch.isPro || left === null || pitch.entriesLogged === 0 || needed === 0) return null;

  const deadline =
    pitch.closeOutLabel && pitch.daysToCloseOut !== null
      ? ` before your ${pitch.closeOutLabel} close-out`
      : '';

  if (left === 0) {
    return {
      title: 'Free writes used',
      body: `Your EPB still needs ${plural(needed, 'statement')}${deadline}. Pro writes the rest, tailored to your AFSC.`,
      strong: true,
    };
  }
  if (left < needed) {
    return {
      title: `${left} of ${FREE_POLISH_LIMIT} free writes left`,
      body: `Your EPB needs ${plural(needed, 'more statement', 'more statements')}${deadline}. Free writes cover ${left}; Pro covers the rest.`,
      strong: true,
    };
  }
  return {
    title: `${left} of ${FREE_POLISH_LIMIT} free writes left`,
    body: 'Enough to finish your EPB. Pro adds unlimited rewrites and statements tuned to your AFSC.',
    strong: false,
  };
}

function statusDot(entry: LogEntry): string {
  if (entry.status === 'finalized') return '●';
  if (entry.status === 'polished') return '◐';
  return '○';
}

function statusColor(entry: LogEntry): string {
  if (entry.status === 'finalized') return Colors.success;
  if (entry.status === 'polished') return Colors.primaryLight;
  return Colors.textLight;
}

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useProfile();
  const { blocks } = useEPBBlocks();
  const { entries } = useLogEntries();
  const proCard = proCardCopy(useUpgradePitch());

  const recent = entries.slice(0, 5);
  const scod = profile?.reportingPeriodEnd;
  const days = scod ? daysUntil(scod) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Blue header banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerRank}>{profile?.rank ?? '—'}</Text>
          <View>
            <Text style={styles.bannerAfsc}>
              {profile?.afscTitle ?? profile?.afsc ?? 'BriefBuilder'}
            </Text>
            <Text style={styles.bannerHeading}>EPB Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/log/new')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SCOD countdown */}
        {days !== null && (
          <View style={[styles.scodCard, days <= 30 && styles.scodCardUrgent]}>
            <View style={styles.scodLeft}>
              <Text style={[styles.scodDays, days <= 30 && styles.scodDaysUrgent]}>
                {Math.abs(days)}
              </Text>
              <Text style={styles.scodUnit}>days</Text>
            </View>
            <View style={styles.scodRight}>
              <Text style={styles.scodLabel}>
                {days > 0 ? 'until SCOD' : days === 0 ? '— SCOD is TODAY' : '— SCOD passed'}
              </Text>
              {scod && (
                <Text style={styles.scodDate}>
                  {new Date(scod + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Free writes vs. what the EPB still needs */}
        {proCard && (
          <TouchableOpacity
            style={[styles.proCard, proCard.strong && styles.proCardStrong]}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.85}
          >
            <View style={styles.proCardText}>
              <Text style={[styles.proTitle, proCard.strong && styles.proTitleStrong]}>
                {proCard.title}
              </Text>
              <Text style={[styles.proBody, proCard.strong && styles.proBodyStrong]}>
                {proCard.body}
              </Text>
            </View>
            <Text style={[styles.proCta, proCard.strong && styles.proCtaStrong]}>
              {proCard.strong ? 'Go Pro →' : 'See Pro →'}
            </Text>
          </TouchableOpacity>
        )}

        {/* MPA Grid */}
        <Text style={styles.sectionTitle}>MPA Blocks</Text>
        <View style={styles.mpaGrid}>
          {MPA_ORDER.map((mpa) => {
            const block = blocks.find((b) => b.mpa === mpa) ?? {
              mpa,
              statements: [],
              characterCount: 0,
            };
            const def = MPA_DEFINITIONS[mpa];
            const pct = Math.min(block.characterCount / MPA_CHAR_LIMIT, 1);
            const accent = MPA_ACCENT[mpa];

            return (
              <TouchableOpacity
                key={mpa}
                style={styles.mpaCard}
                onPress={() => router.push('/(tabs)/builder')}
                activeOpacity={0.8}
              >
                <View style={[styles.mpaAccentBar, { backgroundColor: accent }]} />
                <View style={styles.mpaCardInner}>
                  <Text style={styles.mpaName}>{def.label}</Text>
                  <Text style={[styles.mpaCount, { color: pct >= 1 ? Colors.error : pct >= 0.85 ? Colors.warning : accent }]}>
                    {block.characterCount}
                    <Text style={styles.mpaCountMax}>/{MPA_CHAR_LIMIT}</Text>
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct * 100}%`,
                          backgroundColor: pct >= 1 ? Colors.error : pct >= 0.85 ? Colors.warning : accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.mpaStatements}>
                    {block.statements.length} statement{block.statements.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Entries */}
        <Text style={styles.sectionTitle}>Recent Log Entries</Text>

        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyHeadline}>Nothing logged yet</Text>
            <Text style={styles.emptyBody}>
              Log accomplishments as they happen — even a quick note counts.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/log/new')}>
              <Text style={styles.emptyBtnText}>Log First Entry →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recent.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => router.push(`/log/${entry.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.entryAccent, { backgroundColor: MPA_ACCENT[entry.mpa] }]} />
              <View style={styles.entryInner}>
                <View style={styles.entryTop}>
                  <Text
                    style={[styles.entryStatusDot, { color: statusColor(entry) }]}
                  >
                    {statusDot(entry)}
                  </Text>
                  <Text style={styles.entryText} numberOfLines={2}>
                    {entry.rawText ?? entry.action ?? '—'}
                  </Text>
                </View>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryMetaText}>
                    {MPA_DEFINITIONS[entry.mpa].shortLabel}
                  </Text>
                  <Text style={styles.entryMetaDot}>·</Text>
                  <Text style={styles.entryMetaText}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Text>
                  <View style={{ flex: 1 }} />
                  {entry.status !== 'finalized' && (
                    <TouchableOpacity
                      onPress={() => router.push(`/polish/${entry.id}`)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.writeBtn}>✨ Write</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header banner
  banner: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bannerRank: {
    backgroundColor: Colors.accent,
    color: Colors.onAccent,
    fontWeight: '800',
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  bannerAfsc: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3 },
  bannerHeading: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  addBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addBtnText: { color: Colors.onAccent, fontWeight: '700', fontSize: FontSize.sm, letterSpacing: 0.3 },

  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // SCOD
  scodCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryLight,
    ...Shadow.card,
  },
  scodCardUrgent: { borderLeftColor: Colors.warning },
  scodLeft: { alignItems: 'center', marginRight: Spacing.lg, minWidth: 48 },
  scodDays: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.primary, lineHeight: 36 },
  scodDaysUrgent: { color: Colors.warning },
  scodUnit: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  scodRight: { flex: 1 },
  scodLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  scodDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Free writes / Pro card
  proCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    ...Shadow.card,
  },
  proCardStrong: { backgroundColor: Colors.primary, borderLeftColor: Colors.accent },
  proCardText: { flex: 1, marginRight: Spacing.md },
  proTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  proTitleStrong: { color: '#fff' },
  proBody: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 19 },
  proBodyStrong: { color: 'rgba(255,255,255,0.8)' },
  proCta: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.accentText },
  proCtaStrong: { color: Colors.accent },

  // Section titles
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },

  // MPA Grid
  mpaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  mpaCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Shadow.card,
  },
  mpaAccentBar: { width: 4 },
  mpaCardInner: { flex: 1, padding: Spacing.md },
  mpaName: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, marginBottom: Spacing.xs },
  mpaCount: { fontSize: FontSize.xl, fontWeight: '800', lineHeight: 24 },
  mpaCountMax: { fontSize: FontSize.sm, fontWeight: '400', color: Colors.textLight },
  progressTrack: {
    height: 5,
    backgroundColor: Colors.divider,
    borderRadius: Radius.full,
    marginVertical: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full },
  mpaStatements: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Empty state
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.card,
    marginBottom: Spacing.md,
  },
  emptyHeadline: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  emptyBody: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },

  // Entry cards
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  entryAccent: { width: 4 },
  entryInner: { flex: 1, padding: Spacing.md },
  entryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
  entryStatusDot: { fontSize: 10, marginTop: 4, lineHeight: 14 },
  entryText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  entryMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  entryMetaDot: { fontSize: FontSize.xs, color: Colors.textLight },
  writeBtn: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.accentText },
});

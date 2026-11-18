import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useEPBBlocks } from '../../hooks/useEPBBlocks';
import { useProfile } from '../../hooks/useProfile';
import { maybeRequestReview } from '../../services/review';
import {
  MPA_DEFINITIONS,
  MPA_ORDER,
  MPA_CHAR_LIMIT,
  MPA_TARGET_STATEMENTS,
} from '../../constants/mpa';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import { MPA } from '../../types';

const MPA_ACCENT: Record<MPA, string> = {
  executing_the_mission: Colors.mpaBlue,
  leading_people: Colors.mpaGreen,
  managing_resources: Colors.mpaAmber,
  improving_the_unit: Colors.mpaPurple,
};

function charColor(count: number, accent: string): string {
  const pct = count / MPA_CHAR_LIMIT;
  if (pct >= 1) return Colors.error;
  if (pct >= 0.85) return Colors.warning;
  return accent;
}

function MPABlock({
  mpa,
  expanded,
  onToggle,
}: {
  mpa: MPA;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const { getBlock, removeStatement } = useEPBBlocks();
  const { profile } = useProfile();
  const block = getBlock(mpa);
  const def = MPA_DEFINITIONS[mpa];
  const accent = MPA_ACCENT[mpa];
  const cc = charColor(block.characterCount, accent);
  const pct = Math.min(block.characterCount / MPA_CHAR_LIMIT, 1);

  const copyBlock = async () => {
    if (block.statements.length === 0) return;
    await Clipboard.setStringAsync(block.statements.join(' '));
    // Copying a finished block on its way into myEval is the payoff, so that
    // is a moment to ask for a review. A half-built block is not.
    const finished = block.statements.length >= MPA_TARGET_STATEMENTS;
    Alert.alert('Copied', `${def.label} block copied. Paste it into myEval.`, [
      {
        text: 'OK',
        onPress: () => {
          if (finished) maybeRequestReview('block_copied', profile?.reportingPeriodEnd);
        },
      },
    ]);
  };

  const confirmRemove = (index: number) => {
    Alert.alert('Remove Statement', 'Remove this statement from the block?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeStatement(mpa, index),
      },
    ]);
  };

  return (
    <View style={styles.block}>
      {/* Accent bar + header */}
      <View style={styles.blockHeaderRow}>
        <View style={[styles.blockAccent, { backgroundColor: accent }]} />
        <TouchableOpacity style={styles.blockHeader} onPress={onToggle} activeOpacity={0.8}>
          <View style={styles.blockTitleArea}>
            <Text style={styles.blockNum}>MPA {def.blockNumber}</Text>
            <Text style={styles.blockName}>{def.label}</Text>
          </View>
          <View style={styles.blockRight}>
            <Text style={[styles.charCount, { color: cc }]}>
              {block.characterCount}
              <Text style={styles.charMax}>/{MPA_CHAR_LIMIT}</Text>
            </Text>
            <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: cc }]} />
      </View>

      {/* Expanded body */}
      {expanded && (
        <View style={styles.blockBody}>
          {block.statements.length === 0 ? (
            <Text style={styles.empty}>No statements yet.</Text>
          ) : (
            block.statements.map((stmt, i) => (
              <View key={i} style={styles.stmtRow}>
                <View style={[styles.stmtNumBadge, { backgroundColor: accent + '22' }]}>
                  <Text style={[styles.stmtNumText, { color: accent }]}>{i + 1}</Text>
                </View>
                <View style={styles.stmtBody}>
                  <Text style={styles.stmtText}>{stmt}</Text>
                  <View style={styles.stmtMeta}>
                    <Text style={styles.stmtChar}>{stmt.length} chars</Text>
                    <TouchableOpacity
                      onPress={() => confirmRemove(i)}
                      hitSlop={{ top: 8, bottom: 8, left: 16, right: 8 }}
                    >
                      <Text style={styles.removeBtn}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          <View style={styles.blockActions}>
            <TouchableOpacity
              style={[styles.writeBtn, { borderColor: accent }]}
              onPress={() => router.push(`/log/new?mpa=${mpa}&autoWrite=true`)}
              activeOpacity={0.8}
            >
              <Text style={[styles.writeBtnText, { color: accent }]}>✨ Write a Statement</Text>
            </TouchableOpacity>

            {block.statements.length > 0 && (
              <TouchableOpacity style={styles.copyBtn} onPress={copyBlock} activeOpacity={0.8}>
                <Text style={styles.copyBtnText}>📋  Copy Block</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

export default function BuilderScreen() {
  const [expanded, setExpanded] = useState<Record<MPA, boolean>>({
    executing_the_mission: true,
    leading_people: false,
    managing_resources: false,
    improving_the_unit: false,
  });

  const toggle = (mpa: MPA) =>
    setExpanded((prev) => ({ ...prev, [mpa]: !prev[mpa] }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerHeading}>EPB Builder</Text>
          <Text style={styles.bannerSub}>4 blocks · 350 chars each</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {MPA_ORDER.map((mpa) => (
          <MPABlock
            key={mpa}
            mpa={mpa}
            expanded={expanded[mpa]}
            onToggle={() => toggle(mpa)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  banner: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  bannerHeading: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  bannerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2, letterSpacing: 0.3 },

  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  block: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  blockHeaderRow: { flexDirection: 'row' },
  blockAccent: { width: 4 },
  blockHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  blockTitleArea: { flex: 1 },
  blockNum: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  blockName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  blockRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  charCount: { fontSize: FontSize.md, fontWeight: '800' },
  charMax: { fontSize: FontSize.xs, fontWeight: '400', color: Colors.textLight },
  chevron: { fontSize: FontSize.xs, color: Colors.textMuted, width: 12 },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full },
  blockBody: { padding: Spacing.md },
  empty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    fontStyle: 'italic',
  },
  stmtRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  stmtNumBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  stmtNumText: { fontSize: FontSize.xs, fontWeight: '800' },
  stmtBody: { flex: 1 },
  stmtText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  stmtMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  stmtChar: { fontSize: FontSize.xs, color: Colors.textMuted },
  removeBtn: { fontSize: FontSize.xs, color: Colors.error, fontWeight: '600' },

  blockActions: { marginTop: Spacing.md, gap: Spacing.sm },
  writeBtn: {
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  writeBtnText: { fontSize: FontSize.sm, fontWeight: '700' },
  copyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  copyBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
});

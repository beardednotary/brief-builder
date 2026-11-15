import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLogEntries } from '../../hooks/useLogEntries';
import { MPA_DEFINITIONS } from '../../constants/mpa';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import { LogEntry, MPA } from '../../types';

const MPA_FILTERS: { key: MPA | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'executing_the_mission', label: 'Mission' },
  { key: 'leading_people', label: 'People' },
  { key: 'managing_resources', label: 'Resources' },
  { key: 'improving_the_unit', label: 'Unit' },
];

function statusBadge(status: LogEntry['status']): { label: string; color: string } {
  if (status === 'finalized') return { label: 'Final', color: Colors.success };
  if (status === 'polished') return { label: 'Polished', color: Colors.primaryLight };
  return { label: 'Draft', color: Colors.textMuted };
}

export default function LogScreen() {
  const router = useRouter();
  const { entries, deleteEntry } = useLogEntries();
  const [filter, setFilter] = useState<MPA | 'all'>('all');

  const filtered =
    filter === 'all' ? entries : entries.filter((e) => e.mpa === filter);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this log entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Log</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/log/new')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* MPA filter chips */}
      <View style={styles.filters}>
        {MPA_FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, filter === key && styles.chipActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No entries yet.</Text>
            <TouchableOpacity onPress={() => router.push('/log/new')}>
              <Text style={styles.emptyLink}>Log your first accomplishment →</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const badge = statusBadge(item.status);
          const preview = item.rawText ?? item.action ?? '—';
          const mpaLabel = MPA_DEFINITIONS[item.mpa].shortLabel;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/log/${item.id}`)}
              onLongPress={() => confirmDelete(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.preview} numberOfLines={3}>
                  {preview}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.color + '22' }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.meta}>
                  {mpaLabel} · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.status !== 'finalized' && (
                  <TouchableOpacity
                    onPress={() => router.push(`/polish/${item.id}`)}
                    style={styles.polishBtn}
                  >
                    <Text style={styles.polishBtnText}>✨ Write</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  heading: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  addBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm, letterSpacing: 0.3 },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  chipActive: { backgroundColor: '#fff' },
  chipText: { fontSize: FontSize.xs, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  chipTextActive: { color: Colors.primary },
  list: { padding: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  preview: { flex: 1, fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  polishBtn: {
    backgroundColor: Colors.accent + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  polishBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.accent },
  empty: { paddingTop: Spacing.xxl, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginBottom: Spacing.sm },
  emptyLink: { color: Colors.primaryLight, fontWeight: '600', fontSize: FontSize.sm },
});

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { AFSC_LIST } from '../../constants/afsc';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

export default function AFSCScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ code: string; title: string } | null>(
    profile?.afsc ? { code: profile.afsc, title: profile.afscTitle ?? '' } : null
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return AFSC_LIST;
    return AFSC_LIST.filter(
      (a) =>
        a.code.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
    );
  }, [query]);

  const handleNext = async () => {
    if (!selected) return;
    await saveProfile({ afsc: selected.code, afscTitle: selected.title });
    router.push('/(onboarding)/component');
  };

  const handleManual = async () => {
    const code = query.toUpperCase().trim();
    if (!code) return;
    const manual = { code, title: '' };
    setSelected(manual);
    await saveProfile({ afsc: code, afscTitle: '' });
    router.push('/(onboarding)/component');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 4</Text>
        <Text style={styles.title}>What's your AFSC?</Text>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSelected(null);
          }}
          placeholder="Search by code or specialty (e.g. 3P0X1)"
          placeholderTextColor={Colors.textLight}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {selected && (
        <View style={styles.selectedBanner}>
          <Text style={styles.selectedText}>
            ✓ {selected.code}
            {selected.title ? ` — ${selected.title}` : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          query.trim().length >= 4 ? (
            <TouchableOpacity style={styles.manualRow} onPress={handleManual}>
              <Text style={styles.manualText}>
                Use "{query.toUpperCase().trim()}" (not in list)
              </Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.row,
              selected?.code === item.code && styles.rowSelected,
            ]}
            onPress={() => setSelected(item)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.code,
                selected?.code === item.code && styles.codeSelected,
              ]}
            >
              {item.code}
            </Text>
            <Text
              style={[
                styles.title2,
                selected?.code === item.code && styles.titleSelected,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />

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
    paddingBottom: Spacing.sm,
  },
  step: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  searchWrapper: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  selectedBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: '#E8F4EC',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  selectedText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '600' },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  rowSelected: { backgroundColor: '#EEF3FF' },
  code: {
    width: 72,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  codeSelected: { color: Colors.primaryLight },
  title2: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  titleSelected: { color: Colors.primary },
  manualRow: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  manualText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },
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

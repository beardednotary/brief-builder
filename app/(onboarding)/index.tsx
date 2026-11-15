import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const FEATURES = [
  'Log accomplishments as they happen',
  'AI writes EPB-ready performance statements',
  'Organized by MPA with 350-char counters',
  'Copy straight to myEval or AF Form 716',
];

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          accessibilityLabel="BriefBuilder icon"
        />
        <Text style={styles.appName}>BriefBuilder</Text>
        <Text style={styles.tagline}>Write better EPB bullets all year</Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/rank')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Takes about 60 seconds to set up</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  // The icon's background is the same navy as this screen, so only the mark shows.
  icon: { width: 132, height: 132, marginBottom: Spacing.md },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  features: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm + 2,
  },
  check: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginRight: Spacing.sm,
    width: 22,
  },
  featureText: { color: 'rgba(255,255,255,0.88)', fontSize: FontSize.md, flex: 1 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  buttonText: { color: Colors.onAccent, fontSize: FontSize.lg, fontWeight: '700' },
  note: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.sm,
  },
});

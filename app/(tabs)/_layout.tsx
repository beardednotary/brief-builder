import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogEntries } from '../../hooks/useLogEntries';
import { useProfile } from '../../hooks/useProfile';
import { syncRemindersFromStorage } from '../../services/notifications';
import { Colors, FontSize } from '../../constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconsName, inactive: IoniconsName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const { entries, loading } = useLogEntries();
  const { profile } = useProfile();

  // Keep reminders in step with the newest log entry and the close-out date.
  // Entries are stored newest first.
  const lastEntryAt = entries[0]?.createdAt;
  const scod = profile?.reportingPeriodEnd;
  useEffect(() => {
    if (loading) return;
    syncRemindersFromStorage({ lastEntryAt, scod });
  }, [loading, lastEntryAt, scod]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          shadowColor: '#0A2463',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: tabIcon('journal', 'journal-outline'),
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: 'Builder',
          tabBarIcon: tabIcon('document-text', 'document-text-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person-circle', 'person-circle-outline'),
        }}
      />
    </Tabs>
  );
}

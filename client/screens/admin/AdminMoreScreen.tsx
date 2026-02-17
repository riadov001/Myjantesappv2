import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';

const MENU_ITEMS = [
  { id: 'reservations', icon: 'calendar', label: 'Réservations', screen: 'AdminReservations' },
  { id: 'planning', icon: 'clock', label: 'Planning / Calendrier', screen: 'AdminPlanning' },
  { id: 'users', icon: 'users', label: 'Gestion des utilisateurs', screen: 'AdminUsers' },
  { id: 'chat', icon: 'message-circle', label: 'Chat interne', screen: 'AdminChat' },
  { id: 'notifications', icon: 'bell', label: 'Notifications', screen: 'AdminNotifications' },
];

export default function AdminMoreScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  
  const userRole = user?.role as string;
  const canAccessChat = userRole === 'admin' || userRole === 'superadmin' || userRole === 'employee';

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl + 60 }
        ]}
      >
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user?.username || 'Admin'}</ThemedText>
            <ThemedText style={styles.profileEmail}>{user?.email}</ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: theme.primary + '20' }]}>
              <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                {user?.role === 'superadmin' ? 'Super Admin' : 'Administrateur'}
              </ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText style={styles.sectionTitle}>Gestion</ThemedText>
        <Card style={styles.menuCard}>
          {MENU_ITEMS.filter(item => item.id !== 'chat' || canAccessChat).map((item, index, arr) => (
            <Pressable
              key={item.id}
              style={[
                styles.menuItem,
                index < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
              ]}
              onPress={() => handleMenuPress(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.primary + '15' }]}>
                <Feather name={item.icon as any} size={20} color={theme.primary} />
              </View>
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </Card>

        <ThemedText style={styles.sectionTitle}>Compte</ThemedText>
        <Card style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: theme.error + '15' }]}>
              <Feather name="log-out" size={20} color={theme.error} />
            </View>
            <ThemedText style={[styles.menuLabel, { color: theme.error }]}>Se déconnecter</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.error} />
          </Pressable>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.md,
  },
});

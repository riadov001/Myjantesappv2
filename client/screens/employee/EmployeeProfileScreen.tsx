import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function EmployeeProfileScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

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
              {user?.username?.charAt(0).toUpperCase() || 'E'}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user?.username || 'Employ\u00e9'}</ThemedText>
            <ThemedText style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: '#3b82f620' }]}>
              <ThemedText style={[styles.roleText, { color: '#3b82f6' }]}>
                Employ{'\u00e9'}
              </ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Informations</ThemedText>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="mail" size={18} color={theme.textSecondary} />
            <ThemedText style={styles.infoLabel}>Email</ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>{user?.email}</ThemedText>
          </View>
          {user?.phone ? (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <Feather name="phone" size={18} color={theme.textSecondary} />
              <ThemedText style={styles.infoLabel}>T{'\u00e9'}l{'\u00e9'}phone</ThemedText>
              <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>{user.phone}</ThemedText>
            </View>
          ) : null}
        </Card>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Compte</ThemedText>
        <Card style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={logout}>
            <View style={[styles.menuIcon, { backgroundColor: theme.error + '15' }]}>
              <Feather name="log-out" size={20} color={theme.error} />
            </View>
            <ThemedText style={[styles.menuLabel, { color: theme.error }]}>Se d{'\u00e9'}connecter</ThemedText>
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
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
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

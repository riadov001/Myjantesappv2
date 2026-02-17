import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Switch, Alert, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/useApi';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { data: notifications, refetch: refetchNotifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const { isEnabled: pushEnabled, toggleNotifications, permissionStatus } = usePushNotifications();
  const {
    isConnected: calendarConnected,
    isLoading: calendarLoading,
    connectCalendar,
    disconnectCalendar,
    isConfigured: calendarConfigured,
  } = useGoogleCalendar();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllRead.mutateAsync();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refetchNotifications();
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', 'La gestion des notifications est temporairement indisponible.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
          },
        },
      ]
    );
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'superadmin':
        return 'Super Administrateur';
      default:
        return 'Client';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <Card style={StyleSheet.flatten([styles.profileCard, { backgroundColor: theme.backgroundDefault }])}>
          <View style={[styles.avatar, { backgroundColor: `${theme.primary}15` }]}>
            <ThemedText type="h1" style={{ color: theme.primary }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </ThemedText>
          </View>
          <ThemedText type="h3" style={styles.username}>
            {user?.username || 'Utilisateur'}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {user?.email || ''}
          </ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: `${theme.primary}20` }]}>
            <ThemedText type="small" style={{ color: theme.primary, fontWeight: '600' }}>
              {getRoleName(user?.role)}
            </ThemedText>
          </View>
        </Card>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Notifications
          </ThemedText>
          <Card style={StyleSheet.flatten([styles.menuCard, { backgroundColor: theme.backgroundDefault }])}>
            <Pressable style={styles.menuItem} onPress={handleMarkAllRead}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="bell" size={20} color={theme.primary} />
                </View>
                <View>
                  <ThemedText type="body">Notifications non lues</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {unreadCount} notification{unreadCount !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
              {unreadCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.error }]}>
                  <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
                </View>
              ) : (
                <Feather name="check" size={20} color={theme.success} />
              )}
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Paramètres
          </ThemedText>
          <Card style={StyleSheet.flatten([styles.menuCard, { backgroundColor: theme.backgroundDefault }])}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="bell" size={20} color={theme.primary} />
                </View>
                <View>
                  <ThemedText type="body">Notifications push</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Rappels de RDV et mises à jour
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: theme.border, true: `${theme.primary}80` }}
                thumbColor={pushEnabled ? theme.primary : '#f4f3f4'}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.textSecondary}15` }]}>
                  <Feather name="moon" size={20} color={theme.textSecondary} />
                </View>
                <ThemedText type="body">Thème sombre</ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Automatique
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.textSecondary}15` }]}>
                  <Feather name="globe" size={20} color={theme.textSecondary} />
                </View>
                <ThemedText type="body">Langue</ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Français
              </ThemedText>
            </View>
          </Card>
        </View>

        {calendarConfigured ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Google Calendar
            </ThemedText>
            <Card style={StyleSheet.flatten([styles.menuCard, { backgroundColor: theme.backgroundDefault }])}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: calendarConnected ? `${theme.success}15` : `${theme.info}15` }]}>
                    <Feather name="calendar" size={20} color={calendarConnected ? theme.success : theme.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="body">Synchronisation calendrier</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {calendarConnected
                        ? 'Connecté - vos RDV se synchronisent'
                        : 'Ajoutez vos RDV à Google Calendar'}
                    </ThemedText>
                  </View>
                </View>
                {calendarLoading ? (
                  <ActivityIndicator size="small" color={theme.info} />
                ) : (
                  <Pressable
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (calendarConnected) {
                        Alert.alert(
                          'Déconnecter Google Calendar',
                          'Voulez-vous déconnecter votre Google Calendar ?',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Déconnecter', style: 'destructive', onPress: disconnectCalendar },
                          ]
                        );
                      } else {
                        connectCalendar();
                      }
                    }}
                    style={[
                      styles.calendarConnectButton,
                      {
                        backgroundColor: calendarConnected ? `${theme.error}15` : `${theme.info}15`,
                        borderColor: calendarConnected ? theme.error : theme.info,
                      },
                    ]}
                    testID="button-calendar-connect"
                  >
                    <ThemedText
                      type="small"
                      style={{ color: calendarConnected ? theme.error : theme.info, fontWeight: '600' }}
                    >
                      {calendarConnected ? 'Déconnecter' : 'Connecter'}
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            </Card>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            À propos
          </ThemedText>
          <Card style={StyleSheet.flatten([styles.menuCard, { backgroundColor: theme.backgroundDefault }])}>
            <Pressable style={styles.menuItem} onPress={() => (navigation as any).navigate('Legal', { initialTab: 'garanties' })} testID="button-legal-garanties">
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="shield" size={20} color={theme.primary} />
                </View>
                <ThemedText type="body">Garanties</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Pressable style={styles.menuItem} onPress={() => (navigation as any).navigate('Legal', { initialTab: 'confidentialite' })} testID="button-legal-confidentialite">
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="lock" size={20} color={theme.primary} />
                </View>
                <ThemedText type="body">Politique de confidentialité</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Pressable style={styles.menuItem} onPress={() => (navigation as any).navigate('Legal', { initialTab: 'cgv' })} testID="button-legal-cgv">
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="file-text" size={20} color={theme.primary} />
                </View>
                <ThemedText type="body">Conditions Générales de Vente</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${theme.textSecondary}15` }]}>
                  <Feather name="info" size={20} color={theme.textSecondary} />
                </View>
                <ThemedText type="body">Version</ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                1.0.0
              </ThemedText>
            </View>
          </Card>
        </View>

        <Button
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
        >
          Se déconnecter
        </Button>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  username: {
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarConnectButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  logoutButton: {
    marginTop: Spacing.lg,
  },
});

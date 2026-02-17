import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { LoadingSkeleton, QuoteCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Notification } from '@/types';

export default function AdminNotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: notifications, isLoading, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return 'file-text';
      case 'invoice':
        return 'credit-card';
      case 'reservation':
        return 'calendar';
      case 'chat':
        return 'message-circle';
      case 'payment':
        return 'dollar-sign';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'quote':
        return theme.info;
      case 'invoice':
        return theme.warning;
      case 'reservation':
        return theme.success;
      case 'chat':
        return theme.primary;
      case 'payment':
        return theme.success;
      default:
        return theme.textSecondary;
    }
  };

  const handleMarkRead = async (notification: Notification) => {
    try {
      await markRead.mutateAsync(notification.id);
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      refetch();
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', 'La gestion des notifications est temporairement indisponible.');
    }
  };

  const unreadCount = notifications?.filter(n => !(n.isRead || n.read)).length || 0;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
          ]}
        >
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        {unreadCount > 0 && (
          <Pressable
            style={[styles.markAllButton, { borderColor: theme.primary }]}
            onPress={handleMarkAllRead}
          >
            <Feather name="check-circle" size={18} color={theme.primary} />
            <ThemedText style={[styles.markAllText, { color: theme.primary }]}>
              Tout marquer comme lu ({unreadCount})
            </ThemedText>
          </Pressable>
        )}

        {(!notifications || notifications.length === 0) ? (
          <EmptyState
            image={require('../../../assets/images/empty-quotes.png')}
            title="Aucune notification"
            description="Vous n'avez pas de nouvelles notifications"
          />
        ) : (
          notifications.map((notification) => {
            const isRead = notification.isRead || notification.read;
            return (
              <Pressable
                key={notification.id}
                onPress={() => !isRead && handleMarkRead(notification)}
              >
                <Card style={StyleSheet.flatten([styles.notificationCard, !isRead && styles.unreadCard])}>
                  <View style={styles.notificationContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: getNotificationColor(notification.type) + '20' }
                      ]}
                    >
                      <Feather
                        name={getNotificationIcon(notification.type) as any}
                        size={20}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.titleRow}>
                        <ThemedText style={[styles.notificationTitle, !isRead && styles.unreadTitle]}>
                          {notification.title}
                        </ThemedText>
                        {!isRead && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                      </View>
                      <ThemedText style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </ThemedText>
                      <ThemedText style={styles.notificationTime}>
                        {formatDate(notification.createdAt)}
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
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
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  markAllText: {
    fontWeight: '600',
  },
  notificationCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: Spacing.xs,
  },
});

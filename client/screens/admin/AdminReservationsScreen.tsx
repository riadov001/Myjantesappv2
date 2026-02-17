import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton, QuoteCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAdminReservations, useAdminUsers, useServices, useConfirmReservation, useCancelReservation } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Reservation } from '@/types';

export default function AdminReservationsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { data: reservations, isLoading, refetch } = useAdminReservations();
  const { data: users } = useAdminUsers();
  const { data: services } = useServices();
  const confirmReservation = useConfirmReservation();
  const cancelReservation = useCancelReservation();

  const getUserName = (userId?: string) => {
    if (!userId || !users) return 'Client inconnu';
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Client inconnu';
  };

  const getUserPhone = (userId?: string) => {
    if (!userId || !users) return null;
    const user = users.find(u => u.id === userId);
    return user?.phone || null;
  };

  const getServiceName = (serviceId?: string, serviceName?: string) => {
    if (serviceName) return serviceName;
    if (!serviceId || !services) return 'Service inconnu';
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Service inconnu';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleConfirm = async (reservation: Reservation) => {
    try {
      await confirmReservation.mutateAsync(reservation.id);
      refetch();
      Alert.alert('Succès', 'Réservation confirmée');
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', 'La confirmation des réservations est temporairement indisponible. Cette fonctionnalité est en cours de développement.');
    }
  };

  const handleCancel = (reservation: Reservation) => {
    Alert.alert(
      'Annuler la réservation',
      'Voulez-vous vraiment annuler cette réservation?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReservation.mutateAsync(reservation.id);
              refetch();
            } catch (error) {
              Alert.alert('Fonctionnalité indisponible', "L'annulation des réservations est temporairement indisponible.");
            }
          },
        },
      ]
    );
  };

  const pendingReservations = reservations?.filter(r => r.status === 'pending') || [];
  const confirmedReservations = reservations?.filter(r => r.status === 'confirmed') || [];
  const otherReservations = reservations?.filter(r => r.status !== 'pending' && r.status !== 'confirmed') || [];

  console.log('AdminReservationsScreen - All:', reservations);
  console.log('AdminReservationsScreen - Pending:', pendingReservations);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl + 60 }
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

  const renderReservation = (reservation: Reservation) => (
    <Card key={reservation.id} style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.dateContainer}>
          <Feather name="calendar" size={20} color={theme.primary} />
          <View>
            <ThemedText style={styles.reservationDate}>{formatDate(reservation.date)}</ThemedText>
            {reservation.time && (
              <ThemedText style={styles.reservationTime}>{reservation.time}</ThemedText>
            )}
          </View>
        </View>
        <StatusBadge status={reservation.status} />
      </View>

      <View style={styles.reservationBody}>
        <View style={styles.infoRow}>
          <Feather name="user" size={14} color={theme.textSecondary} />
          <ThemedText style={styles.infoText}>{getUserName(reservation.userId || reservation.clientId)}</ThemedText>
        </View>
        {getUserPhone(reservation.userId || reservation.clientId) && (
          <View style={styles.infoRow}>
            <Feather name="phone" size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText}>{getUserPhone(reservation.userId || reservation.clientId)}</ThemedText>
          </View>
        )}
        <View style={styles.infoRow}>
          <Feather name="tool" size={14} color={theme.textSecondary} />
          <ThemedText style={styles.infoText}>{getServiceName(reservation.serviceId, reservation.serviceName)}</ThemedText>
        </View>
        {reservation.notes && (
          <View style={styles.infoRow}>
            <Feather name="message-square" size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText}>{reservation.notes}</ThemedText>
          </View>
        )}
      </View>

      {reservation.status === 'pending' && (
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.success }]}
            onPress={() => handleConfirm(reservation)}
          >
            <Feather name="check" size={16} color="#fff" />
            <ThemedText style={styles.actionBtnText}>Confirmer</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.error }]}
            onPress={() => handleCancel(reservation)}
          >
            <Feather name="x" size={16} color="#fff" />
            <ThemedText style={styles.actionBtnText}>Annuler</ThemedText>
          </Pressable>
        </View>
      )}

      {reservation.status === 'confirmed' && (
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.error }]}
            onPress={() => handleCancel(reservation)}
          >
            <Feather name="x" size={16} color="#fff" />
            <ThemedText style={styles.actionBtnText}>Annuler</ThemedText>
          </Pressable>
        </View>
      )}
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl + 60 }
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        {(!reservations || reservations.length === 0) ? (
          <EmptyState
            image={require('../../../assets/images/empty-reservations.png')}
            title="Aucune réservation"
            description="Les réservations apparaîtront ici"
          />
        ) : (
          <>
            {pendingReservations.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={[styles.badge, { backgroundColor: theme.warning + '20' }]}>
                    <ThemedText style={[styles.badgeText, { color: theme.warning }]}>
                      {pendingReservations.length}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.sectionTitle}>En attente de confirmation</ThemedText>
                </View>
                {pendingReservations.map(renderReservation)}
              </>
            )}

            {confirmedReservations.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={[styles.badge, { backgroundColor: theme.success + '20' }]}>
                    <ThemedText style={[styles.badgeText, { color: theme.success }]}>
                      {confirmedReservations.length}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.sectionTitle}>Confirmées</ThemedText>
                </View>
                {confirmedReservations.map(renderReservation)}
              </>
            )}

            {otherReservations.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Historique</ThemedText>
                </View>
                {otherReservations.map(renderReservation)}
              </>
            )}
          </>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reservationCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reservationDate: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reservationTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  reservationBody: {
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

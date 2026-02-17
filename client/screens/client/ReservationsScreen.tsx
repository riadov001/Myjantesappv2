import React, { useState, useEffect } from 'react';
import { View, StyleSheet, RefreshControl, Alert, Modal, TextInput, Pressable, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useReservations, useCancelReservation, useServices, useCreateReservation } from '@/hooks/useApi';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Reservation, Service } from '@/types';

export default function ReservationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const { data: reservations, isLoading, refetch, isRefetching } = useReservations();
  const { data: services } = useServices();
  const cancelReservation = useCancelReservation();
  const createReservation = useCreateReservation();
  const {
    isConnected: calendarConnected,
    isSyncing,
    addReservationToCalendar,
    syncAllReservations,
    connectCalendar,
    isConfigured: calendarConfigured,
  } = useGoogleCalendar();

  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());

  const onRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await refetch();
    console.log('Manual refresh reservations:', result.data);
  };

  const handleCancel = (id: string) => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReservation.mutateAsync(id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refetch();
            } catch (error) {
              Alert.alert('Fonctionnalité indisponible', "L'annulation des réservations est temporairement indisponible.");
            }
          },
        },
      ]
    );
  };

  const handleCreateReservation = async () => {
    if (!selectedService || !date || !time) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReservation.mutateAsync({
        serviceId: selectedService.id,
        date,
        time,
        notes: notes || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setSelectedService(null);
      setDate('');
      setTime('');
      setNotes('');
      await refetch();
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', 'La création de réservations est temporairement indisponible. Cette fonctionnalité est en cours de développement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCalendar = async (reservation: Reservation) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!calendarConnected) {
      Alert.alert(
        'Google Calendar',
        'Connectez votre Google Calendar depuis votre profil pour synchroniser vos rendez-vous.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Connecter', onPress: connectCalendar },
        ]
      );
      return;
    }
    const success = await addReservationToCalendar(reservation);
    if (success) {
      setSyncedIds(prev => new Set([...prev, reservation.id]));
    }
  };

  const handleSyncAll = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!calendarConnected) {
      Alert.alert(
        'Google Calendar',
        'Connectez votre Google Calendar depuis votre profil pour synchroniser vos rendez-vous.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Connecter', onPress: connectCalendar },
        ]
      );
      return;
    }
    if (reservations) {
      await syncAllReservations(reservations);
    }
  };

  const renderReservation = ({ item }: { item: Reservation }) => {
    const canCancel = item.status === 'pending' || item.status === 'confirmed';
    const isFuture = new Date(item.date) >= new Date();
    const isSynced = syncedIds.has(item.id);

    return (
      <Card style={StyleSheet.flatten([styles.reservationCard, { backgroundColor: theme.backgroundDefault }])}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <View style={[styles.serviceIcon, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name="tool" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="h4">{item.serviceName || 'Service'}</ThemedText>
              <StatusBadge status={item.status} size="small" />
            </View>
          </View>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeItem}>
            <Feather name="calendar" size={16} color={theme.textSecondary} />
            <ThemedText type="body">
              {new Date(item.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </ThemedText>
          </View>
          {item.time ? (
            <View style={styles.dateTimeItem}>
              <Feather name="clock" size={16} color={theme.textSecondary} />
              <ThemedText type="body">{item.time}</ThemedText>
            </View>
          ) : null}
        </View>

        {item.notes ? (
          <View style={styles.notesSection}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.notes}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          {isFuture && calendarConfigured ? (
            <Pressable
              onPress={() => handleAddToCalendar(item)}
              disabled={isSyncing || isSynced}
              style={[
                styles.calendarButton,
                {
                  backgroundColor: isSynced ? `${theme.success}15` : `${theme.info}15`,
                  borderColor: isSynced ? theme.success : theme.info,
                },
              ]}
              testID={`button-calendar-${item.id}`}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={theme.info} />
              ) : (
                <>
                  <Feather
                    name={isSynced ? 'check-circle' : 'calendar'}
                    size={16}
                    color={isSynced ? theme.success : theme.info}
                  />
                  <ThemedText
                    type="small"
                    style={{ color: isSynced ? theme.success : theme.info, fontWeight: '600' }}
                  >
                    {isSynced ? 'Synchronisé' : 'Google Calendar'}
                  </ThemedText>
                </>
              )}
            </Pressable>
          ) : null}

          {canCancel ? (
            <Pressable
              onPress={() => handleCancel(item.id)}
              style={[styles.cancelButton, { borderColor: theme.error }]}
              testID={`button-cancel-${item.id}`}
            >
              <ThemedText type="small" style={{ color: theme.error, fontWeight: '600' }}>
                Annuler
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </Card>
    );
  };

  const sortedReservations = [...(reservations || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  console.log('ClientReservationsScreen - All:', reservations);

  const ListHeader = () => {
    if (!calendarConfigured || sortedReservations.length === 0) return null;

    return (
      <View style={styles.syncBar}>
        <Pressable
          onPress={handleSyncAll}
          disabled={isSyncing}
          style={[styles.syncAllButton, { backgroundColor: `${theme.info}15`, borderColor: theme.info }]}
          testID="button-sync-all"
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.info} />
          ) : (
            <Feather name="refresh-cw" size={16} color={theme.info} />
          )}
          <ThemedText type="small" style={{ color: theme.info, fontWeight: '600' }}>
            {isSyncing ? 'Synchronisation...' : 'Synchroniser avec Google Calendar'}
          </ThemedText>
          {calendarConnected ? (
            <View style={[styles.connectedDot, { backgroundColor: theme.success }]} />
          ) : null}
        </Pressable>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={sortedReservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              image={require('../../../assets/images/empty-reservations.png')}
              title="Aucune réservation"
              description="Vous n'avez pas encore de réservation."
              actionLabel="Réserver maintenant"
              onAction={() => setShowModal(true)}
            />
          )
        }
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing['4xl'],
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      />

      <View style={[styles.fabContainer, { bottom: tabBarHeight + Spacing.lg }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowModal(true);
          }}
          style={[styles.fab, { backgroundColor: theme.primary }]}
          testID="button-new-reservation"
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Nouvelle réservation</ThemedText>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Service *
                </ThemedText>
                <View style={styles.serviceList}>
                  {services?.map((service) => (
                    <Pressable
                      key={service.id}
                      onPress={() => setSelectedService(service)}
                      style={[
                        styles.serviceOption,
                        {
                          backgroundColor:
                            selectedService?.id === service.id
                              ? `${theme.primary}15`
                              : theme.backgroundDefault,
                          borderColor:
                            selectedService?.id === service.id
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    >
                      <ThemedText type="body">{service.name}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Date * (AAAA-MM-JJ)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
                  ]}
                  value={date}
                  onChangeText={setDate}
                  placeholder="2025-02-15"
                  placeholderTextColor={theme.textSecondary}
                  testID="input-date"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Heure * (HH:MM)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
                  ]}
                  value={time}
                  onChangeText={setTime}
                  placeholder="10:00"
                  placeholderTextColor={theme.textSecondary}
                  testID="input-time"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Notes (optionnel)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Informations supplémentaires..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  testID="input-notes"
                />
              </View>

              <Button
                onPress={handleCreateReservation}
                disabled={isSubmitting}
                style={{ marginTop: Spacing.lg }}
                testID="button-create-reservation"
              >
                {isSubmitting ? 'Création...' : 'Créer la réservation'}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  syncBar: {
    marginBottom: Spacing.lg,
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reservationCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  notesSection: {
    padding: Spacing.md,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  calendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  fabContainer: {
    position: 'absolute',
    right: Spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  serviceList: {
    gap: Spacing.sm,
  },
  serviceOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
});

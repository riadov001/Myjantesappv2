import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useTheme } from '@/hooks/useTheme';
import { useAdminReservations, useAdminUsers, useServices, useConfirmReservation, useCancelReservation, useUpdateReservation } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Reservation, User } from '@/types';

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function AdminPlanningScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: reservations, isLoading, refetch } = useAdminReservations();
  const { data: users } = useAdminUsers();
  const { data: services } = useServices();
  const confirmReservation = useConfirmReservation();
  const cancelReservation = useCancelReservation();
  const updateReservation = useUpdateReservation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const employees = useMemo(() => {
    return users?.filter(u => u.role === 'employee' || u.role === 'admin' || u.role === 'superadmin') || [];
  }, [users]);

  const getUserName = (userId?: string) => {
    if (!userId || !users) return 'Client inconnu';
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Client inconnu';
  };

  const getServiceName = (serviceId?: string, serviceName?: string) => {
    if (serviceName) return serviceName;
    if (!serviceId || !services) return 'Service inconnu';
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Service inconnu';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getReservationsForDate = (day: number) => {
    if (!reservations) return [];
    // Normalize target date to midnight local time
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const targetYMD = `${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}`;
    
    return reservations.filter(r => {
      if (!r.date) return false;
      const resDate = new Date(r.date);
      const resYMD = `${resDate.getFullYear()}-${resDate.getMonth()}-${resDate.getDate()}`;
      return resYMD === targetYMD;
    });
  };

  const selectedDateReservations = useMemo(() => {
    if (!selectedDate || !reservations) return [];
    const targetYMD = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    
    return reservations.filter(r => {
      if (!r.date) return false;
      const resDate = new Date(r.date);
      const resYMD = `${resDate.getFullYear()}-${resDate.getMonth()}-${resDate.getDate()}`;
      return resYMD === targetYMD;
    });
  }, [selectedDate, reservations]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    refetch();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    refetch();
  };

  const handleDayPress = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
  };

  const handleReservationPress = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDetailModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedReservation) return;
    try {
      await confirmReservation.mutateAsync(selectedReservation.id);
      setDetailModal(false);
      refetch();
      Alert.alert('Succès', 'Réservation confirmée');
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', 'La confirmation est temporairement indisponible. Cette fonctionnalité est en cours de développement.');
    }
  };

  const handleCancel = async () => {
    if (!selectedReservation) return;
    Alert.alert('Annuler', 'Voulez-vous vraiment annuler cette réservation?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelReservation.mutateAsync(selectedReservation.id);
            setDetailModal(false);
            refetch();
          } catch (error) {
            Alert.alert('Fonctionnalité indisponible', "L'annulation est temporairement indisponible.");
          }
        },
      },
    ]);
  };

  const handleOpenAssign = () => {
    if (!selectedReservation) return;
    setSelectedEmployee((selectedReservation as any).assignedTo || '');
    setAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedReservation) return;
    try {
      await updateReservation.mutateAsync({
        id: selectedReservation.id,
        data: { assignedTo: selectedEmployee || undefined }
      });
      setAssignModal(false);
      refetch();
      Alert.alert('Succès', 'Assignation mise à jour');
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', "L'assignation est temporairement indisponible. Cette fonctionnalité est en cours de développement.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
          <LoadingSkeleton width="100%" height={300} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={prevMonth} style={styles.navButton}>
              <Feather name="chevron-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.monthTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </ThemedText>
            <Pressable onPress={nextMonth} style={styles.navButton}>
              <Feather name="chevron-right" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {DAYS_OF_WEEK.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <ThemedText style={styles.weekDayText}>{day}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const dayReservations = getReservationsForDate(day);
              const hasReservations = dayReservations.length > 0;
              const hasPending = dayReservations.some(r => r.status === 'pending');
              const isSelected = selectedDate &&
                day === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();

              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday(day) && { borderColor: theme.primary, borderWidth: 2 },
                    isSelected && { backgroundColor: theme.primary + '30' },
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <ThemedText style={[
                    styles.dayText,
                    isToday(day) && { color: theme.primary, fontWeight: '700' },
                  ]}>
                    {day}
                  </ThemedText>
                  {hasReservations && (
                    <View style={styles.reservationDots}>
                      {hasPending ? (
                        <View style={[styles.dot, { backgroundColor: theme.warning }]} />
                      ) : (
                        <View style={[styles.dot, { backgroundColor: theme.success }]} />
                      )}
                      {dayReservations.length > 1 && (
                        <ThemedText style={styles.dotCount}>+{dayReservations.length - 1}</ThemedText>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {selectedDate && (
          <View style={styles.selectedDateSection}>
            <ThemedText style={styles.sectionTitle}>
              {formatDate(selectedDate.toISOString())}
            </ThemedText>
            {selectedDateReservations.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Feather name="calendar" size={24} color={theme.textSecondary} />
                <ThemedText style={styles.emptyText}>Aucune réservation</ThemedText>
              </Card>
            ) : (
              selectedDateReservations.map((reservation) => (
                <Pressable key={reservation.id} onPress={() => handleReservationPress(reservation)}>
                  <Card style={styles.reservationCard}>
                    <View style={styles.reservationHeader}>
                      <View style={styles.timeContainer}>
                        <Feather name="clock" size={16} color={theme.primary} />
                        <ThemedText style={styles.timeText}>
                          {reservation.time || 'Toute la journée'}
                        </ThemedText>
                      </View>
                      <StatusBadge status={reservation.status} />
                    </View>
                    <View style={styles.reservationInfo}>
                      <ThemedText style={styles.clientName}>
                        {getUserName(reservation.userId || reservation.clientId)}
                      </ThemedText>
                      <ThemedText style={styles.serviceName}>
                        {getServiceName(reservation.serviceId, reservation.serviceName)}
                      </ThemedText>
                      {(reservation as any).assignedTo && (
                        <View style={styles.assignedRow}>
                          <Feather name="user-check" size={14} color={theme.info} />
                          <ThemedText style={[styles.assignedText, { color: theme.info }]}>
                            Assigné à: {getUserName((reservation as any).assignedTo)}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Détails de la réservation</ThemedText>
              <Pressable onPress={() => setDetailModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedReservation && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={18} color={theme.primary} />
                  <ThemedText style={styles.detailText}>
                    {formatDate(selectedReservation.date)}
                  </ThemedText>
                </View>
                {selectedReservation.time && (
                  <View style={styles.detailRow}>
                    <Feather name="clock" size={18} color={theme.primary} />
                    <ThemedText style={styles.detailText}>{selectedReservation.time}</ThemedText>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Feather name="user" size={18} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText}>
                    {getUserName(selectedReservation.userId || selectedReservation.clientId)}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="tool" size={18} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText}>
                    {getServiceName(selectedReservation.serviceId, selectedReservation.serviceName)}
                  </ThemedText>
                </View>
                {selectedReservation.notes && (
                  <View style={styles.detailRow}>
                    <Feather name="message-square" size={18} color={theme.textSecondary} />
                    <ThemedText style={styles.detailText}>{selectedReservation.notes}</ThemedText>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Feather name="info" size={18} color={theme.textSecondary} />
                  <StatusBadge status={selectedReservation.status} />
                </View>
              </View>
            )}

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.footerButton, { backgroundColor: theme.info + '20', borderColor: theme.info }]}
                onPress={handleOpenAssign}
              >
                <Feather name="user-plus" size={16} color={theme.info} />
                <ThemedText style={{ color: theme.info }}>Assigner</ThemedText>
              </Pressable>
              {selectedReservation?.status === 'pending' && (
                <Pressable
                  style={[styles.footerButton, { backgroundColor: theme.success }]}
                  onPress={handleConfirm}
                >
                  <Feather name="check" size={16} color="#fff" />
                  <ThemedText style={{ color: '#fff' }}>Confirmer</ThemedText>
                </Pressable>
              )}
              {(selectedReservation?.status === 'pending' || selectedReservation?.status === 'confirmed') && (
                <Pressable
                  style={[styles.footerButton, { backgroundColor: theme.error }]}
                  onPress={handleCancel}
                >
                  <Feather name="x" size={16} color="#fff" />
                  <ThemedText style={{ color: '#fff' }}>Annuler</ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={assignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Assigner un employé</ThemedText>
              <Pressable onPress={() => setAssignModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Pressable
                style={[
                  styles.employeeItem,
                  { borderColor: theme.border },
                  !selectedEmployee && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                ]}
                onPress={() => setSelectedEmployee('')}
              >
                <Feather
                  name={!selectedEmployee ? 'check-circle' : 'circle'}
                  size={20}
                  color={!selectedEmployee ? theme.primary : theme.textSecondary}
                />
                <ThemedText>Non assigné</ThemedText>
              </Pressable>
              {employees.map((emp) => (
                <Pressable
                  key={emp.id}
                  style={[
                    styles.employeeItem,
                    { borderColor: theme.border },
                    selectedEmployee === emp.id && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => setSelectedEmployee(emp.id)}
                >
                  <Feather
                    name={selectedEmployee === emp.id ? 'check-circle' : 'circle'}
                    size={20}
                    color={selectedEmployee === emp.id ? theme.primary : theme.textSecondary}
                  />
                  <ThemedText>
                    {emp.firstName || ''} {emp.lastName || ''} ({emp.role})
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setAssignModal(false)}
              >
                <ThemedText>Annuler</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleAssign}
              >
                <ThemedText style={{ color: '#fff' }}>Confirmer</ThemedText>
              </Pressable>
            </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  calendarCard: {
    padding: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  navButton: {
    padding: Spacing.sm,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  dayText: {
    fontSize: 14,
  },
  reservationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCount: {
    fontSize: 8,
    marginLeft: 2,
  },
  selectedDateSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'capitalize',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    opacity: 0.6,
  },
  reservationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reservationInfo: {
    gap: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '500',
  },
  serviceName: {
    fontSize: 13,
    opacity: 0.7,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  assignedText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert, Modal, TextInput } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton, InvoiceCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAdminInvoices, useAdminUsers, useMarkInvoicePaid, useSendInvoiceEmail } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Invoice } from '@/types';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Carte bancaire' },
  { value: 'cash', label: 'Espèces' },
  { value: 'wire_transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
];

export default function AdminInvoicesScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: invoices, isLoading, refetch } = useAdminInvoices();
  const { data: users } = useAdminUsers();
  const markPaid = useMarkInvoicePaid();
  const sendEmail = useSendInvoiceEmail();

  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

  const getUserName = (clientId?: string) => {
    if (!clientId || !users) return 'Client inconnu';
    const user = users.find(u => u.id === clientId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Client inconnu';
  };

  const formatCurrency = (value: number | string | undefined) => {
    const num = Number(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleMarkPaid = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSelectedPaymentMethod('card');
    setPaymentModal(true);
  };

  const confirmMarkPaid = async () => {
    if (!selectedInvoice) return;
    try {
      await markPaid.mutateAsync({ id: selectedInvoice.id, paymentMethod: selectedPaymentMethod });
      setPaymentModal(false);
      refetch();
      Alert.alert('Succès', 'Facture marquée comme payée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer la facture comme payée');
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    try {
      await sendEmail.mutateAsync(invoice.id);
      Alert.alert('Succès', 'Email envoyé au client');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl }
          ]}
        >
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.success + '20' }]}>
            <ThemedText style={[styles.statValue, { color: theme.success }]}>
              {invoices?.filter(i => i.status === 'paid').length || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Payées</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.warning + '20' }]}>
            <ThemedText style={[styles.statValue, { color: theme.warning }]}>
              {invoices?.filter(i => i.status === 'pending').length || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>En attente</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.error + '20' }]}>
            <ThemedText style={[styles.statValue, { color: theme.error }]}>
              {invoices?.filter(i => i.status === 'overdue').length || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>En retard</ThemedText>
          </View>
        </View>

        {!invoices || invoices.length === 0 ? (
          <EmptyState
            image={require('../../../assets/images/empty-invoices.png')}
            title="Aucune facture"
            description="Les factures apparaîtront ici"
          />
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View>
                  <ThemedText style={styles.invoiceNumber}>
                    {(invoice as any).reference || invoice.number || invoice.invoiceNumber || 'Facture'}
                  </ThemedText>
                  <ThemedText style={styles.clientName}>{getUserName(invoice.clientId)}</ThemedText>
                </View>
                <StatusBadge status={invoice.status === 'draft' || invoice.status === 'sent' ? 'pending' : invoice.status} />
              </View>

              <View style={styles.invoiceDetails}>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText}>{formatDate(invoice.createdAt)}</ThemedText>
                </View>
                {invoice.dueDate && (
                  <View style={styles.detailRow}>
                    <Feather name="clock" size={14} color={theme.textSecondary} />
                    <ThemedText style={styles.detailText}>Échéance: {formatDate(invoice.dueDate)}</ThemedText>
                  </View>
                )}
                {invoice.paymentMethod && (
                  <View style={styles.detailRow}>
                    <Feather name="credit-card" size={14} color={theme.textSecondary} />
                    <ThemedText style={styles.detailText}>
                      {PAYMENT_METHODS.find(m => m.value === invoice.paymentMethod)?.label || invoice.paymentMethod}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.invoiceFooter}>
                <ThemedText style={styles.invoiceAmount}>
                  {formatCurrency((invoice as any).totalAmount || invoice.totalTTC || invoice.amount)}
                </ThemedText>
                <View style={styles.actionButtons}>
                  {invoice.status !== 'paid' && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.success + '20' }]}
                      onPress={() => handleMarkPaid(invoice)}
                    >
                      <Feather name="check-circle" size={16} color={theme.success} />
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.info + '20' }]}
                    onPress={() => handleSendEmail(invoice)}
                  >
                    <Feather name="mail" size={16} color={theme.info} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={paymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Marquer comme payée</ThemedText>
              <Pressable onPress={() => setPaymentModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.inputLabel}>Mode de paiement</ThemedText>
              <View style={styles.paymentMethods}>
                {PAYMENT_METHODS.map((method) => (
                  <Pressable
                    key={method.value}
                    style={[
                      styles.paymentMethodItem,
                      { borderColor: theme.border },
                      selectedPaymentMethod === method.value && { 
                        borderColor: theme.primary,
                        backgroundColor: theme.primary + '10'
                      }
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.value)}
                  >
                    <Feather 
                      name={selectedPaymentMethod === method.value ? 'check-circle' : 'circle'} 
                      size={20} 
                      color={selectedPaymentMethod === method.value ? theme.primary : theme.textSecondary} 
                    />
                    <ThemedText style={styles.paymentMethodLabel}>{method.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setPaymentModal(false)}
              >
                <ThemedText>Annuler</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={confirmMarkPaid}
                disabled={markPaid.isPending}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  invoiceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  clientName: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  invoiceDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 14,
    opacity: 0.8,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    paddingTop: Spacing.md,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
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
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  paymentMethods: {
    gap: Spacing.sm,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  paymentMethodLabel: {
    fontSize: 16,
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

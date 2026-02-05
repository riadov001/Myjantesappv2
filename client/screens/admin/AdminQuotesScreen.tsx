import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert, Modal, TextInput } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton, QuoteCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAdminQuotes, useAdminUsers, useServices, useCreateQuote, useUpdateQuote, useDeleteQuote, useGenerateInvoice } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Quote, User, Service } from '@/types';

export default function AdminQuotesScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: quotes, isLoading, refetch } = useAdminQuotes();
  const { data: users } = useAdminUsers();
  const { data: services } = useServices();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const generateInvoice = useGenerateInvoice();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    wheelCount: '1',
    diameter: '',
    priceExcludingTax: '',
    taxRate: '20',
    notes: '',
  });

  const getUserName = (clientId?: string) => {
    if (!clientId || !users) return 'Client inconnu';
    const user = users.find(u => u.id === clientId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Client inconnu';
  };

  const getServiceName = (serviceId?: string) => {
    if (!serviceId || !services) return 'Service inconnu';
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Service inconnu';
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

  const handleCreateQuote = () => {
    setSelectedQuote(null);
    setFormData({
      clientId: users?.[0]?.id || '',
      serviceId: services?.[0]?.id || '',
      wheelCount: '1',
      diameter: '',
      priceExcludingTax: '',
      taxRate: '20',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setFormData({
      clientId: quote.clientId || '',
      serviceId: quote.serviceId || '',
      wheelCount: String((quote as any).wheelCount || 1),
      diameter: (quote as any).diameter || '',
      priceExcludingTax: String((quote as any).priceExcludingTax || ''),
      taxRate: String((quote as any).taxRate || 20),
      notes: quote.notes || '',
    });
    setModalVisible(true);
  };

  const handleSaveQuote = async () => {
    try {
      const priceHT = Number(formData.priceExcludingTax) || 0;
      const taxRate = Number(formData.taxRate) || 20;
      const taxAmount = priceHT * (taxRate / 100);
      const totalTTC = priceHT + taxAmount;

      const data = {
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        wheelCount: Number(formData.wheelCount) || 1,
        diameter: formData.diameter,
        priceExcludingTax: priceHT.toFixed(2),
        taxRate: taxRate.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        quoteAmount: totalTTC.toFixed(2),
        notes: formData.notes,
        status: 'pending' as const,
      };

      if (selectedQuote) {
        await updateQuote.mutateAsync({ id: selectedQuote.id, data });
      } else {
        await createQuote.mutateAsync(data);
      }
      setModalVisible(false);
      refetch();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le devis');
    }
  };

  const handleDeleteQuote = (quote: Quote) => {
    Alert.alert(
      'Supprimer le devis',
      `Voulez-vous vraiment supprimer le devis ${quote.reference || quote.id}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuote.mutateAsync(quote.id);
              refetch();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le devis');
            }
          },
        },
      ]
    );
  };

  const handleGenerateInvoice = async (quote: Quote) => {
    try {
      await generateInvoice.mutateAsync(quote.id);
      Alert.alert('Succès', 'Facture générée avec succès');
      refetch();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer la facture');
    }
  };

  const handleApproveQuote = async (quote: Quote) => {
    try {
      await updateQuote.mutateAsync({ id: quote.id, data: { status: 'approved' } });
      refetch();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de valider le devis');
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
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        <Pressable style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={handleCreateQuote}>
          <Feather name="plus" size={20} color="#fff" />
          <ThemedText style={styles.addButtonText}>Nouveau devis</ThemedText>
        </Pressable>

        {!quotes || quotes.length === 0 ? (
          <EmptyState
            image={require('../../../assets/images/empty-quotes.png')}
            title="Aucun devis"
            description="Créez votre premier devis"
          />
        ) : (
          quotes.map((quote) => (
            <Card key={quote.id} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <View>
                  <ThemedText style={styles.quoteReference}>{quote.reference || 'Devis'}</ThemedText>
                  <ThemedText style={styles.clientName}>{getUserName(quote.clientId)}</ThemedText>
                </View>
                <StatusBadge status={quote.status === 'draft' || quote.status === 'sent' ? 'pending' : quote.status} />
              </View>

              <View style={styles.quoteDetails}>
                <View style={styles.detailRow}>
                  <Feather name="tool" size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText}>{getServiceName(quote.serviceId)}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText}>{formatDate(quote.createdAt)}</ThemedText>
                </View>
              </View>

              <View style={styles.quoteFooter}>
                <ThemedText style={styles.quoteAmount}>
                  {formatCurrency((quote as any).quoteAmount || quote.totalTTC)}
                </ThemedText>
                <View style={styles.actionButtons}>
                  {quote.status === 'pending' && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.success + '20' }]}
                      onPress={() => handleApproveQuote(quote)}
                    >
                      <Feather name="check" size={16} color={theme.success} />
                    </Pressable>
                  )}
                  {quote.status === 'approved' && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.info + '20' }]}
                      onPress={() => handleGenerateInvoice(quote)}
                    >
                      <Feather name="file-plus" size={16} color={theme.info} />
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.primary + '20' }]}
                    onPress={() => handleEditQuote(quote)}
                  >
                    <Feather name="edit-2" size={16} color={theme.primary} />
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.error + '20' }]}
                    onPress={() => handleDeleteQuote(quote)}
                  >
                    <Feather name="trash-2" size={16} color={theme.error} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {selectedQuote ? 'Modifier le devis' : 'Nouveau devis'}
              </ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.inputLabel}>Client</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {users?.filter(u => u.role === 'client').map((user) => (
                    <Pressable
                      key={user.id}
                      style={[
                        styles.pickerItem,
                        formData.clientId === user.id && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => setFormData({ ...formData, clientId: user.id })}
                    >
                      <ThemedText style={[
                        styles.pickerItemText,
                        formData.clientId === user.id && { color: '#fff' }
                      ]}>
                        {user.firstName || user.email}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <ThemedText style={styles.inputLabel}>Service</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {services?.map((service) => (
                    <Pressable
                      key={service.id}
                      style={[
                        styles.pickerItem,
                        formData.serviceId === service.id && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => setFormData({ ...formData, serviceId: service.id })}
                    >
                      <ThemedText style={[
                        styles.pickerItemText,
                        formData.serviceId === service.id && { color: '#fff' }
                      ]}>
                        {service.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <ThemedText style={styles.inputLabel}>Nb jantes</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={formData.wheelCount}
                    onChangeText={(text) => setFormData({ ...formData, wheelCount: text })}
                    keyboardType="numeric"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.halfInput}>
                  <ThemedText style={styles.inputLabel}>Diamètre</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={formData.diameter}
                    onChangeText={(text) => setFormData({ ...formData, diameter: text })}
                    placeholder="17"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <ThemedText style={styles.inputLabel}>Prix HT</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={formData.priceExcludingTax}
                    onChangeText={(text) => setFormData({ ...formData, priceExcludingTax: text })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.halfInput}>
                  <ThemedText style={styles.inputLabel}>TVA %</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={formData.taxRate}
                    onChangeText={(text) => setFormData({ ...formData, taxRate: text })}
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <ThemedText style={styles.inputLabel}>Notes</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
                placeholder="Notes..."
                placeholderTextColor={theme.textSecondary}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText>Annuler</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveQuote}
                disabled={createQuote.isPending || updateQuote.isPending}
              >
                <ThemedText style={{ color: '#fff' }}>
                  {selectedQuote ? 'Modifier' : 'Créer'}
                </ThemedText>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  quoteCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  quoteReference: {
    fontSize: 16,
    fontWeight: '700',
  },
  clientName: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  quoteDetails: {
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
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    paddingTop: Spacing.md,
  },
  quoteAmount: {
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
    maxHeight: '90%',
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
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  pickerItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  pickerItemText: {
    fontSize: 14,
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

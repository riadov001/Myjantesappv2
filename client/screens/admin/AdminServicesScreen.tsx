import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert, Modal, TextInput, Switch } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { LoadingSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useServices, useCreateService, useUpdateService } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Service } from '@/types';

export default function AdminServicesScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { data: services, isLoading, refetch } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    isActive: true,
  });

  const formatCurrency = (value: number | string | undefined) => {
    const num = Number(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      category: '',
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      basePrice: String(Number(service.basePrice) || Number((service as any).price) || ''),
      category: service.category || '',
      isActive: service.isActive,
    });
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du service est requis');
      return;
    }

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        basePrice: Number(formData.basePrice) || 0,
        category: formData.category,
        isActive: formData.isActive,
      };

      if (selectedService) {
        await updateService.mutateAsync({ id: selectedService.id, data });
      } else {
        await createService.mutateAsync(data);
      }
      setModalVisible(false);
      refetch();
      Alert.alert('Succès', selectedService ? 'Service modifié' : 'Service créé');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le service');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await updateService.mutateAsync({
        id: service.id,
        data: { isActive: !service.isActive }
      });
      refetch();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl + 60 }
          ]}
        >
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </ScrollView>
      </ThemedView>
    );
  }

  const activeServices = services?.filter(s => s.isActive) || [];
  const inactiveServices = services?.filter(s => !s.isActive) || [];

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
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateService}
        >
          <Feather name="plus" size={20} color="#fff" />
          <ThemedText style={styles.addButtonText}>Nouveau service</ThemedText>
        </Pressable>

        {(!services || services.length === 0) ? (
          <EmptyState
            image={require('../../../assets/images/empty-quotes.png')}
            title="Aucun service"
            description="Créez votre premier service"
          />
        ) : (
          <>
            {activeServices.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Services actifs ({activeServices.length})</ThemedText>
                {activeServices.map((service) => (
                  <Card key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <ThemedText style={styles.serviceName}>{service.name}</ThemedText>
                        {service.category ? (
                          <ThemedText style={styles.serviceCategory}>{service.category}</ThemedText>
                        ) : null}
                      </View>
                      <Switch
                        value={service.isActive}
                        onValueChange={() => handleToggleActive(service)}
                        trackColor={{ false: theme.border, true: theme.success + '80' }}
                        thumbColor={service.isActive ? theme.success : theme.textSecondary}
                      />
                    </View>
                    {service.description ? (
                      <ThemedText style={styles.serviceDescription}>{service.description}</ThemedText>
                    ) : null}
                    <View style={styles.serviceFooter}>
                      <ThemedText style={styles.servicePrice}>
                        {formatCurrency(service.basePrice || (service as any).price)}
                      </ThemedText>
                      <Pressable
                        style={[styles.editBtn, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => handleEditService(service)}
                      >
                        <Feather name="edit-2" size={16} color={theme.primary} />
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {inactiveServices.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Services inactifs ({inactiveServices.length})</ThemedText>
                {inactiveServices.map((service) => (
                  <Card key={service.id} style={StyleSheet.flatten([styles.serviceCard, styles.inactiveCard])}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <ThemedText style={styles.serviceName}>{service.name}</ThemedText>
                        {service.category ? (
                          <ThemedText style={styles.serviceCategory}>{service.category}</ThemedText>
                        ) : null}
                      </View>
                      <Switch
                        value={service.isActive}
                        onValueChange={() => handleToggleActive(service)}
                        trackColor={{ false: theme.border, true: theme.success + '80' }}
                        thumbColor={service.isActive ? theme.success : theme.textSecondary}
                      />
                    </View>
                    <View style={styles.serviceFooter}>
                      <ThemedText style={styles.servicePrice}>
                        {formatCurrency(service.basePrice || (service as any).price)}
                      </ThemedText>
                      <Pressable
                        style={[styles.editBtn, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => handleEditService(service)}
                      >
                        <Feather name="edit-2" size={16} color={theme.primary} />
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {selectedService ? 'Modifier le service' : 'Nouveau service'}
              </ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.inputLabel}>Nom du service *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ex: Rénovation jante"
                placeholderTextColor={theme.textSecondary}
              />

              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                placeholder="Description du service..."
                placeholderTextColor={theme.textSecondary}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <ThemedText style={styles.inputLabel}>Prix de base</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={formData.basePrice}
                    onChangeText={(text) => setFormData({ ...formData, basePrice: text })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.halfInput}>
                  <ThemedText style={styles.inputLabel}>Catégorie</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={formData.category}
                    onChangeText={(text) => setFormData({ ...formData, category: text })}
                    placeholder="Catégorie"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <ThemedText style={styles.inputLabel}>Service actif</ThemedText>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: theme.border, true: theme.success + '80' }}
                  thumbColor={formData.isActive ? theme.success : theme.textSecondary}
                />
              </View>
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
                onPress={handleSaveService}
                disabled={createService.isPending || updateService.isPending}
              >
                <ThemedText style={{ color: '#fff' }}>
                  {selectedService ? 'Modifier' : 'Créer'}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceCategory: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  serviceDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: Spacing.sm,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  editBtn: {
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  inactiveCard: {
    opacity: 0.6,
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

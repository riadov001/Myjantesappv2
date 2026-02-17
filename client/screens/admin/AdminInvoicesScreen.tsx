import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert, Modal, TextInput, Image, ActivityIndicator, Platform, Linking } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton, InvoiceCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAdminInvoices, useAdminUsers, useMarkInvoicePaid, useSendInvoiceEmail, useRequestUploadUrl, useLinkInvoiceMedia } from '@/hooks/useApi';
import { getApiUrl } from '@/lib/query-client';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Invoice } from '@/types';

interface SelectedImage {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const PAYMENT_METHODS = [
  { value: 'card', label: 'Carte bancaire' },
  { value: 'cash', label: 'Espèces' },
  { value: 'wire_transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
];

export default function AdminInvoicesScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { data: invoices, isLoading, refetch } = useAdminInvoices();
  const { data: users } = useAdminUsers();
  const markPaid = useMarkInvoicePaid();
  const sendEmail = useSendInvoiceEmail();
  const requestUploadUrl = useRequestUploadUrl();
  const linkInvoiceMedia = useLinkInvoiceMedia();

  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

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
      Alert.alert('Fonctionnalité indisponible', 'Le marquage de paiement est temporairement indisponible. Cette fonctionnalité est en cours de développement.');
    }
  };

  const handleOpenEmailModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const clientName = getUserName(invoice.clientId);
    setEmailSubject(`Votre facture ${invoice.invoiceNumber || invoice.id} - MyJantes`);
    setEmailBody(`Bonjour ${clientName},\n\nVeuillez trouver ci-joint votre facture ${invoice.invoiceNumber || invoice.id} d'un montant de ${formatCurrency(invoice.totalTTC || invoice.amount)}.\n\nNous vous remercions pour votre confiance.\n\nCordialement,\nL'équipe MyJantes`);
    setEmailModal(true);
  };

  const handleConfirmSendEmail = async () => {
    if (!selectedInvoice) return;
    setSendingEmail(true);
    try {
      await sendEmail.mutateAsync(selectedInvoice.id);
      setEmailModal(false);
      Alert.alert('Succès', 'Email envoyé au client');
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', "L'envoi d'email est temporairement indisponible. Cette fonctionnalité est en cours de développement.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenPhotoModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSelectedImages([]);
    setPhotoModalVisible(true);
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const baseUrl = getApiUrl();
      const pdfUrl = `${baseUrl}api/invoices/${invoice.id}/pdf`;
      
      // On mobile, use WebBrowser to open the URL directly which triggers the browser's PDF handling
      if (Platform.OS === 'web') {
        window.open(pdfUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(pdfUrl);
      }
    } catch (error) {
      console.error('PDF download error:', error);
      Alert.alert('Fonctionnalité indisponible', 'Le téléchargement des PDF est temporairement indisponible. Cette fonctionnalité est en cours de développement.');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages: SelectedImage[] = result.assets.map((asset: ImagePicker.ImagePickerAsset, index: number) => ({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}_${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }));
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newImage: SelectedImage = {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      };
      setSelectedImages([...selectedImages, newImage]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!selectedInvoice || selectedImages.length === 0) return;

    setUploading(true);
    try {
      for (const image of selectedImages) {
        const uploadUrlResponse = await requestUploadUrl.mutateAsync({
          name: image.name,
          size: image.size || 1000000,
          contentType: image.type,
        });

        if (uploadUrlResponse?.url) {
          const response = await fetch(image.uri);
          const blob = await response.blob();
          
          await fetch(uploadUrlResponse.url, {
            method: 'PUT',
            body: blob,
            headers: {
              'Content-Type': image.type,
            },
          });

          await linkInvoiceMedia.mutateAsync({
            invoiceId: selectedInvoice.id,
            fileName: image.name,
            filePath: uploadUrlResponse.objectPath,
            fileType: image.type,
          });
        }
      }

      Alert.alert('Succès', 'Photos ajoutées avec succès');
      setPhotoModalVisible(false);
      setSelectedImages([]);
      refetch();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Fonctionnalité indisponible', "L'envoi de photos est temporairement indisponible. Cette fonctionnalité est en cours de développement.");
    } finally {
      setUploading(false);
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
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl + 60 }
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
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#6366f1' + '20' }]}
                    onPress={() => handleDownloadPdf(invoice)}
                  >
                    <Feather name="download" size={16} color="#6366f1" />
                  </Pressable>
                  {invoice.status !== 'paid' && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.success + '20' }]}
                      onPress={() => handleMarkPaid(invoice)}
                    >
                      <Feather name="check-circle" size={16} color={theme.success} />
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.warning + '20' }]}
                    onPress={() => handleOpenPhotoModal(invoice)}
                  >
                    <Feather name="camera" size={16} color={theme.warning} />
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.info + '20' }]}
                    onPress={() => handleOpenEmailModal(invoice)}
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

      <Modal visible={photoModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Photos de la facture
              </ThemedText>
              <Pressable onPress={() => setPhotoModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.photoButtons}>
                <Pressable
                  style={[styles.photoButton, { backgroundColor: theme.primary }]}
                  onPress={pickImage}
                >
                  <Feather name="image" size={20} color="#fff" />
                  <ThemedText style={styles.photoButtonText}>Galerie</ThemedText>
                </Pressable>
                {Platform.OS !== 'web' && (
                  <Pressable
                    style={[styles.photoButton, { backgroundColor: theme.info }]}
                    onPress={takePhoto}
                  >
                    <Feather name="camera" size={20} color="#fff" />
                    <ThemedText style={styles.photoButtonText}>Caméra</ThemedText>
                  </Pressable>
                )}
              </View>

              {selectedImages.length > 0 ? (
                <View style={styles.selectedImagesContainer}>
                  <ThemedText style={styles.inputLabel}>
                    Photos sélectionnées ({selectedImages.length})
                  </ThemedText>
                  <View style={styles.imageGrid}>
                    {selectedImages.map((image, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                        <Pressable
                          style={[styles.removeImageBtn, { backgroundColor: theme.error }]}
                          onPress={() => removeImage(index)}
                        >
                          <Feather name="x" size={14} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setPhotoModalVisible(false)}
              >
                <ThemedText>Annuler</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: selectedImages.length > 0 ? theme.primary : theme.border }
                ]}
                onPress={uploadImages}
                disabled={uploading || selectedImages.length === 0}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={{ color: '#fff' }}>
                    Envoyer ({selectedImages.length})
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={emailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Envoyer par email</ThemedText>
              <Pressable onPress={() => setEmailModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.inputLabel}>Objet</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholderTextColor={theme.textSecondary}
              />

              <ThemedText style={styles.inputLabel}>Message</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
                value={emailBody}
                onChangeText={setEmailBody}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <View style={[styles.emailInfo, { backgroundColor: theme.info + '10' }]}>
                <Feather name="info" size={16} color={theme.info} />
                <ThemedText style={[styles.emailInfoText, { color: theme.info }]}>
                  La facture PDF sera automatiquement jointe à l'email
                </ThemedText>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setEmailModal(false)}
              >
                <ThemedText>Annuler</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleConfirmSendEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Feather name="send" size={16} color="#fff" />
                    <ThemedText style={{ color: '#fff', marginLeft: 8 }}>Envoyer</ThemedText>
                  </View>
                )}
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
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedImagesContainer: {
    marginTop: Spacing.md,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 150,
    paddingTop: Spacing.md,
  },
  emailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  emailInfoText: {
    flex: 1,
    fontSize: 13,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
});

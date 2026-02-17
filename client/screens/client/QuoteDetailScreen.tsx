import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { useTheme } from '@/hooks/useTheme';
import { useQuote, useApproveQuote, useRejectQuote } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function QuoteDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { quoteId } = route.params;

  const { data: quote, isLoading, refetch } = useQuote(quoteId);
  const approveQuote = useApproveQuote();
  const rejectQuote = useRejectQuote();

  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await approveQuote.mutateAsync(quoteId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refetch();
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', "L'approbation des devis est temporairement indisponible. Cette fonctionnalité est en cours de développement.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Refuser le devis',
      'Êtes-vous sûr de vouloir refuser ce devis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('reject');
            try {
              await rejectQuote.mutateAsync(quoteId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await refetch();
            } catch (error) {
              Alert.alert('Fonctionnalité indisponible', 'Le refus des devis est temporairement indisponible. Cette fonctionnalité est en cours de développement.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !quote) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <View style={styles.header}>
          <View>
            <ThemedText type="h2">{quote.reference}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
            </ThemedText>
          </View>
          <StatusBadge status={quote.status} />
        </View>

        <Card style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.sectionHeader}>
            <Feather name="truck" size={20} color={theme.primary} />
            <ThemedText type="h4">Véhicule</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Marque / Modèle
            </ThemedText>
            <ThemedText type="body">
              {quote.vehicleBrand} {quote.vehicleModel}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Immatriculation
            </ThemedText>
            <ThemedText type="body">{quote.vehiclePlate || '-'}</ThemedText>
          </View>
          {quote.vehicleVin ? (
            <View style={styles.infoRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                VIN
              </ThemedText>
              <ThemedText type="body">{quote.vehicleVin}</ThemedText>
            </View>
          ) : null}
        </Card>

        <Card style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.sectionHeader}>
            <Feather name="list" size={20} color={theme.primary} />
            <ThemedText type="h4">Articles</ThemedText>
          </View>
          {quote.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <ThemedText type="body">{item.description}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.quantity} x {Number(item.unitPrice || 0).toFixed(2)} €
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)} €
              </ThemedText>
            </View>
          ))}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <ThemedText type="body">Total HT</ThemedText>
              <ThemedText type="body">{Number(quote.totalHT || 0).toFixed(2)} €</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText type="h3">Total TTC</ThemedText>
              <ThemedText type="h3" style={{ color: theme.primary }}>
                {Number(quote.totalTTC || 0).toFixed(2)} €
              </ThemedText>
            </View>
          </View>
        </Card>

        {quote.notes ? (
          <Card style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.sectionHeader}>
              <Feather name="message-square" size={20} color={theme.primary} />
              <ThemedText type="h4">Notes</ThemedText>
            </View>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {quote.notes}
            </ThemedText>
          </Card>
        ) : null}

        {quote.status === 'pending' ? (
          <View style={styles.actionButtons}>
            <Button
              onPress={handleApprove}
              disabled={actionLoading !== null}
              style={[styles.actionButton, { backgroundColor: theme.success }]}
            >
              {actionLoading === 'approve' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                'Accepter le devis'
              )}
            </Button>
            <Button
              onPress={handleReject}
              disabled={actionLoading !== null}
              style={[styles.actionButton, { backgroundColor: theme.error }]}
            >
              {actionLoading === 'reject' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                'Refuser le devis'
              )}
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  totalSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    width: '100%',
  },
});

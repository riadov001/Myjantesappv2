import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { StatCardSkeleton } from '@/components/LoadingSkeleton';
import { useTheme } from '@/hooks/useTheme';
import { useAdminAnalytics, useAdminQuotes, useAdminInvoices, useAdminReservations } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAdminAnalytics();
  const { data: quotes, isLoading: quotesLoading, refetch: refetchQuotes } = useAdminQuotes();
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useAdminInvoices();
  const { data: reservations, isLoading: reservationsLoading, refetch: refetchReservations } = useAdminReservations();

  const isLoading = analyticsLoading || quotesLoading || invoicesLoading || reservationsLoading;

  const handleRefresh = () => {
    refetchAnalytics();
    refetchQuotes();
    refetchInvoices();
    refetchReservations();
  };

  const pendingQuotes = quotes?.filter(q => q.status === 'pending').length || 0;
  const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
  const pendingReservations = reservations?.filter(r => r.status === 'pending').length || 0;

  const formatCurrency = (value: number | string | undefined) => {
    const num = Number(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
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
          <View style={styles.statsGrid}>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
          <View style={styles.statsGrid}>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
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
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.greeting}>
          <ThemedText style={styles.greetingText}>
            Bonjour, {user?.username || 'Admin'}
          </ThemedText>
          <ThemedText style={styles.subGreeting}>
            Voici un aperçu de votre activité
          </ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="CA du mois"
            value={formatCurrency(analytics?.currentMonth?.revenue)}
            icon="trending-up"
            color={theme.success}
          />
          <StatCard
            label="En attente"
            value={formatCurrency(analytics?.pendingRevenue)}
            icon="clock"
            color={theme.warning}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Devis en attente"
            value={String(pendingQuotes)}
            icon="file-text"
            color={theme.primary}
          />
          <StatCard
            label="Factures à payer"
            value={String(pendingInvoices)}
            icon="credit-card"
            color={theme.warning}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="RDV en attente"
            value={String(pendingReservations)}
            icon="calendar"
            color={theme.info}
          />
          <StatCard
            label="Taux conversion"
            value={analytics?.conversionRate || '0%'}
            icon="percent"
            color={theme.success}
          />
        </View>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="bar-chart-2" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Statistiques rapides</ThemedText>
          </View>
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatValue}>{analytics?.totalQuotes || 0}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Total devis</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatValue}>{analytics?.totalInvoices || 0}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Total factures</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatValue}>{analytics?.totalReservations || 0}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Total RDV</ThemedText>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="pie-chart" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Statut des factures</ThemedText>
          </View>
          <View style={styles.statusGrid}>
            <View style={[styles.statusItem, { backgroundColor: theme.success + '20' }]}>
              <ThemedText style={[styles.statusValue, { color: theme.success }]}>
                {analytics?.invoiceStatusStats?.paid || 0}
              </ThemedText>
              <ThemedText style={styles.statusLabel}>Payées</ThemedText>
            </View>
            <View style={[styles.statusItem, { backgroundColor: theme.warning + '20' }]}>
              <ThemedText style={[styles.statusValue, { color: theme.warning }]}>
                {analytics?.invoiceStatusStats?.pending || 0}
              </ThemedText>
              <ThemedText style={styles.statusLabel}>En attente</ThemedText>
            </View>
            <View style={[styles.statusItem, { backgroundColor: theme.error + '20' }]}>
              <ThemedText style={[styles.statusValue, { color: theme.error }]}>
                {analytics?.invoiceStatusStats?.overdue || 0}
              </ThemedText>
              <ThemedText style={styles.statusLabel}>En retard</ThemedText>
            </View>
          </View>
        </Card>
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
  greeting: {
    marginBottom: Spacing.xl,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statusItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
});

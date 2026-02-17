import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

type StatusType = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled' | 'overdue' | 'confirmed' | 'completed' | 'draft' | 'sent';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium';
}

const STATUS_LABELS: Record<StatusType, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  paid: 'Payé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  overdue: 'En retard',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  draft: 'Brouillon',
  sent: 'Envoyé',
};

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return theme.statusPending;
      case 'approved':
      case 'paid':
      case 'confirmed':
      case 'completed':
        return theme.statusApproved;
      case 'rejected':
      case 'cancelled':
        return theme.statusRejected;
      case 'overdue':
        return theme.statusOverdue;
      case 'draft':
      case 'sent':
        return theme.textSecondary;
      default:
        return theme.textSecondary;
    }
  };

  const color = getStatusColor();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}20`,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          {
            color,
            fontSize: isSmall ? 10 : 11,
          },
        ]}
      >
        {STATUS_LABELS[status] || status}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

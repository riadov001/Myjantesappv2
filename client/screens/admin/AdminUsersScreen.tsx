import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { LoadingSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { User } from '@/types';

const ROLES = [
  { value: 'client', label: 'Client' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'superadmin', label: 'Super Admin' },
];

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: users, isLoading, refetch } = useAdminUsers();
  const updateRole = useUpdateUserRole();

  const [roleModal, setRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return theme.error;
      case 'admin':
        return theme.primary;
      default:
        return theme.info;
    }
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleModal(true);
  };

  const confirmChangeRole = async () => {
    if (!selectedUser) return;
    try {
      await updateRole.mutateAsync({ id: selectedUser.id, role: selectedRole });
      setRoleModal(false);
      refetch();
      Alert.alert('Succès', 'Rôle mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le rôle');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
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

  const clients = users?.filter(u => u.role === 'client') || [];
  const admins = users?.filter(u => u.role === 'admin' || u.role === 'superadmin') || [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.info + '20' }]}>
            <ThemedText style={[styles.statValue, { color: theme.info }]}>{clients.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Clients</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.primary + '20' }]}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>{admins.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Admins</ThemedText>
          </View>
        </View>

        {(!users || users.length === 0) ? (
          <EmptyState
            image={require('../../../assets/images/empty-quotes.png')}
            title="Aucun utilisateur"
            description="Les utilisateurs apparaîtront ici"
          />
        ) : (
          <>
            {admins.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Administrateurs</ThemedText>
                {admins.map((user) => (
                  <Card key={user.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor(user.role) }]}>
                        <ThemedText style={styles.avatarText}>
                          {(user.firstName?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={styles.userInfo}>
                        <ThemedText style={styles.userName}>
                          {user.firstName || ''} {user.lastName || ''}
                        </ThemedText>
                        <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
                      </View>
                      <Pressable
                        style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) + '20' }]}
                        onPress={() => handleChangeRole(user)}
                      >
                        <ThemedText style={[styles.roleText, { color: getRoleBadgeColor(user.role) }]}>
                          {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                        </ThemedText>
                      </Pressable>
                    </View>
                    <View style={styles.userDetails}>
                      {user.phone && (
                        <View style={styles.detailRow}>
                          <Feather name="phone" size={14} color={theme.textSecondary} />
                          <ThemedText style={styles.detailText}>{user.phone}</ThemedText>
                        </View>
                      )}
                      <View style={styles.detailRow}>
                        <Feather name="calendar" size={14} color={theme.textSecondary} />
                        <ThemedText style={styles.detailText}>Inscrit le {formatDate(user.createdAt)}</ThemedText>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {clients.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Clients</ThemedText>
                {clients.map((user) => (
                  <Card key={user.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={[styles.avatar, { backgroundColor: theme.info }]}>
                        <ThemedText style={styles.avatarText}>
                          {(user.firstName?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={styles.userInfo}>
                        <ThemedText style={styles.userName}>
                          {user.firstName || ''} {user.lastName || ''}
                        </ThemedText>
                        <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
                      </View>
                      <Pressable
                        style={[styles.roleBadge, { backgroundColor: theme.info + '20' }]}
                        onPress={() => handleChangeRole(user)}
                      >
                        <ThemedText style={[styles.roleText, { color: theme.info }]}>Client</ThemedText>
                      </Pressable>
                    </View>
                    <View style={styles.userDetails}>
                      {user.phone && (
                        <View style={styles.detailRow}>
                          <Feather name="phone" size={14} color={theme.textSecondary} />
                          <ThemedText style={styles.detailText}>{user.phone}</ThemedText>
                        </View>
                      )}
                      <View style={styles.detailRow}>
                        <Feather name="calendar" size={14} color={theme.textSecondary} />
                        <ThemedText style={styles.detailText}>Inscrit le {formatDate(user.createdAt)}</ThemedText>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={roleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Modifier le rôle</ThemedText>
              <Pressable onPress={() => setRoleModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.inputLabel}>
                Utilisateur: {selectedUser?.email}
              </ThemedText>
              <View style={styles.roleOptions}>
                {ROLES.map((role) => (
                  <Pressable
                    key={role.value}
                    style={[
                      styles.roleOption,
                      { borderColor: theme.border },
                      selectedRole === role.value && {
                        borderColor: theme.primary,
                        backgroundColor: theme.primary + '10'
                      }
                    ]}
                    onPress={() => setSelectedRole(role.value)}
                  >
                    <Feather
                      name={selectedRole === role.value ? 'check-circle' : 'circle'}
                      size={20}
                      color={selectedRole === role.value ? theme.primary : theme.textSecondary}
                    />
                    <ThemedText style={styles.roleOptionLabel}>{role.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setRoleModal(false)}
              >
                <ThemedText>Annuler</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={confirmChangeRole}
                disabled={updateRole.isPending}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userDetails: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
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
  roleOptions: {
    gap: Spacing.sm,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  roleOptionLabel: {
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

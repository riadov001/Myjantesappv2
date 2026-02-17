import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Alert, TextInput, Switch } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useGarageSettings, useUpdateGarageSettings } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface GarageSettings {
  garageName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  vatNumber?: string;
  siret?: string;
  hours?: {
    monday?: DayHours;
    tuesday?: DayHours;
    wednesday?: DayHours;
    thursday?: DayHours;
    friday?: DayHours;
    saturday?: DayHours;
    sunday?: DayHours;
  };
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const DEFAULT_HOURS: DayHours = { open: '09:00', close: '18:00', closed: false };

export default function AdminSettingsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: settings, isLoading, refetch } = useGarageSettings();
  const updateSettings = useUpdateGarageSettings();

  const [formData, setFormData] = useState<GarageSettings>({
    garageName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    vatNumber: '',
    siret: '',
    hours: {
      monday: DEFAULT_HOURS,
      tuesday: DEFAULT_HOURS,
      wednesday: DEFAULT_HOURS,
      thursday: DEFAULT_HOURS,
      friday: DEFAULT_HOURS,
      saturday: { ...DEFAULT_HOURS, closed: true },
      sunday: { ...DEFAULT_HOURS, closed: true },
    },
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        garageName: settings.garageName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city: settings.city || '',
        postalCode: settings.postalCode || '',
        country: settings.country || 'France',
        vatNumber: settings.vatNumber || '',
        siret: settings.siret || '',
        hours: settings.hours || formData.hours,
        notificationsEnabled: settings.notificationsEnabled ?? true,
        emailNotifications: settings.emailNotifications ?? true,
        smsNotifications: settings.smsNotifications ?? false,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      Alert.alert('Succès', 'Paramètres enregistrés avec succès');
      refetch();
    } catch (error) {
      Alert.alert('Fonctionnalité indisponible', "L'enregistrement des paramètres est temporairement indisponible. Cette fonctionnalité est en cours de développement.");
    }
  };

  const updateDayHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...(prev.hours?.[day as keyof typeof prev.hours] || DEFAULT_HOURS),
          [field]: value,
        },
      },
    }));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.primary} />
        }
      >
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="info" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Informations du garage</ThemedText>
          </View>

          <ThemedText style={styles.inputLabel}>Nom du garage</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
            value={formData.garageName}
            onChangeText={(text) => setFormData({ ...formData, garageName: text })}
            placeholder="MyJantes"
            placeholderTextColor={theme.textSecondary}
          />

          <ThemedText style={styles.inputLabel}>Email</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="contact@myjantes.fr"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.textSecondary}
          />

          <ThemedText style={styles.inputLabel}>Téléphone</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="01 23 45 67 89"
            keyboardType="phone-pad"
            placeholderTextColor={theme.textSecondary}
          />
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="map-pin" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Adresse</ThemedText>
          </View>

          <ThemedText style={styles.inputLabel}>Adresse</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="123 rue des Jantes"
            placeholderTextColor={theme.textSecondary}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <ThemedText style={styles.inputLabel}>Code postal</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                value={formData.postalCode}
                onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                placeholder="75001"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={styles.halfInput}>
              <ThemedText style={styles.inputLabel}>Ville</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Paris"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="file-text" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Informations légales</ThemedText>
          </View>

          <ThemedText style={styles.inputLabel}>Numéro de TVA</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
            value={formData.vatNumber}
            onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
            placeholder="FR12345678901"
            autoCapitalize="characters"
            placeholderTextColor={theme.textSecondary}
          />

          <ThemedText style={styles.inputLabel}>SIRET</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
            value={formData.siret}
            onChangeText={(text) => setFormData({ ...formData, siret: text })}
            placeholder="12345678901234"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Horaires d'ouverture</ThemedText>
          </View>

          {DAYS.map((day) => {
            const dayHours = formData.hours?.[day.key as keyof typeof formData.hours] || DEFAULT_HOURS;
            return (
              <View key={day.key} style={styles.dayRow}>
                <View style={styles.dayLabelContainer}>
                  <ThemedText style={styles.dayLabel}>{day.label}</ThemedText>
                </View>
                <View style={styles.dayControls}>
                  <View style={styles.switchContainer}>
                    <ThemedText style={[styles.closedLabel, { opacity: dayHours.closed ? 1 : 0.5 }]}>
                      Fermé
                    </ThemedText>
                    <Switch
                      value={dayHours.closed}
                      onValueChange={(value) => updateDayHours(day.key, 'closed', value)}
                      trackColor={{ false: theme.border, true: theme.error + '80' }}
                      thumbColor={dayHours.closed ? theme.error : theme.backgroundSecondary}
                    />
                  </View>
                  {!dayHours.closed && (
                    <View style={styles.hoursInputs}>
                      <TextInput
                        style={[styles.timeInput, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                        value={dayHours.open}
                        onChangeText={(text) => updateDayHours(day.key, 'open', text)}
                        placeholder="09:00"
                        placeholderTextColor={theme.textSecondary}
                      />
                      <ThemedText style={styles.timeSeparator}>-</ThemedText>
                      <TextInput
                        style={[styles.timeInput, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                        value={dayHours.close}
                        onChangeText={(text) => updateDayHours(day.key, 'close', text)}
                        placeholder="18:00"
                        placeholderTextColor={theme.textSecondary}
                      />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="bell" size={20} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Notifications activées</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Recevoir des notifications pour les nouvelles réservations
              </ThemedText>
            </View>
            <Switch
              value={formData.notificationsEnabled}
              onValueChange={(value) => setFormData({ ...formData, notificationsEnabled: value })}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={formData.notificationsEnabled ? theme.primary : theme.backgroundSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Notifications email</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Recevoir les notifications par email
              </ThemedText>
            </View>
            <Switch
              value={formData.emailNotifications}
              onValueChange={(value) => setFormData({ ...formData, emailNotifications: value })}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={formData.emailNotifications ? theme.primary : theme.backgroundSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Notifications SMS</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Recevoir les notifications par SMS
              </ThemedText>
            </View>
            <Switch
              value={formData.smsNotifications}
              onValueChange={(value) => setFormData({ ...formData, smsNotifications: value })}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={formData.smsNotifications ? theme.primary : theme.backgroundSecondary}
            />
          </View>
        </Card>

        <Pressable
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={updateSettings.isPending}
        >
          <Feather name="save" size={20} color="#fff" />
          <ThemedText style={styles.saveButtonText}>
            {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </ThemedText>
        </Pressable>
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
  section: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  dayLabelContainer: {
    width: 80,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  closedLabel: {
    fontSize: 12,
  },
  hoursInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 14,
    opacity: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

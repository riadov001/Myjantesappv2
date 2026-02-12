import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { getApiUrl } from '@/lib/query-client';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={isDark ? ['#1a0505', '#0f0f0f'] : ['#fef2f2', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing['2xl'], paddingBottom: insets.bottom + Spacing.xl }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
              <Feather name="lock" size={40} color={theme.primary} />
            </View>
          </View>

          <ThemedText type="h2" style={styles.title}>
            Mot de passe oubli{'\u00e9'}
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Entrez votre adresse email et nous vous enverrons un lien pour r{'\u00e9'}initialiser votre mot de passe.
          </ThemedText>

          {success ? (
            <View style={[styles.successContainer, { backgroundColor: '#10b98115' }]}>
              <Feather name="check-circle" size={20} color="#10b981" />
              <ThemedText type="body" style={{ color: '#10b981', flex: 1 }}>
                Un email de r{'\u00e9'}initialisation a {'\u00e9'}t{'\u00e9'} envoy{'\u00e9'} {'\u00e0'} votre adresse.
              </ThemedText>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: `${theme.error}15` }]}>
              <Feather name="alert-circle" size={16} color={theme.error} />
              <ThemedText type="small" style={{ color: theme.error, flex: 1 }}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          {!success ? (
            <>
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Email
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <Feather name="mail" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="votre@email.com"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    testID="input-forgot-email"
                  />
                </View>
              </View>

              <Button
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                testID="button-forgot-submit"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
            </>
          ) : null}

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backLink}
            testID="button-back-login"
          >
            <Feather name="arrow-left" size={16} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
              Retour {'\u00e0'} la connexion
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  headerContainer: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 52,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  submitButton: {
    marginBottom: Spacing.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
});

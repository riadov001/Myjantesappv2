import React, { useState } from 'react';
import { View, StyleSheet, Image, TextInput, ScrollView, Platform, KeyboardAvoidingView, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { loginWithEmail, register, loginWithApple, loginWithGoogle, isLoading, isGoogleConfigured } = useAuth();
  const navigation = useNavigation<any>();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = mode === 'login'
        ? await loginWithEmail(email, password)
        : await register(email, password, name);

      if (!result.success) {
        setError(result.error || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await loginWithApple();
    if (!result.success) {
      setError(result.error || 'Erreur Apple Sign-In');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || 'Erreur Google Sign-In');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
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
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText type="h1" style={styles.appName}>
              MyJantes
            </ThemedText>
            <ThemedText type="body" style={[styles.tagline, { color: theme.textSecondary }]}>
              Gestion professionnelle de votre garage
            </ThemedText>
          </View>

          <View style={styles.formContainer}>
            <ThemedText type="h2" style={styles.formTitle}>
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </ThemedText>

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${theme.error}15` }]}>
                <Feather name="alert-circle" size={16} color={theme.error} />
                <ThemedText type="small" style={{ color: theme.error, flex: 1 }}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            {mode === 'register' ? (
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Nom
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <Feather name="user" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Votre nom"
                    placeholderTextColor={theme.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    testID="input-name"
                  />
                </View>
              </View>
            ) : null}

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
                  testID="input-email"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Mot de passe
              </ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <Feather name="lock" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Mot de passe"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  testID="input-password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <Button
              onPress={handleEmailAuth}
              disabled={isSubmitting || isLoading}
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              testID="button-submit"
            >
              {isSubmitting ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </Button>

            {mode === 'login' ? (
              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
                testID="button-forgot-password"
              >
                <ThemedText type="small" style={{ color: theme.primary }}>
                  Mot de passe oublié ?
                </ThemedText>
              </Pressable>
            ) : null}

            <Pressable onPress={toggleMode} style={styles.switchMode} testID="button-switch-mode">
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {mode === 'login' ? "Pas de compte ? " : "Déjà un compte ? "}
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.primary }}>
                {mode === 'login' ? "S'inscrire" : "Se connecter"}
              </ThemedText>
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginHorizontal: Spacing.md }}>
                ou
              </ThemedText>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            <Button
              onPress={handleGoogleSignIn}
              variant="outline"
              style={styles.socialButton}
              testID="button-google"
            >
              <View style={styles.socialButtonContent}>
                <Feather name="globe" size={20} color="#4285F4" />
                <ThemedText style={{ marginLeft: Spacing.sm }}>
                  Continuer avec Google
                </ThemedText>
              </View>
            </Button>

            {Platform.OS === 'ios' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={isDark 
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={BorderRadius.md}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            ) : null}
          </View>

          <View style={styles.legalLinks}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              En vous connectant, vous acceptez nos
            </ThemedText>
            <View style={styles.legalLinksRow}>
              <Pressable onPress={() => navigation.navigate('Legal', { initialTab: 'cgv' })} testID="button-login-cgv">
                <ThemedText type="small" style={{ color: theme.primary, textDecorationLine: 'underline' }}>CGV</ThemedText>
              </Pressable>
              <ThemedText type="small" style={{ color: theme.textSecondary }}> et notre </ThemedText>
              <Pressable onPress={() => navigation.navigate('Legal', { initialTab: 'confidentialite' })} testID="button-login-confidentialite">
                <ThemedText type="small" style={{ color: theme.primary, textDecorationLine: 'underline' }}>Politique de confidentialité</ThemedText>
              </Pressable>
            </View>
          </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  tagline: {
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    gap: Spacing.lg,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  inputContainer: {
    gap: Spacing.xs,
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
    marginTop: Spacing.sm,
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  appleButton: {
    height: 50,
    width: '100%',
  },
  socialButton: {
    height: 50,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPassword: {
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
  },
  legalLinks: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 4,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

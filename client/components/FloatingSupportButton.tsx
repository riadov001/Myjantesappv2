import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';
import { Spacing, BorderRadius } from '@/constants/theme';

export function FloatingSupportButton() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Veuillez saisir un message');
      return;
    }

    setSending(true);
    setError('');

    try {
      await apiRequest('POST', '/api/support', {
        subject: subject.trim() || 'Demande de support',
        message: message.trim(),
        email: user?.email,
        userName: user?.username || user?.firstName || '',
      });
      setSent(true);
      setTimeout(() => {
        setModalVisible(false);
        setSent(false);
        setSubject('');
        setMessage('');
      }, 2000);
    } catch (err) {
      setError('Le service de support est temporairement indisponible. Veuillez r\u00e9essayer plus tard ou contacter contact@myjantes.fr');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setError('');
    setSent(false);
  };

  const tabBarHeight = Platform.OS === 'ios' ? 88 : 70;

  return (
    <>
      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: tabBarHeight + Spacing.md,
            right: Spacing.lg,
          },
        ]}
        onPress={() => setModalVisible(true)}
        testID="button-support"
      >
        <Feather name="headphones" size={24} color="#fff" />
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleClose} />
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.supportIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Feather name="headphones" size={20} color={theme.primary} />
                </View>
                <ThemedText style={styles.modalTitle}>Contacter le support</ThemedText>
              </View>
              <Pressable onPress={handleClose} testID="button-close-support">
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {sent ? (
              <View style={styles.sentContainer}>
                <View style={[styles.sentIcon, { backgroundColor: theme.success + '20' }]}>
                  <Feather name="check-circle" size={40} color={theme.success} />
                </View>
                <ThemedText style={styles.sentTitle}>Message envoy\u00e9</ThemedText>
                <ThemedText style={[styles.sentSubtitle, { color: theme.textSecondary }]}>
                  Notre \u00e9quipe vous r\u00e9pondra dans les plus brefs d\u00e9lais.
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.modalBody}>
                  <ThemedText style={styles.inputLabel}>Objet</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Objet de votre demande..."
                    placeholderTextColor={theme.textSecondary}
                    testID="input-support-subject"
                  />

                  <ThemedText style={styles.inputLabel}>Message *</ThemedText>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                    value={message}
                    onChangeText={(text) => {
                      setMessage(text);
                      if (error) setError('');
                    }}
                    placeholder="D\u00e9crivez votre probl\u00e8me ou votre question..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    testID="input-support-message"
                  />

                  {error ? (
                    <View style={[styles.errorBox, { backgroundColor: theme.error + '10' }]}>
                      <Feather name="alert-circle" size={16} color={theme.error} />
                      <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
                    </View>
                  ) : null}

                  <View style={[styles.infoBox, { backgroundColor: theme.info + '10' }]}>
                    <Feather name="info" size={16} color={theme.info} />
                    <ThemedText style={[styles.infoText, { color: theme.info }]}>
                      Vous pouvez aussi nous contacter \u00e0 contact@myjantes.fr
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.modalFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.lg }]}>
                  <Pressable
                    style={[styles.cancelButton, { borderColor: theme.border }]}
                    onPress={handleClose}
                  >
                    <ThemedText>Annuler</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.sendButton, { backgroundColor: sending ? theme.border : theme.primary }]}
                    onPress={handleSend}
                    disabled={sending}
                    testID="button-send-support"
                  >
                    {sending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={styles.sendButtonContent}>
                        <Feather name="send" size={16} color="#fff" />
                        <ThemedText style={styles.sendButtonText}>Envoyer</ThemedText>
                      </View>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  supportIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: Spacing.lg,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  sendButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sentContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  sentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sentTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  sentSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

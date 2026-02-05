import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { LoadingSkeleton, QuoteCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminUsers } from '@/hooks/useApi';
import { getApiUrl, apiRequest } from '@/lib/query-client';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export default function AdminChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);

  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/conversations`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/conversations/${conversationId}/messages`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation?.id]);

  const getUserName = (userId: string) => {
    if (!users) return 'Utilisateur';
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.email : 'Utilisateur';
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const otherId = conversation.participantIds?.find(id => id !== user?.id);
    return otherId ? getUserName(otherId) : 'Chat';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await apiRequest('POST', `/api/conversations/${selectedConversation.id}/messages`, {
        content: newMessage.trim()
      });
      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const response = await apiRequest('POST', '/api/conversations', {
        participantId: userId
      });
      if (response.ok) {
        const conversation = await response.json();
        setConversations(prev => [conversation, ...prev]);
        setSelectedConversation(conversation);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (loading || usersLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
          ]}
        >
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
        </ScrollView>
      </ThemedView>
    );
  }

  if (selectedConversation) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.chatHeader, { paddingTop: insets.top + Spacing.sm, backgroundColor: theme.backgroundSecondary }]}>
          <Pressable style={styles.backButton} onPress={() => setSelectedConversation(null)}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.chatHeaderInfo}>
            <ThemedText style={styles.chatHeaderName}>
              {getOtherParticipant(selectedConversation)}
            </ThemedText>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={scrollRef}
            data={messages.toReversed()}
            inverted={messages.length > 0}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Feather name="message-circle" size={48} color={theme.textSecondary} />
                <ThemedText style={styles.emptyChatText}>Commencez la conversation</ThemedText>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === user?.id;
              return (
                <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                  <View style={[
                    styles.messageBubble,
                    isMe ? { backgroundColor: theme.primary } : { backgroundColor: theme.backgroundSecondary }
                  ]}>
                    <ThemedText style={[styles.messageText, isMe && { color: '#fff' }]}>
                      {item.content}
                    </ThemedText>
                    <ThemedText style={[styles.messageTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                      {formatTime(item.createdAt)}
                    </ThemedText>
                  </View>
                </View>
              );
            }}
          />

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: theme.backgroundRoot }]}>
            <TextInput
              style={[styles.messageInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Écrivez un message..."
              placeholderTextColor={theme.textSecondary}
              multiline
            />
            <Pressable
              style={[styles.sendButton, { backgroundColor: theme.primary, opacity: newMessage.trim() ? 1 : 0.5 }]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Feather name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  const clients = users?.filter(u => u.role === 'client') || [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        {conversations.length === 0 && clients.length === 0 ? (
          <EmptyState
            image={require('../../../assets/images/empty-quotes.png')}
            title="Aucune conversation"
            description="Les conversations avec les clients apparaîtront ici"
          />
        ) : (
          <>
            {conversations.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Conversations</ThemedText>
                {conversations.map((conversation) => (
                  <Pressable key={conversation.id} onPress={() => setSelectedConversation(conversation)}>
                    <Card style={styles.conversationCard}>
                      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <ThemedText style={styles.avatarText}>
                          {getOtherParticipant(conversation).charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={styles.conversationInfo}>
                        <View style={styles.conversationHeader}>
                          <ThemedText style={styles.conversationName}>
                            {getOtherParticipant(conversation)}
                          </ThemedText>
                          {conversation.lastMessageAt && (
                            <ThemedText style={styles.conversationTime}>
                              {formatDate(conversation.lastMessageAt)}
                            </ThemedText>
                          )}
                        </View>
                        {conversation.lastMessage && (
                          <ThemedText style={styles.lastMessage} numberOfLines={1}>
                            {conversation.lastMessage}
                          </ThemedText>
                        )}
                      </View>
                      {(conversation.unreadCount || 0) > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                          <ThemedText style={styles.unreadText}>{conversation.unreadCount}</ThemedText>
                        </View>
                      )}
                    </Card>
                  </Pressable>
                ))}
              </>
            )}

            {clients.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Démarrer une conversation</ThemedText>
                {clients.map((client) => (
                  <Pressable key={client.id} onPress={() => handleStartConversation(client.id)}>
                    <Card style={styles.conversationCard}>
                      <View style={[styles.avatar, { backgroundColor: theme.info }]}>
                        <ThemedText style={styles.avatarText}>
                          {(client.firstName?.charAt(0) || client.email.charAt(0)).toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={styles.conversationInfo}>
                        <ThemedText style={styles.conversationName}>
                          {client.firstName || ''} {client.lastName || ''}
                        </ThemedText>
                        <ThemedText style={styles.lastMessage}>{client.email}</ThemedText>
                      </View>
                      <Feather name="message-circle" size={20} color={theme.textSecondary} />
                    </Card>
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  conversationTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: {
    marginTop: Spacing.md,
    opacity: 0.5,
  },
  messageRow: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  messageText: {
    fontSize: 15,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  messageInput: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';

const PUSH_ENABLED_KEY = '@myjantes_push_enabled';
const PUSH_TOKEN_KEY = '@myjantes_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    const loadState = async () => {
      const stored = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
      if (stored === 'true') {
        setIsEnabled(true);
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    if (isEnabled && user) {
      registerForPushNotifications();
    }

    notificationListener.current = Notifications.addNotificationReceivedListener((_notification: Notifications.Notification) => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isEnabled, user]);

  const registerForPushNotifications = async () => {
    try {
      if (Platform.OS === 'web') {
        setPermissionStatus('web');
        return;
      }

      if (!Device.isDevice) {
        setPermissionStatus('simulator');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'MyJantes',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#dc2626',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Rappels de rendez-vous',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#dc2626',
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined,
      });
      const token = tokenData.data;
      setExpoPushToken(token);

      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken !== token && user) {
        await sendTokenToServer(token);
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Push notification registration error:', error);
    }
  };

  const sendTokenToServer = async (token: string) => {
    try {
      await apiRequest('POST', '/api/push-token', {
        token,
        platform: Platform.OS,
        userId: user?.id,
      });
    } catch (error) {
      console.error('Failed to send push token to server:', error);
    }
  };

  const handleNotificationNavigation = (data: any) => {
    // Navigation will be handled by the NotificationHandler component in App.tsx
  };

  const toggleNotifications = useCallback(async () => {
    if (!isEnabled) {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Notifications push',
          'Les notifications push ne sont pas disponibles sur la version web. Utilisez Expo Go sur votre téléphone pour activer cette fonctionnalité.'
        );
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'denied') {
        Alert.alert(
          'Notifications bloquées',
          'Les notifications sont bloquées. Veuillez les activer dans les paramètres de votre appareil.',
        );
        return;
      }

      setIsEnabled(true);
      await AsyncStorage.setItem(PUSH_ENABLED_KEY, 'true');
      await registerForPushNotifications();
    } else {
      setIsEnabled(false);
      await AsyncStorage.setItem(PUSH_ENABLED_KEY, 'false');
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }, [isEnabled, user]);

  const scheduleAppointmentReminder = useCallback(async (
    reservationId: string,
    serviceName: string,
    date: Date,
    minutesBefore: number = 60,
  ) => {
    if (!isEnabled) return;

    try {
      const triggerDate = new Date(date.getTime() - minutesBefore * 60 * 1000);

      if (triggerDate <= new Date()) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel de rendez-vous',
          body: `Votre rendez-vous "${serviceName}" est prévu dans ${minutesBefore >= 60 ? `${Math.round(minutesBefore / 60)}h` : `${minutesBefore} min`}.`,
          data: { type: 'reservation_reminder', reservationId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: 'reminders',
        },
        identifier: `reminder-${reservationId}-${minutesBefore}`,
      });
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }, [isEnabled]);

  const cancelReservationReminders = useCallback(async (reservationId: string) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.identifier.startsWith(`reminder-${reservationId}`)) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (error) {
      console.error('Failed to cancel reminders:', error);
    }
  }, []);

  return {
    isEnabled,
    expoPushToken,
    permissionStatus,
    toggleNotifications,
    scheduleAppointmentReminder,
    cancelReservationReminders,
    registerForPushNotifications,
  };
}

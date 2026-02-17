import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/screens/LoginScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import ClientTabNavigator from '@/navigation/ClientTabNavigator';
import AdminTabNavigator from '@/navigation/AdminTabNavigator';
import EmployeeTabNavigator from '@/navigation/EmployeeTabNavigator';
import QuoteDetailScreen from '@/screens/client/QuoteDetailScreen';
import InvoiceDetailScreen from '@/screens/client/InvoiceDetailScreen';
import AdminUsersScreen from '@/screens/admin/AdminUsersScreen';
import AdminServicesScreen from '@/screens/admin/AdminServicesScreen';
import AdminChatScreen from '@/screens/admin/AdminChatScreen';
import AdminNotificationsScreen from '@/screens/admin/AdminNotificationsScreen';
import AdminPlanningScreen from '@/screens/admin/AdminPlanningScreen';
import AdminReservationsScreen from '@/screens/admin/AdminReservationsScreen';
import LegalScreen from '@/screens/LegalScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  AdminMain: undefined;
  EmployeeMain: undefined;
  QuoteDetail: { quoteId: string };
  InvoiceDetail: { invoiceId: string };
  AdminUsers: undefined;
  AdminServices: undefined;
  AdminChat: undefined;
  AdminNotifications: undefined;
  AdminPlanning: undefined;
  AdminReservations: undefined;
  Legal: { initialTab?: 'garanties' | 'confidentialite' | 'cgv' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isEmployee = user?.role === 'employee';

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        <>
          {isAdmin ? (
            <Stack.Screen
              name="AdminMain"
              component={AdminTabNavigator}
              options={{ headerShown: false }}
            />
          ) : isEmployee ? (
            <Stack.Screen
              name="EmployeeMain"
              component={EmployeeTabNavigator}
              options={{ headerShown: false }}
            />
          ) : (
            <Stack.Screen
              name="Main"
              component={ClientTabNavigator}
              options={{ headerShown: false }}
            />
          )}
          <Stack.Screen
            name="QuoteDetail"
            component={QuoteDetailScreen}
            options={{
              headerTitle: 'Détail du devis',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="InvoiceDetail"
            component={InvoiceDetailScreen}
            options={{
              headerTitle: 'Détail de la facture',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="AdminUsers"
            component={AdminUsersScreen}
            options={{
              headerTitle: 'Utilisateurs',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="AdminServices"
            component={AdminServicesScreen}
            options={{
              headerTitle: 'Services',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="AdminChat"
            component={AdminChatScreen}
            options={{
              headerTitle: 'Chat',
              presentation: 'card',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminNotifications"
            component={AdminNotificationsScreen}
            options={{
              headerTitle: 'Notifications',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="AdminPlanning"
            component={AdminPlanningScreen}
            options={{
              headerTitle: 'Planning',
              presentation: 'card',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminReservations"
            component={AdminReservationsScreen}
            options={{
              headerTitle: 'Réservations',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="Legal"
            component={LegalScreen}
            options={{
              headerTitle: 'Informations légales',
              presentation: 'card',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Legal"
            component={LegalScreen}
            options={{
              headerTitle: 'Informations légales',
              presentation: 'card',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import ClientDashboardScreen from '@/screens/client/ClientDashboardScreen';
import QuotesScreen from '@/screens/client/QuotesScreen';
import InvoicesScreen from '@/screens/client/InvoicesScreen';
import ReservationsScreen from '@/screens/client/ReservationsScreen';
import ProfileScreen from '@/screens/client/ProfileScreen';
import { HeaderTitle } from '@/components/HeaderTitle';
import { FloatingSupportButton } from '@/components/FloatingSupportButton';
import { useTheme } from '@/hooks/useTheme';

export type ClientTabParamList = {
  HomeTab: undefined;
  QuotesTab: undefined;
  InvoicesTab: undefined;
  ReservationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<ClientTabParamList>();

export default function ClientTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerTitleAlign: 'center',
        headerTintColor: theme.text,
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: theme.backgroundRoot,
            web: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={ClientDashboardScreen}
        options={{
          title: 'Accueil',
          headerTitle: () => <HeaderTitle title="MyJantes" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuotesTab"
        component={QuotesScreen}
        options={{
          title: 'Devis',
          headerTitle: 'Mes Devis',
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="InvoicesTab"
        component={InvoicesScreen}
        options={{
          title: 'Factures',
          headerTitle: 'Mes Factures',
          tabBarIcon: ({ color, size }) => (
            <Feather name="credit-card" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReservationsTab"
        component={ReservationsScreen}
        options={{
          title: 'Réservations',
          headerTitle: 'Réservations',
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          headerTitle: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    <FloatingSupportButton />
    </View>
  );
}

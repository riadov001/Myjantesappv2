import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminQuotesScreen from '@/screens/admin/AdminQuotesScreen';
import AdminInvoicesScreen from '@/screens/admin/AdminInvoicesScreen';
import AdminReservationsScreen from '@/screens/admin/AdminReservationsScreen';
import AdminServicesScreen from '@/screens/admin/AdminServicesScreen';
import AdminMoreScreen from '@/screens/admin/AdminMoreScreen';
import { HeaderTitle } from '@/components/HeaderTitle';
import { FloatingSupportButton } from '@/components/FloatingSupportButton';
import { useTheme } from '@/hooks/useTheme';
export type AdminTabParamList = {
  AdminHomeTab: undefined;
  AdminQuotesTab: undefined;
  AdminInvoicesTab: undefined;
  AdminReservationsTab: undefined;
  AdminServicesTab: undefined;
  AdminMoreTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      initialRouteName="AdminHomeTab"
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
        name="AdminHomeTab"
        component={AdminDashboardScreen}
        options={{
          title: 'Accueil',
          headerTitle: () => <HeaderTitle title="MyJantes Admin" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminQuotesTab"
        component={AdminQuotesScreen}
        options={{
          title: 'Devis',
          headerTitle: 'Gestion des Devis',
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminInvoicesTab"
        component={AdminInvoicesScreen}
        options={{
          title: 'Factures',
          headerTitle: 'Gestion des Factures',
          tabBarIcon: ({ color, size }) => (
            <Feather name="credit-card" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminServicesTab"
        component={AdminServicesScreen}
        options={{
          title: 'Prestations',
          headerTitle: 'Gestion des Prestations',
          tabBarIcon: ({ color, size }) => (
            <Feather name="tool" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminMoreTab"
        component={AdminMoreScreen}
        options={{
          title: 'Plus',
          headerTitle: 'Plus',
          tabBarIcon: ({ color, size }) => (
            <Feather name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    <FloatingSupportButton />
    </View>
  );
}

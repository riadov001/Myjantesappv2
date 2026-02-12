import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

import AdminPlanningScreen from '@/screens/admin/AdminPlanningScreen';
import AdminReservationsScreen from '@/screens/admin/AdminReservationsScreen';
import AdminChatScreen from '@/screens/admin/AdminChatScreen';
import AdminNotificationsScreen from '@/screens/admin/AdminNotificationsScreen';
import EmployeeProfileScreen from '@/screens/employee/EmployeeProfileScreen';
import { HeaderTitle } from '@/components/HeaderTitle';
import { useTheme } from '@/hooks/useTheme';

export type EmployeeTabParamList = {
  EmployeePlanningTab: undefined;
  EmployeeReservationsTab: undefined;
  EmployeeChatTab: undefined;
  EmployeeNotificationsTab: undefined;
  EmployeeProfileTab: undefined;
};

const Tab = createBottomTabNavigator<EmployeeTabParamList>();

export default function EmployeeTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="EmployeePlanningTab"
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
        name="EmployeePlanningTab"
        component={AdminPlanningScreen}
        options={{
          title: 'Planning',
          headerTitle: () => <HeaderTitle title="MyJantes" />,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeReservationsTab"
        component={AdminReservationsScreen}
        options={{
          title: 'Missions',
          headerTitle: 'Mes Missions',
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeChatTab"
        component={AdminChatScreen}
        options={{
          title: 'Chat',
          headerTitle: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeNotificationsTab"
        component={AdminNotificationsScreen}
        options={{
          title: 'Alertes',
          headerTitle: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmployeeProfileTab"
        component={EmployeeProfileScreen}
        options={{
          title: 'Profil',
          headerTitle: 'Mon Profil',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

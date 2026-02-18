import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/hooks/useColors';
import { Typography, Shadows } from '../../src/constants/theme';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          borderColor: colors.border,
          borderWidth: 1,
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 22,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 88 : 74,
          ...Shadows.lg,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          fontWeight: '600',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Create habit"
              activeOpacity={0.85}
              onPress={() => router.push('/habit/create')}
              style={{
                top: -18,
                width: 60,
                height: 60,
                borderRadius: 18,
                backgroundColor: colors.primary,
                borderColor: colors.surface,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
                ...Shadows.lg,
              }}
            >
              <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          ),
          tabBarIcon: () => null,
          tabBarLabel: () => <View />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          href: null,
          title: 'Habits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

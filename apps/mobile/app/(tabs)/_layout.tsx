import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/components/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#161b22', borderTopColor: '#30363d' },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: '#8b949e',
        headerStyle: { backgroundColor: '#161b22' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Domov',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          headerTitle: 'DriveWise',
        }}
      />
      <Tabs.Screen
        name="drive"
        options={{
          title: 'Vožnja',
          tabBarIcon: ({ color, size }) => <Ionicons name="car" color={color} size={size} />,
          headerTitle: 'Aktivna vožnja',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Zgodovina',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
          headerTitle: 'Zgodovina voženj',
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Nagrade',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" color={color} size={size} />,
          headerTitle: 'Nagrade',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          headerTitle: 'Profil',
        }}
      />
    </Tabs>
  );
}

import React from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import '@/global.css';
import { useResponsive } from '../../utils/responsive';

export default function RootLayout() {
  const { rs, rf } = useResponsive();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: rs(5),
          paddingTop: rs(5),
          height: rs(60),
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: rf(16),
        },
        tabBarLabelStyle: {
          fontSize: rf(12),
        },
        tabBarIconStyle: {
          // Icon size is handled in the icon component
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={rs(20)}
              color={color}
            />
          ),
          headerShown: false, // Hide default header to use custom Header component
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "storefront" : "storefront-outline"}
              size={rs(20)}
              color={color}
            />
          ),
          headerShown: false, // Hide default header to use custom Header component
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={rs(20)}
              color={color}
            />
          ),
          headerShown: false, // Hide default header to use custom Header component
        }}
      />
      <Tabs.Screen
        name="favourite"
        options={{
          title: 'Favourites',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={rs(20)}
              color={color}
            />
          ),
          headerShown: false, // Hide default header to use custom Header component
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "bag" : "bag-outline"}
              size={rs(20)}
              color={color}
            />
          ),
          headerShown: false, // Hide default header to use custom Header component
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={rs(20)}
              color={color}
            />
          ),
          headerShown: false, // Hide default header to use custom Header component
        }}
      />
    </Tabs>
  );
}  

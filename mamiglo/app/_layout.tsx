import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import '@/global.css';
import React from 'react';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { OrderProvider } from '../context/OrderContext';
import { ProductProvider } from '../context/ProductContext';
import { AdminOrdersProvider } from '../context/AdminOrdersContext';
import { ToastProvider } from '../components/CustomToast';
import { ClerkProvider } from '@clerk/clerk-expo';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function RootLayoutContent() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [initialRouteSet, setInitialRouteSet] = React.useState(false);

  // Handle initial route based on auth state
  React.useEffect(() => {
    if (loading) return;
    
    if (!initialRouteSet) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/sign-in');
      }
      setInitialRouteSet(true);
    }
  }, [loading, isAuthenticated, router, initialRouteSet]);

  // Show loading screen while determining auth state
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#f9fafb',
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="products/[Id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/sign-in"
        options={{
          headerShown: false,
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="auth/sign-up"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <ToastProvider>
          <AuthProvider>
            <ProductProvider>
              <AdminOrdersProvider>
                <OrderProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <RootLayoutContent />
                    </WishlistProvider>
                  </CartProvider>
                </OrderProvider>
              </AdminOrdersProvider>
            </ProductProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to Clerk auth page (only if user isn't already authenticated)
  React.useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth/sign-in');
    }
  }, [loading, isAuthenticated, router]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center">
        <Ionicons name="hourglass" size={48} color="#6b7280" />
        <Text className="mt-4 text-gray-600">Redirecting to sign in...</Text>
      </View>
    </SafeAreaView>
  );
}

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { width } = Dimensions.get('window');
  const isLargeScreen = width >= 768; // Medium and large screens

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.isAdmin) {
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSignIn = () => {
    router.push('/auth/sign-in?redirect=/admin');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className={`flex-1 ${isLargeScreen ? 'justify-center px-8' : 'items-center justify-center px-6'}`}>
        <View className={`${isLargeScreen ? 'w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8' : 'w-full'}`}>
          <View className={`${isLargeScreen ? 'items-center' : 'items-center'}`}>
            <Ionicons name="lock-closed" size={isLargeScreen ? 80 : 64} color="#3b82f6" />
            <Text className={`${isLargeScreen ? 'text-3xl font-bold text-gray-800 mt-6' : 'text-2xl font-bold text-gray-800 mt-4'}`}>Admin Login</Text>
            <Text className={`${isLargeScreen ? 'text-center text-gray-600 mt-3 text-lg' : 'text-center text-gray-600 mt-2'}`}>
              Sign in with an admin account to access the dashboard.
            </Text>
          </View>

          {isAuthenticated && !user?.isAdmin ? (
            <View className={`${isLargeScreen ? 'mt-6 p-6 bg-yellow-100 rounded-lg' : 'mt-4 p-4 bg-yellow-100 rounded-lg'}`}>
              <Text className="text-yellow-800 font-semibold">Access denied</Text>
              <Text className={`${isLargeScreen ? 'text-base text-yellow-800 mt-2' : 'text-sm text-yellow-800 mt-1'}`}>
                Your account is not authorized as an admin. Please sign in with an admin email.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSignIn}
            className={`${isLargeScreen ? 'mt-8 bg-blue-600 py-4 px-10 rounded-lg self-center' : 'mt-6 bg-blue-600 py-3 px-8 rounded-lg'}`}
          >
            <Text className={`${isLargeScreen ? 'text-white font-semibold text-lg' : 'text-white font-semibold'}`}>Sign in as Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignupPage() {
  const router = useRouter();

  // Redirect to Clerk auth page
  React.useEffect(() => {
    router.replace('/auth/sign-up');
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center">
        <Ionicons name="hourglass" size={48} color="#6b7280" />
        <Text className="mt-4 text-gray-600">Redirecting to sign up...</Text>
      </View>
    </SafeAreaView>
  );
}

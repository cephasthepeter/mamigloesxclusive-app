import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const redirectTo = (params.redirect as string) || '/(tabs)';
  const { signIn, isLoaded } = useSignIn();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOAuthSignIn = async (oauthFlow: any) => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await oauthFlow();
      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
        router.replace(redirectTo)  
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      Alert.alert('OAuth Failed', error?.errors?.[0]?.message || 'Could not sign in with OAuth provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!isLoaded) return;
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        router.replace(redirectTo as any);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.errors?.[0]?.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-6">
        {/* Logo/Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-600 rounded-full items-center justify-center mb-4">
            <Ionicons name="storefront" size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-900">Mamiglo</Text>
          <Text className="text-gray-600 mt-2">Welcome back!</Text>
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Email</Text>
          <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4">
            <Ionicons name="mail-outline" size={20} color="#6b7280" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              className="flex-1 py-3 ml-3 text-gray-800"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">Password</Text>
          <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4">
            <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              className="flex-1 py-3 ml-3 text-gray-800"
              secureTextEntry
            />
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="log-in" size={20} color="white" className="mr-2" />
              <Text className="text-white font-semibold text-lg">Sign In</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity className="mt-4 items-center">
          <Text className="text-blue-600 font-medium">Forgot Password?</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="px-4 text-gray-500">or</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Social Sign In */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={() => handleOAuthSignIn(googleOAuth)}
            disabled={loading}
            className="bg-white border border-gray-300 py-3 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text className="text-gray-800 font-medium ml-2">Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOAuthSignIn(appleOAuth)}
            disabled={loading}
            className="bg-white border border-gray-300 py-3 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="logo-apple" size={20} color="#000000" />
            <Text className="text-gray-800 font-medium ml-2">Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View className="mt-8 flex-row justify-center">
          <Text className="text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text className="text-blue-600 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Info */}
        <View className="mt-6 bg-blue-50 p-4 rounded-lg">
          <Text className="text-sm text-blue-800 text-center">
           </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

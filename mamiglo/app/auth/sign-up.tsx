import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, isLoaded } = useSignUp();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleOAuthSignUp = async (oauthFlow: any) => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await oauthFlow();
      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      Alert.alert('OAuth Failed', error?.errors?.[0]?.message || 'Could not sign up with OAuth provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        emailAddress: email,
        password,
      });

      // Start email verification
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setPendingVerification(true);
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Sign Up Failed',
        error.errors?.[0]?.message || 'Could not create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded) return;
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert(
        'Verification Failed',
        error.errors?.[0]?.message || 'Invalid verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  // Verification screen
  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 px-6 pt-8">
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="mail" size={32} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">Verify Email</Text>
            <Text className="text-gray-600 mt-2 text-center">
              We've sent a verification code to{'\n'}{email}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Verification Code</Text>
            <TextInput
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter 6-digit code"
              className="border border-gray-300 rounded-xl px-4 py-4 bg-white text-center text-xl tracking-widest"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerifyEmail}
            disabled={loading}
            className="bg-green-600 py-4 rounded-xl"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">Verify Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPendingVerification(false)}
            className="mt-4 items-center"
          >
            <Text className="text-gray-600">Didn't receive the code? </Text>
            <Text className="text-blue-600 font-medium">Resend</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Sign up form
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-8">
        {/* Logo/Header */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center mb-3">
            <Ionicons name="storefront" size={32} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">Create Account</Text>
          <Text className="text-gray-600 mt-1">Join Mamiglo today!</Text>
        </View>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Full Name</Text>
          <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4">
            <Ionicons name="person-outline" size={20} color="#6b7280" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              className="flex-1 py-3 ml-3 text-gray-800"
              autoCapitalize="words"
            />
          </View>
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
              placeholder="Create a password (min 8 chars)"
              className="flex-1 py-3 ml-3 text-gray-800"
              secureTextEntry
            />
          </View>
        </View>

        {/* Terms */}
        <View className="flex-row items-start mb-6">
          <TouchableOpacity className="mt-1">
            <Ionicons name="checkbox" size={20} color="#2563eb" />
          </TouchableOpacity>
          <Text className="flex-1 ml-2 text-gray-600 text-sm">
            I agree to the Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="white" className="mr-2" />
              <Text className="text-white font-semibold text-lg">Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="px-4 text-gray-500">or</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Social Sign Up */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={() => handleOAuthSignUp(googleOAuth)}
            disabled={loading}
            className="bg-white border border-gray-300 py-3 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text className="text-gray-800 font-medium ml-2">Sign Up with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOAuthSignUp(appleOAuth)}
            disabled={loading}
            className="bg-white border border-gray-300 py-3 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="logo-apple" size={20} color="#000000" />
            <Text className="text-gray-800 font-medium ml-2">Sign Up with Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View className="mt-8 flex-row justify-center">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
            <Text className="text-blue-600 font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Info */}
        <View className="mt-6 bg-blue-50 p-4 rounded-lg mb-8">
          <Text className="text-sm text-blue-800 text-center">
            For admin access, use an email containing "admin" (e.g., admin@mamiglo.com)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

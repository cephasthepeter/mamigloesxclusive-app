import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'expo-router';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile, loading } = useAuth();
  const { state: cartState, clearCart } = useCart();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/sign-in');
    }
  }, [isAuthenticated, loading, router]);

  const menuItems = [
    { id: '1', icon: '👤', label: 'Personal Info', action: 'edit' },
    { id: '2', icon: '📦', label: 'My Orders', action: 'orders' },
    { id: '3', icon: '❤️', label: 'My Wishlist', action: 'wishlist' },
    { id: '4', icon: '📍', label: 'Addresses', action: 'address' },
    { id: '5', icon: '💳', label: 'Payment Methods', action: 'payment' },
    { id: '6', icon: '⚙️', label: 'Settings', action: 'settings' },
    { id: '7', icon: '📞', label: 'Help & Support', action: 'support' },
    { id: '8', icon: '🚪', label: 'Sign Out', action: 'logout' },
  ];

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'edit':
        if (user) {
          setEditedUser({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            address: user.address ?? '',
          });
        }
        setEditModalVisible(true);
        break;
      case 'orders':
        router.push('/orders');
        break;
      case 'wishlist':
        router.push('/(tabs)/wishlist');
        break;
      case 'address':
        router.push('/addresses');
        break;
      case 'payment':
        Toast.show({
          type: 'info',
          text1: 'Payment Methods',
          text2: 'Coming soon.',
        });
        break;
      case 'settings':
        Toast.show({
          type: 'info',
          text1: 'Settings',
          text2: 'Coming soon.',
        });
        break;
      case 'support':
        Toast.show({
          type: 'info',
          text1: 'Help & Support',
          text2: 'Contact customer support.',
        });
        break;
      case 'logout':
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await logout();
              clearCart();
              router.replace('/auth/sign-in');
            },
          },
        ]);
        break;
      default:
        break;
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({
      name: editedUser.name,
      email: editedUser.email,
      phone: editedUser.phone,
      address: editedUser.address,
    });
    setEditModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Profile Updated',
      text2: 'Your profile has been updated successfully!',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header title="Profile" cartItemCount={cartState.items.length} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View className="bg-blue-600 pt-6 pb-8 px-4">
        <View className="items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-4">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-2xl font-bold text-white">{user?.name ?? 'Guest'}</Text>
          <Text className="text-blue-100 mt-1">Premium Member</Text>
          {user?.isAdmin ? (
            <TouchableOpacity
              onPress={() => router.push('/admin')}
              className="mt-3 bg-white px-4 py-2 rounded-full flex-row items-center justify-center"
            >
              <Text className="text-sm font-semibold text-blue-600">Admin Dashboard</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" className="ml-2" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* User Info Card */}
      <View className="mx-4 mt-4 bg-white rounded-lg p-4 mb-4 shadow-sm">
        <View className="mb-3 pb-3 border-b border-gray-200">
          <Text className="text-gray-600 text-sm">Email</Text>
          <Text className="text-gray-800 font-semibold">{user?.email ?? '-'}</Text>
        </View>
        <View className="mb-3 pb-3 border-b border-gray-200">
          <Text className="text-gray-600 text-sm">Phone</Text>
          <Text className="text-gray-800 font-semibold">{user?.phone ?? '-'}</Text>
        </View>
        <View className="mb-3 pb-3 border-b border-gray-200">
          <Text className="text-gray-600 text-sm">Address</Text>
          <Text className="text-gray-800 font-semibold">{user?.address ?? '-'}</Text>
        </View>
        <View>
          <Text className="text-gray-600 text-sm">Member Since</Text>
          <Text className="text-gray-800 font-semibold">2026</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View className="mx-4 mb-6">
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleMenuPress(item.action)}
            className="bg-white rounded-lg p-4 mb-2 flex-row items-center shadow-sm active:bg-gray-50"
          >
            <Text className="text-2xl mr-4">{item.icon}</Text>
            <Text className="flex-1 text-gray-800 font-semibold">{item.label}</Text>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold">Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Full Name</Text>
              <TextInput
                value={editedUser.name}
                onChangeText={(text) => setEditedUser({ ...editedUser, name: text })}
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                placeholder="Enter your name"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Email</Text>
              <TextInput
                value={editedUser.email}
                onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Phone</Text>
              <TextInput
                value={editedUser.phone}
                onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })}
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                placeholder="Enter your phone"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Address</Text>
              <TextInput
                value={editedUser.address}
                onChangeText={(text) => setEditedUser({ ...editedUser, address: text })}
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                placeholder="Enter your address"
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View className="flex-row gap-3 mt-6 mb-6">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="flex-1 bg-gray-300 py-3 rounded-lg"
              >
                <Text className="text-gray-800 text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                className="flex-1 bg-blue-600 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

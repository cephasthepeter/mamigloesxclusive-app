import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export default function WishlistPage() {
  const router = useRouter();
  const { state, removeFromWishlist } = useWishlist();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to Clerk auth page if user is not authenticated
  React.useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/auth/sign-in');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Ionicons name="hourglass" size={48} color="#6b7280" />
          <Text className="mt-4 text-gray-600">Redirecting to sign in...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        {state.items.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="heart" size={48} color="#d1d5db" />
            <Text className="mt-4 text-gray-600">Your wishlist is empty</Text>
          </View>
        ) : (
          <FlatList
            data={state.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between bg-white p-4 rounded-lg mb-3">
                <View>
                  <Text className="font-semibold text-gray-900">{item.name}</Text>
                  <Text className="text-gray-600">${item.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeFromWishlist(item.id)}
                  className="bg-red-100 px-3 py-2 rounded-full"
                >
                  <Text className="text-red-600">Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            ListHeaderComponent={
              <Text className="text-lg font-bold text-gray-900 mb-3">Your Wishlist</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}


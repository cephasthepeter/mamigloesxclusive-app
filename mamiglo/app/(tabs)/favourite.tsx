import { View, Text, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useResponsive } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function FavouritePage() {
  const { state: wishlistState, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { rs, rf, rw, rh } = useResponsive();

  const handleRemoveFromWishlist = (id: string, name: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Are you sure you want to remove ${name} from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromWishlist(id) },
      ]
    );
  };

  const handleAddToCart = (item: any) => {
    addToCart({
      id: `${item.id}_${Date.now()}`, // Unique cart item ID
      productId: item.id,
      product: item,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${item.name} has been added to your cart!`,
    });
  };

  const handleClearWishlist = () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to clear all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearWishlist },
      ]
    );
  };

  const handleViewProduct = (id: string) => {
    router.push({
      pathname: '/products/[Id]',
      params: { Id: id }
    });
  };

  const renderWishlistItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleViewProduct(item.id)}
      activeOpacity={0.8}
      style={{
        backgroundColor: 'white',
        marginHorizontal: rs(16),
        marginVertical: rs(8),
        borderRadius: rs(8),
        padding: rs(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rs(2) },
        shadowOpacity: 0.1,
        shadowRadius: rs(4),
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <Image
          source={item.image}
          style={{
            width: rw(80),
            height: rh(80),
            borderRadius: rs(8),
            marginRight: rs(12),
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: rf(16),
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: rs(4),
            }}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: rf(14),
              color: '#6b7280',
              marginBottom: rs(8),
            }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text
            style={{
              fontSize: rf(18),
              fontWeight: 'bold',
              color: '#2563eb',
            }}
          >
            ${item.price.toFixed(2)}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: rs(12),
        }}
      >
        <TouchableOpacity
          onPress={() => handleAddToCart(item)}
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            paddingVertical: rs(8),
            borderRadius: rs(6),
            alignItems: 'center',
            marginRight: rs(8),
          }}
        >
          <Text style={{ color: 'white', fontSize: rf(14), fontWeight: '600' }}>
            Add to Cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleRemoveFromWishlist(item.id, item.name)}
          style={{
            paddingHorizontal: rs(12),
            paddingVertical: rs(8),
            backgroundColor: '#fee2e2',
            borderRadius: rs(6),
          }}
        >
          <Ionicons name="heart-dislike-outline" size={rs(16)} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (wishlistState.items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <Header title="Wishlist" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(32) }}>
          <Ionicons name="heart-outline" size={rs(64)} color="#d1d5db" />
          <Text
            style={{
              fontSize: rf(20),
              fontWeight: 'bold',
              color: '#6b7280',
              marginTop: rs(16),
              marginBottom: rs(8),
              textAlign: 'center',
            }}
          >
            Your wishlist is empty
          </Text>
          <Text
            style={{
              fontSize: rf(14),
              color: '#9ca3af',
              textAlign: 'center',
              marginBottom: rs(24),
            }}
          >
            Add products you love to your wishlist
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#2563eb',
              paddingHorizontal: rs(24),
              paddingVertical: rs(12),
              borderRadius: rs(8),
            }}
          >
            <Text style={{ color: 'white', fontSize: rf(16), fontWeight: '600' }}>
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Header title="Wishlist" />

      <View style={{ padding: rs(16), paddingBottom: rs(8) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: rf(18), fontWeight: 'bold', color: '#1f2937' }}>
            My Wishlist ({wishlistState.items.length})
          </Text>
          <TouchableOpacity
            onPress={handleClearWishlist}
            style={{
              backgroundColor: '#fee2e2',
              paddingHorizontal: rs(12),
              paddingVertical: rs(6),
              borderRadius: rs(6),
            }}
          >
            <Text style={{ color: '#dc2626', fontSize: rf(14), fontWeight: '600' }}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={wishlistState.items}
        keyExtractor={(item) => item.id}
        renderItem={renderWishlistItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: rs(16) }}
      />
    </SafeAreaView>
  );
}
import { View, Text, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { useResponsive } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function CartPage() {
  const { state: cartState, removeFromCart, updateQuantity, clearCart } = useCart();
  const { rs, rf, rw, rh } = useResponsive();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${name} from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(id) },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View
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
            {item.product.name}
          </Text>
          {item.variant?.size || item.variant?.color ? (
            <Text style={{ fontSize: rf(12), color: '#6b7280', marginBottom: rs(6) }}>
              {item.variant?.size ? `Size: ${item.variant.size}` : ''}
              {item.variant?.size && item.variant?.color ? ' • ' : ''}
              {item.variant?.color ? `Color: ${item.variant.color}` : ''}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: rf(14),
              color: '#6b7280',
              marginBottom: rs(8),
            }}
            numberOfLines={2}
          >
            {item.product.description}
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
            style={{
              width: rs(32),
              height: rs(32),
              borderRadius: rs(16),
              backgroundColor: '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="remove" size={rs(16)} color="#6b7280" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: rf(16),
              fontWeight: '600',
              color: '#1f2937',
              marginHorizontal: rs(16),
              minWidth: rs(40),
              textAlign: 'center',
            }}
          >
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
            style={{
              width: rs(32),
              height: rs(32),
              borderRadius: rs(16),
              backgroundColor: '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={rs(16)} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => handleRemoveItem(item.id, item.product.name)}
          style={{
            paddingHorizontal: rs(12),
            paddingVertical: rs(6),
            backgroundColor: '#fee2e2',
            borderRadius: rs(6),
          }}
        >
          <Ionicons name="trash-outline" size={rs(16)} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (cartState.items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <Header title="Cart" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(32) }}>
          <Ionicons name="bag-outline" size={rs(64)} color="#d1d5db" />
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
            Your cart is empty
          </Text>
          <Text
            style={{
              fontSize: rf(14),
              color: '#9ca3af',
              textAlign: 'center',
              marginBottom: rs(24),
            }}
          >
            Add some products to get started
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
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Header title="Cart" cartItemCount={cartState.items.length} />

      <FlatList
        data={cartState.items}
        keyExtractor={(item) => item.id}
        renderItem={renderCartItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: rs(16) }}
      />

      {/* Cart Summary */}
      <View
        style={{
          backgroundColor: 'white',
          padding: rs(16),
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: rs(8) }}>
          <Text style={{ fontSize: rf(16), color: '#6b7280' }}>Subtotal</Text>
          <Text style={{ fontSize: rf(16), fontWeight: '600', color: '#1f2937' }}>
            ${cartState.total.toFixed(2)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: rs(16) }}>
          <Text style={{ fontSize: rf(16), color: '#6b7280' }}>Shipping</Text>
          <Text style={{ fontSize: rf(16), fontWeight: '600', color: '#1f2937' }}>Free</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: rs(16) }}>
          <Text style={{ fontSize: rf(18), fontWeight: 'bold', color: '#1f2937' }}>Total</Text>
          <Text style={{ fontSize: rf(18), fontWeight: 'bold', color: '#2563eb' }}>
            ${cartState.total.toFixed(2)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: rs(12) }}>
          <TouchableOpacity
            onPress={handleClearCart}
            style={{
              flex: 1,
              backgroundColor: '#fee2e2',
              paddingVertical: rs(12),
              borderRadius: rs(8),
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#dc2626', fontSize: rf(16), fontWeight: '600' }}>
              Clear Cart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 2,
              backgroundColor: '#2563eb',
              paddingVertical: rs(12),
              borderRadius: rs(8),
              alignItems: 'center',
            }}
            onPress={() => router.push('/checkout')}
          >
            <Text style={{ color: 'white', fontSize: rf(16), fontWeight: '600' }}>
              Checkout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { addToGlobalOrders } from '../context/AdminOrdersContext';
import Toast from 'react-native-toast-message';

export default function CheckoutPage() {
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, isAuthenticated, loading, addresses } = useAuth();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');


  const subtotal = cartState.total;
  const shipping = subtotal > 50 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Automatically use default address if available
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/sign-in');
    }
  }, [loading, isAuthenticated, router]);

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (cartState.items.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is empty',
        text2: 'Add some products before placing an order.',
      });
      return;
    }

    if (!selectedAddressId) {
      Toast.show({
        type: 'error',
        text1: addresses.length === 0 ? 'Add address to proceed' : 'No address selected',
        text2: addresses.length === 0 ? 'Please add a shipping address before placing your order.' : 'Please select a shipping address or add one in the Addresses screen.',
      });
      return;
    }

    const shippingAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!shippingAddress) {
      Toast.show({
        type: 'error',
        text1: 'Invalid address',
        text2: 'Please select a valid shipping address.',
      });
      return;
    }

    // For card/paypal, complete payment first and add the order after success
    if (paymentMethod === 'card' || paymentMethod === 'paypal') {
      router.push(
        `/payment/${paymentMethod === 'card' ? 'stripe' : 'paypal'}?addressId=${selectedAddressId}`
      );
      return;
    }

    // Cash on Delivery (COD)
    // Create the order first
    const newOrder = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: cartState.items,
      total,
      shippingAddress,
      paymentMethod: 'cod',
      status: 'Pending' as const,
    };

    // Add to user's orders
    await addOrder({
      items: cartState.items,
      total,
      shippingAddress,
      paymentMethod: 'cod',
    });

    // Also add to global admin orders
    if (user) {
      await addToGlobalOrders(newOrder, user.email, user.name);
    }

    Toast.show({
      type: 'success',
      text1: 'Order Placed!',
      text2: 'Your order has been successfully placed. You can view it in Order History.',
    });

    clearCart();
    setTimeout(() => {
      router.replace('/orders');
    }, 1000);
  };

  if (cartState.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="bag-outline" size={64} color="#d1d5db" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Your cart is empty</Text>
          <Text className="text-gray-600 text-center mt-2">
            Add some products to your cart before checking out
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-600 py-3 px-6 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white border-b border-gray-200 p-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View className="bg-white m-4 rounded-lg p-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">Order Summary</Text>
          {cartState.items.map((item: any) => (
            <View key={item.id} className="flex-row items-center mb-3">
              <Text className="flex-1 text-gray-800">{item.name}</Text>
              <Text className="text-gray-600">x{item.quantity}</Text>
              <Text className="font-semibold ml-2">${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View className="border-t border-gray-200 pt-3 mt-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="font-semibold">${subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Shipping</Text>
              <Text className="font-semibold">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Tax</Text>
              <Text className="font-semibold">${tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2 mt-2">
              <Text className="text-lg font-bold">Total</Text>
              <Text className="text-lg font-bold text-blue-600">${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View className="bg-white m-4 rounded-lg p-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">Shipping Address</Text>

          {selectedAddressId ? (
            <View className="bg-gray-50 rounded-lg p-4 mb-3">
              <Text className="text-gray-800 font-semibold">
                {addresses.find((a) => a.id === selectedAddressId)?.label}
              </Text>
              <Text className="text-gray-600">
                {addresses.find((a) => a.id === selectedAddressId)?.line1}
              </Text>
              {addresses.find((a) => a.id === selectedAddressId)?.line2 ? (
                <Text className="text-gray-600">
                  {addresses.find((a) => a.id === selectedAddressId)?.line2}
                </Text>
              ) : null}
              <Text className="text-gray-600">
                {addresses.find((a) => a.id === selectedAddressId)?.city},
                {' '}
                {addresses.find((a) => a.id === selectedAddressId)?.state}{' '}
                {addresses.find((a) => a.id === selectedAddressId)?.zipCode}
              </Text>
              <Text className="text-gray-600">
                {addresses.find((a) => a.id === selectedAddressId)?.country}
              </Text>
              {addresses.find((a) => a.id === selectedAddressId)?.phone ? (
                <Text className="text-gray-600">
                  {addresses.find((a) => a.id === selectedAddressId)?.phone}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={() => router.push('/addresses')}
                className="mt-3 bg-blue-50 rounded-lg py-2"
              >
                <Text className="text-blue-600 text-center font-semibold">Change Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mb-2">
              <Text className="text-gray-600">No address selected.</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/addresses')}
            className="bg-blue-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-bold">Manage Addresses</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View className="bg-white m-4 rounded-lg p-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">Payment Method</Text>

          <TouchableOpacity
            onPress={() => setPaymentMethod('card')}
            className={`flex-row items-center p-3 rounded-lg border mb-2 ${
              paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <Ionicons
              name={paymentMethod === 'card' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'card' ? '#3b82f6' : '#6b7280'}
            />
            <Text className="ml-3 font-semibold">Credit/Debit Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('paypal')}
            className={`flex-row items-center p-3 rounded-lg border mb-2 ${
              paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <Ionicons
              name={paymentMethod === 'paypal' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'paypal' ? '#3b82f6' : '#6b7280'}
            />
            <Text className="ml-3 font-semibold">PayPal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('cod')}
            className={`flex-row items-center p-3 rounded-lg border ${
              paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <Ionicons
              name={paymentMethod === 'cod' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'cod' ? '#3b82f6' : '#6b7280'}
            />
            <Text className="ml-3 font-semibold">Cash on Delivery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          className="bg-blue-600 py-4 rounded-lg"
        >
          <Text className="text-white text-center font-bold text-lg">
            Place Order - ${total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
 import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, SearchParams } from 'expo-router';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { processPayPalPayment, processStripePayment } from '@/services/payment';
import Toast from 'react-native-toast-message';
import { useResponsive } from '@/utils/responsive';
import { useSearchParams } from 'expo-router/build/hooks';

export default function PaymentScreen() {
  const searchParams = useSearchParams();
  const method = searchParams.get('method');
  const addressId = searchParams.get('addressId');
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();
  const { user, isAuthenticated, addresses } = useAuth();
  const { addOrder } = useOrders();
  const { rs, rf } = useResponsive();

  const [loading, setLoading] = useState(false);

  const calculateTotal = () => {
    const subtotal = cartState.total;
    const shipping = subtotal > 50 ? 0 : 10;
    const tax = subtotal * 0.08;
    return subtotal + shipping + tax;
  };

  const total = calculateTotal();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/sign-in');
      return;
    }

    if (!method || (method !== 'stripe' && method !== 'paypal')) {
      router.replace('/checkout');
    }
  }, [isAuthenticated, method, router]);

  const handlePayment = async () => {
    if (!user) return;
    if (cartState.items.length === 0) {
      Toast.show({ type: 'error', text1: 'Cart Empty', text2: 'Add items before paying.' });
      router.replace('/');
      return;
    }

    if (addresses.length === 0) {
      Toast.show({ type: 'error', text1: 'No Address', text2: 'Add a shipping address first.' });
      router.replace('/addresses');
      return;
    }

    setLoading(true);

    const paymentResult =
      method === 'paypal'
        ? await processPayPalPayment(total)
        : await processStripePayment(total);

    setLoading(false);

    if (!paymentResult.success) {
      Toast.show({ type: 'error', text1: 'Payment Failed', text2: paymentResult.error || 'Please try again.' });
      return;
    }

    const shippingAddress =
      addresses.find((a: any) => a.id === addressId) ||
      addresses.find((a: any) => a.isDefault) ||
      addresses[0];

    if (!shippingAddress) {
      Toast.show({
        type: 'error',
        text1: 'No shipping address',
        text2: 'Please add a shipping address before completing the payment.',
      });
      router.replace('/addresses');
      return;
    }

    // Create order object
    const newOrder = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: cartState.items,
      total,
      shippingAddress,
      paymentMethod: method || 'stripe',
      status: 'Pending' as const,
    };

    // Add to user's orders
    await addOrder({
      items: cartState.items,
      total,
      shippingAddress,
      paymentMethod: method || 'stripe',
    });

    clearCart();

    Toast.show({
      type: 'success',
      text1: 'Payment successful',
      text2: 'Your order has been placed.',
    });

    router.replace('/orders');
  };

  const title = method === 'paypal' ? 'PayPal Checkout' : 'Stripe Checkout';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text style={{ fontSize: rf(22), fontWeight: 'bold', color: '#1f2937' }}>{title}</Text>
        <Text style={{ fontSize: rf(14), color: '#6b7280', marginTop: rs(4) }}>
          Total: ${total.toFixed(2)}
        </Text>
      </View>

      <View className="flex-1 justify-center items-center px-6">
        <Text style={{ fontSize: rf(16), color: '#4b5563', marginBottom: rs(12) }}>
          Tap below to simulate payment.
        </Text>
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#2563eb',
            paddingVertical: rs(14),
            borderRadius: rs(12),
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: rf(16), textAlign: 'center', fontWeight: '600' }}>
              Complete payment
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/checkout')}
          style={{ marginTop: rs(14) }}
        >
          <Text style={{ color: '#6b7280', fontSize: rf(14) }}>Back to checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

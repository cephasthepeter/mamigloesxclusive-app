import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrders } from '../context/OrderContext';
import { useResponsive } from '../utils/responsive';

export default function OrdersPage() {
  const { orders } = useOrders();
  const { rs, rf } = useResponsive();

  const renderOrder = ({ item }: any) => (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: rs(12),
        padding: rs(14),
        marginBottom: rs(12),
      }}
    >
      <View className="flex-row justify-between">
        <Text style={{ fontSize: rf(16), fontWeight: 'bold', color: '#1f2937' }}>
          Order #{item.id}
        </Text>
        <Text style={{ fontSize: rf(14), color: '#6b7280' }}>{item.status}</Text>
      </View>

      <Text style={{ fontSize: rf(12), color: '#6b7280', marginTop: rs(4) }}>
        Placed on {new Date(item.createdAt).toLocaleDateString()}
      </Text>

      <Text style={{ fontSize: rf(14), color: '#374151', marginTop: rs(8) }}>
        {item.items.length} item{item.items.length === 1 ? '' : 's'} • ${item.total.toFixed(2)}
      </Text>

      <View className="mt-3">
        <Text style={{ fontSize: rf(14), color: '#4b5563', fontWeight: '600' }}>
          Shipping to
        </Text>
        <Text style={{ fontSize: rf(14), color: '#4b5563' }}>{item.shippingAddress.line1}</Text>
        {item.shippingAddress.line2 ? (
          <Text style={{ fontSize: rf(14), color: '#4b5563' }}>{item.shippingAddress.line2}</Text>
        ) : null}
        <Text style={{ fontSize: rf(14), color: '#4b5563' }}>
          {item.shippingAddress.city}, {item.shippingAddress.state} {item.shippingAddress.zipCode}
        </Text>
        <Text style={{ fontSize: rf(14), color: '#4b5563' }}>{item.shippingAddress.country}</Text>
      </View>

      <TouchableOpacity
        style={{
          marginTop: rs(12),
          paddingVertical: rs(10),
          borderRadius: rs(10),
          backgroundColor: '#f3f4f6',
        }}
      >
        <Text style={{ textAlign: 'center', color: '#2563eb', fontWeight: '600', fontSize: rf(14) }}>
          View details
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      <View className="pt-6 pb-4">
        <Text style={{ fontSize: rf(22), fontWeight: 'bold', color: '#1f2937' }}>
          My Orders
        </Text>
        <Text style={{ fontSize: rf(14), color: '#6b7280', marginTop: rs(4) }}>
          Review your past purchases.
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Text style={{ fontSize: rf(16), color: '#6b7280' }}>
              You have no orders yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

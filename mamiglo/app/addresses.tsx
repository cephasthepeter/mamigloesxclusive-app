import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../utils/responsive';

export default function AddressesPage() {
  const { addresses, addAddress, updateAddress, removeAddress, setDefaultAddress } = useAuth();
  const { rs, rf } = useResponsive();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [activeAddress, setActiveAddress] = useState<any>(null);

  const initialAddress = {
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    isDefault: false,
  };

  const [form, setForm] = useState(initialAddress);

  const openAddModal = () => {
    setEditing(false);
    setForm(initialAddress);
    setModalVisible(true);
  };

  const openEditModal = (address: any) => {
    setEditing(true);
    setActiveAddress(address);
    setForm({ ...address });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const requiredFields = ['label', 'line1', 'city', 'state', 'zipCode', 'country'];
    const missing = requiredFields.filter((key) => !(form as any)[key]);
    if (missing.length > 0) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    if (editing && activeAddress) {
      await updateAddress({ ...activeAddress, ...form });
    } else {
      await addAddress(form);
    }

    setModalVisible(false);
  };

  const renderAddress = ({ item }: any) => (
    <View
      style={{
        backgroundColor: 'white',
        padding: rs(14),
        borderRadius: rs(12),
        marginBottom: rs(12),
      }}
    >
      <View className="flex-row justify-between items-start">
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: rf(16), fontWeight: '600', color: '#1f2937' }}>
            {item.label}
            {item.isDefault ? ' (Default)' : ''}
          </Text>
          <Text style={{ fontSize: rf(14), color: '#4b5563', marginTop: rs(4) }}>
            {item.line1}
            {item.line2 ? `, ${item.line2}` : ''}
          </Text>
          <Text style={{ fontSize: rf(14), color: '#4b5563' }}>
            {item.city}, {item.state} {item.zipCode}
          </Text>
          <Text style={{ fontSize: rf(14), color: '#4b5563' }}>{item.country}</Text>
          {item.phone ? (
            <Text style={{ fontSize: rf(14), color: '#4b5563', marginTop: rs(4) }}>
              {item.phone}
            </Text>
          ) : null}
        </View>

        <View className="items-end">
          <TouchableOpacity onPress={() => setDefaultAddress(item.id)}>
            <Ionicons
              name={item.isDefault ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={rs(22)}
              color="#2563eb"
            />
          </TouchableOpacity>
          <View className="flex-row mt-2">
            <TouchableOpacity onPress={() => openEditModal(item)} style={{ marginRight: rs(12) }}>
              <Ionicons name="pencil" size={rs(20)} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Remove address', 'Are you sure you want to remove this address?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => removeAddress(item.id) },
                ])
              }
            >
              <Ionicons name="trash" size={rs(20)} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      <View className="pt-6 pb-4">
        <Text style={{ fontSize: rf(22), fontWeight: 'bold', color: '#1f2937' }}>
          Shipping Addresses
        </Text>
        <Text style={{ fontSize: rf(14), color: '#6b7280', marginTop: rs(4) }}>
          Save and manage multiple shipping addresses.
        </Text>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddress}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Text style={{ fontSize: rf(16), color: '#6b7280' }}>
              No saved addresses yet.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={openAddModal}
        style={{
          backgroundColor: '#2563eb',
          paddingVertical: rs(14),
          borderRadius: rs(12),
          marginTop: rs(16),
          marginBottom: rs(20),
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: rf(16), fontWeight: '600' }}>
          Add New Address
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center' }}>
          <View
            style={{
              margin: rs(18),
              backgroundColor: 'white',
              borderRadius: rs(14),
              padding: rs(16),
            }}
          >
            <Text style={{ fontSize: rf(18), fontWeight: 'bold', color: '#1f2937', marginBottom: rs(12) }}>
              {editing ? 'Edit Address' : 'Add Address'}
            </Text>

            <TextInput
              value={form.label}
              onChangeText={(text) => setForm((prev) => ({ ...prev, label: text }))}
              placeholder="Label (e.g. Home, Office)"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />
            <TextInput
              value={form.line1}
              onChangeText={(text) => setForm((prev) => ({ ...prev, line1: text }))}
              placeholder="Street address"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />
            <TextInput
              value={form.line2}
              onChangeText={(text) => setForm((prev) => ({ ...prev, line2: text }))}
              placeholder="Apt, suite, etc. (optional)"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />
            <TextInput
              value={form.city}
              onChangeText={(text) => setForm((prev) => ({ ...prev, city: text }))}
              placeholder="City"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />
            <TextInput
              value={form.state}
              onChangeText={(text) => setForm((prev) => ({ ...prev, state: text }))}
              placeholder="State / Province"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />
            <TextInput
              value={form.zipCode}
              onChangeText={(text) => setForm((prev) => ({ ...prev, zipCode: text }))}
              placeholder="ZIP / Postal code"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />
            <TextInput
              value={form.country}
              onChangeText={(text) => setForm((prev) => ({ ...prev, country: text }))}
              placeholder="Country"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />
            <TextInput
              value={form.phone}
              onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
              placeholder="Phone (optional)"
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: rs(10),
                padding: rs(10),
                marginBottom: rs(10),
              }}
            />

            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: '#2563eb',
                borderRadius: rs(10),
                paddingVertical: rs(14),
                marginTop: rs(8),
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontSize: rf(16), fontWeight: '600' }}>
                Save Address
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: rs(10),
                alignItems: 'center',
                paddingVertical: rs(12),
              }}
            >
              <Text style={{ color: '#6b7280', fontSize: rf(14) }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '../utils/responsive';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showCart?: boolean;
  showBack?: boolean;
  cartItemCount?: number;
  onSearchPress?: () => void;
  onCartPress?: () => void;
  onMenuPress?: () => void;
}

export default function Header({
  title = 'Mamiglo',
  showSearch = true,
  showCart = true,
  showBack = false,
  cartItemCount = 0,
  onSearchPress,
  onCartPress,
  onMenuPress,
}: HeaderProps) {
  const router = useRouter();
  const [showAbout, setShowAbout] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { isSmall, rs, rf } = useResponsive();

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setShowMenu(true);
    }
  };

  return (
    <View className="bg-white border-b border-gray-200" style={{ paddingHorizontal: rs(16), paddingVertical: rs(12) }}>
      <View className="flex-row items-center">
        {/* Menu Button - Left */}
        <TouchableOpacity
          onPress={handleMenuPress}
          className="p-2 rounded-full bg-gray-100"
          style={{ padding: rs(8) }}
        >
          <Ionicons name="menu" size={rs(20)} color="#374151" />
        </TouchableOpacity>

        {/* Logo/Title - Center */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            <Image
              source={require('../assets/images/icon.png')}
              style={{ width: rs(32), height: rs(32), marginRight: rs(8) }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: rf(20), fontWeight: 'bold', color: '#1f2937' }}>{title}</Text>
          </View>
        </View>

        {/* Info Button - Right */}
        <TouchableOpacity
          onPress={() => setShowAbout(true)}
          className="p-2 rounded-full bg-gray-100"
          style={{ padding: rs(8) }}
        >
          <Ionicons name="information-circle-outline" size={rs(20)} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* About / Brand Info Modal */}
      <Modal
        visible={showAbout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50" style={{ paddingHorizontal: rs(16) }}>
          <View className="w-full bg-white rounded-lg" style={{ maxWidth: isSmall ? '100%' : rs(400), padding: rs(16) }}>
            <ScrollView style={{ maxHeight: rs(384) }}>
              <Text style={{ fontSize: rf(18), fontWeight: 'bold', color: '#1f2937', marginBottom: rs(8) }}>Mamigloexclusive</Text>

              <Text style={{ fontSize: rf(14), color: '#374151', marginBottom: rs(12) }}>
                Mamigloexclusive: Your go-to fashion wholesale powerhouse! We deliver high-quality, stylish clothing and accessories in bulk, perfect for retailers and resellers. Elevate your wardrobe with our exclusive pieces – shop smart, sell smarter. #Mamigloexclusive #WholesaleFashion #StyleInBulk
              </Text>

              <Text style={{ fontSize: rf(14), fontWeight: '600', color: '#1f2937', marginTop: rs(8) }}>Professional Business Description</Text>
              <Text style={{ fontSize: rf(14), color: '#374151', marginBottom: rs(12) }}>
                Mamigloexclusive is a leading fashion wholesale business specializing in bulk sales of trendy clothing and accessories. We cater to retailers, boutiques, and online sellers seeking affordable, high-quality products that stand out in the market. Through strategic social media marketing and professional product photography, we ensure our brand remains visible and protected, fostering long-term partnerships while driving retail engagement.
              </Text>

              <Text style={{ fontSize: rf(14), fontWeight: '600', color: '#1f2937' }}>Mission</Text>
              <Text style={{ fontSize: rf(14), color: '#374151', marginBottom: rs(8) }}>
                To empower fashion retailers and wholesalers by providing stylish, high-quality clothing and accessories at competitive prices, while leveraging innovative visual marketing to build a loyal community and protect our brand integrity.
              </Text>

              <Text style={{ fontSize: rf(14), fontWeight: '600', color: '#1f2937' }}>Vision</Text>
              <Text style={{ fontSize: rf(14), color: '#374151', marginBottom: rs(12) }}>
                To become the premier wholesale fashion destination, recognized for excellence in product quality, ethical practices, and creative marketing that inspires global style trends.
              </Text>
            </ScrollView>

            <View style={{ marginTop: rs(12), flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowAbout(false)} style={{ paddingHorizontal: rs(16), paddingVertical: rs(8), backgroundColor: '#f3f4f6', borderRadius: rs(4) }}>
                <Text style={{ color: '#1f2937' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Drawer */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <View className="flex-1">
          {/* Overlay */}
          <TouchableOpacity
            className="flex-1 bg-black/50"
            onPress={() => setShowMenu(false)}
          />

          {/* Menu Panel */}
          <View
            className="bg-white"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: Dimensions.get('window').width * 0.8,
              maxWidth: rs(300),
            }}
          >
            {/* Menu Header */}
            <View className="bg-blue-600 p-6">
              <View className="flex-row items-center">
                <Image
                  source={require('../assets/images/icon.png')}
                  style={{ width: rs(40), height: rs(40), marginRight: rs(12) }}
                  resizeMode="contain"
                />
                <Text style={{ fontSize: rf(20), fontWeight: 'bold', color: 'white' }}>Mamiglo</Text>
              </View>
              <Text style={{ fontSize: rf(14), color: 'white', opacity: 0.9, marginTop: rs(4) }}>
                Your Fashion Destination
              </Text>
            </View>

            {/* Menu Items */}
            <ScrollView className="flex-1 p-4">
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  router.push('/');
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
                style={{ backgroundColor: '#f8fafc' }}
              >
                <Ionicons name="home" size={rs(20)} color="#2563eb" />
                <Text style={{ fontSize: rf(16), color: '#1f2937', marginLeft: rs(12) }}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/products');
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
              >
                <Ionicons name="grid" size={rs(20)} color="#6b7280" />
                <Text style={{ fontSize: rf(16), color: '#374151', marginLeft: rs(12) }}>Products</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/search');
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
              >
                <Ionicons name="search" size={rs(20)} color="#6b7280" />
                <Text style={{ fontSize: rf(16), color: '#374151', marginLeft: rs(12) }}>Search</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/cart');
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
              >
                <Ionicons name="bag" size={rs(20)} color="#6b7280" />
                <Text style={{ fontSize: rf(16), color: '#374151', marginLeft: rs(12) }}>Cart</Text>
                {cartItemCount > 0 && (
                  <View className="bg-red-500 rounded-full px-2 py-1 ml-auto">
                    <Text style={{ fontSize: rf(12), color: 'white', fontWeight: 'bold' }}>{cartItemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/favourite');
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
              >
                <Ionicons name="heart" size={rs(20)} color="#6b7280" />
                <Text style={{ fontSize: rf(16), color: '#374151', marginLeft: rs(12) }}>Wishlist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/profile');
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
              >
                <Ionicons name="person" size={rs(20)} color="#6b7280" />
                <Text style={{ fontSize: rf(16), color: '#374151', marginLeft: rs(12) }}>Profile</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="border-t border-gray-200 my-4" />

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  setShowAbout(true);
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
              >
                <Ionicons name="information-circle" size={rs(20)} color="#6b7280" />
                <Text style={{ fontSize: rf(16), color: '#374151', marginLeft: rs(12) }}>About</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  // Handle logout or settings
                }}
                className="flex-row items-center p-4 rounded-lg mb-2"
              >
                <Ionicons name="settings" size={rs(20)} color="#6b7280" />
                <Text style={{ fontSize: rf(16), color: '#374151', marginLeft: rs(12) }}>Settings</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"
            >
              <Ionicons name="close" size={rs(20)} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
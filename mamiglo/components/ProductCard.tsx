import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useResponsive } from '../utils/responsive';

export interface ProductCardProps {
  id: string;
  image?: any;
  name: string;
  price?: number;
  rating?: number;
  onAddToCart: (productId: string) => void;
  isLoading?: boolean;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
}

export default function ProductCard({
  id,
  image,
  name,
  price = 0,
  rating = 0,
  onAddToCart,
  isLoading = false,
  onWishlistToggle,
  isWishlisted = false,
}: ProductCardProps) {
  const { isSmall, isMedium, rs, rf, rw, rh, getImageSize } = useResponsive();
  const router = useRouter();

  const renderStars = () => {
    return [...Array(5)].map((_, i) => {
      if (i + 0.5 < rating) return <Ionicons key={i} name="star" size={rs(14)} color="#F59E0B" />;
      if (i < rating) return <Ionicons key={i} name="star-half" size={rs(14)} color="#F59E0B" />;
      return <Ionicons key={i} name="star-outline" size={rs(14)} color="#D1D5DB" />;
    });
  };

  // Responsive card width and image dimensions using new sizing helpers
  const productCardSize = getImageSize('productCard');
  const cardWidth = rw(productCardSize.width);
  const imageHeight = rh(productCardSize.height);

  const handleCardPress = () => {
    router.push({
      pathname: '/products/[Id]',
      params: { Id: id }
    });
  };

  const handleFavouritePress = (e: any) => {
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(id);
    }
  };

  const handleAddToCartPress = (e: any) => {
    e.stopPropagation(); // Prevent card press when add to cart is tapped
    onAddToCart(id);
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={0.8}
      style={{
        width: cardWidth,
        marginHorizontal: rs(8),
        backgroundColor: 'white',
        borderRadius: rs(8),
        padding: rs(16),
        boxShadow: `0px ${rs(2)}px ${rs(4)}px rgba(0,0,0,0.1)`,
        elevation: 2,
      }}
    >
      {/* Image with Favourite Icon */}
      <View className="relative mb-3 overflow-hidden rounded-lg" style={{ marginBottom: rs(12) }}>
        <Image
          source={
            image || require('../assets/images/react-logo.png')
          }
          style={{
            width: '100%',
            height: imageHeight,
            backgroundColor: '#e5e7eb',
          }}
          resizeMode="cover"
        />
        {/* New Badge */}
        <View
          style={{
            position: 'absolute',
            top: rs(8),
            left: rs(8),
            backgroundColor: '#10B981',
            paddingHorizontal: rs(8),
            paddingVertical: rs(4),
            borderRadius: rs(4),
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: rf(10),
              fontWeight: '700',
            }}
          >
            NEW
          </Text>
        </View>
        {/* Wishlist Button */}
        <TouchableOpacity
          onPress={handleFavouritePress}
          className="absolute top-2 right-2 bg-white rounded-full p-2"
          style={{
            position: 'absolute',
            top: rs(8),
            right: rs(8),
            backgroundColor: 'white',
            borderRadius: rs(20),
            padding: rs(8),
          }}
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={rs(20)}
            color={isWishlisted ? '#EF4444' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <Text
        className="text-sm font-semibold text-gray-800 mb-1"
        numberOfLines={2}
        style={{
          fontSize: rf(14),
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: rs(4),
        }}
      >
        {name}
      </Text>
      <View className="flex-row items-center mb-1" style={{ marginBottom: rs(4) }}>
        {renderStars()}
        <Text style={{ fontSize: rf(12), color: '#6b7280', marginLeft: rs(4) }}>({rating.toFixed(1)})</Text>
      </View>
      <Text
        style={{
          color: '#2563eb',
          fontWeight: 'bold',
          fontSize: rf(16),
          marginBottom: rs(8),
        }}
      >
        ${price.toFixed(2)}
      </Text>

      {/* Add to Cart Button */}
      <TouchableOpacity
        onPress={handleAddToCartPress}
        disabled={isLoading}
        className={`py-2 rounded-lg flex-row items-center justify-center ${
          isLoading ? 'bg-blue-400' : 'bg-blue-600'
        }`}
        style={{
          backgroundColor: isLoading ? '#60A5FA' : '#2563eb',
          paddingVertical: rs(8),
          borderRadius: rs(8),
          opacity: isLoading ? 0.7 : 1,
        }}
        accessibilityLabel={`Add ${name} to cart`}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons
              name="checkmark-circle"
              size={rs(16)}
              color="white"
              style={{ marginRight: rs(4) }}
            />
            <Text
              className="text-white text-center font-semibold"
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: rf(14),
              }}
            >
              Added!
            </Text>
          </View>
        ) : (
          <Text
            className="text-white text-center font-semibold"
            style={{
              color: 'white',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: rf(14),
            }}
          >
            Add to Cart
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
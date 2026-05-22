import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { products } from '../../assets/assests';
import { useResponsive } from '../../utils/responsive';
import { useCart } from '../../context/CartContext';
import Toast from 'react-native-toast-message';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addToCart, state: cartState } = useCart();
  const { isSmall, isMedium, rs, rf } = useResponsive();

  const handleAddToCart = (product: any) => {
    addToCart({
      id: `${product.id}_${Date.now()}`, // Unique cart item ID
      productId: product.id,
      product: product,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${product.name} has been added to your cart!`,
    });
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  // Responsive number of columns
  const numColumns = isSmall ? 1 : isMedium ? 2 : 3;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header title="Products" cartItemCount={cartState.items.length} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ padding: rs(16) }}>
          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: rs(16) }}
          >
            {['all', 'electronics', 'audio', 'cameras', 'gaming'].map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={{
                  paddingHorizontal: rs(16),
                  paddingVertical: rs(8),
                  borderRadius: rs(20),
                  marginRight: rs(8),
                  backgroundColor: selectedCategory === category ? '#2563eb' : '#e5e7eb',
                }}
              >
                <Text
                  style={{
                    fontWeight: '600',
                    fontSize: rf(14),
                    color: selectedCategory === category ? 'white' : '#374151',
                  }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Products Grid */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{
                flex: 1,
                marginHorizontal: rs(4),
                marginBottom: rs(16),
                maxWidth: isSmall ? '100%' : isMedium ? '48%' : '32%',
              }}>
                <ProductCard
                  id={item.id}
                  image={item.image}
                  name={item.name}
                  price={item.price}
                  rating={item.rating}
                  onAddToCart={() => handleAddToCart(item)}
                />
              </View>
            )}
            numColumns={numColumns}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: rs(20),
              alignItems: 'center',
            }}
            columnWrapperStyle={numColumns > 1 ? {
              justifyContent: 'space-between',
              marginBottom: rs(8),
            } : undefined}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 
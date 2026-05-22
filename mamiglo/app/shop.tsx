import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '@/components/ProductCard';
import { products } from '@/assets/assests';
import { useResponsive } from '@/utils/responsive';

type FilterCategory = 'all' | string;

export default function Shop() {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const { isSmall, isMedium, rs } = useResponsive();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<
    'price-low' | 'price-high' | 'rating' | 'newest'
  >('newest');

  const [cartLoading, setCartLoading] = useState<string | null>(null);

  // 🔥 Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 🔥 Categories
  const categories = useMemo(() => {
    return ['all', ...new Set(products.map(p => p.category))];
  }, []);

  // 🔥 Filter + Sort
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const search = debouncedSearch.toLowerCase();

      return (
        (product.name.toLowerCase().includes(search) ||
          product.description.toLowerCase().includes(search)) &&
        (selectedCategory === 'all' ||
          product.category === selectedCategory)
      );
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        default:
          return 0;
      }
    });
  }, [debouncedSearch, selectedCategory, sortBy]);

  // 🔥 Add to cart
  const handleAddToCart = useCallback(
    (productId: string) => {
      setCartLoading(productId);

      const product = products.find(p => p.id === productId);

      if (!product) return;

      addToCart({
        id: `${productId}-${Date.now()}`,
        productId: product.id,
        product,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image as any,
      });

      setTimeout(() => setCartLoading(null), 400);
    },
    [addToCart]
  );

  // 🔥 Wishlist
  const handleWishlistToggle = useCallback(
    (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      if (!isAuthenticated) {
        router.push('/auth/sign-in');
        return;
      }

      if (isInWishlist(productId)) {
        removeFromWishlist(productId);
      } else {
        addToWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image as any,
        });
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist, isAuthenticated, router]
  );

  const numColumns = isSmall || isMedium ? 2 : 3;

  // 🔥 Header Component
  const renderHeader = () => (
    <View className="bg-white px-4 py-4">
      <Text className="text-xl font-bold text-gray-900">
        {isAuthenticated ? `Welcome, ${user?.name}` : 'Welcome to Shop'}
      </Text>

      <Text className="text-sm text-gray-600 mb-3">
        {filteredProducts.length} products found
      </Text>

      {/* Search */}
      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
        <Ionicons name="search" size={rs(18)} color="#6B7280" />
        <TextInput
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 ml-2 text-sm"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={rs(18)} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`mr-2 px-4 py-2 rounded-full ${
              selectedCategory === cat ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-sm ${
                selectedCategory === cat
                  ? 'text-white'
                  : 'text-gray-700'
              }`}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort */}
      <ScrollView horizontal className="mt-3">
        {['newest', 'price-low', 'price-high', 'rating'].map(option => (
          <TouchableOpacity
            key={option}
            onPress={() => setSortBy(option as any)}
            className={`mr-2 px-3 py-1 rounded ${
              sortBy === option ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-xs ${
                sortBy === option ? 'text-white' : 'text-gray-700'
              }`}
            >
              {option === 'price-low'
                ? '₦ Low'
                : option === 'price-high'
                ? '₦ High'
                : option === 'rating'
                ? '⭐ Rating'
                : 'Newest'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductCard
            {...item}
            onAddToCart={handleAddToCart}
            isLoading={cartLoading === item.id}
            onWishlistToggle={handleWishlistToggle}
            isWishlisted={isInWishlist(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="search" size={40} color="#D1D5DB" />
            <Text className="mt-3 text-gray-600">
              No products found
            </Text>
          </View>
        }
      />
    </View>
  );
}
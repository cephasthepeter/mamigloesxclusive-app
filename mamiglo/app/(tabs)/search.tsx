import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { products } from '../../assets/assests';
import { useCart } from '../../context/CartContext';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useResponsive } from '../../utils/responsive';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<typeof products>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const { addToCart, state: cartState } = useCart();
  const { rs, rf, getImageSize } = useResponsive();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setHasSearched(true);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: `${product.id}_${Date.now()}`,
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

  const renderProduct = ({ item }: any) => {
    const listItemSize = getImageSize('listItem');
    return (
      <TouchableOpacity
        onPress={() => router.push(`/products/${item.id}`)}
        style={{
          backgroundColor: 'white',
          borderRadius: rs(8),
          padding: rs(16),
          marginBottom: rs(12),
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: rs(2) },
          shadowOpacity: 0.1,
          shadowRadius: rs(4),
          elevation: 1,
        }}
      >
        <Image
          source={item.image}
          style={{
            width: rs(listItemSize.width),
            height: rs(listItemSize.height),
            borderRadius: rs(8),
            marginRight: rs(12),
            backgroundColor: '#e5e7eb',
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
              fontSize: rf(12),
              color: '#6b7280',
              marginBottom: rs(8),
            }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text
            style={{
              color: '#2563eb',
              fontWeight: 'bold',
              fontSize: rf(14),
            }}
          >
            ${item.price.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleAddToCart(item)}
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: rs(12),
            paddingVertical: rs(8),
            borderRadius: rs(6),
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: '600',
              fontSize: rf(12),
            }}
          >
            Add
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const recentSearches = ['Airpods', 'Camera', 'Phone', 'Gaming'];
  const popularCategories = ['Electronics', 'Audio', 'Cameras', 'Accessories'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header title="Search" cartItemCount={cartState.items.length} showCart={true} />
      <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="bg-white p-4 shadow-sm">
        <View className="bg-gray-100 rounded-lg flex-row items-center px-4 py-2">
          <Text className="text-xl text-gray-400 mr-2">🔍</Text>
          <TextInput
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
            className="flex-1 text-gray-800"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {hasSearched ? (
          <>
            {searchResults.length > 0 ? (
              <>
                <Text className="text-lg font-bold text-gray-800 mb-4">
                  Found {searchResults.length} results
                </Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderProduct}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </>
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-2xl mb-2">😕</Text>
                <Text className="text-lg font-bold text-gray-800">No results found</Text>
                <Text className="text-gray-600 mt-2">
                  Try a different search term
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Recent Searches */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-3">
                Recent Searches
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSearch(search)}
                    className="bg-white rounded-full px-4 py-2 border border-gray-300"
                  >
                    <Text className="text-gray-800">{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular Categories */}
            <View>
              <Text className="text-lg font-bold text-gray-800 mb-3">
                Popular Categories
              </Text>
              {popularCategories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  className="bg-white rounded-lg p-4 mb-2 flex-row items-center shadow-sm"
                >
                  <Text className="flex-1 text-gray-800 font-semibold">
                    {category}
                  </Text>
                  <Text className="text-gray-400">›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

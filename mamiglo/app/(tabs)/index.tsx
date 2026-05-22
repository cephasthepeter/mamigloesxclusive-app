import { View, Text, Image, TouchableOpacity, FlatList, TextInput } from 'react-native';
import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { slideBanners, products } from '../../assets/assests';
import { router } from 'expo-router';
import { useResponsive } from '../../utils/responsive';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/CustomToast';

interface Banner {
  id: string;
  image: any;
  title: string;
  subtitle: string;
  buttonText?: string;
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [email, setEmail] = useState('');
  const flatListRef = useRef<FlatList<Banner>>(null);
  const { width, isSmall, isMedium, rs, rf } = useResponsive();
  const { addToCart, state: cartState } = useCart();
  const toast = useToast();
  const activeIndexRef = useRef(activeIndex); // Ref to track activeIndex without causing re-renders

  const bannerWidth = width - rs(32); // horizontal padding
  const bannerItemWidth = bannerWidth + rs(16); // account for horizontal margin between items

  const getBannerItemLayout = (_: ArrayLike<Banner> | null | undefined, index: number) => ({
    length: bannerItemWidth,
    offset: bannerItemWidth * index,
    index,
  });

  const handleAddToCart = (product: any) => {
    addToCart({
      id: `${product.id}_${Date.now()}`, // Consider using a UUID library for better uniqueness
      productId: product.id,
      product: product,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.show('success', 'Added to Cart', `${product.name} has been added to your cart!`);
  };

  const handleSubscribe = () => {
    if (email.trim()) {
      toast.show('success', 'Subscribed', `Subscribed with email: ${email}`);
      setEmail('');
    } else {
      toast.show('error', 'Invalid Email', 'Please enter a valid email address');
    }
  };

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
      activeIndexRef.current = viewableItems[0].index;
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // auto-scroll every 2 seconds - fixed to avoid multiple intervals
  React.useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIndexRef.current + 1) % slideBanners.length;
      setActiveIndex(next);
      activeIndexRef.current = next;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: next, animated: true });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once

  const renderBanner = ({ item }: { item: Banner }) => (
    <View
      className="relative rounded-lg overflow-hidden shadow-sm"
      style={{
        width: bannerWidth,
        marginHorizontal: rs(8),
        borderRadius: rs(8),
      }}
    >
      <Image
        source={item.image}
        style={{
          width: bannerWidth,
          height: bannerWidth * 0.7,
          borderRadius: rs(8),
        }}
        resizeMode="cover"
      />
      <View
        className="absolute bottom-2 left-2 bg-black/50 p-2 rounded"
        style={{
          position: 'absolute',
          bottom: rs(8),
          left: rs(8),
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: rs(8),
          borderRadius: rs(4),
        }}
      >
        <Text style={{ color: 'white', fontSize: rf(16), fontWeight: 'bold' }}>{item.title}</Text>
        <Text style={{ color: 'white', fontSize: rf(12) }} numberOfLines={2}>
          {item.subtitle}
        </Text>
        {item.buttonText && (
          <TouchableOpacity
            className="mt-2 bg-blue-600 py-1 px-3 rounded w-20"
            style={{
              marginTop: rs(8),
              backgroundColor: '#2563eb',
              paddingVertical: rs(4),
              paddingHorizontal: rs(12),
              borderRadius: rs(4),
              width: rs(80),
            }}
            onPress={() => router.push('/(tabs)/products')}
          >
            <Text style={{ color: 'white', fontSize: rf(12), fontWeight: '600', textAlign: 'center' }}>{item.buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Responsive category grid - fixed color mapping
  const getCategoryGrid = () => {
    const categories = [
      { name: 'Electronics', icon: '📱', color: 'bg-blue-100' },
      { name: 'Fashion', icon: '👕', color: 'bg-pink-100' },
      { name: 'Home', icon: '🏠', color: 'bg-green-100' },
      { name: 'Sports', icon: '⚽', color: 'bg-orange-100' },
    ];
    const colorMap = {
      'bg-blue-100': '#dbeafe',
      'bg-pink-100': '#fce7f3',
      'bg-green-100': '#dcfce7',
      'bg-orange-100': '#fed7aa',
    };

    const numColumns = isSmall ? 2 : isMedium ? 3 : 4;
    const categorySize = (width - rs(64)) / numColumns; // 64 for margins and padding

    return (
      <View
        className="flex-row flex-wrap justify-between"
        style={{ marginHorizontal: rs(16), marginTop: rs(12) }}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={{
              width: categorySize - rs(8),
              height: categorySize - rs(8),
              backgroundColor: colorMap[category.color as keyof typeof colorMap],
              borderRadius: rs(8),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: rs(12),
            }}
          >
            <Text style={{ fontSize: rf(24), marginBottom: rs(4) }}>{category.icon}</Text>
            <Text style={{ fontSize: rf(12), fontWeight: '600', color: '#374151' }}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header cartItemCount={cartState.items.length} />

      <FlatList
        data={[{ key: 'home' }]}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: rs(16) }}
        renderItem={() => (
          <>
            {/* Banners Section */}
            <View style={{ paddingVertical: rs(16) }}>
              <Text
                style={{
                  fontSize: rf(16),
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginHorizontal: rs(16),
                  marginBottom: rs(12),
                }}
              >
                Featured Deals
              </Text>
              <FlatList<Banner>
                ref={flatListRef}
                data={slideBanners}
                keyExtractor={(item: Banner) => item.id}
                renderItem={renderBanner}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewRef.current}
                viewabilityConfig={viewConfigRef.current}
                getItemLayout ={getBannerItemLayout}
                onScrollToIndexFailed={({ index }) => {
                  flatListRef.current?.scrollToOffset({
                    offset: index * bannerItemWidth,
                    animated: true,
                  });
                }}
                contentContainerStyle={{ paddingHorizontal: rs(8) }}
              />
              {/* Pagination Dots */}
              <View className="flex-row justify-center" style={{ marginTop: rs(8) }}>
                {slideBanners.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: rs(8),
                      height: rs(8),
                      borderRadius: rs(4),
                      marginHorizontal: rs(2),
                      backgroundColor: i === activeIndex ? '#1f2937' : '#d1d5db',
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Categories Section */}
            <View style={{ paddingVertical: rs(16) }}>
              <Text
                style={{
                  fontSize: rf(16),
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginHorizontal: rs(16),
                  marginBottom: rs(12),
                }}
              >
                Shop by Category
              </Text>
              {getCategoryGrid()}
            </View>

            {/* Welcome Section */}
            <View
              className="bg-white mx-4 p-6 rounded-lg shadow-sm mb-4"
              style={{
                backgroundColor: 'white',
                marginHorizontal: rs(16),
                padding: rs(24),
                borderRadius: rs(8),
                marginBottom: rs(16),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: rs(2) },
                shadowOpacity: 0.1,
                shadowRadius: rs(4),
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: rf(20),
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: rs(8),
                }}
              >
                Welcome to Mamiglo!
              </Text>
              <Text
                style={{
                  fontSize: rf(14),
                  color: '#6b7280',
                  lineHeight: rf(20),
                }}
              >
                Discover amazing products at unbeatable prices. From the latest gadgets to fashion essentials,
                we have everything you need for your lifestyle.
              </Text>
            </View>

            {/* Featured Products Section */}
            <View style={{ paddingVertical: rs(16) }}>
              <View
                className="flex-row justify-between items-center"
                style={{ marginHorizontal: rs(16), marginBottom: rs(12) }}
              >
                <Text style={{ fontSize: rf(16), fontWeight: 'bold', color: '#1f2937' }}>
                  Featured Products
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                  <Text style={{ color: '#2563eb', fontWeight: '600', fontSize: rf(14) }}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: rs(16) }}>
                {/* Responsive product grid - fixed layout */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    marginBottom: rs(16),
                  }}
                >
                  {products.slice(0, isSmall ? 2 : isMedium ? 3 : 4).map((product) => (
                    <View
                      key={product.id}
                      style={{ width: `${100 / (isSmall ? 2 : isMedium ? 3 : 4)}%`, paddingHorizontal: rs(4) }}
                    >
                      <ProductCard
                        id={product.id}
                        image={product.image}
                        name={product.name}
                        price={product.price}
                        rating={product.rating}
                        onAddToCart={() => handleAddToCart(product)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Newsletter Section */}
            <View
              className="py-8 px-4 bg-blue-50 mx-4 my-4 rounded-lg"
              style={{
                paddingVertical: rs(32),
                paddingHorizontal: rs(16),
                backgroundColor: '#eff6ff',
                marginHorizontal: rs(16),
                marginVertical: rs(16),
                borderRadius: rs(8),
              }}
            >
              <Text
                style={{
                  fontSize: rf(20),
                  fontWeight: 'bold',
                  color: '#1f2937',
                  textAlign: 'center',
                  marginBottom: rs(8),
                }}
              >
                Stay Updated
              </Text>
              <Text
                style={{
                  fontSize: rf(14),
                  color: '#6b7280',
                  textAlign: 'center',
                  marginBottom: rs(16),
                }}
              >
                Subscribe to our newsletter for the latest products and exclusive deals.
              </Text>
              <View className="flex-row" style={{ flexDirection: 'row' }}>
                <TextInput
                  className="flex-1 bg-white border border-gray-300 rounded-l-lg px-4 py-3 text-gray-800"
                  style={{
                    flex: 1,
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderTopLeftRadius: rs(8),
                    borderBottomLeftRadius: rs(8),
                    paddingHorizontal: rs(16),
                    paddingVertical: rs(12),
                    color: '#1f2937',
                    fontSize: rf(14),
                  }}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-3 rounded-r-lg justify-center"
                  style={{
                    backgroundColor: '#2563eb',
                    paddingHorizontal: rs(24),
                    paddingVertical: rs(12),
                    borderTopRightRadius: rs(8),
                    borderBottomRightRadius: rs(8),
                    justifyContent: 'center',
                  }}
                  onPress={handleSubscribe}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: '600',
                      fontSize: rf(14),
                    }}
                  >
                    Subscribe
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      />
    </SafeAreaView>
  );
}
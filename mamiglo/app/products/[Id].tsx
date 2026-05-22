import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { products } from '../../assets/assests';
import { useResponsive } from '../../utils/responsive';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../components/CustomToast';

export default function ProductDetail() {
  const { Id } = useLocalSearchParams();
  const router = useRouter();
  const { isSmall, isMedium, rs, rf, rw, rh, getImageSize } = useResponsive();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const toast = useToast();


  const [product, setProduct] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);

  // Create 3 images for the slider (main image + 2 mock variations)
  const getProductImages = (product: any) => {
    if (!product) return [];
    return [
      product.image, // Main image
      product.image, // Mock variation 1 (using same image for demo)
      product.image, // Mock variation 2 (using same image for demo)
    ];
  };

  const productImages = getProductImages(product);

  useEffect(() => {
    // Find the product by ID
    const foundProduct = products.find(p => p.id === Id);
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedImageIndex(0); // Start with first image
      setSelectedSize(foundProduct.variants?.sizes?.[0] ?? null);
      setSelectedColor(foundProduct.variants?.colors?.[0] ?? null);
    } else {
      // Product not found, go back
      toast.show('error', 'Error', 'Product not found');
      router.back();
    }
  }, [Id, router, toast]);

  const getSelectedVariantPrice = () => {
    const sizePrice = selectedSize?.additionalPrice ?? 0;
    const colorPrice = selectedColor?.additionalPrice ?? 0;
    return (product?.price ?? 0) + sizePrice + colorPrice;
  };

  const handleAddToCart = () => {
    if (!product) return;

    const selectedPrice = getSelectedVariantPrice();

    addToCart({
      id: `${product.id}_${Date.now()}`, // Unique cart item ID
      productId: product.id,
      product: product,
      name: product.name,
      price: selectedPrice,
      quantity: quantity,
      image: product.image,
      // Attach variant details so we can display it in cart
      variant: {
        size: selectedSize?.value,
        color: selectedColor?.value,
      },
    });

    toast.show('success', 'Added to Cart', `${product.name} has been added to your cart`);
  };

  const handleToggleWishlist = () => {
    if (product) {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
        toast.show('info', 'Removed from Wishlist', `${product.name} has been removed from your wishlist`);
      } else {
        addToWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        });
        toast.show('success', 'Added to Wishlist', `${product.name} has been added to your wishlist`);
      }
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => {
      if (i + 0.5 < rating) return <Ionicons key={i} name="star" size={rs(16)} color="#F59E0B" />;
      if (i < rating) return <Ionicons key={i} name="star-half" size={rs(16)} color="#F59E0B" />;
      return <Ionicons key={i} name="star-outline" size={rs(16)} color="#D1D5DB" />;
    });
  };

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text style={{ fontSize: rf(16), color: '#6b7280' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="flex-row items-center justify-between bg-white border-b border-gray-200"
        style={{ paddingHorizontal: rs(16), paddingVertical: rs(12) }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: rs(8) }}
        >
          <Ionicons name="arrow-back" size={rs(24)} color="#374151" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: rf(18),
            fontWeight: 'bold',
            color: '#1f2937',
            flex: 1,
            textAlign: 'center',
            marginRight: rs(32),
          }}
          numberOfLines={1}
        >
          Product Details
        </Text>
        <TouchableOpacity
          onPress={handleToggleWishlist}
          style={{ padding: rs(8) }}
        >
          <Ionicons
            name={isInWishlist(product.id) ? "heart" : "heart-outline"}
            size={rs(24)}
            color={isInWishlist(product.id) ? "#EF4444" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Image Slider */}
        <View
          className="bg-white"
          style={{ padding: rs(16), marginBottom: rs(8) }}
        >
          {/* Main Image */}
          <View className="relative">
            <Image
              source={productImages[selectedImageIndex]}
              style={{
                width: '100%',
                height: rh(getImageSize('productDetail').height),
                borderRadius: rs(12),
              }}
              resizeMode="contain"
            />

            {/* Navigation Arrows */}
            <TouchableOpacity
              onPress={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
              disabled={selectedImageIndex === 0}
              style={{
                position: 'absolute',
                left: rs(8),
                top: '50%',
                transform: [{ translateY: -rs(12) }],
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: rs(16),
                padding: rs(8),
                opacity: selectedImageIndex === 0 ? 0.3 : 1,
              }}
            >
              <Ionicons name="chevron-back" size={rs(20)} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedImageIndex(Math.min(productImages.length - 1, selectedImageIndex + 1))}
              disabled={selectedImageIndex === productImages.length - 1}
              style={{
                position: 'absolute',
                right: rs(8),
                top: '50%',
                transform: [{ translateY: -rs(12) }],
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: rs(16),
                padding: rs(8),
                opacity: selectedImageIndex === productImages.length - 1 ? 0.3 : 1,
              }}
            >
              <Ionicons name="chevron-forward" size={rs(20)} color="white" />
            </TouchableOpacity>
          </View>

          {/* Thumbnail Images */}
          <View
            className="flex-row justify-center mt-4"
            style={{ marginTop: rs(16) }}
          >
            {productImages.map((image: any, index: number) => {
              const thumbnailSize = getImageSize('thumbnail');
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={{
                    marginHorizontal: rs(4),
                    borderRadius: rs(8),
                    borderWidth: selectedImageIndex === index ? rs(2) : rs(1),
                    borderColor: selectedImageIndex === index ? '#3b82f6' : '#d1d5db',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={image}
                    style={{
                      width: rs(thumbnailSize.width),
                      height: rs(thumbnailSize.height),
                      borderRadius: rs(6),
                    }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Image Indicators */}
          <View
            className="flex-row justify-center mt-3"
            style={{ marginTop: rs(12) }}
          >
            {productImages.map((_, index: number) => (
              <View
                key={index}
                style={{
                  width: selectedImageIndex === index ? rs(20) : rs(8),
                  height: rs(8),
                  borderRadius: rs(4),
                  backgroundColor: selectedImageIndex === index ? '#3b82f6' : '#d1d5db',
                  marginHorizontal: rs(2),
                }}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View
          className="bg-white mx-4 rounded-lg"
          style={{ marginHorizontal: rs(16), padding: rs(16), borderRadius: rs(8) }}
        >
          {/* Category Badge */}
          <View
            className="self-start bg-blue-100 rounded-full px-3 py-1 mb-2"
            style={{ paddingHorizontal: rs(12), paddingVertical: rs(4), marginBottom: rs(8) }}
          >
            <Text style={{ fontSize: rf(12), color: '#2563eb', fontWeight: '600' }}>
              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </Text>
          </View>

          {/* Product Name */}
          <Text
            style={{
              fontSize: rf(24),
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: rs(8),
            }}
          >
            {product.name}
          </Text>

          {/* Rating */}
          <View
            className="flex-row items-center mb-3"
            style={{ marginBottom: rs(12) }}
          >
            <View className="flex-row mr-2">
              {renderStars(product.rating)}
            </View>
            <Text style={{ fontSize: rf(14), color: '#6b7280' }}>
              ({product.rating.toFixed(1)})
            </Text>
          </View>

          {/* Variant selection */}
          {product.variants?.sizes ? (
            <View className="mb-3">
              <Text style={{ fontSize: rf(14), color: '#374151', marginBottom: rs(8) }}>
                Size
              </Text>
              <View className="flex-row flex-wrap">
                {product.variants.sizes.map((size: any) => {
                  const selected = selectedSize?.value === size.value;
                  return (
                    <TouchableOpacity
                      key={size.value}
                      onPress={() => setSelectedSize(size)}
                      style={{
                        paddingVertical: rs(8),
                        paddingHorizontal: rs(12),
                        borderRadius: rs(10),
                        borderWidth: 1,
                        borderColor: selected ? '#2563eb' : '#d1d5db',
                        marginRight: rs(8),
                        marginBottom: rs(8),
                        backgroundColor: selected ? '#e0f2fe' : 'white',
                      }}
                    >
                      <Text style={{ color: selected ? '#1d4ed8' : '#374151' }}>
                        {size.value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {product.variants?.colors ? (
            <View className="mb-3">
              <Text style={{ fontSize: rf(14), color: '#374151', marginBottom: rs(8) }}>
                Color
              </Text>
              <View className="flex-row flex-wrap">
                {product.variants.colors.map((color: any) => {
                  const selected = selectedColor?.value === color.value;
                  return (
                    <TouchableOpacity
                      key={color.value}
                      onPress={() => setSelectedColor(color)}
                      style={{
                        paddingVertical: rs(8),
                        paddingHorizontal: rs(12),
                        borderRadius: rs(10),
                        borderWidth: 1,
                        borderColor: selected ? '#2563eb' : '#d1d5db',
                        marginRight: rs(8),
                        marginBottom: rs(8),
                        backgroundColor: selected ? '#e0f2fe' : 'white',
                      }}
                    >
                      <Text style={{ color: selected ? '#1d4ed8' : '#374151' }}>
                        {color.value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Price */}
          <Text
            style={{
              fontSize: rf(28),
              fontWeight: 'bold',
              color: '#2563eb',
              marginBottom: rs(16),
            }}
          >
            ${getSelectedVariantPrice().toFixed(2)}
          </Text>

          {/* Quantity Selector */}
          <View
            className="flex-row items-center mb-4"
            style={{ marginBottom: rs(16) }}
          >
            <Text
              style={{
                fontSize: rf(16),
                fontWeight: '600',
                color: '#374151',
                marginRight: rs(16),
              }}
            >
              Quantity:
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  paddingHorizontal: rs(12),
                  paddingVertical: rs(8),
                  borderRightWidth: 1,
                  borderRightColor: '#d1d5db',
                }}
              >
                <Ionicons name="remove" size={rs(16)} color="#6b7280" />
              </TouchableOpacity>
              <Text
                style={{
                  paddingHorizontal: rs(16),
                  fontSize: rf(16),
                  fontWeight: '600',
                  color: '#1f2937',
                }}
              >
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={{
                  paddingHorizontal: rs(12),
                  paddingVertical: rs(8),
                  borderLeftWidth: 1,
                  borderLeftColor: '#d1d5db',
                }}
              >
                <Ionicons name="add" size={rs(16)} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            className="bg-blue-600 py-4 rounded-lg mb-4"
            style={{
              backgroundColor: '#2563eb',
              paddingVertical: rs(16),
              borderRadius: rs(8),
              marginBottom: rs(16),
            }}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontSize: rf(16),
                fontWeight: 'bold',
              }}
            >
              Add to Cart - ${(getSelectedVariantPrice() * quantity).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Description */}
        <View
          className="bg-white mx-4 rounded-lg"
          style={{ marginHorizontal: rs(16), padding: rs(16), borderRadius: rs(8) }}
        >
          <Text
            style={{
              fontSize: rf(18),
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: rs(12),
            }}
          >
            Description
          </Text>
          <Text
            style={{
              fontSize: rf(14),
              color: '#6b7280',
              lineHeight: rf(20),
            }}
          >
            {product.description}
          </Text>
        </View>

        {/* Related Products Section */}
        <View
          style={{ padding: rs(16), marginBottom: rs(20) }}
        >
          <Text
            style={{
              fontSize: rf(18),
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: rs(12),
            }}
          >
            You might also like
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -rs(16), paddingHorizontal: rs(16) }}
          >
            {products
              .filter(p => p.id !== product.id && p.category === product.category)
              .slice(0, 3)
              .map((relatedProduct) => {
                const relatedProductSize = getImageSize('productCard');
                return (
                  <TouchableOpacity
                    key={relatedProduct.id}
                    onPress={() => router.push({
                      pathname: '/products/[Id]',
                      params: { Id: relatedProduct.id }
                    })}
                    style={{
                      width: rw(relatedProductSize.width),
                      marginRight: rs(12),
                      backgroundColor: 'white',
                      borderRadius: rs(8),
                      padding: rs(8),
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: rs(2) },
                      shadowOpacity: 0.1,
                      shadowRadius: rs(4),
                      elevation: 2,
                    }}
                  >
                    <Image
                      source={relatedProduct.image as any}
                      style={{
                        width: '100%',
                        height: rh(relatedProductSize.height),
                        borderRadius: rs(6),
                      }}
                      resizeMode="cover"
                    />
                    <Text
                      style={{
                        fontSize: rf(12),
                        fontWeight: '600',
                        color: '#1f2937',
                        marginTop: rs(6),
                        marginBottom: rs(4),
                      }}
                      numberOfLines={2}
                    >
                      {relatedProduct.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: rf(14),
                        fontWeight: 'bold',
                        color: '#2563eb',
                      }}
                    >
                      ${relatedProduct.price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
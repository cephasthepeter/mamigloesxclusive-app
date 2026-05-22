import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useProducts, ProductFormData } from '../context/ProductContext';
import { useAdminOrders, AdminOrder } from '../context/AdminOrdersContext';
import { OrderStatus } from '../context/OrderContext';
import { useResponsive } from '../utils/responsive';
import { API_ENDPOINTS } from '../config/api';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'users';

// Notification Item Component
const NotificationItem = ({ id, message, type, timestamp, onDismiss }: any) => (
  <View className="bg-gray-50 border-l-4 border-blue-600 p-3 mb-2 rounded-lg flex-row justify-between items-start">
    <View className="flex-1">
      <Text className="font-semibold text-gray-900 text-sm">{message}</Text>
      <Text className="text-xs text-gray-500 mt-1">{new Date(timestamp).toLocaleTimeString()}</Text>
    </View>
    <TouchableOpacity onPress={() => onDismiss(id)}>
      <Ionicons name="close" size={18} color="#9ca3af" />
    </TouchableOpacity>
  </View>
);

// KPI Card Component
const KPICard = ({ label, value, icon, color, trend }: any) => (
  <View className={`flex-1 bg-white rounded-2xl p-4 mr-3 shadow-md border-l-4 ${color}`}>
    <View className="flex-row justify-between items-start mb-2">
      <View className={`${color.replace('border-l-4', 'bg-').replace('-600', '-100')} p-3 rounded-full`}>
        <Ionicons name={icon} size={20} color={color.split('-')[1] === '600' ? '#2563eb' : '#059669'} />
      </View>
      {trend && <Text className={`text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </Text>}
    </View>
    <Text className="text-gray-600 text-xs font-medium mb-1">{label}</Text>
    <Text className="text-2xl font-bold text-gray-900">{value}</Text>
  </View>
);

export default function AdminPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const { rs, rf, getImageSize } = useResponsive();
  const { products, addProduct, updateProduct, deleteProduct, categories } = useProducts();
  const { 
    allOrders, 
    updateOrderStatus, 
    getTotalRevenue, 
    getPendingOrdersCount,
    getProcessingOrdersCount,
    getShippedOrdersCount,
    getDeliveredOrdersCount 
  } = useAdminOrders();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, message: '3 new orders pending', type: 'order', timestamp: new Date() },
  ]);

  // Load theme preference
  useEffect(() => {
    const loadTheme = async () => {
      const theme = await AsyncStorage.getItem('adminTheme');
      setIsDarkMode(theme === 'dark');
    };
    loadTheme();
  }, []);

  // Save theme preference
  const toggleTheme = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await AsyncStorage.setItem('adminTheme', newValue ? 'dark' : 'light');
  };

  // Dismiss notification
  const dismissNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uris = result.assets.map(asset => asset.uri);
        handleImageUpload(uris);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
      });
    }
  };

  // Upload images to backend
  const handleImageUpload = async (imageUris: string[]) => {
    setUploadingImages(true);
    try {
      const formData = new FormData();
      
      imageUris.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `image${index}`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('images', {
          uri,
          name: filename,
          type,
        } as any);
      });

      const response = await fetch(API_ENDPOINTS.UPLOADS, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrls = data.data.map((item: any) => item.url);
        setUploadedImages([...uploadedImages, ...imageUrls]);
        
        // Set first image as the primary image
        const primaryImage = uploadedImages.length === 0 ? imageUrls[0] : productForm.image;
        
        setProductForm({
          ...productForm,
          image: primaryImage,
          images: [...(productForm.images || []), ...imageUrls],
        });
        Toast.show({
          type: 'success',
          text1: 'Images Uploaded',
          text2: `${imageUrls.length} image(s) uploaded successfully`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Error',
        text2: 'Failed to upload image to server',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image from uploaded images
  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setProductForm({
      ...productForm,
      images: newImages,
    });
  };

  // Product form state
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    price: 0,
    description: '',
    category: 'electronics',
    rating: 4.0,
    image: require('../assets/product-images/placeholder.png'),
    images: [],
  });

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed" size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4">Access Denied</Text>
          <Text className="text-center text-gray-600 mt-2">
            You don't have permission to access this page.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Stats calculations
  const totalRevenue = getTotalRevenue();
  const pendingOrders = getPendingOrdersCount();
  const processingOrders = getProcessingOrdersCount();
  const shippedOrders = getShippedOrdersCount();
  const deliveredOrders = getDeliveredOrdersCount();
  const totalProducts = products.length;
  const totalOrders = allOrders.length;

  const openProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        rating: product.rating,
        image: product.image,
        images: product.images || [],
        variants: product.variants,
      });
      setUploadedImages(product.images || []);
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: 0,
        description: '',
        category: 'electronics',
        rating: 4.0,
        image: require('../assets/product-images/placeholder.png'),
        images: [],
      });
      setUploadedImages([]);
    }
    setProductModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.description || productForm.price <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    if (!uploadedImages || uploadedImages.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Image Required',
        text2: 'Please upload at least one product image',
      });
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        Toast.show({
          type: 'success',
          text1: 'Product Updated',
          text2: 'Product has been updated successfully',
        });
      } else {
        await addProduct(productForm);
        Toast.show({
          type: 'success',
          text1: 'Product Added',
          text2: 'New product has been added successfully',
        });
      }
      setProductModalVisible(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save product',
      });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(productId);
            Toast.show({
              type: 'success',
              text1: 'Product Deleted',
              text2: 'Product has been deleted',
            });
          },
        },
      ]
    );
  };

  const openOrderModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    Toast.show({
      type: 'success',
      text1: 'Order Updated',
      text2: `Order status changed to ${status}`,
    });
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render Dashboard with modern design
  const renderDashboard = () => (
    <ScrollView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Welcome Header */}
        <View className="mb-6">
          <Text className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Welcome back</Text>
          <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{user?.name}</Text>
        </View>

        {/* KPI Cards - Row 1 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 mr-3 shadow-md border-l-4 border-green-600`}>
            <Text className={`text-gray-600 text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : ''}`}>Total Revenue</Text>
            <Text className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</Text>
          </View>
          <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md border-l-4 border-blue-600`}>
            <Text className={`text-gray-600 text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : ''}`}>Total Orders</Text>
            <Text className="text-2xl font-bold text-blue-600">{totalOrders}</Text>
          </View>
        </ScrollView>

        {/* KPI Cards - Row 2 */}
        <View className="flex-row mb-6">
          <View className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 mr-2 shadow-md`}>
            <Text className={`text-gray-600 text-xs ${isDarkMode ? 'text-gray-400' : ''}`}>Products</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalProducts}</Text>
          </View>
          <View className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md`}>
            <Text className={`text-gray-600 text-xs ${isDarkMode ? 'text-gray-400' : ''}`}>Pending</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{pendingOrders}</Text>
          </View>
        </View>

        {/* Order Status Overview */}
        <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 mb-6 shadow-md`}>
          <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Status</Text>
          <View className="space-y-2">
            <View className={`flex-row justify-between items-center pb-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b`}>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></View>
                <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Pending</Text>
              </View>
              <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{pendingOrders}</Text>
            </View>
            <View className={`flex-row justify-between items-center pb-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b`}>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-400 mr-2"></View>
                <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Processing</Text>
              </View>
              <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{processingOrders}</Text>
            </View>
            <View className={`flex-row justify-between items-center pb-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b`}>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-purple-400 mr-2"></View>
                <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Shipped</Text>
              </View>
              <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{shippedOrders}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-green-400 mr-2"></View>
                <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Delivered</Text>
              </View>
              <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{deliveredOrders}</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders Card */}
        <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Orders</Text>
            <TouchableOpacity onPress={() => setActiveTab('orders')}>
              <Text className="text-blue-600 font-semibold text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          
          {allOrders.length === 0 ? (
            <Text className={`text-center py-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>No orders yet</Text>
          ) : (
            allOrders.slice(0, 5).map((order, index) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => openOrderModal(order)}
                className={`flex-row justify-between items-center py-3 ${index < allOrders.slice(0, 5).length - 1 ? `${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b` : ''}`}
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>#{order.id.slice(-6)}</Text>
                    <View className={`ml-2 px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      <Text className="text-xs font-semibold">{order.status}</Text>
                    </View>
                  </View>
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{order.userName}</Text>
                </View>
                <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${order.total.toFixed(2)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );

  // Render Products with search
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const renderProducts = () => (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} px-4 py-4 shadow-sm`}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Products</Text>
          <TouchableOpacity
            onPress={() => openProductModal()}
            className="bg-blue-600 px-4 py-2.5 rounded-full flex-row items-center shadow-md"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1 text-sm">New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-3 flex-row items-center`}>
          <Ionicons name="search" size={18} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            className={`flex-1 ml-2 ${isDarkMode ? 'bg-gray-700 text-white' : 'text-gray-700'}`}
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          />
        </View>
      </View>

      <FlatList
        scrollEnabled={false}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const listItemSize = getImageSize('listItem');
          return (
            <View className="px-4 py-2">
              <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-sm mb-3`}>
                <View className="flex-row">
                  <Image
                    source={item.image as any}
                    style={{
                      width: rs(listItemSize.width),
                      height: rs(listItemSize.height),
                      backgroundColor: '#e5e7eb',
                    }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 p-3 justify-between">
                    <View>
                      <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>{item.name}</Text>
                      <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} capitalize mt-1`}>{item.category}</Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ml-1`}>{item.rating}</Text>
                      </View>
                    </View>
                    <Text className="text-lg font-bold text-blue-600">${item.price.toFixed(2)}</Text>
                  </View>
                  <View className="p-2 justify-center gap-2">
                    <TouchableOpacity
                      onPress={() => openProductModal(item)}
                      className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-50'} p-2 rounded-lg`}
                    >
                      <Ionicons name="pencil" size={16} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(item.id)}
                      className={`${isDarkMode ? 'bg-red-900' : 'bg-red-50'} p-2 rounded-lg`}
                    >
                      <Ionicons name="trash" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="cube-outline" size={48} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
            <Text className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-center mt-3`}>No products found</Text>
          </View>
        }
      />
    </View>
  );

  // Render Orders with better design
  const renderOrders = () => (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} px-4 py-4 shadow-sm`}>
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Orders</Text>
        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage all customer orders</Text>
      </View>

      <FlatList
        scrollEnabled={false}
        data={allOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openOrderModal(item)}
            className={`mx-4 mt-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-sm`}
          >
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order #{item.id.slice(-6)}</Text>
                  <View className={`ml-2 px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-bold">{item.status}</Text>
                  </View>
                </View>
                <Text className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-semibold`}>{item.userName}</Text>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.userEmail}</Text>
              </View>
              <Text className="text-lg font-bold text-green-600">${item.total.toFixed(2)}</Text>
            </View>
            <View className={`flex-row justify-between items-center pt-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-t`}>
              <View className="flex-row items-center">
                <Ionicons name="cube" size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ml-1`}>{item.items.length} items</Text>
              </View>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="cart-outline" size={48} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
            <Text className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-center mt-3`}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );

  // Render Users with dark mode
  const renderUsers = () => {
    const uniqueUsers = Array.from(
      new Map(allOrders.map(order => [order.userEmail, { email: order.userEmail, name: order.userName, orders: 0, spent: 0 }]))
    ).map(([email, data]: [string, any]) => {
      const userOrders = allOrders.filter(o => o.userEmail === email);
      return {
        ...data,
        orders: userOrders.length,
        spent: userOrders.reduce((sum, o) => sum + o.total, 0),
      };
    });

    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} px-4 py-4 shadow-sm`}>
          <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customers</Text>
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>View customer information</Text>
        </View>

        <FlatList
          scrollEnabled={false}
          data={uniqueUsers}
          keyExtractor={(item) => item.email}
          renderItem={({ item }) => (
            <View className={`mx-4 mt-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-sm`}>
              <View className="flex-row items-center mb-3">
                <View className={`w-10 h-10 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-full items-center justify-center mr-3`}>
                  <Text className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'} font-bold`}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</Text>
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.email}</Text>
                </View>
              </View>
              <View className={`flex-row justify-between pt-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-t`}>
                <View>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</Text>
                  <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.orders}</Text>
                </View>
                <View>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Spent</Text>
                  <Text className="font-semibold text-green-600">${item.spent.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Ionicons name="people-outline" size={48} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
              <Text className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-center mt-3`}>No customers yet</Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Modern Header */}
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-b from-blue-600 to-blue-700'} px-4 py-4`}>
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>Admin</Text>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-blue-100'}`}>Store Management</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity 
              onPress={toggleTheme}
              className={`${isDarkMode ? 'bg-gray-700' : 'bg-white/20'} p-2.5 rounded-full`}
            >
              <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowNotifications(!showNotifications)}
              className={`${isDarkMode ? 'bg-gray-700' : 'bg-white/20'} p-2.5 rounded-full relative`}
            >
              <Ionicons name="notifications" size={20} color="white" />
              {notifications.length > 0 && (
                <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowProfileMenu(!showProfileMenu)}
              className={`${isDarkMode ? 'bg-gray-700' : 'bg-white/20'} p-2.5 rounded-full`}
            >
              <Ionicons name="person" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.back()} 
              className={`${isDarkMode ? 'bg-gray-700' : 'bg-white/20'} p-2.5 rounded-full`}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Panel */}
        {showNotifications && (
          <View className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg p-3 mt-2`}>
            {notifications.length === 0 ? (
              <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No notifications
              </Text>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  {...notif}
                  onDismiss={dismissNotification}
                />
              ))
            )}
          </View>
        )}

        {/* Profile Menu */}
        {showProfileMenu && (
          <View className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg p-3 mt-2`}>
            <View className={`${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'} pb-3 mb-3`}>
              <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</Text>
            </View>
            <TouchableOpacity 
              onPress={async () => {
                await user;
                setShowProfileMenu(false);
                Toast.show({ type: 'info', text1: 'Profile Settings', text2: 'Coming soon' });
              }}
              className="py-2"
            >
              <Text className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>⚙️ Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setShowProfileMenu(false);
                Toast.show({ type: 'info', text1: 'Help & Support', text2: 'Coming soon' });
              }}
              className="py-2"
            >
              <Text className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>❓ Help</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View className={`flex-row ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        {[
          { id: 'dashboard', icon: 'grid', label: 'Dashboard' },
          { id: 'products', icon: 'cube', label: 'Products' },
          { id: 'orders', icon: 'cart', label: 'Orders' },
          { id: 'users', icon: 'people', label: 'Users' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as AdminTab)}
            className={`flex-1 py-4 items-center ${isDarkMode ? 'border-gray-700' : ''} border-b-2 ${activeTab === tab.id ? `border-blue-600 ${isDarkMode ? 'bg-gray-700' : ''}` : 'border-transparent'}`}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#2563eb' : isDarkMode ? '#9ca3af' : '#9ca3af'}
            />
            <Text
              className={`text-xs mt-1 font-medium ${activeTab === tab.id ? 'text-blue-600' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'orders' && renderOrders()}
      {activeTab === 'users' && renderUsers()}

      {/* Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={productModalVisible}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <View className={`flex-row justify-between items-center p-4 ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity onPress={() => setProductModalVisible(false)}>
              <Ionicons name="close" size={28} color={isDarkMode ? '#e5e7eb' : '#374151'} />
            </TouchableOpacity>
          </View>

          <ScrollView className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4`}>
            <View className="mb-5">
              <Text className={`${isDarkMode ? 'text-white' : 'text-gray-700'} font-bold mb-2`}>Product Name *</Text>
              <TextInput
                value={productForm.name}
                onChangeText={(text) => setProductForm({ ...productForm, name: text })}
                className={`border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'} rounded-xl px-4 py-3`}
                placeholder="Enter product name"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#9ca3af'}
              />
            </View>

            <View className="mb-5 flex-row gap-3">
              <View className="flex-1">
                <Text className={`${isDarkMode ? 'text-white' : 'text-gray-700'} font-bold mb-2`}>Price *</Text>
                <View className={`flex-row items-center border ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-gray-50'} rounded-xl px-4 py-3`}>
                  <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-bold`}>$</Text>
                  <TextInput
                    value={productForm.price > 0 ? productForm.price.toString() : ''}
                    onChangeText={(text) => setProductForm({ ...productForm, price: parseFloat(text) || 0 })}
                    className={`flex-1 ml-2 ${isDarkMode ? 'bg-gray-700 text-white' : 'text-gray-900'}`}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={isDarkMode ? '#9ca3af' : '#9ca3af'}
                  />
                </View>
              </View>

              <View className="flex-1">
                <Text className={`${isDarkMode ? 'text-white' : 'text-gray-700'} font-bold mb-2`}>Rating</Text>
                <View className={`flex-row gap-1 border ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-gray-50'} rounded-xl p-2`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setProductForm({ ...productForm, rating: star })}
                      className="flex-1"
                    >
                      <Ionicons
                        name={star <= productForm.rating ? 'star' : 'star-outline'}
                        size={24}
                        color="#fbbf24"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="mb-5">
              <Text className={`${isDarkMode ? 'text-white' : 'text-gray-700'} font-bold mb-2`}>Category *</Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.filter(c => c !== 'all').map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setProductForm({ ...productForm, category: cat })}
                    className={`px-4 py-2 rounded-full border ${productForm.category === cat ? 'bg-blue-600 border-blue-600' : isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-white'}`}
                  >
                    <Text className={productForm.category === cat ? 'text-white font-semibold' : isDarkMode ? 'text-gray-200 font-medium' : 'text-gray-700 font-medium'}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Image Upload Section */}
            <View className="mb-5">
              <Text className={`${isDarkMode ? 'text-white' : 'text-gray-700'} font-bold mb-2`}>Product Images</Text>
              
              {/* Upload Button */}
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploadingImages}
                className={`border-2 border-dashed ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-gray-50'} rounded-xl px-4 py-6 items-center justify-center mb-3 ${uploadingImages ? 'opacity-50' : ''}`}
              >
                <Ionicons name="image-outline" size={32} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Text className={`mt-2 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  {uploadingImages ? 'Uploading...' : 'Tap to select images'}
                </Text>
                <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  You can select multiple images
                </Text>
              </TouchableOpacity>

              {/* Uploaded Images Display */}
              {uploadedImages.length > 0 && (
                <View className="mb-3">
                  <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm font-semibold mb-2`}>
                    Uploaded Images ({uploadedImages.length})
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {uploadedImages.map((imageUrl, index) => (
                      <View key={index} className="relative">
                        <Image
                          source={{ uri: imageUrl }}
                          style={{ width: 80, height: 80 }}
                          className="rounded-lg bg-gray-200"
                        />
                        <TouchableOpacity
                          onPress={() => removeImage(index)}
                          className={`absolute top-1 right-1 ${isDarkMode ? 'bg-red-600' : 'bg-red-500'} rounded-full p-1`}
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View className="mb-5">
              <Text className={`${isDarkMode ? 'text-white' : 'text-gray-700'} font-bold mb-2`}>Description *</Text>
              <TextInput
                value={productForm.description}
                onChangeText={(text) => setProductForm({ ...productForm, description: text })}
                className={`border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'} rounded-xl px-4 py-3 h-24`}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#9ca3af'}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveProduct}
              className="bg-blue-600 py-4 rounded-xl mt-6 shadow-md"
            >
              <Text className="text-white text-center font-bold text-lg">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="bg-white px-4 py-4 flex-row justify-between items-center border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">Order Details</Text>
            <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
              <Ionicons name="close" size={28} color="#374151" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Order Header */}
              <View className="bg-white mx-4 rounded-2xl p-4 mt-4 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-gray-500 text-sm">Order ID</Text>
                    <Text className="text-2xl font-bold text-gray-900">#{selectedOrder.id.slice(-6)}</Text>
                  </View>
                  <View className={`px-4 py-2 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    <Text className="text-sm font-bold">{selectedOrder.status}</Text>
                  </View>
                </View>
                
                <View className="pt-3 border-t border-gray-100">
                  <Text className="text-gray-500 text-sm mb-1">Ordered on</Text>
                  <Text className="font-semibold text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>

              {/* Customer Info */}
              <View className="bg-white mx-4 rounded-2xl p-4 mt-3 shadow-sm">
                <Text className="text-lg font-bold text-gray-900 mb-3">Customer</Text>
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 text-xl font-bold">
                      {selectedOrder.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900">{selectedOrder.userName}</Text>
                    <Text className="text-sm text-gray-500">{selectedOrder.userEmail}</Text>
                  </View>
                </View>
              </View>

              {/* Order Items */}
              <View className="bg-white mx-4 rounded-2xl p-4 mt-3 shadow-sm">
                <Text className="text-lg font-bold text-gray-900 mb-3">Items</Text>
                {selectedOrder.items.map((item, index) => (
                  <View key={index} className={`flex-row justify-between items-center py-3 ${index < selectedOrder.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">{item.name}</Text>
                      <Text className="text-sm text-gray-500 mt-1">Qty: {item.quantity} × ${item.price.toFixed(2)}</Text>
                    </View>
                    <Text className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {/* Order Summary */}
              <View className="bg-white mx-4 rounded-2xl p-4 mt-3 shadow-sm mb-4">
                <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                  <Text className="text-gray-600">Subtotal</Text>
                  <Text className="font-semibold text-gray-900">${selectedOrder.total.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between items-center pt-3">
                  <Text className="text-lg font-bold text-gray-900">Total</Text>
                  <Text className="text-lg font-bold text-green-600">${selectedOrder.total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Update Status */}
              <View className="bg-white mx-4 rounded-2xl p-4 shadow-sm mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">Update Status</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(['Pending', 'Processing', 'Shipped', 'Delivered'] as OrderStatus[]).map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => handleUpdateOrderStatus(selectedOrder.id, status)}
                      className={`px-4 py-2.5 rounded-full border-2 ${selectedOrder.status === status ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}
                    >
                      <Text className={selectedOrder.status === status ? 'text-white font-bold' : 'text-gray-700 font-semibold'}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

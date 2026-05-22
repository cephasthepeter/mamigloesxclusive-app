import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, OrderStatus } from './OrderContext';

export interface AdminOrder extends Order {
  userEmail: string;
  userName: string;
}

interface AdminOrdersContextType {
  allOrders: AdminOrder[];
  loading: boolean;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getOrderById: (orderId: string) => AdminOrder | undefined;
  getOrdersByStatus: (status: OrderStatus) => AdminOrder[];
  getTotalRevenue: () => number;
  getPendingOrdersCount: () => number;
  getProcessingOrdersCount: () => number;
  getShippedOrdersCount: () => number;
  getDeliveredOrdersCount: () => number;
}

const ALL_ORDERS_STORAGE_KEY = '@mamiglo_all_orders';

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

export const useAdminOrders = () => {
  const context = useContext(AdminOrdersContext);
  if (!context) {
    throw new Error('useAdminOrders must be used within an AdminOrdersProvider');
  }
  return context;
};

// Helper to add order to global orders (called when a user places an order)
export const addToGlobalOrders = async (order: Order, userEmail: string, userName: string) => {
  try {
    const adminOrder: AdminOrder = {
      ...order,
      userEmail,
      userName,
    };

    const stored = await AsyncStorage.getItem(ALL_ORDERS_STORAGE_KEY);
    const existingOrders: AdminOrder[] = stored ? JSON.parse(stored) : [];
    
    const updated = [adminOrder, ...existingOrders];
    await AsyncStorage.setItem(ALL_ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding order to global orders:', error);
  }
};

export const AdminOrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const stored = await AsyncStorage.getItem(ALL_ORDERS_STORAGE_KEY);
        if (stored) {
          setAllOrders(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading admin orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const persistOrders = async (orders: AdminOrder[]) => {
    try {
      await AsyncStorage.setItem(ALL_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving admin orders:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updated = allOrders.map((order) =>
      order.id === orderId ? { ...order, status } : order
    );
    setAllOrders(updated);
    await persistOrders(updated);
  };

  const getOrderById = (orderId: string) => {
    return allOrders.find((order) => order.id === orderId);
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return allOrders.filter((order) => order.status === status);
  };

  const getTotalRevenue = () => {
    return allOrders.reduce((sum, order) => sum + order.total, 0);
  };

  const getPendingOrdersCount = () => {
    return allOrders.filter((order) => order.status === 'Pending').length;
  };

  const getProcessingOrdersCount = () => {
    return allOrders.filter((order) => order.status === 'Processing').length;
  };

  const getShippedOrdersCount = () => {
    return allOrders.filter((order) => order.status === 'Shipped').length;
  };

  const getDeliveredOrdersCount = () => {
    return allOrders.filter((order) => order.status === 'Delivered').length;
  };

  const value = useMemo(
    () => ({
      allOrders,
      loading,
      updateOrderStatus,
      getOrderById,
      getOrdersByStatus,
      getTotalRevenue,
      getPendingOrdersCount,
      getProcessingOrdersCount,
      getShippedOrdersCount,
      getDeliveredOrdersCount,
    }),
    [allOrders, loading]
  );

  return <AdminOrdersContext.Provider value={value}>{children}</AdminOrdersContext.Provider>;
};

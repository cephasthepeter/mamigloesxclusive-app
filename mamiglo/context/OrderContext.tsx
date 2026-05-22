import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from './CartContext';
import { useAuth } from '@/context/AuthContext';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered';

export interface Order {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  shippingAddress: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  status: OrderStatus;
  paymentMethod: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  clearOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_PREFIX = '@mamiglo_orders_';

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const getOrdersKey = (userId: string) => `${ORDERS_STORAGE_PREFIX}${userId}`;

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setOrders([]);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(getOrdersKey(user.id));
        setOrders(stored ? (JSON.parse(stored) as Order[]) : []);
      } catch {
        setOrders([]);
      }
    };

    loadOrders();
  }, [user]);

  const persistOrders = async (newOrders: Order[]) => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(getOrdersKey(user.id), JSON.stringify(newOrders));
    } catch {
      // ignore
    }
  };

  const addOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return;
    const newOrder: Order = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      ...order,
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    await persistOrders(updated);
  };

  const clearOrders = async () => {
    if (!user) return;
    setOrders([]);
    await persistOrders([]);
  };

  const value = useMemo(
    () => ({ orders, addOrder, clearOrders }),
    [orders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

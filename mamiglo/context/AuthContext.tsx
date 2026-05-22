import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isAdmin?: boolean;
  clerkId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const ADDRESSES_STORAGE_KEY_PREFIX = '@mamiglo_addresses_';
const USER_PROFILE_KEY = '@mamiglo_user_profile';

// Admin emails pattern and specific admin user IDs
const isAdminEmail = (email: string): boolean => {
  const normalized = email.trim().toLowerCase();
  return normalized.startsWith('admin') || normalized.includes('@admin') || normalized.includes('admin.');
};

const isAdminUser = (userId: string, email: string): boolean => {
  return userId === 'user_3B8g5pWwtnmzc6pErPi4qEe1rTH' || isAdminEmail(email);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: clerkLoaded, userId, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const getAddressesKey = (userId: string) => `${ADDRESSES_STORAGE_KEY_PREFIX}${userId}`;

  // Load user profile when Clerk user is available
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!clerkLoaded) return;

      try {
        if (userId && clerkUser) {
          // User is signed in with Clerk
          const userProfile: UserProfile = {
            id: clerkUser.id,
            name:
              clerkUser.fullName ||
              clerkUser.username ||
              clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] ||
              'User',
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            phone: clerkUser.phoneNumbers[0]?.phoneNumber,
            isAdmin: isAdminUser(clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress || ''),
            clerkId: clerkUser.id,
          };

          setUser(userProfile);

          // Save to AsyncStorage
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));

          // Load addresses
          const addressKey = getAddressesKey(clerkUser.id);
          const storedAddresses = await AsyncStorage.getItem(addressKey);
          setAddresses(storedAddresses ? (JSON.parse(storedAddresses) as Address[]) : []);
        } else {
          // No Clerk session - user is not authenticated
          setUser(null);
          setAddresses([]);
          await AsyncStorage.removeItem(USER_PROFILE_KEY);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [clerkLoaded, userId, clerkUser]);

  const persistAddresses = async (userId: string, newAddresses: Address[]) => {
    try {
      const key = getAddressesKey(userId);
      await AsyncStorage.setItem(key, JSON.stringify(newAddresses));
    } catch {
      // ignore
    }
  };

  const logout = async () => {
    try {
      // Remove addresses for current user before signing out
      if (userId) {
        const addressKey = getAddressesKey(userId);
        await AsyncStorage.removeItem(addressKey);
      }
      await clerkSignOut();
      setUser(null);
      setAddresses([]);
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser));
  };

  const addAddress = async (address: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) => {
    if (!user) return;
    const id = `${Date.now()}`;
    const newAddress: Address = {
      id,
      isDefault: address.isDefault ?? false,
      ...address,
    };

    const updated = [newAddress, ...addresses].map((item) => {
      if (newAddress.isDefault) {
        return { ...item, isDefault: item.id === newAddress.id };
      }
      return item;
    });

    setAddresses(updated);
    await persistAddresses(user.id, updated);
  };

  const updateAddress = async (address: Address) => {
    if (!user) return;
    const updated = addresses.map((item) => (item.id === address.id ? address : item));
    setAddresses(updated);
    await persistAddresses(user.id, updated);
  };

  const removeAddress = async (id: string) => {
    if (!user) return;
    const updated = addresses.filter((item) => item.id !== id);
    setAddresses(updated);
    await persistAddresses(user.id, updated);
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) return;
    const updated = addresses.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    setAddresses(updated);
    await persistAddresses(user.id, updated);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading: loading || !clerkLoaded,
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      updateProfile,
      logout,
    }),
    [user, loading, clerkLoaded, addresses]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

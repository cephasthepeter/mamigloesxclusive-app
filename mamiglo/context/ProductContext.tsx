import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, products as defaultProducts } from '../assets/assests';

export interface ProductFormData {
  name: string;
  price: number;
  description: string;
  category: string;
  rating: number;
  image: any;
  images?: string[];
  variants?: {
    sizes?: { value: string; additionalPrice: number; stock: number }[];
    colors?: { value: string; hex: string }[];
  };
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: ProductFormData) => Promise<void>;
  updateProduct: (id: string, product: ProductFormData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  getProductsByCategory: (category: string) => Product[];
  categories: string[];
}

const PRODUCTS_STORAGE_KEY = '@mamiglo_products';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products from storage or use defaults
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const stored = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (stored) {
          setProducts(JSON.parse(stored));
        } else {
          // Initialize with default products
          setProducts(defaultProducts);
          await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(defaultProducts));
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts(defaultProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const persistProducts = async (newProducts: Product[]) => {
    try {
      await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  };

  const addProduct = async (productData: ProductFormData) => {
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...productData,
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    await persistProducts(updated);
  };

  const updateProduct = async (id: string, productData: ProductFormData) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...productData } : p
    );
    setProducts(updated);
    await persistProducts(updated);
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    await persistProducts(updated);
  };

  const getProduct = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getProductsByCategory = (category: string) => {
    if (category === 'all') return products;
    return products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category.toLowerCase()));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const value = useMemo(
    () => ({
      products,
      loading,
      addProduct,
      updateProduct,
      deleteProduct,
      getProduct,
      getProductsByCategory,
      categories,
    }),
    [products, loading]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

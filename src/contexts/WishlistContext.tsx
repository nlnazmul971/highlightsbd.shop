import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/data/products';

type WishlistContextType = {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>(() => {
    const saved = localStorage.getItem('highlights-wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('arjo-wishlist', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product) => {
    setItems(prev => prev.find(i => i.id === product.id) ? prev : [...prev, product]);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  }, []);

  const isInWishlist = useCallback((productId: string) => items.some(i => i.id === productId), [items]);

  const toggleItem = useCallback((product: Product) => {
    isInWishlist(product.id) ? removeItem(product.id) : addItem(product);
  }, [isInWishlist, removeItem, addItem]);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, toggleItem }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

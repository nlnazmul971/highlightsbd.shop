import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product, products as initialProducts } from '@/data/products';

type AdminContextType = {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  orders: Order[];
  updateOrderStatus: (id: string, status: string) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
};

export type Order = {
  id: string;
  items: { productId: string; name: string; quantity: number; price: number; size: string; color: string }[];
  total: number;
  customer: { name: string; phone: string; address: string; city: string };
  delivery: string;
  payment: string;
  status: string;
  date: string;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('arjo-orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('arjo-admin') === 'true');

  const addProduct = useCallback((product: Product) => {
    setProducts(prev => [...prev, product]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateOrderStatus = useCallback((id: string, status: string) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, status } : o);
      localStorage.setItem('arjo-orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AdminContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, orders, updateOrderStatus, isAdmin, setIsAdmin: (v) => { setIsAdmin(v); localStorage.setItem('arjo-admin', String(v)); } }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductColor, Review } from '@/data/products';
import type { Json } from '@/integrations/supabase/types';

export const useProducts = (category?: string, search?: string) => {
  return useQuery({
    queryKey: ['products', category, search],
    queryFn: async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (category === 'New Dropped') {
        // Show newest 10 products
        query = query.limit(10);
      } else if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(p => ({ ...p, colors: p.colors as unknown as ProductColor[] })) as Product[];
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      return { ...data, colors: data.colors as unknown as ProductColor[] } as Product;
    },
    enabled: !!id,
  });
};

export const useRelatedProducts = (category: string, excludeId: string) => {
  return useQuery({
    queryKey: ['related-products', category, excludeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', excludeId)
        .limit(4);
      if (error) throw error;
      return (data || []).map(p => ({ ...p, colors: p.colors as unknown as ProductColor[] })) as Product[];
    },
    enabled: !!category && !!excludeId,
  });
};

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { colors, ...rest } = product;
      const { data, error } = await supabase.from('products').insert({ ...rest, colors: colors as unknown as Json }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.colors) payload.colors = updates.colors as unknown as Json;
      delete payload.id;
      const { error } = await supabase.from('products').update(payload as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      user_id: string;
      items: Json;
      total: number;
      customer_name: string;
      customer_phone: string;
      customer_address: string;
      customer_city: string;
      delivery_method: string;
      payment_method: string;
      payment_sender_number?: string | null;
      transaction_id?: string | null;
    }) => {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('orders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useWishlistItems = (userId?: string) => {
  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('wishlist_items').select('*, products(*)').eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useAddWishlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      const { error } = await supabase.from('wishlist_items').insert({ user_id: userId, product_id: productId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
};

export const useRemoveWishlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      const { error } = await supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
};

export const useUserRole = (userId?: string) => {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data?.role || null;
    },
    enabled: !!userId,
  });
};

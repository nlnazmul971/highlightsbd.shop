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

export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
};

export const useAddProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ product_id, image_url, sort_order }: { product_id: string; image_url: string; sort_order: number }) => {
      const { error } = await supabase.from('product_images').insert({ product_id, image_url, sort_order } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-images'] }),
  });
};

export const useDeleteProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-images'] }),
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

export const useAllReviewStats = () => {
  return useQuery({
    queryKey: ['review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('product_id, rating');
      if (error) throw error;
      const stats: Record<string, { avg: number; count: number }> = {};
      for (const r of data || []) {
        if (!stats[r.product_id]) stats[r.product_id] = { avg: 0, count: 0 };
        stats[r.product_id].count++;
        stats[r.product_id].avg += r.rating;
      }
      for (const id in stats) {
        stats[id].avg = stats[id].avg / stats[id].count;
      }
      return stats;
    },
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
      user_id: string | null;
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
      customer_note?: string | null;
    }) => {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, ...updates }: { userId: string; display_name?: string; phone?: string; address?: string; city?: string }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').is('deleted_at', null).order('created_at', { ascending: false });
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

export type DeliveryZoneRow = {
  id: string;
  name: string;
  fee: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useDeliveryZones = (includeInactive = false) => {
  return useQuery({
    queryKey: ['delivery-zones', includeInactive],
    queryFn: async () => {
      let query = supabase.from('delivery_zones').select('*').order('created_at', { ascending: true });
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as DeliveryZoneRow[];
    },
  });
};

export const useUpdateDeliveryZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryZoneRow> & { id: string }) => {
      const { error } = await supabase.from('delivery_zones').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-zones'] }),
  });
};

export type CheckoutPaymentSettingRow = {
  id: string;
  provider: string;
  number: string;
  instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useCheckoutPaymentSettings = () => {
  return useQuery({
    queryKey: ['checkout-payment-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkout_payment_settings')
        .select('*')
        .order('provider', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CheckoutPaymentSettingRow[];
    },
  });
};

export const useUpsertCheckoutPaymentSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (setting: Pick<CheckoutPaymentSettingRow, 'provider' | 'number' | 'instructions' | 'is_active'>) => {
      const { error } = await supabase
        .from('checkout_payment_settings')
        .upsert(setting as any, { onConflict: 'provider' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkout-payment-settings'] }),
  });
};

// Coupons
export type CouponRow = {
  id: string;
  name: string;
  code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CouponRow[];
    },
  });
};

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Pick<CouponRow, 'name' | 'code' | 'discount_type' | 'discount_value' | 'min_order_amount' | 'max_uses' | 'is_active'>) => {
      const { error } = await supabase.from('coupons').insert(coupon as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CouponRow> & { id: string }) => {
      const { error } = await supabase.from('coupons').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Invalid coupon code');
      const coupon = data as unknown as CouponRow;
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) throw new Error('Coupon usage limit reached');
      if (orderTotal < coupon.min_order_amount) throw new Error(`Minimum order ৳${coupon.min_order_amount} required`);
      return coupon;
    },
  });
};

export const useIncrementCouponUsage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: coupon } = await supabase.from('coupons').select('used_count').eq('id', id).single();
      if (!coupon) return;
      await supabase.from('coupons').update({ used_count: (coupon as any).used_count + 1 } as any).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

// Store settings (key-value)
export const useStoreSettings = () => {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('store_settings').select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data || []) map[(row as any).key] = (row as any).value;
      return map;
    },
  });
};

export const useUpdateStoreSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key, value } as any, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-settings'] }),
  });
};

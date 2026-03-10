import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, limit as firestoreLimit,
} from 'firebase/firestore';
import { Product, ProductColor, Review } from '@/data/products';

const toObj = <T>(snap: any): T => ({ id: snap.id, ...snap.data() } as T);

export const useProducts = (category?: string, search?: string) => {
  return useQuery({
    queryKey: ['products', category, search],
    queryFn: async () => {
      let q;
      if (category === 'New Dropped') {
        q = query(collection(db, 'products'), orderBy('created_at', 'desc'), firestoreLimit(10));
      } else if (category && category !== 'All') {
        q = query(collection(db, 'products'), where('category', '==', category), orderBy('created_at', 'desc'));
      } else {
        q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
      }
      const snap = await getDocs(q);
      let data = snap.docs.map(d => toObj<Product>(d));
      if (search) {
        const s = search.toLowerCase();
        data = data.filter(p => p.name.toLowerCase().includes(s));
      }
      return data;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'products', id));
      if (!snap.exists()) throw new Error('Product not found');
      return toObj<Product>(snap);
    },
    enabled: !!id,
  });
};

export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const q = query(collection(db, 'product_images'), where('product_id', '==', productId), orderBy('sort_order', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => toObj<any>(d));
    },
    enabled: !!productId,
  });
};

export const useAddProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ product_id, image_url, sort_order }: { product_id: string; image_url: string; sort_order: number }) => {
      await addDoc(collection(db, 'product_images'), { product_id, image_url, sort_order, created_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-images'] }),
  });
};

export const useDeleteProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'product_images', id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-images'] }),
  });
};

export const useRelatedProducts = (category: string, excludeId: string) => {
  return useQuery({
    queryKey: ['related-products', category, excludeId],
    queryFn: async () => {
      const q = query(collection(db, 'products'), where('category', '==', category), firestoreLimit(5));
      const snap = await getDocs(q);
      return snap.docs.map(d => toObj<Product>(d)).filter(p => p.id !== excludeId).slice(0, 4);
    },
    enabled: !!category && !!excludeId,
  });
};

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const q = query(collection(db, 'reviews'), where('product_id', '==', productId), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => toObj<Review>(d));
    },
    enabled: !!productId,
  });
};

export const useAllReviewStats = () => {
  return useQuery({
    queryKey: ['review-stats'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'reviews'));
      const stats: Record<string, { avg: number; count: number }> = {};
      for (const d of snap.docs) {
        const r = d.data();
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
      const now = new Date().toISOString();
      const ref = await addDoc(collection(db, 'products'), { ...product, created_at: now, updated_at: now });
      return { id: ref.id, ...product, created_at: now, updated_at: now };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      await updateDoc(doc(db, 'products', id), { ...updates, updated_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'products', id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      user_id: string | null;
      items: any;
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
      customer_email?: string | null;
    }) => {
      const now = new Date().toISOString();
      const ref = await addDoc(collection(db, 'orders'), {
        ...order,
        status: 'Pending',
        deleted_at: null,
        consignment_id: null,
        courier_provider: null,
        tracking_code: null,
        order_token: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      });
      return { id: ref.id, ...order };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const snap = await getDoc(doc(db, 'profiles', userId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as any;
    },
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, ...updates }: { userId: string; display_name?: string; phone?: string; address?: string; city?: string }) => {
      await updateDoc(doc(db, 'profiles', userId), { ...updates, updated_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => toObj<any>(d)).filter(o => !o.deleted_at);
    },
  });
};

export const useUpdateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      await updateDoc(doc(db, 'orders', id), { ...updates, updated_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useWishlistItems = (userId?: string) => {
  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(collection(db, 'wishlist_items'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => toObj<any>(d));
      // Fetch products
      const productIds = [...new Set(items.map(i => i.product_id))];
      const products: Record<string, any> = {};
      for (const pid of productIds) {
        const pSnap = await getDoc(doc(db, 'products', pid));
        if (pSnap.exists()) products[pid] = { id: pSnap.id, ...pSnap.data() };
      }
      return items.map(i => ({ ...i, products: products[i.product_id] || null }));
    },
    enabled: !!userId,
  });
};

export const useAddWishlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      await addDoc(collection(db, 'wishlist_items'), { user_id: userId, product_id: productId, created_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
};

export const useRemoveWishlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      const q = query(collection(db, 'wishlist_items'), where('user_id', '==', userId), where('product_id', '==', productId));
      const snap = await getDocs(q);
      for (const d of snap.docs) await deleteDoc(d.ref);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
};

export const useUserRole = (userId?: string) => {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;
      const snap = await getDoc(doc(db, 'user_roles', userId));
      if (!snap.exists()) return null;
      return snap.data()?.role || null;
    },
    enabled: !!userId,
  });
};

// Delivery Zones
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
      const q = query(collection(db, 'delivery_zones'), orderBy('created_at', 'asc'));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => toObj<DeliveryZoneRow>(d));
      if (!includeInactive) data = data.filter(z => z.is_active);
      return data;
    },
  });
};

export const useUpdateDeliveryZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryZoneRow> & { id: string }) => {
      await updateDoc(doc(db, 'delivery_zones', id), { ...updates, updated_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-zones'] }),
  });
};

// Checkout Payment Settings
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
      const snap = await getDocs(collection(db, 'checkout_payment_settings'));
      return snap.docs.map(d => toObj<CheckoutPaymentSettingRow>(d)).sort((a, b) => a.provider.localeCompare(b.provider));
    },
  });
};

export const useUpsertCheckoutPaymentSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (setting: Pick<CheckoutPaymentSettingRow, 'provider' | 'number' | 'instructions' | 'is_active'>) => {
      await setDoc(doc(db, 'checkout_payment_settings', setting.provider), {
        ...setting,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { merge: true });
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
      const q = query(collection(db, 'coupons'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => toObj<CouponRow>(d));
    },
  });
};

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Pick<CouponRow, 'name' | 'code' | 'discount_type' | 'discount_value' | 'min_order_amount' | 'max_uses' | 'is_active'>) => {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'coupons'), { ...coupon, used_count: 0, created_at: now, updated_at: now });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CouponRow> & { id: string }) => {
      await updateDoc(doc(db, 'coupons', id), { ...updates, updated_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'coupons', id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase().trim()), where('is_active', '==', true));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Invalid coupon code');
      const coupon = toObj<CouponRow>(snap.docs[0]);
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
      const snap = await getDoc(doc(db, 'coupons', id));
      if (!snap.exists()) return;
      const current = snap.data().used_count || 0;
      await updateDoc(doc(db, 'coupons', id), { used_count: current + 1 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

// Store settings (key-value)
export const useStoreSettings = () => {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'store_settings'));
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[data.key || d.id] = data.value;
      });
      return map;
    },
  });
};

export const useUpdateStoreSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await setDoc(doc(db, 'store_settings', key), { key, value, updated_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-settings'] }),
  });
};

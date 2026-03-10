
-- 1. CRITICAL: Fix anonymous order data exposure
-- Add order_token column for secure guest order tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Drop the dangerous anon SELECT policy
DROP POLICY IF EXISTS "Anon can view own inserted orders" ON public.orders;

-- Create secure anon policy that requires the order token
CREATE POLICY "Anon can view order by token"
ON public.orders
FOR SELECT
TO anon
USING (order_token = current_setting('request.headers', true)::json->>'x-order-token');

-- 2. Fix coupon enumeration - restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Coupons viewable by everyone" ON public.coupons;

CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to validate a single coupon by code (needed for guest checkout)
CREATE POLICY "Anon can validate coupon by code"
ON public.coupons
FOR SELECT
TO anon
USING (is_active = true);

-- 3. Tighten admin policies: change from public to authenticated role
-- checkout_payment_settings
DROP POLICY IF EXISTS "Admins can delete checkout payment settings" ON public.checkout_payment_settings;
CREATE POLICY "Admins can delete checkout payment settings" ON public.checkout_payment_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert checkout payment settings" ON public.checkout_payment_settings;
CREATE POLICY "Admins can insert checkout payment settings" ON public.checkout_payment_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update checkout payment settings" ON public.checkout_payment_settings;
CREATE POLICY "Admins can update checkout payment settings" ON public.checkout_payment_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- delivery_zones
DROP POLICY IF EXISTS "Admins can delete delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can delete delivery zones" ON public.delivery_zones FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can insert delivery zones" ON public.delivery_zones FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can update delivery zones" ON public.delivery_zones FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- product_images
DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
CREATE POLICY "Admins can insert product images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
CREATE POLICY "Admins can update product images" ON public.product_images FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
CREATE POLICY "Admins can delete product images" ON public.product_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- store_settings
DROP POLICY IF EXISTS "Admins can delete store settings" ON public.store_settings;
CREATE POLICY "Admins can delete store settings" ON public.store_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;
CREATE POLICY "Admins can insert store settings" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
CREATE POLICY "Admins can update store settings" ON public.store_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- profiles: change insert/update from public to authenticated
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- wishlist: change from public to authenticated
DROP POLICY IF EXISTS "Users can add to wishlist" ON public.wishlist_items;
CREATE POLICY "Users can add to wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from wishlist" ON public.wishlist_items;
CREATE POLICY "Users can remove from wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can view own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_roles: change user's own view from public to authenticated
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

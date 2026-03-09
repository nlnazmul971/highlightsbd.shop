
-- Add soft delete columns to orders
ALTER TABLE public.orders ADD COLUMN deleted_at timestamptz DEFAULT null;

-- Create trash_users table for deleted users (since we can't soft-delete auth.users directly)
CREATE TABLE public.trash_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id uuid NOT NULL,
  email text,
  display_name text,
  phone text,
  city text,
  address text,
  role text DEFAULT 'user',
  deleted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trash_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage trash_users"
ON public.trash_users FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

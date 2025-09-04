-- Create admin user directly
-- This will create the admin@gmail.com user with password admin123

-- First, let's ensure we can create auth users via SQL
-- Insert the admin user into auth.users table
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@gmail.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- Insert into identities table
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) SELECT 
  gen_random_uuid(),
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@gmail.com'
ON CONFLICT (provider, id) DO NOTHING;

-- Ensure admin exists in public.admins table
INSERT INTO public.admins (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
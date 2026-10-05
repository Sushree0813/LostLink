-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE public.item_type AS ENUM ('lost', 'found');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.item_status AS ENUM ('pending', 'approved', 'rejected', 'recovered', 'closed');
CREATE TYPE public.claim_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed');
CREATE TYPE public.account_status AS ENUM ('active', 'inactive');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  student_id TEXT UNIQUE,
  department TEXT,
  profile_image TEXT,
  status public.account_status NOT NULL DEFAULT 'active',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'));
$$;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============ ITEMS ============
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type public.item_type NOT NULL,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  brand TEXT,
  color TEXT,
  identifying_features TEXT,
  item_date DATE NOT NULL,
  item_time TIME,
  location TEXT NOT NULL,
  image_url TEXT,
  additional_info TEXT,
  status public.item_status NOT NULL DEFAULT 'pending',
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_user ON public.items(user_id);
CREATE INDEX idx_items_category ON public.items(category_id);
CREATE INDEX idx_items_verification ON public.items(verification_status);
CREATE INDEX idx_items_type ON public.items(item_type);
CREATE INDEX idx_items_created ON public.items(created_at DESC);
GRANT SELECT ON public.items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- ============ CLAIMS ============
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  proof_description TEXT NOT NULL,
  lost_date DATE,
  lost_location TEXT,
  additional_proof TEXT,
  status public.claim_status NOT NULL DEFAULT 'pending',
  admin_remarks TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_claims_item ON public.claims(item_id);
CREATE INDEX idx_claims_claimant ON public.claims(claimant_id);
CREATE INDEX idx_claims_status ON public.claims(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============ ACTIVITY LOGS ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_created ON public.activity_logs(created_at DESC);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_staff" ON public.profiles FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "roles_select_own_or_staff" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories_staff_write" ON public.categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "items_public_approved" ON public.items FOR SELECT TO anon, authenticated
  USING (verification_status = 'approved');
CREATE POLICY "items_select_own" ON public.items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "items_select_staff" ON public.items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "items_insert_own" ON public.items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "items_update_own_pending" ON public.items FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND verification_status = 'pending') WITH CHECK (user_id = auth.uid());
CREATE POLICY "items_update_staff" ON public.items FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "items_delete_own" ON public.items FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "items_delete_staff" ON public.items FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "claims_select_own" ON public.claims FOR SELECT TO authenticated
  USING (claimant_id = auth.uid() OR public.is_staff(auth.uid())
         OR EXISTS (SELECT 1 FROM public.items i WHERE i.id = item_id AND i.user_id = auth.uid()));
CREATE POLICY "claims_insert_own" ON public.claims FOR INSERT TO authenticated WITH CHECK (claimant_id = auth.uid());
CREATE POLICY "claims_update_staff" ON public.claims FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_insert_authenticated" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "logs_select_staff" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "logs_insert_authenticated" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_items_touch BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_claims_touch BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- create profile + default role on signup; demo staff emails get elevated roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, student_id, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'student_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', '')
  )
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email = 'superadmin@lostlink.edu' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSIF NEW.email = 'admin@lostlink.edu' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PUBLIC STATS (landing page) ============
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSON LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'total_reports', (SELECT count(*) FROM public.items WHERE verification_status = 'approved'),
    'lost_items', (SELECT count(*) FROM public.items WHERE verification_status = 'approved' AND item_type = 'lost'),
    'found_items', (SELECT count(*) FROM public.items WHERE verification_status = 'approved' AND item_type = 'found'),
    'recovered_items', (SELECT count(*) FROM public.items WHERE status = 'recovered'),
    'active_users', (SELECT count(*) FROM public.profiles WHERE status = 'active')
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories (name, description) VALUES
  ('ID Card', 'College identity cards and access badges'),
  ('Wallet', 'Wallets, purses and cardholders'),
  ('Mobile Phone', 'Smartphones and feature phones'),
  ('Laptop', 'Laptops, tablets and chargers'),
  ('Books', 'Textbooks, notebooks and study material'),
  ('Keys', 'Room, vehicle and locker keys'),
  ('Accessories', 'Watches, jewellery, bags and eyewear'),
  ('Documents', 'Certificates, files and printed documents'),
  ('Electronics', 'Earphones, power banks and other gadgets'),
  ('Clothing', 'Jackets, hoodies, scarves and uniforms'),
  ('Other', 'Anything that does not fit other categories');

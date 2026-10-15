-- Supabase Schema Migration: DoorSolver Multi-Role Architecture
-- Version: 001_initial_schema.sql

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES & ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('pending', 'staff', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('staff', 'admin') AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. PUBLIC DESIGN SUBMISSIONS (Sanitized Public Snapshots)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.design_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_code TEXT NOT NULL UNIQUE,
    share_token TEXT NOT NULL UNIQUE,
    job_name TEXT NOT NULL DEFAULT 'Custom Door Project',
    door_type TEXT NOT NULL DEFAULT '2 Panel',
    species TEXT NOT NULL DEFAULT 'Poplar',
    profile TEXT NOT NULL DEFAULT 'Shaker',
    finish TEXT NOT NULL DEFAULT 'Stain',
    design_spec JSONB NOT NULL DEFAULT '{}'::jsonb,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_share_code ON public.design_submissions(share_code);
CREATE INDEX IF NOT EXISTS idx_submissions_share_token ON public.design_submissions(share_token);

-- ==============================================================================
-- 3. JOBS (Internal Production Workspace)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_code TEXT NOT NULL UNIQUE,
    submission_id UUID REFERENCES public.design_submissions(id) ON DELETE SET NULL,
    job_name TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    door_type TEXT NOT NULL DEFAULT '2 Panel',
    species TEXT NOT NULL DEFAULT 'Poplar',
    profile TEXT NOT NULL DEFAULT 'Shaker',
    finish TEXT NOT NULL DEFAULT 'Stain',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'quoted', 'in_production', 'completed', 'archived')),
    staff_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    production_presets JSONB NOT NULL DEFAULT '{}'::jsonb,
    doors JSONB NOT NULL DEFAULT '[]'::jsonb,
    parts_cache JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_submission ON public.jobs(submission_id);

-- ==============================================================================
-- 4. PRICE BOOKS & RULES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.price_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. QUOTES & QUOTE ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number TEXT NOT NULL UNIQUE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    price_book_id UUID REFERENCES public.price_books(id) ON DELETE RESTRICT,
    price_book_version TEXT NOT NULL,
    calc_engine_version TEXT NOT NULL DEFAULT '1.0.0',
    customer_name TEXT NOT NULL DEFAULT 'Valued Customer',
    customer_email TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL DEFAULT 0,
    markup_percent NUMERIC(5,2) NOT NULL DEFAULT 25.00,
    tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 6.00,
    terms TEXT DEFAULT 'Quote valid for 30 days. 50% deposit required upon order confirmation.',
    valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'door' CHECK (item_type IN ('door', 'material_addon', 'finish_addon', 'prep_addon', 'custom')),
    description TEXT NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    unit_price_cents BIGINT NOT NULL DEFAULT 0,
    total_price_cents BIGINT NOT NULL DEFAULT 0,
    spec_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);

-- ==============================================================================
-- 6. AUDIT EVENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at DESC);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile; admins can read and update all profiles
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- Design Submissions: anyone (anonymous) can create and read public design submissions
CREATE POLICY "Public can insert design submissions" ON public.design_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read design submissions" ON public.design_submissions
    FOR SELECT USING (true);

CREATE POLICY "Staff can update design submissions" ON public.design_submissions
    FOR UPDATE USING (public.is_staff());

-- Jobs: Staff and Admin can view and manage all shop jobs
CREATE POLICY "Staff can read jobs" ON public.jobs
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can insert jobs" ON public.jobs
    FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "Staff can update jobs" ON public.jobs
    FOR UPDATE USING (public.is_staff());

CREATE POLICY "Staff can delete jobs" ON public.jobs
    FOR DELETE USING (public.is_admin());

-- Price Books: Staff can read published price books; Admins can manage all
CREATE POLICY "Staff can view price books" ON public.price_books
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Admins can manage price books" ON public.price_books
    FOR ALL USING (public.is_admin());

-- Quotes & Items: Staff can read, insert and update quotes
CREATE POLICY "Staff can read quotes" ON public.quotes
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can insert quotes" ON public.quotes
    FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "Staff can update quotes" ON public.quotes
    FOR UPDATE USING (public.is_staff());

CREATE POLICY "Staff can read quote items" ON public.quote_items
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can insert quote items" ON public.quote_items
    FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "Staff can update quote items" ON public.quote_items
    FOR UPDATE USING (public.is_staff());

CREATE POLICY "Staff can delete quote items" ON public.quote_items
    FOR DELETE USING (public.is_staff());

-- Audit Events: Staff can view; system/authenticated can insert
CREATE POLICY "Staff can view audit events" ON public.audit_events
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Authenticated can insert audit events" ON public.audit_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================================================
-- 8. INITIAL SEED DATA (Default Price Book v1.0.0)
-- ==============================================================================
INSERT INTO public.price_books (version, name, status, rules)
VALUES (
    'v1.0.0',
    'Standard 2026 Price Book (Trim Choice)',
    'published',
    '{
        "baseStyleRates": {
            "1 Panel": 12000,
            "2 Panel": 14500,
            "3 Panel": 17500
        },
        "speciesMultiplier": {
            "Poplar": 1.0,
            "Red Oak": 1.25,
            "White Oak": 1.65,
            "Maple": 1.35,
            "Hickory": 1.40,
            "Clear Pine": 1.15,
            "Knotty Pine": 1.05,
            "Knotty Alder": 1.30,
            "Cherry": 1.75,
            "Walnut": 2.10
        },
        "speciesSqFtRateCents": {
            "Poplar": 650,
            "Red Oak": 900,
            "White Oak": 1450,
            "Maple": 1100,
            "Hickory": 1150,
            "Clear Pine": 750,
            "Knotty Pine": 680,
            "Knotty Alder": 980,
            "Cherry": 1600,
            "Walnut": 2200
        },
        "profileAddonCents": {
            "Shaker": 0,
            "Ovolo": 1500
        },
        "finishAddonCents": {
            "Raw": 0,
            "Primer": 3500,
            "Stain": 6500,
            "Paint": 8000
        },
        "prepFees": {
            "hingePrep": 1800,
            "borePrep": 1200,
            "customSizeSurcharge": 2500
        },
        "defaultMarkupPercent": 25.0,
        "defaultTaxRatePercent": 6.0,
        "minimumOrderChargeCents": 15000
    }'::jsonb
)
ON CONFLICT (version) DO NOTHING;

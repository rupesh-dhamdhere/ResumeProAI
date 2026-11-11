-- ResumePro AI - Supabase PostgreSQL Schema & RLS Policies
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table synced with auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  role text not null default 'user' check (role in ('user', 'admin')),
  remove_branding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Resumes table
create table if not exists public.resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'Untitled Resume',
  template_id text not null default 'modern-cobalt',
  data jsonb not null,
  section_order text[] not null default array[
    'summary','experience','education','skills','projects','certifications','achievements','languages','references'
  ],
  ats_score integer default 0,
  is_public boolean not null default false,
  share_slug text unique,
  version integer not null default 1,
  views_count integer not null default 0,
  downloads_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Resume Version History
create table if not exists public.resume_versions (
  id uuid default uuid_generate_v4() primary key,
  resume_id uuid references public.resumes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  version_number integer not null,
  label text,
  data jsonb not null,
  ats_score integer default 0,
  created_at timestamptz not null default now()
);

-- ATS Analysis History
create table if not exists public.ats_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  resume_title text not null,
  overall_score integer not null,
  readability_score integer not null,
  completeness_score integer not null,
  keyword_score integer not null,
  report jsonb not null,
  created_at timestamptz not null default now()
);

-- Job Match Reports
create table if not exists public.job_matches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  job_title text not null,
  company text,
  job_description text not null,
  match_percentage integer not null,
  matched_keywords text[] not null default '{}',
  missing_keywords text[] not null default '{}',
  suggestions text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Templates catalog (for Admin management)
create table if not exists public.templates (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  accent_color text not null,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('free', 'pro', 'premium')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  amount_cents integer not null default 0,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.ats_reports enable row level security;
alter table public.job_matches enable row level security;
alter table public.templates enable row level security;
alter table public.subscriptions enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can CRUD own resumes" on public.resumes
  for all using (auth.uid() = user_id);

create policy "Public resumes are readable via share link" on public.resumes
  for select using (is_public = true);

create policy "Users can CRUD own resume versions" on public.resume_versions
  for all using (auth.uid() = user_id);

create policy "Users can CRUD own ATS reports" on public.ats_reports
  for all using (auth.uid() = user_id);

create policy "Users can CRUD own job matches" on public.job_matches
  for all using (auth.uid() = user_id);

create policy "Templates are readable by all" on public.templates
  for select using (true);

create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Compliance: DPDP Act (India) 2023 & GDPR Data Export / Deletion Requests
create table if not exists public.data_privacy_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text not null,
  request_type text not null check (request_type in ('deletion', 'export', 'correction')),
  regulation text not null check (regulation in ('DPDP_2023', 'GDPR')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Compliance: Consent Audit Log (DPDP Sec. 6 & GDPR Art. 7)
create table if not exists public.consent_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  necessary_cookies boolean not null default true,
  analytics_cookies boolean not null default false,
  preference_cookies boolean not null default false,
  policy_version text not null default '2026-11-11',
  consented_at timestamptz not null default now()
);

alter table public.data_privacy_requests enable row level security;
alter table public.consent_logs enable row level security;

create policy "Users can view and create own privacy requests" on public.data_privacy_requests
  for all using (auth.uid() = user_id or user_id is null);

create policy "Users can manage own consent logs" on public.consent_logs
  for all using (auth.uid() = user_id);

-- ==============================================================================
-- BJTU Mongol Holboo - "Эрдэнэсийн эрэл" Scavenger Hunt Database Schema
-- Location: Haidian Park (海淀公园), Beijing
-- ==============================================================================

-- Enable UUID extension if not enabled
create extension if not exists "pgcrypto";

-- 1. TEAMS TABLE
create table if not exists public.teams (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    pin_code text not null,
    current_step int not null default 0,
    status text not null default 'photo_pending' check (status in ('photo_pending', 'in_progress', 'finished')),
    initial_photo_url text,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz not null default now()
);

-- 2. CHECKPOINTS TABLE
create table if not exists public.checkpoints (
    id serial primary key,
    step_number int not null unique,
    title text not null,
    hint_image_url text,
    lat float8 not null,
    lng float8 not null,
    qr_token text not null unique,
    question text not null,
    options jsonb, -- e.g. ["Option A", "Option B", "Option C", "Option D"]
    correct_answer text not null,
    created_at timestamptz not null default now()
);

-- 3. SUBMISSIONS TABLE
create table if not exists public.submissions (
    id serial primary key,
    team_id uuid not null references public.teams(id) on delete cascade,
    checkpoint_id int not null references public.checkpoints(id) on delete cascade,
    completed_at timestamptz not null default now(),
    constraint team_checkpoint_unique unique (team_id, checkpoint_id)
);

-- Realtime replication configuration
-- Ensure replica identity is full so update events contain complete record
alter table public.teams replica identity full;
alter table public.checkpoints replica identity full;
alter table public.submissions replica identity full;

-- Add tables to supabase_realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'checkpoints'
  ) then
    alter publication supabase_realtime add table public.checkpoints;
  end if;
end $$;

-- Row Level Security (RLS)
alter table public.teams enable row level security;
alter table public.checkpoints enable row level security;
alter table public.submissions enable row level security;

-- Browser clients must not access game state or secret checkpoint tokens
-- directly. All reads/writes go through the server API, which uses the
-- service-role key. The service role bypasses RLS without public policies.
drop policy if exists "Allow public read teams" on public.teams;
drop policy if exists "Allow public insert teams" on public.teams;
drop policy if exists "Allow public update teams" on public.teams;
drop policy if exists "Allow public delete teams" on public.teams;
drop policy if exists "Allow public read checkpoints" on public.checkpoints;
drop policy if exists "Allow public insert checkpoints" on public.checkpoints;
drop policy if exists "Allow public update checkpoints" on public.checkpoints;
drop policy if exists "Allow public read submissions" on public.submissions;
drop policy if exists "Allow public insert submissions" on public.submissions;
drop policy if exists "Allow public delete submissions" on public.submissions;

-- 4. STORAGE BUCKET CONFIGURATION FOR TEAM PHOTOS
insert into storage.buckets (id, name, public)
values ('TEAM-PHOTO', 'TEAM-PHOTO', true)
on conflict (id) do nothing;

drop policy if exists "Allow public uploads to TEAM-PHOTO" on storage.objects;

drop policy if exists "Allow public read of TEAM-PHOTO" on storage.objects;
create policy "Allow public read of TEAM-PHOTO"
on storage.objects for select
using (bucket_id = 'TEAM-PHOTO');

drop policy if exists "Allow public update of TEAM-PHOTO" on storage.objects;

-- 5. SEED DATA FOR HAIDIAN PARK (海淀公园) CHECKPOINTS
-- Clear old seed data if re-running
truncate table public.submissions cascade;
truncate table public.checkpoints restart identity cascade;

insert into public.checkpoints (step_number, title, hint_image_url, lat, lng, qr_token, question, options, correct_answer)
values 
(
    1,
    'Сургуулийн уриа (North Gate Plaza)',
    'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80',
    39.9922,
    116.2942,
    encode(gen_random_bytes(18), 'hex'),
    '学校的校训是什么？',
    '["A. 自强不息，厚德载物", "B. 知行", "C. 实事求是", "D. 博学而笃志"]'::jsonb,
    'B. 知行'
),
(
    2,
    'Физикийн хууль (Central Lawn)',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    39.9885,
    116.2940,
    encode(gen_random_bytes(18), 'hex'),
    'Ньютоны 2-р хуулийн үндсэн томьёо аль нь вэ?',
    '["A. F = m · a", "B. E = m · c²", "C. p = m · v", "D. F = -k · x"]'::jsonb,
    'A. F = m · a'
),
(
    3,
    'Сургуулийн түүх (Jingxi Rice Field)',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    39.9868,
    116.2925,
    encode(gen_random_bytes(18), 'hex'),
    'Бээжингийн Тээврийн Их Сургууль (BJTU) анх хэдэн онд байгуулагдсан бэ?',
    '["A. 1896", "B. 1909", "C. 1921", "D. 1949"]'::jsonb,
    'A. 1896'
),
(
    4,
    'Эртний ханзны оньсого (AI Smart Pavilion)',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    39.9898,
    116.2965,
    encode(gen_random_bytes(18), 'hex'),
    'Дараах эртний ганц ханз ямар утгатай вэ?【 囚 】',
    '["A. Шоронд хорих / Хоригдол", "B. Гэртээ амрах", "C. Мод тарих", "D. Хайрцаг онгойлгох"]'::jsonb,
    'A. Шоронд хорих / Хоригдол'
),
(
    5,
    'Олон улсын оюутны бүртгэл & Виз (South Lotus Pond)',
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    39.9855,
    116.2952,
    encode(gen_random_bytes(18), 'hex'),
    'Оюутны виз сунгах, сургуулийн албан ёсны бүртгэл хийлгэхэд олон улсын оюутнууд заавал очдог газар аль нь вэ?',
    '["A. 国际教育学院 (CIE)", "B. 体育馆", "C. 校医院", "D. 保卫处"]'::jsonb,
    'A. 国际教育学院 (CIE)'
);

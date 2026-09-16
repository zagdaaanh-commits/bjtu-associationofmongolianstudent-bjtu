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

-- Policies for public / anon access for game play & admin
drop policy if exists "Allow public read teams" on public.teams;
create policy "Allow public read teams" on public.teams for select using (true);

drop policy if exists "Allow public insert teams" on public.teams;
create policy "Allow public insert teams" on public.teams for insert with check (true);

drop policy if exists "Allow public update teams" on public.teams;
create policy "Allow public update teams" on public.teams for update using (true);

drop policy if exists "Allow public delete teams" on public.teams;
create policy "Allow public delete teams" on public.teams for delete using (true);

drop policy if exists "Allow public read checkpoints" on public.checkpoints;
create policy "Allow public read checkpoints" on public.checkpoints for select using (true);

drop policy if exists "Allow public insert checkpoints" on public.checkpoints;
create policy "Allow public insert checkpoints" on public.checkpoints for insert with check (true);

drop policy if exists "Allow public update checkpoints" on public.checkpoints;
create policy "Allow public update checkpoints" on public.checkpoints for update using (true);

drop policy if exists "Allow public read submissions" on public.submissions;
create policy "Allow public read submissions" on public.submissions for select using (true);

drop policy if exists "Allow public insert submissions" on public.submissions;
create policy "Allow public insert submissions" on public.submissions for insert with check (true);

drop policy if exists "Allow public delete submissions" on public.submissions;
create policy "Allow public delete submissions" on public.submissions for delete using (true);

-- 4. STORAGE BUCKET CONFIGURATION FOR TEAM PHOTOS
insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

drop policy if exists "Allow public uploads to team-photos" on storage.objects;
create policy "Allow public uploads to team-photos"
on storage.objects for insert
with check (bucket_id = 'team-photos');

drop policy if exists "Allow public read of team-photos" on storage.objects;
create policy "Allow public read of team-photos"
on storage.objects for select
using (bucket_id = 'team-photos');

drop policy if exists "Allow public update of team-photos" on storage.objects;
create policy "Allow public update of team-photos"
on storage.objects for update
using (bucket_id = 'team-photos');

-- 5. SEED DATA FOR HAIDIAN PARK (海淀公园) CHECKPOINTS
-- Clear old seed data if re-running
truncate table public.submissions cascade;
truncate table public.checkpoints restart identity cascade;

insert into public.checkpoints (step_number, title, hint_image_url, lat, lng, qr_token, question, options, correct_answer)
values 
(
    1,
    'Хойд хаалганы талбай (North Gate Plaza)',
    'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80',
    39.9922,
    116.2942,
    'hd_park_alpha_7x',
    'Бээжингийн Хайдян паркийн нийт газар нутгийн хэмжээ ойролцоогоор хэдэн га вэ?',
    '["34 га", "12 га", "68 га", "100 га"]'::jsonb,
    '34 га'
),
(
    2,
    'Төв ногоон зүлэг ба нээлттэй тайз (Central Lawn)',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    39.9885,
    116.2940,
    'hd_park_stage_c2',
    'Монгол Оюутны Холбооны энэхүү орьентаци арга хэмжээний гол уриа ямар үгтэй вэ?',
    '["Хамтдаа урагшаа", "Эв нэгдэл ба амжилт", "Нэг баг, Нэг гэр бүл", "Ирээдүйн эзэд"]'::jsonb,
    'Нэг баг, Нэг гэр бүл'
),
(
    3,
    'Уламжлалт цагаан будааны тариалангийн бүс (Jingxi Rice Field)',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    39.9868,
    116.2925,
    'hd_park_rice_j3',
    'Эрт үед Хайдянд Юйцюань уулын усаар ундаалан зөвхөн хааны ордонд нийлүүлдэг байсан алдартай будааг юу гэдэг байсан бэ?',
    '["Юйцюань улаан тариа", "Жинси хааны будаа (Jingxi Rice)", "Хар сарнай", "Манж цагаан"]'::jsonb,
    'Жинси хааны будаа (Jingxi Rice)'
),
(
    4,
    'Baidu Apollo AI ухаалаг асар (AI Smart Pavilion)',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    39.9898,
    116.2965,
    'hd_park_ai_p4',
    'Хайдян паркт анх туршигдсан дэлхийн анхны L4 түвшний жолоочгүй ухаалаг микро автобусыг юу гэж нэрлэдэг вэ?',
    '["Apollo", "Titan", "Panda AI", "CyberVoyage"]'::jsonb,
    'Apollo'
),
(
    5,
    'Өмнөд бадамлянхуа цөөрөм ба модон гүүр (South Lotus Pond)',
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    39.9855,
    116.2952,
    'hd_park_lotus_s5',
    'Эрдэнэсийн эрэлд багийн бүх гишүүд эв санаагаа нэгтгэн даалгавраа бүрэн биелүүлж чадсан уу?',
    '["Тийм ээ, баг хамтдаа ялсан!", "Мэдээж, бид шилдэг нь!", "Баяр хүргэе!"]'::jsonb,
    'Тийм ээ, баг хамтдаа ялсан!'
);

-- ============================================================
-- Devi Youth Sree Bala Ganesh Puja — Phase 2 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- BEFORE 02_policies.sql and 03_storage.sql.
-- ============================================================

-- ---------- profiles (extends auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'villager' check (role in ('admin', 'committee', 'villager')),
  created_at timestamptz not null default now()
);

-- ---------- festivals (one row per year) ----------
create table if not exists festivals (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  name_en text not null,
  name_te text not null,
  village_en text not null,
  village_te text not null,
  start_date date not null,
  end_date date not null,
  public_donation_total text, -- admin-approved display string, e.g. "₹8,50,000"
  is_active boolean not null default false, -- exactly one festival should be active at a time
  created_at timestamptz not null default now()
);

-- ---------- announcements ----------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  title_en text not null,
  title_te text not null,
  body_en text not null,
  body_te text not null,
  image_url text,
  important boolean not null default false,
  published_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

-- ---------- events ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  title_en text not null,
  title_te text not null,
  description_en text,
  description_te text,
  location_en text,
  location_te text,
  event_date date not null,
  event_time text,
  image_url text,
  sort_order int not null default 0
);

-- ---------- committee_members ----------
create table if not exists committee_members (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  name text not null,
  position_en text not null,
  position_te text not null,
  phone text,
  photo_url text,
  sort_order int not null default 0
);

-- ---------- laddu_auctions (one row per festival year) ----------
create table if not exists laddu_auctions (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  title_en text not null,
  title_te text not null,
  image_url text,
  starting_price text,
  final_price text,        -- null until the committee enters it after the offline auction
  winner_name text,
  winner_photo_url text,
  auction_date date,
  auction_time text,
  location_en text,
  location_te text,
  unique (festival_id)
);

-- ---------- lottery (one row per festival year) ----------
create table if not exists lottery (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  draw_date date,
  draw_time text,
  location_en text,
  location_te text,
  unique (festival_id)
);

create table if not exists lottery_prizes (
  id uuid primary key default gen_random_uuid(),
  lottery_id uuid not null references lottery(id) on delete cascade,
  name_en text not null,
  name_te text not null,
  value text,
  image_url text,
  sort_order int not null default 0
);

create table if not exists lottery_winners (
  id uuid primary key default gen_random_uuid(),
  lottery_id uuid not null references lottery(id) on delete cascade,
  prize_id uuid references lottery_prizes(id) on delete set null,
  winner_name text not null,
  winner_photo_url text,
  created_at timestamptz not null default now()
);

-- ---------- photo_albums / photos ----------
create table if not exists photo_albums (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  name_en text not null,
  cover_photo_url text,
  sort_order int not null default 0
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references photo_albums(id) on delete cascade,
  storage_path text not null, -- path within the `gallery` storage bucket
  caption text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- contacts (not year-scoped) ----------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_en text not null,
  role_te text not null,
  phone text not null,
  sort_order int not null default 0
);

-- ---------- donations (PRIVATE — admin/committee only, see 02_policies.sql) ----------
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  donor_name text not null,
  amount numeric(12,2) not null,
  donation_date date not null default current_date,
  payment_method text,
  collector text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- expenses (PRIVATE — admin/committee only, see 02_policies.sql) ----------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  name text not null,
  category text not null check (category in (
    'Decoration','Lighting','Sound','Food','Idol','Transport','Prasadam','Programs','Other'
  )),
  amount numeric(12,2) not null,
  expense_date date not null default current_date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_announcements_festival on announcements(festival_id, published_at desc);
create index if not exists idx_events_festival on events(festival_id, event_date);
create index if not exists idx_committee_festival on committee_members(festival_id, sort_order);
create index if not exists idx_albums_festival on photo_albums(festival_id, sort_order);
create index if not exists idx_photos_album on photos(album_id);
create index if not exists idx_donations_festival on donations(festival_id, donation_date desc);
create index if not exists idx_expenses_festival on expenses(festival_id, expense_date desc);

-- ---------- role helper functions (used by RLS policies) ----------
create or replace function is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_committee_or_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'committee')
  );
$$;

-- Auto-create a profile row (default role: villager) whenever a new
-- auth user signs up. Promote to committee/admin manually afterwards.
create or replace function handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'villager');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

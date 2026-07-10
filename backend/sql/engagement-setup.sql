-- One-time setup for the Engagement module (bookmarks + reviews).
-- Run this once in the Supabase Dashboard → SQL Editor.
-- The "review-photos" public Storage bucket has already been created via script.

create table if not exists bookmark_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  folder_id uuid references bookmark_folders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, vendor_id)          -- one folder per vendor
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  author_name text,
  is_hidden boolean not null default false,
  hidden_reason text,                  -- 'profanity' | 'admin'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, vendor_id)          -- one review per user per vendor
);

create table if not exists review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  url text not null
);

create table if not exists review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_like boolean not null,
  unique (review_id, user_id)          -- one vote per user per review
);

-- ============================================================================
-- Migration: Initial Schema for 10x-cards
-- ============================================================================
-- Purpose: Creates the complete database schema for the 10x-cards flashcard
--          application, including all tables, types, indexes, RLS policies,
--          functions, and triggers.
--
-- Affected tables:
--   - profiles (user profile data, 1:1 with auth.users)
--   - flashcards (educational flashcards with spaced repetition data)
--   - generation_sessions (AI generation session tracking)
--   - learning_sessions (user learning session tracking)
--   - flashcard_reviews (flashcard review history)
--
-- Special notes:
--   - RLS is enabled on all tables for data isolation
--   - Cascade deletes ensure GDPR compliance
--   - Spaced repetition fields compatible with SM-2/FSRS algorithms
-- ============================================================================

-- ============================================================================
-- 1. ENUM Types
-- ============================================================================

-- Enum type for distinguishing flashcard origin (AI-generated vs manually created)
create type flashcard_source as enum ('ai', 'manual');

-- ============================================================================
-- 2. Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1. profiles
-- ----------------------------------------------------------------------------
-- Stores user profile data, linked 1:1 with auth.users (managed by Supabase Auth).
-- The id column serves as both PK and FK to auth.users.

create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    preferences jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable Row Level Security for profiles table
alter table profiles enable row level security;

-- ----------------------------------------------------------------------------
-- 2.2. generation_sessions
-- ----------------------------------------------------------------------------
-- Tracks AI flashcard generation sessions. Stores source text, LLM response,
-- model parameters, and acceptance statistics for analytics.
-- Must be created before flashcards due to FK reference.

create table generation_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    source_text text not null check (char_length(source_text) between 1000 and 10000),
    llm_response jsonb not null,
    model_name varchar(100) not null,
    model_params jsonb default '{}'::jsonb,
    generated_count integer not null default 0,
    accepted_count integer not null default 0,
    rejected_count integer not null default 0,
    created_at timestamptz not null default now()
);

-- Enable Row Level Security for generation_sessions table
alter table generation_sessions enable row level security;

-- ----------------------------------------------------------------------------
-- 2.3. flashcards
-- ----------------------------------------------------------------------------
-- Main table for educational flashcards. Contains card content (front/back),
-- source tracking, and all spaced repetition algorithm state.
-- Compatible with SM-2 and FSRS algorithms.

create table flashcards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    front text not null,
    back text not null,
    source flashcard_source not null default 'manual',
    generation_session_id uuid references generation_sessions(id) on delete set null,
    next_review_date date default current_date,
    interval integer not null default 0,
    ease_factor numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
    repetition_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable Row Level Security for flashcards table
alter table flashcards enable row level security;

-- ----------------------------------------------------------------------------
-- 2.4. learning_sessions
-- ----------------------------------------------------------------------------
-- Represents a user's learning/study session. Tracks session duration and
-- number of flashcards reviewed.

create table learning_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    started_at timestamptz not null default now(),
    ended_at timestamptz null,
    flashcards_reviewed integer not null default 0
);

-- Enable Row Level Security for learning_sessions table
alter table learning_sessions enable row level security;

-- ----------------------------------------------------------------------------
-- 2.5. flashcard_reviews
-- ----------------------------------------------------------------------------
-- Logs each flashcard interaction during learning sessions.
-- Stores rating (1-4 for FSRS: again/hard/good/easy) and interval changes
-- for analytics and algorithm verification.

create table flashcard_reviews (
    id uuid primary key default gen_random_uuid(),
    flashcard_id uuid not null references flashcards(id) on delete cascade,
    learning_session_id uuid not null references learning_sessions(id) on delete cascade,
    reviewed_at timestamptz not null default now(),
    rating smallint not null check (rating between 1 and 4),
    previous_interval integer not null,
    new_interval integer not null
);

-- Enable Row Level Security for flashcard_reviews table
alter table flashcard_reviews enable row level security;

-- ============================================================================
-- 3. Indexes
-- ============================================================================
-- Strategic indexes for common query patterns to optimize performance.

-- Index for fetching user's flashcards
create index idx_flashcards_user_id on flashcards(user_id);

-- Index for finding flashcards due for review
create index idx_flashcards_next_review_date on flashcards(next_review_date);

-- Composite index for fetching user's flashcards due for review
-- Optimizes the most common query: "get this user's cards to study today"
create index idx_flashcards_user_next_review on flashcards(user_id, next_review_date);

-- Index for fetching user's generation sessions
create index idx_generation_sessions_user_id on generation_sessions(user_id);

-- Index for fetching user's learning sessions
create index idx_learning_sessions_user_id on learning_sessions(user_id);

-- Index for fetching review history of a specific flashcard
create index idx_flashcard_reviews_flashcard_id on flashcard_reviews(flashcard_id);

-- Index for fetching all reviews within a learning session
create index idx_flashcard_reviews_learning_session_id on flashcard_reviews(learning_session_id);

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1. Policies for profiles table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view only their own profile
-- Rationale: User profile data is private and should only be visible to the owner
create policy "Users can view own profile"
    on profiles for select
    to authenticated
    using (id = auth.uid());

-- Policy: Authenticated users can update only their own profile
-- Rationale: Users should only be able to modify their own preferences
create policy "Users can update own profile"
    on profiles for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

-- Policy: Service role can insert profiles (used by trigger on auth.users)
-- Rationale: Profiles are created automatically via trigger when user registers
create policy "Service role can insert profiles"
    on profiles for insert
    to service_role
    with check (true);

-- ----------------------------------------------------------------------------
-- 4.2. Policies for flashcards table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view only their own flashcards
-- Rationale: Flashcard content is private study material
create policy "Users can view own flashcards"
    on flashcards for select
    to authenticated
    using (user_id = auth.uid());

-- Policy: Authenticated users can insert flashcards only for themselves
-- Rationale: Users create flashcards for their own study sets
create policy "Users can insert own flashcards"
    on flashcards for insert
    to authenticated
    with check (user_id = auth.uid());

-- Policy: Authenticated users can update only their own flashcards
-- Rationale: Users can edit their flashcard content and study progress
create policy "Users can update own flashcards"
    on flashcards for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Policy: Authenticated users can delete only their own flashcards
-- Rationale: Users can remove unwanted flashcards from their collection
create policy "Users can delete own flashcards"
    on flashcards for delete
    to authenticated
    using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4.3. Policies for generation_sessions table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view only their own generation sessions
-- Rationale: AI generation history is private and contains source text
create policy "Users can view own generation sessions"
    on generation_sessions for select
    to authenticated
    using (user_id = auth.uid());

-- Policy: Authenticated users can insert generation sessions only for themselves
-- Rationale: Generation sessions are created when user requests AI flashcard generation
create policy "Users can insert own generation sessions"
    on generation_sessions for insert
    to authenticated
    with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4.4. Policies for learning_sessions table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view only their own learning sessions
-- Rationale: Learning history is private study data
create policy "Users can view own learning sessions"
    on learning_sessions for select
    to authenticated
    using (user_id = auth.uid());

-- Policy: Authenticated users can insert learning sessions only for themselves
-- Rationale: Learning sessions are created when user starts studying
create policy "Users can insert own learning sessions"
    on learning_sessions for insert
    to authenticated
    with check (user_id = auth.uid());

-- Policy: Authenticated users can update only their own learning sessions
-- Rationale: Users update session when ending study (setting ended_at, flashcards_reviewed)
create policy "Users can update own learning sessions"
    on learning_sessions for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4.5. Policies for flashcard_reviews table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view reviews only for their own flashcards
-- Rationale: Review history is tied to private flashcard data
create policy "Users can view own flashcard reviews"
    on flashcard_reviews for select
    to authenticated
    using (
        exists (
            select 1 from flashcards
            where flashcards.id = flashcard_reviews.flashcard_id
            and flashcards.user_id = auth.uid()
        )
    );

-- Policy: Authenticated users can insert reviews only for their own flashcards
-- Rationale: Users can only record reviews for their own study material
create policy "Users can insert own flashcard reviews"
    on flashcard_reviews for insert
    to authenticated
    with check (
        exists (
            select 1 from flashcards
            where flashcards.id = flashcard_reviews.flashcard_id
            and flashcards.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 5. Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1. update_updated_at_column()
-- ----------------------------------------------------------------------------
-- Generic trigger function to automatically update the updated_at column
-- to the current timestamp whenever a row is modified.

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 5.2. handle_new_user()
-- ----------------------------------------------------------------------------
-- Trigger function that automatically creates a profile record when a new
-- user registers through Supabase Auth. Uses SECURITY DEFINER to execute
-- with elevated privileges (bypasses RLS).

create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Trigger: Automatically update updated_at on profiles table modification
create trigger update_profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at_column();

-- Trigger: Automatically update updated_at on flashcards table modification
create trigger update_flashcards_updated_at
    before update on flashcards
    for each row
    execute function update_updated_at_column();

-- Trigger: Automatically create profile when new user registers
-- This trigger fires after a new row is inserted into auth.users
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();

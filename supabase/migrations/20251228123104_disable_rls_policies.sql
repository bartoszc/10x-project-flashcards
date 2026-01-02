-- ============================================================================
-- Migration: Disable RLS Policies
-- ============================================================================
-- Purpose: Drops all RLS policies created in the initial schema migration.
--          RLS remains enabled on tables, but no policies restrict access.
--
-- WARNING: This is a destructive migration that removes security policies.
--          After this migration, authenticated users will have NO access to
--          data (RLS enabled but no permissive policies = deny all).
--
-- Affected tables:
--   - profiles
--   - flashcards
--   - generation_sessions
--   - learning_sessions
--   - flashcard_reviews
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop policies for profiles table
-- ----------------------------------------------------------------------------

-- WARNING: Dropping policy that allows users to view their own profile
drop policy if exists "Users can view own profile" on profiles;

-- WARNING: Dropping policy that allows users to update their own profile
drop policy if exists "Users can update own profile" on profiles;

-- WARNING: Dropping policy that allows service role to insert profiles
drop policy if exists "Service role can insert profiles" on profiles;

-- ----------------------------------------------------------------------------
-- Drop policies for flashcards table
-- ----------------------------------------------------------------------------

-- WARNING: Dropping policy that allows users to view their own flashcards
drop policy if exists "Users can view own flashcards" on flashcards;

-- WARNING: Dropping policy that allows users to insert their own flashcards
drop policy if exists "Users can insert own flashcards" on flashcards;

-- WARNING: Dropping policy that allows users to update their own flashcards
drop policy if exists "Users can update own flashcards" on flashcards;

-- WARNING: Dropping policy that allows users to delete their own flashcards
drop policy if exists "Users can delete own flashcards" on flashcards;

-- ----------------------------------------------------------------------------
-- Drop policies for generation_sessions table
-- ----------------------------------------------------------------------------

-- WARNING: Dropping policy that allows users to view their own generation sessions
drop policy if exists "Users can view own generation sessions" on generation_sessions;

-- WARNING: Dropping policy that allows users to insert their own generation sessions
drop policy if exists "Users can insert own generation sessions" on generation_sessions;

-- ----------------------------------------------------------------------------
-- Drop policies for learning_sessions table
-- ----------------------------------------------------------------------------

-- WARNING: Dropping policy that allows users to view their own learning sessions
drop policy if exists "Users can view own learning sessions" on learning_sessions;

-- WARNING: Dropping policy that allows users to insert their own learning sessions
drop policy if exists "Users can insert own learning sessions" on learning_sessions;

-- WARNING: Dropping policy that allows users to update their own learning sessions
drop policy if exists "Users can update own learning sessions" on learning_sessions;

-- ----------------------------------------------------------------------------
-- Drop policies for flashcard_reviews table
-- ----------------------------------------------------------------------------

-- WARNING: Dropping policy that allows users to view their own flashcard reviews
drop policy if exists "Users can view own flashcard reviews" on flashcard_reviews;

-- WARNING: Dropping policy that allows users to insert their own flashcard reviews
drop policy if exists "Users can insert own flashcard reviews" on flashcard_reviews;

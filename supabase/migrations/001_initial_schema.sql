-- ============================================================
-- PKE — Personalized Kinematic Evaluator
-- Supabase PostgreSQL Schema + pgvector Setup
-- ============================================================
-- Run this in the Supabase SQL Editor after creating your project.
-- ============================================================

-- ─── Enable pgvector extension ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── User Profiles ─────────────────────────────────────────
-- Supabase Auth handles authentication. This table stores
-- PKE-specific user metadata linked to auth.users.
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- ─── Exercises ─────────────────────────────────────────────
-- Catalog of supported exercises (squat, deadlift, bicep curl, etc.)
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    joint_count INT NOT NULL DEFAULT 33,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some initial exercises
INSERT INTO exercises (name, description) VALUES
    ('squat', 'Barbell or bodyweight squat'),
    ('deadlift', 'Conventional or sumo deadlift'),
    ('barbell_biceps_curl', 'Standing barbell biceps curl'),
    ('overhead_press', 'Standing overhead/military press'),
    ('lunge', 'Forward or reverse lunge'),
    ('push_up', 'Standard push-up'),
    ('plank', 'Static plank hold')
ON CONFLICT (name) DO NOTHING;

-- ─── Calibration Sessions ──────────────────────────────────
-- Groups 3-5 calibration sequences for a user+exercise pair.
CREATE TABLE IF NOT EXISTS calibration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calibration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calibration sessions"
    ON calibration_sessions FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_calibration_sessions_user
    ON calibration_sessions(user_id, exercise_id);

-- ─── Calibration Sequences ─────────────────────────────────
-- Individual recordings within a calibration session.
-- Each gets an embedding from the ST-GCN after processing.
CREATE TABLE IF NOT EXISTS calibration_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES calibration_sessions(id) ON DELETE CASCADE,
    storage_path TEXT,                    -- Supabase Storage path (MVP video upload)
    landmarks_json JSONB,                -- Raw MediaPipe landmarks
    embedding vector(256),               -- ST-GCN output embedding
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calibration_seq_session
    ON calibration_sequences(session_id);

-- HNSW index for fast cosine similarity on calibration embeddings
CREATE INDEX idx_calibration_seq_embedding
    ON calibration_sequences
    USING hnsw (embedding vector_cosine_ops);

-- ─── Calibration Centroids ─────────────────────────────────
-- One centroid per user+exercise pair. This is the "personal baseline"
-- that daily workouts are compared against.
CREATE TABLE IF NOT EXISTS calibration_centroids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    centroid vector(256) NOT NULL,       -- Mean of calibration embeddings
    threshold FLOAT NOT NULL DEFAULT 0.15,  -- Acceptable deviation radius
    model_version TEXT DEFAULT 'v0.1',   -- Track which model generated this
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

ALTER TABLE calibration_centroids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own centroids"
    ON calibration_centroids FOR SELECT
    USING (auth.uid() = user_id);

-- HNSW index on centroids
CREATE INDEX idx_centroid_embedding
    ON calibration_centroids
    USING hnsw (centroid vector_cosine_ops);

-- ─── Evaluations ───────────────────────────────────────────
-- Results of evaluating a workout rep against the user's baseline.
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    embedding vector(256),               -- The rep's embedding
    distance_to_centroid FLOAT NOT NULL,
    passed BOOLEAN NOT NULL,
    joint_errors JSONB,                  -- {joint_idx: error_score, ...}
    dtw_details JSONB,                   -- Full DTW analysis if triggered
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations"
    ON evaluations FOR SELECT
    USING (auth.uid() = user_id);

CREATE INDEX idx_evaluations_user_exercise
    ON evaluations(user_id, exercise_id, created_at DESC);

-- ─── Vector Similarity Search Function ─────────────────────
-- Used by the DTW fallback to find the closest calibration rep.
CREATE OR REPLACE FUNCTION match_calibration_sequence(
    query_embedding vector(256),
    target_user_id UUID,
    target_exercise_id UUID,
    match_count INT DEFAULT 1
)
RETURNS TABLE (
    id UUID,
    session_id UUID,
    landmarks_json JSONB,
    similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        cs.id,
        cs.session_id,
        cs.landmarks_json,
        1 - (cs.embedding <=> query_embedding) AS similarity
    FROM calibration_sequences cs
    JOIN calibration_sessions sess ON cs.session_id = sess.id
    WHERE sess.user_id = target_user_id
      AND sess.exercise_id = target_exercise_id
      AND cs.embedding IS NOT NULL
    ORDER BY cs.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ─── Storage Bucket ────────────────────────────────────────
-- Create the 'videos' bucket for MVP video uploads.
-- NOTE: Run this via the Supabase Dashboard > Storage, or via:
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('videos', 'videos', false);
-- The bucket should be private (requires auth to upload/download).

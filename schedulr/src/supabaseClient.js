// src/supabaseClient.js
// Run: npm install @supabase/supabase-js
// Set these in your .env file:
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key

import { createClient } from "@supabase/supabase-js";


const supabaseUrl = 'https://wetvluzappogsaxencqh.supabase.co'
const supabaseAnonKey = 'sb_publishable_vk42iwUzfjYZxZ0vKMMCpQ_fHp5lr2C';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// ============================================================
// SUPABASE SQL — run this in your Supabase SQL editor
// ============================================================
//
// CREATE TABLE events (
//   id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   name         text NOT NULL,
//   start_date   date NOT NULL,
//   day_count    smallint NOT NULL,
//   selected_dates jsonb NOT NULL,
//   created_at   timestamptz DEFAULT now()
// );
//
// CREATE TABLE participants (
//   id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
//   name         text NOT NULL,
//   availability jsonb NOT NULL,
//   submitted_at timestamptz DEFAULT now()
// );
//
// -- Row Level Security (basic open read, authenticated or anon write)
// ALTER TABLE events ENABLE ROW LEVEL SECURITY;
// ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Public read events"  ON events      FOR SELECT USING (true);
// CREATE POLICY "Public insert events" ON events     FOR INSERT WITH CHECK (true);
// CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
// CREATE POLICY "Public insert participants" ON participants FOR INSERT WITH CHECK (true);

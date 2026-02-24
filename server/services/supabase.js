import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ FATAL: Supabase credentials are required but not configured.');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
  console.error('   Run the schema.sql in your Supabase SQL Editor to create the required tables.');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const isSupabaseConfigured = () => true;

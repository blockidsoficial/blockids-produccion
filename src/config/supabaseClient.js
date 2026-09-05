// src/config/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY. Configúralas en .env.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


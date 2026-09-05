import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;

// La service role key debe venir solo del entorno local o del runtime seguro.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. No deben estar embebidas en el frontend.');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

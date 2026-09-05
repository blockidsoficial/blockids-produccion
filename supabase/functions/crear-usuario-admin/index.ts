// @ts-nocheck — este archivo corre en Deno (Supabase Edge), no en Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'No autorizado: falta header Authorization.' }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return json({ error: 'No autorizado: sesión inválida.' }, 401);
    }

    const { data: perfil, error: perfilError } = await supabaseUser
      .from('perfiles')
      .select('rol, escuela_id')
      .eq('id', user.id)
      .single();

    if (perfilError || !['superadmin', 'admin_escuela'].includes(perfil?.rol)) {
      return json({ error: 'Prohibido: no tienes permisos para crear usuarios.' }, 403);
    }

    const esSuperAdmin = perfil.rol === 'superadmin';

    const { username, password, rol, escuela_id, notas_admin } = await req.json();

    if (!username || !password || !rol || !escuela_id) {
      return json({ error: 'Faltan campos: username, password, rol, escuela_id.' }, 400);
    }
    if (password.length < 6) {
      return json({ error: 'La contraseña debe tener mínimo 6 caracteres.' }, 400);
    }
    const rolesValidos = ['superadmin', 'admin_escuela', 'profesor', 'alumno'];
    if (!rolesValidos.includes(rol)) {
      return json({ error: `Rol inválido: ${rol}` }, 400);
    }

    // admin_escuela: solo puede crear profesor/alumno en su propia escuela
    if (!esSuperAdmin) {
      if (!['profesor', 'alumno'].includes(rol)) {
        return json({ error: 'Admin de escuela solo puede crear profesores o alumnos.' }, 403);
      }
      if (escuela_id !== perfil.escuela_id) {
        return json({ error: 'No puedes crear usuarios en otra escuela.' }, 403);
      }
    }

    const usernameNorm = username.trim().toLowerCase().replace(/\s+/g, '-');
    const emailFantasia = `${usernameNorm}@blockids.com`;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:         emailFantasia,
      password:      password,
      email_confirm: true,
      user_metadata: { username: usernameNorm, rol, escuela_id },
    });

    if (createError) {
      const msg = createError.message.toLowerCase().includes('already')
        ? `El usuario "@${usernameNorm}" ya existe.`
        : createError.message;
      return json({ error: msg }, 400);
    }

    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .upsert({
        id:          data.user.id,
        username:    usernameNorm,
        rol,
        escuela_id,
        notas_admin: notas_admin?.trim() ||
          `Alta por Superadmin — ${new Date().toLocaleDateString('es-MX')}`,
      }, { onConflict: 'id' });

    if (profileError) {
      return json({
        error: `Usuario Auth creado, pero error en perfil: ${profileError.message}`,
      }, 500);
    }

    return json({ userId: data.user.id, username: usernameNorm });

  } catch (err) {
    return json({ error: `Error interno: ${err.message}` }, 500);
  }
});

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

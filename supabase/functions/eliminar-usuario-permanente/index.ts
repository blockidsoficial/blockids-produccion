// @ts-nocheck — este archivo corre en Deno (Supabase Edge), no en Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Borrado PERMANENTE de un usuario — solo superadmin ──────────────────────
// A diferencia de "desactivar" (perfiles.activo = false, reversible), esto
// borra el auth.users de verdad. Todas las FK de perfiles.id tienen
// ON DELETE CASCADE (verificado 2026-09-15), así que un solo deleteUser()
// se lleva en cascada: proyectos, entregas_proyectos, aula_alumnos,
// usuario_logros, mensajes_muro/chat, comentarios — y si es profesor,
// TAMBIÉN sus aulas completas (y con ellas las tareas/entregas de esas
// aulas). Es intencionalmente difícil de disparar por accidente: exige
// escribir el username exacto como confirmación, además del que ya pide
// el frontend.
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

    const { data: solicitante, error: solicitanteError } = await supabaseUser
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (solicitanteError || solicitante?.rol !== 'superadmin') {
      return json({ error: 'Prohibido: solo un superadmin puede eliminar cuentas de forma permanente.' }, 403);
    }

    const { usuario_id, username_confirmacion } = await req.json();
    if (!usuario_id || !username_confirmacion) {
      return json({ error: 'Faltan campos: usuario_id, username_confirmacion.' }, 400);
    }

    if (usuario_id === user.id) {
      return json({ error: 'No puedes eliminar tu propia cuenta.' }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: objetivo, error: objetivoError } = await supabaseAdmin
      .from('perfiles')
      .select('id, username, rol')
      .eq('id', usuario_id)
      .single();

    if (objetivoError || !objetivo) {
      return json({ error: 'El usuario no existe.' }, 404);
    }

    // Confirmación exacta (sensible a mayúsculas) — la última barrera antes
    // de un borrado irreversible.
    if (username_confirmacion !== objetivo.username) {
      return json({ error: 'La confirmación no coincide con el username del usuario.' }, 400);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(usuario_id);
    if (deleteError) {
      return json({ error: `No se pudo eliminar la cuenta: ${deleteError.message}` }, 400);
    }

    // Auditoría — best-effort: si la tabla no existe, no rompe el borrado.
    try {
      await supabaseAdmin.from('eliminaciones_log').insert({
        usuario_id: objetivo.id,
        username: objetivo.username,
        rol: objetivo.rol,
        eliminado_por: user.id,
      });
    } catch (_) { /* noop */ }

    return json({ ok: true, username: objetivo.username });

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

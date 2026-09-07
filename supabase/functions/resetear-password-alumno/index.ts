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

    // Cliente con el JWT del solicitante — para identificar quién llama.
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
      .select('rol, escuela_id')
      .eq('id', user.id)
      .single();

    if (solicitanteError || !['superadmin', 'admin_escuela', 'profesor'].includes(solicitante?.rol)) {
      return json({ error: 'Prohibido: no tienes permisos para restablecer contraseñas.' }, 403);
    }

    const { alumno_id, nueva_password } = await req.json();
    if (!alumno_id || !nueva_password) {
      return json({ error: 'Faltan campos: alumno_id, nueva_password.' }, 400);
    }
    if (String(nueva_password).length < 6) {
      return json({ error: 'La contraseña debe tener mínimo 6 caracteres.' }, 400);
    }

    // Cliente con service role — para las operaciones privilegiadas (bypassa RLS).
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: alumno, error: alumnoError } = await supabaseAdmin
      .from('perfiles')
      .select('id, rol, escuela_id, username')
      .eq('id', alumno_id)
      .single();

    if (alumnoError || !alumno) {
      return json({ error: 'El alumno no existe.' }, 404);
    }
    if (alumno.rol !== 'alumno') {
      return json({ error: 'Solo se puede restablecer la contraseña de alumnos.' }, 403);
    }

    // ── Reglas de alcance según el rol del solicitante ──────────────────────
    if (solicitante.rol === 'admin_escuela') {
      if (alumno.escuela_id !== solicitante.escuela_id) {
        return json({ error: 'Este alumno no pertenece a tu escuela.' }, 403);
      }
    } else if (solicitante.rol === 'profesor') {
      // El alumno debe estar inscrito en alguna de las aulas del profesor.
      const { data: aulasProf, error: aulasError } = await supabaseAdmin
        .from('aulas')
        .select('id')
        .eq('profesor_id', user.id);

      if (aulasError) {
        return json({ error: `Error verificando aulas: ${aulasError.message}` }, 500);
      }

      const aulaIds = (aulasProf || []).map((a) => a.id);
      if (aulaIds.length === 0) {
        return json({ error: 'Este alumno no está en ninguna de tus aulas.' }, 403);
      }

      const { data: rel, error: relError } = await supabaseAdmin
        .from('aula_alumnos')
        .select('aula_id')
        .eq('alumno_id', alumno_id)
        .in('aula_id', aulaIds)
        .limit(1);

      if (relError) {
        return json({ error: `Error verificando aulas: ${relError.message}` }, 500);
      }
      if (!rel || rel.length === 0) {
        return json({ error: 'Este alumno no está en ninguna de tus aulas.' }, 403);
      }
    }
    // superadmin: sin restricción de alcance.

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(alumno_id, {
      password: String(nueva_password),
    });
    if (updateError) {
      return json({ error: `No se pudo actualizar la contraseña: ${updateError.message}` }, 400);
    }

    // Auditoría — best-effort: si la tabla no existe, no rompe el reseteo.
    try {
      await supabaseAdmin.from('password_resets_log').insert({
        alumno_id,
        reseteado_por: user.id,
        rol_solicitante: solicitante.rol,
      });
    } catch (_) { /* noop */ }

    return json({ ok: true, username: alumno.username });

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

// @ts-nocheck — este archivo corre en Deno (Supabase Edge), no en Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Reglas de username ──────────────────────────────────────────────────────
// Copia del mismo criterio que src/lib/username-rules.js. Deno no puede
// importar ese archivo (bundlers/módulos distintos), así que se duplica a
// propósito — este es el gate que de verdad importa, porque este endpoint
// es lo único que un cliente no puede saltarse (a diferencia de la
// validación en VistaUsuarios.jsx, que es solo para dar feedback rápido en
// el formulario). Si cambias algo aquí, replica el cambio allá también.
const RE_USERNAME = /^[a-z0-9._-]{3,20}$/;

const PALABRAS_RESERVADAS_BASE = [
  'admin', 'administrador', 'administrador-plataforma', 'administrator',
  'superadmin', 'super-admin', 'soporte', 'support', 'ayuda', 'help',
  'root', 'sistema', 'system', 'moderador', 'moderator', 'staff',
  'blockids', 'null', 'undefined',
];

// Solo se bloquean cuando el username es para un ALUMNO (ver detalle en
// src/lib/username-rules.js): un profesor/admin_escuela real sí puede usar
// estas palabras para su propio usuario.
const PALABRAS_STAFF = [
  'profesor', 'profe', 'maestro', 'maestra', 'teacher', 'director',
  'directora', 'evaluador',
];

const PALABRAS_PROHIBIDAS = [
  'puto', 'puta', 'putos', 'putas', 'pendejo', 'pendeja', 'idiota',
  'estupido', 'imbecil', 'cabron', 'cabrona', 'mierda', 'verga', 'chingar',
  'chingada', 'joto', 'maricon', 'perra', 'zorra', 'culero', 'culera',
  'fuck', 'shit', 'bitch', 'asshole', 'nigger', 'faggot',
];

const normalizarUsername = (raw) =>
  (raw || '').toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[-.]{2,}/g, (m) => m[0])
    .replace(/^[-.]+|[-.]+$/g, '');

const validarUsername = (usernameNorm, rol) => {
  if (!usernameNorm) return 'Escribe un nombre de usuario.';
  if (!RE_USERNAME.test(usernameNorm)) {
    return 'El usuario debe tener 3-20 caracteres: minúsculas, números, "." "_" o "-", sin espacios ni acentos.';
  }
  const plano = usernameNorm.replace(/[._-]/g, '');
  if (PALABRAS_RESERVADAS_BASE.some((p) => plano.includes(p.replace(/[._-]/g, '')))) {
    return 'Ese nombre de usuario está reservado. Elige otro.';
  }
  if (rol === 'alumno' && PALABRAS_STAFF.some((p) => plano.includes(p))) {
    return 'Ese nombre de usuario no está permitido para un alumno. Elige otro.';
  }
  if (PALABRAS_PROHIBIDAS.some((p) => plano.includes(p))) {
    return 'Ese nombre de usuario no está permitido. Elige otro.';
  }
  return null;
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

    if (perfilError || !['superadmin', 'admin_escuela', 'profesor'].includes(perfil?.rol)) {
      return json({ error: 'Prohibido: no tienes permisos para crear usuarios.' }, 403);
    }

    const rolSolicitante = perfil.rol;

    const {
      username, password, rol, escuela_id, notas_admin,
      nombre, apellido_paterno, apellido_materno,
    } = await req.json();

    if (!username || !password || !rol) {
      return json({ error: 'Faltan campos: username, password, rol.' }, 400);
    }
    // Trim SOLO en las puntas (accidente de copiar/pegar) — no se restringe
    // ningún carácter: se aceptan espacios intermedios, acentos y emojis.
    // Tope de 72 = límite real de bcrypt (lo que usa Supabase Auth por
    // debajo); no es arbitrario, todo lo que pase de eso se ignora al
    // hashear de cualquier forma.
    const passwordFinal = String(password).trim();
    if (passwordFinal.length < 6 || passwordFinal.length > 72) {
      return json({ error: 'La contraseña debe tener entre 6 y 72 caracteres.' }, 400);
    }
    const rolesValidos = ['superadmin', 'admin_escuela', 'profesor', 'alumno'];
    if (!rolesValidos.includes(rol)) {
      return json({ error: `Rol inválido: ${rol}` }, 400);
    }
    // Un superadmin no pertenece a ninguna escuela — solo el resto de los roles
    // (que sí viven dentro de una institución) exigen escuela_id.
    if (rol !== 'superadmin' && !escuela_id) {
      return json({ error: 'Falta escuela_id.' }, 400);
    }

    // Reglas de alcance según el rol del solicitante
    if (rolSolicitante === 'admin_escuela') {
      if (!['profesor', 'alumno'].includes(rol)) {
        return json({ error: 'Admin de escuela solo puede crear profesores o alumnos.' }, 403);
      }
      if (escuela_id !== perfil.escuela_id) {
        return json({ error: 'No puedes crear usuarios en otra escuela.' }, 403);
      }
    } else if (rolSolicitante === 'profesor') {
      if (rol !== 'alumno') {
        return json({ error: 'Un profesor solo puede crear alumnos.' }, 403);
      }
      if (escuela_id !== perfil.escuela_id) {
        return json({ error: 'Solo puedes crear alumnos en tu propia escuela.' }, 403);
      }
    } else if (rolSolicitante !== 'superadmin' && rol === 'superadmin') {
      // Defensa extra: solo un superadmin puede dar de alta a otro superadmin.
      return json({ error: 'Solo un superadmin puede crear otro superadmin.' }, 403);
    }

    const usernameNorm = normalizarUsername(username);
    const errorUsername = validarUsername(usernameNorm, rol);
    if (errorUsername) {
      return json({ error: errorUsername }, 400);
    }
    const emailFantasia = `${usernameNorm}@blockids.com`;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:         emailFantasia,
      password:      passwordFinal,
      email_confirm: true,
      user_metadata: { username: usernameNorm, rol, escuela_id: escuela_id || null },
    });

    if (createError) {
      const msg = createError.message.toLowerCase().includes('already')
        ? `El usuario "@${usernameNorm}" ya existe.`
        : createError.message;
      return json({ error: msg }, 400);
    }

    const perfilPayload = {
      id:          data.user.id,
      username:    usernameNorm,
      rol,
      escuela_id:  escuela_id || null,
      notas_admin: notas_admin?.trim() ||
        `Alta (${rolSolicitante}) — ${new Date().toLocaleDateString('es-MX')}`,
    };
    // Nombre / apellidos son opcionales; solo se escriben si vienen en el body.
    if (typeof nombre === 'string')           perfilPayload.nombre = nombre.trim() || null;
    if (typeof apellido_paterno === 'string') perfilPayload.apellido_paterno = apellido_paterno.trim() || null;
    if (typeof apellido_materno === 'string') perfilPayload.apellido_materno = apellido_materno.trim() || null;

    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .upsert(perfilPayload, { onConflict: 'id' });

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

// ============================================================
// BLOCKIDS — Reglas de nombre de usuario
// ============================================================
// Fuente única de verdad para el FRONTEND (Register.jsx, VistaUsuarios.jsx).
// El Edge Function `crear-usuario-admin` corre en Deno y no puede importar
// este archivo directamente, así que mantiene una copia equivalente — si
// cambias algo aquí, replica el cambio en:
//   supabase/functions/crear-usuario-admin/index.ts
//
// Pendiente (no cubierto por este archivo): el alta por auto-registro
// (Register.jsx) llama a supabase.auth.signUp() directo, y es el trigger
// `handle_new_user` en la base de datos el que finalmente inserta la fila en
// `perfiles`. Alguien que llame a signUp() sin pasar por este formulario se
// saltaría esta validación de cliente. Para cerrarlo de verdad hace falta un
// CHECK constraint / validación en ese trigger (ver nota al final del Edge
// Function y la memoria "perfiles-doble-candado").

// Solo minúsculas, dígitos, punto, guión bajo y guión. El guión se mantiene
// aunque la guía de estilo "de libro" solo pide "._" porque ya es el
// separador que usa toda la app (aSlug de Register.jsx, sufijo anti-colisión
// "-x7f", etc.) — quitar el guión ahora invalidaría usernames ya existentes.
export const RE_USERNAME = /^[a-z0-9._-]{3,20}$/;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

// Palabras que nadie debería poder usar como username, sin importar el rol:
// habilitan phishing/impersonación de soporte o de la marca (ej. alguien se
// registra como "soporte_tecnico" para pedir contraseñas a otros alumnos).
export const PALABRAS_RESERVADAS_BASE = [
    'admin', 'administrador', 'administrador-plataforma', 'administrator',
    'superadmin', 'super-admin', 'soporte', 'support', 'ayuda', 'help',
    'root', 'sistema', 'system', 'moderador', 'moderator', 'staff',
    'blockids', 'null', 'undefined',
];

// Palabras de "personal de escuela" — solo se bloquean cuando el username es
// para un ALUMNO (para que un alumno no se haga pasar por profesor/director
// frente a sus compañeros). Un profesor/admin_escuela real sí puede usarlas
// para su propio usuario (ej. "profe.ana"), porque quien da de alta esa
// cuenta ya es personal de confianza, no un desconocido.
export const PALABRAS_STAFF = [
    'profesor', 'profe', 'maestro', 'maestra', 'teacher', 'director',
    'directora', 'evaluador',
];

// Lista mínima de arranque para un entorno con niños. Se compara sin
// separadores ni acentos; ampliar aquí según haga falta (mantener en
// minúsculas, sin acentos, sin espacios).
export const PALABRAS_PROHIBIDAS = [
    'puto', 'puta', 'putos', 'putas', 'pendejo', 'pendeja', 'idiota',
    'estupido', 'imbecil', 'cabron', 'cabrona', 'mierda', 'verga', 'chingar',
    'chingada', 'joto', 'maricon', 'perra', 'zorra', 'culero', 'culera',
    'fuck', 'shit', 'bitch', 'asshole', 'nigger', 'faggot',
];

const quitarAcentos = (texto) =>
    texto.normalize('NFD').replace(/[̀-ͯ]/g, '');

// "José Pérez" -> "jose-perez" (mismo criterio que aSlug de Register.jsx,
// pero exportado aquí para reutilizarlo también desde VistaUsuarios.jsx).
export const normalizarUsername = (raw) =>
    quitarAcentos((raw || '').toString())
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9._\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[-.]{2,}/g, m => m[0])
        .replace(/^[-.]+|[-.]+$/g, '');

/**
 * Valida un username YA normalizado (pasar por normalizarUsername primero).
 * @param {string} usernameNorm
 * @param {{ rol?: string }} [opts] - rol del usuario que tendrá ese username;
 *        si es 'alumno' también se bloquean PALABRAS_STAFF.
 * @returns {string|null} mensaje de error, o null si es válido.
 */
export const validarUsername = (usernameNorm, opts = {}) => {
    if (!usernameNorm) return 'Escribe un nombre de usuario.';

    if (!RE_USERNAME.test(usernameNorm)) {
        return `El usuario debe tener ${USERNAME_MIN}-${USERNAME_MAX} caracteres: minúsculas, números, "." "_" o "-", sin espacios ni acentos.`;
    }

    const plano = usernameNorm.replace(/[._-]/g, '');

    if (PALABRAS_RESERVADAS_BASE.some(p => plano.includes(p.replace(/[._-]/g, '')))) {
        return 'Ese nombre de usuario está reservado. Elige otro.';
    }

    if (opts.rol === 'alumno' && PALABRAS_STAFF.some(p => plano.includes(p))) {
        return 'Ese nombre de usuario no está permitido para un alumno. Elige otro.';
    }

    if (PALABRAS_PROHIBIDAS.some(p => plano.includes(p))) {
        return 'Ese nombre de usuario no está permitido. Elige otro.';
    }

    return null;
};

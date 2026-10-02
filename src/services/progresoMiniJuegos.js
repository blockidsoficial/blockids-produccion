
import { supabase } from '../config/supabaseClient';

// XP que otorga cada minijuego al completarlo.
export const XP_JUEGOS = {
    adivinaNumero: 50,
    memoriaCodigo: 75,
    secuenciaLogica: 100
};

// Calcula el nivel según el XP acumulado.
export function calcularNivel(xp) {
    if (xp < 250) return 1;
    if (xp < 500) return 2;
    if (xp < 750) return 3;
    if (xp < 1000) return 4;
    if (xp < 1500) return 5;
    if (xp < 2000) return 6;

    return Math.floor(xp / 500) + 2;
}

// Obtiene la fecha local en formato YYYY-MM-DD.
function obtenerFechaLocal() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

// Calcula la diferencia entre dos fechas sin depender
// de la hora del dispositivo.
function diferenciaDias(fechaAnterior, fechaActual) {
    const anterior = new Date(`${fechaAnterior}T00:00:00Z`);
    const actual = new Date(`${fechaActual}T00:00:00Z`);

    return Math.round(
        (actual.getTime() - anterior.getTime()) /
        (1000 * 60 * 60 * 24)
    );
}

// Obtiene el progreso guardado del usuario.
export async function obtenerProgreso() {
    const { data: { user }, error: errorUsuario } =
        await supabase.auth.getUser();

    if (errorUsuario) throw errorUsuario;

    if (!user) {
        throw new Error('Debes iniciar sesión para consultar tu progreso.');
    }

    const { data, error } = await supabase
        .from('progreso_minijuegos')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

    if (error) throw error;

    // Si todavía no existe un registro, lo creamos.
    if (!data) {
        const { data: nuevoProgreso, error: errorInsertar } =
            await supabase
                .from('progreso_minijuegos')
                .insert({
                    usuario_id: user.id,
                    xp: 0,
                    nivel: 1,
                    racha: 0,
                    ultimo_dia_jugado: null
                })
                .select()
                .single();

        if (errorInsertar) throw errorInsertar;

        return nuevoProgreso;
    }

    return data;
}

// Registra un juego completado y actualiza el progreso.
export async function completarJuego(juego) {
    const xpGanada = XP_JUEGOS[juego];

    if (xpGanada === undefined) {
        throw new Error('El minijuego indicado no es válido.');
    }

    const { data: { user }, error: errorUsuario } =
        await supabase.auth.getUser();

    if (errorUsuario) throw errorUsuario;

    if (!user) {
        throw new Error('Debes iniciar sesión para guardar tu progreso.');
    }

    const hoy = obtenerFechaLocal();

    // Consultamos si el juego ya otorgó XP hoy.
    const { data: juegoExistente, error: errorHistorial } =
        await supabase
            .from('historial_minijuegos')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('juego', juego)
            .eq('fecha', hoy)
            .maybeSingle();

    if (errorHistorial) throw errorHistorial;

    const progreso = await obtenerProgreso();

    // No permite obtener XP otra vez por el mismo juego
    // durante el mismo día.
    if (juegoExistente) {
        return {
            progreso,
            xpGanada: 0,
            yaJugadoHoy: true
        };
    }

    const xpActual = progreso.xp;
    const nuevoXP = xpActual + xpGanada;
    const ultimaFecha = progreso.ultimo_dia_jugado;

    let nuevaRacha = progreso.racha;

    if (!ultimaFecha) {
        nuevaRacha = 1;
    } else if (ultimaFecha === hoy) {
        // Ya jugó hoy: la racha no aumenta otra vez.
        nuevaRacha = progreso.racha;
    } else {
        const dias = diferenciaDias(ultimaFecha, hoy);

        if (dias === 1) {
            nuevaRacha = progreso.racha + 1;
        } else if (dias > 1) {
            nuevaRacha = 1;
        }
    }

    const nuevoNivel = calcularNivel(nuevoXP);

    // Actualizamos XP, nivel y racha en Supabase.
    const { data: progresoActualizado, error: errorActualizar } =
        await supabase
            .from('progreso_minijuegos')
            .update({
                xp: nuevoXP,
                nivel: nuevoNivel,
                racha: nuevaRacha,
                ultimo_dia_jugado: hoy,
                updated_at: new Date().toISOString()
            })
            .eq('usuario_id', user.id)
            .select()
            .single();

    if (errorActualizar) throw errorActualizar;

    // Guardamos el juego completado en el historial.
    const { error: errorGuardarHistorial } = await supabase
        .from('historial_minijuegos')
        .insert({
            usuario_id: user.id,
            juego,
            fecha: hoy,
            xp_ganada: xpGanada
        });

    if (errorGuardarHistorial) {
        throw errorGuardarHistorial;
    }

    return {
        progreso: progresoActualizado,
        xpGanada,
        yaJugadoHoy: false
    };
}
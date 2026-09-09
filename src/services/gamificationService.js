import { supabase } from '../config/supabaseClient';
import { emitirLogro } from '../lib/logro-eventos';

// La curva de nivel (XP por nivel) vive ahora en la función SQL otorgar_xp().

/**
 * Suma XP al usuario y recalcula su nivel.
 *
 * El cálculo y la escritura ocurren en la función SECURITY DEFINER
 * `otorgar_xp()` de Supabase: las columnas puntos_xp / nivel ya NO son
 * editables directamente desde el cliente (las bloquea un trigger).
 *
 * Devuelve { exito, subioDeNivel, nuevoNivel, nuevoXP }.
 */
export const otorgarXP = async (userId, cantidadXP) => {
    if (!userId || !cantidadXP || cantidadXP <= 0) return { exito: false, razon: 'params_invalidos' };

    try {
        const { data, error } = await supabase.rpc('otorgar_xp', {
            p_user_id:  userId,
            p_cantidad: cantidadXP,
        });

        if (error) throw error;

        if (data?.subioDeNivel) {
            console.log(`[BLOCKIDS] Subida de nivel: ${data.nuevoNivel}`);
        }

        return {
            exito:        true,
            subioDeNivel: data?.subioDeNivel ?? false,
            nuevoNivel:   data?.nuevoNivel,
            nuevoXP:      data?.nuevoXP,
        };
    } catch (err) {
        console.error('[BLOCKIDS] Error otorgando XP:', err);
        return { exito: false, error: err };
    }
};

/**
 * Desbloquea un logro buscándolo por nombre exacto (columna UNIQUE).
 * Si ya estaba desbloqueado, no hace nada.
 * Al desbloquear, otorga bonoXP adicional (por defecto 100).
 * Devuelve { exito, razon? }.
 */
export const desbloquearLogro = async (userId, nombreLogro, bonoXP = 100) => {
    if (!userId || !nombreLogro) return { exito: false, razon: 'params_invalidos' };

    try {
        const { data: logro, error: logroError } = await supabase
            .from('logros')
            .select('id, nombre, descripcion, icono_url')
            .eq('nombre', nombreLogro)
            .maybeSingle();

        if (logroError || !logro) {
            console.warn(
                `[BLOCKIDS] Logro "${nombreLogro}" no está en el catálogo public.logros ` +
                `(¿se aplicó la migración 20260906_fix_logros_alumno.sql?).`,
                logroError || ''
            );
            return { exito: false, razon: 'logro_no_encontrado' };
        }

        const { data: yaExiste } = await supabase
            .from('usuario_logros')
            .select('id')
            .eq('perfil_id', userId)
            .eq('logro_id', logro.id)
            .maybeSingle();

        if (yaExiste) {
            return { exito: false, razon: 'ya_desbloqueado' };
        }

        const { error: insertError } = await supabase
            .from('usuario_logros')
            .insert({ perfil_id: userId, logro_id: logro.id });

        if (insertError) throw insertError;

        console.log(`[BLOCKIDS] Logro desbloqueado: ${nombreLogro}`);

        if (bonoXP > 0) {
            await otorgarXP(userId, bonoXP);
        }

        // Dispara la celebración (popup) en el panel del alumno / entorno.
        emitirLogro({
            nombre:      logro.nombre,
            descripcion: logro.descripcion,
            iconoUrl:    logro.icono_url,
            bonoXP,
        });

        return { exito: true, logroId: logro.id };
    } catch (err) {
        console.error('[BLOCKIDS] Error desbloqueando logro:', err);
        return { exito: false, error: err };
    }
};

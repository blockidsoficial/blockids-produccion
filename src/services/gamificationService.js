import { supabase } from '../config/supabaseClient';

const XP_POR_NIVEL = 500;

/**
 * Suma XP al usuario y recalcula su nivel.
 * Devuelve { exito, subioDeNivel, nuevoNivel, nuevoXP }.
 */
export const otorgarXP = async (userId, cantidadXP) => {
    if (!userId || !cantidadXP || cantidadXP <= 0) return { exito: false, razon: 'params_invalidos' };

    try {
        const { data: perfil, error: fetchError } = await supabase
            .from('perfiles')
            .select('puntos_xp, nivel')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const nuevoXP      = (perfil.puntos_xp || 0) + cantidadXP;
        const nuevoNivel   = Math.floor(nuevoXP / XP_POR_NIVEL) + 1;
        const subioDeNivel = nuevoNivel > (perfil.nivel || 1);

        const { error: updateError } = await supabase
            .from('perfiles')
            .update({ puntos_xp: nuevoXP, nivel: nuevoNivel })
            .eq('id', userId);

        if (updateError) throw updateError;

        if (subioDeNivel) {
            console.log(`[BLOCKIDS] Subida de nivel: ${nuevoNivel}`);
        }

        return { exito: true, subioDeNivel, nuevoNivel, nuevoXP };
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
            .select('id')
            .eq('nombre', nombreLogro)
            .maybeSingle();

        if (logroError || !logro) {
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

        return { exito: true, logroId: logro.id };
    } catch (err) {
        console.error('[BLOCKIDS] Error desbloqueando logro:', err);
        return { exito: false, error: err };
    }
};

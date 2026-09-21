import { supabase } from '../config/supabaseClient';
import { emitirLogro } from '../lib/logro-eventos';

// El XP y los logros los otorga el SERVIDOR (triggers y funciones SQL de
// supabase/migrations/20260921000000_logros_y_xp_en_servidor.sql). El
// navegador ya no decide cuánto XP se gana: solo avisa de lo que pasa en el
// editor y muestra la celebración de lo que el servidor ya otorgó.

/**
 * Pide al servidor los logros recién ganados (y los marca como vistos) y lanza
 * el popup de celebración por cada uno. Llamar después de una acción que pudo
 * desbloquear algo: crear proyecto, entregar tarea, unirse a un aula, etc.
 * Devuelve cuántos logros nuevos había.
 */
export const celebrarLogrosNuevos = async () => {
    try {
        const { data, error } = await supabase.rpc('tomar_logros_nuevos');
        if (error) throw error;

        const nuevos = data || [];
        nuevos.forEach(l => emitirLogro({
            nombre:      l.nombre,
            descripcion: l.descripcion,
            iconoUrl:    l.icono_url,
            bonoXP:      l.xp_recompensa,
        }));
        return nuevos.length;
    } catch (err) {
        console.error('[BLOCKIDS] Error consultando logros nuevos:', err);
        return 0;
    }
};

/**
 * Reporta un logro que solo ocurre dentro del editor de bloques (ver la lista
 * blanca en la función SQL desbloquear_logro_editor). Es idempotente y solo
 * aplica a alumnos: para otros roles el servidor simplemente no hace nada.
 * Devuelve true si el logro se acaba de desbloquear.
 */
export const desbloquearLogroEditor = async (tipo) => {
    if (!tipo) return false;

    try {
        const { data, error } = await supabase.rpc('desbloquear_logro_editor', { p_tipo: tipo });
        if (error) throw error;

        if (data) await celebrarLogrosNuevos();
        return Boolean(data);
    } catch (err) {
        console.error(`[BLOCKIDS] Error desbloqueando logro "${tipo}":`, err);
        return false;
    }
};

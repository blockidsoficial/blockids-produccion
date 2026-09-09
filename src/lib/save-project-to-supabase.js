import {supabase} from '../config/supabaseClient';
import {desbloquearLogro} from '../services/gamificationService';

/**
 * Guarda el proyecto completo (.blockids) en Supabase Storage
 * y actualiza los metadatos en la tabla `proyectos`.
 *
 * @param {string|null} projectId - UUID del proyecto existente, null si es nuevo.
 * @param {Blob|Uint8Array} blob   - Contenido del proyecto serializado por vm.saveProjectSb3().
 * @param {object} params          - Parámetros opcionales: { title }.
 * @returns {Promise<{id: string}>} - Resuelve con el UUID del proyecto guardado.
 */
const saveProjectToSupabase = async function (projectId, blob, params) {
    params = params || {};

    const {data: {user}, error: authError} = await supabase.auth.getUser();
    if (authError || !user) throw new Error('El alumno no tiene sesión activa.');

    const {data: perfil, error: perfilError} = await supabase
        .from('perfiles')
        .select('escuela_id')
        .eq('id', user.id)
        .single();
    if (perfilError || !perfil) throw new Error('No se encontró el perfil del usuario.');

    const nombre = params.title || 'Proyecto BLOCKIDS';
    const creandoNuevo = !projectId;
    let proyectoId = projectId;

    if (creandoNuevo) {
        const {data: nuevo, error: insertError} = await supabase
            .from('proyectos')
            .insert({
                alumno_id: user.id,
                escuela_id: perfil.escuela_id,
                nombre: nombre,
                storage_path: 'pendiente'
            })
            .select('id')
            .single();
        if (insertError) throw insertError;
        proyectoId = nuevo.id;
    }

    const storagePath = `${perfil.escuela_id}/${user.id}/${proyectoId}.blockids`;

    const archivo = new Blob([blob], {type: 'application/zip'});

    const {error: uploadError} = await supabase.storage
        .from('proyectos-blockids')
        .upload(storagePath, archivo, {
            upsert: true,
            contentType: 'application/zip'
        });
    if (uploadError) throw uploadError;

    const {error: updateError} = await supabase
        .from('proyectos')
        .update({
            nombre: nombre,
            storage_path: storagePath
        })
        .eq('id', proyectoId);
    if (updateError) throw updateError;

    // Gamificación: primer proyecto que el alumno crea/guarda desde el entorno
    // (modo sandbox). En el flujo normal el logro ya lo otorga VistaProyectos.
    // desbloquearLogro es idempotente y no bloquea el guardado si algo falla.
    if (creandoNuevo) {
        Promise.resolve()
            .then(() => desbloquearLogro(user.id, 'Mi Primer Proyecto', 50))
            .catch(() => { /* la celebración es best-effort */ });
    }

    return {id: proyectoId};
};

export default saveProjectToSupabase;

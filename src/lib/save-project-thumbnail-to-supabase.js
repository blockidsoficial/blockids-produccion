import {supabase} from '../config/supabaseClient';

const BUCKET = 'proyecto-miniaturas';

/**
 * Sube la miniatura del escenario (generada por vm.renderer.requestSnapshot,
 * ver project-saver-hoc.jsx) a Supabase Storage y actualiza
 * `proyectos.thumbnail_url`. Es "fire and forget" desde project-saver-hoc:
 * si falla, no debe tronar el guardado del proyecto, así que aquí solo se
 * registra el error en consola.
 *
 * @param {string} projectId - UUID del proyecto ya guardado.
 * @param {Blob} blob        - Imagen del escenario (normalmente image/png).
 */
const saveProjectThumbnailToSupabase = async function (projectId, blob) {
    if (!projectId) return;

    try {
        const path = `${projectId}.png`;

        const {error: uploadError} = await supabase.storage
            .from(BUCKET)
            .upload(path, blob, {
                upsert: true,
                contentType: blob.type || 'image/png'
            });
        if (uploadError) throw uploadError;

        const {data: {publicUrl}} = supabase.storage.from(BUCKET).getPublicUrl(path);

        // Sin cache-busting: el mismo projectId siempre usa el mismo nombre de
        // archivo, y como aquí ya cambió el contenido, agregamos un parámetro
        // de versión para que el navegador no sirva la miniatura vieja cacheada.
        const urlConVersion = `${publicUrl}?v=${Date.now()}`;

        const {error: updateError} = await supabase
            .from('proyectos')
            .update({thumbnail_url: urlConVersion})
            .eq('id', projectId);
        if (updateError) throw updateError;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BLOCKIDS] No se pudo guardar la miniatura del proyecto:', err);
    }
};

export default saveProjectThumbnailToSupabase;

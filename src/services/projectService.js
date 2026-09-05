import {supabase} from '../config/supabaseClient';

export const listarProyectos = async () => {
    const {data: {user}} = await supabase.auth.getUser();
    const {data, error} = await supabase
        .from('proyectos')
        .select('id, nombre, storage_path, created_at, updated_at')
        .eq('alumno_id', user.id)
        .order('updated_at', {ascending: false});
    if (error) throw error;
    return data || [];
};

export const descargarProyecto = async (storagePath) => {
    const {data, error} = await supabase.storage
        .from('proyectos-blockids')
        .download(storagePath);
    if (error) throw error;
    return data.arrayBuffer();
};

export const eliminarProyecto = async (id, storagePath) => {
    // Primero eliminar el archivo del bucket
    if (storagePath && storagePath !== 'pendiente') {
        await supabase.storage.from('proyectos-blockids').remove([storagePath]);
    }
    // Luego eliminar el registro de la tabla
    const {error} = await supabase.from('proyectos').delete().eq('id', id);
    if (error) throw error;
};

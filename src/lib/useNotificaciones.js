import {useState, useEffect, useCallback} from 'react';
import {supabase} from '../config/supabaseClient';

// Notificaciones del usuario en sesión (tabla `notificaciones`, ver migración
// 20260921030000_notificaciones.sql). Carga las últimas y se suscribe por
// Realtime a las nuevas, para que la campanita se actualice sin recargar.
// Si la tabla aún no existe (migración sin aplicar) simplemente queda vacía.

const LIMITE = 30;

const useNotificaciones = () => {
    const [items, setItems] = useState([]);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        let vivo = true;
        supabase.auth.getSession().then(({data: {session}}) => {
            if (vivo && session) setUserId(session.user.id);
        });
        return () => {
            vivo = false;
        };
    }, []);

    useEffect(() => {
        if (!userId) return undefined;
        let vivo = true;

        supabase
            .from('notificaciones')
            .select('id, tipo, titulo, mensaje, url, leida, created_at')
            .eq('user_id', userId)
            .order('created_at', {ascending: false})
            .limit(LIMITE)
            .then(({data, error}) => {
                if (error) {
                    console.error('[BLOCKIDS] No se pudieron cargar las notificaciones:', error.message);
                    return;
                }
                if (vivo) setItems(data || []);
            });

        const canal = supabase
            .channel(`notificaciones-${userId}`)
            .on(
                'postgres_changes',
                {event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${userId}`},
                payload => setItems(prev => [payload.new, ...prev.filter(n => n.id !== payload.new.id)].slice(0, LIMITE))
            )
            .subscribe();

        return () => {
            vivo = false;
            supabase.removeChannel(canal);
        };
    }, [userId]);

    const marcarLeida = useCallback(async id => {
        setItems(prev => prev.map(n => (n.id === id ? {...n, leida: true} : n)));
        const {error} = await supabase.from('notificaciones').update({leida: true})
            .eq('id', id);
        if (error) console.error('[BLOCKIDS] No se pudo marcar como leída:', error.message);
    }, []);

    const marcarTodas = useCallback(async () => {
        if (!userId) return;
        setItems(prev => prev.map(n => ({...n, leida: true})));
        const {error} = await supabase.from('notificaciones').update({leida: true})
            .eq('user_id', userId)
            .eq('leida', false);
        if (error) console.error('[BLOCKIDS] No se pudieron marcar como leídas:', error.message);
    }, [userId]);

    const noLeidas = items.filter(n => !n.leida).length;

    return {items, noLeidas, marcarLeida, marcarTodas};
};

export default useNotificaciones;

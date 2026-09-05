import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../config/supabaseClient';
import dash   from '../Dashboard.css';
import styles from './VistaMuro.css';

const VistaMuro = ({ userId }) => {
    const [aulas,            setAulas]            = useState([]);
    const [aulaSeleccionada, setAulaSeleccionada] = useState('');
    const [mensajes,         setMensajes]         = useState([]);
    const [cargandoMuro,     setCargandoMuro]     = useState(false);
    const [textoMuro,        setTextoMuro]        = useState('');
    const [enviandoMuro,     setEnviandoMuro]     = useState(false);

    const bottomRef = useRef(null);

    // ── Carga aulas del profesor ──────────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;
        const cargarAulas = async () => {
            const { data } = await supabase
                .from('aulas')
                .select('id, nombre')
                .eq('profesor_id', userId)
                .order('created_at', { ascending: false });
            const lista = data || [];
            setAulas(lista);
            if (lista.length > 0) setAulaSeleccionada(lista[0].id);
        };
        cargarAulas();
    }, [userId]);

    // ── Carga mensajes al cambiar de aula ─────────────────────────────────────
    useEffect(() => {
        if (!aulaSeleccionada) { setMensajes([]); return; }
        const cargarMensajes = async () => {
            setCargandoMuro(true);
            const { data } = await supabase
                .from('mensajes_muro')
                .select(`
                    id, contenido, fecha_creacion, autor_id,
                    autor:perfiles!mensajes_muro_autor_id_fkey(nombre, apellido, username, rol)
                `)
                .eq('aula_id', aulaSeleccionada)
                .order('fecha_creacion', { ascending: true });
            setMensajes(data || []);
            setCargandoMuro(false);
        };
        cargarMensajes();
    }, [aulaSeleccionada]);

    // ── Auto-scroll al último mensaje ─────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // ── Enviar mensaje ────────────────────────────────────────────────────────
    const handleEnviar = async (e) => {
        e.preventDefault();
        const contenido = textoMuro.trim();
        if (!contenido || !aulaSeleccionada) return;

        setEnviandoMuro(true);
        const { error } = await supabase.from('mensajes_muro').insert([{
            contenido,
            aula_id:  aulaSeleccionada,
            autor_id: userId,
        }]);
        setEnviandoMuro(false);

        if (!error) {
            setTextoMuro('');
            const { data } = await supabase
                .from('mensajes_muro')
                .select(`
                    id, contenido, fecha_creacion, autor_id,
                    autor:perfiles!mensajes_muro_autor_id_fkey(nombre, apellido, username, rol)
                `)
                .eq('aula_id', aulaSeleccionada)
                .order('fecha_creacion', { ascending: true });
            setMensajes(data || []);
        }
    };

    const formatHora = (iso) => {
        if (!iso) return '';
        return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    const formatFecha = (iso) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const nombreAutor = (autor) => {
        if (!autor) return 'Usuario';
        return autor.nombre && autor.apellido
            ? `${autor.nombre} ${autor.apellido}`
            : `@${autor.username}`;
    };

    return (
        <div>
            {/* ── Header ── */}
            <div className={dash.vistaHeader}>
                <h2 className={dash.vistaTitle}>Muro del Aula</h2>
                <select
                    className={dash.fieldInput}
                    style={{ maxWidth: 280 }}
                    value={aulaSeleccionada}
                    onChange={e => setAulaSeleccionada(e.target.value)}
                >
                    {aulas.length === 0 && <option value="">Sin aulas</option>}
                    {aulas.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                </select>
            </div>

            {/* ── Chat ── */}
            <div className={styles.muroWrapper}>

                {/* Lista de mensajes */}
                <div className={styles.mensajesList}>
                    {cargandoMuro ? (
                        <p className={styles.muroEstado}>Cargando mensajes...</p>
                    ) : mensajes.length === 0 ? (
                        <p className={styles.muroEstado}>Aún no hay mensajes en este muro.</p>
                    ) : (
                        mensajes.map(msg => {
                            const esMio   = msg.autor_id === userId;
                            const esProfe = msg.autor?.rol === 'profesor';

                            return (
                                <div
                                    key={msg.id}
                                    className={[
                                        styles.mensajeBase,
                                        esMio ? styles.derecha : styles.izquierda,
                                        esProfe ? styles.esProfesor : '',
                                    ].join(' ')}
                                >
                                    <span className={styles.mensajeAutor}>
                                        {nombreAutor(msg.autor)}
                                        {esProfe && (
                                            <span className={styles.etiquetaProfe}>PROFESOR</span>
                                        )}
                                    </span>
                                    <p className={styles.mensajeContenido}>{msg.contenido}</p>
                                    <span className={styles.mensajeFecha}>
                                        {formatFecha(msg.fecha_creacion)} · {formatHora(msg.fecha_creacion)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Formulario de envío */}
                <form className={styles.muroInputArea} onSubmit={handleEnviar}>
                    <textarea
                        className={styles.muroTextarea}
                        placeholder="Escribe un mensaje para el muro..."
                        value={textoMuro}
                        onChange={e => setTextoMuro(e.target.value)}
                        disabled={enviandoMuro || !aulaSeleccionada}
                        rows={3}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(e); }
                        }}
                    />
                    <button
                        type="submit"
                        className={styles.btnEnviarMensaje}
                        disabled={enviandoMuro || !textoMuro.trim() || !aulaSeleccionada}
                    >
                        {enviandoMuro ? 'Enviando...' : 'Publicar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VistaMuro;

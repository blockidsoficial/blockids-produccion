import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaMuro.css';

const obtenerIniciales = (nombre = '') => {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    return partes.slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
};

const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
};

const VistaMuro = ({ userId }) => {
    const [aulas, setAulas] = useState([]);
    const [aulaSeleccionada, setAulaSeleccionada] = useState('');
    const [mensajes, setMensajes] = useState([]);
    const [cargandoMuro, setCargandoMuro] = useState(false);
    const [textoMuro, setTextoMuro] = useState('');
    const [enviandoMuro, setEnviandoMuro] = useState(false);
    const [errorMuro, setErrorMuro] = useState('');
    const bottomRef = useRef(null);

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

    useEffect(() => {
        if (!aulaSeleccionada) {
            setMensajes([]);
            return;
        }
        const cargarMensajes = async () => {
            setCargandoMuro(true);
            setErrorMuro('');
            const { data, error } = await supabase
                .from('mensajes_muro')
                .select(`
                    id, contenido, fecha_creacion, autor_id,
                    autor:perfiles!mensajes_muro_autor_id_fkey(nombre, apellido, username, rol)
                `)
                .eq('aula_id', aulaSeleccionada)
                .order('fecha_creacion', { ascending: true });
            if (error) setErrorMuro('No se pudieron cargar los mensajes. Intenta de nuevo.');
            setMensajes(data || []);
            setCargandoMuro(false);
        };
        cargarMensajes();
    }, [aulaSeleccionada]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [mensajes]);

    const handleEnviar = async (e) => {
        e.preventDefault();
        const contenido = textoMuro.trim();
        if (!contenido || !aulaSeleccionada || enviandoMuro) return;

        setEnviandoMuro(true);
        setErrorMuro('');
        const { error } = await supabase.from('mensajes_muro').insert([{
            contenido,
            aula_id: aulaSeleccionada,
            autor_id: userId,
        }]);
        setEnviandoMuro(false);

        if (error) {
            setErrorMuro('No se pudo enviar el mensaje. Intenta de nuevo.');
            return;
        }

        setTextoMuro('');
        const { data, error: fetchError } = await supabase
            .from('mensajes_muro')
            .select(`
                id, contenido, fecha_creacion, autor_id,
                autor:perfiles!mensajes_muro_autor_id_fkey(nombre, apellido, username, rol)
            `)
            .eq('aula_id', aulaSeleccionada)
            .order('fecha_creacion', { ascending: true });
        if (fetchError) setErrorMuro('El mensaje se envió, pero no se pudo actualizar la conversación.');
        else setMensajes(data || []);
    };

    const nombreAutor = (autor) => {
        if (!autor) return 'Usuario';
        return autor.nombre && autor.apellido
            ? `${autor.nombre} ${autor.apellido}`
            : `@${autor.username || 'usuario'}`;
    };

    const aulaActual = aulas.find(a => String(a.id) === String(aulaSeleccionada));

    return (
        <div className={styles.profesorWrapper}>
            <header className={styles.chatHeader}>
                <div className={styles.headerIdentity}>
                    <div className={styles.headerIconWrap}>💬</div>
                    <div className={styles.headerText}>
                        <h2 className={styles.pageTitle}>Chat del aula</h2>
                        <p className={styles.pageSubtitle}>
                            {aulaActual?.nombre || (aulas.length ? 'Selecciona un aula' : 'Tus grupos de clase')}
                        </p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.chatStatus}>
                        <span className={styles.statusDot} />
                        Espacio de clase
                    </span>
                    <select
                        className={styles.filtroAula}
                        value={aulaSeleccionada}
                        onChange={e => setAulaSeleccionada(e.target.value)}
                        disabled={aulas.length === 0}
                        aria-label="Seleccionar aula"
                    >
                        {aulas.length === 0 && <option value="">Sin aulas</option>}
                        {aulas.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                </div>
            </header>

            <section className={styles.chatPanel}>
                <div className={styles.chatIntro}>
                    <div>
                        <span className={styles.introEyebrow}>COMUNICACIÓN DEL GRUPO</span>
                        <h3>Conversación de clase</h3>
                        <p>Comparte avisos, resuelve dudas y conversa con tus alumnos.</p>
                    </div>
                    <div className={styles.introIcon}>📚</div>
                </div>

                <div className={styles.mensajesLista} aria-live="polite">
                    {!aulaSeleccionada ? (
                        <div className={styles.estadoChat}>
                            <span className={styles.estadoIcon}>🏫</span>
                            <h3>No hay aulas disponibles</h3>
                            <p>Cuando tengas un aula asignada, aquí aparecerá su conversación.</p>
                        </div>
                    ) : cargandoMuro ? (
                        <div className={styles.estadoChat}>
                            <div className={styles.spinner} />
                            <p>Cargando conversación...</p>
                        </div>
                    ) : mensajes.length === 0 ? (
                        <div className={styles.estadoChat}>
                            <span className={styles.estadoIcon}>💬</span>
                            <h3>Comienza la conversación</h3>
                            <p>Envía el primer mensaje para comunicarte con los alumnos de esta aula.</p>
                        </div>
                    ) : (
                        mensajes.map((msg, index) => {
                            const esMio = msg.autor_id === userId;
                            const esProfe = msg.autor?.rol === 'profesor';
                            const autor = nombreAutor(msg.autor);
                            const fechaActual = formatearFecha(msg.fecha_creacion);
                            const fechaAnterior = index > 0
                                ? formatearFecha(mensajes[index - 1].fecha_creacion)
                                : null;

                            return (
                                <React.Fragment key={msg.id}>
                                    {fechaActual !== fechaAnterior && (
                                        <div className={styles.dateDivider}><span>{fechaActual}</span></div>
                                    )}
                                    <div className={`${styles.mensajeFila} ${esMio ? styles.filaMio : styles.filaOtro}`}>
                                        {!esMio && (
                                            <div className={`${styles.avatarMensaje} ${esProfe ? styles.avatarProfesor : ''}`}>
                                                {obtenerIniciales(autor.replace('@', ''))}
                                            </div>
                                        )}
                                        <div className={`${styles.burbuja} ${esMio ? styles.burbujaMia : esProfe ? styles.burbujaProfesor : styles.burbujaAlumno}`}>
                                            {!esMio && (
                                                <div className={styles.mensajeHeader}>
                                                    <span className={styles.autorNombre}>{autor}</span>
                                                    {esProfe && <span className={styles.badgeProfesor}>PROFESOR</span>}
                                                </div>
                                            )}
                                            <p className={styles.mensajeContenido}>{msg.contenido}</p>
                                            <span className={styles.mensajeFecha}>
                                                {msg.fecha_creacion
                                                    ? new Date(msg.fecha_creacion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                                                    : ''}
                                            </span>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {errorMuro && <p className={styles.errorMsg}>{errorMuro}</p>}

                <form className={styles.composer} onSubmit={handleEnviar}>
                    <textarea
                        className={styles.muroTextarea}
                        placeholder="Escribe un mensaje para tu aula..."
                        value={textoMuro}
                        onChange={e => setTextoMuro(e.target.value)}
                        disabled={enviandoMuro || !aulaSeleccionada}
                        rows={2}
                        maxLength={600}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleEnviar(e);
                            }
                        }}
                    />
                    <div className={styles.composerFooter}>
                        <span className={styles.charCount}>{textoMuro.length}/600 · Enter para enviar</span>
                        <button
                            type="submit"
                            className={styles.btnEnviarMensaje}
                            disabled={enviandoMuro || !textoMuro.trim() || !aulaSeleccionada}
                        >
                            {enviandoMuro ? 'Enviando...' : 'Enviar mensaje'}
                            <span aria-hidden="true">➤</span>
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default VistaMuro;

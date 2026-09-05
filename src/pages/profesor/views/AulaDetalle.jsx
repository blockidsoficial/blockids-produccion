import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { supabase } from '../../../config/supabaseClient';
import styles from './AulaDetalle.css';

const formatearFecha = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const formatearHora = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-MX', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

// ─────────────────────────────────────────────────────────────────────────────

const AulaDetalle = () => {
    const { aulaId } = useParams();
    const history = useHistory();
    const mensajesEndRef = useRef(null);

    // ── Datos del usuario y aula ──────────────────────────────────────────────
    const [aula, setAula]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [userId, setUserId]         = useState(null);
    const [rolUsuario, setRolUsuario] = useState(null);

    // ── Navegación por pestañas ───────────────────────────────────────────────
    const [tabActiva, setTabActiva] = useState(null);

    // ── Muro ──────────────────────────────────────────────────────────────────
    const [mensajes, setMensajes]         = useState([]);
    const [cargandoMuro, setCargandoMuro] = useState(false);
    const [textoMuro, setTextoMuro]       = useState('');
    const [enviandoMuro, setEnviandoMuro] = useState(false);

    // ── Tareas / Proyectos ────────────────────────────────────────────────────
    const [tareas, setTareas]               = useState([]);
    const [cargandoTareas, setCargandoTareas] = useState(false);
    const [modalTareaAbierto, setModalTareaAbierto] = useState(false);
    const [tituloTarea, setTituloTarea]     = useState('');
    const [descTarea, setDescTarea]         = useState('');
    const [enviandoTarea, setEnviandoTarea] = useState(false);
    // ── Alumnos ───────────────────────────────────────────────────────────────
    const [alumnos, setAlumnos] = useState([]);
    const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
    // ── Carga inicial: sesión → rol → validación → aula ──────────────────────
    useEffect(() => {
        const cargarAula = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { history.push('/login'); return; }

            setUserId(session.user.id);

            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', session.user.id)
                .single();

            const rol = perfil?.rol ?? null;
            setRolUsuario(rol);
            setTabActiva(rol === 'alumno' ? 'muro' : 'alumnos');

            if (rol === 'alumno') {
                const { data: inscripcion } = await supabase
                    .from('aula_alumnos')
                    .select('id')
                    .eq('aula_id', aulaId)
                    .eq('alumno_id', session.user.id)
                    .maybeSingle();

                if (!inscripcion) { history.push('/alumno'); return; }
            }

            const { data, error } = await supabase
                .from('aulas')
                .select('nombre, codigo_aula')
                .eq('id', aulaId)
                .single();

            if (error || !data) {
                history.push(rol === 'alumno' ? '/alumno' : '/profesor');
                return;
            }

            setAula(data);
            setLoading(false);
        };

        cargarAula();
    }, [aulaId, history]);

    // ── Cargar muro cuando se activa esa pestaña ──────────────────────────────
    useEffect(() => {
        if (tabActiva === 'muro' && aulaId) cargarMensajes();
    }, [tabActiva, aulaId]);

    // ── Cargar tareas cuando se activa esa pestaña ────────────────────────────
    useEffect(() => {
        if (tabActiva === 'proyectos' && aulaId) cargarTareas();
    }, [tabActiva, aulaId]);

    // ── Cargar alumnos cuando se activa esa pestaña ───────────────────────────
    useEffect(() => {
        if (tabActiva === 'alumnos' && aulaId) cargarAlumnos();
    }, [tabActiva, aulaId]);

    // ── Scroll al último mensaje ──────────────────────────────────────────────
    useEffect(() => {
        if (tabActiva === 'muro') {
            mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mensajes, tabActiva]);

    // ── Cargar mensajes ───────────────────────────────────────────────────────
    const cargarMensajes = async () => {
        setCargandoMuro(true);
        const { data, error } = await supabase
            .from('mensajes_muro')
            .select('id, contenido, fecha_creacion, perfiles:autor_id (nombre, apellido, username, rol)')
            .eq('aula_id', aulaId)
            .order('fecha_creacion', { ascending: true });
        if (!error) setMensajes(data || []);
        setCargandoMuro(false);
    };

    // ── Cargar tareas ─────────────────────────────────────────────────────────
    const cargarTareas = async () => {
        setCargandoTareas(true);
        const { data, error } = await supabase
            .from('tareas')
            .select('id, titulo, descripcion, created_at')
            .eq('aula_id', aulaId)
            .order('created_at', { ascending: false });
        if (!error) setTareas(data || []);
        setCargandoTareas(false);
    };

    // ── Cargar alumnos ────────────────────────────────────────────────────────
    const cargarAlumnos = async () => {
        setCargandoAlumnos(true);
        const { data, error } = await supabase
            .from('aula_alumnos')
            .select('joined_at, perfiles:alumno_id (nombre, apellido, username)')
            .eq('aula_id', aulaId);
        if (!error) setAlumnos(data || []);
        setCargandoAlumnos(false);
    };

    // ── Enviar mensaje del muro ───────────────────────────────────────────────
    const handleEnviarMensaje = async (e) => {
        e.preventDefault();
        const texto = textoMuro.trim();
        if (!texto || !userId) return;
        setEnviandoMuro(true);
        const { error } = await supabase
            .from('mensajes_muro')
            .insert({ aula_id: aulaId, autor_id: userId, contenido: texto });
        if (!error) { setTextoMuro(''); await cargarMensajes(); }
        else console.error('[BLOCKIDS] Error al enviar mensaje:', error.message);
        setEnviandoMuro(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEnviarMensaje(e);
        }
    };

    // ── Crear tarea ───────────────────────────────────────────────────────────
    const abrirModalTarea = () => {
        setTituloTarea('');
        setDescTarea('');
        setModalTareaAbierto(true);
    };
    const cerrarModalTarea = () => {
        if (enviandoTarea) return;
        setModalTareaAbierto(false);
    };

    const handleCrearTarea = async (e) => {
        e.preventDefault();
        const titulo = tituloTarea.trim();
        if (!titulo) return;
        setEnviandoTarea(true);
        const { error } = await supabase
            .from('tareas')
            .insert({ aula_id: aulaId, titulo, descripcion: descTarea.trim() || null });
        setEnviandoTarea(false);
        if (!error) {
            cerrarModalTarea();
            await cargarTareas();
        } else {
            console.error('[BLOCKIDS] Error al crear tarea:', error.message);
        }
    };

    // ── Helpers de UI ─────────────────────────────────────────────────────────
    const esAlumno   = rolUsuario === 'alumno';
    const esProfesor = rolUsuario === 'profesor';

    // ─────────────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Cargando aula...</p>
            </div>
        );
    }

    return (
        <div className={styles.aulaDetalleRoot}>

            {/* ── Modal Crear Tarea ── */}
            {modalTareaAbierto && (
                <div className={styles.modalOverlay} onClick={cerrarModalTarea}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>

                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Nueva Tarea</h3>
                                <p className={styles.modalSubtitle}>Los alumnos verán esta tarea en su pestaña de Proyectos</p>
                            </div>
                            <button className={styles.modalClose} onClick={cerrarModalTarea} disabled={enviandoTarea}>✕</button>
                        </div>

                        <form onSubmit={handleCrearTarea}>
                            <div className={styles.modalBody}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel} htmlFor="tarea-titulo">Título</label>
                                    <input
                                        id="tarea-titulo"
                                        type="text"
                                        className={styles.fieldInput}
                                        placeholder="Ej. Crea un juego de laberinto"
                                        value={tituloTarea}
                                        onChange={e => setTituloTarea(e.target.value)}
                                        disabled={enviandoTarea}
                                        autoFocus
                                        maxLength={120}
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel} htmlFor="tarea-desc">Descripción (opcional)</label>
                                    <textarea
                                        id="tarea-desc"
                                        className={styles.fieldTextarea}
                                        placeholder="Instrucciones, pistas o materiales de apoyo..."
                                        value={descTarea}
                                        onChange={e => setDescTarea(e.target.value)}
                                        disabled={enviandoTarea}
                                        rows={4}
                                        maxLength={600}
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnCancelar} onClick={cerrarModalTarea} disabled={enviandoTarea}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnConfirmar} disabled={enviandoTarea || !tituloTarea.trim()}>
                                    {enviandoTarea
                                        ? <><span className={styles.btnSpinnerModal} />Asignando...</>
                                        : '✓ Asignar Tarea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Topbar ── */}
            <header className={styles.topbar}>
                <div className={styles.topbarBrand}>
                    <div className={styles.topbarLogo}></div>
                    <span className={styles.topbarTitle}>BLOCKIDS</span>
                    <span className={styles.topbarSubtitle}>/ Vista de Aula</span>
                </div>
                <span className={styles.topbarBadge}>
                    {esAlumno ? ' Alumno' : 'Profesor'}
                </span>
            </header>

            <main className={styles.mainContent}>

                {/* ── Botón de regreso ── */}
                <button
                    className={styles.btnVolver}
                    onClick={() => history.push(esAlumno ? '/alumno' : '/profesor')}
                >
                    ← {esAlumno ? 'Volver a Mi Espacio' : 'Volver a Mis Aulas'}
                </button>

                {/* ── Cabecera del aula ── */}
                <div className={styles.aulaHeader}>
                    <h1 className={styles.aulaNombreTitle}>{aula.nombre}</h1>
                    {esProfesor && (
                        <div className={styles.codigoBadgeWrap}>
                            <span className={styles.codigoLabel}>Código de acceso</span>
                            <span className={styles.codigoBadge}>{aula.codigo_aula}</span>
                        </div>
                    )}
                </div>

                {/* ── Pestañas ── */}
                <div className={styles.tabsBar}>
                    {esProfesor && (
                        <button
                            className={`${styles.tab} ${tabActiva === 'alumnos' ? styles.tabActiva : ''}`}
                            onClick={() => setTabActiva('alumnos')}
                        >
                            Alumnos
                        </button>
                    )}
                    <button
                        className={`${styles.tab} ${tabActiva === 'proyectos' ? styles.tabActiva : ''}`}
                        onClick={() => setTabActiva('proyectos')}
                    >
                        Proyectos
                    </button>
                    <button
                        className={`${styles.tab} ${tabActiva === 'muro' ? styles.tabActiva : ''}`}
                        onClick={() => setTabActiva('muro')}
                    >
                        Muro
                    </button>
                </div>

                {/* ── Contenido de la pestaña activa ── */}
                <div className={styles.tabContent}>

                    {/* ── Alumnos (solo profesor) ── */}
                    {tabActiva === 'alumnos' && esProfesor && (
                        <div className={styles.proyectosSection}>
                            {cargandoAlumnos ? (
                                <p className={styles.cargandoTareas}>Cargando alumnos...</p>
                            ) : alumnos.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <span className={styles.emptyIcon}>-</span>
                                    <p className={styles.emptyTitle}>Aún no hay alumnos</p>
                                    <p className={styles.emptyDesc}>
                                        Pídeles que ingresen el código{' '}
                                        <span className={styles.codigoInline}>{aula.codigo_aula}</span>{' '}
                                        desde su panel para unirse.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {alumnos.map((inscripcion, i) => (
                                        <div key={i} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                {(inscripcion.perfiles?.nombre || inscripcion.perfiles?.username)?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>
                                                    {inscripcion.perfiles?.nombre} {inscripcion.perfiles?.apellido}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                                    @{inscripcion.perfiles?.username} • Se unió: {formatearFecha(inscripcion.joined_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Proyectos / Tareas ── */}
                    {tabActiva === 'proyectos' && (
                        <div className={styles.proyectosSection}>

                            <div className={styles.proyectosHeader}>
                                <div>
                                    <h2 className={styles.proyectosTitulo}>Tareas asignadas</h2>
                                    <p className={styles.proyectosSubtitulo}>
                                        {esProfesor
                                            ? `${tareas.length} tarea${tareas.length !== 1 ? 's' : ''} en esta aula`
                                            : 'Completa los retos que tu maestro te asignó'}
                                    </p>
                                </div>
                                {esProfesor && (
                                    <button className={styles.btnAsignarTarea} onClick={abrirModalTarea}>
                                        Asignar Tarea
                                    </button>
                                )}
                            </div>

                            {cargandoTareas && (
                                <p className={styles.cargandoTareas}>⏳ Cargando tareas...</p>
                            )}

                            {!cargandoTareas && tareas.length === 0 && (
                                <div className={styles.emptyState}>
                                    <span className={styles.emptyIcon}>-</span>
                                    <p className={styles.emptyTitle}>
                                        {esProfesor ? 'Aún no has asignado tareas' : 'Tu maestro aún no ha asignado tareas'}
                                    </p>
                                    <p className={styles.emptyDesc}>
                                        {esProfesor
                                            ? 'Usa el botón "Asignar Tarea" para crear el primer reto de tu clase.'
                                            : '¡Vuelve pronto! Tu maestro preparará retos increíbles para ti.'}
                                    </p>
                                </div>
                            )}

                            {!cargandoTareas && tareas.length > 0 && (
                                <div className={styles.tareasLista}>
                                    {tareas.map((tarea, i) => (
                                        <div
                                            key={tarea.id}
                                            className={styles.tareaCard}
                                            style={{ animationDelay: `${i * 0.06}s` }}
                                        >
                                            <div className={styles.tareaCardBody}>
                                                <div className={styles.tareaCardHeader}>
                                                    <span className={styles.tareaNumero}>#{tareas.length - i}</span>
                                                    <span className={styles.tareaFecha}>
                                                        {formatearFecha(tarea.created_at)}
                                                    </span>
                                                </div>
                                                <h3 className={styles.tareaCardTitulo}>{tarea.titulo}</h3>
                                                {tarea.descripcion && (
                                                    <p className={styles.tareaCardDesc}>{tarea.descripcion}</p>
                                                )}
                                            </div>

                                            {esAlumno && (
                                                <button
                                                    className={styles.btnAbrirEntorno}
                                                    onClick={() => {
                                                        console.log('[BLOCKIDS] Navegar a workspace, tareaId:', tarea.id);
                                                        history.push('/entorno?tareaId=' + tarea.id);
                                                    }}
                                                >
                                                     Abrir Entorno de Bloques
                                                </button>
                                            )}

                                            {esProfesor && (
                                                <div className={styles.tareaCardBadgeProfesor}>
                                                 Publicada
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Muro ── */}
                    {tabActiva === 'muro' && (
                        <div className={styles.muroWrapper}>
                            <div className={styles.mensajesList}>
                                {cargandoMuro && (
                                    <p className={styles.muroCargando}>⏳ Cargando mensajes...</p>
                                )}
                                {!cargandoMuro && mensajes.length === 0 && (
                                    <div className={styles.muroEmpty}>
                                        <span className={styles.muroEmptyIcon}>📢</span>
                                        <p className={styles.muroEmptyTitle}>El muro está vacío</p>
                                        <p className={styles.muroEmptyDesc}>
                                            {esProfesor
                                                ? 'Sé el primero en publicar un anuncio para tu clase.'
                                                : 'Tu maestro aún no ha publicado nada. ¡Vuelve pronto!'}
                                        </p>
                                    </div>
                                )}
                                {!cargandoMuro && mensajes.map((msg) => {
                                    const esMsgProfesor = msg.perfiles?.rol === 'profesor';
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`${styles.mensajeBurbuja} ${esMsgProfesor ? styles.mensajeBurbujaProfesor : ''}`}
                                        >
                                            <div className={styles.mensajeHeader}>
                                                <span className={styles.mensajeUsername}>
                                                    {msg.perfiles?.nombre || msg.perfiles?.username} {msg.perfiles?.apellido || ''} <span style={{ fontWeight: 'normal', opacity: 0.7, fontSize: '0.9em' }}>@{msg.perfiles?.username}</span>
                                                </span>
                                                {esMsgProfesor && <span className={styles.mensajeRolBadge}>Profesor</span>}
                                                <span className={styles.mensajeFecha}>{formatearHora(msg.fecha_creacion)}</span>
                                            </div>
                                            <p className={styles.mensajeTexto}>{msg.contenido}</p>
                                        </div>
                                    );
                                })}
                                <div ref={mensajesEndRef} />
                            </div>

                            <form className={styles.muroInputArea} onSubmit={handleEnviarMensaje}>
                                <textarea
                                    className={styles.muroTextarea}
                                    placeholder={esProfesor
                                        ? 'Escribe un anuncio para tu clase... (Enter para enviar)'
                                        : 'Escribe un mensaje al muro... (Enter para enviar)'}
                                    value={textoMuro}
                                    onChange={e => setTextoMuro(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={enviandoMuro}
                                    rows={2}
                                    maxLength={1000}
                                />
                                <button
                                    type="submit"
                                    className={styles.btnEnviarMensaje}
                                    disabled={enviandoMuro || !textoMuro.trim()}
                                >
                                    {enviandoMuro ? <span className={styles.btnSpinner} /> : 'Publicar'}
                                </button>
                            </form>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default AulaDetalle;

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaTareas.css';

import xolotlIdea     from '../../../assets/xolotl/xolotl-idea.svg';
import iconCalendario from '../../../assets/iconos-ui/ui-calendario.svg';
import iconVideo      from '../../../assets/iconos-ui/ui-video.svg';
import iconDescargar  from '../../../assets/iconos-ui/ui-descargar.svg';

const BADGE_ESTADO = {
    'Pendiente':   'badgePendiente',
    'Entregada':   'badgeEntregada',
    'En progreso': 'badgeEnProgreso',
    'Calificado':  'badgeCalificado',
};

// Fecha-pura sin offset de zona horaria
const formatearFecha = (iso) => {
    if (!iso) return '—';
    if (iso.length === 10) {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatearFechaRelativa = (iso) => {
    if (!iso) return '';
    const ahora = new Date();
    const fecha = new Date(iso);
    const diff  = Math.floor((fecha - ahora) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}`;
    if (diff === 0) return 'Vence hoy';
    if (diff === 1) return 'Vence mañana';
    if (diff < 7)  return `Vence en ${diff} días`;
    return `Vence en ${Math.floor(diff / 7)} semana${Math.floor(diff / 7) > 1 ? 's' : ''}`;
};

// Renderizado inteligente del material (igual que en el rol profesor)
const RenderMaterial = ({ url, stylesRef }) => {
    if (!url) return null;
    if (url.startsWith('http')) {
        const esArchivo = url.includes('supabase.co');
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={stylesRef.materialLink}
            >
                <img src={iconDescargar} alt="" width="14" height="14" />
                {esArchivo ? 'Descargar Archivo Adjunto' : 'Abrir Enlace de Apoyo'}
            </a>
        );
    }
    return (
        <div className={stylesRef.materialNota}>
            📌 Nota: {url}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const VistaTareas = ({ userId, aulaIds }) => {
    const history = useHistory();

    const [tareas,    setTareas]    = useState([]);
    const [aulaMap,   setAulaMap]   = useState({});
    const [cargando,  setCargando]  = useState(true);
    const [filtroAula, setFiltroAula] = useState('todas');

    // ── Modal de detalles ─────────────────────────────────────────────────────
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [archivoSubir,      setArchivoSubir]      = useState(null);
    const [subiendoTarea,     setSubiendoTarea]     = useState(false);
    const [alertaModal,       setAlertaModal]       = useState(null);

    useEffect(() => {
        if (!userId || !aulaIds || aulaIds.length === 0) { setCargando(false); return; }
        cargarDatos();
    }, [userId, aulaIds]);

    // ── Cargar datos ──────────────────────────────────────────────────────────
    const cargarDatos = async () => {
        setCargando(true);
        try {
            const { data: aulasData } = await supabase
                .from('aulas')
                .select('id, nombre, codigo_aula')
                .in('id', aulaIds);

            const mapa = {};
            (aulasData || []).forEach(a => { mapa[a.id] = a; });
            setAulaMap(mapa);

            const { data: tareasData } = await supabase
                .from('tareas')
                .select('id, titulo, descripcion, aula_id, created_at, fecha_limite, material_referencia, puntos_recompensa')
                .in('aula_id', aulaIds)
                .order('fecha_limite', { ascending: true, nullsFirst: false });

            const { data: entregasData } = await supabase
                .from('entregas_proyectos')
                .select('tarea_id, calificacion')
                .eq('estudiante_id', userId);

            const entregasMap = {};
            (entregasData || []).forEach(e => { entregasMap[e.tarea_id] = e; });

            setTareas((tareasData || []).map(t => {
                const entrega = entregasMap[t.id];
                const estado = !entrega ? 'Pendiente'
                    : entrega.calificacion != null ? 'Calificado'
                    : 'Entregada';
                return { ...t, estado, calificacion: entrega?.calificacion ?? null };
            }));
        } catch (err) {
            console.error('[BLOCKIDS] Error cargando tareas:', err);
            setTareas([]);
        } finally {
            setCargando(false);
        }
    };

    // ── Cerrar modal ──────────────────────────────────────────────────────────
    const cerrarModal = () => {
        if (subiendoTarea) return;
        setTareaSeleccionada(null);
        setArchivoSubir(null);
        setAlertaModal(null);
    };

    // ── Subir archivo .sb3 ────────────────────────────────────────────────────
    const handleSubirArchivo = async (e) => {
        e.preventDefault();
        if (!archivoSubir || !tareaSeleccionada) return;

        setSubiendoTarea(true);
        setAlertaModal(null);

        try {
            const nombreLimpio = archivoSubir.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `entregas/${userId}_${Math.floor(Date.now() / 10000)}_${nombreLimpio}`;

            const { error: uploadError } = await supabase.storage
                .from('proyectos-blockids')
                .upload(fileName, archivoSubir);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('proyectos-blockids')
                .getPublicUrl(fileName);

            // Upsert: actualizar si ya existe, insertar si no
            const { data: existe } = await supabase
                .from('entregas_proyectos')
                .select('id')
                .eq('tarea_id', tareaSeleccionada.id)
                .eq('estudiante_id', userId)
                .maybeSingle();

            if (existe) {
                const { error: updateError } = await supabase
                    .from('entregas_proyectos')
                    .update({ codigo_espacio_trabajo: publicUrl, estado: 'entregado', updated_at: new Date().toISOString() })
                    .eq('id', existe.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('entregas_proyectos')
                    .insert({ tarea_id: tareaSeleccionada.id, estudiante_id: userId, codigo_espacio_trabajo: publicUrl, estado: 'entregado' });
                if (insertError) throw insertError;
            }

            setAlertaModal({ tipo: 'success', texto: '¡Tarea entregada exitosamente! 🎉' });
            setArchivoSubir(null);
            setTimeout(() => { cerrarModal(); cargarDatos(); }, 1500);

        } catch (err) {
            setAlertaModal({ tipo: 'error', texto: `Error al subir: ${err.message}` });
        } finally {
            setSubiendoTarea(false);
        }
    };

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const tareasFiltradas = filtroAula === 'todas'
        ? tareas
        : tareas.filter(t => t.aula_id === filtroAula);

    // ── Estados de carga ──────────────────────────────────────────────────────
    if (cargando) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.cargando}>
                    <div className={styles.spinner} />
                    <p>Cargando tus tareas...</p>
                </div>
            </div>
        );
    }

    if (tareas.length === 0) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.emptyState}>
                    <img src={xolotlIdea} alt="Sin tareas" className={styles.xolotl} />
                    <h2 className={styles.titulo}>No tienes tareas asignadas</h2>
                    <p className={styles.desc}>Tus profesores aún no han asignado tareas. ¡Vuelve pronto!</p>
                </div>
            </div>
        );
    }

    // ── Vista principal ───────────────────────────────────────────────────────
    return (
        <div className={styles.wrapper}>

            {/* ══ Modal: Detalles de Tarea ══ */}
            {tareaSeleccionada && (
                <div className={styles.modalOverlay} onClick={cerrarModal}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <div className={styles.modalIconWrap}>
                                    <img src={iconCalendario} alt="" width="22" height="22" />
                                </div>
                                <div>
                                    <h3 className={styles.modalTitle}>{tareaSeleccionada.titulo}</h3>
                                    <p className={styles.modalSubtitle}>
                                        {aulaMap[tareaSeleccionada.aula_id]?.nombre || ''}
                                        {tareaSeleccionada.fecha_limite && (
                                            <> · Límite: {formatearFecha(tareaSeleccionada.fecha_limite)}</>
                                        )}
                                        {tareaSeleccionada.puntos_recompensa > 0 && (
                                            <> · {tareaSeleccionada.puntos_recompensa} XP</>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button className={styles.modalClose} onClick={cerrarModal} disabled={subiendoTarea}>✕</button>
                        </div>

                        <div className={styles.modalBody}>

                            {/* Descripción */}
                            {tareaSeleccionada.descripcion && (
                                <div className={styles.modalSeccion}>
                                    <p className={styles.modalSeccionLabel}>Instrucciones</p>
                                    <p className={styles.modalDesc}>{tareaSeleccionada.descripcion}</p>
                                </div>
                            )}

                            {/* Material del profe (renderizado inteligente) */}
                            {tareaSeleccionada.material_referencia && (
                                <div className={styles.modalSeccion}>
                                    <p className={styles.modalSeccionLabel}>Material de Apoyo</p>
                                    <RenderMaterial url={tareaSeleccionada.material_referencia} stylesRef={styles} />
                                </div>
                            )}

                            {/* Alerta del modal */}
                            {alertaModal && (
                                <p className={alertaModal.tipo === 'success' ? styles.exitoMsg : styles.errorMsg}>
                                    {alertaModal.texto}
                                </p>
                            )}

                            {/* Zona de entrega */}
                            <div className={styles.zonaEntrega}>
                                {/* Opción A: Subir archivo */}
                                <form className={styles.opcionEntrega} onSubmit={handleSubirArchivo}>
                                    <p className={styles.opcionLabel}>Subir proyecto (.sb3)</p>
                                    <input
                                        type="file"
                                        accept=".sb3,.zip"
                                        className={styles.inputArchivo}
                                        onChange={e => { setArchivoSubir(e.target.files[0] || null); setAlertaModal(null); }}
                                        disabled={subiendoTarea}
                                    />
                                    {archivoSubir && (
                                        <span className={styles.archivoNombre}>📎 {archivoSubir.name}</span>
                                    )}
                                    <button
                                        type="submit"
                                        className={styles.btnEntregar}
                                        disabled={!archivoSubir || subiendoTarea}
                                    >
                                        {subiendoTarea
                                            ? <><span className={styles.btnSpinner} />Subiendo...</>
                                            : '⬆ Entregar Archivo'}
                                    </button>
                                </form>

                                <div className={styles.separador}><span>O</span></div>

                                {/* Opción B: Entorno web */}
                                <div className={styles.opcionEntrega}>
                                    <p className={styles.opcionLabel}>Trabajar en el entorno web</p>
                                    <button
                                        className={styles.btnEntornoWeb}
                                        onClick={() => history.push(`/entorno?tareaId=${tareaSeleccionada.id}`)}
                                        disabled={subiendoTarea}
                                    >
                                        <img src={iconVideo} alt="" width="18" height="18" />
                                        Abrir Entorno de Programación
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* ══ Header ══ */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img src={iconCalendario} alt="" className={styles.headerIcon} />
                    <div>
                        <h2 className={styles.titulo}>Mis Tareas</h2>
                        <p className={styles.subtitulo}>{tareasFiltradas.length} tarea{tareasFiltradas.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {Object.keys(aulaMap).length > 1 && (
                    <select
                        className={styles.filtroSelect}
                        value={filtroAula}
                        onChange={e => setFiltroAula(e.target.value)}
                    >
                        <option value="todas">Todas las aulas</option>
                        {Object.entries(aulaMap).map(([id, aula]) => (
                            <option key={id} value={id}>{aula.nombre}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* ══ Lista ══ */}
            <div className={styles.tareasList}>
                {tareasFiltradas.length === 0 ? (
                    <div className={styles.emptyFiltered}><p>No hay tareas en esta aula</p></div>
                ) : (
                    tareasFiltradas.map((tarea, idx) => {
                        const aula     = aulaMap[tarea.aula_id];
                        const esVencida = tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date();
                        const estadoClase = (tarea.estado === 'Entregada' || tarea.estado === 'Calificado') ? 'estadoEntregada' : 'estadoPendiente';
                        return (
                            <div
                                key={tarea.id}
                                className={`${styles.tareaCard} ${esVencida ? styles.tareaVencida : ''} ${styles[estadoClase]}`}
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <div className={styles.tareaIndicador} />
                                <div className={styles.tareaContent}>
                                    <div className={styles.tareaHeader}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <h3 className={styles.tareaTitulo} style={{ margin: 0 }}>{tarea.titulo}</h3>
                                            {tarea.fecha_limite && (
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500', fontFamily: 'var(--font-principal)' }}>
                                                    Límite: {formatearFecha(tarea.fecha_limite)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            <span className={`${styles.badge} ${styles[BADGE_ESTADO[tarea.estado] || 'badgePendiente']}`}>
                                                {tarea.estado}
                                            </span>
                                            {tarea.estado === 'Calificado' && tarea.calificacion != null && (
                                                <span className={`${styles.badge} ${styles.badgeCalificado}`}>
                                                    ⭐ {tarea.calificacion} XP
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {tarea.descripcion && (
                                        <p className={styles.tareaDesc}>{tarea.descripcion}</p>
                                    )}
                                    <div className={styles.tareaFooter}>
                                        <div className={styles.tareaMetadata}>
                                            {aula && <span className={styles.aulaTag}>{aula.nombre}</span>}
                                            {tarea.fecha_limite && (
                                                <span className={`${styles.fechaTag} ${esVencida ? styles.vencida : ''}`}>
                                                    📅 {formatearFechaRelativa(tarea.fecha_limite)}
                                                </span>
                                            )}
                                            {tarea.puntos_recompensa > 0 && (
                                                <span className={styles.xpTag}>⭐ {tarea.puntos_recompensa} XP</span>
                                            )}
                                        </div>
                                        <div className={styles.acciones}>
                                            <button
                                                className={styles.btnAbrir}
                                                onClick={() => setTareaSeleccionada(tarea)}
                                                title="Ver detalles y entregar"
                                            >
                                                Ver Detalles
                                            </button>
                                            {tarea.estado !== 'Entregada' && (
                                                <button
                                                    className={styles.btnEntorno}
                                                    onClick={() => history.push(`/entorno?tareaId=${tarea.id}`)}
                                                    title="Abrir entorno de bloques"
                                                >
                                                    <img src={iconVideo} alt="" className={styles.iconoBtnEnv} />
                                                    Entorno
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default VistaTareas;

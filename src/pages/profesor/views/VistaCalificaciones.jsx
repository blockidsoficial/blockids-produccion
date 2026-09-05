import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import dash   from '../Dashboard.css';
import styles from './VistaCalificaciones.css';

const abreviar = (texto, max = 18) =>
    texto && texto.length > max ? texto.slice(0, max) + '…' : (texto || '—');

const nombreCompleto = (p) => {
    if (!p) return '—';
    return p.nombre && p.apellido ? `${p.nombre} ${p.apellido}` : `@${p.username}`;
};

const VistaCalificaciones = ({ userId }) => {
    const [aulas,            setAulas]            = useState([]);
    const [aulaSeleccionada, setAulaSeleccionada] = useState('');
    const [alumnos,          setAlumnos]          = useState([]);
    const [tareas,           setTareas]           = useState([]);
    const [entregas,         setEntregas]         = useState([]);
    const [cargando,         setCargando]         = useState(false);
    const [busqueda,         setBusqueda]         = useState('');

    // ── Estado del modal de edición rápida ───────────────────────────────────
    const [modalAbierto,    setModalAbierto]    = useState(false);
    const [entregaEditando, setEntregaEditando] = useState(null);
    const [nuevaCalif,      setNuevaCalif]      = useState(5);
    const [guardandoNota,   setGuardandoNota]   = useState(false);

    // ── Carga aulas del profesor ──────────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;
        const cargar = async () => {
            const { data } = await supabase
                .from('aulas')
                .select('id, nombre')
                .eq('profesor_id', userId)
                .order('created_at', { ascending: false });
            const lista = data || [];
            setAulas(lista);
            if (lista.length > 0) setAulaSeleccionada(lista[0].id);
        };
        cargar();
    }, [userId]);

    // ── Carga la matriz al cambiar de aula ────────────────────────────────────
    useEffect(() => {
        if (!aulaSeleccionada) { setAlumnos([]); setTareas([]); setEntregas([]); return; }
        cargarMatriz();
    }, [aulaSeleccionada]);

    const cargarMatriz = async () => {
        setCargando(true);
        const [{ data: aaData }, { data: tareasData }] = await Promise.all([
            supabase
                .from('aula_alumnos')
                .select('alumno:perfiles!aula_alumnos_alumno_id_fkey(id, nombre, apellido, username)')
                .eq('aula_id', aulaSeleccionada),
            supabase
                .from('tareas')
                .select('id, titulo, puntos_recompensa')
                .eq('aula_id', aulaSeleccionada)
                .order('created_at', { ascending: true }),
        ]);

        const listaAlumnos = (aaData || []).map(r => r.alumno).filter(Boolean);
        const listaTareas  = tareasData || [];
        setAlumnos(listaAlumnos);
        setTareas(listaTareas);

        if (listaTareas.length > 0) {
            const { data: entregasData } = await supabase
                .from('entregas_proyectos')
                .select('id, tarea_id, estudiante_id, estado, calificacion')
                .in('tarea_id', listaTareas.map(t => t.id));
            setEntregas(entregasData || []);
        } else {
            setEntregas([]);
        }
        setCargando(false);
    };

    const buscarEntrega = (alumnoId, tareaId) =>
        entregas.find(e => e.estudiante_id === alumnoId && e.tarea_id === tareaId) || null;

    // ── Cálculo de promedio proporcional ──────────────────────────────────────
    const calcularPromedio = (alumnoId) => {
        if (tareas.length === 0) return null;
        const calificadas = tareas
            .map(t => ({ entrega: buscarEntrega(alumnoId, t.id), tarea: t }))
            .filter(({ entrega }) => entrega?.estado === 'calificado');
        if (calificadas.length === 0) return null;
        const totalObtenido = calificadas.reduce((acc, { entrega }) => acc + (entrega.calificacion || 0), 0);
        const totalPosible  = calificadas.reduce((acc, { tarea }) => acc + (tarea.puntos_recompensa || 10), 0);
        if (totalPosible === 0) return null;
        return ((totalObtenido / totalPosible) * 100).toFixed(0);
    };

    const clasePromedio = (prom) => {
        if (prom === null) return styles.promedioVacio;
        const n = parseFloat(prom);
        if (n >= 80) return styles.promedioAlto;
        if (n >= 60) return styles.promedioMedio;
        return styles.promedioBajo;
    };

    // ── Exportar CSV ──────────────────────────────────────────────────────────
    const exportarCSV = () => {
        const encabezados = ['Estudiante', 'Promedio', ...tareas.map(t => t.titulo)];
        const filas = alumnos.map(alumno => {
            const prom = calcularPromedio(alumno.id);
            const celdas = tareas.map(t => {
                const e = buscarEntrega(alumno.id, t.id);
                if (!e) return 'Sin entregar';
                if (e.estado === 'calificado') return e.calificacion;
                return 'Por revisar';
            });
            return [nombreCompleto(alumno), prom ?? '—', ...celdas];
        });

        const csv   = [encabezados, ...filas].map(r => r.join(',')).join('\n');
        const blob  = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url   = URL.createObjectURL(blob);
        const link  = document.createElement('a');
        link.href   = url;
        link.download = `calificaciones_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ── Abrir / cerrar modal ──────────────────────────────────────────────────
    const abrirModal = (alumno, tarea, entrega) => {
        setEntregaEditando({ alumno, tarea, entrega });
        setNuevaCalif(entrega?.calificacion || 5);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (guardandoNota) return;
        setModalAbierto(false);
        setEntregaEditando(null);
    };

    // ── Guardar calificación ──────────────────────────────────────────────────
    const handleGuardarNota = async () => {
        if (!entregaEditando) return;
        setGuardandoNota(true);

        if (entregaEditando.entrega) {
            await supabase
                .from('entregas_proyectos')
                .update({ calificacion: nuevaCalif, estado: 'calificado' })
                .eq('id', entregaEditando.entrega.id);
        } else {
            await supabase
                .from('entregas_proyectos')
                .insert([{
                    tarea_id:      entregaEditando.tarea.id,
                    estudiante_id: entregaEditando.alumno.id,
                    calificacion:  nuevaCalif,
                    estado:        'calificado',
                }]);
        }

        setGuardandoNota(false);
        cerrarModal();
        await cargarMatriz();
    };

    return (
        <div>
            {/* ══ Modal de Edición Rápida ══ */}
            {modalAbierto && entregaEditando && (
                <div className={dash.modalOverlay} onClick={cerrarModal}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>

                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <span style={{ fontSize: '1.2rem' }}>★</span>
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Calificar Entrega</h3>
                                    <p className={dash.modalSubtitle}>
                                        {abreviar(entregaEditando.tarea.titulo, 32)}
                                    </p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModal} disabled={guardandoNota}>✕</button>
                        </div>

                        <div className={dash.modalBody}>
                            <p className={styles.modalInfo}>
                                Alumno: <span className={styles.modalInfoNegrita}>{nombreCompleto(entregaEditando.alumno)}</span>
                            </p>

                            {/* Selector de 10 estrellas */}
                            <div className={styles.selectorEstrellas}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <button
                                        key={n}
                                        className={`${styles.estrella} ${n <= nuevaCalif ? styles.estrellaActiva : styles.estrellaInactiva}`}
                                        onClick={() => setNuevaCalif(n)}
                                        disabled={guardandoNota}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p className={styles.notaActual}>
                                {nuevaCalif}
                                <span className={styles.notaActualLabel}>/ 10</span>
                            </p>
                        </div>

                        <div className={dash.modalFooter}>
                            <button
                                type="button"
                                className={dash.btnCancelar}
                                onClick={cerrarModal}
                                disabled={guardandoNota}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={dash.btnCrearConfirm}
                                onClick={handleGuardarNota}
                                disabled={guardandoNota}
                            >
                                {guardandoNota
                                    ? <><span className={dash.btnSpinner} />Guardando...</>
                                    : '★ Guardar Nota'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Header ══ */}
            <div className={dash.vistaHeader}>
                <div>
                    <h2 className={dash.vistaTitle}>Calificaciones</h2>
                    <p className={styles.subtitulo}>
                        {cargando
                            ? 'Cargando...'
                            : `${alumnos.length} alumno${alumnos.length !== 1 ? 's' : ''} · ${tareas.length} tarea${tareas.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className={styles.headerAcciones}>
                    <input
                        type="text"
                        className={`${dash.fieldInput} ${styles.inputBusqueda}`}
                        placeholder="Buscar estudiante..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {tareas.length > 0 && alumnos.length > 0 && (
                        <button className={styles.btnExportar} onClick={exportarCSV}>
                            ↓ Exportar CSV
                        </button>
                    )}
                    <select
                        className={`${dash.fieldInput} ${styles.selectAula}`}
                        value={aulaSeleccionada}
                        onChange={e => setAulaSeleccionada(e.target.value)}
                    >
                        {aulas.length === 0 && <option value="">Sin aulas</option>}
                        {aulas.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ══ Tabla Matriz ══ */}
            {cargando ? (
                <div className={`${dash.loadingAulas} ${styles.loadingWrap}`}>
                    Cargando calificaciones...
                </div>
            ) : tareas.length === 0 ? (
                <div className={`${dash.columnCard} ${styles.emptyWrap}`}>
                    <p className={dash.emptyAulaTitle}>
                        {aulas.length === 0 ? 'No tienes aulas creadas.' : 'Esta aula no tiene tareas aún.'}
                    </p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.matrixTable}>
                        <thead>
                            <tr>
                                <th className={styles.stickyCol}>ESTUDIANTE</th>
                                <th className={styles.thPromedio}>PROMEDIO</th>
                                {tareas.map(t => (
                                    <th key={t.id} title={t.titulo} className={styles.thCentered}>
                                        {abreviar(t.titulo)}
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>
                                            (Máx: {t.puntos_recompensa || 10} XP)
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const term = busqueda.toLowerCase().trim();
                                const alumnosFiltrados = term
                                    ? alumnos.filter(a =>
                                        `${a.nombre || ''} ${a.apellido || ''} ${a.username || ''}`.toLowerCase().includes(term)
                                      )
                                    : alumnos;

                                if (alumnos.length === 0) return (
                                    <tr>
                                        <td colSpan={tareas.length + 2} className={styles.tdVacio}>
                                            Sin alumnos en esta aula.
                                        </td>
                                    </tr>
                                );

                                if (alumnosFiltrados.length === 0) return (
                                    <tr>
                                        <td colSpan={tareas.length + 2} className={styles.tdVacio}>
                                            No se encontraron estudiantes para "{busqueda}".
                                        </td>
                                    </tr>
                                );

                                return alumnosFiltrados.map(alumno => {
                                    const prom = calcularPromedio(alumno.id);
                                    return (
                                        <tr key={alumno.id}>
                                            <td className={`${styles.stickyCol} ${styles.tdNombre}`}>
                                                {nombreCompleto(alumno)}
                                            </td>
                                            <td>
                                                <div className={styles.cellBtn}>
                                                    {prom !== null
                                                        ? <span className={`${styles.promedioBadge} ${clasePromedio(prom)}`}>{prom}%</span>
                                                        : <span className={styles.promedioVacio}>—</span>}
                                                </div>
                                            </td>
                                            {tareas.map(tarea => {
                                                const entrega  = buscarEntrega(alumno.id, tarea.id);
                                                const maxPts   = tarea.puntos_recompensa || 10;
                                                const calif    = entrega?.calificacion ?? 0;
                                                const pct      = maxPts > 0 ? (calif / maxPts) * 100 : 0;
                                                return (
                                                    <td key={tarea.id}>
                                                        <button
                                                            className={styles.cellBtn}
                                                            onClick={() => abrirModal(alumno, tarea, entrega)}
                                                            title="Clic para calificar"
                                                        >
                                                            {!entrega ? (
                                                                <span className={styles.sinEntregar}>— Pendiente</span>
                                                            ) : entrega.estado === 'calificado' ? (
                                                                <span className={`${styles.notaBadge} ${
                                                                    pct >= 80 ? styles.notaAlta
                                                                    : pct >= 60 ? styles.notaMedia
                                                                    : styles.notaBaja
                                                                }`}>
                                                                    {calif} / {maxPts}
                                                                </span>
                                                            ) : (
                                                                <span className={styles.pendienteBadge}>Por revisar</span>
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VistaCalificaciones;

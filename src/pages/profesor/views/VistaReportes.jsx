import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import dash   from '../Dashboard.css';
import styles from './VistaReportes.css';
import xolotlMotivacional from '../../../assets/xolotl/xolotl-excelente.svg';
import medallaOro from '../../../assets/iconos/icono-medalla-oro.svg';
import medallaPlata from '../../../assets/iconos/icono-medalla-plata.svg';
import medallaCobre from '../../../assets/iconos/icono-medalla-cobre.svg';
import medallaEspecial from '../../../assets/iconos/icono-medalla-especial.svg';

const MEDALLAS = [medallaOro, medallaPlata, medallaCobre, medallaEspecial, medallaEspecial];

const nombreCompleto = (p) => {
    if (!p) return '—';
    const partes = [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean);
    if (partes.length > 0) return partes.join(' ');
    return p.apellido ? `${p.nombre || ''} ${p.apellido}`.trim() : (p.username ? `@${p.username}` : '—');
};

const abreviar = (texto, max = 26) =>
    texto && texto.length > max ? texto.slice(0, max) + '…' : (texto || '—');

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

const VistaReportes = ({ userId }) => {
    const [aulas,            setAulas]            = useState([]);
    const [aulaSeleccionada, setAulaSeleccionada] = useState('');
    const [entregas,         setEntregas]         = useState([]);
    const [leaderboard,      setLeaderboard]      = useState([]);
    const [totalAlumnos,     setTotalAlumnos]     = useState(0);
    const [xpGlobal,         setXpGlobal]         = useState(0);
    const [cargando,         setCargando]         = useState(false);

    // Carga aulas del profesor
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

    // Carga datos al cambiar de aula
    useEffect(() => {
        if (!aulaSeleccionada) {
            setEntregas([]);
            setLeaderboard([]);
            setTotalAlumnos(0);
            setXpGlobal(0);
            return;
        }
        cargarDatos();
    }, [aulaSeleccionada]);

    const cargarDatos = async () => {
        setCargando(true);

        const [{ data: tareasData }, { data: alumnosData }] = await Promise.all([
            supabase
                .from('tareas')
                .select('id, titulo, puntos_recompensa')
                .eq('aula_id', aulaSeleccionada),
            supabase
                .from('aula_alumnos')
                .select('perfiles!aula_alumnos_alumno_id_fkey(id, nombre, apellido, apellido_paterno, apellido_materno, puntos_xp, nivel)')
                .eq('aula_id', aulaSeleccionada),
        ]);

        const tareaIds = (tareasData || []).map(t => t.id);
        const listaAlumnos = (alumnosData || []).map(r => r.perfiles).filter(Boolean);

        setTotalAlumnos(listaAlumnos.length);
        setXpGlobal(listaAlumnos.reduce((acc, est) => acc + (est.puntos_xp || 0), 0));

        const top5 = [...listaAlumnos]
            .sort((a, b) => (b.puntos_xp || 0) - (a.puntos_xp || 0))
            .slice(0, 5);
        setLeaderboard(top5);


        if (tareaIds.length === 0) {
            setEntregas([]);
            setCargando(false);
            return;
        }

        const { data: entregasData } = await supabase
            .from('entregas_proyectos')
            .select(`
                id, estado, calificacion, updated_at,
                perfiles!entregas_proyectos_estudiante_id_fkey(id, nombre, apellido, apellido_paterno, apellido_materno),
                tareas!entregas_proyectos_tarea_id_fkey(id, titulo, puntos_recompensa)
            `)
            .in('tarea_id', tareaIds)
            .order('updated_at', { ascending: false });

        setEntregas(entregasData || []);
        setCargando(false);
    };

    // Stats calculadas
    const entregasTotales  = entregas.length;
    const alumnosConEntrega = new Set(entregas.map(e => e.perfiles?.id).filter(Boolean)).size;
    const eficiencia = totalAlumnos > 0 ? Math.round((alumnosConEntrega / totalAlumnos) * 100) : 0;

    const hayDatos = entregas.length > 0 || leaderboard.length > 0;

    const descargarCSV = () => {
        const aulaNombre = aulas.find(a => a.id === aulaSeleccionada)?.nombre || 'Aula';
        const filas = [
            ['Estudiante', 'Tarea', 'Calificación', 'Estado', 'Fecha'],
            ...entregas.map(e => [
                nombreCompleto(e.perfiles),
                e.tareas?.titulo || '—',
                e.estado === 'calificado' ? `${e.calificacion}/100` : '—',
                e.estado === 'calificado' ? 'Calificado' : 'Por revisar',
                formatearFecha(e.updated_at),
            ]),
        ];
        const csv = filas
            .map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        const fecha = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
        a.setAttribute('download', `Reporte_${aulaNombre}_Blockids_${fecha}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const claseEficiencia = eficiencia >= 70
        ? styles.statVerde
        : eficiencia >= 40 ? styles.statAmarillo : styles.statRojo;

    return (
        <div>
            {/* ══ Header ══ */}
            <div className={dash.vistaHeader}>
                <div>
                    <h2 className={dash.vistaTitle}>Reportes de Progreso</h2>
                    <p className={styles.subtitulo}>
                        {cargando
                            ? 'Cargando...'
                            : `${entregasTotales} entrega${entregasTotales !== 1 ? 's' : ''} registrada${entregasTotales !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                        className={`${dash.fieldInput} ${styles.selectAula}`}
                        value={aulaSeleccionada}
                        onChange={e => setAulaSeleccionada(e.target.value)}
                    >
                        {aulas.length === 0 && <option value="">Sin aulas</option>}
                        {aulas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                    {hayDatos && (
                        <button
                            className={styles.btnExportarCSV}
                            onClick={descargarCSV}
                            title="Exportar reporte como CSV"
                        >
                            ⬇ Exportar CSV
                        </button>
                    )}
                </div>
            </div>

            {/* ══ Estados: cargando / vacío / datos ══ */}
            {cargando ? (
                <div className={`${dash.loadingAulas} ${styles.loadingWrap}`}>
                    Cargando reportes...
                </div>
            ) : aulas.length === 0 ? (
                <div className={`${dash.columnCard} ${styles.emptyWrap}`}>
                    <img src={xolotlMotivacional} alt="" className={styles.xolotlEmpty} />
                    <p className={dash.emptyAulaTitle}>No tienes aulas creadas aún.</p>
                    <p className={styles.emptySubtexto}>Crea un aula y agrega estudiantes para ver sus reportes aquí.</p>
                </div>
            ) : !hayDatos ? (
                <div className={`${dash.columnCard} ${styles.emptyWrap}`}>
                    <img src={xolotlMotivacional} alt="" className={styles.xolotlEmpty} />
                    <p className={dash.emptyAulaTitle}>Esta aula aún no tiene actividad registrada.</p>
                    <p className={styles.emptySubtexto}>Cuando los estudiantes entreguen tareas, verás el progreso aquí.</p>
                </div>
            ) : (
                <>
                    {/* ══ Stats ══ */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{entregasTotales}</span>
                            <span className={styles.statLabel}>Entregas Totales</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statNum} ${claseEficiencia}`}>{eficiencia}%</span>
                            <span className={styles.statLabel}>Eficiencia del Grupo</span>
                            <span className={styles.statMeta}>{alumnosConEntrega} de {totalAlumnos} alumnos</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statNum} ${styles.statAzul}`}>
                                {xpGlobal.toLocaleString()} XP
                            </span>
                            <span className={styles.statLabel}>XP Global Otorgado</span>
                        </div>
                    </div>

                    {/* ══ Layout principal: actividad + leaderboard ══ */}
                    <div className={styles.mainGrid}>

                        {/* Tabla de actividad */}
                        <div className={dash.columnCard}>
                            <div className={dash.columnHeader}>
                                <h2 className={dash.columnTitle}>Detalle de Actividad</h2>
                            </div>
                            <div className={styles.tableWrap}>
                                <table className={styles.tabla}>
                                    <thead>
                                        <tr>
                                            <th className={styles.th}>Estudiante</th>
                                            <th className={styles.th}>Tarea</th>
                                            <th className={styles.th}>Calificación</th>
                                            <th className={styles.th}>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entregas.map(e => (
                                            <tr key={e.id} className={styles.tr}>
                                                <td className={styles.td}>
                                                    {nombreCompleto(e.perfiles)}
                                                </td>
                                                <td className={styles.td} title={e.tareas?.titulo}>
                                                    {abreviar(e.tareas?.titulo)}
                                                </td>
                                                <td className={styles.td}>
                                                    {e.estado === 'calificado' ? (
                                                        <span className={styles.calNum}>{e.calificacion}/100</span>
                                                    ) : (
                                                        <span className={styles.pendienteBadge}>Por revisar</span>
                                                    )}
                                                </td>
                                                <td className={styles.td}>
                                                    {formatearFecha(e.updated_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className={`${dash.columnCard} ${styles.panelLeader}`}>
                            <div className={dash.columnHeader}>
                                <h2 className={dash.columnTitle}>Tabla de Líderes</h2>
                            </div>
                            {leaderboard.length === 0 ? (
                                <p className={styles.emptyLider}>Sin alumnos en esta aula.</p>
                            ) : (
                                <ul className={styles.leaderList}>
                                    {leaderboard.map((alumno, i) => (
                                        <li
                                            key={alumno.id}
                                            className={`${styles.leaderItem} ${i === 0 ? styles.leaderOro : ''}`}
                                        >
                                            <img src={MEDALLAS[i]} alt={`Puesto ${i + 1}`} className={styles.medalla} />
                                            <div className={styles.leaderInfo}>
                                                <span className={styles.leaderNombre}>
                                                    {nombreCompleto(alumno)}
                                                </span>
                                                <span className={styles.leaderNivel}>
                                                    Nivel {alumno.nivel || 1}
                                                </span>
                                            </div>
                                            <span className={styles.leaderXp}>
                                                {(alumno.puntos_xp || 0).toLocaleString()} XP
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default VistaReportes;

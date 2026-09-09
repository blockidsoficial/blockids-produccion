import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../../config/supabaseClient';
import { tipDelDia } from '../../../lib/frase-del-dia';
import { puedeNavegar } from '../../../lib/navGuard';

import xolotlGanador from '../../../assets/xolotl/xolotl-ganador.svg';
import xolotlIdea    from '../../../assets/xolotl/xolotl-idea.svg';
import xolotlBravo   from '../../../assets/xolotl/xolotl-bravo.svg';

import iconCurso     from '../../../assets/iconos-ui/ui-curso.svg';
import iconCalendario from '../../../assets/iconos-ui/ui-calendario.svg';
import iconVideo     from '../../../assets/iconos-ui/ui-video.svg';
import iconFavorito  from '../../../assets/iconos-ui/ui-favorito.svg';
import iconTareasVacio from '../../../assets/iconos/icon-tareas-vacio.svg';
import iconProyectosVacio from '../../../assets/iconos/icon-proyectos-vacio.svg';

import bloqueAzul    from '../../../assets/elementos/bloque-azul.svg';
import bloqueAmarillo from '../../../assets/elementos/bloque-amarillo.svg';
import bloqueMorado  from '../../../assets/elementos/bloque-morado.svg';

import styles from './VistaInicio.css';

const BADGE_CLASE = {
    Pendiente:   styles.badgePendiente,
    Entregada:   styles.badgeEntregada,
    'En progreso': styles.badgeEnProgreso,
};

const VistaInicio = ({ userId, misAulas, aulaIds, onNavigate }) => {

    const history = useHistory();

    const [tareas, setTareas]       = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [xpInfo, setXpInfo]       = useState({ nivel: 1, puntos_xp: 0 });
    const [cargando, setCargando]   = useState(true);

    useEffect(() => {
        if (!userId) return;
        cargarDatos();
    }, [userId, aulaIds]);

    const cargarDatos = async () => {
        setCargando(true);
        await Promise.all([cargarTareas(), cargarProyectos(), cargarXP()]);
        setCargando(false);
    };

    const cargarXP = async () => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('puntos_xp, nivel')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setXpInfo({ nivel: data.nivel || 1, puntos_xp: data.puntos_xp || 0 });
        }
    };

    const cargarTareas = async () => {
        if (!aulaIds || aulaIds.length === 0) {
            setTareas([]);
            return;
        }

        const [resTareas, resEntregas] = await Promise.all([
            supabase
                .from('tareas')
                .select('id, titulo, aula_id, fecha_limite')
                .in('aula_id', aulaIds)
                .order('fecha_limite', { ascending: true, nullsFirst: false }),
            supabase
                .from('entregas_proyectos')
                .select('tarea_id')
                .eq('estudiante_id', userId),
        ]);

        const entregaIds = new Set((resEntregas.data || []).map(e => e.tarea_id));
        const tareasConEstado = (resTareas.data || []).map(t => ({
            ...t,
            estado: entregaIds.has(t.id) ? 'Entregada' : 'Pendiente',
        }));

        setTareas(tareasConEstado.slice(0, 4));
    };

    const cargarProyectos = async () => {
        const { data, error } = await supabase
            .from('proyectos')
            .select('id, nombre, created_at')
            .eq('alumno_id', userId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (!error && data) {
            setProyectos(data);
        } else {
            console.error('[BLOCKIDS] Error cargando proyectos:', error);
            setProyectos([]);
        }
    };

    const formatFecha = (isoStr) => {
        if (!isoStr) return '';
        const diff = Math.floor((new Date() - new Date(isoStr)) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Ayer';
        if (diff < 7) return `Hace ${diff} días`;
        if (diff < 30) return `Hace ${Math.floor(diff / 7)} semana${Math.floor(diff / 7) > 1 ? 's' : ''}`;
        return `Hace ${Math.floor(diff / 30)} mes${Math.floor(diff / 30) > 1 ? 'es' : ''}`;
    };

    if (cargando) {
        return (
            <div className={styles.cargando}>
                <div className={styles.spinner} />
                <p>Cargando panel...</p>
            </div>
        );
    }

    const aulaActual = misAulas[0] || null;

    const irAProgramar = () => {
        if (puedeNavegar()) history.push('/entorno');
    };

    return (
        <div className={styles.dashContent}>

            {/* ── Hero: botón grande para ir al entorno de programación ── */}
            <div className={styles.heroProgramar}>
                <div className={styles.heroTexto}>
                    <span className={styles.heroKicker}>Tu taller de bloques te espera</span>
                    <h2 className={styles.heroTitulo}>¡Vamos a crear algo increíble!</h2>
                    <button
                        type="button"
                        className={styles.heroBtn}
                        onClick={irAProgramar}
                    >
                        ¡Ir a Programar!
                    </button>
                </div>
                <img src={xolotlBravo} alt="" className={styles.heroXolotl} />
            </div>

            {/* ── Fila 1: Mi(s) Aula(s) + Mis Logros ── */}
            <div className={styles.rowPrimary}>

                {/* Mi(s) Aula(s) */}
                <div className={styles.columnCard}>
                    <div className={styles.cardHeader}>
                        <img src={iconCurso} alt="" className={styles.cardHeaderIcon} />
                        <span className={styles.cardHeaderLabel}>
                            {misAulas.length > 1 ? 'Mis Aulas' : 'Mi Aula'}
                        </span>
                    </div>

                    {misAulas.length === 1 ? (
                        <>
                            <h2 className={styles.aulaNombre}>{aulaActual.nombre}</h2>
                            <div className={styles.aulaMetaRow}>
                                <div className={styles.aulaMetaItem}>
                                    <span className={styles.aulaMetaLabel}>Código</span>
                                    <span className={styles.aulaCodigo}>{aulaActual.codigo_aula}</span>
                                </div>
                            </div>
                            <button
                                className={styles.btnVerAula}
                                onClick={() => onNavigate('Muro', aulaActual.id)}
                            >
                                Ir al Muro
                            </button>
                        </>
                    ) : (
                        <div className={styles.aulasSlider}>
                            {misAulas.map(aula => (
                                <div key={aula.id} className={styles.aulaChip}>
                                    <span className={styles.aulaChipNombre}>{aula.nombre}</span>
                                    <span className={styles.aulaCodigo}>{aula.codigo_aula}</span>
                                    <button
                                        className={styles.btnVerAulaSmall}
                                        onClick={() => onNavigate('Muro', aula.id)}
                                    >
                                        Ir al Muro →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mis Logros */}
                <div className={`${styles.columnCard} ${styles.logrosCard}`}>
                    <div className={styles.cardHeader}>
                        <img src={iconFavorito} alt="" className={styles.cardHeaderIcon} />
                        <span className={styles.cardHeaderLabel}>Mis Logros</span>
                    </div>
                    <img src={xolotlGanador} alt="Xolotl ganador" width="80" className={styles.logrosXolotl} />
                    <p className={styles.nivelLabel}>Nivel {xpInfo.nivel}</p>
                    <div className={styles.xpBarWrap}>
                        <div className={styles.xpBar}>
                            <div
                                className={styles.xpFill}
                                style={{ width: `${Math.min(100, ((xpInfo.puntos_xp % 500) / 500) * 100)}%` }}
                            />
                        </div>
                        <span className={styles.xpTexto}>{xpInfo.puntos_xp % 500} / 500 XP</span>
                    </div>
                    <button className={styles.btnVerLogros} onClick={() => onNavigate('Logros')}>
                        Ver mis logros
                    </button>
                </div>
            </div>

            {/* ── Fila 2: Mis Tareas + Mis Proyectos ── */}
            <div className={styles.rowSecondary}>

                {/* Mis Tareas */}
                <div className={styles.columnCard}>
                    <div className={styles.cardHeader}>
                        <img src={iconCalendario} alt="" className={styles.cardHeaderIcon} />
                        <span className={styles.cardHeaderLabel}>Mis Tareas</span>
                    </div>

                    {tareas.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src={iconTareasVacio} alt="" className={styles.emptyEmoji} />
                            <p>No tienes tareas asignadas todavía.</p>
                        </div>
                    ) : (
                        <div className={styles.listaItems}>
                            {tareas.map(tarea => (
                                <div key={tarea.id} className={styles.itemRow}>
                                    <span className={styles.itemNombre}>{tarea.titulo}</span>
                                    <span className={`${styles.badge} ${BADGE_CLASE[tarea.estado] || styles.badgePendiente}`}>
                                        {tarea.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button className={styles.btnVerTodas} onClick={() => onNavigate('Mis Tareas')}>
                        + Ver Todas las Tareas
                    </button>
                </div>

                {/* Mis Proyectos Recientes */}
                <div className={styles.columnCard}>
                    <div className={styles.cardHeader}>
                        <img src={iconVideo} alt="" className={styles.cardHeaderIcon} />
                        <span className={styles.cardHeaderLabel}>Mis Proyectos Recientes</span>
                    </div>

                    {proyectos.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src={iconProyectosVacio} alt="" className={styles.emptyEmoji} />
                            <p>Aún no has creado proyectos.</p>
                        </div>
                    ) : (
                        <div className={styles.listaItems}>
                            {proyectos.map(p => (
                                <div key={p.id} className={styles.itemRow}>
                                    <img src={iconVideo} alt="" className={styles.proyectoIcon} />
                                    <div className={styles.proyectoInfo}>
                                        <span className={styles.itemNombre}>{p.nombre}</span>
                                        <span className={styles.proyectoFecha}>{formatFecha(p.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button className={styles.btnVerTodas} onClick={() => onNavigate('Mis Proyectos')}>
                        + Ver Todos mis Proyectos
                    </button>
                </div>
            </div>

            {/* ── Fila 3: Tip del Día (rotativo, cambia una vez por día) ── */}
            <div className={styles.tipBanner}>
                <img src={xolotlIdea} alt="Xolotl con idea" width="50" className={styles.tipXolotl} />
                <p className={styles.tipTexto}>
                    <strong>Tip del día:</strong> {tipDelDia()}
                </p>
                <div className={styles.tipDecos}>
                    <img src={bloqueAzul}      alt="" className={styles.tipBloque} />
                    <img src={bloqueAmarillo}  alt="" className={styles.tipBloque} />
                    <img src={bloqueMorado}    alt="" className={styles.tipBloque} />
                </div>
            </div>

        </div>
    );
};

export default VistaInicio;

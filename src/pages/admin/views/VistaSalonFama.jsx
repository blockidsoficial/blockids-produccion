import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaSalonFama.css';
import iconTrofeo from '../../../assets/iconos/icono-medalla-oro.svg';
import xolotlIdea from '../../../assets/xolotl/xolotl-idea.svg';

const CUPO_POR_ESCUELA = 3;

// Vista de aprobación del Salón de la Fama. admin_escuela solo ve/gestiona su
// propia escuela; superadmin ve todas, agrupadas, y puede cerrar la edición.
const VistaSalonFama = ({ perfil, esSuperAdmin, mostrarAlerta }) => {
    const [cargando, setCargando] = useState(true);
    const [edicion, setEdicion]   = useState(null);
    const [filas, setFilas]       = useState([]);
    const [procesando, setProcesando] = useState(null);
    const [cerrandoEdicion, setCerrandoEdicion] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);

        const { data: ed } = await supabase
            .from('salon_fama_ediciones')
            .select('id, titulo, fecha_inicio')
            .eq('activa', true)
            .maybeSingle();
        setEdicion(ed || null);

        if (!ed) {
            setFilas([]);
            setCargando(false);
            return;
        }

        let query = supabase
            .from('salon_fama')
            .select(`
                id, estado, escuela_id, created_at,
                entrega:entregas_proyectos(
                    id, thumbnail_url, likes, calificacion,
                    tarea:tareas(titulo),
                    alumno:perfiles!entregas_proyectos_estudiante_id_fkey(username)
                ),
                escuela:escuelas(nombre),
                profesor:perfiles!salon_fama_nominado_por_fkey(username)
            `)
            .eq('edicion_id', ed.id)
            .order('created_at', { ascending: false });

        if (!esSuperAdmin && perfil?.escuela_id) {
            query = query.eq('escuela_id', perfil.escuela_id);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[BLOCKIDS] Error cargando Salón de la Fama:', error);
            setFilas([]);
        } else {
            setFilas(data || []);
        }
        setCargando(false);
    }, [esSuperAdmin, perfil?.escuela_id]);

    useEffect(() => { cargar(); }, [cargar]);

    const revisar = async (fila, aprobar) => {
        setProcesando(fila.id);
        const { error } = await supabase.rpc('revisar_nominacion_salon_fama', {
            p_id: fila.id,
            p_aprobar: aprobar,
        });
        setProcesando(null);

        if (error) {
            mostrarAlerta?.('error', error.message || 'No se pudo actualizar la nominación.');
            return;
        }
        mostrarAlerta?.('success', aprobar ? '¡Proyecto aprobado! Ya es público.' : 'Nominación rechazada.');
        cargar();
    };

    const cerrarEdicion = async () => {
        if (!window.confirm('¿Cerrar esta edición? El podio actual queda guardado y empieza una nueva vacía.')) return;
        setCerrandoEdicion(true);
        const { error } = await supabase.rpc('cerrar_edicion_salon_fama');
        setCerrandoEdicion(false);

        if (error) {
            mostrarAlerta?.('error', error.message || 'No se pudo cerrar la edición.');
            return;
        }
        mostrarAlerta?.('success', 'Edición cerrada. Empezó una nueva.');
        cargar();
    };

    if (cargando) {
        return <div className={styles.cargando}>Cargando Salón de la Fama...</div>;
    }

    const porEscuela = {};
    filas.forEach(f => {
        const nombreEscuela = f.escuela?.nombre || 'Escuela';
        if (!porEscuela[nombreEscuela]) porEscuela[nombreEscuela] = [];
        porEscuela[nombreEscuela].push(f);
    });

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img src={iconTrofeo} alt="" className={styles.headerIcon} />
                    <div>
                        <h2 className={styles.titulo}>Salón de la Fama</h2>
                        <p className={styles.subtitulo}>
                            {edicion ? `${edicion.titulo} · máximo ${CUPO_POR_ESCUELA} trabajos aprobados por escuela` : 'Sin edición activa'}
                        </p>
                    </div>
                </div>
                {esSuperAdmin && edicion && (
                    <button type="button" className={styles.btnCerrarEdicion} onClick={cerrarEdicion} disabled={cerrandoEdicion}>
                        {cerrandoEdicion ? 'Cerrando...' : 'Cerrar edición'}
                    </button>
                )}
            </div>

            {filas.length === 0 ? (
                <div className={styles.emptyState}>
                    <img src={xolotlIdea} alt="" className={styles.xolotl} />
                    <h3 className={styles.emptyTitle}>Aún no hay nominaciones</h3>
                    <p className={styles.emptyDesc}>
                        Cuando un profesor nomine un proyecto de su clase, aparecerá aquí para tu revisión.
                    </p>
                </div>
            ) : (
                Object.entries(porEscuela).map(([nombreEscuela, filasEscuela]) => {
                    const aprobados = filasEscuela.filter(f => f.estado === 'aprobado').length;
                    return (
                        <div key={nombreEscuela} className={styles.escuelaBlock}>
                            {esSuperAdmin && (
                                <div className={styles.escuelaHeader}>
                                    <h3 className={styles.escuelaNombre}>{nombreEscuela}</h3>
                                    <span className={styles.cupoBadge}>{aprobados}/{CUPO_POR_ESCUELA} aprobados</span>
                                </div>
                            )}
                            {!esSuperAdmin && (
                                <p className={styles.cupoTexto}>{aprobados}/{CUPO_POR_ESCUELA} trabajos aprobados en esta edición</p>
                            )}
                            <div className={styles.grid}>
                                {filasEscuela.map(f => (
                                    <div key={f.id} className={styles.card}>
                                        <div
                                            className={styles.thumb}
                                            style={!f.entrega?.thumbnail_url ? { background: 'linear-gradient(135deg, #a569ff, #4D96FF)' } : undefined}
                                        >
                                            {f.entrega?.thumbnail_url && <img src={f.entrega.thumbnail_url} alt="" />}
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <p className={styles.proyectoNombre}>{f.entrega?.tarea?.titulo || 'Tarea'}</p>
                                            <p className={styles.meta}>
                                                @{f.entrega?.alumno?.username || 'alumno'} · nominado por @{f.profesor?.username || 'profesor'}
                                                {f.entrega?.calificacion != null && <> · Calificación: {f.entrega.calificacion}</>}
                                            </p>
                                            {f.entrega?.id && (
                                                <button
                                                    type="button"
                                                    className={styles.btnVer}
                                                    onClick={() => window.open(`/entorno?entregaId=${f.entrega.id}`, '_blank', 'noopener')}
                                                >
                                                    Ver proyecto
                                                </button>
                                            )}
                                            {f.estado === 'nominado' ? (
                                                <div className={styles.acciones}>
                                                    <button
                                                        type="button"
                                                        className={styles.btnAprobar}
                                                        disabled={procesando === f.id || aprobados >= CUPO_POR_ESCUELA}
                                                        title={aprobados >= CUPO_POR_ESCUELA ? 'Esta escuela ya alcanzó su cupo' : undefined}
                                                        onClick={() => revisar(f, true)}
                                                    >
                                                        ✓ Aprobar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.btnRechazar}
                                                        disabled={procesando === f.id}
                                                        onClick={() => revisar(f, false)}
                                                    >
                                                        ✕ Rechazar
                                                    </button>
                                                </div>
                                            ) : f.estado === 'aprobado' ? (
                                                <div className={styles.acciones}>
                                                    <span className={`${styles.badge} ${styles.badgeAprobado}`}>Aprobado</span>
                                                    <button
                                                        type="button"
                                                        className={styles.btnRevertir}
                                                        disabled={procesando === f.id}
                                                        onClick={() => revisar(f, false)}
                                                    >
                                                        Revertir
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`${styles.badge} ${styles.badgeRechazado}`}>Rechazado</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default VistaSalonFama;

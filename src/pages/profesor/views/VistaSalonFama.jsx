import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaSalonFama.css';
import iconTrofeo from '../../../assets/iconos/icono-medalla-oro.svg';
import xolotlIdea from '../../../assets/xolotl/xolotl-idea.svg';

const ESTADO_LABEL = {
    nominado:  { texto: 'Nominado, esperando revisión', clase: 'badgeNominado' },
    aprobado:  { texto: '¡En el Salón de la Fama!',      clase: 'badgeAprobado' },
    rechazado: { texto: 'No aprobado esta vez',          clase: 'badgeRechazado' },
};

// Vista del profesor: elige proyectos de sus propios alumnos (de cualquiera
// de sus aulas) para nominarlos al Salón de la Fama. La aprobación final la
// da el admin de la escuela (máx. 3 por escuela y edición).
const VistaSalonFama = ({ userId }) => {
    const [cargando, setCargando]   = useState(true);
    const [proyectos, setProyectos] = useState([]);
    const [nominaciones, setNominaciones] = useState({}); // proyecto_id -> fila de salon_fama
    const [edicionId, setEdicionId] = useState(null);
    const [nominando, setNominando] = useState(null); // id del proyecto en vuelo
    const [alerta, setAlerta]       = useState(null);

    const cargar = useCallback(async () => {
        if (!userId) return;
        setCargando(true);

        const { data: edicion } = await supabase
            .from('salon_fama_ediciones')
            .select('id')
            .eq('activa', true)
            .maybeSingle();
        setEdicionId(edicion?.id || null);

        const { data: aulas } = await supabase
            .from('aulas')
            .select('id')
            .eq('profesor_id', userId);
        const aulaIds = (aulas || []).map(a => a.id);

        if (aulaIds.length === 0) {
            setProyectos([]);
            setNominaciones({});
            setCargando(false);
            return;
        }

        const { data: aa } = await supabase
            .from('aula_alumnos')
            .select('alumno_id')
            .in('aula_id', aulaIds);
        const alumnoIds = [...new Set((aa || []).map(x => x.alumno_id))];

        if (alumnoIds.length === 0) {
            setProyectos([]);
            setNominaciones({});
            setCargando(false);
            return;
        }

        const { data: proys, error } = await supabase
            .from('proyectos')
            .select('id, nombre, thumbnail_url, likes, escuela_id, updated_at, alumno:perfiles!proyectos_alumno_id_fkey(username)')
            .in('alumno_id', alumnoIds)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[BLOCKIDS] Error cargando proyectos:', error);
            setProyectos([]);
            setCargando(false);
            return;
        }

        setProyectos(proys || []);

        if (edicion?.id && proys?.length) {
            const { data: noms } = await supabase
                .from('salon_fama')
                .select('proyecto_id, estado')
                .eq('edicion_id', edicion.id)
                .in('proyecto_id', proys.map(p => p.id));
            const mapa = {};
            (noms || []).forEach(n => { mapa[n.proyecto_id] = n; });
            setNominaciones(mapa);
        } else {
            setNominaciones({});
        }

        setCargando(false);
    }, [userId]);

    useEffect(() => { cargar(); }, [cargar]);

    const nominar = async (proyecto) => {
        if (!edicionId) {
            setAlerta({ tipo: 'error', texto: 'No hay una edición activa del Salón de la Fama en este momento.' });
            return;
        }
        setNominando(proyecto.id);
        setAlerta(null);

        const { error } = await supabase.from('salon_fama').insert({
            edicion_id: edicionId,
            proyecto_id: proyecto.id,
            escuela_id: proyecto.escuela_id,
            nominado_por: userId,
        });

        setNominando(null);

        if (error) {
            setAlerta({ tipo: 'error', texto: error.message || 'No se pudo nominar el proyecto.' });
            return;
        }

        setNominaciones(prev => ({ ...prev, [proyecto.id]: { proyecto_id: proyecto.id, estado: 'nominado' } }));
        setAlerta({ tipo: 'success', texto: `"${proyecto.nombre}" fue nominado. Un admin de tu escuela lo revisará.` });
    };

    if (cargando) {
        return <div className={styles.cargando}>Cargando proyectos...</div>;
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img src={iconTrofeo} alt="" className={styles.headerIcon} />
                    <div>
                        <h2 className={styles.titulo}>Salón de la Fama</h2>
                        <p className={styles.subtitulo}>
                            Nomina el mejor trabajo de tus alumnos. El admin de tu escuela aprueba hasta 3 por edición.
                        </p>
                    </div>
                </div>
            </div>

            {alerta && (
                <div className={`${styles.alerta} ${alerta.tipo === 'success' ? styles.alertaSuccess : styles.alertaError}`}>
                    {alerta.texto}
                </div>
            )}

            {proyectos.length === 0 ? (
                <div className={styles.emptyState}>
                    <img src={xolotlIdea} alt="" className={styles.xolotl} />
                    <h3 className={styles.emptyTitle}>Aún no hay proyectos para nominar</h3>
                    <p className={styles.emptyDesc}>
                        Cuando tus alumnos guarden proyectos en sus aulas, aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {proyectos.map(p => {
                        const nom = nominaciones[p.id];
                        const estado = nom ? ESTADO_LABEL[nom.estado] : null;
                        return (
                            <div key={p.id} className={styles.proyectoCard}>
                                <div
                                    className={styles.thumb}
                                    style={!p.thumbnail_url ? { background: 'linear-gradient(135deg, #a569ff, #4D96FF)' } : undefined}
                                >
                                    {p.thumbnail_url && <img src={p.thumbnail_url} alt="" />}
                                </div>
                                <div className={styles.proyectoInfo}>
                                    <p className={styles.proyectoNombre}>{p.nombre}</p>
                                    <p className={styles.proyectoAutor}>@{p.alumno?.username || 'alumno'}</p>
                                    {estado ? (
                                        <span className={`${styles.badge} ${styles[estado.clase]}`}>{estado.texto}</span>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.btnNominar}
                                            disabled={nominando === p.id}
                                            onClick={() => nominar(p)}
                                        >
                                            {nominando === p.id ? 'Nominando...' : '🏆 Nominar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VistaSalonFama;

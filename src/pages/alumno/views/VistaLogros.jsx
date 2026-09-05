import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaLogros.css';
import iconLogroDef from '../../../assets/iconos-ui/ui-favorito.svg';

const XP_POR_NIVEL = 500;

const VistaLogros = ({ userId }) => {
    const [perfil,       setPerfil]       = useState(null);
    const [logros,       setLogros]       = useState([]);
    const [misLogrosIds, setMisLogrosIds] = useState([]);
    const [cargando,     setCargando]     = useState(true);

    useEffect(() => {
        if (!userId) return;

        const cargar = async () => {
            setCargando(true);

            const [
                { data: perfilData },
                { data: logrosData },
                { data: misLogros  },
            ] = await Promise.all([
                supabase
                    .from('perfiles')
                    .select('puntos_xp, nivel')
                    .eq('id', userId)
                    .single(),
                supabase
                    .from('logros')
                    .select('id, nombre, descripcion, icono_url')
                    .order('nombre'),
                supabase
                    .from('usuario_logros')
                    .select('logro_id')
                    .eq('perfil_id', userId),
            ]);

            setPerfil(perfilData || { puntos_xp: 0, nivel: 1 });
            setLogros(logrosData || []);
            setMisLogrosIds((misLogros || []).map(r => r.logro_id));
            setCargando(false);
        };

        cargar();
    }, [userId]);

    if (cargando) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.spinnerWrap}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    const nivel      = perfil?.nivel     || 1;
    const xpTotal    = perfil?.puntos_xp || 0;
    const xpEnNivel  = xpTotal % XP_POR_NIVEL;
    const porcentaje = Math.min(100, Math.round((xpEnNivel / XP_POR_NIVEL) * 100));

    return (
        <div className={styles.wrapper}>

            {/* ── Header nivel / XP ── */}
            <div className={styles.headerNivel}>
                <div className={styles.nivelLeft}>
                    <span className={styles.nivelBadge}>Nivel {nivel}</span>
                    <span className={styles.xpTotal}>{xpTotal} XP totales</span>
                </div>
                <div className={styles.nivelRight}>
                    <span className={styles.logrosCount}>
                        {misLogrosIds.length} / {logros.length} logros
                    </span>
                </div>
                <div className={styles.barraContenedor}>
                    <div
                        className={styles.barraRelleno}
                        style={{ width: `${porcentaje}%` }}
                    />
                </div>
                <span className={styles.barraTxt}>
                    {xpEnNivel} / {XP_POR_NIVEL} XP para nivel {nivel + 1}
                </span>
            </div>

            {/* ── Grid de logros ── */}
            {logros.length === 0 ? (
                <p className={styles.vacio}>No hay logros configurados aún.</p>
            ) : (
                <div className={styles.gridLogros}>
                    {logros.map((logro, idx) => {
                        const desbloqueado = misLogrosIds.includes(logro.id);
                        return (
                            <div
                                key={logro.id}
                                className={`${styles.logroCard} ${
                                    desbloqueado ? styles.logroDesbloqueado : styles.logroBloqueado
                                }`}
                                style={{ animationDelay: `${idx * 0.04}s` }}
                            >
                                <img
                                    src={logro.icono_url || iconLogroDef}
                                    alt={logro.nombre}
                                    className={styles.logroIcono}
                                />
                                <h3 className={styles.logroNombre}>{logro.nombre}</h3>
                                {logro.descripcion && (
                                    <p className={styles.logroDesc}>{logro.descripcion}</p>
                                )}
                                <span className={`${styles.logroEstado} ${
                                    desbloqueado ? styles.estadoObtenido : styles.estadoBloqueado
                                }`}>
                                    {desbloqueado ? '¡Conseguido!' : 'Bloqueado'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
};

export default VistaLogros;

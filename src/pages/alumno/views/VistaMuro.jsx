import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaMuro.css';
import { desbloquearLogro } from '../../../services/gamificationService';

import xolotlIdea from '../../../assets/xolotl/xolotl-idea.svg';
import iconMuro   from '../../../assets/iconos-ui/ui-contacto.svg';

// ─────────────────────────────────────────────────────────────────────────────

const VistaMuro = ({ userId, misAulas, aulaInicial }) => {
    const [mensajes,         setMensajes]         = useState([]);
    const [cargando,         setCargando]         = useState(true);
    const [publicando,       setPublicando]       = useState(false);
    const [nuevoMensaje,     setNuevoMensaje]     = useState('');
    const [aulaSeleccionada, setAulaSeleccionada] = useState(
        aulaInicial || (misAulas && misAulas.length > 0 ? misAulas[0].id : null)
    );
    const [error, setError] = useState(null);

    // ── Cargar mensajes del aula seleccionada ─────────────────────────────────
    const cargarMensajes = useCallback(async () => {
        if (!aulaSeleccionada) { setCargando(false); return; }

        setCargando(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('mensajes_muro')
            .select(`
                id,
                autor_id,
                contenido,
                fecha_creacion,
                perfiles!autor_id (
                    nombre,
                    apellido_paterno,
                    username,
                    rol
                )
            `)
            .eq('aula_id', aulaSeleccionada)
            .order('fecha_creacion', { ascending: true });

        if (fetchError) {
            setError('No se pudieron cargar los mensajes. Intenta de nuevo.');
            setMensajes([]);
        } else {
            setMensajes(data || []);
        }

        setCargando(false);
    }, [aulaSeleccionada]);

    useEffect(() => { cargarMensajes(); }, [cargarMensajes]);

    // ── Publicar mensaje ──────────────────────────────────────────────────────
    const handlePublicar = async (e) => {
        e.preventDefault();
        const contenido = nuevoMensaje.trim();
        if (!contenido || !aulaSeleccionada || publicando) return;

        setPublicando(true);
        setError(null);

        const { error: insertError } = await supabase
            .from('mensajes_muro')
            .insert({
                aula_id:        aulaSeleccionada,
                autor_id:       userId,
                contenido,
                fecha_creacion: new Date().toISOString(),
            });

        setPublicando(false);

        if (insertError) {
            setError('No se pudo publicar el mensaje. Intenta de nuevo.');
            return;
        }

        await desbloquearLogro(userId, 'Rompehielos', 20);
        setNuevoMensaje('');
        cargarMensajes();
    };

    // ── Sin aulas ─────────────────────────────────────────────────────────────
    if (!misAulas || misAulas.length === 0) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.emptyState}>
                    <img src={xolotlIdea} alt="Sin aulas" className={styles.xolotl} />
                    <h2 className={styles.emptyTitle}>Aún no tienes clases</h2>
                    <p className={styles.emptyDesc}>
                        Únete a un aula primero para ver el muro de tu clase.
                    </p>
                </div>
            </div>
        );
    }

    const aulaNombreActual = misAulas.find(a => a.id === aulaSeleccionada)?.nombre || '';

    // ── Vista principal ───────────────────────────────────────────────────────
    return (
        <div className={styles.wrapper}>

            {/* ── Header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <div className={styles.headerIconWrap}>
                        <img src={iconMuro} alt="" width="22" height="22" />
                    </div>
                    <div>
                        <h2 className={styles.pageTitle}>Muro</h2>
                        <p className={styles.pageSubtitle}>{aulaNombreActual}</p>
                    </div>
                </div>

                {misAulas.length > 1 && (
                    <select
                        className={styles.filtroAula}
                        value={aulaSeleccionada}
                        onChange={e => setAulaSeleccionada(e.target.value)}
                    >
                        {misAulas.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* ── Mensajes (burbujas de chat) ── */}
            {cargando ? (
                <div className={styles.cargando}>
                    <div className={styles.spinner} />
                    <p>Cargando mensajes...</p>
                </div>
            ) : mensajes.length === 0 ? (
                <div className={styles.mensajesLista}>
                    <div className={styles.emptyState}>
                        <img src={xolotlIdea} alt="Sin mensajes" className={styles.xolotl} />
                        <h2 className={styles.emptyTitle}>El muro está vacío</h2>
                        <p className={styles.emptyDesc}>¡Sé el primero en escribir algo!</p>
                    </div>
                </div>
            ) : (
                <div className={styles.mensajesLista}>
                    {mensajes.map(m => {
                        const esMio      = m.autor_id === userId;
                        const esProfesor = !esMio && (
                            m.perfiles?.rol === 'profesor'
                            || m.perfiles?.rol === 'admin_escuela'
                            || m.perfiles?.rol === 'superadmin'
                            || m.perfiles?.rol === 'admin'
                        );

                        const clasesFila = `${styles.mensajeFila} ${esMio ? styles.filaMio : styles.filaOtro}`;
                        const clasesBurbuja = `${styles.burbuja} ${
                            esMio ? styles.burbujaMia
                            : esProfesor ? styles.burbujaProfesor
                            : styles.burbujaAlumno
                        }`;

                        return (
                            <div key={m.id} className={clasesFila}>
                                <div className={clasesBurbuja}>
                                    {!esMio && (
                                        <div className={styles.mensajeHeader}>
                                            <span className={styles.autorNombre}>
                                                {m.perfiles?.nombre} {m.perfiles?.apellido_paterno}
                                            </span>
                                            {esProfesor && (
                                                <span className={styles.badgeProfesor}>PROFESOR</span>
                                            )}
                                        </div>
                                    )}
                                    <p className={styles.mensajeContenido}>{m.contenido}</p>
                                    <span className={styles.mensajeFecha}>
                                        {new Date(m.fecha_creacion).toLocaleDateString('es-MX', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Error ── */}
            {error && <p className={styles.errorMsg}>{error}</p>}

            {/* ── Caja de publicación ── */}
            <div className={styles.cajaPublicacion}>
                <form onSubmit={handlePublicar} className={styles.publicarForm}>
                    <textarea
                        className={styles.mensajeInput}
                        placeholder="Escribe algo para tu clase..."
                        value={nuevoMensaje}
                        onChange={e => setNuevoMensaje(e.target.value)}
                        disabled={publicando}
                        rows={3}
                        maxLength={600}
                    />
                    <div className={styles.publicarFooter}>
                        <span className={styles.charCount}>{nuevoMensaje.length}/600</span>
                        <button
                            type="submit"
                            className={styles.btnPublicar}
                            disabled={publicando || !nuevoMensaje.trim()}
                        >
                            {publicando ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VistaMuro;

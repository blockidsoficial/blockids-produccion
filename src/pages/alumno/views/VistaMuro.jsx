import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaMuro.css';
import { celebrarLogrosNuevos } from '../../../services/gamificationService';

import xolotlIdea from '../../../assets/xolotl/xolotl-idea.svg';
import iconMuro from '../../../assets/iconos-ui/ui-contacto.svg';

const ROLES_STAFF = ['profesor', 'admin_escuela', 'superadmin', 'admin'];

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

const VistaMuro = ({ userId, misAulas, aulaInicial }) => {
    const [mensajes, setMensajes] = useState([]);
    const [nombresStaff, setNombresStaff] = useState({});
    const [cargando, setCargando] = useState(true);
    const [publicando, setPublicando] = useState(false);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [aulaSeleccionada, setAulaSeleccionada] = useState(
        aulaInicial || (misAulas && misAulas.length > 0 ? misAulas[0].id : null)
    );
    const [error, setError] = useState(null);

    const cargarMensajes = useCallback(async () => {
        if (!aulaSeleccionada) {
            setMensajes([]);
            setCargando(false);
            return;
        }

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

            const idsStaff = [...new Set(
                (data || [])
                    .filter(m => ROLES_STAFF.includes(m.perfiles?.rol))
                    .map(m => m.autor_id)
            )];

            if (idsStaff.length) {
                const { data: staff } = await supabase
                    .from('perfiles')
                    .select('id, nombre, apellido_paterno')
                    .in('id', idsStaff);

                const mapa = {};
                (staff || []).forEach(p => {
                    mapa[p.id] = [p.nombre, p.apellido_paterno].filter(Boolean).join(' ');
                });
                setNombresStaff(mapa);
            } else {
                setNombresStaff({});
            }
        }

        setCargando(false);
    }, [aulaSeleccionada]);

    useEffect(() => {
        cargarMensajes();
    }, [cargarMensajes]);

    const handlePublicar = async (e) => {
        e.preventDefault();
        const contenido = nuevoMensaje.trim();
        if (!contenido || !aulaSeleccionada || publicando) return;

        setPublicando(true);
        setError(null);

        const { error: insertError } = await supabase
            .from('mensajes_muro')
            .insert({
                aula_id: aulaSeleccionada,
                autor_id: userId,
                contenido,
                fecha_creacion: new Date().toISOString(),
            });

        setPublicando(false);

        if (insertError) {
            setError('No se pudo publicar el mensaje. Intenta de nuevo.');
            return;
        }

        setNuevoMensaje('');
        cargarMensajes();
        celebrarLogrosNuevos();
    };

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

    const aulaActual = misAulas.find(a => String(a.id) === String(aulaSeleccionada));
    const aulaNombreActual = aulaActual?.nombre || 'Tu aula';

    return (
        <div className={styles.wrapper}>
            <header className={styles.chatHeader}>
                <div className={styles.headerIdentity}>
                    <div className={styles.headerIconWrap}>
                        <img src={iconMuro} alt="" />
                    </div>
                    <div className={styles.headerText}>
                        <h2 className={styles.pageTitle}>Chat del aula</h2>
                        <p className={styles.pageSubtitle}>{aulaNombreActual}</p>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <span className={styles.chatStatus}>
                        <span className={styles.statusDot} />
                        Espacio de clase
                    </span>
                    {misAulas.length > 1 && (
                        <select
                            className={styles.filtroAula}
                            value={aulaSeleccionada || ''}
                            onChange={e => setAulaSeleccionada(e.target.value)}
                            aria-label="Seleccionar aula"
                        >
                            {misAulas.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    )}
                </div>
            </header>

            <section className={styles.chatPanel}>
                <div className={styles.chatIntro}>
                    <div>
                        <span className={styles.introEyebrow}>COMUNICACIÓN DEL GRUPO</span>
                        <h3>Conversación de clase</h3>
                        <p>Comparte dudas, ideas y mensajes con tu profesor y compañeros.</p>
                    </div>
                    <div className={styles.introIcon}>💬</div>
                </div>

                <div className={styles.mensajesLista} aria-live="polite">
                    {cargando ? (
                        <div className={styles.cargando}>
                            <div className={styles.spinner} />
                            <p>Cargando conversación...</p>
                        </div>
                    ) : mensajes.length === 0 ? (
                        <div className={styles.emptyChat}>
                            <img src={xolotlIdea} alt="" className={styles.xolotl} />
                            <h3>¡Comiencen la conversación!</h3>
                            <p>Aún no hay mensajes en esta aula. Puedes escribir el primero.</p>
                        </div>
                    ) : (
                        mensajes.map((m, index) => {
                            const esMio = m.autor_id === userId;
                            const esProfesor = ROLES_STAFF.includes(m.perfiles?.rol);
                            const nombreAutor = esMio
                                ? 'Tú'
                                : esProfesor && nombresStaff[m.autor_id]
                                    ? nombresStaff[m.autor_id]
                                    : `@${m.perfiles?.username || 'alumno'}`;
                            const fechaActual = formatearFecha(m.fecha_creacion);
                            const fechaAnterior = index > 0
                                ? formatearFecha(mensajes[index - 1].fecha_creacion)
                                : null;
                            const mostrarFecha = fechaActual !== fechaAnterior;

                            return (
                                <React.Fragment key={m.id}>
                                    {mostrarFecha && (
                                        <div className={styles.dateDivider}>
                                            <span>{fechaActual}</span>
                                        </div>
                                    )}
                                    <div className={`${styles.mensajeFila} ${esMio ? styles.filaMio : styles.filaOtro}`}>
                                        {!esMio && (
                                            <div className={`${styles.avatarMensaje} ${esProfesor ? styles.avatarProfesor : ''}`}>
                                                {obtenerIniciales(nombreAutor.replace('@', ''))}
                                            </div>
                                        )}
                                        <div className={`${styles.burbuja} ${esMio ? styles.burbujaMia : esProfesor ? styles.burbujaProfesor : styles.burbujaAlumno}`}>
                                            {!esMio && (
                                                <div className={styles.mensajeHeader}>
                                                    <span className={styles.autorNombre}>{nombreAutor}</span>
                                                    {esProfesor && <span className={styles.badgeProfesor}>PROFESOR</span>}
                                                </div>
                                            )}
                                            <p className={styles.mensajeContenido}>{m.contenido}</p>
                                            <span className={styles.mensajeFecha}>
                                                {new Date(m.fecha_creacion).toLocaleTimeString('es-MX', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })
                    )}
                </div>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <form onSubmit={handlePublicar} className={styles.composer}>
                    <textarea
                        className={styles.mensajeInput}
                        placeholder="Escribe un mensaje para tu clase..."
                        value={nuevoMensaje}
                        onChange={e => setNuevoMensaje(e.target.value)}
                        disabled={publicando}
                        rows={2}
                        maxLength={600}
                    />
                    <div className={styles.composerFooter}>
                        <span className={styles.charCount}>{nuevoMensaje.length}/600 · Enter para escribir</span>
                        <button
                            type="submit"
                            className={styles.btnPublicar}
                            disabled={publicando || !nuevoMensaje.trim()}
                        >
                            {publicando ? 'Enviando...' : 'Enviar mensaje'}
                            <span aria-hidden="true">➤</span>
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default VistaMuro;

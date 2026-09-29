import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabaseClient';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Navbar from '../landing/Navbar.jsx';
import Footer from '../landing/Footer.jsx';
import styles from './ProyectosPublicos.css';

import xolotlGanador from '../../assets/xolotl/xolotl-ganador.svg';
import xolotlIdea    from '../../assets/xolotl/xolotl-sorprendido.svg';
import medallaOro    from '../../assets/iconos/icono-medalla-oro.svg';
import medallaPlata  from '../../assets/iconos/icono-medalla-plata.svg';
import medallaCobre  from '../../assets/iconos/icono-medalla-cobre.svg';
import medallaEspecial from '../../assets/iconos/icono-medalla-especial.svg';
import proyectoPlaceholder from '../../assets/iconos/icono-proyecto-placeholder.svg';
import iconoLike     from '../../assets/iconos/icono-like.svg';

// ─────────────────────────────────────────────────────────────────────────────

// Proyectos de demostración con información detallada
const PROYECTOS_DEMO = [
    {
        id: 'demo-1',
        nombre: 'Aventura Espacial con Xolotl',
        username: 'mateo_coder',
        escuela_nombre: 'Colegio Robótica Pro',
        descripcion: 'Un divertido juego de esquivar asteroides en el espacio usando las flechas del teclado. ¡Consigue la puntuación más alta!',
        instrucciones: 'Presiona Flecha Arriba y Abajo para mover a Xolotl. Evita los meteoritos.',
        likes: 24,
        thumbnail_url: null,
        imagenes: []
    },
    {
        id: 'demo-2',
        nombre: 'Calculadora de Bloques',
        username: 'sofia_dev',
        escuela_nombre: 'Instituto Innovación',
        descripcion: 'Herramienta interactiva para sumar, restar y multiplicar números creada 100% con bloques.',
        instrucciones: 'Ingresa los dos números y haz clic en la operación que deseas realizar.',
        likes: 18,
        thumbnail_url: null,
        imagenes: []
    },
    {
        id: 'demo-3',
        nombre: 'Carrera de Obstáculos 2D',
        username: 'lucas_game',
        escuela_nombre: 'Escuela Primaria Central',
        descripcion: 'Juego de plataformas donde debes saltar obstáculos y llegar a la meta antes de que se agote el tiempo.',
        instrucciones: 'Usa la barra espaciadora para saltar.',
        likes: 12,
        thumbnail_url: null,
        imagenes: []
    },
];

const GRUPOS_ESCUELA_DEMO = [
    {
        escuela: 'Colegio Robótica Pro',
        proyectos: [
            {
                id: 'demo-4',
                nombre: 'Laberinto Mágico',
                username: 'valeria_b',
                escuela_nombre: 'Colegio Robótica Pro',
                descripcion: 'Encuentra la salida del laberinto sin tocar las paredes rojas.',
                instrucciones: 'Mueve el personaje con el ratón.',
                likes: 9,
                thumbnail_url: null,
                imagenes: []
            },
        ],
    },
    {
        escuela: 'Instituto Innovación',
        proyectos: [
            {
                id: 'demo-5',
                nombre: 'Ahuizotl vs Xolotl',
                username: 'carlos_99',
                escuela_nombre: 'Instituto Innovación',
                descripcion: 'Un juego de batalla por turnos inspirado en leyendas aztecas.',
                instrucciones: 'Elige tu ataque haciendo clic en los botones de acción.',
                likes: 7,
                thumbnail_url: null,
                imagenes: []
            },
        ],
    },
];

const rutaDashboard = (rol) => {
    switch (rol) {
        case 'superadmin':
        case 'admin_escuela': return '/admin?vista=proyectos';
        case 'profesor':      return '/profesor?vista=proyectos';
        case 'alumno':        return '/alumno?vista=proyectos';
        default:              return '/login';
    }
};

const MEDALLAS = [medallaOro, medallaPlata, medallaCobre];

const DEGRADADOS_PLACEHOLDER = [
    'linear-gradient(135deg, #a569ff 0%, #4D96FF 100%)',
    'linear-gradient(135deg, #ff4fd8 0%, #FF9A3C 100%)',
    'linear-gradient(135deg, #6BCB77 0%, #4D96FF 100%)',
];

const claveLike = (idProyecto) => `bk_like_proyecto_${idProyecto}`;

const yaDioLike = (idProyecto) => {
    try {
        return window.localStorage.getItem(claveLike(idProyecto)) === '1';
    } catch (_) {
        return false;
    }
};

// Tarjeta de proyecto
const TarjetaProyecto = ({ proyecto, medalla, degradado, onLike, onVer, style }) => {
    const yaLiked = yaDioLike(proyecto.id);
    const autor = proyecto.username || 'anónimo';

    return (
        <article className={styles.card} style={style}>
            {medalla && <img src={medalla} alt="" className={styles.medalla} />}

            <div
                className={styles.thumb}
                style={!proyecto.thumbnail_url ? { background: degradado } : undefined}
            >
                {proyecto.thumbnail_url ? (
                    <img src={proyecto.thumbnail_url} alt={proyecto.nombre || 'Proyecto destacado'} className={styles.thumbImg} />
                ) : (
                    <img src={proyectoPlaceholder} alt="" className={styles.thumbPlaceholder} />
                )}
            </div>

            <div className={styles.cardBody}>
                <h3 className={styles.cardNombre} title={proyecto.nombre}>
                    {proyecto.nombre || 'Proyecto sin título'}
                </h3>
                <p className={styles.cardAutor}>
                    @{autor}{proyecto.escuela_nombre && <> · {proyecto.escuela_nombre}</>}
                </p>

                <div className={styles.cardFooter}>
                  <Link
    to={`/proyectos/${proyecto.id}`}
    className={styles.btnVer}
>
    Ver detalle
</Link>

                    {/* Abre el modal de detalle (no existe una ruta /proyectos/:id) */}
                    <button type="button" className={styles.btnVer} onClick={() => onVer(proyecto)}>
                        Ver detalle
                    </button>
                </div>
            </div>
        </article>
    );
};

TarjetaProyecto.propTypes = {
    proyecto: PropTypes.object.isRequired,
    medalla: PropTypes.string,
    degradado: PropTypes.string,
    onLike: PropTypes.func.isRequired,
    onVer: PropTypes.func.isRequired,
    style: PropTypes.object,
};

// ─────────────────────────────────────────────────────────────────────────────

const ProyectosPublicos = ({ session, rolPerfil }) => {
    useDocumentTitle('Proyectos Destacados');

    const history = useHistory();
    const urlDashboard = session ? rutaDashboard(rolPerfil) : '/registro';

    const [proyectos, setProyectos] = useState([]);
    const [porEscuela, setPorEscuela] = useState([]);
    const [cargando, setCargando]   = useState(true);
    const [error, setError]         = useState(false);

    const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

    // Histórico de ediciones
    const [ediciones, setEdiciones] = useState([]);
    const [edicionId, setEdicionId] = useState(null);
    const edicionActual = ediciones.find(e => e.id === edicionId) || ediciones.find(e => e.activa);

    useEffect(() => {
        let vivo = true;
        supabase.rpc('obtener_ediciones_salon_fama').then(({ data, error: errorEdiciones }) => {
            if (!vivo) return;
            if (errorEdiciones) {
                console.error('[BLOCKIDS] Error cargando ediciones del Salón de la Fama:', errorEdiciones);
                return;
            }
            setEdiciones(data || []);
        });
        return () => { vivo = false; };
    }, []);

    useEffect(() => {
        let vivo = true;

        const cargar = async () => {
            setCargando(true);
            setError(false);

            const [podio, todosAprobados] = await Promise.all([
                supabase.rpc('obtener_podio_salon_fama', { p_edicion_id: edicionId }),
                supabase.rpc('obtener_top_por_escuela_salon_fama', { p_edicion_id: edicionId }),
            ]);

            if (!vivo) return;

            if (podio.error || todosAprobados.error) {
                console.error('[BLOCKIDS] Error cargando el Salón de la Fama:', podio.error || todosAprobados.error);
                setProyectos(PROYECTOS_DEMO);
                setPorEscuela(GRUPOS_ESCUELA_DEMO);
                setCargando(false);
                return;
            }

            const podioData = podio.data || [];
            const todosData = todosAprobados.data || [];

            if (podioData.length === 0 && todosData.length === 0) {
                setProyectos(PROYECTOS_DEMO);
                setPorEscuela(GRUPOS_ESCUELA_DEMO);
            } else {
                setProyectos(podioData);

                const idsEnPodio = new Set(podioData.map(p => p.id));
                const grupos = [];
                todosData.forEach(p => {
                    if (idsEnPodio.has(p.id)) return;
                    let grupo = grupos.find(g => g.escuela === p.escuela_nombre);
                    if (!grupo) {
                        grupo = { escuela: p.escuela_nombre, proyectos: [] };
                        grupos.push(grupo);
                    }
                    grupo.proyectos.push(p);
                });
                setPorEscuela(grupos);
            }

            setCargando(false);
        };

        cargar();
        return () => { vivo = false; };
    }, [edicionId]);

    const actualizarLikesEnEstado = (proyectoId, likes) => {
        setProyectos(prev => prev.map(p => (p.id === proyectoId ? { ...p, likes } : p)));
        setPorEscuela(prev => prev.map(g => ({
            ...g,
            proyectos: g.proyectos.map(p => (p.id === proyectoId ? { ...p, likes } : p)),
        })));
        if (proyectoSeleccionado && proyectoSeleccionado.id === proyectoId) {
            setProyectoSeleccionado(prev => ({ ...prev, likes }));
        }
    };

    const handleLike = async (proyecto) => {
        if (yaDioLike(proyecto.id)) return;

        actualizarLikesEnEstado(proyecto.id, (proyecto.likes || 0) + 1);
        try {
            window.localStorage.setItem(claveLike(proyecto.id), '1');
        } catch (_) {}

        if (!String(proyecto.id).startsWith('demo-')) {
            const { data: likesReales, error: errorLike } = await supabase
                .rpc('dar_like_entrega', { p_entrega_id: proyecto.id });

            if (errorLike) {
                console.error('[BLOCKIDS] Error registrando like:', errorLike);
                return;
            }

            if (typeof likesReales === 'number') {
                actualizarLikesEnEstado(proyecto.id, likesReales);
            }
        }
    };

    const abrirEnEditor = (proyectoId) => {
        history.push(`/entorno?entregaId=${proyectoId}`);
    };

    const sinResultados = !cargando && !error && proyectos.length === 0 && porEscuela.length === 0;

    return (
        <div className={styles.pagina}>
            <Navbar urlDashboard={urlDashboard} />

            {/* ══════════ HERO ══════════ */}
            <section className={styles.hero}>
                <div className={styles.heroContenido}>
                    <img src={xolotlGanador} alt="Xolotl con trofeo" className={styles.heroXolotl} />
                    <div>
                        <span className={styles.heroEyebrow}>Top 3 de la comunidad</span>
                        <h1 className={styles.heroTitulo}>Salón de la Fama Blockids</h1>
                        <p className={styles.heroDesc}>
                            Los proyectos más queridos por la comunidad, creados por estudiantes como tú. ¡Dales like a tus favoritos!
                        </p>
                    </div>
                </div>
            </section>

            {/* ══════════ SELECTOR DE EDICIÓN ══════════ */}
            {ediciones.length > 1 && (
                <section className={styles.contenido} style={{ paddingBottom: 0 }}>
                    <div className={styles.container}>
                        <div className={styles.edicionSelector}>
                            <label htmlFor="sf-edicion" className={styles.edicionLabel}>Edición:</label>
                            <select
                                id="sf-edicion"
                                className={styles.edicionSelect}
                                value={edicionId || ''}
                                onChange={e => setEdicionId(e.target.value || null)}
                            >
                                {ediciones.map(ed => (
                                    <option key={ed.id} value={ed.activa ? '' : ed.id}>
                                        {ed.titulo}{ed.activa ? ' (actual)' : ''}
                                    </option>
                                ))}
                            </select>
                            {edicionActual && !edicionActual.activa && (
                                <span className={styles.edicionCerradaTag}>Edición cerrada — podio histórico</span>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════ TOP 3 ══════════ */}
            <section className={styles.contenido}>
                <div className={styles.container}>

                    {cargando && (
                        <>
                            <p className={styles.estadoTexto}>Cargando proyectos destacados...</p>
                            <div className={styles.grid}>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className={styles.cardSkeleton}>
                                        <div className={styles.skeletonThumb} />
                                        <div className={styles.skeletonLinea} />
                                        <div className={styles.skeletonLineaCorta} />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!cargando && error && (
                        <div className={styles.estadoVacio}>
                            <img src={xolotlIdea} alt="" className={styles.estadoXolotl} />
                            <h2 className={styles.estadoTitulo}>No pudimos cargar los proyectos</h2>
                            <p className={styles.estadoDesc}>Aún no hay proyectos destacados.</p>
                        </div>
                    )}

                    {sinResultados && (
                        <div className={styles.estadoVacio}>
                            <img src={xolotlIdea} alt="" className={styles.estadoXolotl} />
                            <h2 className={styles.estadoTitulo}>Aún no hay proyectos destacados</h2>
                            <p className={styles.estadoDesc}>
                                El Top 3 aparecerá aquí.
                            </p>
                        </div>
                    )}

                    {!cargando && !error && proyectos.length > 0 && (
                        <div className={styles.grid}>
                            {proyectos.map((proyecto, idx) => (
                                <TarjetaProyecto
                                    key={proyecto.id}
                                    proyecto={proyecto}
                                    medalla={MEDALLAS[idx] || medallaEspecial}
                                    degradado={DEGRADADOS_PLACEHOLDER[idx % DEGRADADOS_PLACEHOLDER.length]}
                                    onLike={handleLike}
                                    onVer={setProyectoSeleccionado}
                                    style={{ animationDelay: `${idx * 0.08}s` }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ══════════ POR ESCUELA ══════════ */}
            {!cargando && !error && porEscuela.length > 0 && (
                <section className={styles.contenido}>
                    <div className={styles.container}>
                        <h2 className={styles.seccionTitulo}>Destacados por escuela</h2>
                        {porEscuela.map(grupo => (
                            <div key={grupo.escuela} className={styles.escuelaGrupo}>
                                <h3 className={styles.escuelaNombre}>{grupo.escuela}</h3>
                                <div className={styles.grid}>
                                    {grupo.proyectos.map((proyecto, idx) => (
                                        <TarjetaProyecto
                                            key={proyecto.id}
                                            proyecto={proyecto}
                                            degradado={DEGRADADOS_PLACEHOLDER[idx % DEGRADADOS_PLACEHOLDER.length]}
                                            onLike={handleLike}
                                            onVer={setProyectoSeleccionado}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ══════════ MODAL DE DETALLES DEL PROYECTO ══════════ */}
            {proyectoSeleccionado && (
                <div className={styles.modalOverlay} onClick={() => setProyectoSeleccionado(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.modalCerrar} onClick={() => setProyectoSeleccionado(null)}>
                            &times;
                        </button>

                        <div className={styles.modalGrid}>
                            {/* Galería de imágenes e imagen principal */}
                            <div className={styles.modalImagenWrapper}>
                                {proyectoSeleccionado.thumbnail_url ? (
                                    <img
                                        src={proyectoSeleccionado.thumbnail_url}
                                        alt={proyectoSeleccionado.nombre}
                                        className={styles.modalImagen}
                                    />
                                ) : (
                                    <div
                                        className={styles.modalImagenPlaceholder}
                                        style={{ background: DEGRADADOS_PLACEHOLDER[0] }}
                                    >
                                        <img src={proyectoPlaceholder} alt="" />
                                    </div>
                                )}

                                {proyectoSeleccionado.imagenes && proyectoSeleccionado.imagenes.length > 0 && (
                                    <div className={styles.galeriaThumbs}>
                                        {proyectoSeleccionado.imagenes.map((imgUrl, i) => (
                                            <img key={i} src={imgUrl} alt={`Captura ${i + 1}`} className={styles.galeriaThumb} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Información detallada del proyecto */}
                            <div className={styles.modalInfo}>
                                <h2 className={styles.modalTitulo}>{proyectoSeleccionado.nombre}</h2>
                                <p className={styles.modalAutor}>
                                    Creado por: <strong>@{proyectoSeleccionado.username || 'anónimo'}</strong>
                                </p>
                                {proyectoSeleccionado.escuela_nombre && (
                                    <p className={styles.modalEscuela}>
                                        Escuela: <span>{proyectoSeleccionado.escuela_nombre}</span>
                                    </p>
                                )}

                                <div className={styles.modalSeccion}>
                                    <h4>Descripción del proyecto</h4>
                                    <p>{proyectoSeleccionado.descripcion || 'Sin descripción disponible.'}</p>
                                </div>

                                {proyectoSeleccionado.instrucciones && (
                                    <div className={styles.modalSeccion}>
                                        <h4>Instrucciones / Cómo jugar</h4>
                                        <p>{proyectoSeleccionado.instrucciones}</p>
                                    </div>
                                )}

                                <div className={styles.modalAcciones}>
                                    <button
                                        type="button"
                                        className={`${styles.btnLike} ${yaDioLike(proyectoSeleccionado.id) ? styles.btnLikeActivo : ''}`}
                                        onClick={() => handleLike(proyectoSeleccionado)}
                                        disabled={yaDioLike(proyectoSeleccionado.id)}
                                    >
                                        <img src={iconoLike} alt="" className={styles.likeIcon} />
                                        <span>{proyectoSeleccionado.likes || 0} Likes</span>
                                    </button>

                                    {/* Los proyectos demo no tienen una entrega real que abrir */}
                                    {!String(proyectoSeleccionado.id).startsWith('demo-') && (
                                        <button
                                            type="button"
                                            className={styles.btnAbrirEditor}
                                            onClick={() => abrirEnEditor(proyectoSeleccionado.id)}
                                        >
                                            Abrir en el editor 🎮
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

ProyectosPublicos.propTypes = {
    session: PropTypes.object,
    rolPerfil: PropTypes.string,
};

export default ProyectosPublicos;
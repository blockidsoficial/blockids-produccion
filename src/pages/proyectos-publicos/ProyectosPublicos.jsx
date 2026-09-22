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

const rutaDashboard = (rol) => {
    switch (rol) {
        case 'superadmin':
        case 'admin_escuela': return '/admin?vista=proyectos';
        case 'profesor':      return '/profesor?vista=proyectos';
        case 'alumno':        return '/alumno?vista=proyectos';
        default:              return '/login';
    }
};

// Medalla por puesto (1º, 2º, 3º) — si algún día se piden más de 3, el resto
// cae en la estrella genérica en vez de romperse.
const MEDALLAS = [medallaOro, medallaPlata, medallaCobre];

// Degradados de respaldo cuando el proyecto no tiene thumbnail_url, uno por
// puesto para que el Top 3 no se vea repetido.
const DEGRADADOS_PLACEHOLDER = [
    'linear-gradient(135deg, #a569ff 0%, #4D96FF 100%)',
    'linear-gradient(135deg, #ff4fd8 0%, #FF9A3C 100%)',
    'linear-gradient(135deg, #6BCB77 0%, #4D96FF 100%)',
];

// Un visitante solo puede dar like una vez por proyecto en este navegador
// (no hay tabla de "quién le dio like a qué", así que se controla del lado
// del cliente — suficiente para una vitrina pública, no es un conteo a prueba
// de manipulación).
const claveLike = (idProyecto) => `bk_like_proyecto_${idProyecto}`;

const yaDioLike = (idProyecto) => {
    try {
        return window.localStorage.getItem(claveLike(idProyecto)) === '1';
    } catch (_) {
        return false;
    }
};

// Tarjeta de proyecto reutilizada tanto en el podio general (con medalla)
// como en el bloque "por escuela" (sin medalla).
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
                    <button
                        type="button"
                        className={`${styles.btnLike} ${yaLiked ? styles.btnLikeActivo : ''}`}
                        onClick={() => onLike(proyecto)}
                        disabled={yaLiked}
                        aria-pressed={yaLiked}
                        title={yaLiked ? 'Ya diste like a este proyecto' : 'Me gusta'}
                    >
                        <img src={iconoLike} alt="" className={styles.likeIcon} />
                        <span>{proyecto.likes || 0}</span>
                    </button>

                    <button type="button" className={styles.btnVer} onClick={() => onVer(proyecto)}>
                        Ver proyecto
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
    const [porEscuela, setPorEscuela] = useState([]); // [{ escuela, proyectos: [...] }]
    const [cargando, setCargando]   = useState(true);
    const [error, setError]         = useState(false);

    useEffect(() => {
        let vivo = true;

        const cargar = async () => {
            setCargando(true);
            setError(false);

            // RPCs en vez de .select('*, perfiles(username)'): un SELECT directo
            // sobre `perfiles`/`escuelas` obligaría a abrir esas tablas a `anon`
            // (nombre, apellidos, correo de contacto de menores...). Ambas solo
            // devuelven username/nombre de escuela. El podio general sale de
            // obtener_podio_salon_fama (top 3 entre TODAS las escuelas, ya
            // aprobados por el admin — ver migración salon_fama); el bloque de
            // abajo agrupa el resultado de obtener_top_por_escuela_salon_fama
            // por escuela en el cliente.
            const [podio, todosAprobados] = await Promise.all([
                supabase.rpc('obtener_podio_salon_fama'),
                supabase.rpc('obtener_top_por_escuela_salon_fama'),
            ]);

            if (!vivo) return;

            if (podio.error || todosAprobados.error) {
                console.error('[BLOCKIDS] Error cargando el Salón de la Fama:', podio.error || todosAprobados.error);
                setError(true);
                setProyectos([]);
                setPorEscuela([]);
                setCargando(false);
                return;
            }

            setProyectos(podio.data || []);

            // Agrupar por escuela (el RPC ya viene ordenado por escuela, likes desc)
            // y quitar del bloque "por escuela" los que ya salen en el podio general,
            // para no repetir la misma tarjeta dos veces en la página.
            const idsEnPodio = new Set((podio.data || []).map(p => p.id));
            const grupos = [];
            (todosAprobados.data || []).forEach(p => {
                if (idsEnPodio.has(p.id)) return;
                let grupo = grupos.find(g => g.escuela === p.escuela_nombre);
                if (!grupo) {
                    grupo = { escuela: p.escuela_nombre, proyectos: [] };
                    grupos.push(grupo);
                }
                grupo.proyectos.push(p);
            });
            setPorEscuela(grupos);

            setCargando(false);
        };

        cargar();
        return () => { vivo = false; };
    }, []);

    // ── Me gusta: optimista en pantalla, persistido en BD, 1 vez por navegador ──
    // Actualiza el proyecto tanto en el podio general como en el bloque por
    // escuela, dondequiera que esté la tarjeta.
    const actualizarLikesEnEstado = (proyectoId, likes) => {
        setProyectos(prev => prev.map(p => (p.id === proyectoId ? { ...p, likes } : p)));
        setPorEscuela(prev => prev.map(g => ({
            ...g,
            proyectos: g.proyectos.map(p => (p.id === proyectoId ? { ...p, likes } : p)),
        })));
    };

    const handleLike = async (proyecto) => {
        if (yaDioLike(proyecto.id)) return;

        // Optimista: refleja el +1 de inmediato en pantalla.
        actualizarLikesEnEstado(proyecto.id, (proyecto.likes || 0) + 1);
        try {
            window.localStorage.setItem(claveLike(proyecto.id), '1');
        } catch (_) { /* modo privado / storage bloqueado: el like igual se cuenta esta vez */ }

        // Persistido: RPC que solo puede sumar +1 a `likes` de un proyecto
        // público puntual (atómico, sin condición de carrera con otras
        // visitas simultáneas). Un UPDATE directo requeriría un policy que
        // dejaría reescribir nombre/thumbnail_url/es_publico de cualquier
        // proyecto ajeno. Ver sql/proyectos_publicos_policies.sql.
        const { data: likesReales, error: errorLike } = await supabase
            .rpc('dar_like_entrega', { p_entrega_id: proyecto.id });

        if (errorLike) {
            console.error('[BLOCKIDS] Error registrando like:', errorLike);
            return;
        }

        // Sincroniza con el valor real del servidor, por si alguien más le
        // dio like al mismo tiempo.
        if (typeof likesReales === 'number') {
            actualizarLikesEnEstado(proyecto.id, likesReales);
        }
    };

    const verProyecto = (proyecto) => {
        // `proyecto.id` aquí es el id de la entrega nominada (ver
        // obtener_podio_salon_fama / obtener_top_por_escuela_salon_fama).
        // Nota: /entorno exige sesión iniciada — un visitante sin cuenta
        // rebota a /login en vez de ver el proyecto (limitación previa, no
        // introducida aquí).
        history.push(`/entorno?entregaId=${proyecto.id}`);
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
                                el Top 3 aparecerá aquí.
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
                                    onVer={verProyecto}
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
                                            onVer={verProyecto}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
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

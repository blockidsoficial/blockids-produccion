import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabaseClient';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Navbar from '../landing/Navbar.jsx';
import Footer from '../landing/Footer.jsx';
import './ProyectosPublicos.css';

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

const MEDALLAS = [medallaOro, medallaPlata, medallaCobre];

// Clases CSS directas para el Top 3
const MARCOS_TOP3 = ['marco-oro', 'marco-plata', 'marco-bronce'];

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

const TarjetaProyecto = ({ proyecto, medalla, degradado, onLike, onVer, style, marcoClase }) => {
    const yaLiked = yaDioLike(proyecto.id);
    const autor = proyecto.username || 'anónimo';

    return (
        <article className={`card ${marcoClase || ''}`} style={style}>
            {medalla && <img src={medalla} alt="" className="medalla" />}

            <div
                className="thumb"
                style={!proyecto.thumbnail_url ? { background: degradado } : undefined}
            >
                {proyecto.thumbnail_url ? (
                    <img src={proyecto.thumbnail_url} alt={proyecto.nombre || 'Proyecto destacado'} className="thumbImg" />
                ) : (
                    <img src={proyectoPlaceholder} alt="" className="thumbPlaceholder" />
                )}
            </div>

            <div className="cardBody">
                <h3 className="cardNombre" title={proyecto.nombre}>
                    {proyecto.nombre || 'Proyecto sin título'}
                </h3>
                <p className="cardAutor">
                    @{autor}{proyecto.escuela_nombre && <> · {proyecto.escuela_nombre}</>}
                </p>

                <div className="cardFooter">
                    <button
                        type="button"
                        className={`btnLike ${yaLiked ? 'btnLikeActivo' : ''}`}
                        onClick={() => onLike(proyecto)}
                        disabled={yaLiked}
                        aria-pressed={yaLiked}
                        title={yaLiked ? 'Ya diste like a este proyecto' : 'Me gusta'}
                    >
                        <img src={iconoLike} alt="" className="likeIcon" />
                        <span>{proyecto.likes || 0}</span>
                    </button>

                    <button type="button" className="btnVer" onClick={() => onVer(proyecto)}>
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
    marcoClase: PropTypes.string,
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

    const [ediciones, setEdiciones]       = useState([]);
    const [edicionId, setEdicionId]       = useState(null);
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
                setError(true);
                setProyectos([]);
                setPorEscuela([]);
                setCargando(false);
                return;
            }

            setProyectos(podio.data || []);

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
    }, [edicionId]);

    const actualizarLikesEnEstado = (proyectoId, likes) => {
        setProyectos(prev => prev.map(p => (p.id === proyectoId ? { ...p, likes } : p)));
        setPorEscuela(prev => prev.map(g => ({
            ...g,
            proyectos: g.proyectos.map(p => (p.id === proyectoId ? { ...p, likes } : p)),
        })));
    };

    const handleLike = async (proyecto) => {
        if (yaDioLike(proyecto.id)) return;

        actualizarLikesEnEstado(proyecto.id, (proyecto.likes || 0) + 1);
        try {
            window.localStorage.setItem(claveLike(proyecto.id), '1');
        } catch (_) {}

        const { data: likesReales, error: errorLike } = await supabase
            .rpc('dar_like_entrega', { p_entrega_id: proyecto.id });

        if (errorLike) {
            console.error('[BLOCKIDS] Error registrando like:', errorLike);
            return;
        }

        if (typeof likesReales === 'number') {
            actualizarLikesEnEstado(proyecto.id, likesReales);
        }
    };

    const verProyecto = (proyecto) => {
        history.push(`/entorno?entregaId=${proyecto.id}`);
    };

    const sinResultados = !cargando && !error && proyectos.length === 0 && porEscuela.length === 0;

    return (
        <div className="pagina">
            <Navbar urlDashboard={urlDashboard} />

            {/* HERO */}
            <section className="hero">
                <div className="heroContenido">
                    <img src={xolotlGanador} alt="Xolotl con trofeo" className="heroXolotl" />
                    <div>
                        <span className="heroEyebrow">Top 3 de la comunidad</span>
                        <h1 className="heroTitulo">Salón de la Fama Blockids</h1>
                        <p className="heroDesc">
                            Los proyectos más queridos por la comunidad, creados por estudiantes como tú. ¡Dales like a tus favoritos!
                        </p>
                    </div>
                </div>
            </section>

            {/* SELECTOR DE EDICIÓN */}
            {ediciones.length > 1 && (
                <section className="contenido" style={{ paddingBottom: 0 }}>
                    <div className="container">
                        <div className="edicionSelector">
                            <label htmlFor="sf-edicion" className="edicionLabel">Edición:</label>
                            <select
                                id="sf-edicion"
                                className="edicionSelect"
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
                                <span className="edicionCerradaTag">Edición cerrada — podio histórico</span>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* TOP 3 */}
            <section className="contenido">
                <div className="container">

                    {cargando && (
                        <>
                            <p className="estadoTexto">Cargando proyectos destacados...</p>
                            <div className="grid">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="cardSkeleton">
                                        <div className="skeletonThumb" />
                                        <div className="skeletonLinea" />
                                        <div className="skeletonLineaCorta" />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!cargando && error && (
                        <div className="estadoVacio">
                            <img src={xolotlIdea} alt="" className="estadoXolotl" />
                            <h2 className="estadoTitulo">No pudimos cargar los proyectos</h2>
                            <p className="estadoDesc">Aún no hay proyectos destacados.</p>
                        </div>
                    )}

                    {sinResultados && (
                        <div className="estadoVacio">
                            <img src={xolotlIdea} alt="" className="estadoXolotl" />
                            <h2 className="estadoTitulo">Aún no hay proyectos destacados</h2>
                            <p className="estadoDesc">
                                el Top 3 aparecerá aquí.
                            </p>
                        </div>
                    )}

                    {!cargando && !error && proyectos.length > 0 && (
                        <div className="grid">
                            {proyectos.map((proyecto, idx) => (
                                <TarjetaProyecto
                                    key={proyecto.id}
                                    proyecto={proyecto}
                                    medalla={MEDALLAS[idx] || medallaEspecial}
                                    degradado={DEGRADADOS_PLACEHOLDER[idx % DEGRADADOS_PLACEHOLDER.length]}
                                    onLike={handleLike}
                                    onVer={verProyecto}
                                    marcoClase={MARCOS_TOP3[idx]}
                                    style={{ animationDelay: `${idx * 0.08}s` }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* POR ESCUELA */}
            {!cargando && !error && porEscuela.length > 0 && (
                <section className="contenido">
                    <div className="container">
                        <h2 className="seccionTitulo">Destacados por escuela</h2>
                        {porEscuela.map(grupo => (
                            <div key={grupo.escuela} className="escuelaGrupo">
                                <h3 className="escuelaNombre">{grupo.escuela}</h3>
                                <div className="grid">
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
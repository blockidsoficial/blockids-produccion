import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './LandingPage.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Aliados from './Aliados.jsx';

/* ── Xolotl ───────────────────────────────────────────────── */
// import xolotlHero    from '../assets/xolotl/xolotl-saludando.svg';
// import xolotlHero    from '../assets/xolotl/xolotl-explicando.svg';
import xolotlHero    from '../../assets/xolotl/xolotl-logro.svg'; //seccion 1 panel principal

//seccion 3 ¿como funciona?
import xolotlP1      from '../../assets/xolotl/xolotl-explicando-2.svg'; //
import xolotlP2      from '../../assets/xolotl/xolotl-programando.svg';
import xolotlP3      from '../../assets/xolotl/xolotl-aprendiendo.svg';

//seccion 6 demo video
// import xolotlDemo    from '../assets/xolotl/xolotl-excelente.svg';
import xolotlDemo    from '../../assets/xolotl/xolotl-logro.svg';

//seccion 8 conocenos - registrarse
import xolotlCta     from '../../assets/xolotl/xolotl-saludando.svg';


/* ── Iconos ────────────────────────────────────────────────── */
//segunda seccion 3 cards
import icoLogica   from '../../assets/iconos/icono-logica-divertida.svg';
import icoBloques  from '../../assets/iconos/icono-logica-2.svg';
import icoTecno    from '../../assets/iconos/icono-tecnologia-2.svg';

/* ── Elementos decorativos ─────────────────────────────────── */
import cohete       from '../../assets/elementos/cohete-volando.svg';
import estrellaAm   from '../../assets/elementos/estrella-amarilla.svg';
import bloqueAzul   from '../../assets/elementos/bloque-azul.svg';
import bloqueVerde  from '../../assets/elementos/bloque-verde.svg';
import bloqueAmari  from '../../assets/elementos/bloque-amarillo.svg';
import bloqueRojo   from '../../assets/elementos/bloque-rojo.svg';
import diamantina   from '../../assets/elementos/diamantina-suelto.svg';

/* ── Fondo Hero ────────────────────────────────────────────── */
import fondoNubes   from '../../assets/fondos/fondo-nubes.svg';

// Video "Cómo se usa el entorno (Fork de Blockids)" en YouTube.
// Es sólo el ID: en https://youtu.be/f5G2u3QJWu0  el ID es "f5G2u3QJWu0".
const VIDEO_ENTORNO_ID = 'f5G2u3QJWu0';
const VIDEO_ENTORNO_EMBED =
    `https://www.youtube-nocookie.com/embed/${VIDEO_ENTORNO_ID}?rel=0&modestbranding=1`;

// ─────────────────────────────────────────────────────────────────────────────
// DATA dela seccion 2 de CARDS - 
// ─────────────────────────────────────────────────────────────────────────────

const BENEFICIOS = [
    {
        ico: icoLogica,
        titulo: 'Lógica divertida',
        desc: 'Aprenden pensamiento computacional jugando y resolviendo retos.',
        color: 'benVerde',
    },
    {
        ico: icoBloques,
        titulo: 'Bloques interactivos',
        desc: 'Acomodan bloques digitales de código como si fueran piezas de construcción, facilitando el aprendizaje.',
        color: 'benAzul',
    },
    {
        ico: icoTecno,
        titulo: 'Tecnología simple',
        desc: 'Interfaces amigables y seguras diseñadas especialmente para niños.',
        color: 'benAmarillo',
    },
];


const PASOS = [
    { num: '1', titulo: 'Construye', desc: 'Usa bloques digitales para crear tu idea.', xolotl: xolotlP1, color: '#4D96FF' },
    { num: '2', titulo: 'Conecta',   desc: 'Conecta los bloques con la app de Blockids.', xolotl: xolotlP2, color: '#6BCB77' },
    { num: '3', titulo: 'Aprende',   desc: 'Ve cómo tu código cobra vida y aprende jugando.', xolotl: xolotlP3, color: '#FFD93D' },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
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

const LandingPage = ({ session, rolPerfil }) => {
    useDocumentTitle('Inicio');

    const urlDashboard = session ? rutaDashboard(rolPerfil) : '/registro';

    return (
        <div className={styles.landing}>

            {/* ══════════ NAVBAR ══════════ */}
            <Navbar urlDashboard={urlDashboard} />

            {/* ══════════ HERO ══════════ */}
            <section
                id="inicio"
                className={styles.hero}
                style={{ backgroundImage: `url(${fondoNubes})` }}
            >
                {/* Elementos decorativos flotantes */}
                <img src={bloqueAzul}  className={`${styles.deco} ${styles.decoB1}`} alt="" aria-hidden="true" />
                <img src={bloqueVerde} className={`${styles.deco} ${styles.decoB2}`} alt="" aria-hidden="true" />
                <img src={bloqueAmari} className={`${styles.deco} ${styles.decoB3}`} alt="" aria-hidden="true" />
                <img src={bloqueRojo}  className={`${styles.deco} ${styles.decoB4}`} alt="" aria-hidden="true" />
                <img src={estrellaAm}  className={`${styles.deco} ${styles.decoS1}`} alt="" aria-hidden="true" />
                <img src={estrellaAm}  className={`${styles.deco} ${styles.decoS2}`} alt="" aria-hidden="true" />

                <div className={styles.heroContent}>
                    <div className={styles.heroLeft}>
                        {/* <div className={styles.heroBadges}>
                            <span className={styles.badge}>Para niños de primaria</span>
                            <span className={styles.badgeYellow}>Pequeños códigos, grandes ideas</span>
                        </div> */}
                        <h1 className={styles.heroTitle}>
                            Aprende a{' '}
                            <span className={styles.heroAzul}>programar</span>{' '}
                            <span className={styles.heroVerde}>jugando</span>
                        </h1>
                        <p className={styles.heroDesc}>
                            En Blockids enseñamos lógica y programación a niños de forma divertida con bloques y tecnología interactiva.
                        </p>
                        <div className={styles.heroButtons}>
                            <Link to={urlDashboard} className={styles.btnPrimario}>
                                {session ? 'Ir a mi panel →' : 'Comenzar ahora →'}
                            </Link>
                            {/* <a href={urlDashboard} className={styles.btnSecundario}>
                                Ver mas
                            </a> */}
                        </div>
                    </div>

                    <div className={styles.heroRight}>
                        <img src={xolotlHero} alt="Xolotl Blockids saludando" className={styles.xolotlHero} />
                    </div>
                </div>
            </section>

            {/* ══════════ BENEFICIOS (3 CARDS) ══════════ */}
            <section className={styles.beneficiosSection}>
                <div className={styles.container}>
                    <div className={styles.beneficiosGrid}>
                        {BENEFICIOS.map((b) => (
                            <div key={b.titulo} className={`${styles.benCard} ${styles[b.color]}`}>
                                <img src={b.ico} alt={b.titulo} className={styles.benIco} />
                                <h3 className={styles.benTitulo}>{b.titulo}</h3>
                                <p className={styles.benDesc}>{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ CÓMO FUNCIONA ══════════ */}
            <section className={styles.comoSection}>
                <div className={styles.container}>
                    <h2 className={styles.secTitulo}>¿Cómo funciona?</h2>
                    <div className={styles.pasosGrid}>
                        {PASOS.map((p, i) => (
                            <div key={p.titulo} className={styles.pasoCard}>
                                <img src={p.xolotl} alt={p.titulo} className={styles.pasoXolotl} />
                                <div
                                    className={styles.pasoNum}
                                    style={{ background: p.color }}
                                >
                                    {p.num}
                                </div>
                                <h3
                                    className={styles.pasoTitulo}
                                    style={{ color: p.color }}
                                >
                                    {p.titulo}
                                </h3>
                                <p className={styles.pasoDesc}>{p.desc}</p>
                                {i < PASOS.length - 1 && (
                                    <span className={styles.pasoArrow}>→</span>
                                )} 
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ DEMO ══════════ */}
            <section id="demo" className={styles.demoSection}>
                <div className={styles.container}>
                    <div className={styles.demoCard}>
                        <div className={styles.demoTexto}>
                            <h2 className={styles.demoTitulo}>Mira cómo se usa el entorno de Blockids</h2>
                            <p className={styles.demoDesc}>
                                Un recorrido por el editor por bloques (Fork de Blockids): cómo abrir un
                                proyecto, armar tu lógica arrastrando bloques y ejecutar tu código.
                                Los alumnos crean proyectos digitales y los maestros evalúan desde un solo
                                lugar. Todo en la nube.
                            </p>
                            <div className={styles.demoButtons}>
                                <Link to="/registro" className={styles.btnDemoSecundario}>Registrarse</Link>
                            </div>
                        </div>
                        <div className={styles.demoImgWrap}>
                            <div className={styles.demoVideo}>
                                <iframe
                                    className={styles.demoIframe}
                                    src={VIDEO_ENTORNO_EMBED}
                                    title="Cómo se usa el entorno de Blockids"
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                            <img src={xolotlDemo} alt="Xolotl Blockids" className={styles.demoXolotl} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ ALIADOS / COMUNIDAD ══════════ */}
            <Aliados />

            {/* ══════════ CTA FINAL ══════════ */}
            <section className={styles.ctaSection}>
                <img src={xolotlCta}  alt="" aria-hidden="true" className={styles.ctaXolotl} />
                <img src={cohete}     alt="" aria-hidden="true" className={styles.ctaCohete} />
                <img src={estrellaAm} alt="" aria-hidden="true" className={styles.ctaEstrella1} />
                <img src={estrellaAm} alt="" aria-hidden="true" className={styles.ctaEstrella2} />
                <img src={diamantina} alt="" aria-hidden="true" className={styles.ctaDiamantina} />

                <div className={styles.ctaContenido}>
                    <h2 className={styles.ctaTitulo}>¡Empieza hoy la aventura de aprender!</h2>
                    <p className={styles.ctaDesc}>Cursos divertidos, retos increíbles y mucho por descubrir.</p>
                    <Link
                        to={urlDashboard}
                        className={styles.btnCta}
                    >
                        {session ? 'Ir a mi panel →' : 'Registro'}
                    </Link>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <Footer />

        </div>
    );
};

LandingPage.propTypes = {
    session: PropTypes.object,
};

export default LandingPage;

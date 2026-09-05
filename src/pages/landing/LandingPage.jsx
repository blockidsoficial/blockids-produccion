import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './LandingPage.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

/* ── Logos ─────────────────────────────────────────────────── */
import logoHorizontal from '../../assets/logos/logo-horizontal-colores.svg';
import logoBlanco     from '../../assets/logos/logo-blanco.svg';

/* ── Xolotl ───────────────────────────────────────────────── */
// import xolotlHero    from '../assets/xolotl/xolotl-saludando.svg';
// import xolotlHero    from '../assets/xolotl/xolotl-explicando.svg';
import xolotlHero    from '../../assets/xolotl/xolotl-logro.svg'; //seccion 1 panel principal

//seccion 3 ¿como funciona?
import xolotlP1      from '../../assets/xolotl/xolotl-explicando-2.svg'; //
import xolotlP2      from '../../assets/xolotl/xolotl-programando.svg';
import xolotlP3      from '../../assets/xolotl/xolotl-aprendiendo.svg';
//seccion 5 niveles
import xolotlN1      from '../../assets/xolotl/xolotl-explorando.svg';
import xolotlN2      from '../../assets/xolotl/xolotl-levantandobloque.svg';
import xolotlN3      from '../../assets/xolotl/xolotl-explicando-codigo.svg';

//seccion 6 demo video
// import xolotlDemo    from '../assets/xolotl/xolotl-excelente.svg';
import xolotlDemo    from '../../assets/xolotl/xolotl-logro.svg';

//seccion 8 conocenos - registrarse
import xolotlCta     from '../../assets/xolotl/xolotl-saludando.svg';

//seccion 7 lo que dicen lo padres y niños 
import xolotlT1      from '../../assets/xolotl/xolotl-expresion-feliz.svg';
import xolotlT2      from '../../assets/xolotl/xolotl-expresion-sorprendido.svg';
import xolotlT3      from '../../assets/xolotl/xolotl-expresion-riendose.svg';


/* ── Iconos ────────────────────────────────────────────────── */
//segunda seccion 3 cards 
import icoLogica   from '../../assets/iconos/icono-logica-divertida.svg';
import icoBloques  from '../../assets/iconos/icono-logica-2.svg';
import icoTecno    from '../../assets/iconos/icono-tecnologia-2.svg';
//seccion 4 para niños y padres
import xolotlPadres from '../../assets/elementos/profe-alumno-computadora.svg'; 
import icoSeguro   from '../../assets/iconos/icono-seguro.svg';
import icoConf     from '../../assets/iconos/icono-confianza.svg';
import icoDesarr   from '../../assets/iconos/icono-desarrollo.svg';

//beneficios clave
import icoCorrect  from '../../assets/iconos/icono-correcto.svg';

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

const NIVELES = [
    {
        badge: 'Seguridad',
        badgeColor: '#6BCB77',
        titulo: 'Acceso sin complicaciones',
        edad: 'Para todos los niveles',
        desc: 'Olvídate de gestionar correos electrónicos para menores. Los maestros generan códigos de clase únicos y los alumnos acceden solo con su nombre de usuario. Privacidad total garantizada.',
        xolotl: xolotlN1,
        btnColor: '#6BCB77',
        btnText: 'Saber más',
        features: ['Sin correo electrónico requerido', 'Código de clase único por grupo', 'Acceso solo con nombre de usuario'],
    },
    {
        badge: 'Entorno Digital',
        badgeColor: '#4D96FF',
        titulo: 'Optimizado para Compturadoras o Laptops',
        edad: 'Para niños de primaria.',
        desc: 'Los estudiantes arrastran bloques para dar vida a sus ideas. Juegos e historias interactivas que desarrollan la lógica computacional esde el navegador de internet, no necesitan instalación.',
        xolotl: xolotlN2,
        btnColor: '#4D96FF',
        btnText: 'Ver Editor',
        features: ['Editor de bloques visual e intuitivo', 'Proyectos animados e interactivos', 'Optimizado para computadora'],
    },
    {
        badge: 'Gestión',
        badgeColor: '#9B5DE5',
        titulo: 'Control del Maestro',
        edad: 'Para docentes y mentores',
        desc: 'Adiós al caos de archivos en USB. Los proyectos se entregan con un clic. El profesor califica, comenta y gestiona el progreso de todo el grupo desde un panel centralizado tipo Teams.',
        xolotl: xolotlN3,
        btnColor: '#9B5DE5',
        btnText: 'Panel Docente',
        features: ['Entrega de proyectos con un clic', 'Calificación y comentarios centralizados', 'Seguimiento de progreso por alumno'],
    },
];

// const TESTIMONIOS = [
//     {
//         xolotl: xolotlT1,
//         quote: 'Gestionar los proyectos de 30 niños en Scratch era un caos. Con Blockids, el sistema de entrega y revisión centralizada me ahorró horas de trabajo técnico.',
//         nombre: 'Ing. Abraham S.',
//         rol: 'Mentor de Programación (Servicio Social)',
//     },
//     {
//         xolotl: xolotlT2,
//         quote: 'Me gusta mucho porque no necesito tener correo. Solo entro con mi usuario, hago mis bloques y mi maestro puede ver mis avances al instante.',
//         nombre: 'Luis Á.',
//         rol: 'Estudiante de Primaria',
//     },
//     {
//         xolotl: xolotlT3,
//         quote: 'Como prestadora de servicio, lo que más valoro es la seguridad. Los niños no necesitan datos personales para usar la plataforma en el salón de clases.',
//         nombre: 'Jessica.G',
//         rol: 'Instructora de Tecnologías (Residente)',
//     },
// ];


const BENEFICIOS_CLAVE = [
    'Desarrollo de lógica computacional mediante bloques.',
    'Gestión segura de identidades sin correos externos.',
    'Fomento de la resolución de problemas algorítmicos.',
    'Entorno colaborativo maestro-alumno en tiempo real.',
    'Portafolio digital de proyectos guardado en la nube.',
];

const COMPARACION = [
    ['Aprendizaje teórico',       'Aprendizaje práctico y divertido'],
    ['Cuentas con correos Gmail', 'Acceso con Usuario y Código de Clase'],
    ['Dificultad para calificar', 'Panel de revisión centralizado'],
    ['Uso recreativo disperso',   'Entorno educativo estructurado'],
];

const FAQS = [
    { 
        q: '¿Qué dispositivos son compatibles?', 
        r: 'Blockids está optimizado exclusivamente para computadoras de escritorio y laptops. Debido a la complejidad del editor de bloques, no se recomienda el uso de tablets o celulares.' 
    },
    { 
        q: '¿Cómo ingresan los estudiantes?', 
        r: 'No requieren correo electrónico. El maestro les proporciona un Código de Clase único y ellos eligen un nombre de usuario. Esto garantiza la privacidad de los menores.' 
    },
    { 
        q: '¿Tengo que saber de programación antes de empezar?', 
        r: '¡Para nada! Nuestra plataforma cambia las líneas de código complejas por bloques de colores que arrastras y sueltas. Si sabes armar un rompecabezas, ya tienes todo lo necesario para empezar a crear tus propios proyectos desde el primer minuto' 
    },
    { 
        q: '¿Los padres pueden registrarse?', 
        r: 'Blockids es un entorno escolar cerrado. Los padres no crean perfiles, pero pueden supervisar el progreso de sus hijos entrando con las credenciales escolares del alumno desde cualquier computadora.' 
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

const FaqItem = ({ pregunta, respuesta }) => {
    const [abierto, setAbierto] = useState(false);
    return (
        <div className={`${styles.faqItem} ${abierto ? styles.faqAbierto : ''}`}>
            <button className={styles.faqPregunta} onClick={() => setAbierto(!abierto)}>
                <span>{pregunta}</span>
                <span className={styles.faqChevron}>{abierto ? '-' : '+'}</span>
            </button>
            {abierto && <p className={styles.faqRespuesta}>{respuesta}</p>}
        </div>
    );
};

FaqItem.propTypes = { pregunta: PropTypes.string, respuesta: PropTypes.string };

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

    const [menuAbierto, setMenuAbierto] = useState(false);
    const urlDashboard = session ? rutaDashboard(rolPerfil) : '/registro';

    return (
        <div className={styles.landing}>

            {/* ══════════ NAVBAR ══════════ */}
            <nav className={styles.navbar}>
                <Link to="/" className={styles.navLogo}>
                    <img src={logoHorizontal} alt="Blockids" className={styles.logoImg} />
                </Link>

                <button
                    className={styles.hamburger}
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    aria-label="Menú"
                >
                    <span /><span /><span />
                </button>

                <ul className={`${styles.navLinks} ${menuAbierto ? styles.navOpen : ''}`}>
                    <li><a href="#inicio"   className={styles.navLink}>Inicio</a></li>
                    <li><a href="#docentes"   className={styles.navLink}>Docentes</a></li>
                    <li><a href="#nosotros" className={styles.navLink}>Nosotros</a></li>
                    <li><a href="#contacto" className={styles.navLink}>Contacto</a></li>
                    <li><a href={urlDashboard} className={styles.navLink}>Ingresar</a></li>
                </ul>
{/* 
                <Link
                    to={session ? '/mis-proyectos' : '/registro'}
                    className={styles.navCta}
                >
                    {session ? 'Mi panel' : 'Comenzar ahora →'}
                </Link> */}
            </nav>

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

            {/* ══════════ PARA NIÑOS Y PADRES ══════════ */}
            {/* ══════════ PARA MAESTROS Y ALUMNOS ══════════ */}
            <section id="docentes" className={styles.padresSection}>
                <div className={styles.container}>
                    <div className={styles.padresGrid}>
                        <div className={styles.padresImgWrap}>
                            <img src={xolotlPadres} alt="Para maestros y alumnos" className={styles.padresXolotl} />
                        </div>
                        <div className={styles.padresTexto}>
                            <h2 className={styles.secTitulo} style={{ textAlign: 'left' }}>
                                Para maestros y alumnos
                            </h2>
                            <p className={styles.padresDesc}>
                                Blockids está diseñado para que los estudiantes aprendan a programar de forma intuitiva, mientras los docentes tienen el control total para evaluar y dar seguimiento a su progreso.
                            </p>
                            <div className={styles.padresBeneficios}>
                                <div className={styles.padreBen}>
                                    <img src={icoSeguro} alt="Seguro" className={styles.padreBenIco} />
                                    <div>
                                        <strong>Seguridad Estudiantil</strong>
                                        <p>Entorno cerrado y protegido. Los datos de los menores están seguros sin necesidad de correos externos.</p>
                                    </div>
                                </div>
                                <div className={styles.padreBen}>
                                    <img src={icoConf} alt="Gestión Docente" className={styles.padreBenIco} />
                                    <div>
                                        <strong>Gestión Docente</strong>
                                        <p>Panel de revisión centralizado para que el profesor asigne tareas, revise el código y asigne calificaciones fácilmente.</p>
                                    </div>
                                </div>
                                <div className={styles.padreBen}>
                                    <img src={icoDesarr} alt="Desarrollo real" className={styles.padreBenIco} />
                                    <div>
                                        <strong>Desarrollo Real</strong>
                                        <p>Habilidades que les servirán para el futuro: lógica computacional, creatividad y resolución algorítmica de problemas.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ CURSOS Y NIVELES ══════════ */}
            <section id="cursos" className={styles.nivelesSection}>
                <div className={styles.container}>
                    <h2 className={styles.secTitulo}>Adaptable a cualquier salón de clases</h2>
                    <div className={styles.nivelesGrid}>
                        {NIVELES.map((n) => (
                            <div key={n.titulo} className={styles.nivelCard}>
                                <img src={n.xolotl} alt={n.titulo} className={styles.nivelXolotl} />
                                <span
                                    className={styles.nivelBadge}
                                    style={{ background: n.badgeColor }}
                                >
                                    {n.badge}
                                </span>
                                <h3 className={styles.nivelTitulo}>{n.titulo}</h3>
                                <p className={styles.nivelEdad}>{n.edad}</p>
                                <p className={styles.nivelDesc}>{n.desc}</p>
                                <ul className={styles.nivelFeatures}>
                                    {n.features.map((f) => (
                                        <li key={f}><span className={styles.checkmark}>✓</span> {f}</li>
                                    ))}
                                </ul>
                                <Link
                                    to="/registro"
                                    className={styles.btnNivel}
                                    style={{ background: n.badgeColor }}
                                >
                                    Ver detalles →
                                </Link>
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
                            <h2 className={styles.demoTitulo}>Mira cómo funciona Blockids</h2>
                            <p className={styles.demoDesc}>
                                Tu salón de clases, ahora con programación por bloques.
                                Descubre cómo Blockids integra el poder del código visual en un entorno escolar
                                cerrado.Los alumnos crean proyectos digitales, y los maestros evalúan desde un solo lugar. Todo en la nube.
                            </p>
                            <div className={styles.demoButtons}>
                                <Link to="/registro" className={styles.btnDemoSecundario}>Registrarse</Link>
                            </div>
                        </div>
                        <div className={styles.demoImgWrap}>
                            <div className={styles.demoPantalla}>
                            </div>
                            {/* <div className={styles.demoPantalla}>
                                <img src={bloqueAzul}  alt="" aria-hidden="true" className={styles.demoBloque} style={{ top: '10%', left: '5%' }} />
                                <img src={bloqueVerde} alt="" aria-hidden="true" className={styles.demoBloque} style={{ top: '25%', left: '30%' }} />
                                <img src={bloqueAmari} alt="" aria-hidden="true" className={styles.demoBloque} style={{ top: '50%', left: '15%' }} />
                                <img src={bloqueRojo}  alt="" aria-hidden="true" className={styles.demoBloque} style={{ top: '65%', left: '50%' }} />
                            </div> */}
                            <img src={xolotlDemo} alt="Xolotl Blockids" className={styles.demoXolotl} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ TESTIMONIOS ══════════ */}
            {/* <section className={styles.testimoniosSection}>
                <div className={styles.container}>
                    <h2 className={styles.secTitulo}>Lo que dicen maestros y alumnos</h2>
                    <div className={styles.testimoniosGrid}>
                        {TESTIMONIOS.map((t) => (
                            <div key={t.nombre} className={styles.testimCard}>
                                <span className={styles.comillas}>"</span>
                                <p className={styles.testimQuote}>{t.quote}</p>
                                <div className={styles.testimAutor}>
                                    <img src={t.xolotl} alt={t.nombre} className={styles.testimAvatar} />
                                    <div>
                                        <strong className={styles.testimNombre}>{t.nombre}</strong>
                                        <p className={styles.testimRol}>{t.rol}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* ══════════ BENEFICIOS CLAVE + COMPARACIÓN ══════════ */}
            <section className={styles.bcSection}>
                <div className={styles.container}>
                    <div className={styles.bcGrid}>

                        {/* Beneficios clave */}
                        <div className={styles.bcLeft}>
                            <h2 className={styles.secTitulo} style={{ textAlign: 'left' }}>Beneficios clave</h2>
                            <ul className={styles.bcList}>
                                {BENEFICIOS_CLAVE.map((b) => (
                                    <li key={b} className={styles.bcItem}>
                                        <img src={icoCorrect} alt="✓" className={styles.bcIco} />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Comparación */}
                        <div className={styles.bcRight}>
                            <h2 className={styles.secTitulo} style={{ textAlign: 'left' }}>¿Por qué Blockids es diferente?</h2>
                            <table className={styles.compTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.compThTrad}>Tradicional</th>
                                        <th className={styles.compThBlock}>Blockids</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {COMPARACION.map(([trad, block]) => (
                                        <tr key={trad}>
                                            <td className={styles.compTdTrad}>{trad}</td>
                                            <td className={styles.compTdBlock}>{block}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </section>

            {/* ══════════ FAQ ══════════ */}
            <section className={styles.faqSection}>
                <div className={styles.container}>
                    <h2 className={styles.secTitulo}>Preguntas frecuentes</h2>
                    <div className={styles.faqGrid}>
                        {FAQS.map((f) => (
                            <FaqItem key={f.q} pregunta={f.q} respuesta={f.r} />
                        ))}
                    </div>
                </div>
            </section>

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
            <footer id="contacto" className={styles.footer}>
                <div className={styles.container}>
                    <div className={styles.footerGrid}>

                        {/* Col 1: Logo + descripción */}
                        <div className={styles.footerCol}>
                            <img src={logoBlanco} alt="Blockids" className={styles.footerLogo} />
                            <p className={styles.footerDesc}>
                                Enseñamos a niños a programar jugando con bloques y tecnología interactiva.
                            </p>
                        </div>

                        {/* Col 2: Navegación */}
                        <div className={styles.footerCol}>
                            <h4 className={styles.footerHead}>Navegación</h4>
                            <ul className={styles.footerLinks}>
                                <li><a href="#inicio">Inicio</a></li>
                                <li><a href="#blockids">Blockids</a></li>
                                {/* <li><a href="#cursos">Cursos</a></li> */}
                                <li><a href="#docentes">Docentes</a></li>
                                <li><a href="#nosotros">Sobre Nosotros</a></li>
                                <li><a href="#contacto">Contacto</a></li>
                            </ul>
                        </div>

                        {/* Col 3: Legal */}
                        <div className={styles.footerCol}>
                            <h4 className={styles.footerHead}>Legal</h4>
                            <ul className={styles.footerLinks}>
                                <li><Link to="/terminos-y-condiciones">Términos y condiciones</Link></li>
                                <li><Link to="/aviso-de-privacidad">Aviso de privacidad</Link></li>
                            </ul>
                        </div>

                        {/* Col 4: Contacto */}
                        <div className={styles.footerCol}>
                            <h4 className={styles.footerHead}>Contacto</h4>
                            <ul className={styles.footerLinks}>
                                <li><a href="mailto:admin@blockids.com">admin@blockids.com</a></li>
                                {/* <li>+52 XXXXXX</li> */}
                                <li>H. Matamoros,Tamaulipas</li>
                            </ul>
                        </div>

                        {/* Col 5: Síguenos */}
                        <div className={styles.footerCol}>
                            <h4 className={styles.footerHead}>Síguenos</h4>
                            <div className={styles.socialRow}>
                                <a href="#" className={styles.socialBtn} style={{ background: '#1877F2' }}>f</a>
                               
                                {/* <a href="#" className={styles.socialBtn} style={{ background: '#E4405F' }}>in</a>
                                <a href="#" className={styles.socialBtn} style={{ background: '#FF0000' }}>yt</a>
                                <a href="#" className={styles.socialBtn} style={{ background: '#010101' }}>tk</a>
                             */}
                            </div>
                        </div>

                    </div>

                    <div className={styles.footerBottom}>
                        <p>© {new Date().getFullYear()} Blockids. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
};

LandingPage.propTypes = {
    session: PropTypes.object,
};

export default LandingPage;

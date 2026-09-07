import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from '../landing/LandingPage.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Navbar from '../landing/Navbar.jsx';
import Footer from '../landing/Footer.jsx';
import Aliados from '../landing/Aliados.jsx';

/* ── Xolotl ───────────────────────────────────────────────── */
import xolotlN1      from '../../assets/xolotl/xolotl-explorando.svg';
import xolotlN4     from '../../assets/xolotl/xolotl-excelente.svg';
import xolotlN2      from '../../assets/xolotl/xolotl-levantandobloque.svg';
import xolotlN3      from '../../assets/xolotl/xolotl-explicando-codigo.svg';

/* ── Iconos ────────────────────────────────────────────────── */
import xolotlPadres from '../../assets/elementos/profe-alumno-computadora.svg';
import icoSeguro   from '../../assets/iconos/icono-seguro.svg';
import icoConf     from '../../assets/iconos/icono-confianza.svg';
import icoDesarr   from '../../assets/iconos/icono-desarrollo.svg';
import icoCorrect  from '../../assets/iconos/icono-correcto.svg';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const NIVELES = [
    {
        badge: 'Seguridad',
        badgeColor: '#6BCB77',
        titulo: 'Acceso sin complicaciones',
        edad: 'Para todos los niveles',
        desc: 'Olvídate de gestionar correos electrónicos para menores. Los maestros generan códigos de clase únicos y los alumnos acceden solo con su nombre de usuario. Privacidad total garantizada.',
        xolotl: xolotlN4,
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

const BENEFICIOS_CLAVE = [
            // 'Desarrollo de lógica computacional mediante bloques.',
            // 'Gestión segura de identidades sin correos externos.',
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

const IDENTIDAD = [
    {
        titulo: 'Misión',
        texto: 'Convertimos cada idea en una oportunidad para aprender: crear, jugar y colaborar son parte del camino.',
        icono: icoDesarr,
        alt: 'Misión',
    },
    {
        titulo: 'Privacidad y seguridad',
        texto: 'Un entorno escolar cerrado: el docente administra el acceso y los niños no necesitan correo electrónico.',
        icono: icoSeguro,
        alt: 'Privacidad y seguridad',
    },
    {
        titulo: 'Ecosistema y comunidad',
        texto: 'Profesores, estudiantes y aliados colaboran para imaginar y construir tecnología con propósito.',
        icono: icoConf,
        alt: 'Ecosistema y comunidad',
    },
     {
        titulo: 'Metodología activa',
        texto: 'Retos breves, proyectos que cobran vida y retroalimentación docente para avanzar haciendo.',
        icono: icoCorrect,
        alt: 'Metodología activa',
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

const Nosotros = ({ session, rolPerfil }) => {
    useDocumentTitle('Nosotros');

    const urlDashboard = session ? rutaDashboard(rolPerfil) : '/registro';

    return (
        <div className={styles.landing}>

            {/* ══════════ NAVBAR ══════════ */}
            <Navbar urlDashboard={urlDashboard} />

            {/* ══════════ HERO NOSOTROS ══════════ */}
            <section className={styles.nosotrosHero}>
                <div className={styles.container}>
                    <div className={styles.nosotrosHeroGrid}>
                        <div className={styles.nosotrosHeroTexto}>
                            <span className={styles.nosotrosEyebrow}>Conoce Blockids</span>
                            <h1 className={styles.nosotrosHeroTitulo}>
                                Programar también puede ser una aventura.
                            </h1>
                            <p className={styles.nosotrosHeroDesc}>
                                Creamos experiencias para que niñas y niños aprendan tecnología jugando, creando y compartiendo sus ideas.
                            </p>
                        </div>
                        <div className={styles.nosotrosHeroImagen}>
                            <img src={xolotlN1} alt="Xolotl explorando ideas de programación" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ NUESTRA IDENTIDAD ══════════ */}
            <section className={styles.identidadSection}>
                <div className={styles.container}>
                    <h2 className={styles.secTitulo}>Lo que nos mueve</h2>
                    <div className={styles.identidadGrid}>
                        {IDENTIDAD.map((item) => (
                            <article key={item.titulo} className={styles.identidadCard}>
                                <img src={item.icono} alt={item.alt} className={styles.identidadIcono} />
                                <h3 className={styles.identidadTitulo}>{item.titulo}</h3>
                                <p className={styles.identidadTexto}>{item.texto}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ ALIADOS / COMUNIDAD ══════════ */}
            <Aliados />


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
                            {/* <div className={styles.padresBeneficios}>
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
                            </div> */}
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
            <section id="faq" className={styles.faqSection}>
                <div className={styles.container}>
                    <h2 className={styles.secTitulo}>Preguntas frecuentes</h2>
                    <div className={styles.faqGrid}>
                        {FAQS.map((f) => (
                            <FaqItem key={f.q} pregunta={f.q} respuesta={f.r} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <Footer />

        </div>
    );
};

Nosotros.propTypes = {
    session: PropTypes.object,
    rolPerfil: PropTypes.string,
};

export default Nosotros;

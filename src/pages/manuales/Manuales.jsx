import React from 'react';
import PropTypes from 'prop-types';
import { PlayCircle, Mail } from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Navbar from '../landing/Navbar.jsx';
import Footer from '../landing/Footer.jsx';
import styles from './Manuales.css';

import xolotlExplicandoCodigo from '../../assets/xolotl/xolotl-explicando-codigo.svg';

import icoAdmin   from '../../assets/iconos/icono-configuracion.svg';
import icoDocente from '../../assets/iconos/icono-acompañamiento.svg';
import icoAlumno  from '../../assets/iconos/icono-juego.svg';
import icoEntorno from '../../assets/iconos/icono-bloques.svg';

// TODO: reemplaza esta URL por el canal oficial real de YouTube de Blockids
// (por ahora es un placeholder para que el botón no quede roto/vacío).
const CANAL_YOUTUBE = 'https://www.youtube.com/@blockids-mx';
const CORREO_SOPORTE = 'blockids.oficial@gmail.com';

// Video "Cómo se usa el entorno blockids" en YouTube.
// Es sólo el ID: en https://youtu.be/f5G2u3QJWu0  el ID es "f5G2u3QJWu0".
const VIDEO_ENTORNO_ID = 'f5G2u3QJWu0';
const VIDEO_ENTORNO_EMBED =
    `https://www.youtube-nocookie.com/embed/${VIDEO_ENTORNO_ID}?rel=0&modestbranding=1`;

// Recorrido del panel por rol. No es un tutorial de registro: muestra cómo se
// usa el panel de cada plataforma una vez dentro.
const VIDEO_PANEL = {
    admin:   'https://youtu.be/Mj_oGL3F-hQ',
    docente: 'https://youtu.be/2VvKN0ft80w',
    alumno:  'https://youtu.be/z9-_0Fs9MFU',
};

const rutaDashboard = (rol) => {
    switch (rol) {
        case 'superadmin':
        case 'admin_escuela': return '/admin?vista=proyectos';
        case 'profesor':      return '/profesor?vista=proyectos';
        case 'alumno':        return '/alumno?vista=proyectos';
        default:              return '/login';
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Contenido de las 3 guías. `color` selecciona la paleta de la tarjeta
// (definida en Manuales.css) — así cada rol tiene su propia identidad visual
// sin repetir estilos por sección.
const SECCIONES = [
    {
        id: 'admin',
        color: 'morado',
        icono: icoAdmin,
        titulo: 'Administradores de Escuela',
        subtitulo: 'Para directores y coordinadores',
        video: VIDEO_PANEL.admin,
        pasos: [
            'Registra tu institución en Blockids.',
            'Obtén el PIN Docente de tu escuela para compartirlo con tus maestros.',
            'Gestiona a tus maestros desde tu panel de administración.',
        ],
    },
    {
        id: 'docente',
        color: 'azul',
        icono: icoDocente,
        titulo: 'Docentes',
        subtitulo: 'Para profesores y mentores',
        video: VIDEO_PANEL.docente,
        pasos: [
            'Regístrate con la clave de tu escuela y el PIN Docente.',
            'Crea tu cuenta de profesor en la plataforma.',
            'Genera códigos de aula para que tus alumnos se unan a tu clase.',
        ],
    },
    {
        id: 'alumno',
        color: 'verde',
        icono: icoAlumno,
        titulo: 'Alumnos',
        subtitulo: 'Para estudiantes',
        video: VIDEO_PANEL.alumno,
        pasos: [
            'Regístrate con el Código de Aula que te dio tu profesor.',
            'Crea tu cuenta en el panel Blockids y elige tu nombre de usuario.',
            'Gana XP en tus proyectos y mantén tu racha activa todos los días.',
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────

const Manuales = ({ session, rolPerfil }) => {
    useDocumentTitle('Manuales de Uso');

    const urlDashboard = session ? rutaDashboard(rolPerfil) : '/registro';

    return (
        <div className={styles.pagina}>
            <Navbar urlDashboard={urlDashboard} />

            {/* ══════════ HERO ══════════ */}
            <section className={styles.hero}>
                <div className={styles.heroContenido}>
                    <img src={xolotlExplicandoCodigo} alt="Xolotl explicando" className={styles.heroXolotl} />
                    <div>
                        <span className={styles.heroEyebrow}>Guías paso a paso</span>
                        <h1 className={styles.heroTitulo}>Manuales de Uso</h1>
                        <p className={styles.heroDesc}>
                            Todo lo que necesitas para empezar en Blockids, ya sea que dirijas una
                            escuela, des clases o estés listo para programar tu primer proyecto.
                        </p>
                    </div>
                </div>
            </section>

            {/* ══════════ TARJETAS POR ROL ══════════ */}
            <section className={styles.contenido}>
                <div className={styles.container}>
                    <div className={styles.grid}>
                        {SECCIONES.map((sec) => {
                            return (
                                <article
                                    key={sec.id}
                                    className={`${styles.card} ${styles[`card_${sec.color}`]}`}
                                >
                                    <div className={`${styles.iconoCirculo} ${styles[`icono_${sec.color}`]}`}>
                                        <img src={sec.icono} alt="" aria-hidden="true" className={styles.iconoImg} />
                                    </div>

                                    <h2 className={styles.cardTitulo}>{sec.titulo}</h2>
                                    <p className={styles.cardSubtitulo}>{sec.subtitulo}</p>

                                    <ol className={styles.pasos}>
                                        {sec.pasos.map((paso, idx) => (
                                            <li key={paso} className={styles.paso}>
                                                <span className={`${styles.pasoNum} ${styles[`num_${sec.color}`]}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className={styles.pasoTexto}>{paso}</span>
                                            </li>
                                        ))}
                                    </ol>

                                    <p className={styles.videoNota}>
                                         Recorrido del panel — no es un tutorial de registro
                                    </p>
                                    <a
                                        href={sec.video || CANAL_YOUTUBE}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.btnVideo}
                                    >
                                        <PlayCircle size={20} />
                                        Ver recorrido del panel
                                    </a>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════ ENTORNO DE PROGRAMACIÓN (FORK DE BLOCKIDS) ══════════ */}
            <section className={styles.entornoSection}>
                <div className={styles.container}>
                    <article className={styles.entornoCard}>
                        <div className={styles.entornoInfo}>
                            <div className={`${styles.iconoCirculo} ${styles.icono_naranja}`}>
                                <img src={icoEntorno} alt="" aria-hidden="true" className={styles.iconoImg} />
                            </div>
                            <span className={styles.entornoEyebrow}>Panel del entorno</span>
                            <h2 className={styles.cardTitulo}>Cómo se usa el entorno de programación</h2>
                            <p className={styles.cardSubtitulo}>El editor por bloques BLOCKIDS</p>

                            <ol className={styles.pasos}>
                                <li className={styles.paso}>
                                    <span className={`${styles.pasoNum} ${styles.num_naranja}`}>1</span>
                                    <span className={styles.pasoTexto}>
                                        Abre un proyecto desde tu panel para entrar al entorno de bloques.
                                    </span>
                                </li>
                                <li className={styles.paso}>
                                    <span className={`${styles.pasoNum} ${styles.num_naranja}`}>2</span>
                                    <span className={styles.pasoTexto}>
                                        Arrastra los bloques al área de trabajo y conéctalos para armar tu lógica.
                                    </span>
                                </li>
                                <li className={styles.paso}>
                                    <span className={`${styles.pasoNum} ${styles.num_naranja}`}>3</span>
                                    <span className={styles.pasoTexto}>
                                        Ejecuta tu código, revisa el resultado y guarda para enviar tu proyecto.
                                    </span>
                                </li>
                            </ol>
                        </div>

                        <div className={styles.entornoVideo}>
                            <iframe
                                className={styles.entornoIframe}
                                src={VIDEO_ENTORNO_EMBED}
                                title="Cómo se usa el entorno de Blockids"
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>
                    </article>
                </div>
            </section>

            {/* ══════════ AYUDA / SOPORTE ══════════ */}
            <section className={styles.ayudaSection}>
                <div className={styles.container}>
                    <div className={styles.ayudaCard}>
                        <div className={styles.ayudaIcono}>
                            <Mail size={26} color="#ffffff" />
                        </div>
                        <div className={styles.ayudaTexto}>
                            <h2 className={styles.ayudaTitulo}>¿Necesitas ayuda?</h2>
                            <p className={styles.ayudaDesc}>
                                Si tienes dudas que no cubren estos manuales, escríbenos y te ayudamos.
                            </p>
                        </div>
                        <a href={`mailto:${CORREO_SOPORTE}`} className={styles.ayudaCorreo}>
                            {CORREO_SOPORTE}
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

Manuales.propTypes = {
    session: PropTypes.object,
    rolPerfil: PropTypes.string,
};

export default Manuales;

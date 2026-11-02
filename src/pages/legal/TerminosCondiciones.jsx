import React from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

const TerminosCondiciones = () => {
    const secciones = [
        {
            numero: '1',
            titulo: 'Naturaleza del Servicio',
            icono: '💻',
            color: 'morado',
            contenido: (
                <p>
                    <strong>BLOCKIDS</strong> es una plataforma web educativa de entorno de
                    programación por bloques lógicos. Este sistema ha sido desarrollado como
                    un proyecto académico de residencias profesionales y no persigue fines
                    de lucro ni comerciales.
                </p>
            )
        },
        {
            numero: '2',
            titulo: 'Responsabilidad de las Cuentas',
            icono: '🛡️',
            color: 'verde',
            contenido: (
                <ul>
                    <li>
                        El uso de la plataforma por parte de menores de edad debe ser siempre
                        supervisado por un adulto.
                    </li>
                    <li>
                        El tutor legal es el único responsable de mantener la confidencialidad
                        de la contraseña y de todas las actividades que ocurran bajo la cuenta
                        del usuario.
                    </li>
                </ul>
            )
        },
        {
            numero: '3',
            titulo: 'Propiedad Intelectual y Uso de Tecnologías',
            icono: '⭐',
            color: 'naranja',
            contenido: (
                <ul>
                    <li>
                        BLOCKIDS respeta la propiedad intelectual de terceros. La plataforma
                        hace uso de tecnologías de código abierto (Open Source) adaptadas para
                        fines educativos, y se rige bajo los lineamientos de las licencias
                        originales de dichas tecnologías.
                    </li>
                    <li>
                        Los proyectos, lógicas y creaciones desarrolladas por los usuarios
                        dentro de la plataforma son propiedad de sus respectivos creadores.
                        BLOCKIDS no reclama derechos de autor sobre el código generado por
                        los niños.
                    </li>
                </ul>
            )
        },
        {
            numero: '4',
            titulo: 'Disponibilidad y Limitación de Responsabilidad',
            icono: '⚙️',
            color: 'azul',
            etiqueta: 'Cláusula As-Is',
            contenido: (
                <>
                    <p>
                        Dado que BLOCKIDS es un proyecto en fase de desarrollo académico,
                        la plataforma se proporciona “tal cual” (As-Is) y según su disponibilidad.
                    </p>
                    <ul>
                        <li>
                            No se garantiza que el servicio sea ininterrumpido o libre de errores.
                        </li>
                        <li>
                            El equipo desarrollador no se hace responsable por la pérdida temporal
                            o permanente de proyectos, avances o datos alojados en las bases de
                            datos por fallas técnicas en los servidores o mantenimientos del sistema.
                        </li>
                    </ul>
                </>
            )
        },
        {
            numero: '5',
            titulo: 'Normas de Comportamiento',
            icono: '🤝',
            color: 'turquesa',
            contenido: (
                <p>
                    Al ser un entorno educativo, se espera que el uso de la plataforma sea
                    respetuoso y enfocado al aprendizaje. Cualquier uso indebido, intento de
                    vulnerar la seguridad del sitio o comportamiento que afecte el funcionamiento
                    del mismo resultará en la baja inmediata de la cuenta.
                </p>
            )
        },
        {
            numero: '6',
            titulo: 'Contacto',
            icono: '📩',
            color: 'rosa',
            contenido: (
                <p>
                    Para dudas relacionadas con estos términos o con el funcionamiento de
                    BLOCKIDS, puede contactarnos en{' '}
                    <a href="mailto:blockids.oficial@gmail.com">
                        blockids.oficial@gmail.com
                    </a>.
                </p>
            )
        }
    ];

    return (
        <div className="pagina-legal">

            <article className="legal-container">

                {/* REGRESAR AL INICIO */}
                <Link to="/" className="legal-volver">
                    <span>←</span> Volver al inicio
                </Link>

                {/* ENCABEZADO */}
                <header className="legal-hero">

                    <div className="legal-hero-documento">
                        <span className="legal-documento-icono">📋</span>
                        <span className="legal-documento-check">✓</span>
                    </div>

                    <div className="legal-hero-texto">
                        <span className="legal-etiqueta">
                            BLOCKIDS · INFORMACIÓN LEGAL
                        </span>

                        <h1 className="legal-titulo">
                            Términos y
                            <span> Condiciones de Uso</span>
                        </h1>

                        <div className="legal-subtitulo">
                            <span>📅</span>
                            Última actualización: Mayo de 2026
                        </div>
                    </div>

                    <div className="legal-hero-mascota">
                        <div className="legal-mascota-icono">🦎</div>
                        <div className="legal-mascota-logo">BLOCKIDS</div>
                    </div>

                    <span className="legal-decoracion legal-decoracion-1">✦</span>
                    <span className="legal-decoracion legal-decoracion-2">✦</span>

                </header>

                {/* BIENVENIDA */}
                <div className="legal-bienvenida">

                    <div className="legal-bienvenida-icono">
                        i
                    </div>

                    <p>
                        Bienvenido a <strong>BLOCKIDS</strong>. Al acceder y utilizar esta
                        plataforma, el usuario y su tutor legal aceptan sujetarse a los
                        siguientes Términos y Condiciones. Si no está de acuerdo con ellos,
                        le solicitamos amablemente no utilizar el servicio.
                    </p>

                </div>

                {/* CONTENIDO LEGAL */}
                <section className="legal-secciones">

                    {secciones.map((seccion) => (
                        <section
                            key={seccion.numero}
                            className={`legal-card legal-${seccion.color}`}
                        >

                            <div className="legal-card-encabezado">

                                <span className="legal-card-numero">
                                    {seccion.numero}
                                </span>

                                <h2>
                                    {seccion.titulo}

                                    {seccion.etiqueta && (
                                        <span className="legal-card-etiqueta">
                                            {seccion.etiqueta}
                                        </span>
                                    )}
                                </h2>

                            </div>

                            <div className="legal-card-cuerpo">

                                <div className="legal-card-ilustracion">
                                    <span>{seccion.icono}</span>
                                </div>

                                <div className="legal-card-divisor"></div>

                                <div className="legal-card-texto">
                                    {seccion.contenido}
                                </div>

                            </div>

                        </section>
                    ))}

                </section>

                {/* PIE DE PÁGINA */}
                <footer className="legal-footer">

                    <span className="legal-footer-icono">💜</span>

                    <div>
                        <strong>¡Gracias por formar parte de BLOCKIDS!</strong>
                        <p>
                            Aprender, crear y programar es una aventura.
                        </p>
                    </div>

                </footer>

            </article>

        </div>
    );
};

export default TerminosCondiciones;

import React from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

const AvisoPrivacidad = () => {

    const secciones = [
        {
            numero: '1',
            titulo: 'Responsable del Tratamiento de Datos Personales',
            icono: '🏢',
            color: 'morado',
            contenido: (
                <p>
                    La administración de la plataforma BLOCKIDS y el tratamiento de los datos
                    recabados están a cargo del equipo desarrollador del proyecto de residencias
                    profesionales, con domicilio en H. Matamoros, Tamaulipas. Para cualquier duda
                    o solicitud relacionada con este aviso, puede contactarnos a través del correo
                    electrónico:{' '}
                    <a href="mailto:blockids.oficial@gmail.com">
                        blockids.oficial@gmail.com
                    </a>.
                </p>
            )
        },
        {
            numero: '2',
            titulo: 'Datos Personales Recabados y Finalidad',
            icono: '📋',
            color: 'verde',
            contenido: (
                <>
                    <p>
                        Al ser una plataforma dirigida a menores de edad para el aprendizaje
                        de programación mediante bloques digitales, es estrictamente obligatorio
                        que el registro sea realizado por el padre, madre o tutor legal.
                    </p>

                    <p>
                        Los datos recabados (como nombre de usuario, dirección de correo
                        electrónico del tutor y progreso de los proyectos) se utilizarán
                        única y exclusivamente para:
                    </p>

                    <ul>
                        <li>Creación y gestión de la cuenta de usuario.</li>
                        <li>
                            Almacenamiento seguro del progreso de los proyectos creados
                            en la plataforma.
                        </li>
                        <li>
                            Fines puramente académicos y de evaluación del proyecto
                            de residencias.
                        </li>
                    </ul>

                    <p>
                        En ningún caso BLOCKIDS solicitará datos sensibles ni comercializará
                        la información con terceros.
                    </p>

                    <div className="legal-privacidad-subapartado">
                        <h3>
                            <span>2.1.</span> Uso Institucional o Escolar
                        </h3>

                        <p>
                            En los casos donde BLOCKIDS sea implementado dentro de un entorno
                            escolar o educativo, será la Institución Educativa o el Docente a
                            cargo quien fungirá como responsable de la creación de las cuentas
                            de los menores. Al registrar a sus alumnos en la plataforma, la
                            Institución garantiza que cuenta con el consentimiento previo y
                            por escrito de los padres o tutores legales para el uso de
                            herramientas educativas digitales.
                        </p>

                        <p>
                            En este escenario, BLOCKIDS no recabará correos electrónicos de
                            los padres, vinculando las cuentas de los estudiantes directamente
                            al perfil del docente responsable. El docente o administrador
                            escolar se registra con su correo institucional y genera los
                            accesos (nombre de usuario y contraseña) para cada estudiante.
                            De esta forma, garantizamos la privacidad de los menores sin
                            necesidad de involucrar datos personales de sus padres más allá
                            del consentimiento previo que la institución ya ha obtenido.
                        </p>
                    </div>
                </>
            )
        },
        {
            numero: '3',
            titulo: 'Tratamiento de Datos de Menores de Edad',
            icono: '🧒',
            color: 'naranja',
            contenido: (
                <p>
                    BLOCKIDS reconoce la importancia de proteger la privacidad de los menores.
                    El tratamiento de los datos se realiza bajo estricto consentimiento del
                    tutor legal. Si usted es padre o tutor y detecta que se ha creado una
                    cuenta sin su consentimiento, por favor contáctenos inmediatamente
                    para proceder a su eliminación.
                </p>
            )
        },
        {
            numero: '4',
            titulo: 'Derechos ARCO',
            subtitulo: 'Acceso · Rectificación · Cancelación · Oposición',
            icono: '🔐',
            color: 'azul',
            contenido: (
                <>
                    <p>
                        Usted o su tutor legal tienen derecho a conocer qué datos personales
                        tenemos, para qué los utilizamos y las condiciones de uso
                        <strong> (Acceso)</strong>. Asimismo, es su derecho solicitar la
                        corrección de su información en caso de estar desactualizada o ser
                        incorrecta <strong>(Rectificación)</strong>; que la eliminemos de
                        nuestros registros o bases de datos <strong>(Cancelación)</strong>;
                        así como oponerse al uso de sus datos personales para fines
                        específicos <strong>(Oposición)</strong>.
                    </p>

                    <p>
                        Para ejercer cualquiera de estos derechos, deberá enviar una
                        solicitud al correo electrónico previamente mencionado.
                    </p>

                    <div className="legal-arco-grid">
                        <div className="legal-arco-item">
                            <strong>A</strong>
                            <span>Acceso</span>
                        </div>
                        <div className="legal-arco-item">
                            <strong>R</strong>
                            <span>Rectificación</span>
                        </div>
                        <div className="legal-arco-item">
                            <strong>C</strong>
                            <span>Cancelación</span>
                        </div>
                        <div className="legal-arco-item">
                            <strong>O</strong>
                            <span>Oposición</span>
                        </div>
                    </div>
                </>
            )
        },
        {
            numero: '5',
            titulo: 'Cambios al Aviso de Privacidad',
            icono: '🔔',
            color: 'rosa',
            contenido: (
                <p>
                    El presente aviso de privacidad puede sufrir modificaciones derivadas
                    de requerimientos legales o de la actualización del proyecto. Cualquier
                    cambio será notificado a través de la interfaz principal de la plataforma.
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
                        <span className="legal-documento-icono">🔒</span>
                        <span className="legal-documento-check">✓</span>
                    </div>

                    <div className="legal-hero-texto">

                        <span className="legal-etiqueta">
                            BLOCKIDS · PROTECCIÓN DE INFORMACIÓN
                        </span>

                        <h1 className="legal-titulo">
                            Aviso de
                            <span> Privacidad</span>
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

                {/* INTRODUCCIÓN */}
                <div className="legal-bienvenida legal-privacidad-intro">

                    <div className="legal-bienvenida-icono">
                        🔐
                    </div>

                    <p>
                        En cumplimiento a lo dispuesto por la Ley Federal de Protección
                        de Datos Personales en Posesión de los Particulares (en adelante,
                        la <strong>“Ley”</strong>) y su Reglamento, <strong>BLOCKIDS</strong>,
                        proyecto de carácter académico y educativo desarrollado en
                        H. Matamoros, Tamaulipas, México, informa lo siguiente:
                    </p>

                </div>

                {/* SECCIONES */}
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
                                </h2>

                            </div>

                            <div className="legal-card-cuerpo">

                                <div className="legal-card-ilustracion">
                                    <span>{seccion.icono}</span>
                                </div>

                                <div className="legal-card-divisor"></div>

                                <div className="legal-card-texto">

                                    {seccion.subtitulo && (
                                        <div className="legal-privacidad-subtitulo">
                                            {seccion.subtitulo}
                                        </div>
                                    )}

                                    {seccion.contenido}

                                </div>

                            </div>

                        </section>

                    ))}

                </section>

                {/* CONTACTO */}
                <div className="legal-privacidad-contacto">

                    <div className="legal-contacto-icono">
                        ✉️
                    </div>

                    <div>
                        <h3>¿Tienes dudas sobre tu privacidad?</h3>
                        <p>
                            Estamos disponibles para atender tus solicitudes y consultas.
                        </p>

                        <a href="mailto:blockids.oficial@gmail.com">
                            blockids.oficial@gmail.com
                        </a>
                    </div>

                </div>

                {/* PIE DE PÁGINA */}
                <footer className="legal-footer">

                    <span className="legal-footer-icono">💜</span>

                    <div>
                        <strong>Tu privacidad también forma parte de nuestro aprendizaje.</strong>
                        <p>
                            En BLOCKIDS aprendemos, creamos y protegemos nuestra información.
                        </p>
                    </div>

                </footer>

            </article>

        </div>
    );
};

export default AvisoPrivacidad;


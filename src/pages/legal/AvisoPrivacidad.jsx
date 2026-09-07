import React from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

const AvisoPrivacidad = () => (
    <div className="pagina-legal">
        <article className="legal-container">

            <Link to="/" className="legal-volver">← Volver al inicio</Link>

            <h1 className="legal-titulo">Aviso de Privacidad</h1>
            <p className="legal-subtitulo">Última actualización: Mayo de 2026</p>

            <hr className="legal-divider" />

            <p>
                En cumplimiento a lo dispuesto por la Ley Federal de Protección de Datos Personales en
                Posesión de los Particulares (en adelante, la &ldquo;Ley&rdquo;) y su Reglamento,
                <strong>BLOCKIDS</strong>, proyecto de carácter académico y educativo desarrollado en
                H. Matamoros, Tamaulipas, México, informa lo siguiente:
            </p>

            <section>
                <h2>1. Responsable del Tratamiento de Datos Personales</h2>
                <p>
                    La administración de la plataforma BLOCKIDS y el tratamiento de los datos recabados
                    están a cargo del equipo desarrollador del proyectoo de residencias profesionales, con
                    domicilio en H. Matamoros, Tamaulipas. Para cualquier duda o solicitud relacionada con
                    este aviso, puede contactarnos a través del correo electrónico:{' '}
                    <a href="mailto:blockids.oficial@gmail.com">blockids.oficial@gmail.com</a>.
                </p>
            </section>

            <section>
                <h2>2. Datos Personales Recabados y Finalidad</h2>
                <p>
                    Al ser una plataforma dirigida a menores de edad para el aprendizaje de programación
                    mediante bloques digitales, es estrictamente obligatorio que el registro sea realizado
                    por el padre, madre o tutor legal.
                </p>
                <p>
                    Los datos recabados (como nombre de usuario, dirección de correo electrónico del tutor
                    y progreso de los proyectos) se utilizarán única y exclusivamente para:
                </p>
                <ul>
                    <li>Creación y gestión de la cuenta de usuario.</li>
                    <li>Almacenamiento seguro del progreso de los proyectos creados en la plataforma.</li>
                    <li>Fines puramente académicos y de evaluación del proyecto de residencias.</li>
                </ul>
                <p>
                    En ningún caso BLOCKIDS solicitará datos sensibles ni comercializará la información
                    con terceros.
                </p>

                <h3>2.1. Uso Institucional o Escolar</h3>
                <p>
                    En los casos donde BLOCKIDS sea implementado dentro de un entorno escolar o educativo,
                    será la Institución Educativa o el Docente a cargo quien fungirá como responsable de
                    la creación de las cuentas de los menores. Al registrar a sus alumnos en la plataforma,
                    la Institución garantiza que cuenta con el consentimiento previo y por escrito de los
                    padres o tutores legales para el uso de herramientas educativas digitales.
                </p>
                <p>
                    En este escenario, BLOCKIDS no recabará correos electrónicos de los padres, vinculando
                    las cuentas de los estudiantes directamente al perfil del docente responsable. El docente
                    o administrador escolar se registra con su correo institucional y genera los accesos
                    (nombre de usuario y contraseña) para cada estudiante. De esta forma, garantizamos la
                    privacidad de los menores sin necesidad de involucrar datos personales de sus padres
                    más allá del consentimiento previo que la institución ya ha obtenido.
                </p>
            </section>

            <section>
                <h2>3. Tratamiento de Datos de Menores de Edad</h2>
                <p>
                    BLOCKIDS reconoce la importancia de proteger la privacidad de los menores. El
                    tratamiento de los datos se realiza bajo estricto consentimiento del tutor legal. Si
                    usted es padre o tutor y detecta que se ha creado una cuenta sin su consentimiento,
                    por favor contáctenos inmediatamente para proceder a su eliminación.
                </p>
            </section>

            <section>
                <h2>4. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h2>
                <p>
                    Usted o su tutor legal tienen derecho a conocer qué datos personales tenemos, para qué
                    los utilizamos y las condiciones de uso <strong>(Acceso)</strong>. Asimismo, es su
                    derecho solicitar la corrección de su información en caso de estar desactualizada o ser
                    incorrecta <strong>(Rectificación)</strong>; que la eliminemos de nuestros registros o
                    bases de datos <strong>(Cancelación)</strong>; así como oponerse al uso de sus datos
                    personales para fines específicos <strong>(Oposición)</strong>.
                </p>
                <p>
                    Para ejercer cualquiera de estos derechos, deberá enviar una solicitud al correo
                    electrónico previamente mencionado.
                </p>
            </section>

            <section>
                <h2>5. Cambios al Aviso de Privacidad</h2>
                <p>
                    El presente aviso de privacidad puede sufrir modificaciones derivadas de requerimientos
                    legales o de la actualización del proyecto. Cualquier cambio será notificado a través
                    de la interfaz principal de la plataforma.
                </p>
            </section>

        </article>
    </div>
);

export default AvisoPrivacidad;

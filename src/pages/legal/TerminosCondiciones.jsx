import React from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

const TerminosCondiciones = () => (
    <div className="pagina-legal">
        <div className="legal-container">

            <Link to="/" className="legal-volver">← Volver al inicio</Link>

            <h1 className="legal-titulo">Términos y Condiciones de Uso</h1>
            <p className="legal-subtitulo">Última actualización: Mayo de 2026</p>

            <hr className="legal-divider" />

            <p>
                Bienvenido a <strong>BLOCKIDS</strong>. Al acceder y utilizar esta plataforma, el
                usuario y su tutor legal aceptan sujetarse a los siguientes Términos y Condiciones.
                Si no está de acuerdo con ellos, le solicitamos amablemente no utilizar el servicio.
            </p>

            <h2>1. Naturaleza del Servicio</h2>
            <p>
                BLOCKIDS es una plataforma web educativa de entorno de programación por bloques
                lógicos. Este sistema ha sido desarrollado como un proyecto académico de residencias
                profesionales y no persigue fines de lucro ni comerciales.
            </p>

            <h2>2. Responsabilidad de las Cuentas</h2>
            <ul>
                <li>
                    El uso de la plataforma por parte de menores de edad debe ser siempre supervisado
                    por un adulto.
                </li>
                <li>
                    El tutor legal es el único responsable de mantener la confidencialidad de la
                    contraseña y de todas las actividades que ocurran bajo la cuenta del usuario.
                </li>
            </ul>

            <h2>3. Propiedad Intelectual y Uso de Tecnologías</h2>
            <ul>
                <li>
                    BLOCKIDS respeta la propiedad intelectual de terceros. La plataforma hace uso de
                    tecnologías de código abierto (Open Source) adaptadas para fines educativos, y se
                    rige bajo los lineamientos de las licencias originales de dichas tecnologías.
                </li>
                <li>
                    Los proyectos, lógicas y creaciones desarrolladas por los usuarios dentro de la
                    plataforma son propiedad de sus respectivos creadores. BLOCKIDS no reclama
                    derechos de autor sobre el código generado por los niños.
                </li>
            </ul>

            <h2>4. Disponibilidad y Limitación de Responsabilidad (Cláusula "As-Is")</h2>
            <p>
                Dado que BLOCKIDS es un proyecto en fase de desarrollo académico, la plataforma se
                proporciona &ldquo;tal cual&rdquo; (As-Is) y según su disponibilidad.
            </p>
            <ul>
                <li>No se garantiza que el servicio sea ininterrumpido o libre de errores.</li>
                <li>
                    El equipo desarrollador no se hace responsable por la pérdida temporal o
                    permanente de proyectos, avances o datos alojados en las bases de datos por
                    fallas técnicas en los servidores o mantenimientos del sistema.
                </li>
            </ul>

            <h2>5. Normas de Comportamiento</h2>
            <p>
                Al ser un entorno educativo, se espera que el uso de la plataforma sea respetuoso y
                enfocado al aprendizaje. Cualquier uso indebido, intento de vulnerar la seguridad del
                sitio o comportamiento que afecte el funcionamiento del mismo resultará en la baja
                inmediata de la cuenta.
            </p>

        </div>
    </div>
);

export default TerminosCondiciones;

import React from 'react';
import cls from './Aliados.css';
import itLogo from '../../assets/logos/logo-it.png';

// ─────────────────────────────────────────────────────────────────────────────
// DATA — Aliados / Comunidad
// (agrega aquí más patrocinadores; el marquee se adapta solo)
// ─────────────────────────────────────────────────────────────────────────────
const ALIADOS = [
    {
        nombre: 'ITM',
        url: 'https://www.itmatamoros.edu.mx',
        iniciales: 'IT',
        descripcion: 'Aliado académico que respalda el desarrollo de Blockids.',
        logo: itLogo,   // <-el mini logo cuando lo tengas
    },
    {
        nombre: 'SI PODEMOS',
        url: '#',
        iniciales: 'SP',
        descripcion: 'Voluntarios por la educación digital.',
    },
    {
        nombre: 'Rotaract',
        url: '#',
        iniciales: 'R',
        descripcion: 'Lorem ipsum dolor sit amet, comunidad que inspira y transforma.',
    },
];

// Repetimos la lista para llenar pantallas anchas; ese "grupo" se pinta dos
// veces dentro de la pista y la animación lo desplaza -50% (justo un grupo),
// logrando un bucle continuo sin saltos.
const GRUPO = [0, 1, 2, 3].reduce(
    (acc, rep) => acc.concat(ALIADOS.map((a) => ({ ...a, key: `${a.iniciales}-${rep}` }))),
    []
);

const renderGrupo = (oculto) => (
    <ul className={cls.group} aria-hidden={oculto ? 'true' : null}>
        {GRUPO.map((a) => (
            <li key={a.key}>
                <a
                    className={cls.card}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span className={cls.logo} aria-hidden="true">
                        {a.logo ? <img src={a.logo} alt="" /> : a.iniciales}
                    </span>
                    <span className={cls.info}>
                        <span className={cls.nombre}>{a.nombre}</span>
                        <span className={cls.descripcion}>{a.descripcion}</span>
                    </span>
                </a>
            </li>
        ))}
    </ul>
);

const Aliados = () => (
    <section id="comunidad" className={cls.aliadosSection}>
        <div className={cls.container}>
            <h2 className={cls.titulo}>Nuestra Comunidad y Aliados</h2>
        </div>

        <div className={cls.marquee}>
            <div className={cls.track}>
                {renderGrupo(false)}
                {renderGrupo(true)}
            </div>
        </div>
    </section>
);

export default Aliados;

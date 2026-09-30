import React from 'react';
import styles from './VistaMinijuegos.css';

import bloqueAzul     from '../../../assets/elementos/bloque-azul.svg';
import bloqueAmarillo from '../../../assets/elementos/bloque-amarillo.svg';
import bloqueMorado   from '../../../assets/elementos/bloque-morado.svg';
import estrellaAm     from '../../../assets/elementos/estrella-amarilla.svg';


// Zona de Minijuegos
// onVolver: handler para regresar a la vista de Inicio
const VistaMinijuegos = ({ onVolver }) => {

    return (
        <div className={styles.minijuegos}>

            {/* =====================================================
                DECORACIONES
            ====================================================== */}

            <img
                src={bloqueAzul}
                alt=""
                aria-hidden="true"
                className={`${styles.deco} ${styles.decoB1}`}
            />

            <img
                src={bloqueAmarillo}
                alt=""
                aria-hidden="true"
                className={`${styles.deco} ${styles.decoB2}`}
            />

            <img
                src={bloqueMorado}
                alt=""
                aria-hidden="true"
                className={`${styles.deco} ${styles.decoB3}`}
            />

            <img
                src={estrellaAm}
                alt=""
                aria-hidden="true"
                className={`${styles.deco} ${styles.decoS1}`}
            />

            <img
                src={estrellaAm}
                alt=""
                aria-hidden="true"
                className={`${styles.deco} ${styles.decoS2}`}
            />


            {/* =====================================================
                ENCABEZADO
            ====================================================== */}

            <header className={styles.minijuegosHeader}>

                <h1>
                    🎮 Minijuegos de Lógica
                </h1>

                <p>
                    Fortalece tus habilidades de algoritmos, retención y
                    análisis resolviendo retos interactivos.
                </p>

            </header>


            {/* =====================================================
                ESTADÍSTICAS DEL USUARIO
            ====================================================== */}

            <section className={styles.stats}>

                <div className={styles.statCard}>

                    <div className={styles.statIcon}>
                        ⭐
                    </div>

                    <div className={styles.statInfo}>
                        <span>XP Ganados</span>
                        <strong>350 XP</strong>
                    </div>

                </div>


                <div className={styles.statCard}>

                    <div className={styles.statIcon}>
                        🔥
                    </div>

                    <div className={styles.statInfo}>
                        <span>Racha</span>
                        <strong>3 días</strong>
                    </div>

                </div>


                <div className={styles.statCard}>

                    <div className={styles.statIcon}>
                        🛡️
                    </div>

                    <div className={styles.statInfo}>
                        <span>Nivel</span>
                        <strong>Nivel 2</strong>
                    </div>

                </div>

            </section>


            {/* =====================================================
                VOLVER
            ====================================================== */}

            <button
                type="button"
                className={styles.btnVolver}
                onClick={onVolver}
            >
                ← Volver al Inicio
            </button>


            {/* =====================================================
                FILTROS
            ====================================================== */}

            <section className={styles.filtros}>

                <div className={styles.filtrosTitulo}>
                    Filtrar por:
                </div>

                <div className={styles.filtrosBotones}>

                    <button
                        type="button"
                        className={`${styles.filtroBtn} ${styles.activo}`}
                    >
                        Todos (3)
                    </button>

                    <button
                        type="button"
                        className={styles.filtroBtn}
                    >
                        🧠 Lógica
                    </button>

                    <button
                        type="button"
                        className={styles.filtroBtn}
                    >
                        💻 Sintaxis
                    </button>

                    <button
                        type="button"
                        className={styles.filtroBtn}
                    >
                        ⚡ Patrones
                    </button>

                </div>

            </section>


            {/* =====================================================
                TARJETAS DE MINIJUEGOS
            ====================================================== */}

            <section className={styles.juegosGrid}>


                {/* =================================================
                    JUEGO 1
                ================================================== */}

                <article className={styles.juegoCard}>

                    <div className={styles.juegoPortada}>

                        <span className={styles.dificultad}>
                            Fácil
                        </span>

                        <div className={styles.juegoIcono}>
                            🎯
                        </div>

                    </div>


                    <div className={styles.juegoContenido}>

                        <h2>
                            Adivina el Número
                        </h2>

                        <p className={styles.juegoDescripcion}>
                            Ejercita la lógica deductiva encontrando
                            el número secreto en los menores intentos.
                        </p>


                        <div className={styles.juegoInfo}>

                            <span
                                className={`${styles.juegoTag} ${styles.juegoXp}`}
                            >
                                ⭐ +50 XP
                            </span>

                            <span className={styles.juegoTag}>
                                Pensamiento Lógico
                            </span>

                        </div>


                        <button
                            type="button"
                            className={styles.btnJugar}
                        >
                            Jugar Ahora →
                        </button>

                    </div>

                </article>


                {/* =================================================
                    JUEGO 2
                ================================================== */}

                <article className={styles.juegoCard}>

                    <div className={styles.juegoPortada}>

                        <span className={styles.dificultad}>
                            Intermedio
                        </span>

                        <div className={styles.juegoIcono}>
                            🧩
                        </div>

                    </div>


                    <div className={styles.juegoContenido}>

                        <h2>
                            Memoria de Código
                        </h2>

                        <p className={styles.juegoDescripcion}>
                            Encuentra las parejas de instrucciones
                            de programación asociadas.
                        </p>


                        <div className={styles.juegoInfo}>

                            <span
                                className={`${styles.juegoTag} ${styles.juegoXp}`}
                            >
                                ⭐ +75 XP
                            </span>

                            <span className={styles.juegoTag}>
                                Sintaxis y Comandos
                            </span>

                        </div>


                        <button
                            type="button"
                            className={styles.btnJugar}
                        >
                            Jugar Ahora →
                        </button>

                    </div>

                </article>


                {/* =================================================
                    JUEGO 3
                ================================================== */}

                <article className={styles.juegoCard}>

                    <div className={styles.juegoPortada}>

                        <span className={styles.dificultad}>
                            Desafío
                        </span>

                        <div className={styles.juegoIcono}>
                            🧠
                        </div>

                    </div>


                    <div className={styles.juegoContenido}>

                        <h2>
                            Secuencia Lógica
                        </h2>

                        <p className={styles.juegoDescripcion}>
                            Memoriza y repite el patrón secuencial
                            de luces en el orden exacto.
                        </p>


                        <div className={styles.juegoInfo}>

                            <span
                                className={`${styles.juegoTag} ${styles.juegoXp}`}
                            >
                                ⭐ +100 XP
                            </span>

                            <span className={styles.juegoTag}>
                                Algoritmos y Patrones
                            </span>

                        </div>


                        <button
                            type="button"
                            className={styles.btnJugar}
                        >
                            Jugar Ahora →
                        </button>

                    </div>

                </article>


            </section>

        </div>
    );
};


export default VistaMinijuegos;
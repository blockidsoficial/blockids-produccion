import React, { useState, useEffect } from 'react';
import styles from './VistaMinijuegos.css';

import bloqueAzul     from '../../../assets/elementos/bloque-azul.svg';
import bloqueAmarillo from '../../../assets/elementos/bloque-amarillo.svg';
import bloqueMorado   from '../../../assets/elementos/bloque-morado.svg';
import estrellaAm     from '../../../assets/elementos/estrella-amarilla.svg';
import { obtenerProgreso, completarJuego } from '../../../services/progresoMinijuegos';


// ============================================================
// VISTA PRINCIPAL
// ============================================================

const VistaMinijuegos = ({ onVolver }) => {

    const [juegoActivo, setJuegoActivo] = useState(null);
    const [xp, setXp] = useState(0);
    const [racha, setRacha] = useState(0);
    const [nivel, setNivel] = useState(1);
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    // Cargar las estadísticas guardadas en Supabase al entrar.
    useEffect(() => {
        let componenteActivo = true;

        const cargar = async () => {
            try {
                const progreso = await obtenerProgreso();

                if (componenteActivo) {
                    setXp(progreso.xp ?? 0);
                    setRacha(progreso.racha ?? 0);
                    setNivel(progreso.nivel ?? 1);
                }
            } catch (error) {
                console.error('No se pudo cargar el progreso de minijuegos:', error);
            } finally {
                if (componenteActivo) {
                    setCargandoProgreso(false);
                }
            }
        };

        cargar();

        return () => {
            componenteActivo = false;
        };
    }, []);

    // Registrar en Supabase el juego completado.
    const ganarXP = async (juego) => {
        try {
            const resultado = await completarJuego(juego);

            if (resultado?.progreso) {
                setXp(resultado.progreso.xp ?? 0);
                setRacha(resultado.progreso.racha ?? 0);
                setNivel(resultado.progreso.nivel ?? 1);
            }

            if (resultado?.yaJugadoHoy) {
                window.alert(
                    'Ya ganaste XP con este minijuego hoy. Puedes volver a jugarlo mañana para ganar XP nuevamente.'
                );
            } else if (resultado?.xpGanada > 0) {
                window.alert(`¡Completaste el juego y ganaste ${resultado.xpGanada} XP!`);
            }

            return resultado;
        } catch (error) {
            console.error('No se pudo guardar el progreso:', error);
            window.alert(
                error?.message ||
                'No se pudo guardar tu progreso. Verifica que hayas iniciado sesión e inténtalo de nuevo.'
            );
            return null;
        }
    };


    // ========================================================
    // SI HAY UN JUEGO ABIERTO
    // ========================================================

    if (juegoActivo === 'numero') {
        return (
            <JuegoNumero
                onVolver={() => setJuegoActivo(null)}
                ganarXP={() => ganarXP('adivinaNumero')}
            />
        );
    }

    if (juegoActivo === 'memoria') {
        return (
            <JuegoMemoria
                onVolver={() => setJuegoActivo(null)}
                ganarXP={() => ganarXP('memoriaCodigo')}
            />
        );
    }

    if (juegoActivo === 'secuencia') {
        return (
            <JuegoSecuencia
                onVolver={() => setJuegoActivo(null)}
                ganarXP={() => ganarXP('secuenciaLogica')}
            />
        );
    }


    // ========================================================
    // PANTALLA DE MINIJUEGOS
    // ========================================================

    return (
        <div className={styles.minijuegos}>

            {/* Decoraciones */}

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


            {/* ENCABEZADO */}

            <header className={styles.minijuegosHeader}>

                <h1>
                    🎮 Minijuegos de Lógica
                </h1>

                <p>
                    Fortalece tus habilidades de algoritmos, retención y
                    análisis resolviendo retos interactivos.
                </p>

            </header>


            {/* ESTADÍSTICAS */}

            <section className={styles.stats}>

                <div className={styles.statCard}>

                    <div className={styles.statIcon}>
                        ⭐
                    </div>

                    <div className={styles.statInfo}>
                        <span>XP Ganados</span>
                        <strong>{cargandoProgreso ? 'Cargando...' : `${xp} XP`}</strong>
                    </div>

                </div>


                <div className={styles.statCard}>

                    <div className={styles.statIcon}>
                        🔥
                    </div>

                    <div className={styles.statInfo}>
                        <span>Racha</span>
                        <strong>{cargandoProgreso ? 'Cargando...' : `${racha} ${racha === 1 ? 'día' : 'días'}`}</strong>
                    </div>

                </div>


                <div className={styles.statCard}>

                    <div className={styles.statIcon}>
                        🛡️
                    </div>

                    <div className={styles.statInfo}>
                        <span>Nivel</span>
                        <strong>{cargandoProgreso ? 'Cargando...' : `Nivel ${nivel}`}</strong>
                    </div>

                </div>

            </section>


            {/* VOLVER */}

            <button
                type="button"
                className={styles.btnVolver}
                onClick={onVolver}
            >
                ← Volver al Inicio
            </button>


            {/* FILTROS */}

            <section className={styles.filtros}>

                <div className={styles.filtrosTitulo}>
                    Filtrar por:
                </div>

                <div className={styles.filtrosBotones}>

                    <button className={`${styles.filtroBtn} ${styles.activo}`}>
                        Todos (3)
                    </button>

                    <button className={styles.filtroBtn}>
                        🧠 Lógica
                    </button>

                    <button className={styles.filtroBtn}>
                        💻 Sintaxis
                    </button>

                    <button className={styles.filtroBtn}>
                        ⚡ Patrones
                    </button>

                </div>

            </section>


            {/* =================================================
                TARJETAS
            ================================================= */}

            <section className={styles.juegosGrid}>


                {/* ================================
                    ADIVINA EL NÚMERO
                ================================= */}

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
                            Encuentra el número secreto utilizando
                            pistas para descubrirlo en pocos intentos.
                        </p>


                        <div className={styles.juegoInfo}>

                            <span className={`${styles.juegoTag} ${styles.juegoXp}`}>
                                ⭐ +50 XP
                            </span>

                            <span className={styles.juegoTag}>
                                Pensamiento Lógico
                            </span>

                        </div>


                        <button
                            className={styles.btnJugar}
                            onClick={() => setJuegoActivo('numero')}
                        >
                            Jugar Ahora →
                        </button>

                    </div>

                </article>


                {/* ================================
                    MEMORIA
                ================================= */}

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

                            <span className={`${styles.juegoTag} ${styles.juegoXp}`}>
                                ⭐ +75 XP
                            </span>

                            <span className={styles.juegoTag}>
                                Sintaxis y Comandos
                            </span>

                        </div>


                        <button
                            className={styles.btnJugar}
                            onClick={() => setJuegoActivo('memoria')}
                        >
                            Jugar Ahora →
                        </button>

                    </div>

                </article>


                {/* ================================
                    SECUENCIA
                ================================= */}

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
                            en el orden correcto.
                        </p>


                        <div className={styles.juegoInfo}>

                            <span className={`${styles.juegoTag} ${styles.juegoXp}`}>
                                ⭐ +100 XP
                            </span>

                            <span className={styles.juegoTag}>
                                Algoritmos y Patrones
                            </span>

                        </div>


                        <button
                            className={styles.btnJugar}
                            onClick={() => setJuegoActivo('secuencia')}
                        >
                            Jugar Ahora →
                        </button>

                    </div>

                </article>

            </section>

        </div>
    );
};


// ============================================================
// JUEGO 1 — ADIVINA EL NÚMERO
// ============================================================

const JuegoNumero = ({ onVolver, ganarXP }) => {

    const generarNumero = () =>
        Math.floor(Math.random() * 100) + 1;


    const [numeroSecreto, setNumeroSecreto] = useState(generarNumero);

    const [intento, setIntento] = useState('');

    const [mensaje, setMensaje] = useState(
        'Estoy pensando en un número del 1 al 100...'
    );

    const [intentos, setIntentos] = useState(0);

    const [ganado, setGanado] = useState(false);


    const comprobar = (e) => {

        e.preventDefault();

        const numero = Number(intento);

        if (!numero || numero < 1 || numero > 100) {

            setMensaje('⚠️ Escribe un número entre 1 y 100.');
            return;
        }


        const nuevosIntentos = intentos + 1;

        setIntentos(nuevosIntentos);


        if (numero === numeroSecreto) {

            setMensaje(
                `🎉 ¡Correcto! Lo encontraste en ${nuevosIntentos} intentos.`
            );

            if (!ganado) {
                ganarXP();
                setGanado(true);
            }

            return;
        }


        if (numero < numeroSecreto) {

            setMensaje('📈 El número secreto es MAYOR.');

        } else {

            setMensaje('📉 El número secreto es MENOR.');

        }


        setIntento('');
    };


    const reiniciar = () => {

        setNumeroSecreto(generarNumero());
        setIntento('');
        setMensaje(
            'Estoy pensando en un número del 1 al 100...'
        );
        setIntentos(0);
        setGanado(false);

    };


    return (

        <div className={styles.juegoPantalla}>

            <div className={styles.juegoPanel}>

                <button
                    className={styles.btnVolverJuego}
                    onClick={onVolver}
                >
                    ← Volver a Minijuegos
                </button>


                <div className={styles.granIcono}>
                    🎯
                </div>


                <h1>
                    Adivina el Número
                </h1>


                <p>
                    Estoy pensando en un número entre <strong>1 y 100</strong>.
                </p>


                <div className={styles.intentos}>
                    Intentos: <strong>{intentos}</strong>
                </div>


                <div className={styles.mensajeJuego}>
                    {mensaje}
                </div>


                <form
                    onSubmit={comprobar}
                    className={styles.formNumero}
                >

                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={intento}
                        onChange={(e) => setIntento(e.target.value)}
                        placeholder="Escribe un número"
                        disabled={ganado}
                    />

                    <button
                        type="submit"
                        className={styles.btnJugar}
                        disabled={ganado}
                    >
                        Comprobar
                    </button>

                </form>


                <button
                    className={styles.btnReiniciar}
                    onClick={reiniciar}
                >
                    🔄 Nuevo Juego
                </button>

            </div>

        </div>

    );
};


// ============================================================
// JUEGO 2 — MEMORIA DE CÓDIGO
// ============================================================

const JuegoMemoria = ({ onVolver, ganarXP }) => {

    const parejasOriginales = [
        ['if', '🔀'],
        ['for', '🔁'],
        ['array', '📦'],
        ['function', '⚙️'],
        ['if', '🔀'],
        ['for', '🔁'],
        ['array', '📦'],
        ['function', '⚙️']
    ];


    const barajar = () => {

        return [...parejasOriginales]
            .sort(() => Math.random() - 0.5)
            .map((valor, indice) => ({
                id: indice,
                nombre: valor[0],
                icono: valor[1],
                volteada: false,
                encontrada: false
            }));

    };


    const [cartas, setCartas] = useState(barajar);

    const [seleccionadas, setSeleccionadas] = useState([]);

    const [movimientos, setMovimientos] = useState(0);

    const [ganado, setGanado] = useState(false);


    useEffect(() => {

        if (seleccionadas.length !== 2) {
            return;
        }


        const [primera, segunda] = seleccionadas;


        if (primera.nombre === segunda.nombre) {

            setTimeout(() => {

                setCartas(prev =>
                    prev.map(carta =>
                        carta.nombre === primera.nombre
                            ? { ...carta, encontrada: true }
                            : carta
                    )
                );

                setSeleccionadas([]);

            }, 500);

        } else {

            setTimeout(() => {

                setCartas(prev =>
                    prev.map(carta =>
                        seleccionadas.some(s => s.id === carta.id)
                            ? { ...carta, volteada: false }
                            : carta
                    )
                );

                setSeleccionadas([]);

            }, 800);

        }


        setMovimientos(prev => prev + 1);

    }, [seleccionadas]);


    useEffect(() => {

        if (
            cartas.length > 0 &&
            cartas.every(carta => carta.encontrada)
        ) {

            if (!ganado) {
                ganarXP();
                setGanado(true);
            }

        }

    }, [cartas, ganado, ganarXP]);


    const voltear = (id) => {

        if (seleccionadas.length >= 2) {
            return;
        }


        const carta = cartas.find(c => c.id === id);


        if (!carta || carta.volteada || carta.encontrada) {
            return;
        }


        setCartas(prev =>
            prev.map(c =>
                c.id === id
                    ? { ...c, volteada: true }
                    : c
            )
        );


        setSeleccionadas(prev => [...prev, carta]);

    };


    const reiniciar = () => {

        setCartas(barajar());
        setSeleccionadas([]);
        setMovimientos(0);
        setGanado(false);

    };


    return (

        <div className={styles.juegoPantalla}>

            <div className={styles.juegoPanel}>

                <button
                    className={styles.btnVolverJuego}
                    onClick={onVolver}
                >
                    ← Volver a Minijuegos
                </button>


                <div className={styles.granIcono}>
                    🧩
                </div>


                <h1>
                    Memoria de Código
                </h1>


                <p>
                    Encuentra todas las parejas de programación.
                </p>


                <div className={styles.intentos}>
                    Movimientos: <strong>{movimientos}</strong>
                </div>


                <div className={styles.memoriaGrid}>

                    {cartas.map(carta => (

                        <button
                            key={carta.id}
                            className={`${styles.cartaMemoria} ${
                                carta.volteada || carta.encontrada
                                    ? styles.cartaVolteada
                                    : ''
                            }`}
                            onClick={() => voltear(carta.id)}
                        >

                            {carta.volteada || carta.encontrada ? (
                                <>
                                    <span>{carta.icono}</span>
                                    <small>{carta.nombre}</small>
                                </>
                            ) : (
                                '?'
                            )}

                        </button>

                    ))}

                </div>


                {ganado && (

                    <div className={styles.mensajeGanador}>
                        🎉 ¡Completaste todas las parejas! +75 XP
                    </div>

                )}


                <button
                    className={styles.btnReiniciar}
                    onClick={reiniciar}
                >
                    🔄 Reiniciar Juego
                </button>

            </div>

        </div>

    );
};


// ============================================================
// JUEGO 3 — SECUENCIA LÓGICA
// ============================================================

const JuegoSecuencia = ({ onVolver, ganarXP }) => {

    const generarSecuencia = (longitud = 4) => {

        return Array.from(
            { length: longitud },
            () => Math.floor(Math.random() * 4)
        );

    };


    const [secuencia, setSecuencia] = useState(
        generarSecuencia()
    );

    const [respuesta, setRespuesta] = useState([]);

    const [mostrar, setMostrar] = useState(true);

    const [mensaje, setMensaje] = useState(
        'Memoriza la secuencia...'
    );

    const [ganado, setGanado] = useState(false);


    useEffect(() => {

        const tiempo = setTimeout(() => {

            setMostrar(false);
            setMensaje('Ahora repite la secuencia.');

        }, 1800);


        return () => clearTimeout(tiempo);

    }, [secuencia]);


    const colores = [
        '🔴',
        '🔵',
        '🟢',
        '🟡'
    ];


    const seleccionar = (numero) => {

        if (mostrar || ganado) {
            return;
        }


        const nuevaRespuesta = [
            ...respuesta,
            numero
        ];


        setRespuesta(nuevaRespuesta);


        const posicion =
            nuevaRespuesta.length - 1;


        if (
            nuevaRespuesta[posicion] !==
            secuencia[posicion]
        ) {

            setMensaje(
                '❌ Secuencia incorrecta. Inténtalo de nuevo.'
            );

            setTimeout(() => {

                reiniciar();

            }, 1000);

            return;

        }


        if (
            nuevaRespuesta.length ===
            secuencia.length
        ) {

            setMensaje(
                '🎉 ¡Excelente! Completaste la secuencia. +100 XP'
            );

            ganarXP();
            setGanado(true);

        }

    };


    const reiniciar = () => {

        const nueva = generarSecuencia();

        setSecuencia(nueva);
        setRespuesta([]);
        setMostrar(true);
        setMensaje('Memoriza la secuencia...');
        setGanado(false);

    };


    return (

        <div className={styles.juegoPantalla}>

            <div className={styles.juegoPanel}>

                <button
                    className={styles.btnVolverJuego}
                    onClick={onVolver}
                >
                    ← Volver a Minijuegos
                </button>


                <div className={styles.granIcono}>
                    🧠
                </div>


                <h1>
                    Secuencia Lógica
                </h1>


                <p>
                    {mensaje}
                </p>


                <div className={styles.secuenciaMostrar}>

                    {secuencia.map((numero, index) => (

                        <span
                            key={index}
                            className={
                                mostrar
                                    ? styles.secuenciaVisible
                                    : styles.secuenciaOculta
                            }
                        >
                            {colores[numero]}
                        </span>

                    ))}

                </div>


                <div className={styles.botonesSecuencia}>

                    {colores.map((color, index) => (

                        <button
                            key={index}
                            className={styles.botonColor}
                            onClick={() => seleccionar(index)}
                            disabled={mostrar || ganado}
                        >
                            {color}
                        </button>

                    ))}

                </div>


                <div className={styles.progresoSecuencia}>

                    {respuesta.length} / {secuencia.length}

                </div>


                <button
                    className={styles.btnReiniciar}
                    onClick={reiniciar}
                >
                    🔄 Nueva Secuencia
                </button>

            </div>

        </div>

    );
};


export default VistaMinijuegos;
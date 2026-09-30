import React, { useState, useEffect } from 'react';
import './VistaMinijuegos.css';

// Asset imports with optional fallbacks
import iconoJuego from '../../../assets/iconos/icono-juego.svg';
import xolotlProgramando from '../../../assets/xolotl/xolotl-programando.svg';
import bloqueAzul from '../../../assets/elementos/bloque-azul.svg';
import bloqueAmarillo from '../../../assets/elementos/bloque-amarillo.svg';
import bloqueMorado from '../../../assets/elementos/bloque-morado.svg';
import estrellaAm from '../../../assets/elementos/estrella-amarilla.svg';

const VistaMinijuegos = ({ onVolver }) => {
  const [juegoActivo, setJuegoActivo] = useState(null);

  // --- MINIJUEGO 1: ADIVINA EL NÚMERO ---
  const [numSecreto, setNumSecreto] = useState(1);
  const [intento, setIntento] = useState('');
  const [mensajeNum, setMensajeNum] = useState('');
  const [intentosContador, setIntentosContador] = useState(0);

  const iniciarAdivinaNumero = () => {
    setNumSecreto(Math.floor(Math.random() * 50) + 1);
    setMensajeNum('Ingresa un número entre 1 y 50');
    setIntentosContador(0);
    setIntento('');
  };

  const probarNumero = (e) => {
    e.preventDefault();
    const val = parseInt(intento, 10);
    if (isNaN(val) || val < 1 || val > 50) return;

    const nuevosIntentos = intentosContador + 1;
    setIntentosContador(nuevosIntentos);

    if (val === numSecreto) {
      setMensajeNum(`¡Excelente! 🎉 Lo descifraste en ${nuevosIntentos} intentos.`);
    } else if (val < numSecreto) {
      setMensajeNum('El número secreto es MAYOR ↑');
    } else {
      setMensajeNum('El número secreto es MENOR ↓');
    }
  };

  // --- MINIJUEGO 2: MEMORIA DE CÓDIGO ---
  const conceptos = ['if (...)', 'for (...)', 'function()', 'let x = 10', 'return', 'while (...)'];
  const [cartas, setCartas] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [parejasEncontradas, setParejasEncontradas] = useState([]);

  const iniciarMemoria = () => {
    const mazo = [...conceptos, ...conceptos]
      .sort(() => Math.random() - 0.5)
      .map((texto, index) => ({ id: index, texto }));
    setCartas(mazo);
    setSeleccionadas([]);
    setParejasEncontradas([]);
  };

  const seleccionarCarta = (index) => {
    if (seleccionadas.length === 2 || seleccionadas.includes(index) || parejasEncontradas.includes(cartas[index].texto)) return;

    const nuevas = [...seleccionadas, index];
    setSeleccionadas(nuevas);

    if (nuevas.length === 2) {
      const [p1, p2] = nuevas;
      if (cartas[p1].texto === cartas[p2].texto) {
        setParejasEncontradas((prev) => [...prev, cartas[p1].texto]);
        setSeleccionadas([]);
      } else {
        setTimeout(() => setSeleccionadas([]), 900);
      }
    }
  };

  // --- MINIJUEGO 3: SECUENCIA LÓGICA (SIMON) ---
  const colores = ['rojo', 'verde', 'azul', 'amarillo'];
  const [secuencia, setSecuencia] = useState([]);
  const [pasoJugador, setPasoJugador] = useState(0);
  const [mensajeSimon, setMensajeSimon] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [colorActivo, setColorActivo] = useState(null);

  const iniciarSimon = () => {
    setSecuencia([]);
    setPasoJugador(0);
    setMensajeSimon('¡Presta atención a la secuencia!');
    agregarColorSecuencia([]);
  };

  const agregarColorSecuencia = (secActual) => {
    const nuevoColor = colores[Math.floor(Math.random() * colores.length)];
    const nuevaSec = [...secActual, nuevoColor];
    setSecuencia(nuevaSec);
    reproducirSecuencia(nuevaSec);
  };

  const reproducirSecuencia = (sec) => {
    setBloqueado(true);
    sec.forEach((col, idx) => {
      setTimeout(() => {
        setColorActivo(col);
        setTimeout(() => setColorActivo(null), 350);
        if (idx === sec.length - 1) {
          setBloqueado(false);
        }
      }, (idx + 1) * 650);
    });
  };

  const presionarColor = (col) => {
    if (bloqueado || secuencia.length === 0) return;

    if (col === secuencia[pasoJugador]) {
      if (pasoJugador + 1 === secuencia.length) {
        setMensajeSimon(`¡Muy bien! Nivel ${secuencia.length} superado.`);
        setPasoJugador(0);
        setTimeout(() => agregarColorSecuencia(secuencia), 900);
      } else {
        setPasoJugador(pasoJugador + 1);
      }
    } else {
      setMensajeSimon(`¡Ups! Perdiste en el Nivel ${secuencia.length}. Inténtalo de nuevo.`);
      setSecuencia([]);
    }
  };

  useEffect(() => {
    if (juegoActivo === 1) iniciarAdivinaNumero();
    if (juegoActivo === 2) iniciarMemoria();
    if (juegoActivo === 3) iniciarSimon();
  }, [juegoActivo]);

  return (
    <div className="wrapper">
      {/* Decoraciones flotantes */}
      {bloqueAzul && <img src={bloqueAzul} alt="" aria-hidden="true" className="deco decoB1" />}
      {bloqueAmarillo && <img src={bloqueAmarillo} alt="" aria-hidden="true" className="deco decoB2" />}
      {bloqueMorado && <img src={bloqueMorado} alt="" aria-hidden="true" className="deco decoB3" />}
      {estrellaAm && <img src={estrellaAm} alt="" aria-hidden="true" className="deco decoS1" />}
      {estrellaAm && <img src={estrellaAm} alt="" aria-hidden="true" className="deco decoS2" />}

      <div className="container">
        {/* Header Principal */}
        <header className="header">
          <div className="headerText">
            <div className="badge">
              {iconoJuego && <img src={iconoJuego} alt="" className="iconoBadge" />}
              Zona Arcade
            </div>
            <h1 className="tituloHeader">Minijuegos de Lógica</h1>
            <p className="subtituloHeader">
              Practica resolución de problemas, patrones y algoritmos mientras juegas.
            </p>
          </div>

          <button type="button" className="btnVolverNav" onClick={onVolver}>
            ← Volver al Inicio
          </button>
        </header>

        {/* VISTA CATÁLOGO DE JUEGOS */}
        {!juegoActivo ? (
          <div className="gridJuegos">
            {/* Tarjeta 1 */}
            <article className="cardJuego">
              <div className="cardBanner bannerAmber">
                <span className="cardIcon">🔢</span>
                <span className="difficultyBadge">Fácil</span>
              </div>
              <div className="cardContent">
                <span className="cardCategory">Pensamiento Numérico</span>
                <h2 className="cardTitle">Adivina el Número</h2>
                <p className="cardDesc">
                  Ejercita tu lógica deductiva encontrando el número secreto en los menores intentos posibles.
                </p>
                <button
                  type="button"
                  className="btnJugar"
                  onClick={() => setJuegoActivo(1)}
                >
                  Jugar Ahora ➔
                </button>
              </div>
            </article>

            {/* Tarjeta 2 */}
            <article className="cardJuego">
              <div className="cardBanner bannerBlue">
                <span className="cardIcon">🧩</span>
                <span className="difficultyBadge">Medio</span>
              </div>
              <div className="cardContent">
                <span className="cardCategory">Sintaxis y Código</span>
                <h2 className="cardTitle">Memoria de Código</h2>
                <p className="cardDesc">
                  Encuentra los pares de comandos y estructuras de programación en el menor número de movimientos.
                </p>
                <button
                  type="button"
                  className="btnJugar"
                  onClick={() => setJuegoActivo(2)}
                >
                  Jugar Ahora ➔
                </button>
              </div>
            </article>

            {/* Tarjeta 3 */}
            <article className="cardJuego">
              <div className="cardBanner bannerEmerald">
                <span className="cardIcon">🎨</span>
                <span className="difficultyBadge">Desafío</span>
              </div>
              <div className="cardContent">
                <span className="cardCategory">Algoritmos y Patrones</span>
                <h2 className="cardTitle">Secuencia Lógica</h2>
                <p className="cardDesc">
                  Memoriza el patrón de colores en orden secuencial y pon a prueba tu capacidad de retención.
                </p>
                <button
                  type="button"
                  className="btnJugar"
                  onClick={() => setJuegoActivo(3)}
                >
                  Jugar Ahora ➔
                </button>
              </div>
            </article>
          </div>
        ) : (
          /* VISTA PANEL DE JUEGO EN EJECUCIÓN */
          <div className="panelJuegoContainer">
            <button
              type="button"
              className="btnRegresarLista"
              onClick={() => setJuegoActivo(null)}
            >
              ← Volver al catálogo de juegos
            </button>

            {/* JUEGO 1: ADIVINA EL NÚMERO */}
            {juegoActivo === 1 && (
              <div className="gamePanel">
                <div className="gameHeaderBox">
                  <span className="gameBigIcon">🔢</span>
                  <h2>Adivina el Número</h2>
                  <p className="gameStatusText">{mensajeNum}</p>
                  <span className="attemptsCounter">
                    Intentos acumulados: <strong>{intentosContador}</strong>
                  </span>
                </div>

                <form onSubmit={probarNumero} className="formAdivina">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={intento}
                    onChange={(e) => setIntento(e.target.value)}
                    placeholder="1 - 50"
                    className="inputNumero"
                  />
                  <button type="submit" className="btnAccionPrimary">
                    Probar
                  </button>
                </form>

                <div className="gameFooter">
                  <button type="button" className="btnReiniciar" onClick={iniciarAdivinaNumero}>
                    Reiniciar partida
                  </button>
                  {xolotlProgramando && <img src={xolotlProgramando} alt="Xolotl" className="xolotlMini" />}
                </div>
              </div>
            )}

            {/* JUEGO 2: MEMORIA DE CÓDIGO */}
            {juegoActivo === 2 && (
              <div className="gamePanel">
                <div className="gameHeaderBox">
                  <span className="gameBigIcon">🧩</span>
                  <h2>Memoria de Código</h2>
                  <p className="gameStatusText">
                    Parejas encontradas: {parejasEncontradas.length} de {conceptos.length}
                  </p>
                </div>

                <div className="gridMemoria">
                  {cartas.map((carta, idx) => {
                    const estaVolteada = seleccionadas.includes(idx) || parejasEncontradas.includes(carta.texto);
                    return (
                      <button
                        key={carta.id}
                        type="button"
                        className={`cartaMemoria ${estaVolteada ? 'cartaVolteada' : ''}`}
                        onClick={() => seleccionarCarta(idx)}
                      >
                        {estaVolteada ? carta.texto : '❓'}
                      </button>
                    );
                  })}
                </div>

                <div className="gameFooter">
                  <button type="button" className="btnReiniciar" onClick={iniciarMemoria}>
                    Reiniciar partida
                  </button>
                  {xolotlProgramando && <img src={xolotlProgramando} alt="Xolotl" className="xolotlMini" />}
                </div>
              </div>
            )}

            {/* JUEGO 3: SECUENCIA LÓGICA */}
            {juegoActivo === 3 && (
              <div className="gamePanel">
                <div className="gameHeaderBox">
                  <span className="gameBigIcon">🎨</span>
                  <h2>Secuencia Lógica</h2>
                  <p className="gameStatusText">{mensajeSimon}</p>
                </div>

                <div className="gridSimon">
                  {colores.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`btnSimon ${col} ${colorActivo === col ? 'activo' : ''}`}
                      onClick={() => presionarColor(col)}
                      disabled={bloqueado}
                    />
                  ))}
                </div>

                <div className="gameFooter">
                  <button type="button" className="btnReiniciar" onClick={iniciarSimon}>
                    Iniciar / Reiniciar
                  </button>
                  {xolotlProgramando && <img src={xolotlProgramando} alt="Xolotl" className="xolotlMini" />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaMinijuegos;
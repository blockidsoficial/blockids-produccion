import React, { useState, useEffect } from 'react';
import './VistaMinijuegos.css';

// Asset imports con soporte seguro
import iconoJuego from '../../../assets/iconos/icono-juego.svg';
import xolotlProgramando from '../../../assets/xolotl/xolotl-programando.svg';
import bloqueAzul from '../../../assets/elementos/bloque-azul.svg';
import bloqueAmarillo from '../../../assets/elementos/bloque-amarillo.svg';
import bloqueMorado from '../../../assets/elementos/bloque-morado.svg';
import estrellaAm from '../../../assets/elementos/estrella-amarilla.svg';

const VistaMinijuegos = ({ onVolver }) => {
  const [juegoActivo, setJuegoActivo] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');

  // Estadísticas del jugador
  const [puntosXP, setPuntosXP] = useState(350);
  const [rachaDias, setRachaDias] = useState(3);
  const [nivelJugador, setNivelJugador] = useState(2);

  // --- MINIJUEGO 1: ADIVINA EL NÚMERO ---
  const [numSecreto, setNumSecreto] = useState(1);
  const [intento, setIntento] = useState('');
  const [mensajeNum, setMensajeNum] = useState('');
  const [intentosContador, setIntentosContador] = useState(0);
  const [historialIntentos, setHistorialIntentos] = useState([]);
  const [juegoCompletado1, setJuegoCompletado1] = useState(false);

  const iniciarAdivinaNumero = () => {
    setNumSecreto(Math.floor(Math.random() * 50) + 1);
    setMensajeNum('Ingresa un número del 1 al 50 para iniciar el rastreo.');
    setIntentosContador(0);
    setHistorialIntentos([]);
    setIntento('');
    setJuegoCompletado1(false);
  };

  const probarNumero = (e) => {
    e.preventDefault();
    if (juegoCompletado1) return;
    const val = parseInt(intento, 10);
    if (isNaN(val) || val < 1 || val > 50) return;

    const nuevosIntentos = intentosContador + 1;
    setIntentosContador(nuevosIntentos);

    let pista = '';
    if (val === numSecreto) {
      setMensajeNum(`¡Excelente trabajo! 🎉 Descifraste el código en ${nuevosIntentos} intento(s).`);
      setJuegoCompletado1(true);
      setPuntosXP((prev) => prev + 50);
      pista = 'CORRECTO';
    } else if (val < numSecreto) {
      setMensajeNum('El número secreto es MAYOR ↑');
      pista = 'MAYOR ↑';
    } else {
      setMensajeNum('El número secreto es MENOR ↓');
      pista = 'MENOR ↓';
    }

    setHistorialIntentos((prev) => [{ numero: val, pista }, ...prev.slice(0, 4)]);
    setIntento('');
  };

  // --- MINIJUEGO 2: MEMORIA DE CÓDIGO ---
  const conceptos = ['if (...)', 'for (...)', 'function()', 'let x = 10', 'return', 'while (...)'];
  const [cartas, setCartas] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [parejasEncontradas, setParejasEncontradas] = useState([]);
  const [movimientosMemoria, setMovimientosMemoria] = useState(0);

  const iniciarMemoria = () => {
    const mazo = [...conceptos, ...conceptos]
      .sort(() => Math.random() - 0.5)
      .map((texto, index) => ({ id: index, texto }));
    setCartas(mazo);
    setSeleccionadas([]);
    setParejasEncontradas([]);
    setMovimientosMemoria(0);
  };

  const seleccionarCarta = (index) => {
    if (
      seleccionadas.length === 2 ||
      seleccionadas.includes(index) ||
      parejasEncontradas.includes(cartas[index].texto)
    ) return;

    const nuevas = [...seleccionadas, index];
    setSeleccionadas(nuevas);

    if (nuevas.length === 2) {
      setMovimientosMemoria((prev) => prev + 1);
      const [p1, p2] = nuevas;
      if (cartas[p1].texto === cartas[p2].texto) {
        const parejasNuevas = [...parejasEncontradas, cartas[p1].texto];
        setParejasEncontradas(parejasNuevas);
        setSeleccionadas([]);
        if (parejasNuevas.length === conceptos.length) {
          setPuntosXP((prev) => prev + 75);
        }
      } else {
        setTimeout(() => setSeleccionadas([]), 850);
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
  const [maxRondaSimon, setMaxRondaSimon] = useState(0);

  const iniciarSimon = () => {
    setSecuencia([]);
    setPasoJugador(0);
    setMaxRondaSimon(0);
    setMensajeSimon('¡Presta atención al patrón de luces!');
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
        setTimeout(() => setColorActivo(null), 380);
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
        const nuevaRonda = secuencia.length;
        if (nuevaRonda > maxRondaSimon) setMaxRondaSimon(nuevaRonda);
        setMensajeSimon(`¡Perfecto! Nivel ${nuevaRonda} completado.`);
        setPasoJugador(0);
        setPuntosXP((prev) => prev + 15);
        setTimeout(() => agregarColorSecuencia(secuencia), 900);
      } else {
        setPasoJugador(pasoJugador + 1);
      }
    } else {
      setMensajeSimon(`¡Ups! Perdiste en el Nivel ${secuencia.length}. Toca reiniciar.`);
      setSecuencia([]);
    }
  };

  // Catálogo completo de minijuegos
  const listaJuegos = [
    {
      id: 1,
      titulo: 'Adivina el Número',
      categoria: 'logica',
      categoriaLabel: 'Pensamiento Lógico',
      dificultad: 'Fácil',
      xp: '+50 XP',
      icono: '🎯',
      colorClase: 'bannerAmber',
      descripcion: 'Ejercita la lógica deductiva encontrando el número secreto en los menores intentos.',
    },
    {
      id: 2,
      titulo: 'Memoria de Código',
      categoria: 'sintaxis',
      categoriaLabel: 'Sintaxis y Comandos',
      dificultad: 'Intermedio',
      xp: '+75 XP',
      icono: '🧩',
      colorClase: 'bannerBlue',
      descripcion: 'Encuentra las parejas de instrucciones de programación asociadas.',
    },
    {
      id: 3,
      titulo: 'Secuencia Lógica',
      categoria: 'patrones',
      categoriaLabel: 'Algoritmos y Patrones',
      dificultad: 'Desafío',
      xp: '+100 XP',
      icono: '🎨',
      colorClase: 'bannerEmerald',
      descripcion: 'Memoriza y repite el patrón secuencial de luces en el orden exacto.',
    },
  ];

  const juegosFiltrados = categoriaFiltro === 'todos' 
    ? listaJuegos 
    : listaJuegos.filter(j => j.categoria === categoriaFiltro);

  useEffect(() => {
    if (juegoActivo === 1) iniciarAdivinaNumero();
    if (juegoActivo === 2) iniciarMemoria();
    if (juegoActivo === 3) iniciarSimon();
  }, [juegoActivo]);

  return (
    <div className="wrapperArcade">
      {/* Decoraciones de Fondo */}
      {bloqueAzul && <img src={bloqueAzul} alt="" aria-hidden="true" className="decoArcade decoB1" />}
      {bloqueAmarillo && <img src={bloqueAmarillo} alt="" aria-hidden="true" className="decoArcade decoB2" />}
      {bloqueMorado && <img src={bloqueMorado} alt="" aria-hidden="true" className="decoArcade decoB3" />}
      {estrellaAm && <img src={estrellaAm} alt="" aria-hidden="true" className="decoArcade decoS1" />}
      {estrellaAm && <img src={estrellaAm} alt="" aria-hidden="true" className="decoArcade decoS2" />}

      <div className="containerArcade">
        {/* Header Principal */}
        <header className="headerArcade">
          <div className="headerLeft">
            <div className="badgeArcade">
              {iconoJuego ? <img src={iconoJuego} alt="" className="iconoBadge" /> : <span>🕹️</span>}
              Zona Arcade Blockids
            </div>
            <h1 className="tituloArcade">Minijuegos de Lógica</h1>
            <p className="subtituloArcade">
              Fortalece tus habilidades de algoritmos, retención y análisis resolviendo retos interactivos.
            </p>
          </div>

          <div className="headerRight">
            <div className="statsBar">
              <div className="statItem" title="Puntos de Experiencia">
                <span className="statIcon">⭐</span>
                <div className="statText">
                  <span className="statValue">{puntosXP}</span>
                  <span className="statLabel">XP Ganados</span>
                </div>
              </div>
              <div className="statDivider" />
              <div className="statItem" title="Racha de Días">
                <span className="statIcon">🔥</span>
                <div className="statText">
                  <span className="statValue">{rachaDias} días</span>
                  <span className="statLabel">Racha</span>
                </div>
              </div>
              <div className="statDivider" />
              <div className="statItem" title="Nivel de Jugador">
                <span className="statIcon">🛡️</span>
                <div className="statText">
                  <span className="statValue">Nivel {nivelJugador}</span>
                  <span className="statLabel">Rango</span>
                </div>
              </div>
            </div>

            {onVolver && (
              <button type="button" className="btnVolverInicio" onClick={onVolver}>
                ← Volver al Inicio
              </button>
            )}
          </div>
        </header>

        {/* CATÁLOGO DE TARJETAS */}
        {!juegoActivo ? (
          <main className="seccionCatalogo">
            {/* Barra de Filtros */}
            <div className="barFiltros">
              <span className="labelFiltros">Filtrar por:</span>
              <div className="grupoPills">
                <button
                  type="button"
                  className={`pillFiltro ${categoriaFiltro === 'todos' ? 'activa' : ''}`}
                  onClick={() => setCategoriaFiltro('todos')}
                >
                  Todos ({listaJuegos.length})
                </button>
                <button
                  type="button"
                  className={`pillFiltro ${categoriaFiltro === 'logica' ? 'activa' : ''}`}
                  onClick={() => setCategoriaFiltro('logica')}
                >
                  🧠 Lógica
                </button>
                <button
                  type="button"
                  className={`pillFiltro ${categoriaFiltro === 'sintaxis' ? 'activa' : ''}`}
                  onClick={() => setCategoriaFiltro('sintaxis')}
                >
                  💻 Sintaxis
                </button>
                <button
                  type="button"
                  className={`pillFiltro ${categoriaFiltro === 'patrones' ? 'activa' : ''}`}
                  onClick={() => setCategoriaFiltro('patrones')}
                >
                  ⚡ Patrones
                </button>
              </div>
            </div>

            {/* Grid de Tarjetas (Cards) */}
            <div className="gridArcade">
              {juegosFiltrados.map((juego) => (
                <article key={juego.id} className="cardArcade">
                  <div className={`bannerArcade ${juego.colorClase}`}>
                    <span className="iconBanner">{juego.icono}</span>
                    <div className="badgesBanner">
                      <span className="tagDificultad">{juego.dificultad}</span>
                      <span className="tagXP">{juego.xp}</span>
                    </div>
                  </div>

                  <div className="cardCuerpo">
                    <span className="categoriaTag">{juego.categoriaLabel}</span>
                    <h2 className="tituloJuego">{juego.titulo}</h2>
                    <p className="descJuego">{juego.descripcion}</p>

                    <button
                      type="button"
                      className="btnJugarArcade"
                      onClick={() => setJuegoActivo(juego.id)}
                    >
                      <span>Jugar Ahora</span>
                      <span className="flechaBtn">➔</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </main>
        ) : (
          /* PANELES DE JUEGO EN EJECUCIÓN */
          <section className="contenedorJuegoEnEjecucion">
            <button
              type="button"
              className="btnVolverCatalogo"
              onClick={() => setJuegoActivo(null)}
            >
              ← Volver al catálogo de juegos
            </button>

            {/* JUEGO 1: ADIVINA EL NÚMERO */}
            {juegoActivo === 1 && (
              <div className="panelJuegoEspecial">
                <header className="headPanelJuego">
                  <div className="iconoMascotaHead">🎯</div>
                  <h2>Adivina el Número Secreto</h2>
                  <p className="subHeadJuego">{mensajeNum}</p>
                </header>

                <div className="cuerpoJuegoAdivina">
                  <form onSubmit={probarNumero} className="formAdivinaAvanzado">
                    <div className="inputGroup">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={intento}
                        onChange={(e) => setIntento(e.target.value)}
                        placeholder="1 - 50"
                        disabled={juegoCompletado1}
                        className="inputGrandeNumero"
                      />
                      <button
                        type="submit"
                        disabled={juegoCompletado1}
                        className="btnAccionEspecial"
                      >
                        Enviar Intento
                      </button>
                    </div>
                  </form>

                  {/* Contador y Métricas */}
                  <div className="metricasJuego">
                    <div className="boxMetrica">
                      <span className="lblMetrica">Intentos:</span>
                      <span className="valMetrica">{intentosContador}</span>
                    </div>
                    <div className="boxMetrica">
                      <span className="lblMetrica">Rango:</span>
                      <span className="valMetrica">1 a 50</span>
                    </div>
                  </div>

                  {/* Historial Reciente */}
                  {historialIntentos.length > 0 && (
                    <div className="secHistorial">
                      <h4>Últimos intentos:</h4>
                      <div className="listaPistas">
                        {historialIntentos.map((item, index) => (
                          <div key={index} className="itemPista">
                            <span className="numPista">Número: <strong>{item.numero}</strong></span>
                            <span className={`tagPista ${item.pista.includes('MAYOR') ? 'pistaMayor' : item.pista.includes('MENOR') ? 'pistaMenor' : 'pistaExito'}`}>
                              {item.pista}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <footer className="footJuego">
                  <button type="button" className="btnReiniciarJuego" onClick={iniciarAdivinaNumero}>
                    🔄 Nueva partida
                  </button>
                  {xolotlProgramando && <img src={xolotlProgramando} alt="Xolotl" className="mascotaMini" />}
                </footer>
              </div>
            )}

            {/* JUEGO 2: MEMORIA DE CÓDIGO */}
            {juegoActivo === 2 && (
              <div className="panelJuegoEspecial">
                <header className="headPanelJuego">
                  <div className="iconoMascotaHead">🧩</div>
                  <h2>Memoria de Comandos</h2>
                  <p className="subHeadJuego">
                    Parejas encontradas: <strong>{parejasEncontradas.length}</strong> de {conceptos.length} | Movimientos: <strong>{movimientosMemoria}</strong>
                  </p>
                </header>

                <div className="gridCartasMemoria">
                  {cartas.map((carta, idx) => {
                    const estaVolteada =
                      seleccionadas.includes(idx) || parejasEncontradas.includes(carta.texto);
                    return (
                      <button
                        key={carta.id}
                        type="button"
                        className={`cartaCode ${estaVolteada ? 'activa' : ''} ${
                          parejasEncontradas.includes(carta.texto) ? 'emparejada' : ''
                        }`}
                        onClick={() => seleccionarCarta(idx)}
                      >
                        <span>{estaVolteada ? carta.texto : '⚡'}</span>
                      </button>
                    );
                  })}
                </div>

                <footer className="footJuego">
                  <button type="button" className="btnReiniciarJuego" onClick={iniciarMemoria}>
                    🔄 Reiniciar tablero
                  </button>
                  {xolotlProgramando && <img src={xolotlProgramando} alt="Xolotl" className="mascotaMini" />}
                </footer>
              </div>
            )}

            {/* JUEGO 3: SECUENCIA LÓGICA */}
            {juegoActivo === 3 && (
              <div className="panelJuegoEspecial">
                <header className="headPanelJuego">
                  <div className="iconoMascotaHead">🎨</div>
                  <h2>Secuencia de Luces y Algoritmos</h2>
                  <p className="subHeadJuego">{mensajeSimon}</p>
                </header>

                <div className="contenedorSimon">
                  <div className="topSimonStats">
                    <span>Nivel actual: <strong>{secuencia.length}</strong></span>
                    <span>Récord: <strong>{maxRondaSimon}</strong></span>
                  </div>

                  <div className="padSimonGrid">
                    {colores.map((col) => (
                      <button
                        key={col}
                        type="button"
                        className={`btnPadSimon ${col} ${colorActivo === col ? 'iluminado' : ''}`}
                        onClick={() => presionarColor(col)}
                        disabled={bloqueado}
                      />
                    ))}
                  </div>
                </div>

                <footer className="footJuego">
                  <button type="button" className="btnReiniciarJuego" onClick={iniciarSimon}>
                    ▶️ Iniciar / Reiniciar
                  </button>
                  {xolotlProgramando && <img src={xolotlProgramando} alt="Xolotl" className="mascotaMini" />}
                </footer>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default VistaMinijuegos;
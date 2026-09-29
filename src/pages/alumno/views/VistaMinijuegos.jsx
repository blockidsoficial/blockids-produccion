import React, { useState, useEffect } from 'react';
import './VistaMinijuegos.css';

export default function VistaMinijuegos() {
  const [juegoActivo, setJuegoActivo] = useState(null);

  // --- ESTADOS JUEGO 1: ADIVINA EL NÚMERO ---
  const [numSecreto, setNumSecreto] = useState(1);
  const [intento, setIntento] = useState('');
  const [mensajeNum, setMensajeNum] = useState('');
  const [intentosContador, setIntentosContador] = useState(0);

  const iniciarAdivinaNumero = () => {
    setNumSecreto(Math.floor(Math.random() * 50) + 1);
    setMensajeNum('Adivina un número entre 1 y 50');
    setIntentosContador(0);
    setIntento('');
  };

  const probarNumero = (e) => {
    e.preventDefault();
    const val = parseInt(intento, 10);
    if (isNaN(val)) return;
    
    const nuevosIntentos = intentosContador + 1;
    setIntentosContador(nuevosIntentos);

    if (val === numSecreto) {
      setMensajeNum(`¡Felicidades! Logrado en ${nuevosIntentos} intentos.`);
    } else if (val < numSecreto) {
      setMensajeNum('El número secreto es MAYOR ↑');
    } else {
      setMensajeNum('El número secreto es MENOR ↓');
    }
  };

  // --- ESTADOS JUEGO 2: MEMORIA DE CÓDIGO ---
  const [cartas, setCartas] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [parejasEncontradas, setParejasEncontradas] = useState([]);

  const conceptos = ['if', 'else', 'for', 'while', 'function', 'return'];

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
        setTimeout(() => setSeleccionadas([]), 1000);
      }
    }
  };

  // --- ESTADOS JUEGO 3: SECUENCIA SIMON ---
  const colores = ['rojo', 'verde', 'azul', 'amarillo'];
  const [secuencia, setSecuencia] = useState([]);
  const [pasoJugador, setPasoJugador] = useState(0);
  const [mensajeSimon, setMensajeSimon] = useState('');
  const [bloqueado, setBloqueado] = useState(false);

  const iniciarSimon = () => {
    setSecuencia([]);
    setPasoJugador(0);
    setMensajeSimon('¡Atento a la secuencia!');
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
        const el = document.getElementById(`btn-${col}`);
        if (el) {
          el.classList.add('activo');
          setTimeout(() => el.classList.remove('activo'), 400);
        }
        if (idx === sec.length - 1) {
          setBloqueado(false);
        }
      }, (idx + 1) * 700);
    });
  };

  const presionarColor = (col) => {
    if (bloqueado || secuencia.length === 0) return;

    if (col === secuencia[pasoJugador]) {
      if (pasoJugador + 1 === secuencia.length) {
        setMensajeSimon(`¡Bien! Nivel ${secuencia.length} superado.`);
        setPasoJugador(0);
        setTimeout(() => agregarColorSecuencia(secuencia), 1000);
      } else {
        setPasoJugador(pasoJugador + 1);
      }
    } else {
      setMensajeSimon(`¡Error! Llegaste hasta el nivel ${secuencia.length}.`);
      setSecuencia([]);
    }
  };

  // Efectos al seleccionar juego
  useEffect(() => {
    if (juegoActivo === 1) iniciarAdivinaNumero();
    if (juegoActivo === 2) iniciarMemoria();
    if (juegoActivo === 3) iniciarSimon();
  }, [juegoActivo]);

  return (
    <div className="minijuegos-vista">
      <header className="minijuegos-header">
        <h1>🎮 Zona de Minijuegos</h1>
        <p>Selecciona un reto para practicar tu lógica mientras te diviertes.</p>
      </header>

      {!juegoActivo ? (
        <div className="grid-minijuegos">
          {/* TARJETA JUEGO 1 */}
          <div className="card-juego">
            <div className="icon-juego">🔢</div>
            <h3>Adivina el Número</h3>
            <p>Ejercita tu lógica deduciendo el número secreto en los menores intentos posibles.</p>
            <button className="btn-jugar" onClick={() => setJuegoActivo(1)}>Jugar</button>
          </div>

          {/* TARJETA JUEGO 2 */}
          <div className="card-juego">
            <div className="icon-juego">🧩</div>
            <h3>Memoria de Código</h3>
            <p>Encuentra las parejas de comandos de programación antes de que se acabe el tiempo.</p>
            <button className="btn-jugar" onClick={() => setJuegoActivo(2)}>Jugar</button>
          </div>

          {/* TARJETA JUEGO 3 */}
          <div className="card-juego">
            <div className="icon-juego">🎨</div>
            <h3>Secuencia Lógica</h3>
            <p>Memoriza la secuencia de colores y repítela correctamente sin equivocarte.</p>
            <button className="btn-jugar" onClick={() => setJuegoActivo(3)}>Jugar</button>
          </div>
        </div>
      ) : (
        <div className="contenedor-pantalla-juego">
          <button className="btn-volver" onClick={() => setJuegoActivo(null)}>
            ← Volver a la lista
          </button>

          {/* AREA DE JUEGO 1 */}
          {juegoActivo === 1 && (
            <div className="panel-juego">
              <h2>🔢 Adivina el Número</h2>
              <p className="mensaje-status">{mensajeNum}</p>
              <form onSubmit={probarNumero} className="form-adivina">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={intento}
                  onChange={(e) => setIntento(e.target.value)}
                  placeholder="Tu número..."
                />
                <button type="submit">Probar</button>
              </form>
              <button className="btn-reiniciar" onClick={iniciarAdivinaNumero}>Reiniciar Juego</button>
            </div>
          )}

          {/* AREA DE JUEGO 2 */}
          {juegoActivo === 2 && (
            <div className="panel-juego">
              <h2>🧩 Memoria de Código</h2>
              <p className="mensaje-status">Parejas encontradas: {parejasEncontradas.length} de {conceptos.length}</p>
              <div className="grid-memoria">
                {cartas.map((carta, idx) => {
                  const estaVolteada = seleccionadas.includes(idx) || parejasEncontradas.includes(carta.texto);
                  return (
                    <button
                      key={carta.id}
                      className={`carta-memoria ${estaVolteada ? 'revelada' : ''}`}
                      onClick={() => seleccionarCarta(idx)}
                    >
                      {estaVolteada ? carta.texto : '❓'}
                    </button>
                  );
                })}
              </div>
              <button className="btn-reiniciar" onClick={iniciarMemoria}>Reiniciar Juego</button>
            </div>
          )}

          {/* AREA DE JUEGO 3 */}
          {juegoActivo === 3 && (
            <div className="panel-juego">
              <h2>🎨 Secuencia Lógica</h2>
              <p className="mensaje-status">{mensajeSimon}</p>
              <div className="grid-simon">
                {colores.map((col) => (
                  <button
                    key={col}
                    id={`btn-${col}`}
                    className={`btn-simon ${col}`}
                    onClick={() => presionarColor(col)}
                    disabled={bloqueado}
                  />
                ))}
              </div>
              <button className="btn-reiniciar" onClick={iniciarSimon}>Iniciar / Reiniciar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
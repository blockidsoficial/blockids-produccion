import React from 'react';
import styles from './VistaMinijuegos.css';

import iconoJuego        from '../../../assets/iconos/icono-juego.svg';
import xolotlProgramando from '../../../assets/xolotl/xolotl-programando.svg';
import bloqueAzul        from '../../../assets/elementos/bloque-azul.svg';
import bloqueAmarillo    from '../../../assets/elementos/bloque-amarillo.svg';
import bloqueMorado      from '../../../assets/elementos/bloque-morado.svg';
import estrellaAm        from '../../../assets/elementos/estrella-amarilla.svg';

// Pantalla "Próximamente" para la futura Zona Arcade del alumno.
// onVolver: handler para regresar a la vista de Inicio (lo pasa Dashboard.jsx).
const VistaMinijuegos = ({ onVolver }) => (
    <div className={styles.wrapper}>

        {/* Decoraciones flotantes */}
        <img src={bloqueAzul}     alt="" aria-hidden="true" className={`${styles.deco} ${styles.decoB1}`} />
        <img src={bloqueAmarillo} alt="" aria-hidden="true" className={`${styles.deco} ${styles.decoB2}`} />
        <img src={bloqueMorado}   alt="" aria-hidden="true" className={`${styles.deco} ${styles.decoB3}`} />
        <img src={estrellaAm}     alt="" aria-hidden="true" className={`${styles.deco} ${styles.decoS1}`} />
        <img src={estrellaAm}     alt="" aria-hidden="true" className={`${styles.deco} ${styles.decoS2}`} />

        <div className={styles.card}>
            <span className={styles.titulo} >Próximamente</span>
            {/* <div className={styles.iconoCirculo}>
                 <img src={iconoJuego} alt="" className={styles.icono} /> 
            </div> */}

            <h1 className={styles.titulo}>¡Zona en Construcción!</h1>
            <p className={styles.desc}>
                Estamos preparando nuevos retos y juegos para que sigas practicando
                lógica mientras te diviertes. ¡Vuelve pronto, esto se va a poner muy bueno!
            </p>

            <img src={xolotlProgramando} alt="Xolotl programando" className={styles.xolotl} />

            <button type="button" className={styles.btnVolver} onClick={onVolver}>
                ← Volver al Inicio
            </button>
        </div>
    </div>
);

export default VistaMinijuegos;

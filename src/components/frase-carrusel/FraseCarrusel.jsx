import React, { useState, useEffect, useCallback } from 'react';

import styles from './FraseCarrusel.css';
import { FRASES_SALUDO } from '../../lib/frase-del-dia';

import estrella from '../../assets/elementos/estrella-amarilla.svg';

// Colores SÓLIDOS de la marca (nada de degradados) que rotan por diapositiva.
const TEMAS = [
    styles.temaMorado,
    styles.temaAzul,
    styles.temaVerde,
    styles.temaRosa,
];

const INTERVALO_MS = 6000;

/**
 * Carrusel de frases motivadoras para el panel del alumno (niños).
 * Va justo debajo del banner. Rota solo, con puntitos para navegar a mano.
 * Reutiliza la lista FRASES_SALUDO (misma que el saludo del header).
 */
const FraseCarrusel = ({ frases = FRASES_SALUDO }) => {
    const total = frases.length;
    const [i, setI]         = useState(0);
    const [pausado, setPausado] = useState(false);

    const ir = useCallback((n) => setI(((n % total) + total) % total), [total]);

    useEffect(() => {
        if (pausado || total <= 1) return undefined;
        const t = setInterval(() => setI(prev => (prev + 1) % total), INTERVALO_MS);
        return () => clearInterval(t);
    }, [pausado, total]);

    if (!total) return null;

    return (
        <div
            className={`${styles.carrusel} ${TEMAS[i % TEMAS.length]}`}
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            aria-roledescription="carrusel"
            aria-label="Frases para motivarte"
        >
            <img src={estrella} alt="" className={styles.estrella} aria-hidden="true" />

            <p key={i} className={styles.frase}>
                {frases[i]}
            </p>

            {total > 1 && (
                <div className={styles.puntos}>
                    {frases.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`${styles.punto} ${idx === i ? styles.puntoActivo : ''}`}
                            aria-label={`Ir a la frase ${idx + 1}`}
                            aria-current={idx === i}
                            onClick={() => ir(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FraseCarrusel;

import React, { useState, useEffect, useCallback, useRef } from 'react';

import styles from './LogroCelebracion.css';
import { EVENTO_LOGRO, consumirLogrosPendientes } from '../../lib/logro-eventos';

import xolotlLogro from '../../assets/xolotl/xolotl-logro.svg';

// Colores sólidos de la marca para el confeti (sin degradados).
const COLORES_CONFETI = [
    'var(--color-morado-primario)',
    'var(--color-rosa-primario)',
    'var(--color-verde-primario)',
    'var(--color-azul-primario)',
    'var(--color-amarillo-acento)',
];

const CONFETIS = Array.from({ length: 22 }, (_, i) => ({
    izq:     `${Math.round((i * 4.5 + (i % 3) * 7) % 100)}%`,
    color:   COLORES_CONFETI[i % COLORES_CONFETI.length],
    retardo: `${(i % 7) * 0.12}s`,
    dur:     `${1.7 + (i % 4) * 0.35}s`,
    tam:     `${8 + (i % 3) * 4}px`,
    gira:    i % 2 === 0 ? '360deg' : '-320deg',
}));

const AUTO_CIERRE_MS = 9000;

/**
 * Popup de celebración que aparece cuando el alumno desbloquea un logro.
 * Escucha el bus de eventos de logro-eventos.js: eventos en vivo + la cola
 * de sessionStorage (para logros que se otorgan justo antes de navegar).
 *
 * Se monta una vez por pantalla (panel del alumno y entorno).
 */
const LogroCelebracion = () => {
    const [cola, setCola]  = useState([]);
    const vistosRef        = useRef(new Set());
    const timerRef         = useRef(null);

    const encolar = useCallback((nuevos) => {
        if (!nuevos || !nuevos.length) return;
        setCola(prev => {
            const frescos = nuevos.filter(l => {
                const clave = `${l.nombre}|${l.ts}`;
                if (vistosRef.current.has(clave)) return false;
                vistosRef.current.add(clave);
                return true;
            });
            return frescos.length ? [...prev, ...frescos] : prev;
        });
    }, []);

    // Cola pendiente al montar (venimos de otra pantalla) + eventos en vivo.
    useEffect(() => {
        encolar(consumirLogrosPendientes());

        // En vivo: vaciamos también la cola de sessionStorage (emitirLogro deja
        // el logro en ambos sitios) para que no se re-muestre al cambiar de
        // pantalla. El dedupe por `nombre|ts` evita mostrarlo dos veces.
        const alLogro = (e) => {
            encolar([e.detail, ...consumirLogrosPendientes()]);
        };
        window.addEventListener(EVENTO_LOGRO, alLogro);
        return () => window.removeEventListener(EVENTO_LOGRO, alLogro);
    }, [encolar]);

    const actual = cola[0] || null;

    const cerrar = useCallback(() => {
        setCola(prev => prev.slice(1));
    }, []);

    // Auto-cierre del que se está mostrando.
    useEffect(() => {
        if (!actual) return undefined;
        timerRef.current = setTimeout(cerrar, AUTO_CIERRE_MS);
        return () => clearTimeout(timerRef.current);
    }, [actual, cerrar]);

    if (!actual) return null;

    return (
        <div className={styles.overlay} onClick={cerrar} role="dialog" aria-live="assertive">

            <div className={styles.confetiCapa} aria-hidden="true">
                {CONFETIS.map((c, i) => (
                    <span
                        key={i}
                        className={styles.confeti}
                        style={{
                            left:                 c.izq,
                            backgroundColor:      c.color,
                            width:                c.tam,
                            height:               c.tam,
                            animationDelay:       c.retardo,
                            animationDuration:    c.dur,
                            '--gira':             c.gira,
                        }}
                    />
                ))}
            </div>

            <div className={styles.tarjeta} onClick={e => e.stopPropagation()}>
                <p className={styles.cintillo}>¡Nuevo logro!</p>

                <div className={styles.xolotlWrap}>
                    <img src={actual.iconoUrl || xolotlLogro} alt="" className={styles.xolotl} />
                </div>

                <h2 className={styles.nombre}>{actual.nombre}</h2>

                {actual.descripcion && (
                    <p className={styles.descripcion}>{actual.descripcion}</p>
                )}

                {actual.bonoXP > 0 && (
                    <span className={styles.xpBadge}>+{actual.bonoXP} XP</span>
                )}

                <button type="button" className={styles.boton} onClick={cerrar}>
                    ¡Genial!
                </button>

                {cola.length > 1 && (
                    <span className={styles.contador}>+{cola.length - 1} más</span>
                )}
            </div>
        </div>
    );
};

export default LogroCelebracion;

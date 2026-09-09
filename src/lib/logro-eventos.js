// ============================================================================
// BLOCKIDS — Bus de eventos para celebraciones de logros
// ----------------------------------------------------------------------------
// `desbloquearLogro()` (services/gamificationService) llama a `emitirLogro()`
// cuando un alumno consigue un logro nuevo. El componente <LogroCelebracion />
// (montado en el panel del alumno y en el entorno) escucha estos eventos y
// muestra el popup de celebración.
//
// El reto: a veces el logro se desbloquea justo ANTES de navegar a otra
// pantalla (p. ej. "Mi Primer Proyecto" -> se va al /entorno). Para no perder
// la celebración, además del evento en vivo dejamos el logro en una cola en
// sessionStorage; el componente la vacía al montarse en la nueva pantalla.
// ============================================================================

export const EVENTO_LOGRO = 'blockids:logro-desbloqueado';

const CLAVE_COLA = 'bk_logros_pendientes';

const leerCola = () => {
    try {
        const raw = sessionStorage.getItem(CLAVE_COLA);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
};

const escribirCola = (arr) => {
    try {
        sessionStorage.setItem(CLAVE_COLA, JSON.stringify(arr));
    } catch (_) { /* storage no disponible: solo queda el evento en vivo */ }
};

/**
 * Anuncia que se desbloqueó un logro.
 * @param {{nombre:string, descripcion?:string, iconoUrl?:string, bonoXP?:number}} logro
 */
export const emitirLogro = (logro) => {
    if (!logro || !logro.nombre) return;

    const payload = {
        nombre:      logro.nombre,
        descripcion: logro.descripcion || '',
        iconoUrl:    logro.iconoUrl || '',
        bonoXP:      logro.bonoXP || 0,
        ts:          Date.now(),
    };

    escribirCola([...leerCola(), payload]);

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(EVENTO_LOGRO, { detail: payload }));
    }
};

/** Devuelve y limpia los logros que quedaron en cola (tras navegar de pantalla). */
export const consumirLogrosPendientes = () => {
    const cola = leerCola();
    if (cola.length) escribirCola([]);
    return cola;
};

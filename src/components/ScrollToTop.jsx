import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Al ser una SPA, React Router no recarga la página al cambiar de ruta, así que
 * la posición de scroll se queda donde estaba (p. ej. al entrar a "Términos"
 * desde el footer, la vista aparece hasta abajo).
 *
 * Por la arquitectura heredada de scratch-gui (`html, body, .app { height:100% }`
 * en playground/index.css), el elemento que realmente hace scroll no siempre es
 * el mismo: puede ser el `window` / `<html>` o el `<body>`. `window.scrollTo`
 * solo actúa sobre el `scrollingElement` (`<html>`), por lo que aquí reseteamos
 * los tres candidatos.
 *
 * Se usa `useLayoutEffect` para que el salto ocurra antes del primer pintado y
 * no se vea un parpadeo con la página desplazada. No renderiza nada.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    // El navegador restaura la posición previa en atrás/adelante; lo desactivamos
    // para que mande siempre el reset de abajo.
    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);

        const scroller = document.scrollingElement || document.documentElement;
        if (scroller) scroller.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
    }, [pathname]);

    return null;
};

export default ScrollToTop;

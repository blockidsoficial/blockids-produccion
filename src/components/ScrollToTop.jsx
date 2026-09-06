import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Al ser una SPA, React Router no recarga la página al cambiar de ruta, por lo
 * que la barra de desplazamiento se queda donde el usuario la dejó. Este
 * componente fuerza el scroll a la coordenada (0,0) cada vez que cambia el
 * pathname. No renderiza nada.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;

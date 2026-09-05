import { useEffect } from 'react';

/**
 * Custom Hook de UX: actualiza dinámicamente el título de la pestaña del
 * navegador (document.title) al montar el componente, con el formato
 * "Página | Blockids". Al desmontar, restaura el título que había antes
 * (útil cuando el componente vive dentro de una vista/modal temporal).
 *
 * @param {string} titulo - Nombre de la página (ej. "Inicio", "Panel del Profesor").
 *
 * @example
 * const LandingPage = () => {
 *     useDocumentTitle('Inicio');
 *     return (...);
 * };
 */
const useDocumentTitle = (titulo) => {
    useEffect(() => {
        const tituloAnterior = document.title;
        document.title = titulo ? `${titulo} | Blockids` : 'Blockids';

        return () => {
            document.title = tituloAnterior;
        };
    }, [titulo]);
};

export default useDocumentTitle;

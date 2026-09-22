// Avatares de los alumnos: ilustraciones de Xolotl.
//
// En perfiles.avatar_url se guarda solo la CLAVE ("xolotl-idea"), no una URL:
// así los archivos pueden cambiar de hash/ubicación sin tocar la base de datos.
// Si un alumno aún no eligió ninguno, se le asigna uno estable a partir de su
// usuario (siempre el mismo), para que nadie se vea con un icono genérico.

import aprendiendo from '../assets/xolotl/xolotl-aprendiendo.svg';
import bravo from '../assets/xolotl/xolotl-bravo.svg';
import excelente from '../assets/xolotl/xolotl-excelente.svg';
import explorando from '../assets/xolotl/xolotl-explorando.svg';
import ganador from '../assets/xolotl/xolotl-ganador.svg';
import idea from '../assets/xolotl/xolotl-idea.svg';
import levantandoBloque from '../assets/xolotl/xolotl-levantandobloque.svg';
import logro from '../assets/xolotl/xolotl-logro.svg';
import programando from '../assets/xolotl/xolotl-programando.svg';
import saludando from '../assets/xolotl/xolotl-saludando.svg';

export const AVATARES = [
    {id: 'xolotl-aprendiendo', nombre: 'Aprendiendo', src: aprendiendo},
    {id: 'xolotl-bravo', nombre: 'Bravo', src: bravo},
    {id: 'xolotl-excelente', nombre: 'Excelente', src: excelente},
    {id: 'xolotl-explorando', nombre: 'Explorando', src: explorando},
    {id: 'xolotl-ganador', nombre: 'Ganador', src: ganador},
    {id: 'xolotl-idea', nombre: 'Con una idea', src: idea},
    {id: 'xolotl-levantandobloque', nombre: 'Con un bloque', src: levantandoBloque},
    {id: 'xolotl-logro', nombre: 'Logro', src: logro},
    {id: 'xolotl-programando', nombre: 'Programando', src: programando},
    {id: 'xolotl-saludando', nombre: 'Saludando', src: saludando}
];

const AVATAR_POR_ID = AVATARES.reduce((mapa, a) => {
    mapa[a.id] = a;
    return mapa;
}, {});

const hashTexto = texto => Array.from(String(texto || '')).reduce(
    (acc, c) => ((acc * 31) + c.charCodeAt(0)) >>> 0,
    7
);

/**
 * Avatar de un perfil: el que eligió, o uno estable derivado de su usuario.
 * @param {string|null} avatarUrl - valor de perfiles.avatar_url (clave o URL).
 * @param {string} semilla - normalmente el username.
 * @returns {{id: string, nombre: string, src: string}} el avatar a mostrar.
 */
export const avatarDePerfil = (avatarUrl, semilla) => {
    if (avatarUrl && AVATAR_POR_ID[avatarUrl]) return AVATAR_POR_ID[avatarUrl];
    if (avatarUrl && /^https?:\/\//.test(avatarUrl)) {
        return {id: avatarUrl, nombre: 'Avatar', src: avatarUrl};
    }
    return AVATARES[hashTexto(semilla) % AVATARES.length];
};

// El Header escucha este evento para refrescar el avatar sin recargar la página.
export const EVENTO_AVATAR = 'blockids:avatar-actualizado';

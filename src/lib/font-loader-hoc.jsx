import React from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash.omit';
import {connect} from 'react-redux';
import {setFontsLoaded} from '../reducers/fonts-loaded';

// Esta lista es de scratch-render-fonts:
// https://github.com/LLK/scratch-render-fonts/blob/master/src/index.js#L4
const FONTS = [
    'Sans Serif',
    'Serif',
    'Handwriting',
    'Marker',
    'Curly',
    'Pixel',
    'Scratch'
];
/* Componente de Orden Superior para proporcionar comportamiento de carga de fuentes.
 * @param {React.Component} WrappedComponent componente que recibirá la prop fontsLoaded
 * @returns {React.Component} componente con comportamiento de carga de fuentes
 */
const FontLoaderHOC = function (WrappedComponent) {
    class FontLoaderComponent extends React.Component {
        componentDidMount () {
            if (this.props.fontsLoaded) return;

            const getFontPromises = () => {
                const fontPromises = [];
                // Los navegadores que admiten la interfaz del cargador de fuentes tienen un document.fonts.values() iterable
                // Firefox tiene un objeto simulado que no implementa realmente iterable, por lo que
                // la verificación de seguridad profunda es necesaria.
                if (document.fonts &&
                    typeof document.fonts.values === 'function' &&
                    typeof document.fonts.values()[Symbol.iterator] === 'function') {
                    for (const fontFace of document.fonts.values()) {
                        // Solo carga fuentes de esta lista. Si cargamos todas las fuentes en el documento, podemos bloquear en
                        // la carga de fuentes de cosas como extensiones de cromo.
                        if (FONTS.indexOf(fontFace.family) !== -1) {
                            fontPromises.push(fontFace.loaded);
                            fontFace.load();
                        }
                    }
                }
                return fontPromises;
            };
            // Las promesas de fuentes deben recopilarse después de que se cargue el documento, porque en Mac Chrome, los objetos de promesa
            // se reemplazan y los antiguos nunca se resuelven.
            if (document.readyState === 'complete') {
                Promise.all(getFontPromises()).then(() => {
                    this.props.onSetFontsLoaded();
                });
            } else {
                document.onreadystatechange = () => {
                    if (document.readyState !== 'complete') return;
                    document.onreadystatechange = null;
                    Promise.all(getFontPromises()).then(() => {
                        this.props.onSetFontsLoaded();
                    });
                };
            }
        }
        render () {
            const componentProps = omit(this.props, ['onSetFontsLoaded']);
            return (
                <WrappedComponent
                    {...componentProps}
                />
            );
        }
    }


    FontLoaderComponent.propTypes = {
        fontsLoaded: PropTypes.bool.isRequired,
        onSetFontsLoaded: PropTypes.func.isRequired
    };
    const mapStateToProps = state => ({
        fontsLoaded: state.scratchGui.fontsLoaded
    });
    const mapDispatchToProps = dispatch => ({
        onSetFontsLoaded: () => dispatch(setFontsLoaded())
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(FontLoaderComponent);
};

export {
    FontLoaderHOC as default
};

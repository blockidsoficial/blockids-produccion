import {addLocaleData} from 'react-intl';

import {localeData, isRtl} from 'scratch-l10n';
import editorMessages from 'scratch-l10n/locales/editor-msgs';

addLocaleData(localeData);

// Tags y mensajes personalizados BLOCKIDS que no existen en scratch-l10n
const blockidsMessages = {
    'gui.gui.shouldDeleteSprite': '¿Seguro que quieres borrar este personaje?',
    'gui.gui.shouldDeleteCostume': '¿Seguro que quieres borrar este disfraz?',
    'gui.gui.shouldDeleteSound': '¿Seguro que quieres borrar este sonido?',
    'gui.gui.confirm': 'Sí, borrar',
    'gui.gui.cancel': 'Cancelar',
    'gui.gui.deleteAssetHeading': 'Confirmar eliminación',
    'gui.libraryTags.all': 'Todos',
    'gui.libraryTags.xolotls': 'Xolotls',
    'gui.libraryTags.humanos': 'Humanos',
    'gui.libraryTags.personajes': 'Personajes',
    'gui.libraryTags.animales': 'Animales',
    'gui.libraryTags.robots': 'Robots y Aliens',
    'gui.libraryTags.escolares': 'Objetos Escolares',
    'gui.libraryTags.tecnologia': 'Tecnología',
    'gui.libraryTags.musica': 'Música',
    'gui.libraryTags.instrumentos': 'Instrumentos',
    'gui.libraryTags.deportes': 'Deportes',
    'gui.libraryTags.comida': 'Comida',
    'gui.libraryTags.naturaleza': 'Naturaleza',
    'gui.libraryTags.plantas': 'Plantas',
    'gui.libraryTags.transporte': 'Transporte',
    'gui.libraryTags.fantasia': 'Fantasía',
    'gui.libraryTags.espacio': 'Espacio y Ciencia',
    'gui.libraryTags.lugares': 'Lugares',
    'gui.libraryTags.objetos': 'Objetos',
    'gui.libraryTags.emociones': 'Emociones',
    'gui.libraryTags.formas': 'Formas y Símbolos',
    'gui.libraryTags.letras': 'Letras'
};
['es', 'es-419'].forEach(locale => {
    if (editorMessages[locale]) {
        editorMessages[locale] = Object.assign({}, editorMessages[locale], blockidsMessages);
    }
});

const UPDATE_LOCALES = 'scratch-gui/locales/UPDATE_LOCALES';
const SELECT_LOCALE = 'scratch-gui/locales/SELECT_LOCALE';

const initialState = {
    isRtl: false,
    locale: 'es-419',
    messagesByLocale: editorMessages,
    messages: editorMessages['es-419']
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SELECT_LOCALE:
        return Object.assign({}, state, {
            isRtl: isRtl(action.locale),
            locale: action.locale,
            messagesByLocale: state.messagesByLocale,
            messages: state.messagesByLocale[action.locale]
        });
    case UPDATE_LOCALES:
        return Object.assign({}, state, {
            isRtl: state.isRtl,
            locale: state.locale,
            messagesByLocale: action.messagesByLocale,
            messages: action.messagesByLocale[state.locale]
        });
    default:
        return state;
    }
};

const selectLocale = function (locale) {
    return {
        type: SELECT_LOCALE,
        locale: locale
    };
};

const setLocales = function (localesMessages) {
    return {
        type: UPDATE_LOCALES,
        messagesByLocale: localesMessages
    };
};
const initLocale = function (currentState, locale) {
    if (Object.prototype.hasOwnProperty.call(currentState.messagesByLocale, locale)) {
        return Object.assign(
            {},
            currentState,
            {
                isRtl: isRtl(locale),
                locale: locale,
                messagesByLocale: currentState.messagesByLocale,
                messages: currentState.messagesByLocale[locale]
            }
        );
    }
    // no cambies la configuración regional si no está en los mensajes actuales
    return currentState;
};
export {
    reducer as default,
    initialState as localesInitialState,
    initLocale,
    selectLocale,
    setLocales
};

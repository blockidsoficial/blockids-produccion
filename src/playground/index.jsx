// Rellenos de compatibilidad
import 'es6-object-assign/auto';
import 'core-js/fn/array/includes';
import 'core-js/fn/promise/finally';
import 'intl'; // Para Safari 9

import React from 'react';
import ReactDOM from 'react-dom';

import AppStateHOC from '../lib/app-state-hoc.jsx';
import BrowserModalComponent from '../components/browser-modal/browser-modal.jsx';
import supportedBrowser from '../lib/supported-browser';

import styles from './index.css';

const appTarget = document.createElement('div');
appTarget.className = styles.app;
document.body.appendChild(appTarget);

if (supportedBrowser()) {
    // require necesario aquí para evitar importar código que bloquea el navegador no soportado
    // en el nivel superior
    require('./render-gui.jsx').default(appTarget);

} else {
    BrowserModalComponent.setAppElement(appTarget);
    const WrappedBrowserModalComponent = AppStateHOC(BrowserModalComponent, true /* localesOnly */);
    const handleBack = () => {};
    // eslint-disable-next-line react/jsx-no-bind
    ReactDOM.render(<WrappedBrowserModalComponent onBack={handleBack} />, appTarget);
}

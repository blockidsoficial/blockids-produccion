import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';

import AppStateHOC from '../lib/app-state-hoc.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import log from '../lib/log.js';

import App from '../App.jsx'; // Importamos tu nuevo enrutador

const onClickLogo = () => {
    window.location = 'https://scratch.mit.edu';
};

const handleTelemetryModalCancel = () => {
    log('User canceled telemetry modal');
};

const handleTelemetryModalOptIn = () => {
    log('User opted into telemetry');
};

const handleTelemetryModalOptOut = () => {
    log('User opted out of telemetry');
};

/*
 * Render the GUI playground. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default appTarget => {
    GUI.setAppElement(appTarget);

    // Nota: la función 'compose' de redux se usa como utilidad general para
    // aclarar la jerarquía de llamadas al constructor de HOC aquí; no tiene nada que ver con
    // la capacidad de redux para componer reductores.
    const WrappedGui = compose(
        AppStateHOC,
        HashParserHOC
    )(GUI);

    // TODO: un ajuste para probar la mochila, permitir que el host de la mochila se establezca por parámetro de URL
    const backpackHostMatches = window.location.href.match(/[?&]backpack_host=([^&]*)&?/);
    const backpackHost = backpackHostMatches ? backpackHostMatches[1] : null;

    const scratchDesktopMatches = window.location.href.match(/[?&]isScratchDesktop=([^&]+)/);
    let simulateScratchDesktop;
    if (scratchDesktopMatches) {
        try {
            // Analizar 'true' en `true`, 'false' en `false`, etc.
            simulateScratchDesktop = JSON.parse(scratchDesktopMatches[1]);
        } catch {
            // No es JSON, así que solo usa la cadena
            // Nota: un error tipográfico como "falsy" se tratará como verdadero
            simulateScratchDesktop = scratchDesktopMatches[1];
        }
    }

    // La advertencia de "salir de la página" la maneja project-saver-hoc.jsx
    // (solo cuando hay cambios reales sin guardar en el editor). Poner un
    // window.onbeforeunload incondicional aquí la disparaba en TODA la app
    // (login, dashboards, etc.), porque este archivo es el punto de arranque
    // de todo el router, no solo del editor.

    // Le damos el control total a tu Enrutador
    ReactDOM.render(<App />, appTarget);
};

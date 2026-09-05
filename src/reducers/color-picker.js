const ACTIVATE_COLOR_PICKER = 'scratch-gui/color-picker/ACTIVATE_COLOR_PICKER';
const DEACTIVATE_COLOR_PICKER = 'scratch-gui/color-picker/DEACTIVATE_COLOR_PICKER';
const SET_CALLBACK = 'scratch-gui/color-picker/SET_CALLBACK';

const initialState = {
    active: false,
    callback: () => {
        throw new Error('Color picker callback not initialized');
    }
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case ACTIVATE_COLOR_PICKER:
        return Object.assign({}, state, {active: true, callback: action.callback});
    case DEACTIVATE_COLOR_PICKER:
        // Puede ser llamado sin una cadena para desactivar sin establecer color
        // es decir, cuando se hace clic en el fondo del modal
        if (typeof action.color === 'string') {
            state.callback(action.color);
        }
        return Object.assign({}, state, {active: false});
    case SET_CALLBACK:
        return Object.assign({}, state, {callback: action.callback});
    default:
        return state;
    }
};

const activateColorPicker = callback => ({type: ACTIVATE_COLOR_PICKER, callback: callback});
const deactivateColorPicker = color => ({type: DEACTIVATE_COLOR_PICKER, color: color});
const setCallback = callback => ({type: SET_CALLBACK, callback: callback});

export {
    reducer as default,
    initialState as colorPickerInitialState,
    activateColorPicker,
    deactivateColorPicker,
    setCallback
};

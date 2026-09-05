import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import {connect} from 'react-redux';

import {updateTargets} from '../reducers/targets';
import {updateBlockDrag} from '../reducers/block-drag';
import {updateMonitors} from '../reducers/monitors';
import {setProjectChanged, setProjectUnchanged} from '../reducers/project-changed';
import {setRunningState, setTurboState, setStartedState} from '../reducers/vm-status';
import {showExtensionAlert} from '../reducers/alerts';
import {updateMicIndicator} from '../reducers/mic-indicator';

/*
 * Higher Order Component to manage events emitted by the VM
 * @param {React.Component} WrappedComponent component to manage VM events for
 * @returns {React.Component} connected component with vm events bound to redux
 */
const vmListenerHOC = function (WrappedComponent) {
    class VMListener extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handleKeyDown',
                'handleKeyUp',
                'handleProjectChanged',
                'handleTargetsUpdate'
            ]);
            // Tenemos que empezar a escuchar la vm aquí en lugar de en
            // componentDidMount porque el HOC monta el componente envuelto,
            // entonces el HOC componentDidMount se activa después de que se monta el componente envuelto.
            // Si el componente envuelto usa la vm en componentDidMount, entonces
            // necesitamos comenzar a escuchar antes de montar el componente envuelto.
            this.props.vm.on('targetsUpdate', this.handleTargetsUpdate);
            this.props.vm.on('MONITORS_UPDATE', this.props.onMonitorsUpdate);
            this.props.vm.on('BLOCK_DRAG_UPDATE', this.props.onBlockDragUpdate);
            this.props.vm.on('TURBO_MODE_ON', this.props.onTurboModeOn);
            this.props.vm.on('TURBO_MODE_OFF', this.props.onTurboModeOff);
            this.props.vm.on('PROJECT_RUN_START', this.props.onProjectRunStart);
            this.props.vm.on('PROJECT_RUN_STOP', this.props.onProjectRunStop);
            this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
            this.props.vm.on('RUNTIME_STARTED', this.props.onRuntimeStarted);
            this.props.vm.on('PROJECT_START', this.props.onGreenFlag);
            this.props.vm.on('PERIPHERAL_CONNECTION_LOST_ERROR', this.props.onShowExtensionAlert);
            this.props.vm.on('MIC_LISTENING', this.props.onMicListeningUpdate);

        }
        componentDidMount () {
            if (this.props.attachKeyboardEvents) {
                document.addEventListener('keydown', this.handleKeyDown);
                document.addEventListener('keyup', this.handleKeyUp);
            }
            this.props.vm.postIOData('userData', {username: this.props.username});
        }
        componentDidUpdate (prevProps) {
            if (prevProps.username !== this.props.username) {
                this.props.vm.postIOData('userData', {username: this.props.username});
            }

            // Solicita nuevamente una actualización de destinos cuando el estado shouldUpdateTargets cambia a verdadero
            // es decir, cuando el editor sale de los modos de pantalla completa/solo jugador
            if (this.props.shouldUpdateTargets && !prevProps.shouldUpdateTargets) {
                this.props.vm.emitTargetsUpdate(false /* Emit the event, but do not trigger project change */);
            }
        }
        componentWillUnmount () {
            this.props.vm.removeListener('PERIPHERAL_CONNECTION_LOST_ERROR', this.props.onShowExtensionAlert);
            if (this.props.attachKeyboardEvents) {
                document.removeEventListener('keydown', this.handleKeyDown);
                document.removeEventListener('keyup', this.handleKeyUp);
            }
        }
        handleProjectChanged () {
            if (this.props.shouldUpdateProjectChanged && !this.props.projectChanged) {
                this.props.onProjectChanged();
            }
        }
        handleTargetsUpdate (data) {
            if (this.props.shouldUpdateTargets) {
                this.props.onTargetsUpdate(data);
            }
        }
        handleKeyDown (e) {
            // No captures las claves destinadas a los inputs de Blockly.
            if (e.target !== document && e.target !== document.body) return;

            const key = (!e.key || e.key === 'Dead') ? e.keyCode : e.key;
            this.props.vm.postIOData('keyboard', {
                key: key,
                isDown: true
            });

            // Evita que la tecla espacio/flecha desplace la página.
            if (e.keyCode === 32 || // 32=space
                (e.keyCode >= 37 && e.keyCode <= 40)) { // 37, 38, 39, 40 are arrows
                e.preventDefault();
            }
        }
        handleKeyUp (e) {
            // Siempre captura eventos hacia arriba,
            // incluso los que han cambiado a otros objetivos.
            const key = (!e.key || e.key === 'Dead') ? e.keyCode : e.key;
            this.props.vm.postIOData('keyboard', {
                key: key,
                isDown: false
            });

            // P. ej., evita el desplazamiento.
            if (e.target !== document && e.target !== document.body) {
                e.preventDefault();
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                attachKeyboardEvents,
                projectChanged,
                shouldUpdateTargets,
                shouldUpdateProjectChanged,
                onBlockDragUpdate,
                onGreenFlag,
                onKeyDown,
                onKeyUp,
                onMicListeningUpdate,
                onMonitorsUpdate,
                onTargetsUpdate,
                onProjectChanged,
                onProjectRunStart,
                onProjectRunStop,
                onProjectSaved,
                onRuntimeStarted,
                onTurboModeOff,
                onTurboModeOn,
                onShowExtensionAlert,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return <WrappedComponent {...props} />;
        }
    }
    VMListener.propTypes = {
        attachKeyboardEvents: PropTypes.bool,
        onBlockDragUpdate: PropTypes.func.isRequired,
        onGreenFlag: PropTypes.func,
        onKeyDown: PropTypes.func,
        onKeyUp: PropTypes.func,
        onMicListeningUpdate: PropTypes.func.isRequired,
        onMonitorsUpdate: PropTypes.func.isRequired,
        onProjectChanged: PropTypes.func.isRequired,
        onProjectRunStart: PropTypes.func.isRequired,
        onProjectRunStop: PropTypes.func.isRequired,
        onProjectSaved: PropTypes.func.isRequired,
        onRuntimeStarted: PropTypes.func.isRequired,
        onShowExtensionAlert: PropTypes.func.isRequired,
        onTargetsUpdate: PropTypes.func.isRequired,
        onTurboModeOff: PropTypes.func.isRequired,
        onTurboModeOn: PropTypes.func.isRequired,
        projectChanged: PropTypes.bool,
        shouldUpdateTargets: PropTypes.bool,
        shouldUpdateProjectChanged: PropTypes.bool,
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM).isRequired
    };
    VMListener.defaultProps = {
        attachKeyboardEvents: true,
        onGreenFlag: () => ({})
    };
    const mapStateToProps = state => ({
        projectChanged: state.scratchGui.projectChanged,
        // No emite actualizaciones de destino o proyecto en modo pantalla completa o solo jugador
        // o cuando se graban sonidos (genera grabaciones distorsionadas en máquinas de bajo rendimiento)
        shouldUpdateTargets: !state.scratchGui.mode.isFullScreen && !state.scratchGui.mode.isPlayerOnly &&
            !state.scratchGui.modals.soundRecorder,
        // No actualiza el estado projectChanged en modo pantalla completa o solo jugador
        shouldUpdateProjectChanged: !state.scratchGui.mode.isFullScreen && !state.scratchGui.mode.isPlayerOnly,
        vm: state.scratchGui.vm,
        username: state.session && state.session.session && state.session.session.user ?
            state.session.session.user.username : ''
    });
    const mapDispatchToProps = dispatch => ({
        onTargetsUpdate: data => {
            dispatch(updateTargets(data.targetList, data.editingTarget));
        },
        onMonitorsUpdate: monitorList => {
            dispatch(updateMonitors(monitorList));
        },
        onBlockDragUpdate: areBlocksOverGui => {
            dispatch(updateBlockDrag(areBlocksOverGui));
        },
        onProjectRunStart: () => dispatch(setRunningState(true)),
        onProjectRunStop: () => dispatch(setRunningState(false)),
        onProjectChanged: () => dispatch(setProjectChanged()),
        onProjectSaved: () => dispatch(setProjectUnchanged()),
        onRuntimeStarted: () => dispatch(setStartedState(true)),
        onTurboModeOn: () => dispatch(setTurboState(true)),
        onTurboModeOff: () => dispatch(setTurboState(false)),
        onShowExtensionAlert: data => {
            dispatch(showExtensionAlert(data));
        },
        onMicListeningUpdate: listening => {
            dispatch(updateMicIndicator(listening));
        }
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(VMListener);
};

export default vmListenerHOC;

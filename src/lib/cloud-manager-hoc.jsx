import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';

import VM from 'scratch-vm';
import CloudProvider from '../lib/cloud-provider';

import {
    getIsShowingWithId
} from '../reducers/project-state';

import {
    showAlertWithTimeout
} from '../reducers/alerts';

/*
 * Higher Order Component to manage the connection to the cloud server.
 * @param {React.Component} WrappedComponent component to manage VM events for
 * @returns {React.Component} connected component with vm events bound to redux
 */
const cloudManagerHOC = function (WrappedComponent) {
    class CloudManager extends React.Component {
        constructor (props) {
            super(props);
            this.cloudProvider = null;
            bindAll(this, [
                'handleCloudDataUpdate',
                'handleExtensionAdded'
            ]);

            this.props.vm.on('HAS_CLOUD_DATA_UPDATE', this.handleCloudDataUpdate);
            this.props.vm.on('EXTENSION_ADDED', this.handleExtensionAdded);
        }
        componentDidMount () {
            if (this.shouldConnect(this.props)) {
                this.connectToCloud();
            }
        }
        componentDidUpdate (prevProps) {
            // TODO: necesita añadir lógica de desconexion del proveedor de nube y lógica de limpieza de datos en la nube
            // cuando carga un nuevo proyecto, p. ej. mediante carga de archivo
            // (y finalmente sacarlo de la función vm.clear)

            if (this.shouldConnect(this.props) && !this.shouldConnect(prevProps)) {
                this.connectToCloud();
            }

            if (this.shouldDisconnect(this.props, prevProps)) {
                this.disconnectFromCloud();
            }
        }
        componentWillUnmount () {
            this.disconnectFromCloud();
        }
        canUseCloud (props) {
            return !!(props.cloudHost && props.username && props.vm && props.projectId && props.hasCloudPermission);
        }
        shouldConnect (props) {
            return !this.isConnected() && this.canUseCloud(props) &&
                props.isShowingWithId && props.vm.runtime.hasCloudData() &&
                props.canModifyCloudData;
        }
        shouldDisconnect (props, prevProps) {
            return this.isConnected() &&
                ( // Can no longer use cloud or cloud provider info is now stale
                    !this.canUseCloud(props) ||
                    !props.vm.runtime.hasCloudData() ||
                    (props.projectId !== prevProps.projectId) ||
                    (props.username !== prevProps.username) ||
                    // Editando un proyecto de otra persona
                    !props.canModifyCloudData
                );
        }
        isConnected () {
            return this.cloudProvider && !!this.cloudProvider.connection;
        }
        connectToCloud () {
            this.cloudProvider = new CloudProvider(
                this.props.cloudHost,
                this.props.vm,
                this.props.username,
                this.props.projectId);
            this.props.vm.setCloudProvider(this.cloudProvider);
        }
        disconnectFromCloud () {
            if (this.cloudProvider) {
                this.cloudProvider.requestCloseConnection();
                this.cloudProvider = null;
                this.props.vm.setCloudProvider(null);
            }
        }
        handleCloudDataUpdate (projectHasCloudData) {
            if (this.isConnected() && !projectHasCloudData) {
                this.disconnectFromCloud();
            } else if (this.shouldConnect(this.props)) {
                this.props.onShowCloudInfo();
                this.connectToCloud();
            }
        }
        handleExtensionAdded (categoryInfo) {
            // Nota: props.vm.extensionManager.isExtensionLoaded('videoSensing') sigue siendo falso
            // en el punto de esta devolución de llamada, por lo que es difícil reutilizar la lógica canModifyCloudData.
            if (categoryInfo.id === 'videoSensing' && this.isConnected()) {
                this.disconnectFromCloud();
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                canModifyCloudData,
                cloudHost,
                projectId,
                username,
                hasCloudPermission,
                isShowingWithId,
                onShowCloudInfo,
                /* eslint-enable no-unused-vars */
                vm,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    canUseCloud={this.canUseCloud(this.props)}
                    vm={vm}
                    {...componentProps}
                />
            );
        }
    }

    CloudManager.propTypes = {
        canModifyCloudData: PropTypes.bool.isRequired,
        cloudHost: PropTypes.string,
        hasCloudPermission: PropTypes.bool,
        isShowingWithId: PropTypes.bool.isRequired,
        onShowCloudInfo: PropTypes.func,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM).isRequired
    };

    CloudManager.defaultProps = {
        cloudHost: null,
        hasCloudPermission: false,
        onShowCloudInfo: () => {},
        username: null
    };

    const mapStateToProps = (state, ownProps) => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            isShowingWithId: getIsShowingWithId(loadingState),
            projectId: state.scratchGui.projectState.projectId,
            // si estás editando el proyecto de otra persona, no puedes modificar datos en la nube
            canModifyCloudData: (!state.scratchGui.mode.hasEverEnteredEditor || ownProps.canSave) &&
                // posible preocupación de seguridad si el programa intenta codificar datos de webcam sobre variables en la nube
                !ownProps.vm.extensionManager.isExtensionLoaded('videoSensing')
        };
    };

    const mapDispatchToProps = dispatch => ({
        onShowCloudInfo: () => showAlertWithTimeout(dispatch, 'cloudInfo')
    });

    // Permite que los props entrantes anulen los props proporcionados por redux. Utilizado para simular en pruebas.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(CloudManager);
};

export default cloudManagerHOC;

import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import {
    getIsAnyCreatingNewState,
    getIsShowingWithoutId
} from '../reducers/project-state';
import {setProjectTitle} from '../reducers/project-title';

const messages = defineMessages({
    defaultProjectTitle: {
        id: 'gui.gui.defaultProjectTitle',
        description: 'Default title for project',
        defaultMessage: 'Proyecto de BLOCKIDS'
    }
});

/* Higher Order Component to get and set the project title
 * @param {React.Component} WrappedComponent component to receive project title related props
 * @returns {React.Component} component with project loading behavior
 */
const TitledHOC = function (WrappedComponent) {
    class TitledComponent extends React.Component {
        componentDidMount () {
            this.handleReceivedProjectTitle(this.props.projectTitle);
        }
        componentDidUpdate (prevProps) {
            if (this.props.projectTitle !== prevProps.projectTitle) {
                this.handleReceivedProjectTitle(this.props.projectTitle);
            }
            // si el proyecto es un nuevo proyecto predeterminado y ha cargado,
            if (this.props.isShowingWithoutId && prevProps.isAnyCreatingNewState) {
                // restablecer el título a predeterminado
                const defaultProjectTitle = this.handleReceivedProjectTitle();
                this.props.onUpdateProjectTitle(defaultProjectTitle);
            }
            // si el projectTitle no ha cambiado, pero el reduxProjectTitle
            // HA cambiado, necesitamos reportar ese cambio al dueño de projectTitle
            if (this.props.reduxProjectTitle !== prevProps.reduxProjectTitle &&
                this.props.reduxProjectTitle !== this.props.projectTitle) {
                this.props.onUpdateProjectTitle(this.props.reduxProjectTitle);
            }
        }
        handleReceivedProjectTitle (requestedTitle) {
            let newTitle = requestedTitle;
            if (newTitle === null || typeof newTitle === 'undefined') {
                newTitle = 'Proyecto BLOCKIDS';
            }
            this.props.onChangedProjectTitle(newTitle);
            return newTitle;
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                intl,
                isAnyCreatingNewState,
                isShowingWithoutId,
                onChangedProjectTitle,
                // para hijos, reemplazamos onUpdateProjectTitle con el nuestro
                onUpdateProjectTitle,
                // no pasamos la prop projectTitle a los hijos - deben usar
                // valor redux
                projectTitle,
                reduxProjectTitle,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    {...componentProps}
                />
            );
        }
    }

    TitledComponent.propTypes = {
        intl: intlShape,
        isAnyCreatingNewState: PropTypes.bool,
        isShowingWithoutId: PropTypes.bool,
        onChangedProjectTitle: PropTypes.func,
        onUpdateProjectTitle: PropTypes.func,
        projectTitle: PropTypes.string,
        reduxProjectTitle: PropTypes.string
    };

    TitledComponent.defaultProps = {
        onUpdateProjectTitle: () => {}
    };

    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            isAnyCreatingNewState: getIsAnyCreatingNewState(loadingState),
            isShowingWithoutId: getIsShowingWithoutId(loadingState),
            reduxProjectTitle: state.scratchGui.projectTitle
        };
    };

    const mapDispatchToProps = dispatch => ({
        onChangedProjectTitle: title => dispatch(setProjectTitle(title))
    });

    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(TitledComponent));
};

export {
    TitledHOC as default
};

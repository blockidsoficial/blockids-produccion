import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Box from '../box/box.jsx';
import ReactModal from 'react-modal';
import deleteIcon from './icon--delete.svg';
import undoIcon from './icon--undo.svg';
import arrowLeftIcon from './icon--arrow-left.svg';
import arrowRightIcon from './icon--arrow-right.svg';

import styles from './delete-confirmation-prompt.css';

// TODO: Parametrizar desde el exterior si queremos más mensajes personalizados
const messages = defineMessages({
    shouldDeleteSpriteMessage: {
        defaultMessage: '¿Seguro que quieres borrar este personaje?',
        description: 'Message to indicate whether selected sprite should be deleted.',
        id: 'gui.gui.shouldDeleteSprite'
    },
    shouldDeleteCostumeMessage: {
        defaultMessage: '¿Seguro que quieres borrar este disfraz?',
        description: 'Message to indicate whether selected costume should be deleted.',
        id: 'gui.gui.shouldDeleteCostume'
    },
    shouldDeleteSoundMessage: {
        defaultMessage: '¿Seguro que quieres borrar este sonido?',
        description: 'Message to indicate whether selected sound should be deleted.',
        id: 'gui.gui.shouldDeleteSound'
    },
    confirmOption: {
        defaultMessage: 'Sí, borrar',
        description: 'Yes - should delete the sprite',
        id: 'gui.gui.confirm'
    },
    cancelOption: {
        defaultMessage: 'Cancelar',
        description: 'No - cancel deletion',
        id: 'gui.gui.cancel'
    },
    confirmDeletionHeading: {
        defaultMessage: 'Confirmar eliminación',
        description: 'Heading of confirmation prompt to delete asset',
        id: 'gui.gui.deleteAssetHeading'
    }
});

const modalWidth = 300;
const safeMargin = 10;
const calculateModalPosition = (relativeElemRef, modalPosition) => {
    const refPosition = relativeElemRef.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (modalPosition === 'left') {
        const idealLeft = refPosition.left - modalWidth - 25;
        return {
            top: refPosition.top - refPosition.height,
            left: Math.max(safeMargin, idealLeft)
        };
    }

    if (modalPosition === 'right') {
        const idealLeft = refPosition.right + 25;
        return {
            top: refPosition.top - refPosition.height,
            left: Math.min(idealLeft, viewportWidth - modalWidth - safeMargin)
        };
    }

    return {};
};

const getMessage = entityType => {
    if (entityType === 'COSTUME') {
        return messages.shouldDeleteCostumeMessage;
    }

    if (entityType === 'SOUND') {
        return messages.shouldDeleteSoundMessage;
    }

    return messages.shouldDeleteSpriteMessage;
};

const DeleteConfirmationPrompt = ({
    intl,
    onCancel,
    onOk,
    modalPosition,
    entityType,
    relativeElemRef
}) => {
    const modalPositionValues = calculateModalPosition(relativeElemRef, modalPosition);

    return (<ReactModal
        isOpen
        // Tenemos que insertar los estilos en línea, ya que una parte
        // de ellos se generan dinámicamente
        style={{
            content: {
                ...modalPositionValues,
                width: modalWidth,
                border: 'none',
                height: 'fit-content',
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
                position: 'absolute',
                overflowX: 'hidden',
                zIndex: 1000
            },
            overlay: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 510,
                backgroundColor: 'transparent'
            }
        }}
        contentLabel={intl.formatMessage(messages.confirmDeletionHeading)}
        onRequestClose={onCancel}
    >
        <Box className={styles.modalContainer}>
            { modalPosition === 'right' ?
                <Box className={classNames(styles.arrowContainer, styles.arrowContainerLeft)}>
                    <img
                        className={styles.deleteIcon}
                        src={arrowLeftIcon}
                    />
                </Box> : null }
            <Box className={styles.body}>
                <Box className={styles.label}>
                    <FormattedMessage {...getMessage(entityType)} />
                </Box>
                <Box className={styles.buttonRow}>
                    <button
                        className={styles.okButton}
                        onClick={onOk}
                        role="button"
                    >
                        <img
                            className={styles.deleteIcon}
                            src={deleteIcon}
                        />
                        <div className={styles.message}>
                            <FormattedMessage {...messages.confirmOption} />
                        </div>
                    </button>
                    <button
                        className={styles.cancelButton}
                        onClick={onCancel}
                        role="button"
                    >
                        <img
                            className={styles.deleteIcon}
                            src={undoIcon}
                        />
                        <div className={styles.message}>
                            <FormattedMessage {...messages.cancelOption} />
                        </div>
                    </button>
                </Box>
            </Box>
            {modalPosition === 'left' ?
                <Box className={classNames(styles.arrowContainer, styles.arrowContainerRight)}>
                    <img
                        className={styles.deleteIcon}
                        src={arrowRightIcon}
                    />
                </Box> : null }
        </Box>
    </ReactModal>);
};

DeleteConfirmationPrompt.propTypes = {
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    relativeElemRef: PropTypes.object,
    entityType: PropTypes.string,
    modalPosition: PropTypes.string,
    intl: intlShape.isRequired
};

const DeleteConfirmationPromptIntl = injectIntl(DeleteConfirmationPrompt);

export default DeleteConfirmationPromptIntl;

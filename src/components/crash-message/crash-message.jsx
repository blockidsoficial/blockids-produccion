import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import {FormattedMessage} from 'react-intl';

import styles from './crash-message.css';
import reloadIcon from './reload.svg';

const CrashMessage = props => (
    <div className={styles.crashWrapper}>
        <Box className={styles.body}>
            <img
                className={styles.reloadIcon}
                src={reloadIcon}
            />
            <h2>{'¡Ups! Algo ha fallado.'}</h2>
            <p>{'Lo sentimos, pero BLOCKIDS tuvo un problema inesperado. Por favor recarga la página e inténtalo de nuevo.'}</p>
            {props.eventId && (
                <p>
                    <FormattedMessage
                        defaultMessage="Your error was logged with id {errorId}"
                        description="Message to inform the user that page has crashed."
                        id="gui.crashMessage.errorNumber"
                        values={{
                            errorId: props.eventId
                        }}
                    />
                </p>
            )}
            <button
                className={styles.reloadButton}
                onClick={props.onReload}
            >
                {'Volver a cargar'}
            </button>
        </Box>
    </div>
);

CrashMessage.propTypes = {
    eventId: PropTypes.string,
    onReload: PropTypes.func.isRequired
};

export default CrashMessage;

import PropTypes from 'prop-types';
import React from 'react';
import styles from './nineties-mode.css';
import {connect} from 'react-redux';
import {isTimeTravel1990} from '../../reducers/time-travel';

const NinetiesMode = props => {
    if (!props.show) return null;
    return <div className={styles.ninetiesMode} />;
};

NinetiesMode.propTypes = {
    show: PropTypes.bool
};

const mapStateToProps = state => ({
    // Este es el modo del botón, opuesto al estado actual real
    show: isTimeTravel1990(state)
});

export default connect(
    mapStateToProps
)(NinetiesMode);

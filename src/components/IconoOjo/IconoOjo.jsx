import React from 'react';
import PropTypes from 'prop-types';
import iconEyeOpen from '../../assets/iconos-ui/EyeOpen.svg';
import iconEyeOff from '../../assets/iconos-ui/EyeOff.svg';

// Icono del botón "mostrar/ocultar contraseña", usado en Login, Register,
// VistaUsuarios, VistaEstudiantes y VistaConfiguracion — antes cada archivo
// traía su propia copia de un <svg> inline; ahora todos apuntan aquí.
const IconoOjo = ({ visible, size }) => (
    <img
        src={visible ? iconEyeOff : iconEyeOpen}
        alt=""
        width={size}
        height={size}
    />
);

IconoOjo.propTypes = {
    visible: PropTypes.bool.isRequired, // true = la contraseña está en texto plano ahora mismo
    size: PropTypes.number,
};

IconoOjo.defaultProps = {
    size: 20,
};

export default IconoOjo;

import React from 'react';
import PropTypes from 'prop-types';
import {avatarDePerfil} from '../../lib/avatares';

// Avatar redondo con la ilustración de Xolotl del perfil (o la que le toca por
// defecto según su usuario). `avatarUrl` es perfiles.avatar_url.
const AvatarUsuario = ({avatarUrl, username, size = 40, title}) => {
    const avatar = avatarDePerfil(avatarUrl, username);
    return (
        <img
            src={avatar.src}
            alt=""
            title={title || avatar.nombre}
            width={size}
            height={size}
            style={{
                width: size,
                height: size,
                flexShrink: 0,
                borderRadius: '50%',
                objectFit: 'contain',
                background: '#eaf3ff',
                border: '2px solid #d3e4ff'
            }}
        />
    );
};

AvatarUsuario.propTypes = {
    avatarUrl: PropTypes.string,
    size: PropTypes.number,
    title: PropTypes.string,
    username: PropTypes.string
};

export default AvatarUsuario;

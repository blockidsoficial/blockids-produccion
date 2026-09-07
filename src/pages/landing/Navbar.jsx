import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './LandingPage.css';

import logoHorizontal from '../../assets/logos/logo-horizontal-colores.svg';

const Navbar = ({ urlDashboard }) => {
    const [menuAbierto, setMenuAbierto] = useState(false);

    const cerrarMenu = () => setMenuAbierto(false);

    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.navLogo} onClick={cerrarMenu}>
                <img src={logoHorizontal} alt="Blockids" className={styles.logoImg} />
            </Link>

            <button
                className={styles.hamburger}
                onClick={() => setMenuAbierto(!menuAbierto)}
                aria-label="Menú"
            >
                <span /><span /><span />
            </button>

            <ul className={`${styles.navLinks} ${menuAbierto ? styles.navOpen : ''}`}>
                <li><Link to="/" className={styles.navLink} onClick={cerrarMenu}>Inicio</Link></li>
                <li><Link to="/nosotros" className={styles.navLink} onClick={cerrarMenu}>Nosotros</Link></li>
                <li><Link to="/proyectos" className={styles.navLink} onClick={cerrarMenu}>Proyectos</Link></li>
                <li><a href={urlDashboard} className={styles.navLink} onClick={cerrarMenu}>Ingresar</a></li>
            </ul>
        </nav>
    );
};

Navbar.propTypes = {
    urlDashboard: PropTypes.string.isRequired,
};

export default Navbar;

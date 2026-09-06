import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './LandingPage.css';

import logoHorizontal from '../../assets/logos/logo-horizontal-colores.svg';

const Navbar = ({ urlDashboard }) => {
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.navLogo}>
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
                <li><a href="#inicio" className={styles.navLink}>Inicio</a></li>
                <li><a href="#demo" className={styles.navLink}>Blockids</a></li>
                <li><a href={urlDashboard} className={styles.navLink}>Ingresar</a></li>
            </ul>
        </nav>
    );
};

Navbar.propTypes = {
    urlDashboard: PropTypes.string.isRequired,
};

export default Navbar;

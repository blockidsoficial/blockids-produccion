import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './DashboardLayout.css';
import Header from '../components/Header/Header';
import { puedeNavegar } from '../lib/navGuard';

import logoHorizontal from '../assets/logos/logo-horizontal-colores.svg';
import xolotlImg     from '../assets/xolotl/xolotl-programando.svg';
import iconInicio    from '../assets/iconos-ui/ui-inicio.svg';
import iconAulas     from '../assets/iconos-ui/ui-curso.svg';
import iconConfig    from '../assets/iconos-ui/ui-configuracion.svg';

const DEFAULT_NAV = [
    { label: 'Inicio',        icon: iconInicio, to: '#' },
    { label: 'Mis Aulas',     icon: iconAulas,  to: '#' },
    { label: 'Configuración', icon: iconConfig,  to: '#' },
];

const DashboardLayout = ({
    children,
    title,
    subtitle,
    userName,
    role,
    onLogout,
    navItems = DEFAULT_NAV,
    activeNav,
}) => {
    const location = useLocation();
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <div className={styles.layout}>

            {/* ══════════════════ SIDEBAR ══════════════════ */}
            <aside className={styles.sidebar}>

                {/* Logo */}
                <div className={styles.sidebarTop}>
                    <img src={logoHorizontal} alt="Blockids" className={styles.sidebarLogo} />
                    <button
                        type="button"
                        className={styles.menuToggle}
                        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={menuAbierto}
                        onClick={() => setMenuAbierto(!menuAbierto)}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>

                {/* Navegación */}
                <nav className={`${styles.sidebarNav} ${menuAbierto ? styles.sidebarNavOpen : ''}`}>
                    <ul className={styles.navList}>
                        {navItems.map((item) => {
                            const isActive = activeNav
                                ? activeNav === item.label
                                : location.pathname === item.to;
                            return (
                                <li key={item.label}>
                                    <Link
                                        to={item.to}
                                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                        onClick={item.onClick
                                            ? (e) => {
                                                e.preventDefault();
                                                if (!puedeNavegar()) return;
                                                item.onClick();
                                                setMenuAbierto(false);
                                            }
                                            : undefined}
                                    >
                                        <img
                                            src={item.icon}
                                            alt=""
                                            className={styles.navIcon}
                                        />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                        <li>
                            <button
                                type="button"
                                className={`${styles.navItem} ${styles.logoutNavItem}`}
                                onClick={() => {
                                    if (!puedeNavegar()) return;
                                    onLogout();
                                    setMenuAbierto(false);
                                }}
                            >
                                <span className={styles.logoutNavIcon}>↪</span>
                                <span>Cerrar sesión</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Parte inferior: xolotl */}
                <div className={`${styles.sidebarBottom} ${menuAbierto ? styles.sidebarBottomOpen : ''}`}>
                    <img src={xolotlImg} alt="" className={styles.sidebarXolotl} />
                </div>
            </aside>

            {/* ══════════════════ ÁREA PRINCIPAL ══════════════════ */}
            <div className={styles.mainArea}>

                {/* Topbar gamificado (muestra XP/racha/nivel solo al alumno) */}
                <Header
                    title={title}
                    subtitle={subtitle}
                    userName={userName}
                    role={role}
                    onLogout={onLogout}
                    navItems={navItems}
                />

                {/* Área de contenido */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

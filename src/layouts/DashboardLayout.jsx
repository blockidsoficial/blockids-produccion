import React, { useState } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import styles from './DashboardLayout.css';

import logoHorizontal from '../assets/logos/logo-horizontal-colores.svg';
import xolotlImg     from '../assets/xolotl/xolotl-programando.svg';
import iconInicio    from '../assets/iconos-ui/ui-inicio.svg';
import iconAulas     from '../assets/iconos-ui/ui-curso.svg';
import iconConfig    from '../assets/iconos-ui/ui-configuracion.svg';
import iconNotif     from '../assets/iconos-ui/ui-notificaciones.svg';
import iconUsuario   from '../assets/iconos-ui/ui-usuario.svg';
import iconVideo     from '../assets/iconos-ui/ui-video.svg';

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
    const history = useHistory();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    const [cuentaAbierta, setCuentaAbierta] = useState(false);
    const configuracionItem = navItems.find((item) => item.label === 'Configuración');

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

                {/* Topbar */}
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <h1 className={styles.topbarTitle}>{title}</h1>
                        {subtitle && (
                            <p className={styles.topbarSubtitle}>{subtitle}</p>
                        )}
                    </div>
                    <div className={styles.topbarRight}>
                        <div className={styles.headerMenu}>
                            <button
                                type="button"
                                className={styles.notifBtn}
                                title="Notificaciones"
                                aria-label="Abrir notificaciones"
                                aria-expanded={notificacionesAbiertas}
                                onClick={() => {
                                    setNotificacionesAbiertas(!notificacionesAbiertas);
                                    setCuentaAbierta(false);
                                }}
                            >
                                <img src={iconNotif} alt="" className={styles.notifIcon} />
                            </button>
                            {notificacionesAbiertas && (
                                <div className={styles.headerPopover}>
                                    <h2 className={styles.popoverTitle}>Notificaciones</h2>
                                    <p className={styles.emptyPopover}>No tienes notificaciones nuevas.</p>
                                </div>
                            )}
                        </div>
                        <button 
                            className={styles.notifBtn} 
                            title="Entorno de Programación"
                            onClick={() => history.push('/entorno')}
                        >
                            <img src={iconVideo} alt="Entorno de Bloques" className={styles.notifIcon} />
                        </button>
                        <div className={styles.headerMenu}>
                            <button
                                type="button"
                                className={styles.userPill}
                                title="Abrir cuenta"
                                aria-label={`Abrir cuenta de ${userName}`}
                                aria-expanded={cuentaAbierta}
                                onClick={() => {
                                    setCuentaAbierta(!cuentaAbierta);
                                    setNotificacionesAbiertas(false);
                                }}
                            >
                            <img src={iconUsuario} alt="" className={styles.userAvatar} />
                            <div className={styles.userInfo}>
                                <span className={styles.userNameText}>{userName}</span>
                                <span className={styles.userRoleText}>{role}</span>
                            </div>
                            </button>
                            {cuentaAbierta && (
                                <div className={`${styles.headerPopover} ${styles.accountPopover}`}>
                                    <div className={styles.accountSummary}>
                                        <strong>{userName}</strong>
                                        <span>{role}</span>
                                    </div>
                                    {configuracionItem?.onClick && (
                                        <button
                                            type="button"
                                            className={styles.popoverAction}
                                            onClick={() => {
                                                configuracionItem.onClick();
                                                setCuentaAbierta(false);
                                            }}
                                        >
                                            Configuración
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={`${styles.popoverAction} ${styles.popoverLogout}`}
                                        onClick={() => {
                                            onLogout();
                                            setCuentaAbierta(false);
                                        }}
                                    >
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Área de contenido */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

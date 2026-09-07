import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { puedeNavegar } from '../../lib/navGuard';

import styles from './Header.css';
import iconNotif   from '../../assets/iconos-ui/ui-notificaciones.svg';
import iconVideo   from '../../assets/iconos-ui/ui-video.svg';
import iconUsuario from '../../assets/iconos-ui/ui-usuario.svg';
import iconEstrella from '../../assets/iconos/icono-estrella.svg';
import iconRacha    from '../../assets/iconos/icono-racha1.svg';

const XP_POR_NIVEL = 500;

// ── Utilidades de fechas (comparación por día calendario, no por horas) ───────
const inicioDelDia = (fecha) => {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Días completos entre dos fechas: diffDias(lunes, miércoles) === 2
const MS_POR_DIA = 1000 * 60 * 60 * 24;
const diffDias = (desde, hasta) =>
    Math.round((inicioDelDia(hasta) - inicioDelDia(desde)) / MS_POR_DIA);

// ── Racha real estilo Duolingo ───────────────────────────────────────────────
// `ultimo_login` en `perfiles` es un único timestamp: sirve para saber cuántos
// días lleva sin entrar, pero no para contar días consecutivos. Guardamos el
// contador de la racha en localStorage por usuario y lo reconciliamos con el
// último acceso registrado en el perfil:
//   • entró hoy otra vez           -> se mantiene la racha
//   • su último acceso fue ayer    -> +1 día de racha
//   • lleva 2+ días sin entrar     -> la racha se reinicia a 1
const claveRacha = (uid) => `bk_racha_${uid}`;

const calcularRacha = (uid, ultimoLoginISO) => {
    let guardado = { dias: 0, fecha: null };
    try {
        const raw = localStorage.getItem(claveRacha(uid));
        if (raw) guardado = JSON.parse(raw);
    } catch (_) { /* storage no disponible: se recalcula desde el perfil */ }

    const hoy = new Date();
    const referencia = guardado.fecha
        ? new Date(guardado.fecha)
        : (ultimoLoginISO ? new Date(ultimoLoginISO) : null);

    let dias;
    if (!referencia) {
        dias = 1;
    } else {
        const brecha = diffDias(referencia, hoy);
        if (brecha <= 0)       dias = Math.max(1, guardado.dias || 1); // mismo día
        else if (brecha === 1) dias = (guardado.dias || 1) + 1;        // día seguido
        else                   dias = 1;                               // se rompió
    }

    try {
        localStorage.setItem(claveRacha(uid), JSON.stringify({ dias, fecha: hoy.toISOString() }));
    } catch (_) { /* noop */ }

    return dias;
};

const formatearXP = (n) => (n || 0).toLocaleString('es-MX');

// El código de registro guarda 'alumno'/'profesor'/'admin_escuela'/'superadmin'
// en minúsculas; el layout muestra "Alumno"/"Profesor"/… con mayúscula.
const normalizarRol = (rol) => (rol || '').toString().trim().toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Header gamificado (estilo Duolingo) — reemplazo del topbar de DashboardLayout.
 *
 * Es consciente del rol: el ALUMNO ve XP + racha; el PROFESOR solo ve la
 * racha (motiva su constancia sin mezclar puntos de estudiante); admins ven
 * una cabecera limpia y formal, sin gamificación.
 *
 * Props:
 *   - title / subtitle   Texto de la izquierda (lo pasa el DashboardLayout).
 *   - userName           "@juan-perez" (lo pasa el layout).
 *   - role               "Alumno" | "Profesor" | "Admin Escuela" | …
 *   - onLogout           Handler de cierre de sesión del panel.
 *   - navItems           Items del sidebar (los mismos que recibe DashboardLayout).
 *                        Si alguno trae label "Configuración" con onClick, aparece
 *                        dentro del menú desplegable de la cuenta.
 *   - perfil             (opcional) { username, puntos_xp, nivel, ultimo_login, rol }
 *                        ya cargado: si se pasa, el Header NO consulta la BD.
 *   - showEntorno        Botón "Entorno de Programación" (default: true).
 */
const Header = ({
    title,
    subtitle,
    userName,
    role,
    onLogout,
    navItems = [],
    perfil: perfilProp,
    showEntorno = true,
}) => {
    const history = useHistory();

    const [perfil, setPerfil]       = useState(perfilProp || null);
    const [saliendo, setSaliendo]   = useState(false);
    const [notifAbiertas, setNotifAbiertas]   = useState(false);
    const [cuentaAbierta, setCuentaAbierta]   = useState(false);

    // ── Carga del perfil desde la sesión activa ──────────────────────────────
    useEffect(() => {
        if (perfilProp) { setPerfil(perfilProp); return undefined; }

        let vivo = true;
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !vivo) return;

            const { data, error } = await supabase
                .from('perfiles')
                .select('username, puntos_xp, nivel, ultimo_login, rol')
                .eq('id', session.user.id)
                .single();

            if (!vivo || error || !data) return;

            setPerfil(data);

            // Registrar el acceso de hoy DESPUÉS de leer el valor anterior
            // (ya lo usamos para calcular la racha en el render).
            supabase
                .from('perfiles')
                .update({ ultimo_login: new Date().toISOString() })
                .eq('id', session.user.id)
                .then(() => {}, () => {});
        })();

        return () => { vivo = false; };
    }, [perfilProp]);

    // ── Cierre de sesión ────────────────────────────────────────────────────
    const cerrarSesion = useCallback(async () => {
        if (!puedeNavegar()) return;
        if (onLogout) { onLogout(); return; }
        setSaliendo(true);
        await supabase.auth.signOut();
        history.push('/');
    }, [onLogout, history]);

    // ── Datos derivados ─────────────────────────────────────────────────────
    const nombreUsuario = userName || (perfil && perfil.username ? `@${perfil.username}` : '');
    const rolNormalizado = normalizarRol(perfil && perfil.rol ? perfil.rol : role);
    const esAlumno   = rolNormalizado === 'alumno';
    const esProfesor = rolNormalizado === 'profesor';
    const itemConfiguracion = navItems.find(item => item.label === 'Configuración');

    // Gamificación: el XP es exclusivo del alumno; la racha motiva por igual
    // a alumnos y profesores (admins ven la cabecera formal, sin insignias).
    let gamificacion = null;
    if (perfil && (esAlumno || esProfesor)) {
        const diasInactivo = perfil.ultimo_login
            ? diffDias(new Date(perfil.ultimo_login), new Date())
            : 0;
        const rachaActiva = diasInactivo <= 1; // entró hoy o ayer
        const racha = calcularRacha(perfil.username || 'anon', perfil.ultimo_login);

        const tituloRacha = rachaActiva
            ? `¡Llevas ${racha} ${racha === 1 ? 'día' : 'días'} seguidos! No la pierdas.`
            : `Hace ${diasInactivo} días que no entras. ¡Vuelve para recuperar tu racha!`;

        const xp = perfil.puntos_xp || 0;
        const nivel = perfil.nivel || 1;
        const xpEnNivel = xp % XP_POR_NIVEL;

        gamificacion = (
            <div className={styles.stats}>
                {/* XP — solo alumno */}
                {esAlumno && (
                    <div
                        className={`${styles.pill} ${styles.pillXp}`}
                        title={`${formatearXP(xp)} XP · ${xpEnNivel}/${XP_POR_NIVEL} para el nivel ${nivel + 1}`}
                    >
                        <img src={iconEstrella} alt="" className={styles.pillIconImg} />
                        <span className={styles.pillValue}>{formatearXP(xp)}</span>
                        <span className={styles.pillUnit}>XP</span>
                    </div>
                )}

                {/* Racha / inactividad — alumno y profesor */}
                <div
                    className={`${styles.pill} ${styles.pillStreak} ${rachaActiva ? '' : styles.pillStreakOff}`}
                    title={tituloRacha}
                >
                    <img src={iconRacha} alt="" className={styles.pillIconImg} />
                    <span className={styles.pillValue}>{rachaActiva ? racha : diasInactivo}</span>
                    <span className={styles.pillUnit}>
                        {rachaActiva ? (racha === 1 ? 'día' : 'días') : 'días fuera'}
                    </span>
                    {!rachaActiva && <span className={styles.streakAlert} aria-hidden="true" />}
                </div>
            </div>
        );
    }

    return (
        <header className={styles.header}>

            {/* ── Izquierda: título / subtítulo ── */}
            <div className={styles.left}>
                {title && <h1 className={styles.title}>{title}</h1>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            {/* ── Centro: insignias de juego (solo alumno) ── */}
            {gamificacion}

            {/* ── Derecha: acciones + perfil + salir ── */}
            <div className={styles.right}>

                {showEntorno && (
                    <button
                        type="button"
                        className={styles.iconBtn}
                        title="Entorno de Programación"
                        onClick={() => { if (puedeNavegar()) history.push('/entorno'); }}
                    >
                        <img src={iconVideo} alt="Entorno de Bloques" className={styles.iconImg} />
                    </button>
                )}

                <div className={styles.menu}>
                    <button
                        type="button"
                        className={styles.iconBtn}
                        title="Notificaciones"
                        aria-label="Abrir notificaciones"
                        aria-expanded={notifAbiertas}
                        onClick={() => {
                            setNotifAbiertas(v => !v);
                            setCuentaAbierta(false);
                        }}
                    >
                        <img src={iconNotif} alt="" className={styles.iconImg} />
                    </button>
                    {notifAbiertas && (
                        <div className={styles.popover}>
                            <h2 className={styles.popoverTitle}>Notificaciones</h2>
                            <p className={styles.popoverEmpty}>No tienes notificaciones nuevas.</p>
                        </div>
                    )}
                </div>

                {/* Cuenta: icono + nombre, se despliega en menú (Configuración / Cerrar sesión) */}
                <div className={styles.menu}>
                    <button
                        type="button"
                        className={styles.userPill}
                        title="Abrir cuenta"
                        aria-label={`Abrir cuenta de ${nombreUsuario}`}
                        aria-expanded={cuentaAbierta}
                        onClick={() => {
                            setCuentaAbierta(v => !v);
                            setNotifAbiertas(false);
                        }}
                    >
                        <img src={iconUsuario} alt="" className={styles.userAvatarImg} />
                        <span className={styles.userInfo}>
                            <span className={styles.userName}>{nombreUsuario}</span>
                            {role && <span className={styles.userRole}>{role}</span>}
                        </span>
                    </button>
                    {cuentaAbierta && (
                        <div className={`${styles.popover} ${styles.accountPopover}`}>
                            <div className={styles.accountSummary}>
                                <strong>{nombreUsuario}</strong>
                                {role && <span>{role}</span>}
                            </div>
                            {itemConfiguracion && itemConfiguracion.onClick && (
                                <button
                                    type="button"
                                    className={styles.popoverAction}
                                    onClick={() => {
                                        itemConfiguracion.onClick();
                                        setCuentaAbierta(false);
                                    }}
                                >
                                    Configuración
                                </button>
                            )}
                            <button
                                type="button"
                                className={`${styles.popoverAction} ${styles.popoverLogout}`}
                                onClick={cerrarSesion}
                                disabled={saliendo}
                            >
                                {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

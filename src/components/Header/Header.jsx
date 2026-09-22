import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { puedeNavegar } from '../../lib/navGuard';
import { EVENTO_AVATAR } from '../../lib/avatares';
import useNotificaciones from '../../lib/useNotificaciones';
import AvatarUsuario from '../AvatarUsuario/AvatarUsuario';

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

// La racha diaria la calcula el SERVIDOR (función SQL registrar_actividad_diaria,
// migración 20260921010000_racha_diaria.sql): compara con su propia fecha, suma o
// reinicia y da bono de XP. Aquí solo se muestra lo que devuelve.
// Una sola llamada por carga de página, aunque el Header se monte varias veces.
let registroDiarioPromesa = null;
const registrarActividadDiaria = () => {
    if (!registroDiarioPromesa) {
        registroDiarioPromesa = supabase.rpc('registrar_actividad_diaria')
            .then(({ data, error }) => {
                if (error) throw error;
                return data;
            })
            .catch((err) => {
                registroDiarioPromesa = null; // permitir reintento en el próximo montaje
                console.error('[BLOCKIDS] Error registrando actividad diaria:', err);
                return null;
            });
    }
    return registroDiarioPromesa;
};

const formatearXP = (n) => (n || 0).toLocaleString('es-MX');

// El código de registro guarda 'alumno'/'profesor'/'admin_escuela'/'superadmin'
// en minúsculas; el layout muestra "Alumno"/"Profesor"/… con mayúscula.
const normalizarRol = (rol) => (rol || '').toString().trim().toLowerCase();

// "hace 5 min", "hace 2 h", "hace 3 d" para la lista de notificaciones.
const haceCuanto = (fechaISO) => {
    const min = Math.max(0, Math.round((Date.now() - new Date(fechaISO).getTime()) / 60000));
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    if (min < 60 * 24) return `hace ${Math.round(min / 60)} h`;
    return `hace ${Math.round(min / (60 * 24))} d`;
};

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
    // { racha, ultimaActividad ('AAAA-MM-DD'), nuevoDia, bonoXP, nuevoXP } del servidor
    const [actividad, setActividad] = useState(null);

    // ── Carga del perfil desde la sesión activa ──────────────────────────────
    useEffect(() => {
        if (perfilProp) { setPerfil(perfilProp); return undefined; }

        let vivo = true;
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !vivo) return;

            const { data, error } = await supabase
                .from('perfiles')
                .select('username, puntos_xp, nivel, ultimo_login, rol, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (!vivo || error || !data) return;

            setPerfil(data);
        })();

        return () => { vivo = false; };
    }, [perfilProp]);

    // Cuando el alumno cambia su avatar en Configuración, se refleja al instante.
    useEffect(() => {
        const alCambiarAvatar = (e) => {
            setPerfil(p => (p ? { ...p, avatar_url: e.detail } : p));
        };
        window.addEventListener(EVENTO_AVATAR, alCambiarAvatar);
        return () => window.removeEventListener(EVENTO_AVATAR, alCambiarAvatar);
    }, []);

    // ── Racha diaria (servidor) ──────────────────────────────────────────────
    useEffect(() => {
        let vivo = true;
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !vivo) return;

            const resultado = await registrarActividadDiaria();
            if (!vivo || !resultado) return;

            setActividad(resultado);
            // Si hubo bono de XP, reflejarlo sin recargar el perfil completo.
            if (resultado.bonoXP > 0) {
                setPerfil(p => (p ? { ...p, puntos_xp: resultado.nuevoXP } : p));
            }
        })();

        return () => { vivo = false; };
    }, []);

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

    // ── Notificaciones ──────────────────────────────────────────────────────
    const { items: notificaciones, noLeidas, marcarLeida, marcarTodas } = useNotificaciones();

    const abrirNotificacion = (n) => {
        if (!n.leida) marcarLeida(n.id);
        setNotifAbiertas(false);
        if (!n.url || !puedeNavegar()) return;
        // Los dashboards leen ?vista= solo al montarse: si ya estamos en esa
        // ruta, se recarga para que abra la vista correcta.
        const [ruta] = n.url.split('?');
        if (history.location.pathname === ruta) {
            window.location.assign(n.url);
        } else {
            history.push(n.url);
        }
    };
    const rolNormalizado = normalizarRol(perfil && perfil.rol ? perfil.rol : role);
    const esAlumno   = rolNormalizado === 'alumno';
    const esProfesor = rolNormalizado === 'profesor';
    const itemConfiguracion = navItems.find(item => item.label === 'Configuración');

    // Gamificación: el XP es exclusivo del alumno; la racha motiva por igual
    // a alumnos y profesores (admins ven la cabecera formal, sin insignias).
    let gamificacion = null;
    if (perfil && (esAlumno || esProfesor)) {
        // Sin respuesta del servidor todavía (o sin conexión) no se dibuja la
        // racha: mejor nada que un número inventado.
        const diasInactivo = actividad && actividad.ultimaActividad
            ? diffDias(new Date(`${actividad.ultimaActividad}T00:00:00`), new Date())
            : 0;
        const rachaActiva = diasInactivo <= 1; // entró hoy o ayer
        const racha = actividad ? actividad.racha : 0;

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
                {actividad && (
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
                )}
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
                        aria-label={noLeidas > 0
                            ? `Abrir notificaciones, ${noLeidas} sin leer`
                            : 'Abrir notificaciones'}
                        aria-expanded={notifAbiertas}
                        onClick={() => {
                            setNotifAbiertas(v => !v);
                            setCuentaAbierta(false);
                        }}
                    >
                        <img src={iconNotif} alt="" className={styles.iconImg} />
                        {noLeidas > 0 && (
                            <span className={styles.notifBadge}>{noLeidas > 9 ? '9+' : noLeidas}</span>
                        )}
                    </button>
                    {notifAbiertas && (
                        <div className={`${styles.popover} ${styles.notifPopover}`}>
                            <div className={styles.notifCabecera}>
                                <h2 className={styles.popoverTitle}>Notificaciones</h2>
                                {noLeidas > 0 && (
                                    <button type="button" className={styles.notifMarcarTodas} onClick={marcarTodas}>
                                        Marcar todas como leídas
                                    </button>
                                )}
                            </div>
                            {notificaciones.length === 0 ? (
                                <p className={styles.popoverEmpty}>No tienes notificaciones nuevas.</p>
                            ) : (
                                <ul className={styles.notifLista}>
                                    {notificaciones.map(n => (
                                        <li key={n.id}>
                                            <button
                                                type="button"
                                                className={`${styles.notifItem} ${n.leida ? '' : styles.notifItemNueva}`}
                                                onClick={() => abrirNotificacion(n)}
                                            >
                                                <span className={styles.notifTitulo}>{n.titulo}</span>
                                                {n.mensaje && <span className={styles.notifMensaje}>{n.mensaje}</span>}
                                                <span className={styles.notifHora}>{haceCuanto(n.created_at)}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
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
                        {normalizarRol(perfil?.rol) === 'alumno' ? (
                            <AvatarUsuario
                                avatarUrl={perfil.avatar_url}
                                username={perfil.username}
                                size={34}
                            />
                        ) : (
                            <img src={iconUsuario} alt="" className={styles.userAvatarImg} />
                        )}
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

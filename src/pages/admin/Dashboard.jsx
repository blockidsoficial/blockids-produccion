import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import VistaProfesores from './views/VistaProfesores';
import VistaAulas      from './views/VistaAulas';
import VistaEscuelas   from './views/VistaEscuelas';
import VistaInicio         from './views/VistaInicio';
import VistaUsuarios       from './views/VistaUsuarios';
import VistaConfiguracion  from '../shared/VistaConfiguracion';
import VistaProyectos      from '../shared/VistaProyectos';
import VistaReportes       from './views/VistaReportes';

import iconInicio     from '../../assets/iconos-ui/ui-inicio.svg';
import iconProyectos  from '../../assets/iconos-ui/ui-video.svg';
import iconEscuela    from '../../assets/iconos-ui/ui-curso.svg';
import iconUsuario  from '../../assets/iconos-ui/ui-usuario.svg';
import iconCurso    from '../../assets/iconos-ui/ui-calendario.svg';
import iconPadres   from '../../assets/iconos-ui/ui-padres.svg';
import iconConfig   from '../../assets/iconos-ui/ui-configuracion.svg';
import iconDescargar from '../../assets/iconos-ui/ui-descargar.svg';
import iconNotif    from '../../assets/iconos-ui/ui-notificaciones.svg';

import styles from './Dashboard.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generarCodigoAula = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let sufijo = '';
    for (let i = 0; i < 4; i++) sufijo += chars[Math.floor(Math.random() * chars.length)];
    return `BLK-${sufijo}`;
};

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const tiempoRelativo = (iso) => {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1)   return 'Ahora mismo';
    if (min < 60)  return `Hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)    return `Hace ${h} hora${h > 1 ? 's' : ''}`;
    const d = Math.floor(h / 24);
    return `Hace ${d} día${d > 1 ? 's' : ''}`;
};

const ROL_CONFIG = {
    superadmin:    { label: 'Superadmin',    color: '#f59e0b', bg: '#fef3c7' },
    admin_escuela: { label: 'Admin Escuela', color: '#8b5cf6', bg: '#ede9fe' },
    profesor:      { label: 'Profesor',      color: '#3b82f6', bg: '#dbeafe' },
    alumno:        { label: 'Alumno',        color: '#10b981', bg: '#d1fae5' },
};

// ─────────────────────────────────────────────────────────────────────────────

const DashboardAdmin = () => {

    // ── Perfil del usuario actual ─────────────────────────────────────────────
    const [perfil, setPerfil]              = useState(null);
    const [perfilCargado, setPerfilCargado] = useState(false);

    // ── Vista activa del panel ────────────────────────────────────────────────
    const location = useLocation();
    const VISTAS_VALIDAS_ADMIN = {
        'inicio':         'Dashboard',
        'escuelas':       'Escuelas',
        'usuarios':       'Usuarios',
        'aulas':          'Aulas',
        'profesores':     'Profesores',
        'proyectos':      'Proyectos',
        'reportes':       'Reportes',
        'configuracion':  'Configuración',
    };
    const _vistaParamAdmin = new URLSearchParams(location.search).get('vista');
    const [vistaActiva, setVistaActiva] = useState(
        () => (_vistaParamAdmin && VISTAS_VALIDAS_ADMIN[_vistaParamAdmin])
            ? VISTAS_VALIDAS_ADMIN[_vistaParamAdmin]
            : (sessionStorage.getItem('bk_admin_vista') || 'Dashboard')
    );

    // ── Reactivity key para sub-vistas (se incrementa tras crear usuario/aula) ─
    const [refreshVistas, setRefreshVistas] = useState(0);

    // ── Datos ─────────────────────────────────────────────────────────────────
    const [escuelas, setEscuelas]          = useState([]);
    const [stats, setStats]                = useState({ totalEscuelas: 0, activas: 0, totalUsuarios: 0, totalAulas: 0, totalProyectos: 0 });
    const [cargando, setCargando]          = useState(true);

    // ── Stats de escuela (admin_escuela) ──────────────────────────────────────
    const [statsEscuela, setStatsEscuela]  = useState({ profesores: 0, alumnos: 0, aulas: 0, totalProyectos: 0 });
    const [cargandoStats, setCargandoStats] = useState(false);

    // ── Actividad reciente real (superadmin) ──────────────────────────────────
    const [actividadReal, setActividadReal]         = useState([]);
    const [cargandoActividad, setCargandoActividad] = useState(false);

    // ── Alertas ───────────────────────────────────────────────────────────────
    const [alerta, setAlerta]              = useState(null);

    // ── Modal crear aula ──────────────────────────────────────────────────────
    const [modalAulaAbierto, setModalAulaAbierto] = useState(false);
    const [fAulaNombre, setFAulaNombre]           = useState('');
    const [fAulaProfesorId, setFAulaProfesorId]   = useState('');
    const [fAulaEscuelaId, setFAulaEscuelaId]     = useState('');
    const [profesoresAula, setProfesoresAula]     = useState([]);
    const [enviandoAula, setEnviandoAula]         = useState(false);

    // ── Valores derivados de rol (declarados antes de los useEffects) ─────────
    const esSuperAdmin = perfil?.rol === 'superadmin';
    const miEscuela    = escuelas.find(e => e.id === perfil?.escuela_id);
    const escuelasActivas = escuelas.filter(e => e.activa);

    // ── Detectar perfil + rol del usuario actual ──────────────────────────────
    useEffect(() => {
        const detectarPerfil = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setPerfilCargado(true); return; }
            const { data } = await supabase
                .from('perfiles')
                .select('id, username, rol, escuela_id, nombre, apellido_paterno, apellido_materno')
                .eq('id', session.user.id)
                .single();
            if (data) setPerfil(data);
            setPerfilCargado(true);
        };
        detectarPerfil();
    }, []);

    // ── Cargar escuelas + stats ───────────────────────────────────────────────
    const cargarDatos = useCallback(async () => {
        setCargando(true);
        const [resEscuelas, resPerfiles, resAulas, resProyectos] = await Promise.all([
            supabase.from('escuelas').select('id, nombre, clave_acceso, pin_docente, activa, created_at').order('created_at', { ascending: false }),
            supabase.from('perfiles').select('id, escuela_id', { count: 'exact' }).eq('activo', true),
            supabase.from('aulas').select('id', { count: 'exact' }),
            supabase.from('proyectos').select('*', { count: 'exact', head: true }),
        ]);

        if (resEscuelas.error) {
            mostrarAlerta('error', `Error al cargar datos: ${resEscuelas.error.message}`);
            setCargando(false);
            return;
        }

        const listaEscuelas = resEscuelas.data || [];
        const listaPerfiles = resPerfiles.data || [];

        const conteoUsuarios = listaPerfiles.reduce((acc, p) => {
            acc[p.escuela_id] = (acc[p.escuela_id] || 0) + 1;
            return acc;
        }, {});

        setEscuelas(listaEscuelas.map(e => ({ ...e, totalUsuarios: conteoUsuarios[e.id] || 0 })));
        setStats({
            totalEscuelas:  listaEscuelas.length,
            activas:         listaEscuelas.filter(e => e.activa).length,
            totalUsuarios:   resPerfiles.count || listaPerfiles.length,
            totalAulas:      resAulas.count    || 0,
            totalProyectos:  resProyectos.count || 0,
        });
        setCargando(false);
    }, []);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);
    useEffect(() => { sessionStorage.setItem('bk_admin_vista', vistaActiva); }, [vistaActiva]);

    // ── Stats reales para admin_escuela ───────────────────────────────────────
    const cargarStatsEscuela = useCallback(async () => {
        if (!perfil || perfil.rol !== 'admin_escuela' || !perfil.escuela_id) return;
        const eid = perfil.escuela_id;
        setCargandoStats(true);
        const [resProfesores, resAlumnos, resAulas] = await Promise.all([
            supabase.from('perfiles').select('*', { count: 'exact', head: true })
                .eq('rol', 'profesor').eq('escuela_id', eid).eq('activo', true),
            supabase.from('perfiles').select('id')
                .eq('rol', 'alumno').eq('escuela_id', eid).eq('activo', true),
            supabase.from('aulas').select('*', { count: 'exact', head: true })
                .eq('escuela_id', eid),
        ]);

        const alumnoIds = (resAlumnos.data || []).map(a => a.id);
        const { count: totalProyectos } = alumnoIds.length > 0
            ? await supabase.from('proyectos').select('*', { count: 'exact', head: true }).in('alumno_id', alumnoIds)
            : { count: 0 };

        setStatsEscuela({
            profesores:     resProfesores.count           ?? 0,
            alumnos:        (resAlumnos.data || []).length ?? 0,
            aulas:          resAulas.count                ?? 0,
            totalProyectos: totalProyectos                ?? 0,
        });
        setCargandoStats(false);
    }, [perfil]);

    useEffect(() => { cargarStatsEscuela(); }, [cargarStatsEscuela]);

    // ── Actividad reciente real ───────────────────────────────────────────────
    const cargarActividad = useCallback(async () => {
        setCargandoActividad(true);

        if (esSuperAdmin || !perfil?.escuela_id) {
            // Superadmin: últimas escuelas + perfiles globales
            const [resEscuelas, resPerfiles] = await Promise.all([
                supabase.from('escuelas').select('nombre, created_at').order('created_at', { ascending: false }).limit(5),
                supabase.from('perfiles').select('username, rol, created_at').order('created_at', { ascending: false }).limit(5),
            ]);
            const eventos = [
                ...(resEscuelas.data || []).map(e => ({
                    label: 'Nueva escuela registrada',
                    desc:  e.nombre,
                    tiempo: tiempoRelativo(e.created_at),
                    _ts:   new Date(e.created_at).getTime(),
                })),
                ...(resPerfiles.data || []).map(p => ({
                    label: 'Nuevo usuario creado',
                    desc:  `@${p.username} — ${ROL_CONFIG[p.rol]?.label || p.rol}`,
                    tiempo: tiempoRelativo(p.created_at),
                    _ts:   new Date(p.created_at).getTime(),
                })),
            ];
            eventos.sort((a, b) => b._ts - a._ts);
            setActividadReal(eventos.slice(0, 5));
        } else {
            // Admin escuela: últimos perfiles y aulas de su escuela
            const eid = perfil.escuela_id;
            const [resPerfiles, resAulas] = await Promise.all([
                supabase.from('perfiles')
                    .select('username, nombre, apellido, rol, created_at')
                    .eq('escuela_id', eid)
                    .in('rol', ['profesor', 'alumno'])
                    .eq('activo', true)
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase.from('aulas')
                    .select('nombre, created_at')
                    .eq('escuela_id', eid)
                    .order('created_at', { ascending: false })
                    .limit(5),
            ]);
            const etiquetaRol = { profesor: 'Nuevo profesor registrado', alumno: 'Nuevo alumno registrado' };
            const eventos = [
                ...(resPerfiles.data || []).map(p => {
                    const nombre = p.nombre
                        ? `${p.nombre}${p.apellido ? ' ' + p.apellido : ''}`
                        : `@${p.username}`;
                    return {
                        label:  etiquetaRol[p.rol] || 'Nuevo usuario registrado',
                        desc:   nombre,
                        tiempo: tiempoRelativo(p.created_at),
                        _ts:    new Date(p.created_at).getTime(),
                    };
                }),
                ...(resAulas.data || []).map(a => ({
                    label:  'Nueva aula creada',
                    desc:   a.nombre,
                    tiempo: tiempoRelativo(a.created_at),
                    _ts:    new Date(a.created_at).getTime(),
                })),
            ];
            eventos.sort((a, b) => b._ts - a._ts);
            setActividadReal(eventos.slice(0, 5));
        }

        setCargandoActividad(false);
    }, [perfil, esSuperAdmin]);

    useEffect(() => { cargarActividad(); }, [cargarActividad]);

    // ── Alerta temporal ───────────────────────────────────────────────────────
    const mostrarAlerta = (tipo, mensaje) => {
        setAlerta({ tipo, mensaje });
        setTimeout(() => setAlerta(null), 4000);
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const actualizarPerfilHeader = (cambios) => {
        setPerfil(prev => prev ? { ...prev, ...cambios } : prev);
    };



    // ── Modal Aula: cargar profesores por escuela ─────────────────────────────
    const cargarProfesoresAula = async (escuelaId) => {
        if (!escuelaId) { setProfesoresAula([]); return; }
        const { data } = await supabase
            .from('perfiles')
            .select('id, username, nombre, apellido')
            .eq('rol', 'profesor')
            .eq('escuela_id', escuelaId)
            .order('username');
        setProfesoresAula(data || []);
    };

    const abrirModalAula = async () => {
        setFAulaNombre('');
        setFAulaProfesorId('');
        const escuelaId = esSuperAdmin ? '' : (perfil?.escuela_id || '');
        setFAulaEscuelaId(escuelaId);
        setProfesoresAula([]);
        setModalAulaAbierto(true);
        if (escuelaId) cargarProfesoresAula(escuelaId);
    };

    const cerrarModalAula = () => {
        setModalAulaAbierto(false);
        setFAulaNombre('');
        setFAulaProfesorId('');
        setFAulaEscuelaId('');
        setProfesoresAula([]);
    };

    const handleCrearAula = async () => {
        if (!fAulaNombre.trim()) return mostrarAlerta('error', 'Escribe el nombre del aula.');
        if (!fAulaProfesorId)    return mostrarAlerta('error', 'Selecciona un profesor.');
        const escuelaId = esSuperAdmin ? fAulaEscuelaId : perfil?.escuela_id;
        if (!escuelaId)          return mostrarAlerta('error', 'Selecciona una escuela.');

        const codigoAula = generarCodigoAula();
        setEnviandoAula(true);
        const { error } = await supabase.from('aulas').insert([{
            nombre:      fAulaNombre.trim(),
            codigo_aula: codigoAula,
            escuela_id:  escuelaId,
            profesor_id: fAulaProfesorId,
        }]);
        setEnviandoAula(false);

        if (error) {
            mostrarAlerta('error', `Error al crear el aula: ${error.message}`);
        } else {
            mostrarAlerta('success', `Aula "${fAulaNombre.trim()}" creada con código ${codigoAula}.`);
            cerrarModalAula();
            cargarStatsEscuela();
            setRefreshVistas(v => v + 1);
        }
    };

    // ── Abrir Modal Crear Usuario (callback para VistaInicio) ─────────────────
    const abrirModalCrear = () => setVistaActiva('Usuarios');

    const ir = (vista) => () => setVistaActiva(vista);

    const NAV_SA = [
        { label: 'Inicio',        icon: iconInicio,  to: '#', onClick: ir('Dashboard')        },
        { label: 'Escuelas',         icon: iconEscuela,  to: '#', onClick: ir('Escuelas')         },
        { label: 'Usuarios',         icon: iconUsuario,   to: '#', onClick: ir('Usuarios') }, 
        { label: 'Aulas',            icon: iconCurso,   to: '#', onClick: ir('Aulas')            },
        { label: 'Profesores',       icon: iconPadres,  to: '#', onClick: ir('Profesores')       },
        { label: 'Mis Proyectos',    icon: iconProyectos, to: '#', onClick: ir('Proyectos')       },
        { label: 'Reportes',         icon: iconDescargar,  to: '#', onClick: ir('Reportes')         },
        { label: 'Configuración',    icon: iconConfig,  to: '#', onClick: ir('Configuración')    },
    ];

    const NAV_AE = [
        { label: 'Inicio',     icon: iconInicio,  to: '#', onClick: ir('Dashboard')     },
        { label: 'Profesores',    icon: iconPadres,  to: '#', onClick: ir('Profesores')    },
        { label: 'Aulas',         icon: iconCurso,   to: '#', onClick: ir('Aulas')         },
        { label: 'Usuarios',      icon: iconUsuario, to: '#', onClick: ir('Usuarios')      },
        { label: 'Mis Proyectos', icon: iconProyectos, to: '#', onClick: ir('Proyectos')    },
        { label: 'Reportes',      icon: iconDescargar,  to: '#', onClick: ir('Reportes')      },
        { label: 'Configuración', icon: iconConfig,  to: '#', onClick: ir('Configuración') },
    ];

    const navItems = esSuperAdmin ? NAV_SA : NAV_AE;

    const nombreCompletoAdmin = perfil
        ? [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno].filter(Boolean).join(' ') || perfil.username
        : '';

    // ─────────────────────────────────────────────────────────────────────────
    if (!perfilCargado) return null;

    return (
        <DashboardLayout
            title={nombreCompletoAdmin ? `¡Hola, ${nombreCompletoAdmin}!` : (esSuperAdmin ? '¡Bienvenido, Super Admin!' : '¡Hola, Admin!')}
            subtitle={esSuperAdmin ? 'Tienes control total de la plataforma.' : 'Gestiona tu escuela de forma fácil.'}
            userName={perfil?.username ? `@${perfil.username}` : (esSuperAdmin ? 'superadmin' : 'admin')}
            role={esSuperAdmin ? 'Superadmin' : 'Admin Escuela'}
            navItems={navItems}
            activeNav={vistaActiva}
            onLogout={handleLogout}
        >


            {/* ── Modal Crear Aula ── */}
            {modalAulaAbierto && (
                <div className={styles.modalOverlay} onClick={cerrarModalAula}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>

                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <div className={styles.modalIcon}>
                                    <img src={iconCurso} alt="" className={styles.modalIconImg} />
                                </div>
                                <div>
                                    <h3 className={styles.modalTitle}>Nueva Aula</h3>
                                    <p className={styles.modalSubtitle}>Crea un aula y asígnale un profesor</p>
                                </div>
                            </div>
                            <button className={styles.modalClose} onClick={cerrarModalAula}>✕</button>
                        </div>

                        <div className={styles.modalBody}>

                            {esSuperAdmin && (
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Escuela</label>
                                    <select
                                        className={styles.fieldSelect}
                                        value={fAulaEscuelaId}
                                        onChange={e => {
                                            setFAulaEscuelaId(e.target.value);
                                            setFAulaProfesorId('');
                                            cargarProfesoresAula(e.target.value);
                                        }}
                                    >
                                        <option value="">— Selecciona una escuela —</option>
                                        {escuelasActivas.map(e => (
                                            <option key={e.id} value={e.id}>{e.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Nombre del Aula</label>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Ej. 6to A"
                                    value={fAulaNombre}
                                    onChange={e => setFAulaNombre(e.target.value)}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Profesor</label>
                                <select
                                    className={styles.fieldSelect}
                                    value={fAulaProfesorId}
                                    onChange={e => setFAulaProfesorId(e.target.value)}
                                    disabled={esSuperAdmin && !fAulaEscuelaId}
                                >
                                    <option value="">— Selecciona un profesor —</option>
                                    {profesoresAula.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre && p.apellido
                                                ? `${p.nombre} ${p.apellido}`
                                                : `@${p.username}`}
                                        </option>
                                    ))}
                                </select>
                                {esSuperAdmin && !fAulaEscuelaId && (
                                    <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '4px' }}>
                                        Selecciona una escuela primero.
                                    </p>
                                )}
                                {(fAulaEscuelaId || !esSuperAdmin) && profesoresAula.length === 0 && (
                                    <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>
                                        No hay profesores registrados en esta escuela.
                                    </p>
                                )}
                            </div>

                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancelar} onClick={cerrarModalAula} disabled={enviandoAula}>
                                Cancelar
                            </button>
                            <button
                                className={styles.btnSubmit}
                                onClick={handleCrearAula}
                                disabled={enviandoAula}
                            >
                                {enviandoAula ? (
                                    <><span className={styles.btnSpinner} />Guardando...</>
                                ) : (
                                    'Crear Aula'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Alerta global ── */}
            {alerta && (
                <div className={`${styles.alert} ${
                    alerta.tipo === 'success' ? styles.alertSuccess
                    : alerta.tipo === 'info'  ? styles.alertInfo
                    : styles.alertError
                }`}>
                    {alerta.mensaje}
                </div>
            )}

            {/* ════════════════════════════════════════════════════
                ROUTER DE VISTAS
                ════════════════════════════════════════════════════ */}

            {vistaActiva === 'Dashboard' && (
                <VistaInicio
                    esSuperAdmin={esSuperAdmin}
                    cargando={cargando}
                    cargandoStats={cargandoStats}
                    cargandoActividad={cargandoActividad}
                    stats={stats}
                    statsEscuela={statsEscuela}
                    actividadReal={actividadReal}
                    miEscuela={miEscuela}
                    cambiarVista={setVistaActiva}
                    abrirModalCrear={abrirModalCrear}
                    abrirModalAula={abrirModalAula}
                    mostrarAlerta={mostrarAlerta}
                />
            )}

            {vistaActiva === 'Usuarios' && (
                <VistaUsuarios
                    perfil={perfil}
                    esSuperAdmin={esSuperAdmin}
                    escuelasActivas={escuelasActivas}
                    miEscuela={miEscuela}
                    mostrarAlerta={mostrarAlerta}
                    onRefreshDatos={cargarDatos}
                />
            )}

            {vistaActiva === 'Escuelas' && (
                <VistaEscuelas mostrarAlerta={mostrarAlerta} onRefresh={cargarDatos} />
            )}

            {vistaActiva === 'Profesores' && (
                <VistaProfesores
                    perfil={perfil}
                    esSuperAdmin={esSuperAdmin}
                    refreshKey={refreshVistas}
                    mostrarAlerta={mostrarAlerta}
                />
            )}

            {vistaActiva === 'Aulas' && (
                <VistaAulas
                    perfil={perfil}
                    esSuperAdmin={esSuperAdmin}
                    onNuevaAula={abrirModalAula}
                    refreshKey={refreshVistas}
                    mostrarAlerta={mostrarAlerta}
                />
            )}

            {vistaActiva === 'Proyectos' && (
                <VistaProyectos userId={perfil?.id} />
            )}

            {vistaActiva === 'Reportes' && (
                <VistaReportes esSuperAdmin={esSuperAdmin} perfil={perfil} />
            )}

            {vistaActiva === 'Configuración' && (
                <VistaConfiguracion
                    userId={perfil?.id}
                    mostrarAlerta={mostrarAlerta}
                    onPerfilActualizado={actualizarPerfilHeader}
                />
            )}

            {!['Dashboard', 'Escuelas', 'Profesores', 'Aulas', 'Usuarios', 'Proyectos', 'Reportes', 'Configuración'].includes(vistaActiva) && (
                <div className={styles.proximamente}>
                    <p className={styles.proximamenteLabel}>Sección en desarrollo</p>
                    <p className={styles.proximamenteDesc}>Esta vista estará disponible próximamente.</p>
                </div>
            )}

        </DashboardLayout>
    );
};

export default DashboardAdmin;

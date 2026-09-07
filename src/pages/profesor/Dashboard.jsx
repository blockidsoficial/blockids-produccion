import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import VistaMisAulas from './views/VistaMisAulas';
import VistaTareas   from './views/VistaTareas';
import VistaMuro           from './views/VistaMuro';
import VistaEstudiantes    from './views/VistaEstudiantes';
import VistaCalificaciones from './views/VistaCalificaciones';
import VistaReportes       from './views/VistaReportes';
import VistaConfiguracion  from '../shared/VistaConfiguracion';
import VistaProyectos      from '../shared/VistaProyectos';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { fraseDelDia, fraseAnimoProfesor } from '../../lib/frase-del-dia';
import xolotlMotivacional from '../../assets/xolotl/xolotl-excelente.svg';
import iconCurso      from '../../assets/iconos-ui/ui-curso.svg';
import iconUsuario    from '../../assets/iconos-ui/ui-usuario.svg';
import iconCalendario from '../../assets/iconos-ui/ui-calendario.svg';
import iconNotif      from '../../assets/iconos-ui/ui-notificaciones.svg';
import iconMuro       from '../../assets/iconos-ui/ui-contacto.svg';
import iconInicio     from '../../assets/iconos-ui/ui-inicio.svg';
import iconCalif      from '../../assets/iconos-ui/ui-favorito.svg';
import iconReportes   from '../../assets/iconos-ui/ui-descargar.svg';
import iconConfig     from '../../assets/iconos-ui/ui-configuracion.svg';
import iconProyectos  from '../../assets/iconos-ui/ui-video.svg';
import styles from './Dashboard.css';

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Frase del saludo de Inicio (ver lib/frase-del-dia): cambia una vez por día
// calendario. En el resto de vistas el subtítulo sigue mostrando la escuela,
// que ahí sí es información útil de contexto.

// Mapea vistaActual → label que resalta en el sidebar
const VISTA_A_NAV = {
    'inicio':         'Inicio',
    'mis-aulas':      'Mis Aulas',
    'tareas':         'Tareas',
    'muro':           'Muro',
    'estudiantes':    'Estudiantes',
    'calificaciones': 'Calificaciones',
    'reportes':       'Reportes',
    'configuracion':  'Configuración',
    'proyectos':      'Mis Proyectos',
};

// ─────────────────────────────────────────────────────────────────────────────

const DashboardProfesor = () => {
    useDocumentTitle('Panel del Profesor');

    const history  = useHistory();
    const location = useLocation();

    // ── Perfil ────────────────────────────────────────────────────────────────
    const [loading, setLoading]             = useState(true);
    const [username, setUsername]           = useState('');
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [nombreEscuela, setNombreEscuela] = useState('');
    const [userId, setUserId]               = useState(null);
    const [escuelaId, setEscuelaId]         = useState(null);

    // ── Vista activa ──────────────────────────────────────────────────────────
    const VISTAS_VALIDAS_PROFESOR = new Set(['inicio', 'mis-aulas', 'tareas', 'muro', 'estudiantes', 'calificaciones', 'reportes', 'proyectos', 'configuracion']);
    const _vistaParamProfesor = new URLSearchParams(location.search).get('vista');
    const vistaInicial = (_vistaParamProfesor && VISTAS_VALIDAS_PROFESOR.has(_vistaParamProfesor))
        ? _vistaParamProfesor
        : (sessionStorage.getItem('bk_profesor_vista') || 'inicio');
    const [vistaActual, setVistaActual]     = useState(vistaInicial);

    // Frase del saludo de Inicio: cambia una vez por día calendario (no en
    // cada carga de página ni al navegar entre vistas). Ver lib/frase-del-dia.
    const [fraseInicio] = useState(fraseDelDia);

    // ── Métricas (solo usadas en vista Inicio) ────────────────────────────────
    const [metricas, setMetricas]           = useState({ aulas: 0, estudiantes: 0, tareasActivas: 0, entregas: 0 });
    const [actividad, setActividad]         = useState([]);

    // ── Carga inicial ─────────────────────────────────────────────────────────
    useEffect(() => {
        const cargarPerfil = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { history.push('/login'); return; }

            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('username, escuela_id, nombre, apellido_paterno, apellido_materno')
                .eq('id', session.user.id)
                .single();

            if (perfilError || !perfil) { history.push('/login'); return; }

            setUsername(perfil.username);
            const armado = [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno]
                .filter(Boolean).join(' ');
            setNombreCompleto(armado || perfil.username);
            setUserId(session.user.id);
            setEscuelaId(perfil.escuela_id);

            if (perfil.escuela_id) {
                const { data: escuela } = await supabase
                    .from('escuelas')
                    .select('nombre')
                    .eq('id', perfil.escuela_id)
                    .single();
                if (escuela) setNombreEscuela(escuela.nombre);
            }

            await cargarInicio(session.user.id);
            setLoading(false);
        };

        cargarPerfil();
    }, [history]);

    useEffect(() => { sessionStorage.setItem('bk_profesor_vista', vistaActual); }, [vistaActual]);

    // Refresca métricas + actividad cada vez que el usuario vuelve a Inicio
    useEffect(() => {
        if (vistaActual === 'inicio' && userId) {
            cargarInicio(userId);
        }
    }, [vistaActual]);

    // ── Datos de la vista Inicio ──────────────────────────────────────────────
    const cargarInicio = async (uid) => {
        // Q1 — aulas del profesor
        const { data: aulasRaw } = await supabase
            .from('aulas')
            .select('id')
            .eq('profesor_id', uid);

        const aulaIds = (aulasRaw || []).map(a => a.id);

        if (aulaIds.length === 0) {
            setMetricas({ aulas: 0, estudiantes: 0, tareasActivas: 0, entregas: 0 });
            setActividad([]);
            return;
        }

        // Q2 — alumnos únicos
        const { data: alumnosData } = await supabase
            .from('aula_alumnos')
            .select('alumno_id')
            .in('aula_id', aulaIds);

        const alumnosUnicos = new Set((alumnosData || []).map(r => r.alumno_id)).size;

        // Q3 — tareas
        const { data: tareasData } = await supabase
            .from('tareas')
            .select('id')
            .in('aula_id', aulaIds);

        const tareaIds = (tareasData || []).map(t => t.id);

        if (tareaIds.length === 0) {
            setMetricas({ aulas: aulaIds.length, estudiantes: alumnosUnicos, tareasActivas: 0, entregas: 0 });
            setActividad([]);
            return;
        }

        // Q4 — total entregas
        const { count: totalEntregas } = await supabase
            .from('entregas_proyectos')
            .select('id', { count: 'exact', head: true })
            .in('tarea_id', tareaIds);

        setMetricas({
            aulas:         aulaIds.length,
            estudiantes:   alumnosUnicos,
            tareasActivas: tareaIds.length,
            entregas:      totalEntregas || 0,
        });

        // Q5 — actividad reciente con joins
        const { data: actividadData } = await supabase
            .from('entregas_proyectos')
            .select(`
                id,
                updated_at,
                perfiles!entregas_proyectos_estudiante_id_fkey ( nombre, apellido, username ),
                tareas!entregas_proyectos_tarea_id_fkey ( titulo, aulas ( nombre ) )
            `)
            .in('tarea_id', tareaIds)
            .order('updated_at', { ascending: false })
            .limit(6);

        setActividad(actividadData || []);
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        await supabase.auth.signOut();
        history.push('/');
    };

    const irA = (vista) => setVistaActual(vista);

    const actualizarPerfilHeader = ({ nombre, apellido_paterno, apellido_materno, username: usernameActual }) => {
        const nombreArmado = [nombre, apellido_paterno, apellido_materno].filter(Boolean).join(' ');
        setNombreCompleto(nombreArmado || usernameActual);
        setUsername(usernameActual);
    };

    // ── Items del menú lateral ────────────────────────────────────────────────
    const navItems = [
        { label: 'Inicio',         icon: iconInicio,     to: '#', onClick: () => irA('inicio') },
        { label: 'Mis Aulas',      icon: iconCurso,      to: '#', onClick: () => irA('mis-aulas') },
        { label: 'Tareas',         icon: iconCalendario, to: '#', onClick: () => irA('tareas') },
        { label: 'Muro',           icon: iconMuro,       to: '#', onClick: () => irA('muro') },
        { label: 'Estudiantes',    icon: iconUsuario,    to: '#', onClick: () => irA('estudiantes') },
        { label: 'Calificaciones', icon: iconCalif,      to: '#', onClick: () => irA('calificaciones') },
        { label: 'Reportes',       icon: iconReportes,   to: '#', onClick: () => irA('reportes') },
        { label: 'Mis Proyectos',  icon: iconProyectos,  to: '#', onClick: () => irA('proyectos') },
        { label: 'Configuración',  icon: iconConfig,     to: '#', onClick: () => irA('configuracion') },
    ];

    // ── Loading screen ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}> Cargando panel...</p>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout
            title={`¡Hola, ${nombreCompleto || username}!`}
            subtitle={vistaActual === 'inicio' ? fraseInicio : `Escuela: ${nombreEscuela || '—'}`}
            userName={`@${username}`}
            role="Profesor"
            onLogout={handleLogout}
            navItems={navItems}
            activeNav={VISTA_A_NAV[vistaActual] || 'Inicio'}
        >

            {/* ══════════ VISTA: INICIO ══════════ */}
            {vistaActual === 'inicio' && (
                <>
                    {/* Fila de métricas */}
                    <div className={styles.statsRow}>
                        {[
                            { icon: iconCurso,      color: 'Green',  num: metricas.aulas,         label: 'Mis Aulas' },
                            { icon: iconUsuario,    color: 'Blue',   num: metricas.estudiantes,   label: 'Estudiantes' },
                            { icon: iconCalendario, color: 'Yellow', num: metricas.tareasActivas, label: 'Tareas Activas' },
                            { icon: iconNotif,      color: 'Purple', num: metricas.entregas,      label: 'Entregas' },
                        ].map((s, i) => (
                            <div key={i} className={styles.statCard} style={{ animationDelay: `${i * 0.07}s` }}>
                                <div className={`${styles.statIcon} ${styles[`statIcon${s.color}`]}`}>
                                    <img src={s.icon} alt="" className={styles.statIconImg} />
                                </div>
                                <div>
                                    <div className={styles.statNumber}>{s.num}</div>
                                    <div className={styles.statLabel}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grid inferior: Actividad + Xolotl */}
                    <div className={styles.mainGridInicio}>

                        {/* Actividad Reciente */}
                        <div className={styles.columnCard}>
                            <div className={styles.columnHeader}>
                                <h2 className={styles.columnTitle}>Actividad Reciente</h2>
                            </div>
                            {actividad.length === 0 ? (
                                <p className={styles.emptyActividad}>Sin actividad reciente.</p>
                            ) : (
                                <ul className={styles.actividadList}>
                                    {actividad.map(item => {
                                        const alumno = item.perfiles;
                                        const tarea  = item.tareas;
                                        const nombreAlumno = alumno
                                            ? (alumno.nombre && alumno.apellido
                                                ? `${alumno.nombre} ${alumno.apellido}`
                                                : alumno.username)
                                            : 'Alumno';
                                        const nombreTarea   = tarea?.titulo || 'Tarea';
                                        const nombreAulaAct = tarea?.aulas?.nombre || '';
                                        return (
                                            <li key={item.id} className={styles.actividadItem}>
                                                <span className={styles.actividadDot} />
                                                <div className={styles.actividadBody}>
                                                    <p className={styles.actividadMsg}>
                                                        <strong>{nombreAlumno}</strong> entregó &quot;{nombreTarea}&quot;
                                                        {nombreAulaAct && <> en <em>{nombreAulaAct}</em></>}
                                                    </p>
                                                    <span className={styles.actividadFecha}>{formatearFecha(item.updated_at)}</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Xolotl motivacional (mensaje rotativo, cambia una vez por día) */}
                        <div className={styles.xolotlCard}>
                            <img
                                src={xolotlMotivacional}
                                alt="Xolotl motivacional"
                                className={styles.xolotlImg}
                                width="70"
                            />
                            <p className={styles.xolotlText}>
                                {fraseAnimoProfesor()}
                            </p>
                        </div>

                    </div>
                </>
            )}

            {/* ══════════ VISTA: MIS AULAS ══════════ */}
            {vistaActual === 'mis-aulas' && (
                <VistaMisAulas userId={userId} escuelaId={escuelaId} />
            )}

            {/* ══════════ VISTA: TAREAS ══════════ */}
            {vistaActual === 'tareas' && (
                <VistaTareas userId={userId} />
            )}

            {/* ══════════ VISTA: MURO ══════════ */}
            {vistaActual === 'muro' && (
                <VistaMuro userId={userId} />
            )}

            {/* ══════════ VISTA: ESTUDIANTES ══════════ */}
            {vistaActual === 'estudiantes' && (
                <VistaEstudiantes userId={userId} escuelaId={escuelaId} />
            )}

            {/* ══════════ VISTA: CALIFICACIONES ══════════ */}
            {vistaActual === 'calificaciones' && (
                <VistaCalificaciones userId={userId} />
            )}

            {/* ══════════ VISTA: MIS PROYECTOS ══════════ */}
            {vistaActual === 'proyectos' && (
                <VistaProyectos userId={userId} />
            )}

            {/* ══════════ VISTA: CONFIGURACIÓN ══════════ */}
            {vistaActual === 'configuracion' && (
                <VistaConfiguracion userId={userId} onPerfilActualizado={actualizarPerfilHeader} />
            )}

            {/* ══════════ VISTA: REPORTES ══════════ */}
            {vistaActual === 'reportes' && (
                <VistaReportes userId={userId} />
            )}

        </DashboardLayout>
    );
};

export default DashboardProfesor;

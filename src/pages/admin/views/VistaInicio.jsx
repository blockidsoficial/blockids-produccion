import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    Tooltip, Legend,
} from 'recharts';
import iconInicio    from '../../../assets/iconos-ui/ui-inicio.svg';
import iconUsuario   from '../../../assets/iconos-ui/ui-usuario.svg';
import iconCurso     from '../../../assets/iconos-ui/ui-curso.svg';
import iconFavorito  from '../../../assets/iconos-ui/ui-favorito.svg';
import iconPadres    from '../../../assets/iconos-ui/ui-padres.svg';
import iconConfig    from '../../../assets/iconos-ui/ui-configuracion.svg';
import iconDescargar from '../../../assets/iconos-ui/ui-descargar.svg';
import iconNotif     from '../../../assets/iconos-ui/ui-notificaciones.svg';
import xolotlEscuela from '../../../assets/xolotl/xolotl-explicando.svg';
import styles from '../Dashboard.css';
import local  from './VistaInicio.css';

const ROLES_DONA = [
    { key: 'alumno',        name: 'Alumnos',       color: '#4D96FF' },
    { key: 'profesor',      name: 'Profesores',    color: '#6BCB77' },
    { key: 'admin_escuela', name: 'Admin Escuela', color: '#f59e0b' },
    { key: 'superadmin',    name: 'Superadmin',    color: '#64748b' },
];

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const VistaInicio = ({
    esSuperAdmin,
    cargando,
    cargandoStats,
    cargandoActividad,
    stats,
    statsEscuela,
    actividadReal,
    miEscuela,
    cambiarVista,
    abrirModalCrear,
    abrirModalAula,
}) => {
    const [datosRoles, setDatosRoles] = useState([]);

    useEffect(() => {
        if (!esSuperAdmin) return;
        const cargarRoles = async () => {
            const { data } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('activo', true);
            const conteo = {};
            (data || []).forEach(p => { conteo[p.rol] = (conteo[p.rol] || 0) + 1; });
            const datos = ROLES_DONA
                .filter(r => conteo[r.key] > 0)
                .map(r => ({ name: r.name, value: conteo[r.key], color: r.color }));
            setDatosRoles(datos);
        };
        cargarRoles();
    }, [esSuperAdmin]);

    const totalRoles = datosRoles.reduce((s, d) => s + d.value, 0);

    const STATS_SA = [
        { icon: iconInicio,   color: 'Blue',   num: cargando ? '...' : stats.activas,       label: 'Escuelas Activas' },
        { icon: iconUsuario,  color: 'Purple', num: cargando ? '...' : stats.totalUsuarios, label: 'Usuarios Totales' },
        { icon: iconCurso,    color: 'Green',  num: cargando ? '...' : stats.totalAulas,    label: 'Aulas Totales'    },
        { icon: iconFavorito, color: 'Yellow', num: cargando ? '...' : stats.totalProyectos,       label: 'Proyectos'        },
    ];

    const STATS_AE = [
        { icon: iconPadres,   color: 'Blue',   num: cargandoStats ? '...' : statsEscuela.profesores,     label: 'Profesores' },
        { icon: iconUsuario,  color: 'Purple', num: cargandoStats ? '...' : statsEscuela.alumnos,        label: 'Alumnos'    },
        { icon: iconCurso,    color: 'Green',  num: cargandoStats ? '...' : statsEscuela.aulas,          label: 'Aulas'      },
        { icon: iconFavorito, color: 'Yellow', num: cargandoStats ? '...' : statsEscuela.totalProyectos, label: 'Proyectos'  },
    ];

    const ACCIONES_SA = [
        { label: 'Crear Escuela', icon: iconInicio,  action: () => cambiarVista('Escuelas') },
        { label: 'Crear Usuario',   icon: iconUsuario, action: () => abrirModalCrear() },
        { label: 'Ver Reportes',    icon: iconDescargar,  action: () => cambiarVista('Reportes') },
        { label: 'Config. Global',  icon: iconConfig,  action: () => cambiarVista('Configuración') },
    ];

    const ACCIONES_AE = [
        { label: 'Crear Usuario', icon: iconUsuario, action: () => abrirModalCrear() },
        { label: 'Crear Aula',     icon: iconCurso,   action: () => abrirModalAula()  },
        { label: 'Ver Reportes',   icon: iconDescargar,  action: () => cambiarVista('Reportes') },
        { label: 'Config. Escuela',icon: iconConfig,  action: () => cambiarVista('Configuración') },
    ];

    const statsActivas = esSuperAdmin ? STATS_SA : STATS_AE;
    const accionesAct  = esSuperAdmin ? ACCIONES_SA : ACCIONES_AE;

    return (
        <>
            {/* ── Estadísticas ── */}
            <div className={styles.statsRow}>
                {statsActivas.map((s, i) => (
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

            {/* ── Grid Principal ── */}
            <div className={styles.mainGrid}>
                {esSuperAdmin ? (
                    <>
                        <div className={styles.columnCard}>
                            <div className={styles.cardHeader}>
                                <img src={iconNotif} alt="" className={styles.cardHeaderIcon} />
                                <span className={styles.cardHeaderLabel}>Actividad Reciente</span>
                            </div>
                            <div className={styles.actividadList}>
                                {cargandoActividad ? (
                                    <div className={`${styles.loadingState} ${local.loadingInline}`}>Cargando...</div>
                                ) : actividadReal.length === 0 ? (
                                    <div className={local.actividadVacia}>Sin actividad reciente.</div>
                                ) : actividadReal.map((item, i) => (
                                    <div key={i} className={styles.actividadItem}>
                                        <div className={styles.actividadDot} />
                                        <div className={styles.actividadInfo}>
                                            <span className={styles.actividadLabel}>{item.label}</span>
                                            <span className={styles.actividadDesc}>{item.desc}</span>
                                        </div>
                                        <span className={styles.actividadTiempo}>{item.tiempo}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`${styles.columnCard} ${styles.graficaCard}`}>
                            <div className={styles.cardHeader}>
                                <img src={iconUsuario} alt="" className={styles.cardHeaderIcon} />
                                <span className={styles.cardHeaderLabel}>Distribución de la Comunidad</span>
                            </div>
                            <div className={local.donutWrap}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={datosRoles}
                                            innerRadius={65}
                                            outerRadius={95}
                                            dataKey="value"
                                            paddingAngle={3}
                                        >
                                            {datosRoles.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                fontFamily: 'var(--font-principal)',
                                            }}
                                            formatter={(value, name) => [`${value} usuarios`, name]}
                                        />
                                        <Legend
                                            layout="vertical"
                                            align="right"
                                            verticalAlign="middle"
                                            iconType="circle"
                                            iconSize={10}
                                            wrapperStyle={{
                                                fontSize: '0.79rem',
                                                fontFamily: 'var(--font-principal)',
                                                lineHeight: '2',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {totalRoles > 0 && (
                                    <div className={local.donutMetrica}>
                                        <span className={local.donutTotal}>{totalRoles}</span>
                                        <span className={local.donutLabel}>usuarios totales</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`${styles.columnCard} ${styles.escuelaResumenCard}`}>
                            <div className={styles.cardHeader}>
                                <img src={iconInicio} alt="" className={styles.cardHeaderIcon} />
                                <span className={styles.cardHeaderLabel}>Resumen de tu Escuela</span>
                            </div>
                            <img src={xolotlEscuela} alt="" width="80" className={styles.escuelaXolotl} />
                            <h2 className={styles.escuelaNombre}>{miEscuela?.nombre || 'Tu Escuela'}</h2>
                            <div className={styles.escuelaMeta}>
                                <div className={styles.escuelaMetaItem}>
                                    <span className={styles.escuelaMetaLabel}>Clave de Acceso</span>
                                    <span className={styles.escuelaClave}>{miEscuela?.clave_acceso || '—'}</span>
                                </div>
                                <div className={styles.escuelaMetaItem}>
                                    <span className={styles.escuelaMetaLabel}>PIN Docente</span>
                                    <span className={styles.escuelaClave}>{miEscuela?.pin_docente || '— (pídelo al superadmin)'}</span>
                                </div>
                                <div className={styles.escuelaMetaItem}>
                                    <span className={styles.escuelaMetaLabel}>Estado</span>
                                    <span className={miEscuela?.activa !== false ? styles.badgeActiva : styles.badgeInactiva}>
                                        {miEscuela?.activa !== false ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>
                                <div className={styles.escuelaMetaItem}>
                                    <span className={styles.escuelaMetaLabel}>Creada</span>
                                    <span className={styles.escuelaMetaValor}>{formatearFecha(miEscuela?.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.columnCard}>
                            <div className={styles.cardHeader}>
                                <img src={iconNotif} alt="" className={styles.cardHeaderIcon} />
                                <span className={styles.cardHeaderLabel}>Actividad Reciente</span>
                            </div>
                            <div className={styles.actividadList}>
                                {cargandoActividad ? (
                                    <div className={`${styles.loadingState} ${local.loadingInline}`}>Cargando...</div>
                                ) : actividadReal.length === 0 ? (
                                    <div className={local.actividadVacia}>Sin actividad reciente en tu escuela.</div>
                                ) : actividadReal.map((item, i) => (
                                    <div key={i} className={styles.actividadItem}>
                                        <div className={styles.actividadDot} />
                                        <div className={styles.actividadInfo}>
                                            <span className={styles.actividadLabel}>{item.label}</span>
                                            <span className={styles.actividadDesc}>{item.desc}</span>
                                        </div>
                                        <span className={styles.actividadTiempo}>{item.tiempo}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Acciones Rápidas ── */}
            <div className={styles.accionesGrid}>
                {accionesAct.map((accion, i) => (
                    <button
                        key={i}
                        className={`${styles.accionCard} ${!accion.action ? styles.accionCardDisabled : ''}`}
                        onClick={accion.action || undefined}
                        style={{ animationDelay: `${i * 0.07}s` }}
                    >
                        <div className={styles.accionIconWrap}>
                            <img src={accion.icon} alt="" className={styles.accionIconImg} />
                        </div>
                        <span className={styles.accionLabel}>{accion.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
};

export default VistaInicio;

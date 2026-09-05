import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import styles from './VistaReportes.css';

import iconUsuario    from '../../../assets/iconos-ui/ui-usuario.svg';
import iconVideo      from '../../../assets/iconos-ui/ui-video.svg';
import iconCalendario from '../../../assets/iconos-ui/ui-calendario.svg';
import iconContacto   from '../../../assets/iconos-ui/ui-contacto.svg';
import iconCurso      from '../../../assets/iconos-ui/ui-curso.svg';
import iconExportar   from '../../../assets/iconos-ui/ui-descargar.svg';

// ─────────────────────────────────────────────────────────────────────────────

const VistaReportes = ({ esSuperAdmin, perfil }) => {
    const [metricas,   setMetricas]   = useState({
        totalUsuarios:  0,
        totalProyectos: 0,
        totalEntregas:  0,
        totalMensajes:  0,
    });
    const [cargando,   setCargando]   = useState(true);
    const [exportando, setExportando] = useState(false);
    const [topEscuelas, setTopEscuelas] = useState([]);
    const [topAlumnos,  setTopAlumnos]  = useState([]);

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            if (esSuperAdmin) {
                const [
                    { count: totalUsuarios  },
                    { count: totalProyectos },
                    { count: totalEntregas  },
                    { count: totalMensajes  },
                    { data: proyData },
                ] = await Promise.all([
                    supabase
                        .from('perfiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('activo', true),
                    supabase
                        .from('proyectos')
                        .select('*', { count: 'exact', head: true }),
                    supabase
                        .from('entregas_proyectos')
                        .select('*', { count: 'exact', head: true })
                        .neq('estado', 'pendiente'),
                    supabase
                        .from('mensajes_muro')
                        .select('*', { count: 'exact', head: true }),
                    supabase
                        .from('proyectos')
                        .select('perfiles!alumno_id(escuelas(nombre))'),
                ]);

                setMetricas({
                    totalUsuarios:  totalUsuarios  || 0,
                    totalProyectos: totalProyectos || 0,
                    totalEntregas:  totalEntregas  || 0,
                    totalMensajes:  totalMensajes  || 0,
                });

                const porEscuela = {};
                (proyData || []).forEach(p => {
                    const nombre = p.perfiles?.escuelas?.nombre || 'Sin escuela';
                    porEscuela[nombre] = (porEscuela[nombre] || 0) + 1;
                });
                const top5 = Object.entries(porEscuela)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([nombre, total]) => ({ nombre, total }));
                setTopEscuelas(top5);

            } else {
                // Admin Escuela: todas las consultas acotadas a su escuela
                const escuelaId = perfil?.escuela_id;

                const [{ data: alumnosData }, { data: aulasData }] = await Promise.all([
                    supabase.from('perfiles').select('id').eq('escuela_id', escuelaId).eq('activo', true),
                    supabase.from('aulas').select('id').eq('escuela_id', escuelaId),
                ]);

                const alumnoIds = (alumnosData || []).map(a => a.id);
                const aulaIds   = (aulasData   || []).map(a => a.id);

                const [
                    { count: totalUsuarios  },
                    { count: totalProyectos },
                    { count: totalEntregas  },
                    { count: totalMensajes  },
                ] = await Promise.all([
                    supabase
                        .from('perfiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('escuela_id', escuelaId)
                        .eq('activo', true),
                    alumnoIds.length > 0
                        ? supabase
                              .from('proyectos')
                              .select('*', { count: 'exact', head: true })
                              .in('alumno_id', alumnoIds)
                        : Promise.resolve({ count: 0 }),
                    alumnoIds.length > 0
                        ? supabase
                              .from('entregas_proyectos')
                              .select('*', { count: 'exact', head: true })
                              .in('estudiante_id', alumnoIds)
                              .neq('estado', 'pendiente')
                        : Promise.resolve({ count: 0 }),
                    aulaIds.length > 0
                        ? supabase
                              .from('mensajes_muro')
                              .select('*', { count: 'exact', head: true })
                              .in('aula_id', aulaIds)
                        : Promise.resolve({ count: 0 }),
                ]);

                setMetricas({
                    totalUsuarios:  totalUsuarios  || 0,
                    totalProyectos: totalProyectos || 0,
                    totalEntregas:  totalEntregas  || 0,
                    totalMensajes:  totalMensajes  || 0,
                });

                // Top 5 alumnos con más proyectos en la escuela
                if (alumnoIds.length > 0) {
                    const { data: proyAlumnos } = await supabase
                        .from('proyectos')
                        .select('alumno_id, perfiles!alumno_id(nombre, apellido_paterno, username)')
                        .in('alumno_id', alumnoIds);

                    const conteo = {};
                    const nombres = {};
                    (proyAlumnos || []).forEach(p => {
                        const id = p.alumno_id;
                        conteo[id] = (conteo[id] || 0) + 1;
                        if (!nombres[id]) {
                            const pf = p.perfiles;
                            nombres[id] = pf?.nombre || pf?.username || 'Alumno';
                        }
                    });
                    const top5 = Object.entries(conteo)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([id, total]) => ({ nombre: nombres[id], total }));
                    setTopAlumnos(top5);
                }
            }
        } catch (err) {
            console.error('[BLOCKIDS] Error cargando reportes:', err);
        } finally {
            setCargando(false);
        }
    };

    const handleExportarCSV = async () => {
        setExportando(true);
        try {
            const fechaHoy = new Date().toLocaleDateString('es-MX', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
            const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

            if (esSuperAdmin) {
                // ── Reporte Ejecutivo Global ───────────────────────────
                const [
                    { data: usuarios, error: errU },
                    { data: escuelas, error: errE },
                ] = await Promise.all([
                    supabase
                        .from('perfiles')
                        .select('nombre, apellido_paterno, apellido_materno, username, rol, escuelas(nombre)')
                        .eq('activo', true)
                        .order('rol'),
                    supabase
                        .from('escuelas')
                        .select('nombre, clave_acceso, activa')
                        .order('nombre'),
                ]);
                if (errU) throw errU;
                if (errE) throw errE;

                const secciones = [
                    // Cabecera
                    [q('REPORTE EJECUTIVO BLOCKIDS')],
                    [q('Fecha de generación:'), q(fechaHoy)],
                    [],
                    // Resumen global
                    [q('--- RESUMEN GLOBAL ---')],
                    [q('Total Escuelas'),       q(escuelas?.length ?? 0)],
                    [q('Total Usuarios'),       q(metricas.totalUsuarios)],
                    [q('Proyectos Creados'),    q(metricas.totalProyectos)],
                    [q('Tareas Entregadas'),    q(metricas.totalEntregas)],
                    [q('Mensajes en el Muro'),  q(metricas.totalMensajes)],
                    [],
                    // Directorio de escuelas
                    [q('--- DIRECTORIO DE ESCUELAS ---')],
                    [q('Nombre de la Escuela'), q('Clave'), q('Estado')],
                    ...(escuelas || []).map(e => [
                        q(e.nombre), q(e.clave_acceso), q(e.activa ? 'Activa' : 'Inactiva'),
                    ]),
                    [],
                    // Directorio de usuarios
                    [q('--- DIRECTORIO DE USUARIOS ---')],
                    [q('Nombre'), q('Apellido Paterno'), q('Apellido Materno'), q('Usuario'), q('Rol'), q('Escuela')],
                    ...(usuarios || []).map(u => [
                        q(u.nombre), q(u.apellido_paterno), q(u.apellido_materno),
                        q(u.username), q(u.rol), q(u.escuelas?.nombre),
                    ]),
                ];

                const csv  = secciones.map(f => f.join(',')).join('\n');
                const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = 'Reporte_Ejecutivo_Blockids.csv';
                a.click();
                URL.revokeObjectURL(url);

            } else {
                // ── Reporte Ejecutivo de Escuela (Admin Escuela) ───────
                const { data: usuariosData, error } = await supabase
                    .from('perfiles')
                    .select('nombre, apellido_paterno, apellido_materno, username, rol, escuelas(nombre)')
                    .eq('activo', true)
                    .eq('escuela_id', perfil?.escuela_id)
                    .order('rol');
                if (error) throw error;

                const nombreEscuela = usuariosData?.[0]?.escuelas?.nombre || 'Mi Escuela';

                const secciones = [
                    // Cabecera
                    [q('REPORTE EJECUTIVO DE ESCUELA')],
                    [q('Escuela:'), q(nombreEscuela)],
                    [q('Fecha de generación:'), q(fechaHoy)],
                    [],
                    // Resumen de actividad
                    [q('--- RESUMEN DE ACTIVIDAD ---')],
                    [q('Total Usuarios'),      q(metricas.totalUsuarios)],
                    [q('Proyectos Creados'),   q(metricas.totalProyectos)],
                    [q('Tareas Entregadas'),   q(metricas.totalEntregas)],
                    [q('Mensajes en Muro'),    q(metricas.totalMensajes)],
                    [],
                    // Directorio
                    [q('--- DIRECTORIO DE ALUMNOS Y PROFESORES ---')],
                    [q('Nombre'), q('Apellido'), q('Usuario'), q('Rol')],
                    ...(usuariosData || []).map(u => [
                        q(u.nombre),
                        q([u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ')),
                        q(u.username),
                        q(u.rol),
                    ]),
                ];

                const csv  = secciones.map(f => f.join(',')).join('\n');
                const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = `Reporte_${nombreEscuela.replace(/\s+/g, '_')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('[BLOCKIDS] Error exportando reporte:', err);
        } finally {
            setExportando(false);
        }
    };

    const datosGrafica = esSuperAdmin
        ? topEscuelas.map(e => ({
              nombre:    e.nombre.length > 16 ? `${e.nombre.slice(0, 14)}…` : e.nombre,
              proyectos: e.total,
          }))
        : topAlumnos.map(a => ({
              nombre:    a.nombre.length > 14 ? `${a.nombre.slice(0, 12)}…` : a.nombre,
              proyectos: a.total,
          }));

    const graficaTitulo  = esSuperAdmin
        ? 'Proyectos por Escuela — Top 5'
        : 'Top 5 Alumnos — Proyectos Creados';
    const graficaBarColor = esSuperAdmin ? 'var(--color-verde-primario)' : '#10b981';
    const graficaSinDatos = esSuperAdmin
        ? 'Sin datos suficientes para mostrar la gráfica.'
        : 'Aún no hay proyectos creados en esta escuela.';

    const kpis = [
        { label: 'Usuarios Totales',       valor: metricas.totalUsuarios,  icon: iconUsuario,    mod: styles.kpiAzul    },
        { label: 'Proyectos Creados',       valor: metricas.totalProyectos, icon: iconVideo,      mod: styles.kpiVerde   },
        { label: 'Tareas Entregadas',       valor: metricas.totalEntregas,  icon: iconCalendario, mod: styles.kpiMorado  },
        { label: 'Mensajes en el Muro',     valor: metricas.totalMensajes,  icon: iconContacto,   mod: styles.kpiNaranja },
    ];

    const maxTop = topEscuelas[0]?.total || 1;

    if (cargando) {
        return (
            <div className={styles.cargandoWrap}>
                <div className={styles.spinner} />
                <p className={styles.cargandoTxt}>Cargando reportes...</p>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>

            {/* ── Header ── */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Reportes y Estadísticas</h1>
                    <p className={styles.pageSubtitle}>Vista general de actividad en la plataforma</p>
                </div>
                <button
                    className={styles.btnExportar}
                    onClick={handleExportarCSV}
                    disabled={exportando}
                >
                    <img src={iconExportar} alt="" className={styles.btnExportarIcon} />
                    {exportando
                        ? 'Exportando...'
                        : esSuperAdmin
                            ? 'Descargar Reporte CSV'
                            : 'Exportar Reporte General - CSV'}
                </button>
            </div>

            {/* ── KPI Cards ── */}
            <div className={styles.kpiGrid}>
                {kpis.map(kpi => (
                    <div key={kpi.label} className={`${styles.kpiCard} ${kpi.mod}`}>
                        <div className={styles.kpiIconWrap}>
                            <img src={kpi.icon} alt="" className={styles.kpiIcon} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiValor}>
                                {kpi.valor.toLocaleString('es-MX')}
                            </span>
                            <span className={styles.kpiLabel}>{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Ranking Top 5 escuelas (solo SuperAdmin) ── */}
            {esSuperAdmin && topEscuelas.length > 0 && (
                <div className={styles.rankingCard}>
                    <div className={styles.rankingHeader}>
                        <img src={iconCurso} alt="" className={styles.rankingHeaderIcon} />
                        <span className={styles.rankingHeaderLabel}>Top 5 Escuelas — Proyectos creados</span>
                    </div>
                    <div className={styles.rankingLista}>
                        {topEscuelas.map((esc, i) => {
                            const porcentaje = Math.max(4, Math.round((esc.total / maxTop) * 100));
                            return (
                                <div key={esc.nombre} className={styles.rankingFila}>
                                    <span className={styles.rankingPos}>{i + 1}</span>
                                    <span className={styles.rankingNombre}>{esc.nombre}</span>
                                    <div className={styles.rankingBarWrap}>
                                        <div
                                            className={styles.rankingBar}
                                            style={{ width: `${porcentaje}%` }}
                                        />
                                    </div>
                                    <span className={styles.rankingTotal}>{esc.total}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Gráfica dinámica (superadmin: por escuela / admin_escuela: por alumno) ── */}
            <div className={styles.graficaCard}>
                <div className={styles.graficaHeader}>
                    <img src={iconCurso} alt="" className={styles.graficaHeaderIcon} />
                    <span className={styles.graficaHeaderLabel}>{graficaTitulo}</span>
                </div>

                {datosGrafica.length === 0 ? (
                    <p className={styles.graficaSinDatos}>{graficaSinDatos}</p>
                ) : (
                    <div className={styles.graficaWrap}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={datosGrafica}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    dataKey="nombre"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        fontFamily: 'var(--font-principal)',
                                    }}
                                />
                                <Bar
                                    dataKey="proyectos"
                                    fill={graficaBarColor}
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

        </div>
    );
};

export default VistaReportes;

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import styles from './VistaProyectos.css';

import xolotlIdea from '../../assets/xolotl/xolotl-idea.svg';
import iconVideo  from '../../assets/iconos-ui/ui-video.svg';

import { desbloquearLogro } from '../../services/gamificationService';

// ─────────────────────────────────────────────────────────────────────────────

const formatearFechaRelativa = (iso) => {
    if (!iso) return '';
    const diff = Math.floor((new Date() - new Date(iso)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 7)  return `Hace ${diff} días`;
    if (diff < 30) return `Hace ${Math.floor(diff / 7)} semana${Math.floor(diff / 7) > 1 ? 's' : ''}`;
    return `Hace ${Math.floor(diff / 30)} mes${Math.floor(diff / 30) > 1 ? 'es' : ''}`;
};

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─────────────────────────────────────────────────────────────────────────────

const VistaProyectos = ({ userId }) => {
    const history = useHistory();

    const [proyectos,      setProyectos]      = useState([]);
    const [estadisticas,   setEstadisticas]   = useState({ total: 0, activos: 0 });
    const [cargando,       setCargando]       = useState(true);
    const [creando,        setCreando]        = useState(false);
    const [filtro,         setFiltro]         = useState('todos');
    const [editandoId,     setEditandoId]     = useState(null);
    const [nombreEditando, setNombreEditando] = useState('');
    const [guardandoNombre, setGuardandoNombre] = useState(false);

    useEffect(() => {
        if (!userId) { setCargando(false); return; }
        cargarDatos();
    }, [userId]);

    // ── Cargar portafolio unificado (proyectos libres + tareas entregadas) ────
    const cargarDatos = async () => {
        setCargando(true);
        try {
            // 1. Traer Proyectos Libres
            const { data: projs } = await supabase
                .from('proyectos')
                .select('id, nombre, descripcion, created_at, updated_at')
                .eq('alumno_id', userId);

            // 2. Traer Tareas Entregadas (sin created_at, columna inexistente en esta tabla)
            const { data: entregas, error: errorEntregas } = await supabase
                .from('entregas_proyectos')
                .select(`
                    id, tarea_id, updated_at, estado,
                    tareas ( titulo, descripcion )
                `)
                .eq('estudiante_id', userId);

            console.log('[BLOCKIDS] ERROR DE SUPABASE:', errorEntregas);
            console.log('[BLOCKIDS] ENTREGAS CRUDAS:', entregas);

            // 3. Filtrar en memoria ignorando variantes de mayúsculas
            const entregasValidas = (entregas || []).filter(e =>
                e.estado && e.estado.toLowerCase() !== 'pendiente'
            );

            console.log('[BLOCKIDS] ENTREGAS VÁLIDAS:', entregasValidas);

            // 4. Mapear proyectos libres
            const proyectosLibres = (projs || []).map(p => ({
                ...p,
                tipo:   'libre',
                estado: 'En progreso',
            }));

            // Mapeo blindado: Supabase puede devolver 'tareas' como objeto o arreglo
            const proyectosEntregados = entregasValidas.map(e => {
                const infoTarea = Array.isArray(e.tareas) ? e.tareas[0] : e.tareas;
                return {
                    id:          e.tarea_id,
                    nombre:      infoTarea?.titulo      || 'Tarea sin título',
                    descripcion: infoTarea?.descripcion || 'Tarea escolar',
                    created_at:  e.updated_at,
                    updated_at:  e.updated_at,
                    tipo:        'tarea',
                    estado:      'Entregado',
                };
            });

            const portafolio = [...proyectosLibres, ...proyectosEntregados]
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            setProyectos(portafolio);
            setEstadisticas({ total: portafolio.length, activos: proyectosLibres.length });
        } catch (err) {
            console.error('[BLOCKIDS] Error cargando portafolio:', err);
            setProyectos([]);
        } finally {
            setCargando(false);
        }
    };

    // ── Nuevo proyecto: registra en BD y redirige ─────────────────────────────
    const handleNuevoProyecto = async () => {
        setCreando(true);
        try {
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('escuela_id')
                .eq('id', userId)
                .single();

            const { data: nuevoProj, error } = await supabase
                .from('proyectos')
                .insert([{
                    alumno_id:    userId,
                    escuela_id:   perfil?.escuela_id,
                    nombre:       'Mi Nuevo Proyecto',
                    storage_path: `proyectos/${userId}/${Date.now()}.sb3`,
                }])
                .select()
                .single();

            if (error) throw error;

            await desbloquearLogro(userId, 'Mi Primer Proyecto', 50);

            history.push(`/entorno?proyectoId=${nuevoProj.id}`);
        } catch (err) {
            console.error('[BLOCKIDS] Error creando proyecto:', err);
            setCreando(false);
        }
    };

    // ── Abrir proyecto existente ──────────────────────────────────────────────
    const abrirProyecto = (proyecto) => {
        if (proyecto.tipo === 'tarea') {
            history.push(`/entorno?tareaId=${proyecto.id}`);
        } else {
            history.push(`/entorno?proyectoId=${proyecto.id}`);
        }
    };

    // ── Eliminar proyecto ─────────────────────────────────────────────────────
    const handleEliminar = async (id, nombre) => {
        if (!window.confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
        const { error } = await supabase.from('proyectos').delete().eq('id', id);
        if (!error) cargarDatos();
    };

    // ── Renombrar proyecto ────────────────────────────────────────────────────
    const iniciarEdicion = (proyecto) => {
        setEditandoId(proyecto.id);
        setNombreEditando(proyecto.nombre);
    };

    const cancelarEdicion = () => {
        setEditandoId(null);
        setNombreEditando('');
    };

    const handleRenombrar = async (id) => {
        const nombre = nombreEditando.trim();
        if (!nombre || guardandoNombre) return;
        if (nombre === proyectos.find(p => p.id === id)?.nombre) {
            cancelarEdicion();
            return;
        }

        setGuardandoNombre(true);
        const { error } = await supabase
            .from('proyectos')
            .update({ nombre, updated_at: new Date().toISOString() })
            .eq('id', id);

        setGuardandoNombre(false);

        if (!error) {
            setProyectos(prev => prev.map(p =>
                p.id === id ? { ...p, nombre, updated_at: new Date().toISOString() } : p
            ));
        }
        cancelarEdicion();
    };

    const handleKeyNombre = (e, id) => {
        if (e.key === 'Enter')  handleRenombrar(id);
        if (e.key === 'Escape') cancelarEdicion();
    };

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const proyectosFiltrados = filtro === 'todos'
        ? proyectos
        : proyectos.filter(p =>
            filtro === 'en-progreso'
                ? p.estado === 'En progreso'
                : p.estado === 'Entregado'
          );

    // ── Cargando ──────────────────────────────────────────────────────────────
    if (cargando) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.cargando}>
                    <div className={styles.spinner} />
                    <p>Cargando tus proyectos...</p>
                </div>
            </div>
        );
    }

    // ── Sin proyectos ─────────────────────────────────────────────────────────
    if (proyectos.length === 0) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.emptyState}>
                    <img src={xolotlIdea} alt="Sin proyectos" className={styles.xolotl} />
                    <h2 className={styles.titulo}>Aún no tienes proyectos</h2>
                    <p className={styles.desc}>Crea tu primer proyecto y empieza a programar.</p>
                    <button
                        className={styles.btnCrearProyecto}
                        onClick={handleNuevoProyecto}
                        disabled={creando}
                    >
                        {creando ? 'Creando...' : '+ Nuevo Proyecto'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Vista principal ───────────────────────────────────────────────────────
    return (
        <div className={styles.wrapper}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img src={iconVideo} alt="" className={styles.headerIcon} />
                    <div>
                        <h2 className={styles.titulo}>Mis Proyectos</h2>
                        <p className={styles.subtitulo}>
                            {estadisticas.activos} en progreso · {estadisticas.total} total
                        </p>
                    </div>
                </div>
                <div className={styles.filtroGroup}>
                    <select
                        className={styles.filtroSelect}
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        <option value="en-progreso">En progreso</option>
                        <option value="entregado">Entregados</option>
                    </select>
                    <button
                        className={styles.btnNuevoProyecto}
                        onClick={handleNuevoProyecto}
                        disabled={creando}
                    >
                        {creando ? 'Creando...' : '+ Nuevo'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className={styles.proyectosList}>
                {proyectosFiltrados.length === 0 ? (
                    <div className={styles.emptyFiltered}>
                        <p>No hay proyectos en esta categoría</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {proyectosFiltrados.map((proyecto, idx) => {
                            const claseEstado = proyecto.estado === 'Entregado'
                                ? styles.estadoEntregado
                                : styles.estadoEnprogreso;
                            return (
                                <div
                                    key={proyecto.id}
                                    className={`${styles.proyectoCard} ${claseEstado}`}
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    <div className={styles.estadoIndicador}>
                                        <img src={iconVideo} alt="" width="16" height="16" />
                                    </div>

                                    <div className={styles.proyectoContent}>
                                        {/* Nombre: clic para editar solo en proyectos libres */}
                                        {editandoId === proyecto.id ? (
                                            <input
                                                className={styles.nombreInput}
                                                value={nombreEditando}
                                                onChange={e => setNombreEditando(e.target.value)}
                                                onBlur={() => handleRenombrar(proyecto.id)}
                                                onKeyDown={e => handleKeyNombre(e, proyecto.id)}
                                                disabled={guardandoNombre}
                                                maxLength={80}
                                                autoFocus
                                            />
                                        ) : (
                                            <h3
                                                className={styles.proyectoNombre}
                                                onClick={() => proyecto.tipo === 'libre' && iniciarEdicion(proyecto)}
                                                title={proyecto.tipo === 'libre' ? 'Clic para renombrar' : proyecto.nombre}
                                                style={{ cursor: proyecto.tipo === 'libre' ? 'text' : 'default' }}
                                            >
                                                {proyecto.nombre}
                                                {proyecto.tipo === 'libre' && (
                                                    <span className={styles.editHint}>✎</span>
                                                )}
                                            </h3>
                                        )}

                                        {proyecto.descripcion && (
                                            <p className={styles.proyectoDesc}>{proyecto.descripcion}</p>
                                        )}

                                        <div className={styles.proyectoMeta}>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Creado</span>
                                                <span className={styles.metaValor}>{formatearFecha(proyecto.created_at)}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Modificado</span>
                                                <span className={styles.metaValor}>{formatearFecha(proyecto.updated_at)}</span>
                                            </div>
                                            {proyecto.entrega && (
                                                <div className={styles.metaItem}>
                                                    <span className={styles.metaLabel}>Entregado</span>
                                                    <span className={styles.metaValor}>{formatearFecha(proyecto.entrega.created_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.estadoBadge}>
                                            {proyecto.estado === 'Entregado' ? 'Entregado' : 'En progreso'}
                                        </div>
                                    </div>

                                    <div className={styles.acciones}>
                                        <button
                                            className={styles.btnAbrir}
                                            onClick={() => abrirProyecto(proyecto)}
                                        >
                                            Abrir
                                        </button>
                                        {proyecto.tipo === 'libre' && (
                                            <button
                                                className={styles.btnEliminar}
                                                onClick={() => handleEliminar(proyecto.id, proyecto.nombre)}
                                                title="Eliminar proyecto"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className={styles.infoTip}>
                <img src={xolotlIdea} alt="" className={styles.infoXolotl} />
                <p>Tus proyectos se guardan automáticamente. ¡Sigue creando!</p>
            </div>
        </div>
    );
};

export default VistaProyectos;

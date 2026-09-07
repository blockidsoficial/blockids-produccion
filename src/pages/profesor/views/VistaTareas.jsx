import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../../config/supabaseClient';
import iconCalendario from '../../../assets/iconos-ui/ui-calendario.svg';
import iconConfig     from '../../../assets/iconos-ui/ui-configuracion.svg';
import iconInicio     from '../../../assets/iconos-ui/ui-inicio.svg';
import iconVideo      from '../../../assets/iconos-ui/ui-video.svg';
import dash   from '../Dashboard.css';
import styles from './VistaTareas.css';
import iconArchivoAdjunto from '../../../assets/iconos/icon-archivo-adjunto.svg';

const formatearFecha = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};


const VistaTareas = ({ userId }) => {
    const history = useHistory();

    const [aulas,   setAulas]   = useState([]);
    const [tareas,  setTareas]  = useState([]);
    const [cargando, setCargando] = useState(false);

    // ── Modal crear/editar tarea ──────────────────────────────────────────────
    const [modalAbierto,   setModalAbierto]   = useState(false);
    const [tareaEditando,  setTareaEditando]  = useState(null);
    const [aulaSeleccionada, setAulaSeleccionada] = useState('');
    const [tituloTarea,    setTituloTarea]    = useState('');
    const [descripcionTarea, setDescripcionTarea] = useState('');
    const [fechaLimite,    setFechaLimite]    = useState('');
    const [puntosTarea,    setPuntosTarea]    = useState('10');
    const [materialTarea,  setMaterialTarea]  = useState('');
    const [archivoAdjunto, setArchivoAdjunto] = useState(null);
    const [subiendo,       setSubiendo]       = useState(false);
    const [enviando,       setEnviando]       = useState(false);

    // ── Modal revisión de entregas ────────────────────────────────────────────
    const [modalRevisionAbierto, setModalRevisionAbierto] = useState(false);
    const [tareaActiva,          setTareaActiva]          = useState(null);
    const [listaEntregas,        setListaEntregas]        = useState([]);
    const [cargandoEntregas,     setCargandoEntregas]     = useState(false);
    const [calificaciones,       setCalificaciones]       = useState({});
    const [calificandoId,        setCalificandoId]        = useState(null);

    // ── Filtro por aula ───────────────────────────────────────────────────────
    const [filtroAula, setFiltroAula] = useState('todas');

    // ── Alerta compartida ─────────────────────────────────────────────────────
    const [alerta, setAlerta] = useState(null);

    useEffect(() => { if (userId) cargarDatos(); }, [userId]);

    // ── Carga principal ───────────────────────────────────────────────────────
    const cargarDatos = async () => {
        setCargando(true);

        const { data: aulasRaw } = await supabase
            .from('aulas')
            .select('id, nombre')
            .eq('profesor_id', userId)
            .order('nombre', { ascending: true });

        const aulasData = aulasRaw || [];
        setAulas(aulasData);
        const aulaIds = aulasData.map(a => a.id);

        if (aulaIds.length === 0) { setTareas([]); setCargando(false); return; }

        const { data: alumnosData } = await supabase
            .from('aula_alumnos')
            .select('aula_id, alumno_id')
            .in('aula_id', aulaIds);

        const conteoAlumnosPorAula = {};
        (alumnosData || []).forEach(r => {
            conteoAlumnosPorAula[r.aula_id] = (conteoAlumnosPorAula[r.aula_id] || 0) + 1;
        });

        const aulasMap = {};
        aulasData.forEach(a => { aulasMap[a.id] = a.nombre; });

        const { data: tareasRaw } = await supabase
            .from('tareas')
            .select('id, titulo, descripcion, aula_id, fecha_limite, puntos_recompensa, material_referencia, created_at')
            .in('aula_id', aulaIds)
            .order('created_at', { ascending: false });

        const tareasData = tareasRaw || [];
        const tareaIds   = tareasData.map(t => t.id);

        if (tareaIds.length === 0) { setTareas([]); setCargando(false); return; }

        const { data: entregasData } = await supabase
            .from('entregas_proyectos')
            .select('id, tarea_id')
            .in('tarea_id', tareaIds);

        const entregasPorTarea = {};
        (entregasData || []).forEach(e => {
            entregasPorTarea[e.tarea_id] = (entregasPorTarea[e.tarea_id] || 0) + 1;
        });

        setTareas(tareasData.map(t => ({
            ...t,
            aulaNombre:    aulasMap[t.aula_id] || '',
            totalAlumnos:  conteoAlumnosPorAula[t.aula_id] || 0,
            totalEntregas: entregasPorTarea[t.id] || 0,
        })));

        setCargando(false);
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlerta({ tipo, mensaje });
        setTimeout(() => setAlerta(null), 4500);
    };

    // ── Resetear campos del formulario ────────────────────────────────────────
    const resetearCampos = () => {
        setTituloTarea(''); setDescripcionTarea('');
        setAulaSeleccionada(''); setFechaLimite('');
        setPuntosTarea('10'); setMaterialTarea('');
        setArchivoAdjunto(null);
    };

    // ── Abrir modal: crear ────────────────────────────────────────────────────
    const abrirModalCrear = () => {
        setTareaEditando(null);
        resetearCampos();
        setModalAbierto(true);
    };

    // ── Abrir modal: editar ───────────────────────────────────────────────────
    const abrirModalEditar = (tarea) => {
        setTareaEditando(tarea);
        setAulaSeleccionada(tarea.aula_id);
        setTituloTarea(tarea.titulo || '');
        setDescripcionTarea(tarea.descripcion || '');
        setFechaLimite(tarea.fecha_limite ? tarea.fecha_limite.slice(0, 10) : '');
        setPuntosTarea(String(tarea.puntos_recompensa ?? 10));
        setMaterialTarea(tarea.material_referencia || '');
        setModalAbierto(true);
    };

    // ── Cerrar modal crear/editar ─────────────────────────────────────────────
    const cerrarModal = () => {
        if (enviando) return;
        setModalAbierto(false);
        setTareaEditando(null);
    };

    // ── Guardar tarea (crear o editar) ────────────────────────────────────────
    const handleGuardarTarea = async (e) => {
        e.preventDefault();
        const titulo = tituloTarea.trim();
        if (!titulo || !aulaSeleccionada) return;

        setEnviando(true);

        // Subir archivo si existe, reemplaza el enlace de material
        let urlMaterial = materialTarea.trim() || null;
        if (archivoAdjunto) {
            setSubiendo(true);
            const nombreLimpio = archivoAdjunto.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `tareas/${Math.floor(Date.now() / 10000)}_${nombreLimpio}`;
            const { error: uploadError } = await supabase.storage
                .from('proyectos-blockids')
                .upload(fileName, archivoAdjunto);
            setSubiendo(false);
            if (uploadError) {
                mostrarAlerta('error', `Error al subir el archivo: ${uploadError.message}`);
                setEnviando(false);
                return;
            }
            const { data: { publicUrl } } = supabase.storage
                .from('proyectos-blockids')
                .getPublicUrl(fileName);
            urlMaterial = publicUrl;
        }

        const payload = {
            titulo,
            descripcion:         descripcionTarea.trim() || null,
            aula_id:             aulaSeleccionada,
            fecha_limite:        fechaLimite || null,
            puntos_recompensa:   parseInt(puntosTarea, 10) || 0,
            material_referencia: urlMaterial,
        };

        let error;
        if (tareaEditando) {
            ({ error } = await supabase
                .from('tareas')
                .update(payload)
                .eq('id', tareaEditando.id));
        } else {
            ({ error } = await supabase.from('tareas').insert([payload]));
        }

        setEnviando(false);

        if (error) {
            mostrarAlerta('error', `Error al guardar: ${error.message}`);
            return;
        }

        const accion = tareaEditando ? 'actualizada' : 'creada';
        mostrarAlerta('success', `¡Tarea "${titulo}" ${accion} correctamente!`);
        cerrarModal();
        cargarDatos();
    };

    // ── Eliminar tarea ────────────────────────────────────────────────────────
    const handleEliminarTarea = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta tarea? Se perderán las entregas asociadas.')) return;

        const { error } = await supabase.from('tareas').delete().eq('id', id);
        if (error) {
            mostrarAlerta('error', `Error al eliminar: ${error.message}`);
            return;
        }
        mostrarAlerta('success', 'Tarea eliminada correctamente.');
        cargarDatos();
    };

    // ── Modal revisión ────────────────────────────────────────────────────────
    const abrirRevision = (tarea) => {
        setTareaActiva(tarea);
        setListaEntregas([]);
        setCalificaciones({});
        setModalRevisionAbierto(true);
        cargarEntregasTarea(tarea.id);
    };

    const cerrarRevision = () => {
        if (calificandoId) return;
        setModalRevisionAbierto(false);
        setTareaActiva(null);
    };

    const cargarEntregasTarea = async (tareaId) => {
        setCargandoEntregas(true);
        const { data, error } = await supabase
            .from('entregas_proyectos')
            .select('id, estado, calificacion, updated_at, json_bloques, codigo_espacio_trabajo, perfiles!estudiante_id(nombre, apellido, username)')
            .eq('tarea_id', tareaId)
            .order('updated_at', { ascending: true });

        if (error) { console.error('[BLOCKIDS] Error cargando entregas:', error); setListaEntregas([]); }
        else        { setListaEntregas(data || []); }
        setCargandoEntregas(false);
    };

    const handleCalificar = async (entregaId, calificacion) => {
        if (!calificacion || calificandoId) return;
        setCalificandoId(entregaId);

        const { error } = await supabase
            .from('entregas_proyectos')
            .update({ estado: 'calificado', calificacion })
            .eq('id', entregaId);

        setCalificandoId(null);

        if (error) { mostrarAlerta('error', 'Error al guardar la calificación.'); return; }
        mostrarAlerta('success', '¡Calificación guardada!');
        cargarEntregasTarea(tareaActiva.id);
    };

    const nombreAlumno = (entrega) => {
        const p = entrega.perfiles;
        if (!p) return 'Alumno desconocido';
        return [p.nombre, p.apellido].filter(Boolean).join(' ') || p.username || 'Sin nombre';
    };

    // ── Tareas filtradas ──────────────────────────────────────────────────────
    const tareasFiltradas = filtroAula === 'todas'
        ? tareas
        : tareas.filter(t => t.aula_id === filtroAula);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* ══ Modal: Crear / Editar Tarea ══ */}
            {modalAbierto && (
                <div className={dash.modalOverlay} onClick={cerrarModal}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconCalendario} alt="" width="24" height="24" />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>
                                        {tareaEditando ? 'Editar Tarea' : 'Nueva Tarea'}
                                    </h3>
                                    <p className={dash.modalSubtitle}>
                                        {tareaEditando ? 'Modifica los datos de la actividad' : 'Asigna una actividad a uno de tus grupos'}
                                    </p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModal} disabled={enviando}>✕</button>
                        </div>

                        <form onSubmit={handleGuardarTarea}>
                            <div className={dash.modalBody}>
                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel} htmlFor="aula-tarea">Aula</label>
                                    <select
                                        id="aula-tarea"
                                        className={dash.fieldInput}
                                        value={aulaSeleccionada}
                                        onChange={e => setAulaSeleccionada(e.target.value)}
                                        disabled={enviando || !!tareaEditando}
                                        required
                                    >
                                        <option value="">Seleccionar aula...</option>
                                        {aulas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                    </select>
                                </div>

                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel} htmlFor="titulo-tarea">Título de la tarea</label>
                                    <input
                                        id="titulo-tarea" type="text" className={dash.fieldInput}
                                        placeholder="Ej. Mi primer videojuego"
                                        value={tituloTarea} onChange={e => setTituloTarea(e.target.value)}
                                        disabled={enviando} autoFocus maxLength={120} required
                                    />
                                </div>

                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel} htmlFor="desc-tarea">Descripción</label>
                                    <textarea
                                        id="desc-tarea" className={dash.fieldInput}
                                        placeholder="Instrucciones o detalles de la tarea..."
                                        value={descripcionTarea} onChange={e => setDescripcionTarea(e.target.value)}
                                        disabled={enviando} rows={3} maxLength={400}
                                        style={{ resize: 'vertical', minHeight: '76px' }}
                                    />
                                </div>

                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel} htmlFor="material-tarea">Material de apoyo / Enlace </label>
                                    <input
                                        id="material-tarea" type="text" className={dash.fieldInput}
                                        placeholder="Ej. Enlace a YouTube o 'Lee la pág. 12'"
                                        value={materialTarea} onChange={e => setMaterialTarea(e.target.value)}
                                        disabled={enviando} maxLength={255}
                                    />
                                </div>

                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel}>O adjunta un archivo (PDF, SB3, DOCX…)</label>
                                    <input
                                        type="file"
                                        className={`${dash.fieldInput} ${styles.inputArchivo}`}
                                        accept=".pdf,.docx,.doc,.sb3,.sb2,.txt,.png,.jpg"
                                        onChange={e => setArchivoAdjunto(e.target.files[0] || null)}
                                        disabled={enviando}
                                    />
                                    {archivoAdjunto && (
                                        <span className={styles.archivoSeleccionado}>
                                            <img src={iconArchivoAdjunto} alt="" className={styles.archivoIcon} />
                                            {archivoAdjunto.name}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div className={dash.fieldGroup}>
                                        <label className={dash.fieldLabel} htmlFor="puntos-tarea">Puntos (XP)</label>
                                        <input
                                            id="puntos-tarea" type="number" className={dash.fieldInput}
                                            placeholder="10" min="0" max="1000"
                                            value={puntosTarea} onChange={e => setPuntosTarea(e.target.value)}
                                            disabled={enviando} required
                                        />
                                    </div>
                                    <div className={dash.fieldGroup}>
                                        <label className={dash.fieldLabel} htmlFor="fecha-tarea">Fecha límite </label>
                                        <input
                                            id="fecha-tarea" type="date" className={dash.fieldInput}
                                            value={fechaLimite} onChange={e => setFechaLimite(e.target.value)}
                                            disabled={enviando}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={dash.modalFooter}>
                                <button type="button" className={dash.btnCancelar} onClick={cerrarModal} disabled={enviando}>
                                    Cancelar
                                </button>
                                <button
                                    type="submit" className={dash.btnCrearConfirm}
                                    disabled={enviando || !tituloTarea.trim() || !aulaSeleccionada}
                                >
                                    {subiendo
                                        ? <><span className={dash.btnSpinner} />Subiendo archivo...</>
                                        : enviando
                                            ? <><span className={dash.btnSpinner} />{tareaEditando ? 'Guardando...' : 'Creando...'}</>
                                            : tareaEditando ? '✓ Guardar Cambios' : '✓ Crear Tarea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Revisión de Entregas ══ */}
            {modalRevisionAbierto && tareaActiva && (
                <div className={dash.modalOverlay} onClick={cerrarRevision}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '100%' }}>
                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconCalendario} alt="Revisar" style={{ width: '22px', height: '22px', opacity: 0.8 }} />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Revisar Entregas</h3>
                                    <p className={dash.modalSubtitle}>{tareaActiva.titulo}</p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarRevision} disabled={!!calificandoId}>✕</button>
                        </div>

                        <div className={dash.modalBody} style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            {cargandoEntregas ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>
                                    Cargando entregas...
                                </p>
                            ) : listaEntregas.length === 0 ? (
                                <div className={styles.sinEntregas}>
                                    <img src={iconCalendario} alt="Vacío" style={{ width: '40px', opacity: 0.3, marginBottom: '10px' }} />
                                    <p className={styles.sinEntregasTexto}>Aún no hay entregas para esta tarea.</p>
                                </div>
                            ) : (
                                <div className={styles.listaEntregas}>
                                    {listaEntregas.map(entrega => {
                                        const yaCalificado   = entrega.estado === 'calificado';
                                        const estrellaActual = calificaciones[entrega.id] ?? 0;
                                        return (
                                            <div key={entrega.id} className={styles.entregaRow}>
                                                <div className={styles.entregaAvatar}>
                                                    {nombreAlumno(entrega).charAt(0).toUpperCase()}
                                                </div>

                                                <div className={styles.entregaInfo}>
                                                    {/* Fila 1: nombre completo */}
                                                    <p className={styles.entregaNombre}>{nombreAlumno(entrega)}</p>

                                                    {/* Fila 2: input numérico + botón calificar */}
                                                    <div className={styles.entregaAcciones}>
                                                        <div className={styles.inputCalificacionWrap}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={tareaActiva?.puntos_recompensa || 100}
                                                                className={styles.inputCalificacion}
                                                                value={calificaciones[entrega.id] ?? entrega.calificacion ?? ''}
                                                                onChange={e => {
                                                                    const maxPts = tareaActiva?.puntos_recompensa || 100;
                                                                    const v = Math.min(maxPts, Math.max(0, parseInt(e.target.value, 10) || 0));
                                                                    setCalificaciones(prev => ({ ...prev, [entrega.id]: v }));
                                                                }}
                                                                disabled={calificandoId === entrega.id}
                                                            />
                                                            <span className={styles.maxPuntos}>
                                                                / {tareaActiva?.puntos_recompensa || 100} XP
                                                            </span>
                                                        </div>
                                                        <button
                                                            className={`${styles.btnCalificar} ${(calificaciones[entrega.id] != null || entrega.calificacion != null) ? styles.btnCalificarActivo : styles.btnCalificarInactivo}`}
                                                            onClick={() => handleCalificar(entrega.id, calificaciones[entrega.id] ?? entrega.calificacion)}
                                                            disabled={
                                                                calificandoId === entrega.id ||
                                                                (calificaciones[entrega.id] == null && entrega.calificacion == null) ||
                                                                (yaCalificado && calificaciones[entrega.id] === undefined)
                                                            }
                                                        >
                                                            {calificandoId === entrega.id
                                                                ? '...'
                                                                : yaCalificado ? 'Actualizar Nota' : 'Calificar'}
                                                        </button>
                                                    </div>

                                                    {/* Fila 3: badge de estado + probar entrega */}
                                                    <div className={styles.entregaMeta}>
                                                        <span className={yaCalificado ? styles.badgeCalificado : styles.badgePendiente}>
                                                            {yaCalificado ? 'Calificado' : 'Pendiente'}
                                                        </span>
                                                        {(entrega.json_bloques || entrega.codigo_espacio_trabajo) && (
                                                            <a
                                                                href={`/entorno?entregaId=${entrega.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={styles.btnProbarEntrega}
                                                            >
                                                                Probar Entrega
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className={dash.modalFooter}>
                            <span className={styles.revisionResumen}>
                                {listaEntregas.filter(e => e.estado === 'calificado').length}/{listaEntregas.length} calificadas
                            </span>
                            <button className={dash.btnCancelar} onClick={cerrarRevision} disabled={!!calificandoId}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Alerta ══ */}
            {alerta && (
                <div className={`${dash.alert} ${alerta.tipo === 'success' ? dash.alertSuccess : dash.alertError}`}>
                    {alerta.mensaje}
                </div>
            )}

            {/* ══ Header ══ */}
            <div className={dash.vistaHeader}>
                <div>
                    <h2 className={dash.vistaTitle}>Tareas</h2>
                    <p className={dash.vistaSubtitle}>
                        {tareasFiltradas.length} tarea{tareasFiltradas.length !== 1 ? 's' : ''}
                        {filtroAula !== 'todas' && ` · ${aulas.find(a => a.id === filtroAula)?.nombre}`}
                    </p>
                </div>
                {aulas.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {aulas.length > 1 && (
                            <select
                                className={styles.filtroSelect}
                                value={filtroAula}
                                onChange={e => setFiltroAula(e.target.value)}
                            >
                                <option value="todas">Todas las aulas</option>
                                {aulas.map(a => (
                                    <option key={a.id} value={a.id}>{a.nombre}</option>
                                ))}
                            </select>
                        )}
                        <button
                            className={styles.btnProbarEntorno}
                            onClick={() => history.push('/entorno')}
                        >
                            <img src={iconVideo} alt="" />
                            Probar Entorno
                        </button>
                        <button className={dash.btnNuevaTarea} onClick={abrirModalCrear}>
                            + Nueva Tarea
                        </button>
                    </div>
                )}
            </div>

            {/* ══ Contenido ══ */}
            {cargando ? (
                <div className={dash.loadingAulas}>Cargando tareas...</div>
            ) : aulas.length === 0 ? (
                <div className={dash.emptyAula}>
                    <img src={iconCalendario} alt="" className={dash.emptyAulaIcon} />
                    <p className={dash.emptyAulaTitle}>Primero crea un aula</p>
                    <p className={dash.emptyAulaDesc}>Para agregar tareas necesitas tener al menos un aula creada.</p>
                </div>
            ) : tareas.length === 0 ? (
                <div className={dash.emptyAula}>
                    <img src={iconCalendario} alt="" className={dash.emptyAulaIcon} />
                    <p className={dash.emptyAulaTitle}>Aún no hay tareas</p>
                    <p className={dash.emptyAulaDesc}>Crea tu primera tarea haciendo clic en "+ Nueva Tarea".</p>
                </div>
            ) : tareasFiltradas.length === 0 ? (
                <div className={dash.emptyAula}>
                    <img src={iconCalendario} alt="" className={dash.emptyAulaIcon} />
                    <p className={dash.emptyAulaTitle}>Sin tareas en esta aula</p>
                    <p className={dash.emptyAulaDesc}>No hay tareas asignadas al aula seleccionada.</p>
                </div>
            ) : (
                <div className={dash.tareasGrid}>
                    {tareasFiltradas.map((tarea, i) => {
                        const pct = tarea.totalAlumnos > 0
                            ? Math.round((tarea.totalEntregas / tarea.totalAlumnos) * 100)
                            : 0;
                        return (
                            <div key={tarea.id} className={dash.tareaCardFull} style={{ animationDelay: `${i * 0.06}s` }}>

                                {/* Cabecera: badge + fecha + acciones */}
                                <div className={styles.cardHeaderRow}>
                                    <div className={styles.cardHeaderLeft}>
                                        <span className={dash.tareaAulaBadge}>{tarea.aulaNombre}</span>
                                        {tarea.fecha_limite && (
                                            <span className={dash.tareaFechaLimite}>
                                                Límite: {formatearFecha(tarea.fecha_limite)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.cardAcciones}>
                                        <button
                                            className={`${styles.btnAccionTarea} ${styles.btnEditarTarea}`}
                                            title="Editar tarea"
                                            onClick={() => abrirModalEditar(tarea)}
                                        >
                                            <img src={iconConfig} alt="Editar" />
                                        </button>
                                        <button
                                            className={`${styles.btnAccionTarea} ${styles.btnEliminarTarea}`}
                                            title="Eliminar tarea"
                                            onClick={() => handleEliminarTarea(tarea.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <p className={dash.tareaCardFullTitle}>{tarea.titulo}</p>
                                {tarea.descripcion && (
                                    <p className={dash.tareaCardFullDesc}>{tarea.descripcion}</p>
                                )}
                                {tarea.material_referencia && (
                                    tarea.material_referencia.startsWith('http') ? (
                                        <a
                                            href={tarea.material_referencia}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.linkMaterial}
                                        >
                                            <span style={{ textDecoration: 'underline' }}>
                                                {tarea.material_referencia.includes('supabase.co')
                                                    ? 'Descargar Archivo Adjunto'
                                                    : 'Abrir Enlace de Apoyo'}
                                            </span>
                                        </a>
                                    ) : (
                                        <div className={styles.notaMaterial}>
                                            Nota: {tarea.material_referencia}
                                        </div>
                                    )
                                )}

                                <div className={dash.tareaInfo}>
                                    <span />
                                    <span className={dash.tareaEntregas}>
                                        {tarea.totalEntregas}/{tarea.totalAlumnos} entregas
                                    </span>
                                </div>

                                <div className={dash.progressBar}>
                                    <div className={dash.progressFill} style={{ width: `${pct}%` }} />
                                </div>

                                {tarea.totalEntregas > 0 && (
                                    <button
                                        className={styles.btnRevisar}
                                        onClick={() => abrirRevision(tarea)}
                                    >
                                        Revisar Entregas
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VistaTareas;

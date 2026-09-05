import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import iconCurso   from '../../../assets/iconos-ui/ui-curso.svg';
import iconInicio  from '../../../assets/iconos-ui/ui-inicio.svg';
import iconConfig  from '../../../assets/iconos-ui/ui-configuracion.svg';
import dash   from '../Dashboard.css';
import styles from './VistaMisAulas.css';

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const generarCodigoAula = () => {
    let s = '';
    for (let i = 0; i < 4; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
    return `BLK-${s}`;
};

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const VistaMisAulas = ({ userId, escuelaId }) => {
    const [aulas,          setAulas]          = useState([]);
    const [cargandoAulas,  setCargandoAulas]  = useState(false);
    const [modalAbierto,   setModalAbierto]   = useState(false);
    const [nombreAula,     setNombreAula]     = useState('');
    const [enviando,       setEnviando]       = useState(false);
    const [alerta,         setAlerta]         = useState(null);

    const [modalEditarAbierto,   setModalEditarAbierto]   = useState(false);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [aulaSeleccionada,     setAulaSeleccionada]     = useState(null);
    const [nuevoNombreAula,      setNuevoNombreAula]      = useState('');

    useEffect(() => { if (userId) cargarAulas(); }, [userId]);

    // ── Carga de aulas con conteo de alumnos ──────────────────────────────────
    const cargarAulas = async () => {
        setCargandoAulas(true);

        const { data: aulasRaw } = await supabase
            .from('aulas')
            .select('id, nombre, codigo_aula, created_at')
            .eq('profesor_id', userId)
            .order('created_at', { ascending: false });

        const aulasBase = aulasRaw || [];
        const aulaIds   = aulasBase.map(a => a.id);

        if (aulaIds.length > 0) {
            const { data: alumnosData } = await supabase
                .from('aula_alumnos')
                .select('aula_id, alumno_id')
                .in('aula_id', aulaIds);

            const conteoMap = {};
            (alumnosData || []).forEach(r => {
                conteoMap[r.aula_id] = (conteoMap[r.aula_id] || 0) + 1;
            });
            setAulas(aulasBase.map(a => ({ ...a, totalAlumnos: conteoMap[a.id] || 0 })));
        } else {
            setAulas([]);
        }

        setCargandoAulas(false);
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlerta({ tipo, mensaje });
        setTimeout(() => setAlerta(null), 4500);
    };

    // ── Modal: Crear ──────────────────────────────────────────────────────────
    const abrirModal  = () => { setNombreAula(''); setModalAbierto(true); };
    const cerrarModal = () => { if (enviando) return; setModalAbierto(false); setNombreAula(''); };

    // ── Modal: Editar ─────────────────────────────────────────────────────────
    const abrirModalEditar = (aula) => {
        setAulaSeleccionada(aula);
        setNuevoNombreAula(aula.nombre);
        setModalEditarAbierto(true);
    };
    const cerrarModalEditar = () => {
        if (enviando) return;
        setModalEditarAbierto(false);
        setAulaSeleccionada(null);
        setNuevoNombreAula('');
    };

    // ── Modal: Eliminar ───────────────────────────────────────────────────────
    const abrirModalEliminar  = (aula) => { setAulaSeleccionada(aula); setModalEliminarAbierto(true); };
    const cerrarModalEliminar = () => {
        if (enviando) return;
        setModalEliminarAbierto(false);
        setAulaSeleccionada(null);
    };

    // ── CRUD handlers ─────────────────────────────────────────────────────────
    const handleCrearAula = async (e) => {
        e.preventDefault();
        const nombre = nombreAula.trim();
        if (!nombre) return;

        setEnviando(true);
        const codigoAula = generarCodigoAula();

        const { error } = await supabase.from('aulas').insert([{
            nombre,
            profesor_id: userId,
            escuela_id:  escuelaId,
            codigo_aula: codigoAula,
        }]);
        setEnviando(false);

        if (error) { mostrarAlerta('error', `Error al crear el aula: ${error.message}`); return; }
        cerrarModal();
        mostrarAlerta('success', `¡Aula "${nombre}" creada! Código: ${codigoAula}`);
        cargarAulas();
    };

    const handleEditarAula = async (e) => {
        e.preventDefault();
        const nombre = nuevoNombreAula.trim();
        if (!nombre || !aulaSeleccionada) return;

        setEnviando(true);
        const { error } = await supabase
            .from('aulas')
            .update({ nombre })
            .eq('id', aulaSeleccionada.id);
        setEnviando(false);

        if (error) { mostrarAlerta('error', `Error al editar el aula: ${error.message}`); return; }
        cerrarModalEditar();
        mostrarAlerta('success', `¡Aula renombrada a "${nombre}" correctamente!`);
        cargarAulas();
    };

    const handleEliminarAula = async () => {
        if (!aulaSeleccionada) return;

        setEnviando(true);
        const { error } = await supabase
            .from('aulas')
            .delete()
            .eq('id', aulaSeleccionada.id);
        setEnviando(false);

        if (error) { mostrarAlerta('error', `Error al eliminar el aula: ${error.message}`); return; }
        cerrarModalEliminar();
        mostrarAlerta('success', `Aula "${aulaSeleccionada.nombre}" eliminada.`);
        cargarAulas();
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* ══ Modal: Crear Aula ══ */}
            {modalAbierto && (
                <div className={dash.modalOverlay} onClick={cerrarModal}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconCurso} alt="" width="24" height="24" />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Nueva Aula</h3>
                                    <p className={dash.modalSubtitle}>Se generará un código único automáticamente</p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModal} disabled={enviando}>✕</button>
                        </div>
                        <form onSubmit={handleCrearAula}>
                            <div className={dash.modalBody}>
                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel} htmlFor="nombre-aula">Nombre del Aula</label>
                                    <input
                                        id="nombre-aula"
                                        type="text"
                                        className={dash.fieldInput}
                                        placeholder="Ej. 6to A, Taller de Programación"
                                        value={nombreAula}
                                        onChange={e => setNombreAula(e.target.value)}
                                        disabled={enviando}
                                        autoFocus
                                        maxLength={60}
                                    />
                                </div>
                            </div>
                            <div className={dash.modalFooter}>
                                <button type="button" className={dash.btnCancelar} onClick={cerrarModal} disabled={enviando}>
                                    Cancelar
                                </button>
                                <button type="submit" className={dash.btnCrearConfirm} disabled={enviando || !nombreAula.trim()}>
                                    {enviando ? <><span className={dash.btnSpinner} />Creando...</> : '✓ Crear Aula'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Editar Aula ══ */}
            {modalEditarAbierto && (
                <div className={dash.modalOverlay} onClick={cerrarModalEditar}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconCurso} alt="" width="24" height="24" />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Editar Aula</h3>
                                    <p className={dash.modalSubtitle}>Cambia el nombre del aula</p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModalEditar} disabled={enviando}>✕</button>
                        </div>
                        <form onSubmit={handleEditarAula}>
                            <div className={dash.modalBody}>
                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel} htmlFor="editar-nombre-aula">Nombre del Aula</label>
                                    <input
                                        id="editar-nombre-aula"
                                        type="text"
                                        className={dash.fieldInput}
                                        placeholder="Nuevo nombre del aula"
                                        value={nuevoNombreAula}
                                        onChange={e => setNuevoNombreAula(e.target.value)}
                                        disabled={enviando}
                                        autoFocus
                                        maxLength={60}
                                    />
                                </div>
                            </div>
                            <div className={dash.modalFooter}>
                                <button type="button" className={dash.btnCancelar} onClick={cerrarModalEditar} disabled={enviando}>
                                    Cancelar
                                </button>
                                <button type="submit" className={dash.btnCrearConfirm} disabled={enviando || !nuevoNombreAula.trim()}>
                                    {enviando ? <><span className={dash.btnSpinner} />Guardando...</> : '✓ Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Confirmar Eliminación ══ */}
            {modalEliminarAbierto && aulaSeleccionada && (
                <div className={dash.modalOverlay} onClick={cerrarModalEliminar}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconCurso} alt="" width="24" height="24" />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Eliminar Aula</h3>
                                    <p className={dash.modalSubtitle}>Esta acción no se puede deshacer</p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModalEliminar} disabled={enviando}>✕</button>
                        </div>
                        <div className={dash.modalBody}>
                            <p className={dash.fieldLabel}>
                                ¿Estás seguro de eliminar el aula <strong>"{aulaSeleccionada.nombre}"</strong>?
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className={dash.modalFooter}>
                            <button type="button" className={dash.btnCancelar} onClick={cerrarModalEliminar} disabled={enviando}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={styles.btnEliminarConfirm}
                                onClick={handleEliminarAula}
                                disabled={enviando}
                            >
                                {enviando ? <><span className={dash.btnSpinner} />Eliminando...</> : '✕ Eliminar Aula'}
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

            {/* ══ Lista de aulas ══ */}
            <div className={dash.columnCard}>
                <div className={dash.columnHeader}>
                    <h2 className={dash.columnTitle}>Mis Aulas</h2>
                    <span className={dash.countBadge}>{aulas.length} aula{aulas.length !== 1 ? 's' : ''}</span>
                </div>

                {cargandoAulas ? (
                    <div className={dash.loadingAulas}>Cargando aulas...</div>
                ) : aulas.length === 0 ? (
                    <div className={dash.emptyAula}>
                        <img src={iconCurso} alt="" className={dash.emptyAulaIcon} />
                        <p className={dash.emptyAulaTitle}>Aún no tienes aulas</p>
                        <p className={dash.emptyAulaDesc}>Crea tu primera aula y comienza a gestionar a tus alumnos</p>
                    </div>
                ) : (
                    <div className={styles.aulasList}>
                        {aulas.map((aula, i) => (
                            <div
                                key={aula.id}
                                className={styles.aulaRow}
                                style={{ animationDelay: `${i * 0.07}s` }}
                            >
                                <img src={iconInicio} alt="" className={styles.aulaRowIcon} />
                                <div className={styles.aulaRowInfo}>
                                    <span className={styles.aulaRowNombre}>{aula.nombre}</span>
                                    <span className={styles.aulaRowMeta}>
                                        <span className={styles.aulaRowCodigo}>{aula.codigo_aula}</span>
                                        <span className={styles.aulaRowAlumnos}>
                                            {aula.totalAlumnos} alumno{aula.totalAlumnos !== 1 ? 's' : ''}
                                        </span>
                                        <span className={styles.aulaRowFecha}>{formatearFecha(aula.created_at)}</span>
                                    </span>
                                </div>
                                <div className={styles.aulaRowActions} onClick={e => e.stopPropagation()}>
                                    <button
                                        className={`${styles.btnAccionAula} ${styles.btnEditarAula}`}
                                        title="Editar aula"
                                        onClick={(e) => { e.stopPropagation(); abrirModalEditar(aula); }}
                                    >
                                        <img src={iconConfig} alt="Editar" />
                                    </button>
                                    <button
                                        className={`${styles.btnAccionAula} ${styles.btnEliminarAula}`}
                                        title="Eliminar aula"
                                        onClick={(e) => { e.stopPropagation(); abrirModalEliminar(aula); }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className={styles.btnNuevaAulaBottom} onClick={abrirModal}>
                    + Nueva Aula
                </button>
            </div>
        </div>
    );
};

export default VistaMisAulas;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import iconCurso  from '../../../assets/iconos-ui/ui-curso.svg';
import iconBuscar from '../../../assets/iconos-ui/ui-buscar.svg';
import iconConfig from '../../../assets/iconos-ui/ui-configuracion.svg';
import styles from './TablasAdmin.css';

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const VistaAulas = ({ perfil, esSuperAdmin, onNuevaAula, refreshKey, mostrarAlerta }) => {
    const [aulas, setAulas]             = useState([]);
    const [cargando, setCargando]       = useState(true);
    const [busqueda, setBusqueda]       = useState('');
    const [escuelas, setEscuelas]       = useState([]);
    const [filtroEscuela, setFiltroEscuela] = useState('todas');

    // ── Estado modal editar ───────────────────────────────────────────────────
    const [editando, setEditando]   = useState(null);
    const [fNombre, setFNombre]     = useState('');
    const [enviando, setEnviando]   = useState(false);

    const cargar = async () => {
        setCargando(true);
        let query = supabase
            .from('aulas')
            .select(`
                id, nombre, codigo_aula, created_at, escuela_id,
                escuelas(nombre),
                profesor:perfiles!aulas_profesor_id_fkey(username, nombre, apellido)
            `)
            .order('created_at', { ascending: false });

        if (!esSuperAdmin && perfil?.escuela_id) {
            query = query.eq('escuela_id', perfil.escuela_id);
        }

        const [{ data, error }, { data: escData }] = await Promise.all([
            query,
            esSuperAdmin
                ? supabase.from('escuelas').select('id, nombre').order('nombre')
                : Promise.resolve({ data: [] }),
        ]);

        if (!error) setAulas(data || []);
        setEscuelas(escData || []);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, [perfil, esSuperAdmin, refreshKey]);

    // ── Abrir / cerrar modal ──────────────────────────────────────────────────
    const abrirEditar = (a) => {
        setEditando(a);
        setFNombre(a.nombre || '');
    };

    const cerrarEditar = () => {
        setEditando(null);
        setFNombre('');
    };

    // ── Guardar edición ───────────────────────────────────────────────────────
    const handleGuardar = async () => {
        if (!editando) return;
        if (!fNombre.trim()) return mostrarAlerta('error', 'El nombre del aula no puede estar vacío.');
        setEnviando(true);
        const { error } = await supabase
            .from('aulas')
            .update({ nombre: fNombre.trim() })
            .eq('id', editando.id);
        setEnviando(false);

        if (error) {
            mostrarAlerta('error', `Error al actualizar: ${error.message}`);
        } else {
            mostrarAlerta('success', `Aula "${fNombre.trim()}" actualizada.`);
            cerrarEditar();
            cargar();
        }
    };

    // ── Eliminar aula ─────────────────────────────────────────────────────────
    const handleEliminar = async (a) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro de forma permanente?')) return;
        const { error } = await supabase.from('aulas').delete().eq('id', a.id);
        if (error) {
            if (error.code === '23503' || error.message?.toLowerCase().includes('foreign key')) {
                mostrarAlerta('error', 'No se puede eliminar. Este registro está siendo utilizado en otras partes del sistema (ej. tareas, entregas, o mensajes).');
            } else {
                mostrarAlerta('error', `Error al eliminar: ${error.message}`);
            }
        } else {
            mostrarAlerta('success', `Aula "${a.nombre}" eliminada.`);
            cargar();
        }
    };

    const filtradas = aulas.filter(a => {
        const coincideTexto   = `${a.nombre} ${a.codigo_aula || ''}`.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEscuela = filtroEscuela === 'todas' || a.escuelas?.nombre === filtroEscuela;
        return coincideTexto && coincideEscuela;
    });

    return (
        <div className={styles.vistaContainer}>

            {/* ── Modal editar aula ── */}
            {editando && (
                <div className={styles.modalOverlay} onClick={cerrarEditar}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <p className={styles.modalTitle}>Editar Aula</p>
                                <p className={styles.modalSubtitle}>Código: {editando.codigo_aula || '—'}</p>
                            </div>
                            <button className={styles.modalClose} onClick={cerrarEditar}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Nombre del Aula</label>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Ej. 6to A"
                                    value={fNombre}
                                    onChange={e => setFNombre(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancelarModal} onClick={cerrarEditar} disabled={enviando}>
                                Cancelar
                            </button>
                            <button className={styles.btnGuardarModal} onClick={handleGuardar} disabled={enviando}>
                                {enviando ? <><span className={styles.btnSpinnerModal} />Guardando...</> : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Encabezado ── */}
            <div className={styles.vistaHeader}>
                <div>
                    <h1 className={styles.vistaTitulo}>Directorio de Aulas</h1>
                    <p className={styles.vistaSubtitulo}>
                        {cargando
                            ? 'Cargando...'
                            : `${filtradas.length} aula${filtradas.length !== 1 ? 's' : ''} encontrada${filtradas.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.searchWrap}>
                        <img src={iconBuscar} alt="" className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar aula o código..."
                            className={styles.searchInput}
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>
                    {esSuperAdmin && escuelas.length > 0 && (
                        <select
                            className={styles.searchInput}
                            value={filtroEscuela}
                            onChange={e => setFiltroEscuela(e.target.value)}
                        >
                            <option value="todas">Todas las escuelas</option>
                            {escuelas.map(esc => (
                                <option key={esc.id} value={esc.nombre}>{esc.nombre}</option>
                            ))}
                        </select>
                    )}
                    {onNuevaAula && (
                        <button className={styles.btnNuevo} onClick={onNuevaAula}>
                            + Nueva Aula
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tabla ── */}
            <div className={styles.tableWrap}>
                {cargando ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <span>Cargando aulas...</span>
                    </div>
                ) : filtradas.length === 0 ? (
                    <div className={styles.emptyState}>
                        <img src={iconCurso} alt="" className={styles.emptyIcon} />
                        <p className={styles.emptyText}>
                            {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay aulas registradas aún.'}
                        </p>
                    </div>
                ) : (
                    <table className={styles.tabla}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Nombre del Aula</th>
                                <th className={styles.th}>Código</th>
                                <th className={styles.th}>Profesor</th>
                                {esSuperAdmin && <th className={styles.th}>Escuela</th>}
                                <th className={styles.th}>Creación</th>
                                <th className={styles.th}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtradas.map((a, i) => {
                                const profe = a.profesor;
                                const nombreProfe = profe
                                    ? (profe.nombre && profe.apellido
                                        ? `${profe.nombre} ${profe.apellido}`
                                        : `@${profe.username}`)
                                    : '—';
                                return (
                                    <tr
                                        key={a.id}
                                        className={styles.tr}
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                    >
                                        <td className={styles.td}>
                                            <div className={styles.aulaNameCell}>
                                                <div className={styles.aulaIcon}>
                                                    <img src={iconCurso} alt="" width="15" />
                                                </div>
                                                <span className={styles.nombreCompleto}>{a.nombre}</span>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.codigoBadge}>
                                                {a.codigo_aula || '—'}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.escuelaNombre}>{nombreProfe}</span>
                                        </td>
                                        {esSuperAdmin && (
                                            <td className={styles.td}>
                                                <span className={styles.escuelaNombre}>
                                                    {a.escuelas?.nombre || '—'}
                                                </span>
                                            </td>
                                        )}
                                        <td className={styles.td}>
                                            <span className={styles.fechaText}>{formatearFecha(a.created_at)}</span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.accionesCell}>
                                                <button
                                                    className={`${styles.btnAccion} ${styles.btnEditar}`}
                                                    title="Editar"
                                                    onClick={() => abrirEditar(a)}
                                                >
                                                    <img src={iconConfig} alt="Editar" />
                                                </button>
                                                <button
                                                    className={`${styles.btnAccion} ${styles.btnEliminar}`}
                                                    title="Eliminar"
                                                    onClick={() => handleEliminar(a)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default VistaAulas;

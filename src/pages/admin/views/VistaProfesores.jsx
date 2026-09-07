import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import iconPadres  from '../../../assets/iconos-ui/ui-padres.svg';
import iconBuscar  from '../../../assets/iconos-ui/ui-buscar.svg';
import iconConfig  from '../../../assets/iconos-ui/ui-configuracion.svg';
import styles from './TablasAdmin.css';

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const VistaProfesores = ({ perfil, esSuperAdmin, refreshKey, mostrarAlerta }) => {
    const [profesores, setProfesores]       = useState([]);
    const [cargando, setCargando]           = useState(true);
    const [busqueda, setBusqueda]           = useState('');
    const [escuelas, setEscuelas]           = useState([]);
    const [filtroEscuela, setFiltroEscuela] = useState('todas');

    // ── Estado modal editar ───────────────────────────────────────────────────
    const [editando, setEditando]       = useState(null);
    const [fNombre, setFNombre]                   = useState('');
    const [fApellidoPaterno, setFApellidoPaterno] = useState('');
    const [fApellidoMaterno, setFApellidoMaterno] = useState('');
    const [enviando, setEnviando]                 = useState(false);

    const cargar = async () => {
        setCargando(true);
        let query = supabase
            .from('perfiles')
            .select('id, username, nombre, apellido, apellido_paterno, apellido_materno, escuela_id, created_at, escuelas(nombre)')
            .eq('rol', 'profesor')
            .eq('activo', true)
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

        if (!error) setProfesores(data || []);
        setEscuelas(escData || []);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, [perfil, esSuperAdmin, refreshKey]);

    // ── Abrir / cerrar modal ──────────────────────────────────────────────────
    const abrirEditar = (p) => {
        setEditando(p);
        setFNombre(p.nombre || '');
        setFApellidoPaterno(p.apellido_paterno || '');
        setFApellidoMaterno(p.apellido_materno || '');
    };

    const cerrarEditar = () => {
        setEditando(null);
        setFNombre('');
        setFApellidoPaterno('');
        setFApellidoMaterno('');
    };

    // ── Guardar edición ───────────────────────────────────────────────────────
    const handleGuardar = async () => {
        if (!editando) return;
        setEnviando(true);
        const { error } = await supabase
            .from('perfiles')
            .update({
                nombre:           fNombre.trim() || null,
                apellido_paterno: fApellidoPaterno.trim() || null,
                apellido_materno: fApellidoMaterno.trim() || null,
            })
            .eq('id', editando.id);
        setEnviando(false);

        if (error) {
            mostrarAlerta('error', `Error al actualizar: ${error.message}`);
        } else {
            mostrarAlerta('success', `Profesor @${editando.username} actualizado.`);
            cerrarEditar();
            cargar();
        }
    };

    // ── Desactivar profesor (Soft Delete) ────────────────────────────────────
    const handleEliminar = async (p) => {
        if (!window.confirm('¿Estás seguro de desactivar a este usuario? Perderá su acceso a la plataforma, pero sus datos se conservarán.')) return;
        const { data: filas, error } = await supabase
            .from('perfiles')
            .update({ activo: false })
            .eq('id', p.id)
            .select('id');
        if (error) {
            console.error('ERROR al desactivar profesor:', error);
            mostrarAlerta('error', `Error al desactivar: ${error.message}`);
        } else if (!filas || filas.length === 0) {
            mostrarAlerta('error', 'No se pudo desactivar el profesor. Verifica que tienes permisos.');
        } else {
            mostrarAlerta('success', `Profesor @${p.username} desactivado. Sus datos se han conservado.`);
            cargar();
        }
    };

    const filtrados = profesores.filter(p => {
        const texto = `${p.username} ${p.nombre || ''} ${p.apellido || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.toLowerCase();
        const coincideTexto   = texto.includes(busqueda.toLowerCase());
        const coincideEscuela = filtroEscuela === 'todas' || p.escuelas?.nombre === filtroEscuela;
        return coincideTexto && coincideEscuela;
    });

    return (
        <div className={styles.vistaContainer}>

            {/* ── Modal editar profesor ── */}
            {editando && (
                <div className={styles.modalOverlay} onClick={cerrarEditar}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <p className={styles.modalTitle}>Editar Profesor</p>
                                <p className={styles.modalSubtitle}>@{editando.username}</p>
                            </div>
                            <button className={styles.modalClose} onClick={cerrarEditar}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Nombre</label>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Nombre(s) del profesor"
                                    value={fNombre}
                                    onChange={e => setFNombre(e.target.value)}
                                />
                            </div>
                            <div className={styles.modalRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Apellido Paterno</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        placeholder="Apellido Paterno"
                                        value={fApellidoPaterno}
                                        onChange={e => setFApellidoPaterno(e.target.value)}
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Apellido Materno</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        placeholder="Apellido Materno"
                                        value={fApellidoMaterno}
                                        onChange={e => setFApellidoMaterno(e.target.value)}
                                    />
                                </div>
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
                    <h1 className={styles.vistaTitulo}>Directorio de Profesores</h1>
                    <p className={styles.vistaSubtitulo}>
                        {cargando
                            ? 'Cargando...'
                            : `${filtrados.length} profesor${filtrados.length !== 1 ? 'es' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.searchWrap}>
                        <img src={iconBuscar} alt="" className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar profesor..."
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
                </div>
            </div>

            {/* ── Tabla ── */}
            <div className={styles.tableWrap}>
                {cargando ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <span>Cargando profesores...</span>
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className={styles.emptyState}>
                        <img src={iconPadres} alt="" className={styles.emptyIcon} />
                        <p className={styles.emptyText}>
                            {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay profesores registrados aún.'}
                        </p>
                    </div>
                ) : (
                    <table className={styles.tabla}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Nombre</th>
                                <th className={styles.th}>Usuario</th>
                                {esSuperAdmin && <th className={styles.th}>Escuela</th>}
                                <th className={styles.th}>Registro</th>
                                <th className={styles.th}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((p, i) => {
                                const inicial = (p.nombre || p.username)?.[0]?.toUpperCase() || '?';
                                const nombreCompleto = [p.nombre, p.apellido_paterno, p.apellido_materno]
                                    .filter(Boolean).join(' ') || '—';
                                return (
                                    <tr
                                        key={p.id}
                                        className={styles.tr}
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                    >
                                        <td className={styles.td}>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar}>{inicial}</div>
                                                <span className={styles.nombreCompleto}>{nombreCompleto}</span>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.usernameTag}>@{p.username}</span>
                                        </td>
                                        {esSuperAdmin && (
                                            <td className={styles.td}>
                                                <span className={styles.escuelaNombre}>
                                                    {p.escuelas?.nombre || '—'}
                                                </span>
                                            </td>
                                        )}
                                        <td className={styles.td}>
                                            <span className={styles.fechaText}>{formatearFecha(p.created_at)}</span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.accionesCell}>
                                                <button
                                                    className={`${styles.btnAccion} ${styles.btnEditar}`}
                                                    title="Editar"
                                                    onClick={() => abrirEditar(p)}
                                                >
                                                    <img src={iconConfig} alt="Editar" />
                                                </button>
                                                <button
                                                    className={`${styles.btnAccion} ${styles.btnEliminar}`}
                                                    title="Eliminar"
                                                    onClick={() => handleEliminar(p)}
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

export default VistaProfesores;

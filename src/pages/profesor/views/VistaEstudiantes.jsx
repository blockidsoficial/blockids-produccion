import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabaseClient';
import iconUsuario from '../../../assets/iconos-ui/ui-usuario.svg';
import dash   from '../Dashboard.css';
import styles from './VistaEstudiantes.css';

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const inicial = (nombre, username) => {
    if (nombre) return nombre.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return '?';
};

const COLORES_AVATAR = ['#3b5bdb', '#7048e8', '#0ca678', '#e67700', '#c92a2a', '#1098ad'];
const colorAvatar = (str = '') => COLORES_AVATAR[str.charCodeAt(0) % COLORES_AVATAR.length];

const VistaEstudiantes = ({ userId, escuelaId }) => {

    // ── Lista principal ───────────────────────────────────────────────────────
    const [aulas,      setAulas]      = useState([]);
    const [aulaFiltro, setAulaFiltro] = useState('todas');
    const [busqueda,   setBusqueda]   = useState('');
    const [alumnos,    setAlumnos]    = useState([]);
    const [cargando,   setCargando]   = useState(false);

    // ── Modal: asignar alumno ─────────────────────────────────────────────────
    const [modalAsignarAbierto,  setModalAsignarAbierto]  = useState(false);
    const [aulaParaAsignar,      setAulaParaAsignar]      = useState('');
    const [busquedaAlumno,       setBusquedaAlumno]       = useState('');
    const [alumnosEncontrados,   setAlumnosEncontrados]   = useState([]);
    const [buscandoAlumno,       setBuscandoAlumno]       = useState(false);
    const [asignando,            setAsignando]            = useState(false);
    const [alertaModal,          setAlertaModal]          = useState(null);

    // ── Carga inicial ─────────────────────────────────────────────────────────
    const cargar = async () => {
        if (!userId) return;
        setCargando(true);

        const { data: aulasData } = await supabase
            .from('aulas')
            .select('id, nombre')
            .eq('profesor_id', userId)
            .order('created_at', { ascending: false });

        const listaAulas = aulasData || [];
        setAulas(listaAulas);

        if (listaAulas.length === 0) { setAlumnos([]); setCargando(false); return; }

        const { data: aaData } = await supabase
            .from('aula_alumnos')
            .select(`
                joined_at,
                alumno:perfiles!aula_alumnos_alumno_id_fkey(id, nombre, apellido, username),
                aula:aulas!aula_alumnos_aula_id_fkey(id, nombre)
            `)
            .in('aula_id', listaAulas.map(a => a.id))
            .order('joined_at', { ascending: false });

        setAlumnos(aaData || []);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, [userId]);

    // ── Búsqueda de alumnos en BD (debounced) ─────────────────────────────────
    useEffect(() => {
        const q = busquedaAlumno.trim();
        if (!escuelaId || q.length < 2) { setAlumnosEncontrados([]); return; }

        const timer = setTimeout(async () => {
            setBuscandoAlumno(true);
            const { data } = await supabase
                .from('perfiles')
                .select('id, nombre, apellido_paterno, apellido_materno, apellido, username')
                .eq('rol', 'alumno')
                .eq('escuela_id', escuelaId)
                .or(`username.ilike.%${q}%,nombre.ilike.%${q}%,apellido_paterno.ilike.%${q}%`)
                .limit(6);
            setAlumnosEncontrados(data || []);
            setBuscandoAlumno(false);
        }, 350);

        return () => clearTimeout(timer);
    }, [busquedaAlumno, escuelaId]);

    // ── Abrir / cerrar modal asignar ──────────────────────────────────────────
    const abrirModalAsignar = () => {
        const defecto = aulaFiltro !== 'todas' ? aulaFiltro : (aulas[0]?.id || '');
        setAulaParaAsignar(defecto);
        setBusquedaAlumno('');
        setAlumnosEncontrados([]);
        setAlertaModal(null);
        setModalAsignarAbierto(true);
    };

    const cerrarModalAsignar = () => {
        if (asignando) return;
        setModalAsignarAbierto(false);
        setBusquedaAlumno('');
        setAlumnosEncontrados([]);
        setAlertaModal(null);
    };

    // ── Asignar alumno al aula ────────────────────────────────────────────────
    const handleAsignar = async (alumno) => {
        if (!aulaParaAsignar) {
            setAlertaModal({ tipo: 'error', texto: 'Selecciona un aula antes de añadir.' });
            return;
        }
        setAsignando(true);

        // Verificar si ya está en el aula
        const { data: existe } = await supabase
            .from('aula_alumnos')
            .select('aula_id')
            .eq('aula_id', aulaParaAsignar)
            .eq('alumno_id', alumno.id)
            .maybeSingle();

        if (existe) {
            setAlertaModal({ tipo: 'error', texto: `${alumno.nombre || alumno.username} ya pertenece a este grupo.` });
            setAsignando(false);
            return;
        }

        const { error } = await supabase
            .from('aula_alumnos')
            .insert([{ aula_id: aulaParaAsignar, alumno_id: alumno.id }]);

        setAsignando(false);

        if (error) {
            const texto = error.code === '23505'
                ? `${alumno.nombre || alumno.username} ya pertenece a este grupo.`
                : `Error al asignar: ${error.message}`;
            setAlertaModal({ tipo: 'error', texto });
            return;
        }

        const aulaNombre = aulas.find(a => a.id === aulaParaAsignar)?.nombre || 'el aula';
        setAlertaModal({ tipo: 'success', texto: `¡${alumno.nombre || alumno.username} añadido a ${aulaNombre}!` });
        setBusquedaAlumno('');
        setAlumnosEncontrados([]);
        cargar();
    };

    // ── Nombre completo del alumno encontrado ─────────────────────────────────
    const nombreAlumno = (p) => {
        const partes = [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean);
        if (partes.length > 0) return partes.join(' ');
        return p.apellido ? `${p.nombre || ''} ${p.apellido}`.trim() : `@${p.username}`;
    };

    // ── Filtrado local ─────────────────────────────────────────────────────────
    const alumnosFiltrados = alumnos.filter(r => {
        if (aulaFiltro !== 'todas' && r.aula?.id !== aulaFiltro) return false;
        const term = busqueda.toLowerCase();
        if (!term) return true;
        const { nombre = '', apellido = '', username = '' } = r.alumno || {};
        return `${nombre} ${apellido} ${username}`.toLowerCase().includes(term);
    });

    return (
        <div>
            {/* ══ Modal: Asignar Estudiante ══ */}
            {modalAsignarAbierto && (
                <div className={dash.modalOverlay} onClick={cerrarModalAsignar}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>

                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconUsuario} alt="" width="24" height="24" />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Asignar Estudiante</h3>
                                    <p className={dash.modalSubtitle}>Busca al alumno por nombre o usuario</p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModalAsignar} disabled={asignando}>✕</button>
                        </div>

                        <div className={dash.modalBody}>

                            {/* Selector de aula destino */}
                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Asignar a esta aula</label>
                                <select
                                    className={dash.fieldInput}
                                    value={aulaParaAsignar}
                                    onChange={e => setAulaParaAsignar(e.target.value)}
                                    disabled={asignando}
                                >
                                    {aulas.length === 0 && <option value="">Sin aulas disponibles</option>}
                                    {aulas.map(a => (
                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Input de búsqueda */}
                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Buscar alumno (mínimo 2 caracteres)</label>
                                <input
                                    type="text"
                                    className={dash.fieldInput}
                                    placeholder="Nombre o @usuario..."
                                    value={busquedaAlumno}
                                    onChange={e => { setBusquedaAlumno(e.target.value); setAlertaModal(null); }}
                                    disabled={asignando}
                                    autoFocus
                                />
                            </div>

                            {/* Alerta inline */}
                            {alertaModal && (
                                <div className={`${styles.alertaModal} ${alertaModal.tipo === 'success' ? styles.alertaSuccess : styles.alertaError}`}>
                                    {alertaModal.texto}
                                </div>
                            )}

                            {/* Resultados de búsqueda */}
                            {buscandoAlumno && (
                                <p className={styles.buscandoTexto}>Buscando...</p>
                            )}

                            {!buscandoAlumno && busquedaAlumno.trim().length >= 2 && (
                                <ul className={styles.resultadosList}>
                                    {alumnosEncontrados.length === 0 ? (
                                        <li className={styles.sinResultados}>
                                            No se encontraron alumnos con esa búsqueda.
                                        </li>
                                    ) : (
                                        alumnosEncontrados.map(alumno => {
                                            const bg = colorAvatar(alumno.nombre || alumno.username || '');
                                            return (
                                                <li key={alumno.id} className={styles.resultadoItem}>
                                                    <div
                                                        className={styles.avatarSm}
                                                        style={{ background: bg }}
                                                    >
                                                        {inicial(alumno.nombre, alumno.username)}
                                                    </div>
                                                    <div className={styles.resultadoInfo}>
                                                        <span className={styles.resultadoNombre}>{nombreAlumno(alumno)}</span>
                                                        <span className={styles.resultadoUser}>@{alumno.username}</span>
                                                    </div>
                                                    <button
                                                        className={styles.btnAniadir}
                                                        onClick={() => handleAsignar(alumno)}
                                                        disabled={asignando}
                                                    >
                                                        {asignando ? '...' : '+ Añadir'}
                                                    </button>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            )}
                        </div>

                        <div className={dash.modalFooter}>
                            <button className={dash.btnCancelar} onClick={cerrarModalAsignar} disabled={asignando}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Cabecera ══ */}
            <div className={dash.vistaHeader}>
                <div>
                    <h2 className={dash.vistaTitle}>Mis Estudiantes</h2>
                    <p className={styles.subtitulo}>
                        {cargando
                            ? 'Cargando...'
                            : `${alumnosFiltrados.length} estudiante${alumnosFiltrados.length !== 1 ? 's' : ''} encontrado${alumnosFiltrados.length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                <div className={styles.controles}>
                    <input
                        type="text"
                        className={`${dash.fieldInput} ${styles.inputBusqueda}`}
                        placeholder="Buscar por nombre o @usuario..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    <select
                        className={`${dash.fieldInput} ${styles.selectAula}`}
                        value={aulaFiltro}
                        onChange={e => setAulaFiltro(e.target.value)}
                    >
                        <option value="todas">Todas las aulas</option>
                        {aulas.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                    <button
                        className={styles.btnAsignar}
                        onClick={abrirModalAsignar}
                        disabled={aulas.length === 0}
                    >
                        + Asignar Estudiante
                    </button>
                </div>
            </div>

            {/* ══ Tabla ══ */}
            <div className={`${dash.columnCard} ${styles.tablaCard}`}>
                {cargando ? (
                    <div className={`${dash.loadingAulas} ${styles.loadingWrap}`}>
                        Cargando estudiantes...
                    </div>
                ) : alumnosFiltrados.length === 0 ? (
                    <div className={`${dash.emptyAula} ${styles.emptyWrap}`}>
                        <p className={dash.emptyAulaTitle}>
                            {busqueda || aulaFiltro !== 'todas'
                                ? 'Sin resultados para esa búsqueda.'
                                : 'Aún no tienes estudiantes registrados.'}
                        </p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.theadTr}>
                                {['ESTUDIANTE', 'AULA', 'FECHA DE INGRESO'].map(col => (
                                    <th key={col} className={styles.th}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {alumnosFiltrados.map((r, i) => {
                                const a = r.alumno || {};
                                const nombreCompleto = (a.nombre && a.apellido)
                                    ? `${a.nombre} ${a.apellido}`
                                    : a.nombre || `@${a.username}`;
                                const bg = colorAvatar(a.nombre || a.username || '');

                                return (
                                    <tr key={`${a.id}-${r.aula?.id}-${i}`} className={styles.tr}>
                                        <td className={styles.td}>
                                            <div className={styles.estudianteCell}>
                                                <div className={styles.avatar} style={{ background: bg }}>
                                                    {inicial(a.nombre, a.username)}
                                                </div>
                                                <div>
                                                    <p className={styles.nombreCompleto}>{nombreCompleto}</p>
                                                    {a.username && (
                                                        <p className={styles.usernameText}>@{a.username}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.aulaBadge}>{r.aula?.nombre || '—'}</span>
                                        </td>
                                        <td className={`${styles.td} ${styles.fechaText}`}>
                                            {formatearFecha(r.joined_at)}
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

export default VistaEstudiantes;

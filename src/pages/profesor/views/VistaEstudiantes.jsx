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

const PASS_MIN = 6;

const IconoLlave = () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
);

const IconoOjo = ({ visible }) => (
    visible ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
);

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

    // ── Modal: crear alumno ───────────────────────────────────────────────────
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [cUsername,   setCUsername]   = useState('');
    const [cNombre,     setCNombre]     = useState('');
    const [cApellidoP,  setCApellidoP]  = useState('');
    const [cApellidoM,  setCApellidoM]  = useState('');
    const [cPassword,   setCPassword]   = useState('');
    const [cConfirm,    setCConfirm]    = useState('');
    const [cAula,       setCAula]       = useState('');
    const [verCPass,    setVerCPass]    = useState(false);
    const [verCConfirm, setVerCConfirm] = useState(false);
    const [creando,     setCreando]     = useState(false);
    const [alertaCrear, setAlertaCrear] = useState(null);

    // ── Modal: restablecer contraseña ─────────────────────────────────────────
    const [modalResetAbierto, setModalResetAbierto] = useState(false);
    const [alumnoReset,       setAlumnoReset]       = useState(null);
    const [nuevaPassReset,    setNuevaPassReset]    = useState('');
    const [confirmPassReset,  setConfirmPassReset]  = useState('');
    const [verPassReset1,     setVerPassReset1]     = useState(false);
    const [verPassReset2,     setVerPassReset2]     = useState(false);
    const [reseteando,        setReseteando]        = useState(false);
    const [alertaReset,       setAlertaReset]       = useState(null);

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

    // ── Crear alumno ─────────────────────────────────────────────────────────
    const abrirModalCrear = () => {
        setCUsername(''); setCNombre(''); setCApellidoP(''); setCApellidoM('');
        setCPassword(''); setCConfirm('');
        setCAula(aulaFiltro !== 'todas' ? aulaFiltro : (aulas[0]?.id || ''));
        setVerCPass(false); setVerCConfirm(false);
        setAlertaCrear(null);
        setModalCrearAbierto(true);
    };

    const cerrarModalCrear = () => {
        if (creando) return;
        setModalCrearAbierto(false);
        setAlertaCrear(null);
    };

    const handleCrearAlumno = async () => {
        if (!escuelaId) {
            setAlertaCrear({ tipo: 'error', texto: 'No se encontró tu escuela. Recarga la página.' });
            return;
        }
        const usernameNorm = cUsername.trim().toLowerCase().replace(/\s+/g, '-');
        if (!usernameNorm) {
            setAlertaCrear({ tipo: 'error', texto: 'Escribe un nombre de usuario.' });
            return;
        }
        if (cPassword.length < PASS_MIN) {
            setAlertaCrear({ tipo: 'error', texto: `La contraseña debe tener al menos ${PASS_MIN} caracteres.` });
            return;
        }
        if (cPassword !== cConfirm) {
            setAlertaCrear({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
            return;
        }
        setCreando(true);
        setAlertaCrear(null);

        const { data, error } = await supabase.functions.invoke('crear-usuario-admin', {
            body: {
                username:         usernameNorm,
                password:         cPassword,
                rol:              'alumno',
                escuela_id:       escuelaId,
                nombre:           cNombre.trim(),
                apellido_paterno: cApellidoP.trim(),
                apellido_materno: cApellidoM.trim(),
                notas_admin:      `Alta por profesor — ${new Date().toLocaleDateString('es-MX')}`,
            },
        });

        if (error || data?.error) {
            let mensajeError = data?.error;
            if (!mensajeError && error) {
                try {
                    const cuerpo = await error.context?.json?.();
                    mensajeError = cuerpo?.error || error.message;
                } catch {
                    mensajeError = error.message;
                }
            }
            setCreando(false);
            setAlertaCrear({ tipo: 'error', texto: mensajeError || 'No se pudo crear el alumno.' });
            return;
        }

        const nuevoId = data?.userId;

        // Asignar al aula elegida (opcional). El nombre/apellidos ya los guardó
        // la Edge Function con service role.
        if (nuevoId && cAula) {
            await supabase.from('aula_alumnos').insert([{ aula_id: cAula, alumno_id: nuevoId }]);
        }

        setCreando(false);
        const aulaNombre = aulas.find(x => x.id === cAula)?.nombre;
        setAlertaCrear({
            tipo: 'success',
            texto: cAula
                ? `Alumno @${usernameNorm} creado y asignado a ${aulaNombre}. Comparte la contraseña con el alumno.`
                : `Alumno @${usernameNorm} creado. Comparte la contraseña con el alumno.`,
        });
        setCUsername(''); setCNombre(''); setCApellidoP(''); setCApellidoM('');
        setCPassword(''); setCConfirm('');
        cargar();
    };

    // ── Restablecer contraseña de un alumno ──────────────────────────────────
    const abrirModalReset = (alumno) => {
        setAlumnoReset(alumno);
        setNuevaPassReset('');
        setConfirmPassReset('');
        setVerPassReset1(false);
        setVerPassReset2(false);
        setAlertaReset(null);
        setModalResetAbierto(true);
    };

    const cerrarModalReset = () => {
        if (reseteando) return;
        setModalResetAbierto(false);
        setAlumnoReset(null);
        setNuevaPassReset('');
        setConfirmPassReset('');
        setAlertaReset(null);
    };

    const handleResetPassword = async () => {
        if (!alumnoReset) return;
        if (nuevaPassReset.length < PASS_MIN) {
            setAlertaReset({ tipo: 'error', texto: `La contraseña debe tener al menos ${PASS_MIN} caracteres.` });
            return;
        }
        if (nuevaPassReset !== confirmPassReset) {
            setAlertaReset({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
            return;
        }
        setReseteando(true);
        setAlertaReset(null);

        const { data, error } = await supabase.functions.invoke('resetear-password-alumno', {
            body: { alumno_id: alumnoReset.id, nueva_password: nuevaPassReset },
        });

        setReseteando(false);

        if (error || data?.error) {
            let mensajeError = data?.error;
            if (!mensajeError && error) {
                try {
                    const cuerpo = await error.context?.json?.();
                    mensajeError = cuerpo?.error || error.message;
                } catch {
                    mensajeError = error.message;
                }
            }
            setAlertaReset({ tipo: 'error', texto: mensajeError || 'No se pudo restablecer la contraseña.' });
            return;
        }

        setAlertaReset({
            tipo: 'success',
            texto: `Contraseña de @${alumnoReset.username} actualizada. Compártesela al alumno.`,
        });
        setNuevaPassReset('');
        setConfirmPassReset('');
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
                                    placeholder="Buscar alumno por nombre o usuario..."
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

            {/* ══ Modal: Crear Alumno ══ */}
            {modalCrearAbierto && (
                <div className={dash.modalOverlay} onClick={cerrarModalCrear}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>

                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconUsuario} alt="" width="24" height="24" />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Crear alumno</h3>
                                    <p className={dash.modalSubtitle}>Se dará de alta en tu escuela</p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModalCrear} disabled={creando}>✕</button>
                        </div>

                        <div className={`${dash.modalBody} ${styles.resetBody}`}>

                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Crear usuario </label>
                                <input
                                    type="text"
                                    className={dash.fieldInput}
                                    placeholder="Nombre de usuario sin espacios ni acentos"
                                    value={cUsername}
                                    onChange={e => { setCUsername(e.target.value); setAlertaCrear(null); }}
                                    disabled={creando}
                                    autoFocus
                                />
                            </div>

                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Nombre</label>
                                <input
                                    type="text"
                                    className={dash.fieldInput}
                                    placeholder="Nombre(s)"
                                    value={cNombre}
                                    onChange={e => setCNombre(e.target.value)}
                                    disabled={creando}
                                />
                            </div>

                            <div className={styles.filaDoble}>
                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel}>Apellido paterno</label>
                                    <input
                                        type="text"
                                        className={dash.fieldInput}
                                        placeholder="Apellido paterno"
                                        value={cApellidoP}
                                        onChange={e => setCApellidoP(e.target.value)}
                                        disabled={creando}
                                    />
                                </div>
                                <div className={dash.fieldGroup}>
                                    <label className={dash.fieldLabel}>Apellido materno</label>
                                    <input
                                        type="text"
                                        className={dash.fieldInput}
                                        placeholder="Apellido materno"
                                        value={cApellidoM}
                                        onChange={e => setCApellidoM(e.target.value)}
                                        disabled={creando}
                                    />
                                </div>
                            </div>

                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Contraseña temporal *</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={verCPass ? 'text' : 'password'}
                                        className={`${dash.fieldInput} ${styles.inputWithEye}`}
                                        placeholder={`Mínimo ${PASS_MIN} caracteres`}
                                        value={cPassword}
                                        onChange={e => { setCPassword(e.target.value); setAlertaCrear(null); }}
                                        disabled={creando}
                                        autoComplete="new-password"
                                        maxLength={72}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setVerCPass(v => !v)}
                                        disabled={creando}
                                        aria-label={verCPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <IconoOjo visible={verCPass} />
                                    </button>
                                </div>
                            </div>

                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Confirmar contraseña *</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={verCConfirm ? 'text' : 'password'}
                                        className={`${dash.fieldInput} ${styles.inputWithEye}`}
                                        placeholder="Confirma la contraseña"
                                        value={cConfirm}
                                        onChange={e => { setCConfirm(e.target.value); setAlertaCrear(null); }}
                                        disabled={creando}
                                        autoComplete="new-password"
                                        maxLength={72}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setVerCConfirm(v => !v)}
                                        disabled={creando}
                                        aria-label={verCConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <IconoOjo visible={verCConfirm} />
                                    </button>
                                </div>
                            </div>

                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Asignar a un aula (opcional)</label>
                                <select
                                    className={dash.fieldInput}
                                    value={cAula}
                                    onChange={e => setCAula(e.target.value)}
                                    disabled={creando}
                                >
                                    <option value="">— Ninguna por ahora —</option>
                                    {aulas.map(a => (
                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {alertaCrear && (
                                <div className={`${styles.alertaModal} ${alertaCrear.tipo === 'success' ? styles.alertaSuccess : styles.alertaError}`}>
                                    {alertaCrear.texto}
                                </div>
                            )}
                        </div>

                        <div className={dash.modalFooter}>
                            <button className={dash.btnCancelar} onClick={cerrarModalCrear} disabled={creando}>
                                {alertaCrear?.tipo === 'success' ? 'Cerrar' : 'Cancelar'}
                            </button>
                            <button
                                className={styles.btnResetSubmit}
                                onClick={handleCrearAlumno}
                                disabled={creando || !cUsername || !cPassword || !cConfirm}
                            >
                                {creando ? 'Creando...' : 'Crear alumno'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Modal: Restablecer Contraseña ══ */}
            {modalResetAbierto && (
                <div className={dash.modalOverlay} onClick={cerrarModalReset}>
                    <div className={dash.modalCard} onClick={e => e.stopPropagation()}>

                        <div className={dash.modalHeader}>
                            <div className={dash.modalHeaderLeft}>
                                <div className={dash.modalIconWrap}>
                                    <img src={iconUsuario} alt="" width="24" height="24" />
                                </div>
                                <div>
                                    <h3 className={dash.modalTitle}>Restablecer contraseña</h3>
                                    <p className={dash.modalSubtitle}>
                                        {alumnoReset
                                            ? `Alumno: ${nombreAlumno(alumnoReset)} · @${alumnoReset.username}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                            <button className={dash.modalClose} onClick={cerrarModalReset} disabled={reseteando}>✕</button>
                        </div>

                        <div className={`${dash.modalBody} ${styles.resetBody}`}>
                            <p className={styles.hintPass}>
                                Se fija una contraseña nueva para este alumno. El alumno no recibe aviso:
                                tienes que comunicársela tú.
                            </p>

                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Nueva contraseña</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={verPassReset1 ? 'text' : 'password'}
                                        className={`${dash.fieldInput} ${styles.inputWithEye}`}
                                        placeholder={`Mínimo ${PASS_MIN} caracteres`}
                                        value={nuevaPassReset}
                                        onChange={e => { setNuevaPassReset(e.target.value); setAlertaReset(null); }}
                                        disabled={reseteando}
                                        autoComplete="new-password"
                                        maxLength={72}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setVerPassReset1(v => !v)}
                                        disabled={reseteando}
                                        aria-label={verPassReset1 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <IconoOjo visible={verPassReset1} />
                                    </button>
                                </div>
                            </div>

                            <div className={dash.fieldGroup}>
                                <label className={dash.fieldLabel}>Confirmar contraseña</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={verPassReset2 ? 'text' : 'password'}
                                        className={`${dash.fieldInput} ${styles.inputWithEye}`}
                                        placeholder="Confirma la contraseña"
                                        value={confirmPassReset}
                                        onChange={e => { setConfirmPassReset(e.target.value); setAlertaReset(null); }}
                                        disabled={reseteando}
                                        autoComplete="new-password"
                                        maxLength={72}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setVerPassReset2(v => !v)}
                                        disabled={reseteando}
                                        aria-label={verPassReset2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <IconoOjo visible={verPassReset2} />
                                    </button>
                                </div>
                            </div>

                            {alertaReset && (
                                <div className={`${styles.alertaModal} ${alertaReset.tipo === 'success' ? styles.alertaSuccess : styles.alertaError}`}>
                                    {alertaReset.texto}
                                </div>
                            )}
                        </div>

                        <div className={dash.modalFooter}>
                            <button className={dash.btnCancelar} onClick={cerrarModalReset} disabled={reseteando}>
                                Cerrar
                            </button>
                            <button
                                className={styles.btnResetSubmit}
                                onClick={handleResetPassword}
                                disabled={reseteando || !nuevaPassReset || !confirmPassReset}
                            >
                                {reseteando ? 'Guardando...' : 'Restablecer'}
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
                        className={styles.btnCrearAlumno}
                        onClick={abrirModalCrear}
                        disabled={!escuelaId}
                    >
                        + Crear alumno
                    </button>
                    <button
                        className={styles.btnAsignar}
                        onClick={abrirModalAsignar}
                        disabled={aulas.length === 0}
                    >
                        + Asignar Estudiante
                    </button>
                </div>
            </div>

            {/* ══ Listado de estudiantes (tarjetas responsivas) ══ */}
            {cargando ? (
                <div className={`${dash.columnCard} ${styles.estadoCard}`}>
                    Cargando estudiantes...
                </div>
            ) : alumnosFiltrados.length === 0 ? (
                <div className={`${dash.columnCard} ${styles.estadoCard}`}>
                    {busqueda || aulaFiltro !== 'todas'
                        ? 'Sin resultados para esa búsqueda.'
                        : 'Aún no tienes estudiantes registrados.'}
                </div>
            ) : (
                <div className={styles.grid}>
                    {alumnosFiltrados.map((r, i) => {
                        const a = r.alumno || {};
                        const nombreCompleto = (a.nombre && a.apellido)
                            ? `${a.nombre} ${a.apellido}`
                            : a.nombre || `@${a.username}`;
                        const bg = colorAvatar(a.nombre || a.username || '');

                        return (
                            <div key={`${a.id}-${r.aula?.id}-${i}`} className={styles.alumnoCard}>
                                <div className={styles.cardTop}>
                                    <div className={styles.avatar} style={{ background: bg }}>
                                        {inicial(a.nombre, a.username)}
                                    </div>
                                    <div className={styles.cardIdent}>
                                        <p className={styles.nombreCompleto}>{nombreCompleto}</p>
                                        {a.username && (
                                            <p className={styles.usernameText}>@{a.username}</p>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.cardMeta}>
                                    <span className={styles.aulaBadge}>{r.aula?.nombre || '—'}</span>
                                    <span className={styles.fechaText}>
                                        Ingresó el {formatearFecha(r.joined_at)}
                                    </span>
                                </div>

                                <button
                                    className={styles.btnResetPass}
                                    onClick={() => abrirModalReset(a)}
                                    disabled={!a.id}
                                    title="Restablecer contraseña"
                                >
                                    <IconoLlave />
                                    <span>Restablecer contraseña</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VistaEstudiantes;

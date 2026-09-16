import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import iconUsuario from '../../../assets/iconos-ui/ui-usuario.svg';
import iconCrear      from '../../../assets/iconos-ui/crear.svg';
import iconEditar     from '../../../assets/iconos-ui/editar.svg';
import iconActivado   from '../../../assets/iconos-ui/activado.svg';
import iconDesactivado from '../../../assets/iconos-ui/desactivado.svg';
import styles from '../Dashboard.css';
import local  from './VistaUsuarios.css';
import { normalizarUsername, validarUsername } from '../../../lib/username-rules';
import IconoOjo from '../../../components/IconoOjo/IconoOjo';

const PASS_MIN = 6;
const PASS_MAX = 72; // límite real de bcrypt (lo que usa Supabase Auth por debajo)

const ROL_CONFIG = {
    superadmin:    { label: 'Administrador Plataforma', color: '#f59e0b', bg: '#fef3c7' },
    admin_escuela: { label: 'Admin Escuela', color: '#8b5cf6', bg: '#ede9fe' },
    profesor:      { label: 'Profesor',      color: '#3b82f6', bg: '#dbeafe' },
    alumno:        { label: 'Alumno',        color: '#10b981', bg: '#d1fae5' },
};

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};


const VistaUsuarios = ({ perfil, esSuperAdmin, escuelasActivas, miEscuela, mostrarAlerta, onRefreshDatos }) => {

    // ── Datos ─────────────────────────────────────────────────────────────────
    const [usuarios, setUsuarios]           = useState([]);
    const [cargandoUsers, setCargandoUsers] = useState(false);

    // ── Filtros ───────────────────────────────────────────────────────────────
    const [filtroRol,     setFiltroRol]     = useState('todos');
    const [filtroEscuela, setFiltroEscuela] = useState('todas');
    const [busqueda,      setBusqueda]      = useState('');

    // ── Modal crear/editar ────────────────────────────────────────────────────
    const [modalAbierto, setModalAbierto]       = useState(false);
    const [modoModal, setModoModal]             = useState('crear');
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [enviandoModal, setEnviandoModal]     = useState(false);

    const [fUsername, setFUsername]                       = useState('');
    const [fNombre, setFNombre]                         = useState('');
    const [fApellidoPaterno, setFApellidoPaterno]       = useState('');
    const [fApellidoMaterno, setFApellidoMaterno]       = useState('');
    const [fPassword, setFPassword]                     = useState('');
    const [fConfirmPassword, setFConfirmPassword] = useState('');
    const [showPassword, setShowPassword]         = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fRol, setFRol]                         = useState('alumno');
    const [fEscuelaId, setFEscuelaId]             = useState('');
    const [fNotas, setFNotas]                     = useState('');

    // ── Zona de peligro: borrado permanente (solo superadmin) ─────────────────
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
    const [impactoEliminar, setImpactoEliminar]         = useState(null);
    const [cargandoImpacto, setCargandoImpacto]         = useState(false);
    const [usernameConfirmacion, setUsernameConfirmacion] = useState('');
    const [eliminandoPermanente, setEliminandoPermanente] = useState(false);

    // ── Cargar usuarios ───────────────────────────────────────────────────────
    const cargarUsuarios = useCallback(async () => {
        setCargandoUsers(true);
        let query = supabase
            .from('perfiles')
            .select('id, username, nombre, apellido, apellido_paterno, apellido_materno, rol, escuela_id, notas_admin, created_at, activo, escuelas(nombre)')
            .order('created_at', { ascending: false });

        if (!esSuperAdmin && perfil?.escuela_id) {
            query = query
                .eq('escuela_id', perfil.escuela_id)
                .in('rol', ['profesor', 'alumno']);
        }

        const { data, error } = await query;
        if (!error) setUsuarios(data || []);
        setCargandoUsers(false);
    }, [esSuperAdmin, perfil?.escuela_id]);

    useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

    // ── Modal: abrir para CREAR ───────────────────────────────────────────────
    const abrirModalCrear = () => {
        setModoModal('crear');
        setUsuarioEditando(null);
        setFUsername(''); setFNombre(''); setFApellidoPaterno(''); setFApellidoMaterno('');
        setFPassword(''); setFConfirmPassword('');
        setShowPassword(false); setShowConfirmPassword(false);
        setFRol(esSuperAdmin ? 'alumno' : 'profesor');
        setFEscuelaId(esSuperAdmin
            ? (escuelasActivas[0]?.id || '')
            : (perfil?.escuela_id || ''));
        setFNotas('');
        setModalAbierto(true);
    };

    // ── Modal: abrir para EDITAR ──────────────────────────────────────────────
    const abrirModalEditar = (usuario) => {
        setModoModal('editar');
        setUsuarioEditando(usuario);
        setFUsername(usuario.username);
        setFNombre(usuario.nombre || '');
        setFApellidoPaterno(usuario.apellido_paterno || '');
        setFApellidoMaterno(usuario.apellido_materno || '');
        setFPassword('');
        setFRol(usuario.rol);
        setFEscuelaId(usuario.escuela_id || '');
        setFNotas('');
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setUsuarioEditando(null);
        setFUsername(''); setFNombre(''); setFApellidoPaterno(''); setFApellidoMaterno('');
        setFPassword(''); setFConfirmPassword('');
        setFNotas('');
        setShowPassword(false); setShowConfirmPassword(false);
        setConfirmandoEliminar(false); setImpactoEliminar(null); setUsernameConfirmacion('');
    };

    // ── Crear usuario vía Edge Function ───────────────────────────────────────
    const handleCreateUser = async () => {
        if (!fUsername.trim()) return mostrarAlerta('error', 'Escribe un nombre de usuario válido.');
        // Trim SOLO en las puntas — los espacios intermedios de una
        // frase-clave se respetan tal cual (no se restringe ningún carácter).
        const fPasswordFinal = fPassword.trim();
        if (fPasswordFinal.length < PASS_MIN || fPasswordFinal.length > PASS_MAX) {
            return mostrarAlerta('error', `La contraseña debe tener entre ${PASS_MIN} y ${PASS_MAX} caracteres.`);
        }
        if (fPasswordFinal !== fConfirmPassword.trim()) return mostrarAlerta('error', 'Las contraseñas no coinciden.');

        const rolFinal = esSuperAdmin
            ? fRol
            : (fRol === 'profesor' || fRol === 'alumno') ? fRol : 'alumno';

        // Un superadmin no pertenece a ninguna escuela — solo se exige escuela_id
        // para el resto de los roles, que sí viven dentro de una institución.
        const escuelaIdFinal = rolFinal === 'superadmin'
            ? null
            : (esSuperAdmin ? fEscuelaId : perfil?.escuela_id);

        if (rolFinal !== 'superadmin' && !escuelaIdFinal) return mostrarAlerta('error', 'Selecciona una escuela.');

        const usernameNorm = normalizarUsername(fUsername);
        const errorUsername = validarUsername(usernameNorm, { rol: rolFinal });
        if (errorUsername) return mostrarAlerta('error', errorUsername);

        const payload = {
            username:    usernameNorm,
            password:    fPasswordFinal,
            rol:         rolFinal,
            escuela_id:  escuelaIdFinal,
            notas_admin: fNotas.trim(),
        };
        setEnviandoModal(true);

        const { data, error } = await supabase.functions.invoke('crear-usuario-admin', {
            body: payload,
        });

        setEnviandoModal(false);

        // En supabase-js v2.x, errores HTTP de la Edge Function van a `error`,
        // no a `data`. El cuerpo real del error está en error.context (Response).
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
            console.error('ERROR CREACIÓN:', error, '| Mensaje:', mensajeError);
            return mostrarAlerta('error', mensajeError || 'Error desconocido al crear usuario.');
        }

        if ((fNombre.trim() || fApellidoPaterno.trim() || fApellidoMaterno.trim()) && data?.userId) {
            const { error: updateNombreErr } = await supabase
                .from('perfiles')
                .update({
                    nombre:           fNombre.trim() || null,
                    apellido_paterno: fApellidoPaterno.trim() || null,
                    apellido_materno: fApellidoMaterno.trim() || null,
                })
                .eq('id', data.userId);
            if (updateNombreErr) {
                console.error('Error al guardar nombre/apellido:', updateNombreErr);
                mostrarAlerta('error', `Usuario creado, pero no se pudo guardar el nombre: ${updateNombreErr.message}`);
            }
        }

        mostrarAlerta('success', `Usuario @${usernameNorm} creado con rol ${ROL_CONFIG[rolFinal]?.label}.`);
        cerrarModal();
        cargarUsuarios();
        onRefreshDatos?.();
    };

    // ── Editar usuario ────────────────────────────────────────────────────────
    const handleUpdateUser = async () => {
        if (!usuarioEditando) return;
        if (!fNotas.trim()) return mostrarAlerta('error', 'Escribe el motivo del cambio en "Comentarios".');

        const rolFinal = esSuperAdmin
            ? fRol
            : (fRol === 'profesor' || fRol === 'alumno') ? fRol : usuarioEditando.rol;

        // Igual que al crear: un superadmin no pertenece a ninguna escuela.
        const escuelaIdFinal = rolFinal === 'superadmin'
            ? null
            : (esSuperAdmin ? (fEscuelaId || usuarioEditando.escuela_id) : perfil?.escuela_id);

        const payload = {
            nombre:           fNombre.trim() || null,
            apellido_paterno: fApellidoPaterno.trim() || null,
            apellido_materno: fApellidoMaterno.trim() || null,
            rol:              rolFinal,
            escuela_id:       escuelaIdFinal,
            notas_admin:      fNotas.trim(),
        };
        setEnviandoModal(true);
        // Usamos .select('id') para detectar si RLS bloqueó el update silenciosamente.
        // Si error=null pero data=[] significa 0 filas afectadas → bloqueo por permisos.
        const { data: filasActualizadas, error } = await supabase
            .from('perfiles')
            .update(payload)
            .eq('id', usuarioEditando.id)
            .select('id');
        setEnviandoModal(false);

        if (error) {
            console.error('ERROR UPDATE:', error);
            mostrarAlerta('error', `Error al actualizar: ${error.message}`);
        } else if (!filasActualizadas || filasActualizadas.length === 0) {
            console.warn('UPDATE sin filas afectadas — posible bloqueo por RLS o ID incorrecto.', { id: usuarioEditando.id });
            mostrarAlerta('error', 'No se guardaron los cambios. Es posible que no tengas permiso para editar este perfil (RLS) o el registro no existe.');
        } else {
            mostrarAlerta('success', `Perfil de @${usuarioEditando.username} actualizado.`);
            cerrarModal();
            cargarUsuarios();
            onRefreshDatos?.();
        }
    };

    // ── Zona de peligro: borrado permanente (solo superadmin) ─────────────────
    // Antes de dejar confirmar, calculamos qué se lleva en cascada — todas
    // las FK de perfiles.id tienen ON DELETE CASCADE, así que esto no es
    // decorativo: es literalmente lo que va a desaparecer.
    const abrirConfirmarEliminar = async () => {
        if (!usuarioEditando) return;
        setCargandoImpacto(true);
        setConfirmandoEliminar(true);
        setUsernameConfirmacion('');

        if (usuarioEditando.rol === 'alumno') {
            const [{ count: proyectos }, { count: entregas }, { count: aulas }, { count: logros }] = await Promise.all([
                supabase.from('proyectos').select('id', { count: 'exact', head: true }).eq('alumno_id', usuarioEditando.id),
                supabase.from('entregas_proyectos').select('id', { count: 'exact', head: true }).eq('estudiante_id', usuarioEditando.id),
                supabase.from('aula_alumnos').select('aula_id', { count: 'exact', head: true }).eq('alumno_id', usuarioEditando.id),
                supabase.from('usuario_logros').select('id', { count: 'exact', head: true }).eq('perfil_id', usuarioEditando.id),
            ]);
            setImpactoEliminar({
                tipo: 'alumno',
                lineas: [
                    `${proyectos || 0} proyecto(s)`,
                    `${entregas || 0} entrega(s)/calificación(es)`,
                    `${aulas || 0} inscripción(es) a aula`,
                    `${logros || 0} logro(s) desbloqueado(s)`,
                ],
            });
        } else if (usuarioEditando.rol === 'profesor') {
            const { data: aulasDelProfe } = await supabase
                .from('aulas').select('id').eq('profesor_id', usuarioEditando.id);
            const aulaIds = (aulasDelProfe || []).map(a => a.id);
            let tareas = 0, alumnosInscritos = 0;
            if (aulaIds.length > 0) {
                const [{ count: tCount }, { count: aCount }] = await Promise.all([
                    supabase.from('tareas').select('id', { count: 'exact', head: true }).in('aula_id', aulaIds),
                    supabase.from('aula_alumnos').select('aula_id', { count: 'exact', head: true }).in('aula_id', aulaIds),
                ]);
                tareas = tCount || 0;
                alumnosInscritos = aCount || 0;
            }
            setImpactoEliminar({
                tipo: 'profesor',
                lineas: [
                    `${aulaIds.length} aula(s) completa(s), con todas sus tareas y mensajes`,
                    `${tareas} tarea(s) de esas aulas (y las entregas/calificaciones asociadas)`,
                    `${alumnosInscritos} inscripción(es) de alumnos a esas aulas (los alumnos NO se borran, solo pierden esa aula)`,
                ],
            });
        } else {
            setImpactoEliminar({ tipo: usuarioEditando.rol, lineas: ['Esta cuenta no tiene aulas ni proyectos propios asociados.'] });
        }
        setCargandoImpacto(false);
    };

    const cancelarConfirmarEliminar = () => {
        setConfirmandoEliminar(false);
        setImpactoEliminar(null);
        setUsernameConfirmacion('');
    };

    const handleEliminarPermanente = async () => {
        if (!usuarioEditando) return;
        if (usernameConfirmacion !== usuarioEditando.username) return;

        setEliminandoPermanente(true);
        const { data, error } = await supabase.functions.invoke('eliminar-usuario-permanente', {
            body: { usuario_id: usuarioEditando.id, username_confirmacion: usernameConfirmacion },
        });
        setEliminandoPermanente(false);

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
            console.error('ERROR ELIMINAR PERMANENTE:', error, '| Mensaje:', mensajeError);
            return mostrarAlerta('error', mensajeError || 'Error desconocido al eliminar la cuenta.');
        }

        mostrarAlerta('success', `Cuenta @${data.username} eliminada de forma permanente.`);
        cerrarModal();
        cargarUsuarios();
        onRefreshDatos?.();
    };

    // ── Activar / desactivar usuario (toggle, no borra nada) ──────────────────
    const handleToggleActivo = async (usuario) => {
        const activarlo = !usuario.activo;
        const confirmacion = activarlo
            ? `¿Reactivar a @${usuario.username}? Recuperará su acceso a la plataforma.`
            : `¿Desactivar a @${usuario.username}? Perderá su acceso a la plataforma, pero sus datos se conservarán.`;
        if (!window.confirm(confirmacion)) return;
        const { data: filas, error } = await supabase
            .from('perfiles')
            .update({ activo: activarlo })
            .eq('id', usuario.id)
            .select('id');
        if (error) {
            console.error('ERROR al cambiar estado del usuario:', error);
            mostrarAlerta('error', `Error al ${activarlo ? 'reactivar' : 'desactivar'}: ${error.message}`);
        } else if (!filas || filas.length === 0) {
            mostrarAlerta('error', `No se pudo ${activarlo ? 'reactivar' : 'desactivar'} al usuario. Verifica que tienes permisos.`);
        } else {
            mostrarAlerta('success', activarlo
                ? `Usuario @${usuario.username} reactivado.`
                : `Usuario @${usuario.username} desactivado. Sus datos se han conservado.`);
            cargarUsuarios();
            onRefreshDatos?.();
        }
    };

    // ── Filtrar ───────────────────────────────────────────────────────────────
    const usuariosFiltrados = usuarios.filter(u => {
        const coincideRol     = filtroRol === 'todos' || u.rol === filtroRol;
        const coincideEscuela = filtroEscuela === 'todas' || u.escuelas?.nombre === filtroEscuela;
        const q = busqueda.toLowerCase();
        const coincideBusqueda = !q
            || u.username?.toLowerCase().includes(q)
            || u.nombre?.toLowerCase().includes(q)
            || u.apellido?.toLowerCase().includes(q)
            || u.escuelas?.nombre?.toLowerCase().includes(q);
        return coincideRol && coincideEscuela && coincideBusqueda;
    });

    return (
        <>
            {/* ── Modal Crear / Editar Usuario ── */}
            {modalAbierto && (
                <div className={styles.modalOverlay} onClick={cerrarModal}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>

                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <div className={styles.modalIcon}>
                                    <img src={modoModal === 'crear' ? iconCrear : iconEditar} alt="" className={styles.modalIconImg} />
                                </div>
                                <div>
                                    <h3 className={styles.modalTitle}>
                                        {modoModal === 'crear' ? 'Crear Nuevo Usuario' : `Editar @${usuarioEditando?.username}`}
                                    </h3>
                                    <p className={styles.modalSubtitle}>
                                        {modoModal === 'crear'
                                            ? 'Rellena los datos del nuevo miembro'
                                            : 'Modifica el rol o escuela del usuario'}
                                    </p>
                                </div>
                            </div>
                            <button className={styles.modalClose} onClick={cerrarModal}>✕</button>
                        </div>

                        <div className={styles.modalBody}>

                             <div className={styles.rolPreview}>
                                <span className={styles.rolPreviewLabel}>Rol seleccionado:</span>
                                <span className={styles.rolBadge}
                                    style={{ color: ROL_CONFIG[fRol]?.color, background: ROL_CONFIG[fRol]?.bg }}>
                                    {ROL_CONFIG[fRol]?.label}
                                </span>
                            </div>

                            <div className={styles.modalRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Rol</label>
                                    <select className={styles.fieldSelect} value={fRol} onChange={e => setFRol(e.target.value)}>
                                        {Object.entries(ROL_CONFIG)
                                            .filter(([key]) => esSuperAdmin || key === 'profesor' || key === 'alumno')
                                            .map(([key, cfg]) => (
                                                <option key={key} value={key}>{cfg.label}</option>
                                            ))}
                                    </select>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Escuela</label>
                                    {fRol === 'superadmin' ? (
                                        <div className={styles.fieldReadonly}>No aplica — Administrador Plataforma no pertenece a una escuela</div>
                                    ) : esSuperAdmin ? (
                                        <select className={styles.fieldSelect} value={fEscuelaId} onChange={e => setFEscuelaId(e.target.value)}>
                                            <option value="">— Selecciona —</option>
                                            {escuelasActivas.map(e => (
                                                <option key={e.id} value={e.id}>{e.nombre}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className={styles.fieldReadonly}>{miEscuela?.nombre || 'Tu escuela'}</div>
                                    )}
                                </div>
                            </div>


                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    {modoModal === 'crear' ? 'Crear Usuario' : 'Usuario'}
                                </label>
                                {modoModal === 'crear' ? (
                                    <input type="text" className={styles.fieldInput}
                                        placeholder="Crear usuario (sin espacios ni acentos)"
                                        value={fUsername} onChange={e => setFUsername(e.target.value)} />
                                ) : (
                                    <div className={styles.fieldReadonly}>@{usuarioEditando?.username}</div>
                                )}
                            </div>

        

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Nombre</label>
                                <input type="text" className={styles.fieldInput}
                                    placeholder="Nombre(s) del usuario"
                                    value={fNombre} onChange={e => setFNombre(e.target.value)} />
                            </div>

                            <div className={styles.modalRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Apellido Paterno</label>
                                    <input type="text" className={styles.fieldInput}
                                        placeholder="Apellido Paterno"
                                        value={fApellidoPaterno} onChange={e => setFApellidoPaterno(e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Apellido Materno</label>
                                    <input type="text" className={styles.fieldInput}
                                        placeholder="Apellido Materno"
                                        value={fApellidoMaterno} onChange={e => setFApellidoMaterno(e.target.value)} />
                                </div>
                            </div>

                            {modoModal === 'crear' && (
                                <>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Contraseña Temporal</label>
                                        <div className={styles.passwordWrapper}>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className={styles.fieldInput}
                                                placeholder={`Mínimo ${PASS_MIN} caracteres — puede llevar espacios`}
                                                maxLength={PASS_MAX}
                                                autoComplete="new-password"
                                                value={fPassword} onChange={e => setFPassword(e.target.value)} />
                                            <button type="button" className={styles.eyeButton}
                                                onClick={() => setShowPassword(v => !v)}
                                                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                                                <IconoOjo visible={showPassword} size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Confirmar Contraseña Temporal</label>
                                        <div className={styles.passwordWrapper}>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className={styles.fieldInput}
                                                placeholder="Confirma la contraseña"
                                                maxLength={PASS_MAX}
                                                autoComplete="new-password"
                                                value={fConfirmPassword} onChange={e => setFConfirmPassword(e.target.value)} />
                                            <button type="button" className={styles.eyeButton}
                                                onClick={() => setShowConfirmPassword(v => !v)}
                                                aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}>
                                                <IconoOjo visible={showConfirmPassword} size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    Comentarios / Motivo del cambio
                                    {modoModal === 'editar' && <span className={styles.requeridoTag}> * requerido</span>}
                                </label>
                                <textarea className={styles.fieldTextarea}
                                    placeholder={modoModal === 'crear'
                                        ? 'Ej. Profesor de matemáticas en Escuela Pública 1'
                                        : 'Ej. Se cambia rol a Profesor por solicitud del director'}
                                    value={fNotas} onChange={e => setFNotas(e.target.value)} rows={3} />
                            </div>

                            {/* ── Zona de peligro: borrado permanente (solo superadmin, solo editando) ── */}
                            {esSuperAdmin && modoModal === 'editar' && usuarioEditando && (
                                <div className={local.zonaPeligro}>
                                    <p className={local.zonaPeligroTitulo}>⚠ Precaución Eliminación Permanente</p>
                                    {!confirmandoEliminar ? (
                                        <>
                                            <p className={local.zonaPeligroDesc}>
                                                Borra la cuenta de forma permanente e irreversible — no es lo mismo que desactivar.
                                            </p>
                                            <button type="button" className={local.btnAbrirEliminar} onClick={abrirConfirmarEliminar}>
                                                Eliminar cuenta permanentemente
                                            </button>
                                        </>
                                    ) : cargandoImpacto ? (
                                        <p className={local.zonaPeligroDesc}>Calculando qué se vería afectado...</p>
                                    ) : (
                                        <>
                                            <p className={local.zonaPeligroDesc}>Esto también borrará para siempre:</p>
                                            <ul className={local.listaImpacto}>
                                                {impactoEliminar?.lineas.map((linea, i) => <li key={i}>{linea}</li>)}
                                            </ul>
                                            <label className={styles.fieldLabel}>
                                                Escribe <strong className={local.usernameLiteral}>{usuarioEditando.username}</strong> para confirmar
                                            </label>
                                            <input
                                                type="text"
                                                className={styles.fieldInput}
                                                placeholder={usuarioEditando.username}
                                                value={usernameConfirmacion}
                                                onChange={e => setUsernameConfirmacion(e.target.value)}
                                                autoComplete="off"
                                            />
                                            <div className={local.accionesEliminar}>
                                                <button type="button" className={styles.btnCancelar} onClick={cancelarConfirmarEliminar} disabled={eliminandoPermanente}>
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    className={local.btnConfirmarEliminar}
                                                    onClick={handleEliminarPermanente}
                                                    disabled={eliminandoPermanente || usernameConfirmacion !== usuarioEditando.username}
                                                >
                                                    {eliminandoPermanente ? 'Eliminando...' : 'Eliminar para siempre'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancelar} onClick={cerrarModal} disabled={enviandoModal}>
                                Cancelar
                            </button>
                            <button className={styles.btnSubmit}
                                onClick={modoModal === 'crear' ? handleCreateUser : handleUpdateUser}
                                disabled={enviandoModal}>
                                {enviandoModal
                                    ? <><span className={styles.btnSpinner} />Guardando...</>
                                    : modoModal === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tabla de usuarios ── */}
            <div className={styles.gestionSection}>
                <div className={styles.gestionHeader}>
                    <img src={iconUsuario} alt="" className={styles.gestionHeaderIcon} />
                    <span className={styles.gestionHeaderLabel}>Gestión de Usuarios</span>
                </div>

                <div className={styles.usuariosPanel}>
                    <div className={styles.usuariosTopbar}>
                        <div className={styles.filtrosBar}>
                            <input type="text" className={styles.buscador}
                                placeholder="Buscar usuario o escuela..."
                                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                            {esSuperAdmin && (
                                <select
                                    className={styles.fieldSelect}
                                    value={filtroEscuela}
                                    onChange={e => setFiltroEscuela(e.target.value)}
                                >
                                    <option value="todas">Todas las escuelas</option>
                                    {escuelasActivas.map(esc => (
                                        <option key={esc.id} value={esc.nombre}>{esc.nombre}</option>
                                    ))}
                                </select>
                            )}
                            <div className={styles.filtroRoles}>
                                {['todos', 'superadmin', 'admin_escuela', 'profesor', 'alumno']
                                    
                                    .filter(rol => {
                                        if (perfil?.rol !== 'superadmin') {
                                           
                                            return ['todos', 'profesor', 'alumno'].includes(rol);
                                        }
                                        
                                        return true;
                                    })
                                    .map(rol => (
                                        <button key={rol}
                                            className={`${styles.filtroBtn} ${filtroRol === rol ? styles.filtroBtnActivo : ''}`}
                                            onClick={() => setFiltroRol(rol)}>
                                            {rol === 'todos' ? 'Todos' : ROL_CONFIG[rol]?.label}
                                        </button>
                                    ))}
                            </div>
                        </div>
                        <button className={styles.btnCrearUsuario} onClick={abrirModalCrear}>
                            + Crear Usuario
                        </button>
                    </div>

                    {cargandoUsers ? (
                        <div className={styles.loadingState}>Cargando usuarios...</div>
                    ) : usuariosFiltrados.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src={iconUsuario} alt="" className={styles.emptyIcon} />
                            <p className={styles.emptyText}>No hay usuarios con ese filtro.</p>
                        </div>
                    ) : (
                        <div className={styles.usuariosTableScroll}>
                            <div className={styles.usuariosGrid}>
                                <div className={styles.usuariosHeader}>
                                    <span>Usuario</span>
                                    <span>Rol</span>
                                    <span>Escuela</span>
                                    <span>Notas Admin</span>
                                    <span>Registro</span>
                                    <span>Estado</span>
                                    <span>Acciones</span>
                                </div>
                                {usuariosFiltrados.map((u, i) => {
                                    const cfg = ROL_CONFIG[u.rol] || {};
                                    return (
                                        <div key={u.id} className={`${styles.usuarioRow} ${!u.activo ? local.filaInactiva : ''}`} style={{ animationDelay: `${i * 0.04}s` }}>
                                            <div className={styles.usuarioUsername}>
                                                <div className={styles.usuarioAvatar}>
                                                    {(u.nombre || u.username)?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className={local.cellNombrePrimary}>
                                                        {[u.nombre, u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ') || '—'}
                                                    </div>
                                                    <div className={local.cellUsernameSecondary}>@{u.username}</div>
                                                </div>
                                            </div>
                                            <div className={styles.rolCell}>
                                                <span className={styles.rolBadge} style={{ color: cfg.color, background: cfg.bg }}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className={styles.usuarioEscuela}>
                                                {u.escuelas?.nombre || <span className={local.textoMuted}>Sin escuela</span>}
                                            </div>
                                            <div className={styles.usuarioNotas} title={u.notas_admin || ''}>
                                                {u.notas_admin || <span className={local.textoDash}>—</span>}
                                            </div>
                                            <div className={styles.usuarioFecha}>{formatearFecha(u.created_at)}</div>
                                            <div>
                                                <button
                                                    className={local.btnToggleActivo}
                                                    title={u.activo ? 'Activo — clic para desactivar' : 'Inactivo — clic para reactivar'}
                                                    onClick={() => handleToggleActivo(u)}
                                                >
                                                    <img src={u.activo ? iconActivado : iconDesactivado} alt={u.activo ? 'Activo' : 'Inactivo'} />
                                                </button>
                                            </div>
                                            <div className={local.accionesRow}>
                                                <button className={styles.btnEditar} onClick={() => abrirModalEditar(u)}>
                                                    <img src={iconEditar} alt="" className={local.iconoBoton} />
                                                    Editar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={styles.usuariosFooter}>
                        Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
                    </div>
                </div>
            </div>
        </>
    );
};

export default VistaUsuarios;

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import iconUsuario from '../../../assets/iconos-ui/ui-usuario.svg';
import iconConfig  from '../../../assets/iconos-ui/ui-configuracion.svg';
import styles from '../Dashboard.css';
import local  from './VistaUsuarios.css';

const ROL_CONFIG = {
    superadmin:    { label: 'Superadmin',    color: '#f59e0b', bg: '#fef3c7' },
    admin_escuela: { label: 'Admin Escuela', color: '#8b5cf6', bg: '#ede9fe' },
    profesor:      { label: 'Profesor',      color: '#3b82f6', bg: '#dbeafe' },
    alumno:        { label: 'Alumno',        color: '#10b981', bg: '#d1fae5' },
};

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const EyeOpen = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOff = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

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

    // ── Cargar usuarios ───────────────────────────────────────────────────────
    const cargarUsuarios = useCallback(async () => {
        setCargandoUsers(true);
        let query = supabase
            .from('perfiles')
            .select('id, username, nombre, apellido, apellido_paterno, apellido_materno, rol, escuela_id, notas_admin, created_at, escuelas(nombre)')
            .eq('activo', true)
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
    };

    // ── Crear usuario vía Edge Function ───────────────────────────────────────
    const handleCreateUser = async () => {
        if (!fUsername.trim()) return mostrarAlerta('error', 'Escribe un nombre de usuario válido.');
        if (fPassword.trim().length < 6) return mostrarAlerta('error', 'La contraseña debe tener mínimo 6 caracteres.');
        if (fPassword !== fConfirmPassword) return mostrarAlerta('error', 'Las contraseñas no coinciden.');

        const escuelaIdFinal = esSuperAdmin ? fEscuelaId : perfil?.escuela_id;
        const rolFinal = esSuperAdmin
            ? fRol
            : (fRol === 'profesor' || fRol === 'alumno') ? fRol : 'alumno';

        if (!escuelaIdFinal) return mostrarAlerta('error', 'Selecciona una escuela.');

        const usernameNorm = fUsername.trim().toLowerCase().replace(/\s+/g, '-');

        const payload = {
            username:    usernameNorm,
            password:    fPassword,
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

        const escuelaIdFinal = esSuperAdmin
            ? (fEscuelaId || usuarioEditando.escuela_id)
            : perfil?.escuela_id;
        const rolFinal = esSuperAdmin
            ? fRol
            : (fRol === 'profesor' || fRol === 'alumno') ? fRol : usuarioEditando.rol;

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

    // ── Desactivar usuario (Soft Delete) ─────────────────────────────────────
    const handleDeleteUser = async (usuario) => {
        if (!window.confirm('¿Estás seguro de desactivar a este usuario? Perderá su acceso a la plataforma, pero sus datos se conservarán.')) return;
        const { data: filas, error } = await supabase
            .from('perfiles')
            .update({ activo: false })
            .eq('id', usuario.id)
            .select('id');
        if (error) {
            console.error('ERROR al desactivar usuario:', error);
            mostrarAlerta('error', `Error al desactivar: ${error.message}`);
        } else if (!filas || filas.length === 0) {
            mostrarAlerta('error', 'No se pudo desactivar el usuario. Verifica que tienes permisos.');
        } else {
            mostrarAlerta('success', `Usuario @${usuario.username} desactivado. Sus datos se han conservado.`);
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
                                    <img src={modoModal === 'crear' ? iconUsuario : iconConfig} alt="" className={styles.modalIconImg} />
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

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    {modoModal === 'crear' ? 'Nombre de Usuario' : 'Usuario'}
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
                                                placeholder="Mínimo 6 caracteres, sin espacios ni acentos"
                                                value={fPassword} onChange={e => setFPassword(e.target.value)} />
                                            <button type="button" className={styles.eyeButton}
                                                onClick={() => setShowPassword(v => !v)}
                                                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                                                {showPassword ? <EyeOff /> : <EyeOpen />}
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
                                                value={fConfirmPassword} onChange={e => setFConfirmPassword(e.target.value)} />
                                            <button type="button" className={styles.eyeButton}
                                                onClick={() => setShowConfirmPassword(v => !v)}
                                                aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}>
                                                {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

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
                                    {esSuperAdmin ? (
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
                                    Comentarios / Motivo del cambio
                                    {modoModal === 'editar' && <span className={styles.requeridoTag}> * requerido</span>}
                                </label>
                                <textarea className={styles.fieldTextarea}
                                    placeholder={modoModal === 'crear'
                                        ? 'Ej. Profesor de matemáticas en Escuela Pública 1'
                                        : 'Ej. Se cambia rol a Profesor por solicitud del director'}
                                    value={fNotas} onChange={e => setFNotas(e.target.value)} rows={3} />
                            </div>

                            <div className={styles.rolPreview}>
                                <span className={styles.rolPreviewLabel}>Rol seleccionado:</span>
                                <span className={styles.rolBadge}
                                    style={{ color: ROL_CONFIG[fRol]?.color, background: ROL_CONFIG[fRol]?.bg }}>
                                    {ROL_CONFIG[fRol]?.label}
                                </span>
                            </div>
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
                                    <span>Acciones</span>
                                </div>
                                {usuariosFiltrados.map((u, i) => {
                                    const cfg = ROL_CONFIG[u.rol] || {};
                                    return (
                                        <div key={u.id} className={styles.usuarioRow} style={{ animationDelay: `${i * 0.04}s` }}>
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
                                            <div className={local.accionesRow}>
                                                <button className={styles.btnEditar} onClick={() => abrirModalEditar(u)}>
                                                    Editar
                                                </button>
                                                <button className={styles.btnEliminar} onClick={() => handleDeleteUser(u)}>
                                                    Eliminar
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

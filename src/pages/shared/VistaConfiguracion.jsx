import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabaseClient';
import { marcarCambiosSinGuardar } from '../../lib/navGuard';
import styles from './VistaConfiguracion.css';

const ROL_LABEL = {
    alumno:        'Alumno',
    profesor:      'Profesor',
    admin_escuela: 'Administrador de Escuela',
    superadmin:    'Administrador de la Plataforma',
};

const PASS_MIN = 8;

// ── Icono de ojo (mostrar / ocultar contraseña) ──────────────────────────────
const IconoOjo = ({ visible }) => (
    visible ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
);

const VistaConfiguracion = ({ userId, mostrarAlerta, onPerfilActualizado }) => {
    const [nombre,          setNombre]          = useState('');
    const [apellidoPaterno, setApellidoPaterno] = useState('');
    const [apellidoMaterno, setApellidoMaterno] = useState('');
    const [username,        setUsername]        = useState('');
    const [cargando,        setCargando]        = useState(true);
    const [guardando,       setGuardando]       = useState(false);
    const [mensaje,         setMensaje]         = useState(null);

    // Snapshot de los valores guardados, para detectar cambios sin guardar
    const [iniciales, setIniciales] = useState({ nombre: '', apellidoPaterno: '', apellidoMaterno: '' });

    // Datos de solo lectura
    const [infoCuenta, setInfoCuenta] = useState({ rol: '', escuela: '', creado: '' });
    const [rolRaw, setRolRaw] = useState('');
    const [email,  setEmail]  = useState('');

    // Cambio de contraseña
    const [passActual,    setPassActual]    = useState('');
    const [nuevaPass,     setNuevaPass]     = useState('');
    const [confirmarPass, setConfirmarPass] = useState('');
    const [guardandoPass, setGuardandoPass] = useState(false);
    const [verPassActual,   setVerPassActual]   = useState(false);
    const [verNuevaPass,    setVerNuevaPass]    = useState(false);
    const [verConfirmarPass, setVerConfirmarPass] = useState(false);

    // El alumno no gestiona su propia contraseña (la resetea su profesor/admin)
    const puedeCambiarPass = rolRaw !== '' && rolRaw !== 'alumno';

    // ── Mostrar mensaje: usa la alerta del dashboard padre si está disponible ─
    const mostrarMensaje = (tipo, texto) => {
        if (mostrarAlerta) {
            mostrarAlerta(tipo, texto);
        } else {
            setMensaje({ tipo, texto });
            setTimeout(() => setMensaje(null), 4000);
        }
    };

    // ── Carga segura del perfil ───────────────────────────────────────────────
    useEffect(() => {
        if (!userId) {
            setCargando(false);
            return;
        }
        const cargarPerfil = async () => {
            setCargando(true);
            try {
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('nombre, apellido_paterno, apellido_materno, username, rol, created_at, escuelas(nombre)')
                    .eq('id', userId)
                    .single();
                if (error) throw error;

                const n  = data?.nombre           || '';
                const ap = data?.apellido_paterno || '';
                const am = data?.apellido_materno || '';

                setNombre(n);
                setApellidoPaterno(ap);
                setApellidoMaterno(am);
                setUsername(data?.username || '');
                setIniciales({ nombre: n, apellidoPaterno: ap, apellidoMaterno: am });
                setRolRaw(data?.rol || '');

                // Email de la sesión (para verificar la contraseña actual)
                const { data: authData } = await supabase.auth.getUser();
                setEmail(authData?.user?.email || '');

                setInfoCuenta({
                    rol:     ROL_LABEL[data?.rol] || data?.rol || '—',
                    escuela: data?.escuelas?.nombre || '—',
                    creado:  data?.created_at
                        ? new Date(data.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'long', year: 'numeric',
                        })
                        : '—',
                });
            } catch (err) {
                console.error('[BLOCKIDS] Error cargando perfil:', err);
            } finally {
                setCargando(false);
            }
        };
        cargarPerfil();
    }, [userId]);

    // ── Detectar cambios sin guardar ─────────────────────────────────────────
    const hayCambios = useMemo(() => (
        nombre.trim()          !== iniciales.nombre
        || apellidoPaterno.trim() !== iniciales.apellidoPaterno
        || apellidoMaterno.trim() !== iniciales.apellidoMaterno
    ), [nombre, apellidoPaterno, apellidoMaterno, iniciales]);

    // Aviso al cerrar/recargar la pestaña (navegador) y al cambiar de vista
    // dentro del dashboard (navGuard) con cambios pendientes.
    useEffect(() => {
        marcarCambiosSinGuardar(hayCambios);
        if (!hayCambios) return undefined;
        const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hayCambios]);

    // Al salir de la vista, limpiar la guardia (por si quedó marcada)
    useEffect(() => () => marcarCambiosSinGuardar(false), []);

    // ── Guardar datos personales ─────────────────────────────────────────────
    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!nombre.trim() || !apellidoPaterno.trim()) {
            mostrarMensaje('error', 'El nombre y el apellido paterno son obligatorios.');
            return;
        }
        if (!hayCambios) return;

        setGuardando(true);
        try {
            const payload = {
                nombre:           nombre.trim(),
                apellido_paterno: apellidoPaterno.trim(),
                apellido_materno: apellidoMaterno.trim(),
            };
            const { error } = await supabase.from('perfiles').update(payload).eq('id', userId);
            if (error) throw error;

            setIniciales({
                nombre:          payload.nombre,
                apellidoPaterno: payload.apellido_paterno,
                apellidoMaterno: payload.apellido_materno,
            });
            onPerfilActualizado?.({ ...payload, username });
            mostrarMensaje('success', '¡Perfil actualizado correctamente!');
        } catch (err) {
            mostrarMensaje('error', `Error al guardar: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // ── Cambiar contraseña ──────────────────────────────────────────────────
    const handleCambiarPass = async (e) => {
        e.preventDefault();
        if (!puedeCambiarPass) return;
        if (!passActual) {
            mostrarMensaje('error', 'Escribe tu contraseña actual.');
            return;
        }
        if (nuevaPass.length < PASS_MIN) {
            mostrarMensaje('error', `La contraseña debe tener al menos ${PASS_MIN} caracteres.`);
            return;
        }
        if (nuevaPass !== confirmarPass) {
            mostrarMensaje('error', 'Las contraseñas no coinciden.');
            return;
        }
        if (nuevaPass === passActual) {
            mostrarMensaje('error', 'La nueva contraseña debe ser distinta de la actual.');
            return;
        }
        setGuardandoPass(true);
        try {
            // 1) Verificar la contraseña actual
            if (!email) throw new Error('No se pudo verificar la sesión. Vuelve a iniciar sesión.');
            const { error: errVerif } = await supabase.auth.signInWithPassword({
                email,
                password: passActual,
            });
            if (errVerif) throw new Error('La contraseña actual no es correcta.');

            // 2) Actualizar a la nueva
            const { error } = await supabase.auth.updateUser({ password: nuevaPass });
            if (error) throw error;
            setPassActual('');
            setNuevaPass('');
            setConfirmarPass('');
            mostrarMensaje('success', 'Contraseña actualizada correctamente.');
        } catch (err) {
            mostrarMensaje('error', `No se pudo cambiar la contraseña: ${err.message}`);
        } finally {
            setGuardandoPass(false);
        }
    };

    if (cargando) {
        return <div className={styles.cargando}>Cargando perfil...</div>;
    }

    return (
        <div className={styles.wrapper}>

            {/* Alerta local (solo si el dashboard no pasó mostrarAlerta) */}
            {mensaje && (
                <div className={`${styles.alerta} ${mensaje.tipo === 'success' ? styles.alertaSuccess : styles.alertaError}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* ── Tarjeta: datos de la cuenta (solo lectura) ── */}
            <div className={`${styles.card} ${styles.cardStacked}`}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Datos de la cuenta</h2>
                    <p className={styles.cardSubtitle}>Información de tu cuenta </p>
                </div>
                <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Rol</span>
                        <span className={styles.infoValue}>{infoCuenta.rol}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Escuela</span>
                        <span className={styles.infoValue}>{infoCuenta.escuela}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Miembro desde</span>
                        <span className={styles.infoValue}>{infoCuenta.creado}</span>
                    </div>
                </div>
            </div>
            {/* ── Tarjeta: datos personales ── */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Mi Perfil</h2>
                    <p className={styles.cardSubtitle}>Actualiza tu información personal</p>
                </div>

                <form className={styles.form} onSubmit={handleGuardar}>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cfg-nombre">Nombre</label>
                        <input
                            id="cfg-nombre"
                            type="text"
                            className={styles.fieldInput}
                            placeholder="Nombre(s)"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            disabled={guardando}
                            maxLength={60}
                        />
                    </div>

                    <div className={styles.fieldGroupGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="cfg-ap">Apellido Paterno</label>
                            <input
                                id="cfg-ap"
                                type="text"
                                className={styles.fieldInput}
                                placeholder="Apellido paterno"
                                value={apellidoPaterno}
                                onChange={(e) => setApellidoPaterno(e.target.value)}
                                disabled={guardando}
                                maxLength={60}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="cfg-am">Apellido Materno</label>
                            <input
                                id="cfg-am"
                                type="text"
                                className={styles.fieldInput}
                                placeholder="Apellido materno"
                                value={apellidoMaterno}
                                onChange={(e) => setApellidoMaterno(e.target.value)}
                                disabled={guardando}
                                maxLength={60}
                            />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cfg-username">
                            Nombre de usuario
                            {/* <span className={styles.fieldLabelNote}>(no editable)</span> */}
                        </label>
                        <input
                            id="cfg-username"
                            type="text"
                            className={styles.fieldInput}
                            value={`@${username}`}
                            disabled
                            readOnly
                        />
                    </div>

                    <div className={styles.formFooter}>
                        {hayCambios && (
                            <span className={styles.dirtyHint}>Tienes cambios sin guardar</span>
                        )}
                        <button
                            type="submit"
                            className={styles.btnGuardar}
                            disabled={guardando || !hayCambios}
                        >
                            {guardando ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Tarjeta: seguridad (el alumno no cambia su propia contraseña) ── */}
            {puedeCambiarPass && (
            <div className={`${styles.card} ${styles.cardStacked}`}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Seguridad</h2>
                    <p className={styles.cardSubtitle}>Cambia tu contraseña de acceso</p>
                </div>

                <form className={styles.form} onSubmit={handleCambiarPass}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cfg-pass0">Contraseña actual</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="cfg-pass0"
                                type={verPassActual ? 'text' : 'password'}
                                className={`${styles.fieldInput} ${styles.inputWithEye}`}
                                placeholder="Tu contraseña actual"
                                value={passActual}
                                onChange={(e) => setPassActual(e.target.value)}
                                disabled={guardandoPass}
                                autoComplete="current-password"
                                maxLength={72}
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setVerPassActual((v) => !v)}
                                disabled={guardandoPass}
                                aria-label={verPassActual ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <IconoOjo visible={verPassActual} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cfg-pass1">Nueva contraseña</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="cfg-pass1"
                                type={verNuevaPass ? 'text' : 'password'}
                                className={`${styles.fieldInput} ${styles.inputWithEye}`}
                                placeholder={`Mínimo ${PASS_MIN} caracteres`}
                                value={nuevaPass}
                                onChange={(e) => setNuevaPass(e.target.value)}
                                disabled={guardandoPass}
                                autoComplete="new-password"
                                maxLength={72}
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setVerNuevaPass((v) => !v)}
                                disabled={guardandoPass}
                                aria-label={verNuevaPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <IconoOjo visible={verNuevaPass} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cfg-pass2">Confirmar contraseña</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="cfg-pass2"
                                type={verConfirmarPass ? 'text' : 'password'}
                                className={`${styles.fieldInput} ${styles.inputWithEye}`}
                                placeholder="Confirma la contraseña"
                                value={confirmarPass}
                                onChange={(e) => setConfirmarPass(e.target.value)}
                                disabled={guardandoPass}
                                autoComplete="new-password"
                                maxLength={72}
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setVerConfirmarPass((v) => !v)}
                                disabled={guardandoPass}
                                aria-label={verConfirmarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <IconoOjo visible={verConfirmarPass} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.formFooter}>
                        <button
                            type="submit"
                            className={styles.btnGuardar}
                            disabled={guardandoPass || !passActual || !nuevaPass || !confirmarPass}
                        >
                            {guardandoPass ? 'Guardando...' : 'Cambiar contraseña'}
                        </button>
                    </div>
                </form>
            </div>
            )}

        </div>
    );
};

export default VistaConfiguracion;

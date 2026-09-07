import React, { useState, useEffect } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import styles from './Register.css';
import xolotlIdea from '../assets/xolotl/xolotl-idea.svg';
import logoXolotl from '../assets/logos/logo-horizontal-colores.svg';
import iconClase from '../assets/iconos/icon-clase.svg';
import iconEscuela from '../assets/iconos/icon-escuela.svg';
import iconBienvenidaProfesor from '../assets/iconos/icon-bienvenida-profesor.svg';
import iconBienvenidaAlumno from '../assets/iconos/icon-bienvenida-alumno.svg';

// "José Pérez López" -> "jose-perez-lopez"
// normalize('NFD') separa cada acento en un carácter aparte que luego elimina
// el filtro [^a-z0-9\s-]; así no hacen falta rangos Unicode ilegibles.
const aSlug = (texto) =>
    texto
        .normalize('NFD')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

// Sufijo aleatorio de 3 caracteres (base36) para el anti-colisión: "-7f4"
const sufijoAleatorio = () => (Math.random().toString(36) + '000').slice(2, 5);

// Normaliza cualquier código tecleado (sin espacios, mayúsculas), igual que el
// resto de la app (alumno/Dashboard, admin/VistaEscuelas).
const normalizarCodigo = (v) => v.replace(/\s+/g, '').toUpperCase();

// Clave de acceso: 6-10 caracteres, solo alfanumérico y guiones, sin espacios.
// El mínimo de 6 coincide con el que Supabase Auth exige por defecto.
const PATRON_CLAVE = '[a-zA-Z0-9-]{6,10}';
const RE_CLAVE = /^[a-zA-Z0-9-]{6,10}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const iconoOjo = (visible) => (visible ? (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
) : (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
));

const NOMBRES_PASO = ['Código', 'Datos', 'Acceso'];

const Register = () => {
    const location = useLocation();
    const history = useHistory();

    // Prefill opcional del código por URL: /registro?codigo=ABC123
    const codigoURL = normalizarCodigo(new URLSearchParams(location.search).get('codigo') || '');

    // ── Paso 1: Código (define el rol) ──
    const [codigo, setCodigo] = useState(codigoURL);
    const [pinDocente, setPinDocente] = useState('');
    const [modoDocente, setModoDocente] = useState(false); // el código es clave de escuela -> pedir PIN

    // Resultado de la validación del paso 1
    const [rol, setRol] = useState('');                    // '' | 'alumno' | 'profesor' (NUNCA lo elige el usuario)
    const [escuela, setEscuela] = useState(null);          // { id, nombre }
    const [aula, setAula] = useState(null);                // { id, nombre } — solo alumno

    // ── Paso 2: Datos personales ──
    const [nombre, setNombre] = useState('');
    const [apellidoPaterno, setApellidoPaterno] = useState('');
    const [apellidoMaterno, setApellidoMaterno] = useState('');
    // Username: se autogenera del nombre, pero el usuario puede acortarlo/editarlo.
    const [username, setUsername] = useState('');
    const [usernameEditado, setUsernameEditado] = useState(false);

    // ── Paso 3: Credenciales ──
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [paso, setPaso] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const esAlumno = rol === 'alumno';

    // Username automático a partir del nombre; el usuario final es el que se
    // guarda (editado o no) ya normalizado a slug.
    const usernameAuto = aSlug(`${nombre} ${apellidoPaterno} ${apellidoMaterno}`);
    const usernameFinal = usernameEditado ? aSlug(username) : usernameAuto;

    // Mientras no lo hayan editado a mano, el campo sigue al nombre.
    useEffect(() => {
        if (!usernameEditado) setUsername(usernameAuto);
    }, [usernameAuto, usernameEditado]);

    // ── PASO 1: el CÓDIGO decide el rol ─────────────────────────────────────────
    // Toda la validación vive en el RPC `validar_codigo_registro` (SECURITY
    // DEFINER): el cliente NUNCA lee `escuelas`/`aulas` directo, así que el PIN
    // y las claves nunca viajan al navegador. El RPC devuelve un jsonb { tipo }:
    //   'alumno'        -> { aula_id, aula_nombre, escuela_id }
    //   'pin_requerido' -> { escuela_nombre }   (el código es clave de escuela)
    //   'profesor'      -> { escuela_id, escuela_nombre }
    //   'error'         -> { msg }   (escuela inactiva / PIN incorrecto)
    //   'invalido'      -> el código no coincide con nada
    const handleValidarCodigo = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const cod = normalizarCodigo(codigo);
            if (!cod) throw new Error('Ingresa tu código para continuar');
            if (modoDocente && !pinDocente.trim()) {
                throw new Error('Ingresa el PIN docente que te dio la dirección de tu escuela');
            }

            const { data, error: rpcError } = await supabase.rpc('validar_codigo_registro', {
                p_codigo: cod,
                p_pin: modoDocente ? pinDocente.trim().toUpperCase() : null
            });

            if (rpcError) {
                throw new Error('No pudimos validar tu código. Revisa tu conexión e intenta de nuevo.');
            }

            switch (data && data.tipo) {
            case 'alumno':
                setRol('alumno');
                setAula({ id: data.aula_id, nombre: data.aula_nombre });
                setEscuela({ id: data.escuela_id, nombre: '' });
                setPaso(2);
                return;

            case 'pin_requerido':
                // El código es una clave de escuela: NO avanza, pide el PIN.
                setModoDocente(true);
                setEscuela({ id: null, nombre: data.escuela_nombre || '' });
                return;

            case 'profesor':
                setRol('profesor');
                setEscuela({ id: data.escuela_id, nombre: data.escuela_nombre || '' });
                setAula(null);
                setPaso(2);
                return;

            case 'error':
                throw new Error(data.msg || 'No se pudo validar el código.');

            default:
                throw new Error('Ese código no es válido. Revísalo con tu profesor o con tu escuela.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── PASO 2: Datos personales ────────────────────────────────────────────────
    const handleDatosPersonales = (e) => {
        e.preventDefault();
        setError('');
        if (!nombre.trim()) return setError('Ingresa tu nombre');
        if (!apellidoPaterno.trim()) return setError('Ingresa tu apellido paterno');
        if (usernameFinal.length < 3) {
            return setError('El nombre de usuario debe tener al menos 3 caracteres (letras, números o guiones).');
        }
        setPaso(3);
    };

    // ── PASO 3: Crear cuenta (con anti-colisión de username por reintento) ──────
    const handleCrearCuenta = async (e) => {
        e.preventDefault();
        setError('');

        if (!RE_CLAVE.test(password)) {
            return setError('La clave de acceso debe tener de 6 a 10 caracteres: solo letras, números y guiones, sin espacios.');
        }
        if (password !== confirmPassword) {
            return setError('Las claves de acceso no coinciden');
        }
        if (!esAlumno && !RE_EMAIL.test(email.trim())) {
            return setError('Ingresa un correo electrónico válido para poder recuperar tu cuenta.');
        }

        setLoading(true);
        try {
            const base = usernameFinal || 'usuario';
            const correoReal = email.trim().toLowerCase();

            let cuenta = null;
            let ultimoError = null;

            // Intento 0: username base. Intentos 1-3: base + sufijo aleatorio.
            // Si la BD rechaza por unicidad (UNIQUE en perfiles.username, o el
            // correo fantasma del alumno ya existe), reintentamos con otro sufijo.
            for (let intento = 0; intento < 4 && !cuenta; intento++) {
                const username = intento === 0 ? base : `${base}-${sufijoAleatorio()}`;
                const emailAuth = esAlumno ? `${username}@blockids.com` : correoReal;

                // eslint-disable-next-line no-await-in-loop
                const { data, error: authError } = await supabase.auth.signUp({
                    email: emailAuth,
                    password: password,
                    options: {
                        data: {
                            username:         username,
                            nombre:           nombre.trim(),
                            apellido_paterno: apellidoPaterno.trim(),
                            apellido_materno: apellidoMaterno.trim(),
                            rol:              rol,
                            escuela_id:       escuela.id,
                            aula_id:          esAlumno ? (aula ? aula.id : null) : null,
                            email_contacto:   esAlumno ? null : correoReal
                        }
                    }
                });

                if (!authError) {
                    cuenta = data;
                    break;
                }

                ultimoError = authError;
                const msg = (authError.message || '').toLowerCase();
                const esColisionUsername =
                    msg.includes('database error') ||   // el trigger falló por UNIQUE(perfiles.username)
                    msg.includes('duplicate') ||
                    msg.includes('unique') ||
                    (esAlumno && (msg.includes('already registered') || msg.includes('already exists')));

                if (!esColisionUsername) {
                    // Error real (correo de docente ya en uso, contraseña débil, red...): no reintentar.
                    throw authError;
                }
            }

            if (!cuenta) {
                throw ultimoError || new Error('No pudimos crear tu cuenta. Intenta de nuevo más tarde.');
            }

            // Inscribir al alumno en su aula (solo si el signUp ya devolvió sesión).
            // Si no hay sesión (confirmación de correo activada), se une luego desde su panel.
            if (esAlumno && aula && cuenta.user && cuenta.session) {
                await supabase.from('aula_alumnos').insert({
                    aula_id:   aula.id,
                    alumno_id: cuenta.user.id,
                    joined_at: new Date().toISOString()
                });
            }

            setSuccess(true);
            setTimeout(() => history.push(esAlumno ? '/alumno' : '/profesor'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const volver = (aPaso) => {
        setPaso(aPaso);
        setError('');
    };

    const cambiarCodigo = (valor) => {
        setCodigo(valor);
        // Editar el código invalida cualquier validación previa del paso 1
        if (modoDocente || rol || escuela) {
            setModoDocente(false);
            setPinDocente('');
            setRol('');
            setEscuela(null);
            setAula(null);
        }
    };

    const barraProgreso = (
        <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
                {NOMBRES_PASO.map((etiqueta, i) => {
                    const n = i + 1;
                    return (
                        <React.Fragment key={etiqueta}>
                            <div className={`${styles.stepDot} ${paso >= n ? styles.stepActive : ''}`}>
                                {n}
                            </div>
                            {n < NOMBRES_PASO.length && (
                                <div className={`${styles.stepLine} ${paso > n ? styles.lineActive : ''}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <p className={styles.stepLabel}>Paso {paso} de {NOMBRES_PASO.length}</p>
        </div>
    );

    const badgeContexto = esAlumno
        ? (aula && aula.nombre && (
            <p className={styles.schoolBadge}><img src={iconClase} alt="" /> Clase: <strong>{aula.nombre}</strong></p>
        ))
        : (escuela && escuela.nombre && (
            <p className={styles.schoolBadge}><img src={iconEscuela} alt="" /> <strong>{escuela.nombre}</strong></p>
        ));

    return (
        <div className={styles.splitScreen}>
            <div className={styles.leftColumn}>
                <img src={xolotlIdea} alt="Xolotl con idea" className={styles.xolotlImg} />
                <h1 className={styles.leftTitle}>¡Crea tu cuenta!</h1>
                <p className={styles.leftSubtitle}>
                    Únete a Blockids y forma parte de una comunidad que inspira.
                </p>
            </div>

            <div className={styles.rightColumn}>
                <img src={logoXolotl} alt="Blockids" className={styles.logoImg} />

                {success ? (
                    <div className={styles.successContainer}>
                        <div className={styles.successIcon}>✓</div>
                        <h2 className={styles.successTitle}>¡Cuenta creada!</h2>
                        <p className={styles.successText}>
                            <img
                                src={rol === 'profesor' ? iconBienvenidaProfesor : iconBienvenidaAlumno}
                                alt=""
                                className={styles.roleWelcomeIcon}
                            />
                            Bienvenido/a a Blockids.{ '\n'}
                                Bienvenido/a a Blockids.{ '\n'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.formWrapper}>
                        {barraProgreso}

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        {/* ── PASO 1: CÓDIGO (define el rol, sin selector manual) ── */}
                        {paso === 1 && (
                            <form onSubmit={handleValidarCodigo} className={styles.form}>
                                <h2 className={styles.formTitle}>Ingresa tu código</h2>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-codigo">
                                        Código de acceso
                                    </label>
                                    <input
                                        id="reg-codigo"
                                        type="text"
                                        required
                                        placeholder="Ej. ABC-1234"
                                        value={codigo}
                                        onChange={(e) => cambiarCodigo(e.target.value)}
                                        className={styles.input}
                                        disabled={loading}
                                        autoComplete="off"
                                    />
                                    <p className={styles.helperText}>
                                        <strong>Alumno:</strong> el código de tu clase otorgado por tu profesor.{' '}
                                        <br />
                                        <strong>Docente:</strong> la clave de acceso de tu escuela.
                                    </p>
                                </div>

                                {modoDocente && (
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label} htmlFor="reg-pin">
                                            PIN docente
                                        </label>
                                        <input
                                            id="reg-pin"
                                            type="text"
                                            required
                                            placeholder="PIN docente"
                                            value={pinDocente}
                                            onChange={(e) => setPinDocente(e.target.value)}
                                            className={styles.input}
                                            disabled={loading}
                                            autoComplete="off"
                                        />
                                        <p className={styles.lockNote}>
                                            {escuela && escuela.nombre
                                                ? <span>Escuela detectada: <strong>{escuela.nombre}</strong>. </span>
                                                : <span>Detectamos una <strong>clave de escuela</strong>. </span>}
                                            Ingresa tu PIN docente para registrarte como <strong>Profesor</strong>.
                                        </p>
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className={styles.button}>
                                    {loading ? 'Validando...' : 'Continuar →'}
                                </button>
                            </form>
                        )}

                        {/* ── PASO 2: Datos personales ── */}
                        {paso === 2 && (
                            <form onSubmit={handleDatosPersonales} className={styles.form}>
                                <h2 className={styles.formTitle}>Datos personales</h2>
                                {badgeContexto}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-nombre">
                                        Nombre
                                    </label>
                                    <input
                                        id="reg-nombre"
                                        type="text"
                                        required
                                        placeholder="Escribe tu nombre"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.rowGroup}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label} htmlFor="reg-ap">
                                            Apellido Paterno
                                        </label>
                                        <input
                                            id="reg-ap"
                                            type="text"
                                            required
                                            placeholder="Apellido paterno"
                                            value={apellidoPaterno}
                                            onChange={(e) => setApellidoPaterno(e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label} htmlFor="reg-am">
                                            Apellido Materno
                                        </label>
                                        <input
                                            id="reg-am"
                                            type="text"
                                            placeholder="Apellido materno"
                                            value={apellidoMaterno}
                                            onChange={(e) => setApellidoMaterno(e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                {/* Nombre de usuario: autogenerado, pero editable/acortable */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-username">
                                        Nombre de usuario
                                    </label>
                                    <input
                                        id="reg-username"
                                        type="text"
                                        value={usernameEditado ? username : usernameAuto}
                                        onChange={(e) => { setUsername(e.target.value); setUsernameEditado(true); }}
                                        className={styles.input}
                                        maxLength={24}
                                        autoComplete="off"
                                    />
                                    <p className={styles.usernamePreview}>
                                        Iniciarás sesión como: <strong>@{usernameFinal || 'tu-nombre'}</strong>
                                        {usernameEditado && (
                                            <button
                                                type="button"
                                                className={styles.btnLink}
                                                onClick={() => { setUsernameEditado(false); setUsername(usernameAuto); }}
                                            >
                                                usar el automático
                                            </button>
                                        )}
                                    </p>
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button type="submit" className={styles.button}>
                                        Continuar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => volver(1)}
                                        className={styles.buttonSecondary}
                                    >
                                        ← Volver
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ── PASO 3: Credenciales (dinámico por rol) ── */}
                        {paso === 3 && (
                            <form onSubmit={handleCrearCuenta} className={styles.form}>
                                <h2 className={styles.formTitle}>Crea tu acceso</h2>

                                <p className={styles.usernamePreview}>
                                    Iniciarás sesión como: <strong>@{usernameFinal || 'tu-nombre'}</strong>
                                </p>

                                {/* Correo: SOLO Profesor (login + recuperación) */}
                                {!esAlumno && (
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label} htmlFor="reg-email">
                                            Correo electrónico
                                        </label>
                                        <input
                                            id="reg-email"
                                            type="email"
                                            required
                                            placeholder="tucorreo@ejemplo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={styles.input}
                                            disabled={loading}
                                        />
                                        <p className={styles.helperText}>
                                            Con este correo inicias sesión y puedes recuperar tu contraseña.
                                        </p>
                                    </div>
                                )}

                                {/* Clave de acceso */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-password">
                                        Clave de acceso
                                    </label>
                                    <div className={styles.passwordWrapper}>
                                        <input
                                            id="reg-password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            pattern={PATRON_CLAVE}
                                            maxLength={10}
                                            title="De 6 a 10 caracteres: solo letras, números y guiones, sin espacios."
                                            placeholder="6 a 10 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`${styles.input} ${styles.inputWithEye}`}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className={styles.eyeButton}
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {iconoOjo(showPassword)}
                                        </button>
                                    </div>
                                    <p className={styles.helperText}>
                                        De 6 a 10 caracteres. Solo letras, números y guiones. Sin espacios.
                                    </p>
                                </div>

                                {/* Confirmar clave */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-confirm-password">
                                        Confirmar clave
                                    </label>
                                    <div className={styles.passwordWrapper}>
                                        <input
                                            id="reg-confirm-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            pattern={PATRON_CLAVE}
                                            maxLength={10}
                                            placeholder="Confirma tu clave"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`${styles.input} ${styles.inputWithEye}`}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className={styles.eyeButton}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {iconoOjo(showConfirmPassword)}
                                        </button>
                                    </div>
                                </div>

                                {esAlumno && (
                                    <p className={styles.passwordWarning}>
                                        Guarda tu clave en un lugar seguro. No podrás recuperarla si la olvidas.
                                    </p>
                                )}

                                <div className={styles.buttonGroup}>
                                    <button type="submit" disabled={loading} className={styles.button}>
                                        {loading ? 'Creando cuenta...' : '¡Comenzar a Programar! →'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => volver(2)}
                                        disabled={loading}
                                        className={styles.buttonSecondary}
                                    >
                                        ← Volver
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                <div className={styles.formFooter}>
                    <p className={styles.footerLink}>
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className={styles.link}>Inicia sesión aquí</Link>
                    </p>

                    <p className={styles.footerLink}>
                        <Link to="/" className={styles.link}>
                            Volver al Inicio
                        </Link>
                    </p>
                    <p className={styles.footerLegal}>
                        Al registrarte, aceptas nuestros{' '}
                        <Link to="/terminos-y-condiciones" className={styles.link}>Términos y Condiciones</Link>
                        {' '}y el{' '}
                        <Link to="/aviso-de-privacidad" className={styles.link}>Aviso de Privacidad</Link>.
                    </p>

                    <p className={styles.footerSecure}> Conexión segura y encriptada</p>
                </div>
            </div>
        </div>
    );
};

export default Register;

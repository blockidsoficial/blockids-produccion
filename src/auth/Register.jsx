import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import styles from './Register.css';
import xolotlIdea from '../assets/xolotl/xolotl-idea.svg';
import logoXolotl from '../assets/logos/logo-xolotl-letras.svg';

const Register = () => {
    const [paso, setPaso] = useState(1);

    // Paso 1 — Escuela
    const [claveEscuela, setClaveEscuela] = useState('');
    const [escuelaValidada, setEscuelaValidada] = useState(null); // { id, nombre }

    // Paso 2 — Datos personales
    const [nombre, setNombre] = useState('');
    const [apellidoPaterno, setApellidoPaterno] = useState('');
    const [apellidoMaterno, setApellidoMaterno] = useState('');
    const [rol, setRol] = useState('alumno');

    // Paso 3 — Credenciales
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const history = useHistory();

    // ── PASO 1: Validar clave de escuela ──
    const handleValidarEscuela = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!claveEscuela.trim()) throw new Error('Ingresa la clave de escuela');

            // Las claves futuras usarán prefijo EDU-
            const { data: escuelaData, error: escuelaError } = await supabase
                .from('escuelas')
                .select('id, nombre, activa')
                .eq('clave_acceso', claveEscuela.trim())
                .single();

            if (escuelaError || !escuelaData) {
                throw new Error('Esa clave de escuela no existe. ¡Verifícala con tu profe!');
            }

            if (!escuelaData.activa) {
                throw new Error('La escuela está inactiva. Contacta con tu administrador.');
            }

            setEscuelaValidada({ id: escuelaData.id, nombre: escuelaData.nombre });
            setPaso(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── PASO 2: Validar datos personales ──
    const handleDatosPersonales = (e) => {
        e.preventDefault();
        setError('');
        if (!nombre.trim()) return setError('Ingresa tu nombre');
        if (!apellidoPaterno.trim()) return setError('Ingresa tu apellido paterno');
        setPaso(3);
    };

    // ── PASO 3: Crear cuenta ──
    const handleCrearCuenta = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!username.trim()) throw new Error('Ingresa tu nombre de usuario');
            if (password.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres');
            if (password !== confirmPassword) return setError('Las contraseñas no coinciden');

            const cleanUsername = username.trim().replace(/\s+/g, '-').toLowerCase();
            const emailFantasia = `${cleanUsername}@blockids.com`;

            const { error: authError } = await supabase.auth.signUp({
                email: emailFantasia,
                password: password,
                options: {
                    data: {
                        username:         cleanUsername,
                        nombre:           nombre.trim(),
                        apellido_paterno: apellidoPaterno.trim(),
                        apellido_materno: apellidoMaterno.trim(),
                        rol:              rol,
                        escuela_id:       escuelaValidada.id
                    }
                }
            });

            if (authError) throw authError;

            setSuccess(true);
            setTimeout(() => history.push('/?vista=proyectos'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const ProgressBar = () => (
        <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
                {[1, 2, 3].map((n) => (
                    <React.Fragment key={n}>
                        <div className={`${styles.stepDot} ${paso >= n ? styles.stepActive : ''}`}>
                            {n}
                        </div>
                        {n < 3 && (
                            <div className={`${styles.stepLine} ${paso > n ? styles.lineActive : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
            <p className={styles.stepLabel}>Paso {paso} de 3</p>
        </div>
    );

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
                            {rol === 'profesor' ? '👨‍🏫' : '👨‍🎓'} Bienvenido/a a Blockids.{'\n'}
                            Redirigiendo...
                        </p>
                    </div>
                ) : (
                    <div className={styles.formWrapper}>
                        <ProgressBar />

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        {/* ── PASO 1: Clave de escuela ── */}
                        {paso === 1 && (
                            <form onSubmit={handleValidarEscuela} className={styles.form}>
                                <h2 className={styles.formTitle}>Valida tu escuela</h2>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-clave">
                                        Clave de escuela
                                    </label>
                                    <input
                                        id="reg-clave"
                                        type="text"
                                        required
                                        placeholder="EDU-XXXX"
                                        value={claveEscuela}
                                        onChange={(e) => setClaveEscuela(e.target.value)}
                                        className={styles.input}
                                        disabled={loading}
                                    />
                                    <p className={styles.helperText}>
                                        ¡Pídele esta clave a tu profesor/a!
                                    </p>
                                </div>
                                <button type="submit" disabled={loading} className={styles.button}>
                                    {loading ? 'Validando...' : 'Continuar →'}
                                </button>
                            </form>
                        )}

                        {/* ── PASO 2: Datos personales ── */}
                        {paso === 2 && (
                            <form onSubmit={handleDatosPersonales} className={styles.form}>
                                <h2 className={styles.formTitle}>Datos personales</h2>
                                {escuelaValidada && (
                                    <p className={styles.schoolBadge}>
                                        🏫 <strong>{escuelaValidada.nombre}</strong>
                                    </p>
                                )}
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
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>¿Qué eres?</label>
                                    <div className={styles.radioGroup}>
                                        <label className={`${styles.radioLabel} ${rol === 'alumno' ? styles.radioChecked : ''}`}>
                                            <input
                                                type="radio"
                                                name="rol"
                                                value="alumno"
                                                checked={rol === 'alumno'}
                                                onChange={() => setRol('alumno')}
                                            />
                                            Alumno
                                        </label>
                                        <label className={`${styles.radioLabel} ${rol === 'profesor' ? styles.radioChecked : ''}`}>
                                            <input
                                                type="radio"
                                                name="rol"
                                                value="profesor"
                                                checked={rol === 'profesor'}
                                                onChange={() => setRol('profesor')}
                                            />
                                             Profesor
                                        </label>
                                    </div>
                                </div>
                                <div className={styles.buttonGroup}>
                                    <button type="submit" className={styles.button}>
                                        Continuar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setPaso(1); setError(''); }}
                                        className={styles.buttonSecondary}
                                    >
                                        ← Volver
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ── PASO 3: Credenciales ── */}
                        {paso === 3 && (
                            <form onSubmit={handleCrearCuenta} className={styles.form}>
                                <h2 className={styles.formTitle}>Crea tus credenciales</h2>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-username">
                                        Nombre de usuario
                                    </label>
                                    <input
                                        id="reg-username"
                                        type="text"
                                        required
                                        placeholder="maria_lopez"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={styles.input}
                                        disabled={loading}
                                    />
                                    <p className={styles.helperText}>
                                        Tu usuario para iniciar sesión en Blockids
                                    </p>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-password">
                                        Contraseña
                                    </label>
                                    <div className={styles.passwordWrapper}>
                                        <input
                                            id="reg-password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="Mínimo 6 caracteres"
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
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reg-confirm-password">
                                        Confirmar contraseña
                                    </label>
                                    <div className={styles.passwordWrapper}>
                                        <input
                                            id="reg-confirm-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            placeholder="Repite tu contraseña"
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
                                            {showConfirmPassword ? (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className={styles.passwordWarning}>
                                    Guarda tu contraseña en un lugar seguro. 
                                    Por privacidad, no usamos correos reales, 
                                    por lo que no podras recuperarla automáticamente.
                                </p>
                                <div className={styles.buttonGroup}>
                                    <button type="submit" disabled={loading} className={styles.button}>
                                        {loading ? 'Creando cuenta...' : '¡Comenzar a Programar! →'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setPaso(2); setError(''); }}
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

                    <o className={styles.footerLink}>
                        <Link to="/" className={styles.link}>
                            Volver al Inicio
                        </Link>
                    </o>
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

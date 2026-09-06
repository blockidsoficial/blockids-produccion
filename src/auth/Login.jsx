import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import styles from './Login.css';
import xolotlSaludando from '../assets/xolotl/xolotl-saludando.svg';
import logoXolotl from '../assets/logos/logo-horizontal-colores.svg';

const Login = ({ mensajeSistema }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const history = useHistory();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const entrada = username.trim();
            // Profesores/Admin entran con su correo real; alumnos con su usuario,
            // que se convierte en el correo fantasía usuario@blockids.com.
            const correo = entrada.includes('@')
                ? entrada.toLowerCase()
                : `${entrada.replace(/\s+/g, '-').toLowerCase()}@blockids.com`;

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: correo,
                password: password
            });

            if (authError) throw authError;

            const { data: { user } } = await supabase.auth.getUser();
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol, activo')
                .eq('id', user.id)
                .single();

            // Bloqueo de cuenta desactivada en el punto de entrada
            if (perfil?.activo === false) {
                await supabase.auth.signOut();
                setError('Tu cuenta ha sido desactivada. Contacta al administrador de tu escuela.');
                return;
            }

            const rol = perfil?.rol;
            if (rol === 'superadmin' || rol === 'admin_escuela') {
                history.push('/admin');
            } else if (rol === 'profesor') {
                history.push('/profesor');
            } else if (rol === 'alumno') {
                history.push('/alumno');
            } else {
                history.push('/');
            }
        } catch (err) {
            if (err.message.includes('Invalid login credentials')) {
                setError('Usuario o contraseña incorrectos. ¡Vuelve a intentarlo!');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.splitScreen}>
            <div className={styles.leftColumn}>
                <img src={xolotlSaludando} alt="Xolotl saludando" className={styles.xolotlImg} />
                <h1 className={styles.leftTitle}>¡Bienvenido de regreso!</h1>
                <p className={styles.leftSubtitle}>Inicia sesión para continuar aprendiendo y enseñando.</p>
            </div>

            <div className={styles.rightColumn}>
                <img src={logoXolotl} alt="Blockids" className={styles.logoImg} />
                <h2 className={styles.formTitle}>Iniciar sesión</h2>

                {(mensajeSistema || error) && (
                    <div className={styles.errorMessage}>{error || mensajeSistema}</div>
                )}

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="login-username">
                            Usuario o correo
                        </label>
                        <input
                            id="login-username"
                            type="text"
                            required
                            placeholder="Tu usuario (alumno) o tu correo (docente)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="login-password">
                            Contraseña
                        </label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="Tu contraseña secreta"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${styles.input} ${styles.inputWithEye}`}
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
                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? 'Entrando...' : 'Iniciar sesión'}
                    </button>
                </form>

                <div className={styles.formFooter}>
                    <p className={styles.footerLink}>
                        ¿No tienes cuenta?{' '}
                        <Link to="/registro" className={styles.link}>Regístrate aquí</Link>
                    </p>
                    <p className={styles.footerLegal}>
                        <Link to="/terminos-y-condiciones" className={styles.linkMuted}>Términos y Condiciones</Link>
                        {' | '}
                        <Link to="/aviso-de-privacidad" className={styles.linkMuted}>Aviso de Privacidad</Link>
                    </p>
                    <p className={styles.footerSecure}> Conexión segura y encriptada</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

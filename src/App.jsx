import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Switch, Route, Redirect, useHistory } from 'react-router-dom';
import { supabase } from './config/supabaseClient';
import './styles/global.css';

// Tus Pantallas
import LandingPage from './pages/landing/LandingPage.jsx';
import Register from './auth/Register.jsx';
import Login from './auth/Login.jsx';
import DashboardProyectos from './pages/proyectos/Dashboard.jsx';
import DashboardAdmin from './pages/admin/Dashboard.jsx';
import DashboardProfesor from './pages/profesor/Dashboard.jsx';
import AulaDetalle from './pages/profesor/views/AulaDetalle.jsx';
import DashboardAlumno from './pages/alumno/Dashboard.jsx';
import EntornoWrapper from './pages/entorno/EntornoWrapper.jsx';
import AvisoPrivacidad from './pages/legal/AvisoPrivacidad.jsx';
import TerminosCondiciones from './pages/legal/TerminosCondiciones.jsx';
import Error404 from './pages/errores/Error404.jsx';

// El motor nativo de Scratch
import GUI from './containers/gui.jsx';
import AppStateHOC from './lib/app-state-hoc.jsx';
import HashParserHOC from './lib/hash-parser-hoc.jsx';
import { compose } from 'redux';

// Ruta destino según rol
const rutaPorRol = (rol) => {
    switch (rol) {
        case 'superadmin':
        case 'admin_escuela': return '/admin';
        case 'profesor':      return '/profesor';
        case 'alumno':        return '/alumno';
        default:              return '/';
    }
};

// Pantalla mientras se verifican permisos
const Verificando = (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontFamily:'sans-serif' }}>
        <h2>Verificando permisos...</h2>
    </div>
);

const CerrarSesion = () => {
    const history = useHistory();
    useEffect(() => {
        supabase.auth.signOut().then(() => {
            history.push('/');
        });
    }, [history]);
    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif'}}>
            <h2>Cerrando sesión...</h2>
        </div>
    );
};

const ScratchEnvironment = compose(
    AppStateHOC,
    HashParserHOC
)(GUI);

const App = () => {
    //  ESTADOS DEL GUARDIA DE SEGURIDAD
    const [session, setSession]           = useState(null);
    const [loading, setLoading]           = useState(true);
    const [perfil, setPerfil]             = useState(null);
    const [perfilCargando, setPerfilCargando] = useState(true);
    // Mensaje del sistema para mostrar en Login cuando la cuenta está desactivada
    const [mensajeSistema, setMensajeSistema] = useState('');
    // Ref para evitar mostrar "Verificando" en recargas de token (vuelta de pestaña)
    const perfilCargadoRef = useRef(false);

    const cargarPerfil = async (uid) => {
        // Solo mostrar pantalla de carga en el primer login, no en recargas de token
        if (!perfilCargadoRef.current) setPerfilCargando(true);

        if (!uid) {
            setPerfil(null);
            perfilCargadoRef.current = false;
            setPerfilCargando(false);
            return;
        }
        const { data, error } = await supabase
            .from('perfiles')
            .select('rol, activo')
            .eq('id', uid)
            .single();
        console.log('[BLOCKIDS] perfil cargado:', data, '| error:', error);

        // Cuenta desactivada: expulsar la sesión activa inmediatamente
        if (data?.activo === false) {
            await supabase.auth.signOut();
            setMensajeSistema('Tu cuenta ha sido desactivada. Contacta al administrador de tu escuela.');
            setPerfil(null);
            perfilCargadoRef.current = false;
            setPerfilCargando(false);
            return;
        }

        setMensajeSistema('');
        setPerfil(data || null);
        perfilCargadoRef.current = true;
        setPerfilCargando(false);
    };

    useEffect(() => {
        // 1. Al cargar la página, revisamos si el usuario ya tenía la sesión abierta
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            cargarPerfil(session?.user?.id);
            setLoading(false);
        });

        // 2. Nos quedamos "escuchando" por si el usuario inicia o cierra sesión.
        // TOKEN_REFRESHED e INITIAL_SESSION no requieren recargar el perfil:
        //   - INITIAL_SESSION ya lo maneja getSession() arriba.
        //   - TOKEN_REFRESHED solo renueva el JWT; el perfil no cambia.
        //   Recargar en esos eventos pone perfilCargando=true y muestra el
        //   loader cada vez que el usuario vuelve al tab.
        const EVENTOS_CON_PERFIL = new Set(['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED']);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (EVENTOS_CON_PERFIL.has(event)) {
                cargarPerfil(session?.user?.id);
            }
        });

        // Limpieza de seguridad
        return () => subscription.unsubscribe();
    }, []);

    // Mientras el guardia revisa la credencial, mostramos una pantalla de carga
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
                <h2>Cargando BLOCKIDS...</h2>
            </div>
            
        );
    }

    return (
        <BrowserRouter>
            <Switch>
                {/* ── RUTAS PÚBLICAS ── */}
                <Route exact path="/" render={({ location }) => {
                    const vista = new URLSearchParams(location.search).get('vista');
                    if (vista && session && perfilCargando) return Verificando;
                    if (vista && session && perfil) {
                        return <Redirect to={`${rutaPorRol(perfil?.rol)}?vista=${vista}`} />;
                    }
                    return <LandingPage session={session} rolPerfil={perfil?.rol} />;
                }} />

                <Route path="/registro">
                    {!session
                        ? <Register />
                        : perfilCargando
                            ? Verificando
                            : <Redirect to={rutaPorRol(perfil?.rol)} />
                    }
                </Route>

                <Route path="/login">
                    {!session
                        ? <Login mensajeSistema={mensajeSistema} />
                        : perfilCargando
                            ? Verificando
                            : <Redirect to={rutaPorRol(perfil?.rol)} />
                    }
                </Route>

                {/* ── ADMIN: superadmin y admin_escuela ── */}
                <Route path="/admin">
                    {!session
                        ? <Redirect to="/login" />
                        : perfilCargando
                            ? Verificando
                            : (perfil?.rol === 'superadmin' || perfil?.rol === 'admin_escuela')
                                ? <DashboardAdmin />
                                : <Redirect to={rutaPorRol(perfil?.rol)} />
                    }
                </Route>

                {/* ── PROFESOR ── */}
                <Route path="/profesor">
                    {!session
                        ? <Redirect to="/login" />
                        : perfilCargando
                            ? Verificando
                            : perfil?.rol === 'profesor'
                                ? <DashboardProfesor />
                                : <Redirect to={rutaPorRol(perfil?.rol)} />
                    }
                </Route>

                {/* ── AULA (profesor y alumno) ── */}
                <Route path="/aula/:aulaId">
                    {!session
                        ? <Redirect to="/login" />
                        : perfilCargando
                            ? Verificando
                            : (perfil?.rol === 'profesor' || perfil?.rol === 'alumno')
                                ? <AulaDetalle />
                                : <Redirect to={rutaPorRol(perfil?.rol)} />
                    }
                </Route>

                {/* ── ALUMNO ── */}
                <Route path="/alumno">
                    {!session
                        ? <Redirect to="/login" />
                        : perfilCargando
                            ? Verificando
                            : perfil?.rol === 'alumno'
                                ? <DashboardAlumno />
                                : <Redirect to={rutaPorRol(perfil?.rol)} />
                    }
                </Route>

                {/* ── /mis-proyectos → redirect inteligente al dashboard con pestaña proyectos ── */}
                <Route path="/mis-proyectos">
                    {!session
                        ? <Redirect to="/login" />
                        : perfilCargando
                            ? Verificando
                            : ['alumno', 'profesor', 'admin_escuela', 'superadmin'].includes(perfil?.rol)
                                ? <Redirect to={`${rutaPorRol(perfil?.rol)}?vista=proyectos`} />
                                : <Redirect to="/" />
                    }
                </Route>

                {/* ── EDITOR SCRATCH ── */}
                <Route path="/entorno">
                    {session ? (
                        <EntornoWrapper>
                            <ScratchEnvironment canEditTitle canSave canCreateNew />
                        </EntornoWrapper>
                    ) : (
                        <Redirect to="/login" />
                    )}
                </Route>

                {/* ── CERRAR SESIÓN ── */}
                <Route path="/salir">
                    <CerrarSesion />
                </Route>

                {/* ── PÁGINAS LEGALES (públicas) ── */}
                <Route path="/aviso-de-privacidad">
                    <AvisoPrivacidad />
                </Route>

                <Route path="/terminos-y-condiciones">
                    <TerminosCondiciones />
                </Route>

                {/* ── 404: cualquier ruta no reconocida (siempre al final) ── */}
                <Route path="*">
                    <Error404 />
                </Route>
            </Switch>
        </BrowserRouter>
    );
};

export default App;
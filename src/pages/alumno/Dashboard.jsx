import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../layouts/DashboardLayout';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { desbloquearLogro } from '../../services/gamificationService';

import VistaInicio     from './views/VistaInicio';
import VistaTareas     from './views/VistaTareas';
import VistaProyectos  from '../shared/VistaProyectos';
import VistaMisAulas   from './views/VistaMisAulas';
import VistaLogros         from './views/VistaLogros';
import VistaMuro           from './views/VistaMuro';
import VistaMinijuegos     from './views/VistaMinijuegos';
import VistaConfiguracion  from '../shared/VistaConfiguracion';

import xolotlExplicando from '../../assets/xolotl/xolotl-explicando.svg';

import iconInicio     from '../../assets/iconos-ui/ui-inicio.svg';
import iconTareas     from '../../assets/iconos-ui/ui-calendario.svg';
import iconProyectos  from '../../assets/iconos-ui/ui-video.svg';
import iconAulas      from '../../assets/iconos-ui/ui-curso.svg';
import iconLogros     from '../../assets/iconos-ui/ui-favorito.svg';
import iconMuro       from '../../assets/iconos-ui/ui-contacto.svg';
import iconMinijuegos from '../../assets/iconos-ui/ui-fav.svg';
import iconConfig     from '../../assets/iconos-ui/ui-configuracion.svg';

import styles from './Dashboard.css';

const VISTAS = {
    INICIO:         'Inicio',
    TAREAS:         'Mis Tareas',
    PROYECTOS:      'Mis Proyectos',
    AULAS:          'Mis Aulas',
    MURO:           'Muro',
    LOGROS:         'Logros',
    MINIJUEGOS:     'Minijuegos',
    CONFIGURACION:  'Configuración',
};

const TOPBAR_INFO = {
    [VISTAS.TAREAS]:    { subtitle: 'Revisa tus actividades pendientes y entregadas' },
    [VISTAS.PROYECTOS]: { subtitle: 'Todos tus proyectos en un solo lugar' },
    [VISTAS.AULAS]:     { subtitle: 'Tus clases activas' },
    [VISTAS.MURO]:      { subtitle: 'Comunícate con tu profesor y compañeros' },
    [VISTAS.LOGROS]:    { subtitle: 'Tu progreso y recompensas' },
    [VISTAS.MINIJUEGOS]: { subtitle: 'Retos y minijuegos para practicar jugando' },
};

// ─────────────────────────────────────────────────────────────────────────────

const DashboardAlumno = () => {
    useDocumentTitle('Panel del Alumno');

    const history  = useHistory();
    const location = useLocation();

    const [loading, setLoading]         = useState(true);
    const [username, setUsername]       = useState('');
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [userId, setUserId]           = useState(null);
    const [escuelaId, setEscuelaId] = useState(null);
    const [misAulas, setMisAulas]   = useState([]);
    const [aulaIds, setAulaIds]     = useState([]);

    const VISTAS_URL_MAP = {
        'inicio':        VISTAS.INICIO,
        'tareas':        VISTAS.TAREAS,
        'proyectos':     VISTAS.PROYECTOS,
        'aulas':         VISTAS.AULAS,
        'muro':          VISTAS.MURO,
        'logros':        VISTAS.LOGROS,
        'minijuegos':    VISTAS.MINIJUEGOS,
        'configuracion': VISTAS.CONFIGURACION,
    };
    const _vistaParamAlumno = new URLSearchParams(location.search).get('vista');
    const vistaInicial = (_vistaParamAlumno && VISTAS_URL_MAP[_vistaParamAlumno])
        ? VISTAS_URL_MAP[_vistaParamAlumno]
        : (sessionStorage.getItem('bk_alumno_vista') || VISTAS.INICIO);
    const [vistaActual, setVistaActual] = useState(vistaInicial);

    const [aulaInicioId, setAulaInicioId]        = useState(null);
    const [codigoIngresado, setCodigoIngresado] = useState('');
    const [uniendose, setUniendose]             = useState(false);
    const [error, setError]                     = useState(null);
    const [exito, setExito]                     = useState(null);
    const [cargandoAula, setCargandoAula]       = useState(false);

    useEffect(() => { sessionStorage.setItem('bk_alumno_vista', vistaActual); }, [vistaActual]);

    // ── Carga inicial ─────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { history.push('/login'); return; }

            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('username, escuela_id, nombre, apellido_paterno, apellido_materno')
                .eq('id', session.user.id)
                .single();

            if (perfilError || !perfil) { history.push('/login'); return; }

            const nombreArmado = [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno]
                .filter(Boolean)
                .join(' ');
            setNombreCompleto(nombreArmado || perfil.username);
            setUsername(perfil.username);
            setUserId(session.user.id);
            setEscuelaId(perfil.escuela_id);

            await cargarAulas(session.user.id);
            setLoading(false);
        };
        init();
    }, [history]);

    const cargarAulas = async (uid) => {
        setCargandoAula(true);
        const { data, error: fetchError } = await supabase
            .from('aula_alumnos')
            .select('aula_id, aulas(id, nombre, codigo_aula, profesor_id)')
            .eq('alumno_id', uid);

        if (!fetchError && data && data.length > 0) {
            const aulas = data
                .filter(d => d.aulas)
                .map(d => ({ ...d.aulas, id: d.aula_id }));
            setMisAulas(aulas);
            setAulaIds(aulas.map(a => a.id));
        } else {
            setMisAulas([]);
            setAulaIds([]);
        }
        setCargandoAula(false);
    };

    const handleNavigate = (vista, aulaId = null) => {
        if (aulaId) setAulaInicioId(aulaId);
        setVistaActual(vista);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        history.push('/');
    };

    const actualizarPerfilHeader = ({ nombre, apellido_paterno, apellido_materno, username: usernameActual }) => {
        const nombreArmado = [nombre, apellido_paterno, apellido_materno].filter(Boolean).join(' ');
        setNombreCompleto(nombreArmado || usernameActual);
        setUsername(usernameActual);
    };

    const handleUnirse = async (e) => {
        e.preventDefault();
        const codigoLimpio = codigoIngresado.replace(/\s+/g, '').toUpperCase();
        if (!codigoLimpio) return;

        setError(null);
        setExito(null);
        setUniendose(true);

        const { data: aula, error: aulaError } = await supabase
            .from('aulas')
            .select('id, nombre, escuela_id')
            .eq('codigo_aula', codigoLimpio)
            .maybeSingle();

        if (aulaError || !aula) {
            setError('Código inválido. Verifica que lo escribiste correctamente.');
            setUniendose(false);
            return;
        }

        if (aula.escuela_id !== escuelaId) {
            setError('Este código no pertenece a tu escuela. Pide el código correcto a tu maestro.');
            setUniendose(false);
            return;
        }

        const { data: yaInscrito } = await supabase
            .from('aula_alumnos')
            .select('id')
            .eq('aula_id', aula.id)
            .eq('alumno_id', userId)
            .maybeSingle();

        if (yaInscrito) {
            setError('Ya estás inscrito en esta clase. ¡Ve a verla en tu panel!');
            setUniendose(false);
            return;
        }

        const { error: insertError } = await supabase
            .from('aula_alumnos')
            .insert({ aula_id: aula.id, alumno_id: userId, joined_at: new Date().toISOString() });

        if (insertError) {
            setError('Ocurrió un error al unirte. Intenta de nuevo.');
            setUniendose(false);
            return;
        }

        // Logro "Nuevo en la Clase": misma lógica que el modal de Mis Aulas.
        // desbloquearLogro es idempotente (no re-otorga si ya lo tiene).
        desbloquearLogro(userId, 'Nuevo en la Clase', 30);

        setExito(`¡Bienvenido a "${aula.nombre}"!`);
        setCodigoIngresado('');
        setTimeout(() => cargarAulas(userId), 1000);
        setUniendose(false);
    };

    // ── Nav items ─────────────────────────────────────────────────────────────
    const navItems = [
        { label: VISTAS.INICIO,    icon: iconInicio,    to: '#', onClick: () => setVistaActual(VISTAS.INICIO) },
        { label: VISTAS.TAREAS,    icon: iconTareas,    to: '#', onClick: () => setVistaActual(VISTAS.TAREAS) },
        { label: VISTAS.PROYECTOS, icon: iconProyectos, to: '#', onClick: () => setVistaActual(VISTAS.PROYECTOS) },
        { label: VISTAS.AULAS,     icon: iconAulas,     to: '#', onClick: () => setVistaActual(VISTAS.AULAS) },
        { label: VISTAS.MURO,      icon: iconMuro,      to: '#', onClick: () => setVistaActual(VISTAS.MURO) },
        { label: VISTAS.LOGROS,        icon: iconLogros,     to: '#', onClick: () => setVistaActual(VISTAS.LOGROS) },
        { label: VISTAS.MINIJUEGOS,    icon: iconMinijuegos, to: '#', onClick: () => setVistaActual(VISTAS.MINIJUEGOS) },
        { label: VISTAS.CONFIGURACION, icon: iconConfig,     to: '#', onClick: () => setVistaActual(VISTAS.CONFIGURACION) },
    ];

    // ── Pantalla de carga ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Preparando tu espacio...</p>
            </div>
        );
    }

    // En Inicio el banner va sin subtítulo: la frase motivadora ahora vive en
    // el carrusel de colores que aparece debajo del banner (ver DashboardLayout).
    const topbarInfo = TOPBAR_INFO[vistaActual] || {};

    // ── Vista sin aula: estado de bienvenida con formulario ───────────────────
    const renderContenido = () => {
        if (cargandoAula) {
            return (
                <div className={styles.cargandoAula}>
                    <div className={styles.loadingSpinner} />
                    <p>Verificando tu clase...</p>
                </div>
            );
        }

        if (misAulas.length === 0 && (vistaActual === VISTAS.INICIO || vistaActual === VISTAS.AULAS)) {
            return (
                <div className={styles.joinWrapper}>
                    <div className={styles.joinCard}>
                        <img src={xolotlExplicando} alt="Xolotl explicando" width="120" className={styles.joinXolotl} />
                        <h2 className={styles.joinTitle}>¡Aún no estás en ninguna clase!</h2>
                        <p className={styles.joinDesc}>
                            Pídele a tu maestro el código de tu salón e ingrésalo aquí abajo.
                        </p>
                        {error && <p className={styles.errorMsg}>{error}</p>}
                        {exito && <p className={styles.exitoMsg}>{exito}</p>}
                        <form className={styles.joinForm} onSubmit={handleUnirse}>
                            <input
                                type="text"
                                className={styles.codigoInput}
                                placeholder="BLK-XXXX"
                                value={codigoIngresado}
                                onChange={e => setCodigoIngresado(e.target.value.toUpperCase())}
                                maxLength={8}
                                disabled={uniendose}
                                autoFocus
                                autoComplete="off"
                                spellCheck="false"
                            />
                            <button
                                type="submit"
                                className={styles.btnUnirse}
                                disabled={uniendose || !codigoIngresado.trim()}
                            >
                                {uniendose ? (
                                    <><span className={styles.btnSpinner} />Uniéndome...</>
                                ) : (
                                    'Unirme a mi Clase'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        switch (vistaActual) {
            case VISTAS.INICIO:
                return (
                    <VistaInicio
                        userId={userId}
                        misAulas={misAulas}
                        aulaIds={aulaIds}
                        onNavigate={handleNavigate}
                    />
                );
            case VISTAS.TAREAS:
                return <VistaTareas userId={userId} aulaIds={aulaIds} />;
            case VISTAS.PROYECTOS:
                return <VistaProyectos userId={userId} />;
            case VISTAS.AULAS:
                return <VistaMisAulas userId={userId} misAulas={misAulas} aulaIds={aulaIds} onAulasUpdated={() => cargarAulas(userId)} onNavigate={setVistaActual} />;
            case VISTAS.MURO:
                return <VistaMuro userId={userId} misAulas={misAulas} aulaIds={aulaIds} aulaInicial={aulaInicioId} />;
            case VISTAS.LOGROS:
                return <VistaLogros userId={userId} />;
            case VISTAS.MINIJUEGOS:
                return <VistaMinijuegos onVolver={() => setVistaActual(VISTAS.INICIO)} />;
            case VISTAS.CONFIGURACION:
                return (
                    <VistaConfiguracion
                        userId={userId}
                        onPerfilActualizado={actualizarPerfilHeader}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <DashboardLayout
            title={`¡Hola, ${nombreCompleto}!`}
            subtitle={topbarInfo.subtitle}
            userName={`@${username}`}
            role="Alumno"
            onLogout={handleLogout}
            navItems={navItems}
            activeNav={vistaActual}
        >
            {renderContenido()}
        </DashboardLayout>
    );
};

export default DashboardAlumno;

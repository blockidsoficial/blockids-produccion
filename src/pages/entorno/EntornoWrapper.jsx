import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import styles from './EntornoWrapper.css';
import { otorgarXP, desbloquearLogro } from '../../services/gamificationService';
import LogroCelebracion from '../../components/logro-celebracion/LogroCelebracion';

import xolotlSorprendido from '../../assets/xolotl/xolotl-sorprendido.svg';
import logoHorizontal   from '../../assets/logos/logo-horizontal-colores.svg';
import iconModoRevision from '../../assets/iconos/icon-modo-revision.svg';

const BREAKPOINT = 900;

const EntornoWrapper = ({ children }) => {
    const history  = useHistory();
    const location = useLocation();

    const [esMobile,        setEsMobile]        = useState(() => window.innerWidth < BREAKPOINT);
    const [tareaId,         setTareaId]         = useState(null);
    const [entregaId,       setEntregaId]       = useState(null);
    const [cargandoEntrega, setCargandoEntrega] = useState(false);
    const [entregando,      setEntregando]      = useState(false);
    const [toast,           setToast]           = useState(null); // { mensaje, exito }

    // ── Responsive guard ──────────────────────────────────────────────────────
    useEffect(() => {
        const check = () => setEsMobile(window.innerWidth < BREAKPOINT);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // ── Leer tareaId y entregaId de la query string ──────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setTareaId(params.get('tareaId') || null);
        setEntregaId(params.get('entregaId') || null);
    }, [location.search]);

    // ── Logro "Primer Vuelo": el alumno abre el entorno por primera vez ──────
    // (no cuenta el modo revisión del profesor). desbloquearLogro es idempotente:
    // solo otorga (y suma XP) la primera vez.
    useEffect(() => {
        const esRevision = Boolean(new URLSearchParams(location.search).get('entregaId'));
        let vivo = true;

        if (!esRevision) {
            (async () => {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!vivo || error || !user) return;

                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', user.id)
                    .single();

                if (vivo && perfil && perfil.rol === 'alumno') {
                    desbloquearLogro(user.id, 'Primer Vuelo', 50);
                }
            })();
        }

        return () => { vivo = false; };
    }, []);

    // ── Cargar entrega previa cuando el alumno retoma una tarea ─────────────
    useEffect(() => {
        if (!tareaId) return;

        const cargarEntregaPrevia = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) return;

                const { data, error } = await supabase
                    .from('entregas_proyectos')
                    .select('codigo_espacio_trabajo, json_bloques')
                    .eq('tarea_id', tareaId)
                    .eq('estudiante_id', user.id)
                    .maybeSingle();

                // Sin entrega previa → Scratch arranca en blanco sin tocar el VM
                if (error || !data) return;

                const proyecto = data.codigo_espacio_trabajo || data.json_bloques;

                // Sin datos o es una URL de archivo (no JSON del VM) → no cargar
                if (!proyecto || typeof proyecto === 'string') return;

                const intentarCargar = () => {
                    const vm = window.blockidsVM;
                    if (vm) {
                        vm.loadProject(JSON.stringify(proyecto)).catch(() => {
                            // Si falla, Scratch ya tiene su proyecto en blanco: no hacer nada
                        });
                    } else {
                        setTimeout(intentarCargar, 300);
                    }
                };
                intentarCargar();
            } catch {
                // Error de red u otro: dejar que Scratch arranque en blanco
            }
        };

        cargarEntregaPrevia();
    }, [tareaId]);

    // ── Modo revisión: cargar proyecto del alumno en el VM ────────────────────
    useEffect(() => {
        if (!entregaId) return;

        const cargar = async () => {
            setCargandoEntrega(true);
            try {
                const { data, error } = await supabase
                    .from('entregas_proyectos')
                    .select('codigo_espacio_trabajo, json_bloques')
                    .eq('id', entregaId)
                    .single();

                if (error || !data) { setCargandoEntrega(false); return; }

                const proyecto = data.codigo_espacio_trabajo || data.json_bloques;

                // Sin datos reales o es una URL → no hay proyecto cargable
                if (!proyecto || typeof proyecto === 'string') {
                    setCargandoEntrega(false);
                    return;
                }

                const intentarCargar = () => {
                    const vm = window.blockidsVM;
                    if (vm) {
                        vm.loadProject(JSON.stringify(proyecto))
                            .then(() => setCargandoEntrega(false))
                            .catch(() => setCargandoEntrega(false));
                    } else {
                        setTimeout(intentarCargar, 300);
                    }
                };
                intentarCargar();
            } catch {
                setCargandoEntrega(false);
            }
        };

        cargar();
    }, [entregaId]);

    // ── Ocultar toast automáticamente ─────────────────────────────────────────
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 6000);
        return () => clearTimeout(t);
    }, [toast]);

    // ── Lógica de entrega ─────────────────────────────────────────────────────
    const handleEntregarTarea = async () => {
        if (!tareaId || entregando) return;
        setEntregando(true);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Sin sesión activa');

            const alumnoId = user.id;

            // Capturar el JSON del proyecto Scratch desde el VM global
            const vm = window.blockidsVM;
            const proyectoJSON = vm ? JSON.parse(vm.toJSON()) : null;

            // Verificar si ya existe una entrega para esta tarea/alumno
            const { data: existente, error: buscarError } = await supabase
                .from('entregas_proyectos')
                .select('id')
                .eq('tarea_id', tareaId)
                .eq('estudiante_id', alumnoId)
                .maybeSingle();

            if (buscarError) throw buscarError;

            if (existente) {
                // Re-entrega: actualizar el JSON y marcar como entregado
                const { error: updateError } = await supabase
                    .from('entregas_proyectos')
                    .update({
                        codigo_espacio_trabajo: proyectoJSON,
                        estado:     'entregado',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existente.id);

                if (updateError) throw updateError;
                await otorgarXP(alumnoId, 100);
                setToast({ mensaje: '¡Proyecto actualizado y re-entregado!', exito: true });
                return;
            }

            // Primera entrega: INSERT
            const { error: insertError } = await supabase
                .from('entregas_proyectos')
                .insert({
                    tarea_id:               tareaId,
                    estudiante_id:          alumnoId,
                    estado:                 'entregado',
                    codigo_espacio_trabajo: proyectoJSON,
                });

            if (insertError) throw insertError;
            await desbloquearLogro(alumnoId, 'Primeros Pasos', 100);
            setToast({ mensaje: '¡Tarea Entregada Exitosamente!', exito: true });

        } catch (err) {
            console.error('[BLOCKIDS] Error al entregar tarea:', err);
            setToast({ mensaje: 'Ocurrió un error. Intenta de nuevo.', exito: false });
        } finally {
            setEntregando(false);
        }
    };

    // ── Pantalla de bloqueo móvil ─────────────────────────────────────────────
    if (esMobile) {
        return (
            <div className={styles.blocker}>
                <img src={logoHorizontal} alt="Blockids" className={styles.blockerLogo} />
                <img src={xolotlSorprendido} alt="Xolotl sorprendido" className={styles.blockerXolotl} />
                <h2 className={styles.blockerTitulo}>¡Ups! Necesitamos más espacio.</h2>
                <p className={styles.blockerDesc}>
                    Para poder construir proyectos increíbles, Blockids necesita una pantalla más grande.
                    Por favor, abre esta clase en una computadora de escritorio o laptop.
                </p>
                <button className={styles.blockerBtn} onClick={() => history.push('/alumno')}>
                    ← Volver a Mis Aulas
                </button>
            </div>
        );
    }

    // ── Vista desktop: Scratch + overlay de entrega ───────────────────────────
    return (
        <div className={styles.entornoLayout}>

            {/* Banner revisión (profesor) — en flujo, empuja Scratch hacia abajo */}
            {entregaId && (
                <div className={styles.bannerRevision}>
                    {cargandoEntrega
                        ? <span className={styles.bannerLabel}> Cargando proyecto del alumno...</span>
                        : (
                            <span className={styles.bannerLabel}>
                                <img src={iconModoRevision} alt="" className={styles.bannerIcon} />
                                Modo revisión — proyecto del alumno (solo lectura)
                            </span>
                        )
                    }
                    <button className={styles.btnVolverRevision} onClick={() => window.close()}>
                        Cerrar pestaña
                    </button>
                </div>
            )}

            {/* Banner entrega (alumno) — en flujo, empuja Scratch hacia abajo */}
            {tareaId && !entregaId && (
                <div className={styles.bannerEntrega}>
                    <span className={styles.bannerLabel}>Entregando tarea</span>
                    <button
                        className={styles.btnEntregar}
                        onClick={handleEntregarTarea}
                        disabled={entregando}
                    >
                        {entregando ? 'Enviando...' : 'Entregar Proyecto al Profesor'}
                    </button>
                </div>
            )}

            {/* Scratch ocupa todo el espacio restante */}
            <div className={styles.scratchContainer}>
                {children}
            </div>

            {/* Celebración de logros (p. ej. "Primeros Pasos" al entregar) */}
            <LogroCelebracion />


            {toast && (
                <div className={`${styles.toast} ${toast.exito ? styles.toastExito : styles.toastError}`}>
                    <span className={styles.toastMensaje}>{toast.mensaje}</span>
                    {toast.exito && (
                        <button
                            className={styles.toastBtn}
                            onClick={() => history.push('/alumno')}
                        >
                            Ir al Dashboard
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EntornoWrapper;

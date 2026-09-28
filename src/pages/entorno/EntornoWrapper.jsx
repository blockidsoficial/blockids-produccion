import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import styles from './EntornoWrapper.css';
import { celebrarLogrosNuevos, desbloquearLogroEditor } from '../../services/gamificationService';
import { EVENTO_EDITOR } from '../../lib/logro-eventos';
import LogroCelebracion from '../../components/logro-celebracion/LogroCelebracion';
import dataURItoBlob from '../../lib/data-uri-to-blob';

import xolotlSorprendido from '../../assets/xolotl/xolotl-sorprendido.svg';
import logoHorizontal   from '../../assets/logos/logo-horizontal-colores.svg';
import iconModoRevision from '../../assets/iconos/icon-modo-revision.svg';

const BREAKPOINT = 900;

// Genera y guarda la miniatura de una entrega la primera vez que alguien la
// revisa (profesor, admin o el propio alumno) — mismo mecanismo de captura
// que usa el guardado normal de "Mis Proyectos" (ver project-saver-hoc.jsx).
// Best-effort: si falla, la próxima revisión lo vuelve a intentar (nunca
// bloquea ni afecta lo que ve quien está revisando).
const generarMiniaturaEntrega = (entregaId, vm) => {
    try {
        vm.postIOData('video', { forceTransparentPreview: true });
        vm.renderer.requestSnapshot(async dataURI => {
            vm.postIOData('video', { forceTransparentPreview: false });
            try {
                const blob = dataURItoBlob(dataURI);
                const path = `${entregaId}.png`;
                const { error: uploadError } = await supabase.storage
                    .from('entrega-miniaturas')
                    .upload(path, blob, { upsert: true, contentType: blob.type || 'image/png' });
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('entrega-miniaturas').getPublicUrl(path);
                const { error: rpcError } = await supabase.rpc('guardar_miniatura_entrega', {
                    p_entrega_id: entregaId,
                    p_thumbnail_url: `${publicUrl}?v=${Date.now()}`,
                });
                if (rpcError) throw rpcError;
            } catch (err) {
                console.error('[BLOCKIDS] No se pudo guardar la miniatura de la entrega:', err);
            }
        });
        vm.renderer.draw();
    } catch (err) {
        console.error('[BLOCKIDS] No se pudo generar la miniatura de la entrega:', err);
    }
};

// La entrega se guarda como .sb3 (zip con project.json + imágenes y sonidos),
// no solo con vm.toJSON(): el JSON solo trae el md5 de cada asset y el VM
// genera assets nuevos que no existen en ningún bucket (p. ej. los fondos PNG
// de la biblioteca como "Granja" se reescalan a bitmapResolution 2 con otro
// md5, y los dibujos/imágenes subidas por el alumno). Al volver a cargar solo
// el JSON, esos assets daban 400 y se veían como "?".
const BUCKET_ENTREGAS = 'proyectos-blockids';

const subirProyectoEntrega = async (vm, alumnoId) => {
    const contenido = await vm.saveProjectSb3();
    const path = `entregas/${alumnoId}_${Date.now()}_editor.sb3`;
    const { error } = await supabase.storage
        .from(BUCKET_ENTREGAS)
        .upload(path, contenido, { contentType: 'application/zip' });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_ENTREGAS).getPublicUrl(path);
    return publicUrl;
};

// codigo_espacio_trabajo puede ser un JSON del VM (entregas antiguas) o una
// URL pública a un .sb3/.zip (entregas nuevas del editor o archivo subido).
const contenidoEntrega = async (proyecto) => {
    if (typeof proyecto !== 'string') return JSON.stringify(proyecto);
    const resp = await fetch(proyecto);
    if (!resp.ok) throw new Error('No se pudo descargar el archivo entregado.');
    return resp.arrayBuffer();
};

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

    // ── Logros del editor ────────────────────────────────────────────────────
    // "Primer Vuelo" (abrir el entorno) y los logros de acciones dentro del
    // editor (agregar objeto, grabar sonido, etc.). Los componentes del editor
    // solo anuncian el evento (lib/logro-eventos); aquí se le reporta al
    // servidor, que decide si corresponde (solo alumnos, una vez por logro).
    // El modo revisión del profesor (?entregaId=) no cuenta.
    useEffect(() => {
        const esRevision = Boolean(new URLSearchParams(location.search).get('entregaId'));
        if (esRevision) return undefined;

        desbloquearLogroEditor('entorno_primera_vez');

        const alEventoEditor = (e) => desbloquearLogroEditor(e.detail && e.detail.tipo);
        window.addEventListener(EVENTO_EDITOR, alEventoEditor);
        return () => window.removeEventListener(EVENTO_EDITOR, alEventoEditor);
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
                if (!proyecto) return;

                const contenidoParaCargar = await contenidoEntrega(proyecto);

                const intentarCargar = () => {
                    const vm = window.blockidsVM;
                    if (vm) {
                        vm.loadProject(contenidoParaCargar).catch(() => {
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

    // ── Modo revisión: cargar el trabajo del alumno en el VM (interactivo) ────
    // Cubre las dos formas de entregar: JSON guardado directo desde el Entorno
    // de Programación, o un archivo .sb3/.zip subido a Storage (URL) — en ese
    // caso se descarga y se carga igual que "Cargar desde tu computadora".
    // Si a la entrega todavía le falta miniatura, se genera aquí mismo la
    // primera vez que alguien la revisa (ver guardar-miniatura-entrega.js).
    useEffect(() => {
        if (!entregaId) return;
        let vivo = true;

        const cargar = async () => {
            setCargandoEntrega(true);
            try {
                const { data, error } = await supabase
                    .from('entregas_proyectos')
                    .select('codigo_espacio_trabajo, json_bloques, thumbnail_url')
                    .eq('id', entregaId)
                    .single();

                if (error || !data) { setCargandoEntrega(false); return; }

                const proyecto = data.codigo_espacio_trabajo || data.json_bloques;
                if (!proyecto) { setCargandoEntrega(false); return; }

                const contenidoParaCargar = await contenidoEntrega(proyecto);

                const intentarCargar = () => {
                    const vm = window.blockidsVM;
                    if (!vm) { setTimeout(intentarCargar, 300); return; }
                    vm.loadProject(contenidoParaCargar)
                        .then(() => {
                            if (!vivo) return;
                            setCargandoEntrega(false);
                            if (!data.thumbnail_url) {
                                generarMiniaturaEntrega(entregaId, vm);
                            }
                        })
                        .catch(() => { if (vivo) setCargandoEntrega(false); });
                };
                intentarCargar();
            } catch (err) {
                console.error('[BLOCKIDS] Error cargando la entrega en modo revisión:', err);
                if (vivo) setCargandoEntrega(false);
            }
        };

        cargar();
        return () => { vivo = false; };
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

            // Subir el proyecto completo (.sb3 con sus assets) desde el VM global
            const vm = window.blockidsVM;
            if (!vm) throw new Error('El editor todavía no está listo');
            const proyectoUrl = await subirProyectoEntrega(vm, alumnoId);

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
                        codigo_espacio_trabajo: proyectoUrl,
                        estado:     'entregado',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existente.id);

                if (updateError) throw updateError;
                // El XP de la re-entrega lo suma el servidor (trigger en entregas_proyectos).
                celebrarLogrosNuevos();
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
                    codigo_espacio_trabajo: proyectoUrl,
                });

            if (insertError) throw insertError;
            // El logro "Primeros Pasos" y su XP los otorga el servidor (trigger).
            await celebrarLogrosNuevos();
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

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaSalonFama.css';
import iconTrofeo from '../../../assets/iconos/icono-medalla-oro.svg';
import xolotlIdea from '../../../assets/xolotl/xolotl-idea.svg';

const ESTADO_LABEL = {
    nominado:  { texto: 'Nominado, esperando revisión', clase: 'badgeNominado' },
    aprobado:  { texto: '¡En el Salón de la Fama!',      clase: 'badgeAprobado' },
    rechazado: { texto: 'No aprobado esta vez',          clase: 'badgeRechazado' },
};

// Vista del profesor: elige, de entre las tareas YA CALIFICADAS de sus
// propias aulas, cuáles nominar al Salón de la Fama. La aprobación final la
// da el admin de la escuela (máx. 3 por escuela y edición).
const VistaSalonFama = ({ userId }) => {
    const [cargando, setCargando]   = useState(true);
    const [aulas, setAulas]         = useState([]);
    const [aulaFiltro, setAulaFiltro] = useState('todas');
    const [busqueda, setBusqueda]   = useState('');
    const [entregas, setEntregas]   = useState([]);
    const [nominaciones, setNominaciones] = useState({}); // entrega_id -> fila de salon_fama
    const [edicionId, setEdicionId] = useState(null);
    const [nominando, setNominando] = useState(null); // id de la entrega en vuelo
    const [alerta, setAlerta]       = useState(null);

    const cargar = useCallback(async () => {
        if (!userId) return;
        setCargando(true);

        const { data: edicion } = await supabase
            .from('salon_fama_ediciones')
            .select('id')
            .eq('activa', true)
            .maybeSingle();
        setEdicionId(edicion?.id || null);

        const { data: aulasData } = await supabase
            .from('aulas')
            .select('id, nombre, escuela_id')
            .eq('profesor_id', userId);
        setAulas(aulasData || []);
        const aulaIds = (aulasData || []).map(a => a.id);

        if (aulaIds.length === 0) {
            setEntregas([]);
            setNominaciones({});
            setCargando(false);
            return;
        }

        // Solo entregas YA CALIFICADAS: son las que el profesor ya revisó, y
        // el único criterio razonable para poder nominarlas.
        const { data: entregasData, error } = await supabase
            .from('entregas_proyectos')
            .select(`
                id, calificacion, thumbnail_url, updated_at,
                tarea:tareas!inner(id, titulo, aula_id, aula:aulas!inner(nombre)),
                alumno:perfiles!entregas_proyectos_estudiante_id_fkey(username)
            `)
            .eq('estado', 'calificado')
            .in('tarea.aula_id', aulaIds)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[BLOCKIDS] Error cargando entregas calificadas:', error);
            setEntregas([]);
            setCargando(false);
            return;
        }

        setEntregas(entregasData || []);

        if (edicion?.id && entregasData?.length) {
            const { data: noms } = await supabase
                .from('salon_fama')
                .select('id, entrega_id, estado, titulo_publico')
                .eq('edicion_id', edicion.id)
                .in('entrega_id', entregasData.map(e => e.id));
            const mapa = {};
            (noms || []).forEach(n => { mapa[n.entrega_id] = n; });
            setNominaciones(mapa);
        } else {
            setNominaciones({});
        }

        setCargando(false);
    }, [userId]);

    useEffect(() => { cargar(); }, [cargar]);

    const nominar = async (entrega) => {
        if (!edicionId) {
            setAlerta({ tipo: 'error', texto: 'No hay una edición activa del Salón de la Fama en este momento.' });
            return;
        }
        setNominando(entrega.id);
        setAlerta(null);

        const escuelaId = aulas.find(a => a.id === entrega.tarea.aula_id)?.escuela_id;
        if (!escuelaId) {
            setNominando(null);
            setAlerta({ tipo: 'error', texto: 'No se pudo determinar la escuela de esta aula.' });
            return;
        }

        const { data: fila, error } = await supabase.from('salon_fama').insert({
            edicion_id: edicionId,
            entrega_id: entrega.id,
            escuela_id: escuelaId,
            nominado_por: userId,
        }).select('id').single();

        setNominando(null);

        if (error) {
            setAlerta({ tipo: 'error', texto: error.message || 'No se pudo nominar el proyecto.' });
            return;
        }

        setNominaciones(prev => ({ ...prev, [entrega.id]: { id: fila.id, entrega_id: entrega.id, estado: 'nominado', titulo_publico: null } }));
        setAlerta({ tipo: 'success', texto: `"${entrega.tarea.titulo}" de @${entrega.alumno?.username} fue nominado. Un admin de tu escuela lo revisará.` });
    };

    const editarNombre = async (nom, tituloActual) => {
        const nuevo = window.prompt('Nombre público de este proyecto en el Salón de la Fama:', nom.titulo_publico || tituloActual);
        if (nuevo === null) return; // canceló

        const { error } = await supabase.rpc('editar_titulo_publico_salon_fama', {
            p_id: nom.id,
            p_titulo: nuevo,
        });

        if (error) {
            setAlerta({ tipo: 'error', texto: error.message || 'No se pudo cambiar el nombre.' });
            return;
        }

        const guardado = nuevo.trim() || null;
        setNominaciones(prev => ({ ...prev, [nom.entrega_id]: { ...prev[nom.entrega_id], titulo_publico: guardado } }));
        setAlerta({ tipo: 'success', texto: 'Nombre actualizado.' });
    };

    const verProyecto = (entrega) => {
        window.open(`/entorno?entregaId=${entrega.id}`, '_blank', 'noopener');
    };

    const entregasFiltradas = entregas.filter(e => {
        if (aulaFiltro !== 'todas' && e.tarea?.aula_id !== aulaFiltro) return false;
        if (!busqueda.trim()) return true;
        const term = busqueda.trim().toLowerCase();
        return `${e.alumno?.username || ''} ${e.tarea?.titulo || ''}`.toLowerCase().includes(term);
    });

    if (cargando) {
        return <div className={styles.cargando}>Cargando entregas calificadas...</div>;
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img src={iconTrofeo} alt="" className={styles.headerIcon} />
                    <div>
                        <h2 className={styles.titulo}>Salón de la Fama</h2>
                        <p className={styles.subtitulo}>
                            Nomina el mejor trabajo entre las tareas que ya calificaste. El admin de tu escuela aprueba hasta 3 por edición.
                        </p>
                    </div>
                </div>
            </div>

            {aulas.length > 0 && (
                <div className={styles.filtros}>
                    <select
                        className={styles.filtroSelect}
                        value={aulaFiltro}
                        onChange={e => setAulaFiltro(e.target.value)}
                    >
                        <option value="todas">Todas mis aulas</option>
                        {aulas.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className={styles.buscador}
                        placeholder="Buscar por alumno o tarea..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>
            )}

            {alerta && (
                <div className={`${styles.alerta} ${alerta.tipo === 'success' ? styles.alertaSuccess : styles.alertaError}`}>
                    {alerta.texto}
                </div>
            )}

            {entregas.length === 0 ? (
                <div className={styles.emptyState}>
                    <img src={xolotlIdea} alt="" className={styles.xolotl} />
                    <h3 className={styles.emptyTitle}>Aún no hay tareas calificadas</h3>
                    <p className={styles.emptyDesc}>
                        Cuando califiques una entrega en "Calificaciones", podrás nominarla aquí.
                    </p>
                </div>
            ) : entregasFiltradas.length === 0 ? (
                <div className={styles.emptyState}>
                    <img src={xolotlIdea} alt="" className={styles.xolotl} />
                    <h3 className={styles.emptyTitle}>Sin resultados</h3>
                    <p className={styles.emptyDesc}>Prueba con otra aula o busca otro nombre.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {entregasFiltradas.map(entrega => {
                        const nom = nominaciones[entrega.id];
                        const estado = nom ? ESTADO_LABEL[nom.estado] : null;
                        return (
                            <div key={entrega.id} className={styles.proyectoCard}>
                                <div
                                    className={styles.thumb}
                                    style={!entrega.thumbnail_url ? { background: 'linear-gradient(135deg, #a569ff, #4D96FF)' } : undefined}
                                >
                                    {entrega.thumbnail_url && <img src={entrega.thumbnail_url} alt="" />}
                                </div>
                                <div className={styles.proyectoInfo}>
                                    <p className={styles.proyectoNombre}>{nom?.titulo_publico || entrega.tarea?.titulo}</p>
                                    <p className={styles.proyectoAutor}>
                                        @{entrega.alumno?.username || 'alumno'} · {entrega.tarea?.aula?.nombre}
                                        {entrega.calificacion != null && <> · Calificación: {entrega.calificacion}</>}
                                    </p>
                                    <div className={styles.acciones}>
                                        <button type="button" className={styles.btnVer} onClick={() => verProyecto(entrega)}>
                                            Ver proyecto
                                        </button>
                                        {nom && (
                                            <button
                                                type="button"
                                                className={styles.btnVer}
                                                onClick={() => editarNombre(nom, entrega.tarea?.titulo)}
                                            >
                                                Editar nombre
                                            </button>
                                        )}
                                        {estado ? (
                                            <span className={`${styles.badge} ${styles[estado.clase]}`}>{estado.texto}</span>
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.btnNominar}
                                                disabled={nominando === entrega.id}
                                                onClick={() => nominar(entrega)}
                                            >
                                                {nominando === entrega.id ? 'Nominando...' : '🏆 Nominar'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VistaSalonFama;

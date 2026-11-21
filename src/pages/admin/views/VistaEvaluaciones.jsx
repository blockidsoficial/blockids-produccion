
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaEvaluaciones.css';

const VistaEvaluaciones = ({ perfil, esSuperAdmin }) => {
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroCalificacion, setFiltroCalificacion] = useState('todas');
    const [eliminandoId, setEliminandoId] = useState(null);

    const esAdministradorPlataforma =
        esSuperAdmin || perfil?.rol === 'superadmin';

    // ==========================================
    // MOSTRAR ESTRELLAS
    // ==========================================
    const estrellas = (calificacion) => {
        const valor = Math.max(
            0,
            Math.min(5, Math.round(Number(calificacion) || 0))
        );

        return (
            <>
                <span className={styles.estrellasLlenas}>
                    {'★'.repeat(valor)}
                </span>
                <span className={styles.estrellasVacias}>
                    {'☆'.repeat(5 - valor)}
                </span>
            </>
        );
    };

    // ==========================================
    // FORMATEAR FECHA
    // ==========================================
    const fecha = (valor) => {
        if (!valor) return '—';

        return new Date(valor).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // ==========================================
    // CARGAR EVALUACIONES
    // ==========================================
    useEffect(() => {
        let cancelado = false;

        const cargarEvaluaciones = async () => {
            setCargando(true);
            setError('');

            try {
                if (
                    !perfil ||
                    !['admin_escuela', 'superadmin'].includes(perfil.rol)
                ) {
                    throw new Error(
                        'No tienes permisos para consultar esta sección.'
                    );
                }

                if (
                    perfil.rol === 'admin_escuela' &&
                    !perfil.escuela_id
                ) {
                    throw new Error(
                        'Tu cuenta de administrador no tiene una escuela asignada.'
                    );
                }

                // Obtener evaluaciones
                const { data: registros, error: errorEvaluaciones } =
                    await supabase
                        .from('evaluaciones_profesores')
                        .select(`
                            id,
                            aula_id,
                            alumno_id,
                            profesor_id,
                            calificacion,
                            comentario,
                            fecha_creacion
                        `)
                        .order('fecha_creacion', { ascending: false });

                if (errorEvaluaciones) throw errorEvaluaciones;

                const lista = registros || [];

                if (lista.length === 0) {
                    if (!cancelado) {
                        setEvaluaciones([]);
                    }
                    return;
                }

                // Obtener identificadores de aulas y profesores
                const aulaIds = [
                    ...new Set(
                        lista.map(e => e.aula_id).filter(Boolean)
                    )
                ];

                const profesorIds = [
                    ...new Set(
                        lista.map(e => e.profesor_id).filter(Boolean)
                    )
                ];

                // Consultar aulas y profesores
                const [resAulas, resProfesores] = await Promise.all([
                    aulaIds.length
                        ? supabase
                            .from('aulas')
                            .select('id, nombre, profesor_id, escuela_id')
                            .in('id', aulaIds)
                        : Promise.resolve({ data: [], error: null }),

                    profesorIds.length
                        ? supabase
                            .from('perfiles')
                            .select(`
                                id,
                                username,
                                nombre,
                                apellido_paterno,
                                apellido_materno
                            `)
                            .in('id', profesorIds)
                        : Promise.resolve({ data: [], error: null })
                ]);

                if (resAulas.error) throw resAulas.error;
                if (resProfesores.error) throw resProfesores.error;

                const aulas = new Map(
                    (resAulas.data || []).map(a => [a.id, a])
                );

                const profesores = new Map(
                    (resProfesores.data || []).map(p => [p.id, p])
                );

                // Obtener escuelas relacionadas con las aulas
                const escuelaIds = [
                    ...new Set(
                        (resAulas.data || [])
                            .map(a => a.escuela_id)
                            .filter(Boolean)
                    )
                ];

                const { data: escuelasData, error: errorEscuelas } =
                    escuelaIds.length
                        ? await supabase
                            .from('escuelas')
                            .select('id, nombre')
                            .in('id', escuelaIds)
                        : { data: [], error: null };

                if (errorEscuelas) throw errorEscuelas;

                const escuelas = new Map(
                    (escuelasData || []).map(e => [e.id, e])
                );

                // Relacionar evaluaciones, aulas, profesores y escuelas
                let resultado = lista.map(e => {
                    const aula = aulas.get(e.aula_id);
                    const profesor = profesores.get(e.profesor_id);
                    const escuela = aula?.escuela_id
                        ? escuelas.get(aula.escuela_id)
                        : null;

                    const nombreProfesor = profesor
                        ? [
                            profesor.nombre,
                            profesor.apellido_paterno,
                            profesor.apellido_materno
                        ].filter(Boolean).join(' ') ||
                            `@${profesor.username || 'profesor'}`
                        : 'Profesor no disponible';

                    return {
                        ...e,
                        nombreAula: aula?.nombre || 'Aula no disponible',
                        nombreProfesor,
                        escuelaId: aula?.escuela_id || null,
                        nombreEscuela: escuela?.nombre || 'Escuela no disponible'
                    };
                });

                // El administrador de escuela solamente ve su escuela
                if (
                    perfil.rol === 'admin_escuela' &&
                    !esAdministradorPlataforma
                ) {
                    resultado = resultado.filter(
                        e => e.escuelaId === perfil.escuela_id
                    );
                }

                if (!cancelado) {
                    setEvaluaciones(resultado);
                }

            } catch (err) {
                console.error(
                    'Error al cargar evaluaciones:',
                    err
                );

                if (!cancelado) {
                    setError(
                        err.message ||
                        'No se pudieron cargar las evaluaciones.'
                    );
                }

            } finally {
                if (!cancelado) {
                    setCargando(false);
                }
            }
        };

        cargarEvaluaciones();

        return () => {
            cancelado = true;
        };
    }, [perfil, esSuperAdmin, esAdministradorPlataforma]);

    // ==========================================
    // ELIMINAR EVALUACIÓN
    // ==========================================
    const eliminarEvaluacion = async (evaluacion) => {
        const confirmar = window.confirm(
            `¿Eliminar completamente esta evaluación?\n\n` +
            `Profesor: ${evaluacion.nombreProfesor}\n` +
            `Escuela: ${evaluacion.nombreEscuela}\n` +
            `Calificación: ${evaluacion.calificacion}/5\n` +
            `Comentario: ${evaluacion.comentario || 'Sin comentario'}\n\n` +
            `Esta acción no se puede deshacer.`
        );

        if (!confirmar) return;

        setEliminandoId(evaluacion.id);
        setError('');
        setMensaje('');

        try {
            const { error: errorEliminar } = await supabase
                .from('evaluaciones_profesores')
                .delete()
                .eq('id', evaluacion.id);

            if (errorEliminar) throw errorEliminar;

            setEvaluaciones(actuales =>
                actuales.filter(item => item.id !== evaluacion.id)
            );

            setMensaje(
                'La evaluación completa se eliminó correctamente.'
            );

        } catch (err) {
            console.error(
                'Error al eliminar evaluación:',
                err
            );

            setError(
                err.message ||
                'No se pudo eliminar la evaluación. Verifica los permisos de Supabase.'
            );

        } finally {
            setEliminandoId(null);
        }
    };

    // ==========================================
    // FILTROS Y BÚSQUEDA
    // ==========================================
    const evaluacionesFiltradas = useMemo(() => {
        return evaluaciones.filter(e => {
            const texto = `
                ${e.nombreProfesor}
                ${e.nombreAula}
                ${e.nombreEscuela}
                ${e.comentario || ''}
            `.toLowerCase();

            const coincideBusqueda = texto.includes(
                busqueda.toLowerCase()
            );

            const coincideCalificacion =
                filtroCalificacion === 'todas' ||
                Number(e.calificacion) === Number(filtroCalificacion);

            return coincideBusqueda && coincideCalificacion;
        });
    }, [evaluaciones, busqueda, filtroCalificacion]);

    // ==========================================
    // ESTADÍSTICAS GENERALES
    // ==========================================
    const total = evaluaciones.length;

    const promedio = total
        ? evaluaciones.reduce(
            (suma, e) => suma + Number(e.calificacion || 0),
            0
        ) / total
        : 0;

    const profesoresUnicos = new Set(
        evaluaciones.map(e => e.profesor_id).filter(Boolean)
    ).size;

    const escuelasUnicas = new Set(
        evaluaciones.map(e => e.escuelaId).filter(Boolean)
    ).size;

    // ==========================================
    // ESTADÍSTICAS POR ESCUELA Y PROFESOR
    // ==========================================
    const estadisticasEscuelas = useMemo(() => {
        const grupos = new Map();

        evaluaciones.forEach(e => {
            if (!e.escuelaId) return;

            if (!grupos.has(e.escuelaId)) {
                grupos.set(e.escuelaId, {
                    id: e.escuelaId,
                    nombre: e.nombreEscuela,
                    evaluaciones: [],
                    profesores: new Map()
                });
            }

            const escuela = grupos.get(e.escuelaId);

            escuela.evaluaciones.push(e);

            if (!escuela.profesores.has(e.profesor_id)) {
                escuela.profesores.set(e.profesor_id, {
                    id: e.profesor_id,
                    nombre: e.nombreProfesor,
                    calificaciones: [],
                    total: 0
                });
            }

            const profesor = escuela.profesores.get(e.profesor_id);

            profesor.calificaciones.push(
                Number(e.calificacion) || 0
            );

            profesor.total += 1;
        });

        return Array.from(grupos.values())
            .map(escuela => {
                const totalEscuela = escuela.evaluaciones.length;

                const promedioEscuela = totalEscuela
                    ? escuela.evaluaciones.reduce(
                        (suma, e) =>
                            suma + Number(e.calificacion || 0),
                        0
                    ) / totalEscuela
                    : 0;

                const profesoresEvaluados = Array.from(
                    escuela.profesores.values()
                ).map(profesor => {
                    const promedioProfesor =
                        profesor.calificaciones.reduce(
                            (suma, calificacion) => suma + calificacion,
                            0
                        ) / profesor.calificaciones.length;

                    return {
                        ...profesor,
                        promedio: promedioProfesor
                    };
                });

                const mejoresProfesores = profesoresEvaluados
                    .sort((a, b) => {
                        if (b.promedio !== a.promedio) {
                            return b.promedio - a.promedio;
                        }

                        return b.total - a.total;
                    })
                    .slice(0, 5);

                return {
                    id: escuela.id,
                    nombre: escuela.nombre,
                    total: totalEscuela,
                    promedio: promedioEscuela,
                    profesoresEvaluados: profesoresEvaluados.length,
                    mejoresProfesores
                };
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [evaluaciones]);

    // ==========================================
    // CARGANDO
    // ==========================================
    if (cargando) {
        return (
            <div className={styles.estado}>
                <div className={styles.cargandoIcono}>★</div>
                <h3>Cargando evaluaciones</h3>
                <p>Estamos organizando las opiniones de los alumnos.</p>
            </div>
        );
    }

    // ==========================================
    // VISTA PRINCIPAL
    // ==========================================
    return (
        <section className={styles.panel}>

            {/* ENCABEZADO */}
            <header className={styles.encabezado}>
                <div>
                    <span className={styles.etiqueta}>
                        PANEL DE OPINIONES
                    </span>

                    <h1>Evaluaciones de profesores</h1>

                    <p>
                        Consulta el rendimiento y las opiniones de los alumnos
                        sobre los profesores de las escuelas.
                    </p>
                </div>

                <div className={styles.iconoEncabezado}>
                    ★
                </div>
            </header>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {mensaje && (
                <div className={styles.mensaje}>
                    {mensaje}
                </div>
            )}

            {!error && (
                <>
                    {/* RESUMEN GENERAL */}
                    <section className={styles.seccion}>
                        <div className={styles.tituloSeccion}>
                            <div>
                                <span className={styles.subtitulo}>
                                    RESUMEN GENERAL
                                </span>
                                <h2>Actividad de evaluaciones</h2>
                            </div>
                        </div>

                        <div className={styles.estadisticas}>

                            <article className={styles.estadistica}>
                                <div className={`${styles.estadisticaIcono} ${styles.azul}`}>
                                    <span>▤</span>
                                </div>
                                <div>
                                    <span>Total de evaluaciones</span>
                                    <strong>{total}</strong>
                                    <small>Opiniones registradas</small>
                                </div>
                            </article>

                            <article className={styles.estadistica}>
                                <div className={`${styles.estadisticaIcono} ${styles.amarillo}`}>
                                    <span>★</span>
                                </div>
                                <div>
                                    <span>Promedio general</span>
                                    <strong>
                                        {promedio.toFixed(1)} <small>/ 5</small>
                                    </strong>
                                    <small className={styles.estrellas}>
                                        {estrellas(promedio)}
                                    </small>
                                </div>
                            </article>

                            <article className={styles.estadistica}>
                                <div className={`${styles.estadisticaIcono} ${styles.morado}`}>
                                    <span>♙</span>
                                </div>
                                <div>
                                    <span>Profesores evaluados</span>
                                    <strong>{profesoresUnicos}</strong>
                                    <small>Con al menos una opinión</small>
                                </div>
                            </article>

                            <article className={styles.estadistica}>
                                <div className={`${styles.estadisticaIcono} ${styles.verde}`}>
                                    <span>⌂</span>
                                </div>
                                <div>
                                    <span>Escuelas evaluadas</span>
                                    <strong>{escuelasUnicas}</strong>
                                    <small>Con evaluaciones registradas</small>
                                </div>
                            </article>

                        </div>
                    </section>

                    {/* ESTADÍSTICAS POR ESCUELA */}
                    <section className={styles.seccion}>
                        <div className={styles.tituloSeccion}>
                            <div>
                                <span className={styles.subtitulo}>
                                    COMPARATIVA
                                </span>
                                <h2>Estadísticas por escuela</h2>
                                <p>
                                    Promedio de calificaciones y cantidad de
                                    evaluaciones recibidas.
                                </p>
                            </div>
                        </div>

                        {estadisticasEscuelas.length === 0 ? (
                            <div className={styles.vacio}>
                                <span>▤</span>
                                <h3>Aún no hay estadísticas</h3>
                                <p>
                                    Cuando los alumnos evalúen a sus profesores,
                                    aparecerán aquí los resultados por escuela.
                                </p>
                            </div>
                        ) : (
                            <div className={styles.graficasGrid}>

                                {/* GRÁFICA DE PROMEDIOS */}
                                <article className={styles.graficaCard}>
                                    <div className={styles.graficaEncabezado}>
                                        <div>
                                            <h3>Promedio por escuela</h3>
                                            <p>Calificación promedio sobre 5</p>
                                        </div>
                                        <span className={styles.graficaIcono}>
                                            ★
                                        </span>
                                    </div>

                                    <div className={styles.barras}>
                                        {estadisticasEscuelas.map(escuela => (
                                            <div
                                                className={styles.barraItem}
                                                key={`promedio-${escuela.id}`}
                                            >
                                                <div className={styles.barraInfo}>
                                                    <span>{escuela.nombre}</span>
                                                    <strong>
                                                        {escuela.promedio.toFixed(1)}
                                                        <small>/5</small>
                                                    </strong>
                                                </div>

                                                <div className={styles.barraFondo}>
                                                    <div
                                                        className={`${styles.barraRelleno} ${styles.barraPromedio}`}
                                                        style={{
                                                            width: `${Math.max(
                                                                0,
                                                                Math.min(
                                                                    100,
                                                                    escuela.promedio * 20
                                                                )
                                                            )}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </article>

                                {/* GRÁFICA DE CANTIDAD */}
                                <article className={styles.graficaCard}>
                                    <div className={styles.graficaEncabezado}>
                                        <div>
                                            <h3>Evaluaciones por escuela</h3>
                                            <p>Cantidad de opiniones registradas</p>
                                        </div>
                                        <span className={styles.graficaIcono}>
                                            ▤
                                        </span>
                                    </div>

                                    <div className={styles.barras}>
                                        {estadisticasEscuelas.map(escuela => {
                                            const maximo = Math.max(
                                                ...estadisticasEscuelas.map(
                                                    e => e.total
                                                ),
                                                1
                                            );

                                            return (
                                                <div
                                                    className={styles.barraItem}
                                                    key={`cantidad-${escuela.id}`}
                                                >
                                                    <div className={styles.barraInfo}>
                                                        <span>{escuela.nombre}</span>
                                                        <strong>{escuela.total}</strong>
                                                    </div>

                                                    <div className={styles.barraFondo}>
                                                        <div
                                                            className={`${styles.barraRelleno} ${styles.barraCantidad}`}
                                                            style={{
                                                                width: `${(escuela.total / maximo) * 100}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </article>

                            </div>
                        )}
                    </section>

                    {/* MEJORES PROFESORES POR ESCUELA */}
                    <section className={styles.seccion}>
                        <div className={styles.tituloSeccion}>
                            <div>
                                <span className={styles.subtitulo}>
                                    RECONOCIMIENTO
                                </span>
                                <h2>Profesores mejor calificados</h2>
                                <p>
                                    Los cinco profesores con mejor promedio
                                    de cada escuela.
                                </p>
                            </div>
                        </div>

                        {estadisticasEscuelas.length === 0 ? (
                            <div className={styles.vacio}>
                                Todavía no hay profesores evaluados.
                            </div>
                        ) : (
                            <div className={styles.rankingEscuelas}>
                                {estadisticasEscuelas.map(escuela => (
                                    <article
                                        className={styles.rankingCard}
                                        key={`ranking-${escuela.id}`}
                                    >
                                        <div className={styles.rankingEncabezado}>
                                            <div className={styles.rankingIcono}>
                                                ⌂
                                            </div>

                                            <div>
                                                <h3>{escuela.nombre}</h3>
                                                <span>
                                                    {escuela.profesoresEvaluados}{' '}
                                                    profesores evaluados
                                                </span>
                                            </div>

                                            <div className={styles.promedioEscuela}>
                                                <strong>
                                                    {escuela.promedio.toFixed(1)}
                                                </strong>
                                                <span>Promedio</span>
                                            </div>
                                        </div>

                                        {escuela.mejoresProfesores.length === 0 ? (
                                            <div className={styles.vacioPequeno}>
                                                No hay profesores evaluados.
                                            </div>
                                        ) : (
                                            <div className={styles.rankingLista}>
                                                {escuela.mejoresProfesores.map(
                                                    (profesor, indice) => (
                                                        <div
                                                            className={styles.rankingItem}
                                                            key={profesor.id}
                                                        >
                                                            <div className={styles.rankingPosicion}>
                                                                {indice === 0
                                                                    ? '🏆'
                                                                    : `#${indice + 1}`}
                                                            </div>

                                                            <div className={styles.rankingDatos}>
                                                                <strong>
                                                                    {profesor.nombre}
                                                                </strong>
                                                                <span>
                                                                    {profesor.total}{' '}
                                                                    {profesor.total === 1
                                                                        ? 'evaluación'
                                                                        : 'evaluaciones'}
                                                                </span>
                                                            </div>

                                                            <div className={styles.rankingCalificacion}>
                                                                <strong>
                                                                    {profesor.promedio.toFixed(1)}
                                                                </strong>
                                                                <span>
                                                                    {estrellas(profesor.promedio)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* COMENTARIOS Y EVALUACIONES */}
                    <section className={styles.seccion}>
                        <div className={styles.tituloSeccion}>
                            <div>
                                <span className={styles.subtitulo}>
                                    OPINIONES DE LOS ALUMNOS
                                </span>
                                <h2>Comentarios y calificaciones</h2>
                                <p>
                                    Consulta, busca y administra las evaluaciones.
                                </p>
                            </div>
                        </div>

                        <div className={styles.filtros}>
                            <div className={styles.busqueda}>
                                <span>⌕</span>
                                <input
                                    type="search"
                                    placeholder="Buscar profesor, escuela, aula o comentario..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                />
                            </div>

                            <select
                                value={filtroCalificacion}
                                onChange={e => setFiltroCalificacion(e.target.value)}
                            >
                                <option value="todas">
                                    Todas las calificaciones
                                </option>

                                {[5, 4, 3, 2, 1, 0].map(n => (
                                    <option key={n} value={String(n)}>
                                        {n} estrellas
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.lista}>
                            <div className={styles.listaTitulo}>
                                <div>
                                    <h3>Evaluaciones registradas</h3>
                                    <span>
                                        {evaluacionesFiltradas.length} resultados
                                    </span>
                                </div>
                            </div>

                            {evaluacionesFiltradas.length === 0 ? (
                                <div className={styles.vacio}>
                                    <span>⌕</span>
                                    <h3>No se encontraron evaluaciones</h3>
                                    <p>
                                        Prueba con otra búsqueda o cambia el
                                        filtro de calificación.
                                    </p>
                                </div>
                            ) : (
                                evaluacionesFiltradas.map(e => (
                                    <article
                                        className={styles.evaluacion}
                                        key={e.id}
                                    >
                                        <div className={styles.evaluacionSuperior}>
                                            <div className={styles.profesorInfo}>
                                                <div className={styles.avatarProfesor}>
                                                    {e.nombreProfesor
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <h3>{e.nombreProfesor}</h3>
                                                    <span className={styles.aula}>
                                                        Aula: {e.nombreAula}
                                                    </span>
                                                    <span className={styles.escuelaComentario}>
                                                        {e.nombreEscuela}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.calificacion}>
                                                <strong>
                                                    {Number(e.calificacion).toFixed(0)}
                                                    <small>/5</small>
                                                </strong>

                                                <span>
                                                    {estrellas(e.calificacion)}
                                                </span>
                                            </div>
                                        </div>

                                        <p className={styles.comentario}>
                                            {e.comentario?.trim() ||
                                                'El alumno no escribió un comentario.'}
                                        </p>

                                        <footer className={styles.pieEvaluacion}>
                                            <span>
                                                Publicado: {fecha(e.fecha_creacion)}
                                            </span>

                                            <button
                                                type="button"
                                                className={styles.btnEliminar}
                                                onClick={() => eliminarEvaluacion(e)}
                                                disabled={eliminandoId === e.id}
                                            >
                                                {eliminandoId === e.id
                                                    ? 'Eliminando...'
                                                    : 'Eliminar evaluación'}
                                            </button>
                                        </footer>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </>
            )}
        </section>
    );
};

export default VistaEvaluaciones;

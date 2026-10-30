import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaEvaluaciones.css';

const VistaEvaluaciones = ({ perfil, esSuperAdmin }) => {
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroCalificacion, setFiltroCalificacion] = useState('todas');

    useEffect(() => {
        let cancelado = false;

        const cargarEvaluaciones = async () => {
            setCargando(true);
            setError('');

            try {
                // RLS limita los registros que puede consultar cada administrador.
                const { data: registros, error: errorEvaluaciones } =
                    await supabase
                        .from('evaluaciones_profesores')
                        .select('id, aula_id, alumno_id, profesor_id, calificacion, comentario, fecha_creacion')
                        .order('fecha_creacion', { ascending: false });

                if (errorEvaluaciones) throw errorEvaluaciones;

                const lista = registros || [];

                if (lista.length === 0) {
                    if (!cancelado) setEvaluaciones([]);
                    return;
                }

                const aulaIds = [...new Set(lista.map(e => e.aula_id).filter(Boolean))];
                const profesorIds = [...new Set(lista.map(e => e.profesor_id).filter(Boolean))];

                const [resAulas, resProfesores] = await Promise.all([
                    aulaIds.length
                        ? supabase.from('aulas')
                            .select('id, nombre, profesor_id, escuela_id')
                            .in('id', aulaIds)
                        : Promise.resolve({ data: [], error: null }),

                    profesorIds.length
                        ? supabase.from('perfiles')
                            .select('id, username, nombre, apellido_paterno, apellido_materno')
                            .in('id', profesorIds)
                        : Promise.resolve({ data: [], error: null })
                ]);

                if (resAulas.error) throw resAulas.error;
                if (resProfesores.error) throw resProfesores.error;

                const aulas = new Map((resAulas.data || []).map(a => [a.id, a]));
                const profesores = new Map((resProfesores.data || []).map(p => [p.id, p]));

                const resultado = lista.map(e => {
                    const aula = aulas.get(e.aula_id);
                    const profesor = profesores.get(e.profesor_id);

                    const nombreProfesor = profesor
                        ? [
                            profesor.nombre,
                            profesor.apellido_paterno,
                            profesor.apellido_materno
                        ].filter(Boolean).join(' ') || `@${profesor.username}`
                        : 'Profesor no disponible';

                    return {
                        ...e,
                        nombreAula: aula?.nombre || 'Aula no disponible',
                        nombreProfesor
                    };
                });

                if (!cancelado) setEvaluaciones(resultado);

            } catch (err) {
                console.error('Error al cargar evaluaciones:', err);
                if (!cancelado) setError(err.message || 'No se pudieron cargar las evaluaciones.');
            } finally {
                if (!cancelado) setCargando(false);
            }
        };

        if (perfil && ['admin_escuela', 'superadmin'].includes(perfil.rol)) {
            cargarEvaluaciones();
        } else {
            setCargando(false);
            setError('No tienes permisos para consultar esta sección.');
        }

        return () => { cancelado = true; };
    }, [perfil, esSuperAdmin]);

    const evaluacionesFiltradas = useMemo(() => {
        return evaluaciones.filter(e => {
            const texto = `${e.nombreProfesor} ${e.nombreAula} ${e.comentario || ''}`.toLowerCase();
            const coincideBusqueda = texto.includes(busqueda.toLowerCase());
            const coincideCalificacion =
                filtroCalificacion === 'todas' ||
                Number(e.calificacion) === Number(filtroCalificacion);

            return coincideBusqueda && coincideCalificacion;
        });
    }, [evaluaciones, busqueda, filtroCalificacion]);

    const total = evaluaciones.length;

    const promedio = total
        ? evaluaciones.reduce((suma, e) => suma + Number(e.calificacion || 0), 0) / total
        : 0;

    const profesoresUnicos = new Set(evaluaciones.map(e => e.profesor_id)).size;

    const fecha = valor => valor
        ? new Date(valor).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
        : '—';

    if (cargando) {
        return <div className={styles.estado}>Cargando evaluaciones...</div>;
    }

    return (
        <section className={styles.panel}>
            <header className={styles.encabezado}>
                <div>
                    <h1>Evaluaciones de profesores</h1>
                    <p>Consulta las calificaciones y comentarios realizados por los alumnos.</p>
                </div>
            </header>

            {error && <div className={styles.error}>{error}</div>}

            {!error && (
                <>
                    <div className={styles.estadisticas}>
                        <article className={styles.estadistica}>
                            <span>Total de evaluaciones</span>
                            <strong>{total}</strong>
                        </article>

                        <article className={styles.estadistica}>
                            <span>Promedio general</span>
                            <strong>{promedio.toFixed(1)} / 5</strong>
                            <span className={styles.estrellas}>★ ★ ★ ★ ★</span>
                        </article>

                        <article className={styles.estadistica}>
                            <span>Profesores evaluados</span>
                            <strong>{profesoresUnicos}</strong>
                        </article>
                    </div>

                    <div className={styles.filtros}>
                        <input
                            type="search"
                            placeholder="Buscar profesor, aula o comentario..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />

                        <select
                            value={filtroCalificacion}
                            onChange={e => setFiltroCalificacion(e.target.value)}
                        >
                            <option value="todas">Todas las calificaciones</option>
                            {[5, 4, 3, 2, 1, 0].map(n => (
                                <option key={n} value={String(n)}>{n} estrellas</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.lista}>
                        <div className={styles.listaTitulo}>
                            <h2>Comentarios de los alumnos</h2>
                            <span>{evaluacionesFiltradas.length} resultados</span>
                        </div>

                        {evaluacionesFiltradas.length === 0 ? (
                            <div className={styles.vacio}>
                                No hay evaluaciones que coincidan con la búsqueda.
                            </div>
                        ) : (
                            evaluacionesFiltradas.map(e => (
                                <article className={styles.evaluacion} key={e.id}>
                                    <div className={styles.evaluacionSuperior}>
                                        <div>
                                            <h3>{e.nombreProfesor}</h3>
                                            <span className={styles.aula}>{e.nombreAula}</span>
                                        </div>

                                        <div className={styles.calificacion}>
                                            <span>{Number(e.calificacion).toFixed(0)} / 5</span>
                                            <strong>
                                                {'★'.repeat(Math.max(0, Math.min(5, Number(e.calificacion))))}
                                                {'☆'.repeat(5 - Math.max(0, Math.min(5, Number(e.calificacion))))}
                                            </strong>
                                        </div>
                                    </div>

                                    <p className={styles.comentario}>
                                        {e.comentario?.trim() || 'El alumno no escribió un comentario.'}
                                    </p>

                                    <footer className={styles.fecha}>
                                        Publicado: {fecha(e.fecha_creacion)}
                                    </footer>
                                </article>
                            ))
                        )}
                    </div>
                </>
            )}
        </section>
    );
};

export default VistaEvaluaciones;

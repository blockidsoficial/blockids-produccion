
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaMisAulas.css';
import xolotlIdea from '../../../assets/xolotl/xolotl-idea.svg';
import iconCurso from '../../../assets/iconos-ui/ui-curso.svg';
import { celebrarLogrosNuevos } from '../../../services/gamificationService';

const VistaMisAulas = ({
    userId,
    misAulas,
    aulaIds,
    onAulasUpdated,
    onNavigate
}) => {
    // Estados del modal para unirse a un aula
    const [modalAbierto, setModalAbierto] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);

    // Estados de evaluaciones
    const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
    const [modalEvaluacion, setModalEvaluacion] = useState(false);
    const [calificacion, setCalificacion] = useState(0);
    const [comentario, setComentario] = useState('');
    const [evaluacionPropia, setEvaluacionPropia] = useState(null);
    const [opiniones, setOpiniones] = useState([]);
    const [cargandoOpiniones, setCargandoOpiniones] = useState(false);
    const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);
    const [errorEvaluacion, setErrorEvaluacion] = useState('');
    const [exitoEvaluacion, setExitoEvaluacion] = useState('');

    const abrirModal = () => {
        setCodigo('');
        setError(null);
        setExito(null);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (cargando) return;
        setModalAbierto(false);
        setCodigo('');
        setError(null);
        setExito(null);
    };

    // Inscripción a un aula: se conserva la funcionalidad original.
    const handleUnirse = async (e) => {
        e.preventDefault();

        const codigoLimpio = codigo.replace(/\s+/g, '').toUpperCase();
        if (!codigoLimpio) return;

        setError(null);
        setExito(null);
        setCargando(true);

        try {
            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('escuela_id')
                .eq('id', userId)
                .single();

            if (perfilError || !perfil) {
                throw new Error('No se pudo verificar tu perfil.');
            }

            const { data: aula, error: aulaError } = await supabase
                .from('aulas')
                .select('id, nombre, escuela_id')
                .eq('codigo_aula', codigoLimpio)
                .maybeSingle();

            if (aulaError) throw new Error('Error al buscar el aula.');

            if (!aula) {
                setError('Código inválido. Verifica que lo escribiste correctamente.');
                return;
            }

            if (aula.escuela_id !== perfil.escuela_id) {
                setError('Este código no pertenece a tu escuela.');
                return;
            }

            if (misAulas.some(a => a.id === aula.id)) {
                setError('Ya estás inscrito en esta clase.');
                return;
            }

            const { error: insertError } = await supabase
                .from('aula_alumnos')
                .insert({
                    aula_id: aula.id,
                    alumno_id: userId,
                    joined_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            await celebrarLogrosNuevos();

            setExito(`¡Te uniste a "${aula.nombre}"!`);

            setTimeout(() => {
                cerrarModal();
                if (onAulasUpdated) onAulasUpdated();
            }, 1500);

        } catch (err) {
            setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    // Abrir las opiniones y cargar la evaluación del alumno.
    const abrirEvaluaciones = async (aula) => {
        setAulaSeleccionada(aula);
        setModalEvaluacion(true);
        setCalificacion(0);
        setComentario('');
        setEvaluacionPropia(null);
        setOpiniones([]);
        setErrorEvaluacion('');
        setExitoEvaluacion('');
        setCargandoOpiniones(true);

        try {
            // El profesor se obtiene de la tabla real de aulas.
            const { data: datosAula, error: aulaError } = await supabase
                .from('aulas')
                .select('id, nombre, profesor_id')
                .eq('id', aula.id)
                .single();

            if (aulaError) throw aulaError;

            if (!datosAula.profesor_id) {
                throw new Error('Esta aula no tiene un profesor asignado.');
            }

            setAulaSeleccionada(datosAula);

            // RLS debe autorizar la consulta del alumno inscrito.
            const { data, error: opinionesError } = await supabase
                .from('evaluaciones_profesores')
                .select('id, aula_id, alumno_id, profesor_id, calificacion, comentario, fecha_creacion')
                .eq('aula_id', aula.id)
                .order('fecha_creacion', { ascending: false });

            if (opinionesError) throw opinionesError;

            const lista = data || [];
            setOpiniones(lista);

            const propia = lista.find(
                opinion => opinion.alumno_id === userId
            );

            if (propia) {
                setEvaluacionPropia(propia);
                setCalificacion(propia.calificacion);
                setComentario(propia.comentario);
            }

        } catch (err) {
            setErrorEvaluacion(
                err.message || 'No se pudieron cargar las opiniones.'
            );
        } finally {
            setCargandoOpiniones(false);
        }
    };

    const cerrarEvaluaciones = () => {
        if (guardandoEvaluacion) return;
        setModalEvaluacion(false);
        setAulaSeleccionada(null);
        setErrorEvaluacion('');
        setExitoEvaluacion('');
    };

    // Guardar una evaluación nueva o actualizar la del alumno.
    const guardarEvaluacion = async (e) => {
        e.preventDefault();

        if (!aulaSeleccionada || !userId) {
            setErrorEvaluacion('No se pudo identificar tu usuario o aula.');
            return;
        }

        if (calificacion < 1 || calificacion > 5) {
            setErrorEvaluacion('Selecciona una calificación de 1 a 5 estrellas.');
            return;
        }

        if (!comentario.trim()) {
            setErrorEvaluacion('Escribe tu opinión antes de guardar.');
            return;
        }

        setGuardandoEvaluacion(true);
        setErrorEvaluacion('');
        setExitoEvaluacion('');

        try {
            const datos = {
                aula_id: aulaSeleccionada.id,
                alumno_id: userId,
                profesor_id: aulaSeleccionada.profesor_id,
                calificacion,
                comentario: comentario.trim()
            };

            let resultado;

            if (evaluacionPropia) {
                resultado = await supabase
                    .from('evaluaciones_profesores')
                    .update({
                        calificacion: datos.calificacion,
                        comentario: datos.comentario
                    })
                    .eq('id', evaluacionPropia.id)
                    .select()
                    .single();
            } else {
                resultado = await supabase
                    .from('evaluaciones_profesores')
                    .insert(datos)
                    .select()
                    .single();
            }

            if (resultado.error) throw resultado.error;

            setEvaluacionPropia(resultado.data);
            setExitoEvaluacion('¡Tu evaluación se guardó correctamente!');

            // Actualizar la lista visible de opiniones.
            const { data: listaActualizada, error: recargaError } =
                await supabase
                    .from('evaluaciones_profesores')
                    .select('id, aula_id, alumno_id, profesor_id, calificacion, comentario, fecha_creacion')
                    .eq('aula_id', aulaSeleccionada.id)
                    .order('fecha_creacion', { ascending: false });

            if (recargaError) throw recargaError;

            setOpiniones(listaActualizada || []);

        } catch (err) {
            console.error('Error al guardar evaluación:', err);
            setErrorEvaluacion(
                err.message || 'No se pudo guardar la evaluación.'
            );
        } finally {
            setGuardandoEvaluacion(false);
        }
    };

    // Modal para unirse a una clase.
    const renderModal = () => ReactDOM.createPortal(
        <div className={styles.modalOverlay} onClick={cerrarModal}>
            <div
                className={styles.modalCard}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderLeft}>
                        <div className={styles.modalIconWrap}>
                            <img src={iconCurso} alt="" width="22" height="22" />
                        </div>
                        <div>
                            <h3 className={styles.modalTitle}>Unirse a una Aula</h3>
                            <p className={styles.modalSubtitle}>
                                Ingresa el código que te dio tu maestro
                            </p>
                        </div>
                    </div>
                    <button
                        className={styles.modalClose}
                        onClick={cerrarModal}
                        disabled={cargando}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleUnirse}>
                    <div className={styles.modalBody}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="codigo-aula">
                                Código de clase
                            </label>
                            <input
                                id="codigo-aula"
                                type="text"
                                className={styles.codigoInput}
                                placeholder="BLK-XXXX"
                                value={codigo}
                                onChange={e => setCodigo(e.target.value.toUpperCase())}
                                disabled={cargando || !!exito}
                                maxLength={8}
                                autoComplete="off"
                                spellCheck="false"
                            />
                        </div>

                        {error && <p className={styles.errorMsg}>{error}</p>}
                        {exito && <p className={styles.exitoMsg}>{exito}</p>}
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.btnCancelar}
                            onClick={cerrarModal}
                            disabled={cargando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.btnUnirse}
                            disabled={cargando || !codigo.trim() || !!exito}
                        >
                            {cargando
                                ? <><span className={styles.btnSpinner} />Buscando...</>
                                : '✓ Unirme'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );

    // Modal de estrellas, comentario y opiniones.
    const renderModalEvaluacion = () => {
        if (!modalEvaluacion || !aulaSeleccionada) return null;

        return ReactDOM.createPortal(
            <div
                className={styles.modalOverlay}
                onClick={cerrarEvaluaciones}
            >
                <div
                    className={`${styles.modalCard} ${styles.modalEvaluacionCard}`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className={styles.modalHeader}>
                        <div>
                            <h3 className={styles.modalTitle}>
                                Evaluar a mi profesor
                            </h3>
                            <p className={styles.modalSubtitle}>
                                {aulaSeleccionada.nombre}
                            </p>
                        </div>
                        <button
                            type="button"
                            className={styles.modalClose}
                            onClick={cerrarEvaluaciones}
                            disabled={guardandoEvaluacion}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        {cargandoOpiniones ? (
                            <p className={styles.evalInfo}>
                                Cargando opiniones...
                            </p>
                        ) : (
                            <>
                                <form onSubmit={guardarEvaluacion}>
                                    <div className={styles.evalForm}>
                                        <label className={styles.evalLabel}>
                                            ¿Cómo calificas a tu profesor?
                                        </label>

                                        <div
                                            className={styles.estrellas}
                                            role="group"
                                            aria-label="Calificación de una a cinco estrellas"
                                        >
                                            {[1, 2, 3, 4, 5].map(numero => (
                                                <button
                                                    key={numero}
                                                    type="button"
                                                    className={
                                                        numero <= calificacion
                                                            ? styles.estrellaActiva
                                                            : styles.estrella
                                                    }
                                                    onClick={() => setCalificacion(numero)}
                                                    aria-label={`${numero} ${numero === 1 ? 'estrella' : 'estrellas'}`}
                                                    aria-pressed={calificacion === numero}
                                                    disabled={guardandoEvaluacion}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>

                                        <p className={styles.evalPuntuacion}>
                                            {calificacion === 0
                                                ? 'Selecciona las estrellas'
                                                : `${calificacion} de 5 estrellas`}
                                        </p>

                                        <label
                                            className={styles.evalLabel}
                                            htmlFor="comentario-profesor"
                                        >
                                            Tu opinión
                                        </label>
                                        <textarea
                                            id="comentario-profesor"
                                            className={styles.evalTextarea}
                                            placeholder="Escribe tu opinión de manera respetuosa..."
                                            value={comentario}
                                            onChange={e => setComentario(e.target.value)}
                                            maxLength={2000}
                                            rows={4}
                                            disabled={guardandoEvaluacion}
                                        />
                                        <span className={styles.evalContador}>
                                            {comentario.length}/2000 caracteres
                                        </span>

                                        {errorEvaluacion && (
                                            <p className={styles.errorMsg}>
                                                {errorEvaluacion}
                                            </p>
                                        )}

                                        {exitoEvaluacion && (
                                            <p className={styles.exitoMsg}>
                                                {exitoEvaluacion}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            className={styles.btnGuardarEvaluacion}
                                            disabled={guardandoEvaluacion || cargandoOpiniones}
                                        >
                                            {guardandoEvaluacion
                                                ? 'Guardando...'
                                                : evaluacionPropia
                                                    ? 'Actualizar evaluación'
                                                    : 'Publicar evaluación'}
                                        </button>

                                        {evaluacionPropia && (
                                            <p className={styles.evalInfo}>
                                                Ya evaluaste esta aula. Puedes actualizar
                                                tu calificación y comentario.
                                            </p>
                                        )}
                                    </div>
                                </form>

                                <div className={styles.opinionesSection}>
                                    <h4 className={styles.opinionesTitulo}>
                                        Opiniones de alumnos ({opiniones.length})
                                    </h4>

                                    {opiniones.length === 0 ? (
                                        <p className={styles.evalInfo}>
                                            Todavía no hay opiniones para esta aula.
                                            ¡Puedes ser el primero en compartir la tuya!
                                        </p>
                                    ) : (
                                        opiniones.map(opinion => (
                                            <article
                                                className={styles.opinionCard}
                                                key={opinion.id}
                                            >
                                                <div className={styles.opinionHeader}>
                                                    <span className={styles.opinionAutor}>
                                                        Opinión de alumno
                                                    </span>
                                                    <span className={styles.opinionEstrellas}>
                                                        {'★'.repeat(opinion.calificacion)}
                                                        {'☆'.repeat(5 - opinion.calificacion)}
                                                    </span>
                                                </div>
                                                <p className={styles.opinionTexto}>
                                                    {opinion.comentario}
                                                </p>
                                                <time className={styles.opinionFecha}>
                                                    {new Date(opinion.fecha_creacion).toLocaleDateString('es-MX')}
                                                </time>
                                            </article>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.btnCancelar}
                            onClick={cerrarEvaluaciones}
                            disabled={guardandoEvaluacion}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    // Vista cuando el alumno todavía no tiene aulas.
    if (misAulas.length === 0) {
        return (
            <div className={styles.wrapper}>
                {modalAbierto && renderModal()}
                {renderModalEvaluacion()}

                <div className={styles.construccionCard}>
                    <img
                        src={xolotlIdea}
                        alt="Sin aulas"
                        className={styles.xolotl}
                    />
                    <h2 className={styles.titulo}>Mis Aulas</h2>
                    <p className={styles.desc}>
                        Aún no estás inscrito en ninguna clase.
                        Usa el código de tu maestro para unirte.
                    </p>
                    <button className={styles.btnNuevo} onClick={abrirModal}>
                        + Unirse a una Aula
                    </button>
                </div>
            </div>
        );
    }

    // Vista normal de las aulas.
    return (
        <div className={styles.wrapper}>
            {modalAbierto && renderModal()}
            {renderModalEvaluacion()}

            <div className={styles.headerRow}>
                <h2 className={styles.pageTitle}>Mis Aulas</h2>
                <button className={styles.btnNuevo} onClick={abrirModal}>
                    + Unirse a una Aula
                </button>
            </div>

            <div className={styles.aulasGrid}>
                {misAulas.map(aula => (
                    <div key={aula.id} className={styles.aulaCard}>
                        <div className={styles.aulaIconWrap}>
                            <img
                                src={iconCurso}
                                alt=""
                                className={styles.aulaIcon}
                            />
                        </div>

                        <div className={styles.aulaInfo}>
                            <h3 className={styles.aulaNombre}>
                                {aula.nombre}
                            </h3>
                            <span className={styles.aulaCodigo}>
                                {aula.codigo_aula}
                            </span>
                        </div>

                        <div className={styles.aulaAcciones}>
                            <button
                                className={styles.btnVerAula}
                                onClick={() => onNavigate('Muro')}
                            >
                                Ir al Muro
                            </button>

                            <button
                                type="button"
                                className={styles.btnCalificar}
                                onClick={() => abrirEvaluaciones(aula)}
                            >
                                ★ Calificar profesor
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VistaMisAulas;

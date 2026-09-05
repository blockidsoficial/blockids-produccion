import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabaseClient';
import iconInicio from '../../../assets/iconos-ui/ui-inicio.svg';
import styles from '../Dashboard.css';

const generarClaveAleatoria = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let sufijo = '';
    for (let i = 0; i < 4; i++) sufijo += chars[Math.floor(Math.random() * chars.length)];
    return `EDU-${sufijo}`;
};

const formatearFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const VistaEscuelas = ({ mostrarAlerta, onRefresh }) => {
    const [escuelas, setEscuelas]       = useState([]);
    const [cargando, setCargando]       = useState(true);
    const [toggling, setToggling]       = useState(null);
    const [nombre, setNombre]           = useState('');
    const [claveAcceso, setClaveAcceso] = useState('');
    const [enviando, setEnviando]       = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        const { data, error } = await supabase
            .from('escuelas')
            .select('id, nombre, clave_acceso, activa, created_at')
            .order('created_at', { ascending: false });
        if (!error) setEscuelas(data || []);
        setCargando(false);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const handleSubmitEscuela = async (e) => {
        e.preventDefault();
        if (!nombre.trim())      return mostrarAlerta('error', 'Escribe el nombre de la escuela.');
        if (!claveAcceso.trim()) return mostrarAlerta('error', 'Genera o escribe una clave de acceso.');

        setEnviando(true);
        const { error } = await supabase.from('escuelas').insert([{
            nombre:       nombre.trim(),
            clave_acceso: claveAcceso.trim().toUpperCase(),
            activa:       true,
        }]);
        setEnviando(false);

        if (error) {
            mostrarAlerta('error', error.code === '23505'
                ? 'Esa clave ya existe. Genera una nueva.'
                : `Error: ${error.message}`);
        } else {
            mostrarAlerta('success', `Escuela "${nombre.trim()}" creada con éxito.`);
            setNombre(''); setClaveAcceso('');
            cargar();
            onRefresh?.();
        }
    };

    const handleToggleActiva = async (escuela) => {
        setToggling(escuela.id);
        const nuevoEstado = !escuela.activa;
        const { error } = await supabase.from('escuelas').update({ activa: nuevoEstado }).eq('id', escuela.id);
        if (error) {
            mostrarAlerta('error', `No se pudo actualizar: ${error.message}`);
        } else {
            setEscuelas(prev => prev.map(e => e.id === escuela.id ? { ...e, activa: nuevoEstado } : e));
            onRefresh?.();
        }
        setToggling(null);
    };

    const handleEliminarEscuela = async (escuela) => {
        if (!window.confirm(`¿Eliminar "${escuela.nombre}"? Esta acción no se puede deshacer.`)) return;
        try {
            const { error } = await supabase.from('escuelas').delete().eq('id', escuela.id);
            if (error) throw error;
            mostrarAlerta('success', `Escuela "${escuela.nombre}" eliminada.`);
            cargar();
            onRefresh?.();
        } catch (err) {
            const esForeignKey = err.code === '23503' || err.message?.toLowerCase().includes('foreign key');
            mostrarAlerta('error', esForeignKey
                ? 'No se puede eliminar esta escuela porque ya tiene aulas o usuarios asociados. Te recomendamos desactivarla.'
                : `Error al eliminar: ${err.message}`
            );
        }
    };

    const copiarClave = (clave) => {
        navigator.clipboard.writeText(clave);
        mostrarAlerta('success', `Clave "${clave}" copiada al portapapeles.`);
    };

    const activas = escuelas.filter(e => e.activa).length;

    return (
        <div className={styles.gestionSection}>

            <div className={styles.gestionHeader}>
                <img src={iconInicio} alt="" className={styles.gestionHeaderIcon} />
                <span className={styles.gestionHeaderLabel}>Gestión de Escuelas</span>
            </div>

            <div className={styles.contentGrid}>

                {/* ── Formulario Nueva Escuela ── */}
                <div className={styles.formPanel}>
                    <div className={styles.panelHeader}>
                        <div className={styles.panelIcon}><img src={iconInicio} alt="" /></div>
                        <div>
                            <p className={styles.panelTitle}>Nueva Escuela</p>
                            <p className={styles.panelSubtitle}>Crea y genera su clave de acceso</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmitEscuela}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="ve-nombre">Nombre de la Escuela</label>
                            <input
                                id="ve-nombre" type="text" className={styles.fieldInput}
                                placeholder="Ej. Instituto Tecnológico Matamoros"
                                value={nombre} onChange={e => setNombre(e.target.value)}
                                disabled={enviando} autoComplete="off"
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="ve-clave">Clave de Acceso</label>
                            <div className={styles.claveRow}>
                                <input
                                    id="ve-clave" type="text" className={styles.fieldInput}
                                    placeholder="Ej. EDU-X8B2"
                                    value={claveAcceso}
                                    onChange={e => setClaveAcceso(e.target.value.toUpperCase())}
                                    disabled={enviando} autoComplete="off" maxLength={12}
                                />
                                <button
                                    type="button" className={styles.btnGenerar}
                                    onClick={() => setClaveAcceso(generarClaveAleatoria())}
                                    disabled={enviando}
                                >
                                    Generar
                                </button>
                            </div>
                        </div>
                        <button type="submit" className={styles.btnSubmit} disabled={enviando}>
                            {enviando ? 'Registrando...' : 'Registrar Escuela'}
                        </button>
                    </form>
                </div>

                {/* ── Lista de Escuelas ── */}
                <div className={styles.listPanel}>
                    <div className={styles.listHeader}>
                        <h2 className={styles.listTitle}>Escuelas Registradas</h2>
                        {!cargando && (
                            <span className={styles.listCount}>
                                {escuelas.length} total · {activas} activa{activas !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {cargando ? (
                        <div className={styles.loadingState}>Cargando escuelas...</div>
                    ) : escuelas.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src={iconInicio} alt="" className={styles.emptyIcon} />
                            <p className={styles.emptyText}>Sin escuelas aún. ¡Crea la primera!</p>
                        </div>
                    ) : (
                        <div className={styles.schoolGrid}>
                            {escuelas.map((escuela, index) => (
                                <div
                                    key={escuela.id}
                                    className={`${styles.schoolCard} ${!escuela.activa ? styles.schoolCardInactiva : ''}`}
                                    style={{ animationDelay: `${index * 0.06}s` }}
                                >
                                    <div className={`${styles.schoolAvatar} ${!escuela.activa ? styles.schoolAvatarInactiva : ''}`}>
                                        <img src={iconInicio} alt="" />
                                    </div>
                                    <div className={styles.schoolInfo}>
                                        <div className={styles.schoolName}>{escuela.nombre}</div>
                                        <div className={styles.schoolMeta}>
                                            <span
                                                className={styles.schoolClave}
                                                title="Click para copiar"
                                                onClick={() => copiarClave(escuela.clave_acceso)}
                                            >
                                                {escuela.clave_acceso}
                                            </span>
                                        </div>
                                        <div className={styles.schoolDate}>Creada: {formatearFecha(escuela.created_at)}</div>
                                    </div>
                                    <div className={styles.schoolActions}>
                                        <span className={`${styles.schoolStatus} ${escuela.activa ? styles.statusActive : styles.statusInactive}`}>
                                            {escuela.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                        <button
                                            className={`${styles.btnToggle} ${escuela.activa ? styles.btnToggleDesactivar : styles.btnToggleActivar}`}
                                            onClick={() => handleToggleActiva(escuela)}
                                            disabled={toggling === escuela.id}
                                        >
                                            {toggling === escuela.id ? '...' : escuela.activa ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button
                                            className={styles.btnEliminarEscuela}
                                            onClick={() => handleEliminarEscuela(escuela)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VistaEscuelas;

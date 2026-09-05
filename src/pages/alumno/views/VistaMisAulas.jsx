import React, { useState } from 'react';
import { supabase } from '../../../config/supabaseClient';
import styles from './VistaMisAulas.css';
import xolotlIdea from '../../../assets/xolotl/xolotl-idea.svg';
import iconCurso   from '../../../assets/iconos-ui/ui-curso.svg';
import { desbloquearLogro } from '../../../services/gamificationService';

const VistaMisAulas = ({ userId, misAulas, aulaIds, onAulasUpdated, onNavigate }) => {

    const [modalAbierto, setModalAbierto] = useState(false);
    const [codigo,       setCodigo]       = useState('');
    const [cargando,     setCargando]     = useState(false);
    const [error,        setError]        = useState(null);
    const [exito,        setExito]        = useState(null);

    const abrirModal = () => {
        setCodigo(''); setError(null); setExito(null);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (cargando) return;
        setModalAbierto(false);
        setCodigo(''); setError(null); setExito(null);
    };

    // ── Lógica de inscripción ─────────────────────────────────────────────────
    const handleUnirse = async (e) => {
        e.preventDefault();
        const codigoLimpio = codigo.replace(/\s+/g, '').toUpperCase();
        if (!codigoLimpio) return;

        setError(null); setExito(null);
        setCargando(true);

        try {
            // Obtener escuela del alumno
            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('escuela_id')
                .eq('id', userId)
                .single();
            if (perfilError || !perfil) throw new Error('No se pudo verificar tu perfil.');

            // Buscar el aula por código
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
                setError('Este código no pertenece a tu escuela. Pide el código correcto a tu maestro.');
                return;
            }
            if (misAulas.some(a => a.id === aula.id)) {
                setError('Ya estás inscrito en esta clase.');
                return;
            }

            // Inscribir
            const { error: insertError } = await supabase
                .from('aula_alumnos')
                .insert({ aula_id: aula.id, alumno_id: userId, joined_at: new Date().toISOString() });
            if (insertError) throw insertError;

            await desbloquearLogro(userId, 'Nuevo en la Clase', 30);

            setExito(`¡Te uniste a "${aula.nombre}"! 🎉`);
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

    // ── Modal reutilizable ────────────────────────────────────────────────────
    const renderModal = () => (
        <div className={styles.modalOverlay} onClick={cerrarModal}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>

                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderLeft}>
                        <div className={styles.modalIconWrap}>
                            <img src={iconCurso} alt="" width="22" height="22" />
                        </div>
                        <div>
                            <h3 className={styles.modalTitle}>Unirse a una Aula</h3>
                            <p className={styles.modalSubtitle}>Ingresa el código que te dio tu maestro</p>
                        </div>
                    </div>
                    <button className={styles.modalClose} onClick={cerrarModal} disabled={cargando}>✕</button>
                </div>

                <form onSubmit={handleUnirse}>
                    <div className={styles.modalBody}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="codigo-aula">Código de clase</label>
                            <input
                                id="codigo-aula"
                                type="text"
                                className={styles.codigoInput}
                                placeholder="BLK-XXXX"
                                value={codigo}
                                onChange={e => setCodigo(e.target.value.toUpperCase())}
                                disabled={cargando || !!exito}
                                maxLength={8}
                                autoFocus
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
        </div>
    );

    // ── Estado vacío ──────────────────────────────────────────────────────────
    if (misAulas.length === 0) {
        return (
            <div className={styles.wrapper}>
                {modalAbierto && renderModal()}
                <div className={styles.construccionCard}>
                    <img src={xolotlIdea} alt="Sin aulas" className={styles.xolotl} />
                    <h2 className={styles.titulo}>Mis Aulas</h2>
                    <p className={styles.desc}>
                        Aún no estás inscrito en ninguna clase. Usa el código de tu maestro para unirte.
                    </p>
                    <button className={styles.btnNuevo} onClick={abrirModal}>
                        + Unirse a una Aula
                    </button>
                </div>
            </div>
        );
    }

    // ── Vista con aulas ───────────────────────────────────────────────────────
    return (
        <div className={styles.wrapper}>
            {modalAbierto && renderModal()}

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
                            <img src={iconCurso} alt="" className={styles.aulaIcon} />
                        </div>
                        <div className={styles.aulaInfo}>
                            <h3 className={styles.aulaNombre}>{aula.nombre}</h3>
                            <span className={styles.aulaCodigo}>{aula.codigo_aula}</span>
                        </div>
                        <button
                            className={styles.btnVerAula}
                            onClick={() => onNavigate('Muro')}
                        >
                            Ir al Muro
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VistaMisAulas;

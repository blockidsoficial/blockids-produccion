import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import styles from './VistaConfiguracion.css';

const VistaConfiguracion = ({ userId, mostrarAlerta }) => {
    const [nombre,          setNombre]          = useState('');
    const [apellidoPaterno, setApellidoPaterno] = useState('');
    const [apellidoMaterno, setApellidoMaterno] = useState('');
    const [username,        setUsername]        = useState('');
    const [cargando,        setCargando]        = useState(true);
    const [guardando,       setGuardando]       = useState(false);
    const [mensaje,         setMensaje]         = useState(null);

    // ── Mostrar mensaje: usa la alerta del dashboard padre si está disponible ─
    const mostrarMensaje = (tipo, texto) => {
        if (mostrarAlerta) {
            mostrarAlerta(tipo, texto);
        } else {
            setMensaje({ tipo, texto });
            setTimeout(() => setMensaje(null), 4000);
        }
    };

    // ── Carga segura del perfil ───────────────────────────────────────────────
    useEffect(() => {
        if (!userId) {
            setCargando(false);
            return;
        }
        const cargarPerfil = async () => {
            setCargando(true);
            try {
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('nombre, apellido_paterno, apellido_materno, username')
                    .eq('id', userId)
                    .single();
                if (error) throw error;
                setNombre(data?.nombre           || '');
                setApellidoPaterno(data?.apellido_paterno || '');
                setApellidoMaterno(data?.apellido_materno || '');
                setUsername(data?.username        || '');
            } catch (err) {
                console.error('[BLOCKIDS] Error cargando perfil:', err);
            } finally {
                setCargando(false);
            }
        };
        cargarPerfil();
    }, [userId]);

    // ── Guardar cambios ───────────────────────────────────────────────────────
    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!nombre.trim() || !apellidoPaterno.trim()) {
            mostrarMensaje('error', 'El nombre y el apellido paterno son obligatorios.');
            return;
        }
        setGuardando(true);
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({
                    nombre:           nombre.trim(),
                    apellido_paterno: apellidoPaterno.trim(),
                    apellido_materno: apellidoMaterno.trim(),
                })
                .eq('id', userId);
            if (error) throw error;
            mostrarMensaje('success', '¡Perfil actualizado correctamente!');
        } catch (err) {
            mostrarMensaje('error', `Error al guardar: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <div className={styles.cargando}>Cargando perfil...</div>;
    }

    return (
        <div className={styles.wrapper}>

            {/* Alerta */}
            {mensaje && (
                <div className={`${styles.alerta} ${mensaje.tipo === 'success' ? styles.alertaSuccess : styles.alertaError}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* Tarjeta */}
            <div className={styles.card}>

                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Mi Perfil</h2>
                    <p className={styles.cardSubtitle}>Actualiza tu información personal</p>
                </div>

                <form className={styles.form} onSubmit={handleGuardar}>

                    {/* Nombre */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cfg-nombre">Nombre</label>
                        <input
                            id="cfg-nombre"
                            type="text"
                            className={styles.fieldInput}
                            placeholder="Tu nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            disabled={guardando}
                            maxLength={60}
                        />
                    </div>

                    {/* Apellidos en grid de 2 columnas */}
                    <div className={styles.fieldGroupGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="cfg-ap">Apellido Paterno</label>
                            <input
                                id="cfg-ap"
                                type="text"
                                className={styles.fieldInput}
                                placeholder="Apellido paterno"
                                value={apellidoPaterno}
                                onChange={(e) => setApellidoPaterno(e.target.value)}
                                disabled={guardando}
                                maxLength={60}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="cfg-am">Apellido Materno</label>
                            <input
                                id="cfg-am"
                                type="text"
                                className={styles.fieldInput}
                                placeholder="Apellido materno"
                                value={apellidoMaterno}
                                onChange={(e) => setApellidoMaterno(e.target.value)}
                                disabled={guardando}
                                maxLength={60}
                            />
                        </div>
                    </div>

                    {/* Username (solo lectura) */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cfg-username">
                            Nombre de usuario
                            <span className={styles.fieldLabelNote}>(no editable)</span>
                        </label>
                        <input
                            id="cfg-username"
                            type="text"
                            className={styles.fieldInput}
                            value={`@${username}`}
                            disabled
                            readOnly
                        />
                    </div>

                    {/* Botón guardar */}
                    <div className={styles.formFooter}>
                        <button
                            type="submit"
                            className={styles.btnGuardar}
                            disabled={guardando}
                        >
                            {guardando ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default VistaConfiguracion;

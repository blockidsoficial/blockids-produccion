import React, { useState, useEffect } from 'react';
import { useParams, Link, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabaseClient';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Navbar from '../landing/Navbar.jsx';
import Footer from '../landing/Footer.jsx';
import styles from './DetalleProyecto.css';

import proyectoPlaceholder from '../../assets/iconos/icono-proyecto-placeholder.svg';
import iconoLike from '../../assets/iconos/icono-like.svg';

const PROYECTOS_DEMO = {
    'demo-1': {
        id: 'demo-1',
        nombre: 'Aventura Espacial con Xolotl',
        username: 'mateo_coder',
        escuela_nombre: 'Colegio Robótica Pro',
        descripcion: 'Un divertido juego de esquivar asteroides en el espacio usando las flechas del teclado. ¡Consigue la puntuación más alta!',
        instrucciones: 'Presiona Flecha Arriba y Abajo para mover a Xolotl. Evita los meteoritos.',
        likes: 24,
    },
    'demo-2': {
        id: 'demo-2',
        nombre: 'Calculadora de Bloques',
        username: 'sofia_dev',
        escuela_nombre: 'Instituto Innovación',
        descripcion: 'Herramienta interactiva para sumar, restar y multiplicar números creada 100% con bloques.',
        instrucciones: 'Ingresa los dos números y haz clic en la operación que deseas realizar.',
        likes: 18,
    },
    'demo-3': {
        id: 'demo-3',
        nombre: 'Carrera de Obstáculos 2D',
        username: 'lucas_game',
        escuela_nombre: 'Escuela Primaria Central',
        descripcion: 'Juego de plataformas donde debes saltar obstáculos y llegar a la meta antes de que se agote el tiempo.',
        instrucciones: 'Usa la barra espaciadora para saltar.',
        likes: 12,
    },
};

const DetalleProyecto = ({ session, rolPerfil }) => {
    const { id } = useParams();
    const history = useHistory();
    useDocumentTitle('Detalle del Proyecto');

    const [proyecto, setProyecto] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const obtenerProyecto = async () => {
            setCargando(true);

            if (String(id).startsWith('demo-')) {
                setProyecto(PROYECTOS_DEMO[id] || null);
                setCargando(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('entregas')
                    .select('id, nombre, descripcion, instrucciones, thumbnail_url, imagenes, likes, perfiles(username), escuelas(nombre)')
                    .eq('id', id)
                    .single();

                if (!error && data) {
                    setProyecto({
                        id: data.id,
                        nombre: data.nombre,
                        descripcion: data.descripcion,
                        instrucciones: data.instrucciones,
                        thumbnail_url: data.thumbnail_url,
                        imagenes: data.imagenes || [],
                        likes: data.likes || 0,
                        username: data.perfiles?.username,
                        escuela_nombre: data.escuelas?.nombre,
                    });
                }
            } catch (err) {
                console.error('Error al cargar proyecto:', err);
            } finally {
                setCargando(false);
            }
        };

        obtenerProyecto();
    }, [id]);

    if (cargando) {
        return (
            <div className={styles.pagina}>
                <Navbar urlDashboard={session ? '/proyectos' : '/login'} />
                <div className={styles.container}>
                    <p style={{ textAlign: 'center', margin: '4rem 0' }}>Cargando información del proyecto...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!proyecto) {
        return (
            <div className={styles.pagina}>
                <Navbar urlDashboard={session ? '/proyectos' : '/login'} />
                <div className={styles.container} style={{ textAlign: 'center', margin: '4rem 0' }}>
                    <h2>Proyecto no encontrado</h2>
                    <Link to="/proyectos-publicos" style={{ color: '#7c45c8', fontWeight: 'bold' }}>
                        ← Volver a proyectos
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.pagina}>
            <Navbar urlDashboard={session ? '/proyectos' : '/login'} />

            <main className={styles.container}>
                <Link to="/proyectos-publicos" className={styles.btnVolver}>
                    ← Volver a proyectos
                </Link>

                <div className={styles.detalleCard}>
                    <div className={styles.imagenWrapper}>
                        {proyecto.thumbnail_url ? (
                            <img src={proyecto.thumbnail_url} alt={proyecto.nombre} className={styles.imagenPrincipal} />
                        ) : (
                            <div className={styles.placeholderImg}>
                                <img src={proyectoPlaceholder} alt="" />
                            </div>
                        )}
                    </div>

                    <div className={styles.infoWrapper}>
                        <h1 className={styles.titulo}>{proyecto.nombre}</h1>
                        <p className={styles.autor}>
                            Creado por <strong>@{proyecto.username || 'anónimo'}</strong>
                            {proyecto.escuela_nombre && <> · {proyecto.escuela_nombre}</>}
                        </p>

                        <div className={styles.seccion}>
                            <h3>Descripción</h3>
                            <p>{proyecto.descripcion || 'Sin descripción disponible.'}</p>
                        </div>

                        {proyecto.instrucciones && (
                            <div className={styles.seccion}>
                                <h3>Instrucciones / Cómo jugar</h3>
                                <p>{proyecto.instrucciones}</p>
                            </div>
                        )}

                        <div className={styles.acciones}>
                            <button
                                type="button"
                                className={styles.btnEditor}
                                onClick={() => history.push(`/entorno?entregaId=${proyecto.id}`)}
                            >
                                Abrir en el editor 🎮
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

DetalleProyecto.propTypes = {
    session: PropTypes.object,
    rolPerfil: PropTypes.string,
};

export default DetalleProyecto;
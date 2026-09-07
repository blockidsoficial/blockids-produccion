import React, {useState, useEffect} from 'react';
import {listarProyectos, eliminarProyecto} from '../../services/projectService';
import iconProyectosTarjetas from '../../assets/iconos/icon-proyectos-tarjetas.svg';
import iconEliminarProyecto from '../../assets/iconos/icon-eliminar-proyecto.svg';

const estilos = {
    pagina: {
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        fontFamily: 'sans-serif'
    },
    header: {
        backgroundColor: '#27ae60',
        color: '#fff',
        padding: '0 2rem',
        height: '3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    titulo: {
        margin: 0,
        fontSize: '1.2rem',
        fontWeight: 'bold'
    },
    acciones: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    botonNuevo: {
        backgroundColor: '#fff',
        color: '#27ae60',
        border: 'none',
        borderRadius: '6px',
        padding: '0.4rem 1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.9rem'
    },
    linkSalir: {
        color: 'rgba(255,255,255,0.8)',
        textDecoration: 'none',
        fontSize: '0.9rem'
    },
    contenido: {
        maxWidth: '960px',
        margin: '2rem auto',
        padding: '0 1rem'
    },
    seccionTitulo: {
        fontSize: '1.4rem',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '1.5rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1.2rem'
    },
    tarjeta: {
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s'
    },
    tarjetaIcono: {
        width: '2.5rem',
        height: '2.5rem',
        objectFit: 'contain',
        textAlign: 'center'
    },
    iconoEliminar: {
        width: '1.1rem',
        height: '1.1rem',
        objectFit: 'contain'
    },
    tarjetaNombre: {
        margin: 0,
        fontSize: '0.95rem',
        fontWeight: 'bold',
        color: '#2c3e50',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    tarjetaFecha: {
        margin: 0,
        fontSize: '0.78rem',
        color: '#7f8c8d'
    },
    botonesAccion: {
        marginTop: '0.4rem',
        display: 'flex',
        gap: '0.5rem'
    },
    botonAbrir: {
        flex: 1,
        backgroundColor: '#27ae60',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '0.4rem 0',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.85rem'
    },
    botonEliminar: {
        backgroundColor: '#fff',
        color: '#e74c3c',
        border: '1.5px solid #e74c3c',
        borderRadius: '6px',
        padding: '0.4rem 0.7rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.85rem'
    },
    vacio: {
        textAlign: 'center',
        padding: '4rem 0',
        color: '#7f8c8d'
    },
    mensajeCargando: {
        textAlign: 'center',
        padding: '4rem 0',
        color: '#7f8c8d'
    }
};

const formatearFecha = dateStr => new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

const DashboardProyectos = () => {
    const [proyectos, setProyectos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        listarProyectos()
            .then(data => {
                setProyectos(data);
                setCargando(false);
            })
            .catch(err => {
                setError(err.message);
                setCargando(false);
            });
    }, []);

    const abrirProyecto = id => {
        window.location.href = `/entorno?proyectoId=${id}`;
    };

    const nuevoProyecto = () => {
        window.location.href = '/entorno';
    };

    const borrarProyecto = (p) => {
        if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
        eliminarProyecto(p.id, p.storage_path)
            .then(() => setProyectos(prev => prev.filter(x => x.id !== p.id)))
            .catch(err => alert(`Error al eliminar: ${err.message}`));
    };

    return (
        <div style={estilos.pagina}>
            <div style={estilos.header}>
                <h1 style={estilos.titulo}>BLOCKIDS — Mis Proyectos</h1>
                <div style={estilos.acciones}>
                    <button
                        style={estilos.botonNuevo}
                        onClick={nuevoProyecto}
                    >
                        + Nuevo Proyecto
                    </button>
                    <a
                        href="/salir"
                        style={estilos.linkSalir}
                    >
                        Salir
                    </a>
                </div>
            </div>

            <div style={estilos.contenido}>
                <p style={estilos.seccionTitulo}>Tus proyectos guardados</p>

                {cargando && (
                    <p style={estilos.mensajeCargando}>Cargando proyectos...</p>
                )}

                {error && (
                    <p style={{color: 'red', textAlign: 'center'}}>
                        Error al cargar proyectos: {error}
                    </p>
                )}

                {!cargando && !error && proyectos.length === 0 && (
                    <div style={estilos.vacio}>
                        <img src={iconProyectosTarjetas} alt="" style={{ width: '3rem', height: '3rem', objectFit: 'contain' }} />
                        <p>Todavía no tienes proyectos guardados.</p>
                        <button
                            style={{...estilos.botonNuevo, backgroundColor: '#27ae60', color: '#fff', marginTop: '1rem'}}
                            onClick={nuevoProyecto}
                        >
                            Crear mi primer proyecto
                        </button>
                    </div>
                )}

                {!cargando && proyectos.length > 0 && (
                    <div style={estilos.grid}>
                        {proyectos.map(p => (
                            <div
                                key={p.id}
                                style={estilos.tarjeta}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                }}
                            >
                                <img src={iconProyectosTarjetas} alt="" style={estilos.tarjetaIcono} />
                                <h3 style={estilos.tarjetaNombre} title={p.nombre}>
                                    {p.nombre}
                                </h3>
                                <p style={estilos.tarjetaFecha}>
                                    Guardado: {formatearFecha(p.updated_at)}
                                </p>
                                <div style={estilos.botonesAccion}>
                                    <button
                                        style={estilos.botonAbrir}
                                        onClick={() => abrirProyecto(p.id)}
                                    >
                                        Abrir
                                    </button>
                                    <button
                                        style={estilos.botonEliminar}
                                        onClick={e => { e.stopPropagation(); borrarProyecto(p); }}
                                        title="Eliminar proyecto"
                                    >
                                        <img src={iconEliminarProyecto} alt="Eliminar proyecto" style={estilos.iconoEliminar} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardProyectos;
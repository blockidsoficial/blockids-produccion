import React from 'react';
import { Link } from 'react-router-dom';
import styles from './errores.css'; 
import xolotlExplorando from '../../assets/xolotl/xolotl-explorando.svg';

const Error404 = () => (
    <div className={styles['pagina-error404']}>
        <div className={styles['error404-contenido']}>
            
            <img 
                src={xolotlExplorando} 
                alt="Xolotl buscando" 
                className={styles['error404-imagen']} 
            />

            <h1 className={styles['error404-numero']}>404</h1>
            <h2 className={styles['error404-titulo']}>Lo siento, página no encontrada</h2>
            
            <p className={styles['error404-texto']}>
                No se pudo encontrar la página que solicitaste.<br/>
                Revisa la dirección o vuelve al inicio.
            </p>

            <Link to="/" className={styles['error404-boton']}>Regresar al inicio</Link>

        </div>
    </div>
);

export default Error404;
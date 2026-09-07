import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.css';

import logoBlanco from '../../assets/logos/logo-blanco.svg';

const Footer = () => (
    <footer id="contacto" className={styles.footer}>
        <div className={styles.container}>
            <div className={styles.footerGrid}>

                {/* Col 1: Logo + descripción */}
                <div className={styles.footerCol}>
                    <img src={logoBlanco} alt="Blockids" className={styles.footerLogo} />
                    <p className={styles.footerDesc}>
                        Enseñamos a niños a programar jugando con bloques y tecnología interactiva.
                    </p>
                </div>

                {/* Col 2: Navegación */}
                <div className={styles.footerCol}>
                    <h4 className={styles.footerHead}>Navegación</h4>
                    <ul className={styles.footerLinks}>
                        <li><Link to="/">Inicio</Link></li>
                        <li><Link to="/nosotros">Sobre nosotros</Link></li>
                        <li><Link to="/proyectos-publicos">Proyectos</Link></li>
                        <li><Link to="/nosotros#aliados">Aliados</Link></li>

                    </ul>
                </div>

                {/* Col 3: Legal */}
                <div className={styles.footerCol}>

                     <h4 className={styles.footerHead}>Blockids</h4>
                    <div className={styles.footerLinks}>
                         <li><Link to="/registro">Registro</Link></li>
                        <li><Link to="/login">Iniciar sesión</Link></li>
                        <li><Link to="/manuales">Manuales de Uso</Link></li>
                    </div>

                    <h4 className={styles.footerHead}>Legal</h4>
                    <ul className={styles.footerLinks}>
                        <li><Link to="/terminos-y-condiciones">Términos y condiciones</Link></li>
                        <li><Link to="/aviso-de-privacidad">Aviso de privacidad</Link></li>
                    </ul>

                </div>

                {/* Col 4: Contacto */}
                <div className={styles.footerCol}>
                    <h4 className={styles.footerHead}>Contacto</h4>
                    <ul className={styles.footerLinks}>
                        <li><a href="mailto:blockids.oficial@gmail.com">blockids.oficial@gmail.com</a></li>
                        <li>H. Matamoros,Tamaulipas</li>
                        <li><Link to="/nosotros#aliados">Aliados</Link></li>
                    </ul>

                    <h4 className={styles.footerHead}>Síguenos</h4>
                    <div className={styles.socialRow}>
                        {/* <a href="https://www.facebook.com" className={styles.socialBtn} style={{ background: '#1877F2' }}>f</a>
                        <a href="https://www.instagram.com" className={styles.socialBtn} style={{ background: '#E4405F' }}>ig</a> */}
                        <a href="https://www.youtube.com/@blockids-mx" className={styles.socialBtn} style={{ background: '#FF0000' }}>yt</a>
                    </div>
                </div>

            </div>

            <div className={styles.footerBottom}>
                <p>© {new Date().getFullYear()} Blockids. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>
);

export default Footer;

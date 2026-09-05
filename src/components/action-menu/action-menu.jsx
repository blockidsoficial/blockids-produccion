import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import ReactTooltip from 'react-tooltip';

import styles from './action-menu.css';

const CLOSE_DELAY = 300; // milisegundos

class ActionMenu extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'clickDelayer',
            'handleClosePopover',
            'handleToggleOpenState',
            'handleTouchStart',
            'handleTouchOutside',
            'setButtonRef',
            'setContainerRef'
        ]);
        this.state = {
            isOpen: false,
            forceHide: false
        };
        this.mainTooltipId = `tooltip-${Math.random()}`;
    }
    componentDidMount () {
        // El toque en el botón principal se captura para activar la apertura y no hacer clic
        this.buttonRef.addEventListener('touchstart', this.handleTouchStart);
        // El toque en el documento se utiliza para activar el cierre si está fuera
        document.addEventListener('touchstart', this.handleTouchOutside);
    }
    shouldComponentUpdate (newProps, newState) {
        // Esta verificación evita la re-renderización mientras se actualiza el proyecto.
        // TODO: verificar solo el estado y el título porque es suficiente saber
        // si algo sustancial ha cambiado
        // Esto es necesario por la forma descuidada en que se pasan los props como un nuevo objeto,
        // lo que debería refactorizarse.
        return newState.isOpen !== this.state.isOpen ||
            newState.forceHide !== this.state.forceHide ||
            newProps.title !== this.props.title;
    }
    componentWillUnmount () {
        this.buttonRef.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchstart', this.handleTouchOutside);
    }
    handleClosePopover () {
        this.closeTimeoutId = setTimeout(() => {
            this.setState({isOpen: false});
            this.closeTimeoutId = null;
        }, CLOSE_DELAY);
    }
    handleToggleOpenState () {
        // El mouse que vuelve a entrar después de que se inició el tiempo de espera evita que se cierre.
        if (this.closeTimeoutId) {
            clearTimeout(this.closeTimeoutId);
            this.closeTimeoutId = null;
        } else if (!this.state.isOpen) {
            this.setState({
                isOpen: true,
                forceHide: false
            });
        }
    }
    handleTouchOutside (e) {
        if (this.state.isOpen && !this.containerRef.contains(e.target)) {
            this.setState({isOpen: false});
            ReactTooltip.hide();
        }
    }
    clickDelayer (fn) {
        // Devuelve una acción envuelta que gestiona el cierre del menú.
        // TODO: podemos usar react-transition para esto en el futuro
        // por ahora todo este trabajo es para asegurar que el menú se cierre ANTES de que
        // se inicie la acción (posiblemente lenta).
        return event => {
            ReactTooltip.hide();
            if (fn) fn(event);
            // Desenfocar el botón para que no mantenga el enfoque después de hacer clic
            // Esto evita que los eventos del teclado desencadenen el botón
            this.buttonRef.blur();
            this.setState({forceHide: true, isOpen: false}, () => {
                setTimeout(() => this.setState({forceHide: false}));
            });
        };
    }
    handleTouchStart (e) {
        // Evita que este toque se convierta en un clic si el menú está cerrado
        if (!this.state.isOpen) {
            e.preventDefault();
            this.handleToggleOpenState();
        }
    }
    setButtonRef (ref) {
        this.buttonRef = ref;
    }
    setContainerRef (ref) {
        this.containerRef = ref;
    }
    render () {
        const {
            className,
            img: mainImg,
            title: mainTitle,
            moreButtons,
            tooltipPlace,
            onClick
        } = this.props;

        return (
            <div
                className={classNames(styles.menuContainer, className, {
                    [styles.expanded]: this.state.isOpen,
                    [styles.forceHidden]: this.state.forceHide
                })}
                ref={this.setContainerRef}
                onMouseEnter={this.handleToggleOpenState}
                onMouseLeave={this.handleClosePopover}
            >
                <button
                    aria-label={mainTitle}
                    className={classNames(styles.button, styles.mainButton)}
                    data-for={this.mainTooltipId}
                    data-tip={mainTitle}
                    ref={this.setButtonRef}
                    onClick={this.clickDelayer(onClick)}
                >
                    <img
                        className={styles.mainIcon}
                        draggable={false}
                        src={mainImg}
                    />
                </button>
                <ReactTooltip
                    className={styles.tooltip}
                    effect="solid"
                    id={this.mainTooltipId}
                    place={tooltipPlace || 'left'}
                />
                <div className={styles.moreButtonsOuter}>
                    <div className={styles.moreButtons}>
                        {(moreButtons || []).map(({img, title, onClick: handleClick,
                            fileAccept, fileChange, fileInput, fileMultiple}, keyId) => {
                            const isComingSoon = !handleClick;
                            const hasFileInput = fileInput;
                            const tooltipId = `${this.mainTooltipId}-${title}`;
                            return (
                                <div key={`${tooltipId}-${keyId}`}>
                                    <button
                                        aria-label={title}
                                        className={classNames(styles.button, styles.moreButton, {
                                            [styles.comingSoon]: isComingSoon
                                        })}
                                        data-for={tooltipId}
                                        data-tip={title}
                                        onClick={hasFileInput ? handleClick : this.clickDelayer(handleClick)}
                                    >
                                        <img
                                            className={styles.moreIcon}
                                            draggable={false}
                                            src={img}
                                        />
                                        {hasFileInput ? (
                                            <input
                                                accept={fileAccept}
                                                className={styles.fileInput}
                                                multiple={fileMultiple}
                                                ref={fileInput}
                                                type="file"
                                                onChange={fileChange}
                                            />) : null}
                                    </button>
                                    <ReactTooltip
                                        className={classNames(styles.tooltip, {
                                            [styles.comingSoonTooltip]: isComingSoon
                                        })}
                                        effect="solid"
                                        id={tooltipId}
                                        place={tooltipPlace || 'left'}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}

ActionMenu.propTypes = {
    className: PropTypes.string,
    img: PropTypes.string,
    moreButtons: PropTypes.arrayOf(PropTypes.shape({
        img: PropTypes.string,
        title: PropTypes.node.isRequired,
        onClick: PropTypes.func, // Optional, "coming soon" if no callback provided
        fileAccept: PropTypes.string, // Optional, only for file upload
        fileChange: PropTypes.func, // Optional, only for file upload
        fileInput: PropTypes.func, // Optional, only for file upload
        fileMultiple: PropTypes.bool // Optional, only for file upload
    })),
    onClick: PropTypes.func.isRequired,
    title: PropTypes.node.isRequired,
    tooltipPlace: PropTypes.string
};

export default ActionMenu;

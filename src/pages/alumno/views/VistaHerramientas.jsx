import React, { useState, useRef } from 'react';
import styles from './VistaHerramientas.css';

const VistaHerramientas = () => {
    const [herramienta, setHerramienta] = useState(null);
    const [nombreDocumento, setNombreDocumento] = useState('Mi documento');
    const editorRef = useRef(null);

    const ejecutarFormato = (comando, valor = null) => {
        document.execCommand(comando, false, valor);
        editorRef.current?.focus();
    };

    const insertarImagen = () => {
        const url = prompt('Pega la dirección de la imagen:');

        if (url) {
            ejecutarFormato('insertImage', url);
        }
    };

    const descargarDocumento = () => {
        if (!editorRef.current) return;

        const contenido = editorRef.current.innerHTML;

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${nombreDocumento}</title>
<style>
body {
    font-family: Arial, sans-serif;
    max-width: 850px;
    margin: 40px auto;
    padding: 40px;
    line-height: 1.6;
}
img {
    max-width: 100%;
}
</style>
</head>
<body>
${contenido}
</body>
</html>
        `;

        const blob = new Blob([html], {
            type: 'text/html;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `${nombreDocumento || 'documento'}.html`;

        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);

        URL.revokeObjectURL(url);
    };

    if (herramienta === 'documentos') {
        return (
            <div className={styles.editorContainer}>

                <div className={styles.editorHeader}>
                    <div>
                        <button
                            className={styles.backButton}
                            onClick={() => setHerramienta(null)}
                        >
                            ← Herramientas
                        </button>

                        <input
                            className={styles.documentName}
                            value={nombreDocumento}
                            onChange={(e) => setNombreDocumento(e.target.value)}
                        />
                    </div>

                    <button
                        className={styles.downloadButton}
                        onClick={descargarDocumento}
                    >
                        ↓ Descargar
                    </button>
                </div>

                <div className={styles.toolbar}>

                    <select
                        onChange={(e) =>
                            ejecutarFormato('formatBlock', e.target.value)
                        }
                        defaultValue="p"
                    >
                        <option value="p">Texto normal</option>
                        <option value="h1">Título 1</option>
                        <option value="h2">Título 2</option>
                        <option value="h3">Título 3</option>
                    </select>

                    <select
                        onChange={(e) =>
                            ejecutarFormato('fontName', e.target.value)
                        }
                        defaultValue="Arial"
                    >
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                    </select>

                    <button onClick={() => ejecutarFormato('bold')}>
                        <b>B</b>
                    </button>

                    <button onClick={() => ejecutarFormato('italic')}>
                        <i>I</i>
                    </button>

                    <button onClick={() => ejecutarFormato('underline')}>
                        <u>U</u>
                    </button>

                    <button onClick={() => ejecutarFormato('justifyLeft')}>
                        ☰
                    </button>

                    <button onClick={() => ejecutarFormato('justifyCenter')}>
                        ≡
                    </button>

                    <button onClick={() => ejecutarFormato('justifyRight')}>
                        ☷
                    </button>

                    <button onClick={() => ejecutarFormato('insertUnorderedList')}>
                        • Lista
                    </button>

                    <button onClick={() => ejecutarFormato('insertOrderedList')}>
                        1. Lista
                    </button>

                    <button onClick={insertarImagen}>
                        🖼 Imagen
                    </button>

                </div>

                <div className={styles.paperWrapper}>
                    <div
                        ref={editorRef}
                        className={styles.paper}
                        contentEditable
                        suppressContentEditableWarning
                    >
                        <h1>Mi documento</h1>
                        <p>Escribe aquí tu tarea...</p>
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className={styles.toolsContainer}>

            <div className={styles.toolsHeader}>
                <div>
                    <h1>🛠️ Herramientas</h1>
                    <p>
                        Crea tus trabajos directamente dentro de Blockids.
                    </p>
                </div>
            </div>

            <div className={styles.toolsGrid}>

                <button
                    className={`${styles.toolCard} ${styles.documents}`}
                    onClick={() => setHerramienta('documentos')}
                >
                    <div className={styles.toolIcon}>
                        📝
                    </div>

                    <div>
                        <h2>Documentos</h2>
                        <p>
                            Escribe y da formato a tus tareas y trabajos.
                        </p>
                    </div>

                    <span className={styles.openTool}>
                        Abrir →
                    </span>
                </button>

                <button
                    className={`${styles.toolCard} ${styles.spreadsheets}`}
                    disabled
                >
                    <div className={styles.toolIcon}>
                        📊
                    </div>

                    <div>
                        <h2>Hojas de cálculo</h2>
                        <p>
                            Trabaja con tablas, operaciones y datos.
                        </p>
                    </div>

                    <span className={styles.comingSoon}>
                        Próximamente
                    </span>
                </button>

                <button
                    className={`${styles.toolCard} ${styles.presentations}`}
                    disabled
                >
                    <div className={styles.toolIcon}>
                        📽️
                    </div>

                    <div>
                        <h2>Presentaciones</h2>
                        <p>
                            Crea presentaciones para tus proyectos.
                        </p>
                    </div>

                    <span className={styles.comingSoon}>
                        Próximamente
                    </span>
                </button>

                <button
                    className={`${styles.toolCard} ${styles.designs}`}
                    disabled
                >
                    <div className={styles.toolIcon}>
                        🎨
                    </div>

                    <div>
                        <h2>Diseños</h2>
                        <p>
                            Crea carteles, portadas y diseños.
                        </p>
                    </div>

                    <span className={styles.comingSoon}>
                        Próximamente
                    </span>
                </button>

            </div>

            <div className={styles.infoBox}>
                <span>💡</span>
                <div>
                    <strong>Herramientas para tus tareas</strong>
                    <p>
                        Puedes crear tus trabajos directamente en Blockids
                        sin salir de la plataforma.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default VistaHerramientas;
import React, { useState, useRef } from 'react';
import styles from './VistaHerramientas.css';

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ImageRun
} from 'docx';

const VistaHerramientas = () => {
    const [herramienta, setHerramienta] = useState(null);
    const [nombreDocumento, setNombreDocumento] =
        useState('Mi documento');

    const editorRef = useRef(null);
    const imagenInputRef = useRef(null);

    /* =========================================================
       FORMATO DEL EDITOR
    ========================================================= */

    const ejecutarFormato = (comando, valor = null) => {
        editorRef.current?.focus();

        try {
            document.execCommand(comando, false, valor);
        } catch (error) {
            console.error('Error de formato:', error);
        }

        editorRef.current?.focus();
    };

    /* =========================================================
       TAMAÑO DE LETRA
    ========================================================= */

    const cambiarTamano = (tamano) => {
        editorRef.current?.focus();

        document.execCommand(
            'fontSize',
            false,
            tamano
        );

        editorRef.current?.focus();
    };

    /* =========================================================
       COLOR DE TEXTO
    ========================================================= */

    const cambiarColorTexto = (e) => {
        ejecutarFormato(
            'foreColor',
            e.target.value
        );
    };

    /* =========================================================
       COLOR DE RESALTADO
    ========================================================= */

    const cambiarResaltado = (e) => {
        editorRef.current?.focus();

        try {
            document.execCommand(
                'hiliteColor',
                false,
                e.target.value
            );
        } catch (error) {
            document.execCommand(
                'backColor',
                false,
                e.target.value
            );
        }

        editorRef.current?.focus();
    };

    /* =========================================================
       INSERTAR IMAGEN DESDE EL EQUIPO
    ========================================================= */

    const abrirSelectorImagen = () => {
        imagenInputRef.current?.click();
    };

    const insertarImagenDesdeEquipo = (e) => {
        const archivo = e.target.files?.[0];

        if (!archivo) return;

        if (!archivo.type.startsWith('image/')) {
            alert('Selecciona un archivo de imagen válido.');
            return;
        }

        const lector = new FileReader();

        lector.onload = () => {
            editorRef.current?.focus();

            document.execCommand(
                'insertImage',
                false,
                lector.result
            );

            editorRef.current?.focus();
        };

        lector.readAsDataURL(archivo);

        e.target.value = '';
    };

    /* =========================================================
       INSERTAR TABLA
    ========================================================= */

    const insertarTabla = () => {
        const filasTexto = prompt(
            '¿Cuántas filas quieres?',
            '3'
        );

        const columnasTexto = prompt(
            '¿Cuántas columnas quieres?',
            '3'
        );

        const filas = parseInt(filasTexto, 10);
        const columnas = parseInt(columnasTexto, 10);

        if (
            !Number.isInteger(filas) ||
            !Number.isInteger(columnas) ||
            filas < 1 ||
            columnas < 1 ||
            filas > 20 ||
            columnas > 15
        ) {
            alert(
                'La tabla debe tener entre 1 y 20 filas y entre 1 y 15 columnas.'
            );
            return;
        }

        let html = `
            <table
                border="1"
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin:15px 0;
                "
            >
                <tbody>
        `;

        for (let i = 0; i < filas; i++) {
            html += '<tr>';

            for (let j = 0; j < columnas; j++) {
                html += `
                    <td
                        style="
                            border:1px solid #999;
                            padding:8px;
                            min-width:60px;
                        "
                    >
                        Celda
                    </td>
                `;
            }

            html += '</tr>';
        }

        html += `
                </tbody>
            </table>
            <p><br></p>
        `;

        editorRef.current?.focus();

        document.execCommand(
            'insertHTML',
            false,
            html
        );

        editorRef.current?.focus();
    };

    /* =========================================================
       DESHACER / REHACER
    ========================================================= */

    const deshacer = () => {
        ejecutarFormato('undo');
    };

    const rehacer = () => {
        ejecutarFormato('redo');
    };

    /* =========================================================
       LIMPIAR FORMATO
    ========================================================= */

    const limpiarFormato = () => {
        ejecutarFormato('removeFormat');
    };

    /* =========================================================
       LIMPIAR DOCUMENTO
    ========================================================= */

    const limpiarDocumento = () => {
        const confirmar = window.confirm(
            '¿Seguro que quieres borrar todo el contenido del documento?'
        );

        if (!confirmar) return;

        if (editorRef.current) {
            editorRef.current.innerHTML = `
                <h1>Mi documento</h1>
                <p>Escribe aquí tu tarea...</p>
            `;
        }
    };

    /* =========================================================
       OBTENER CONTENIDO HTML
    ========================================================= */

    const obtenerContenido = () => {
        if (!editorRef.current) {
            return '';
        }

        return editorRef.current.innerHTML;
    };

    /* =========================================================
       DESCARGAR HTML
    ========================================================= */

    const descargarHTML = () => {
        const contenido = obtenerContenido();

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
    height: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

td,
th {
    border: 1px solid #999;
    padding: 8px;
}

</style>

</head>

<body>

${contenido}

</body>
</html>
        `;

        const blob = new Blob(
            [html],
            {
                type: 'text/html;charset=utf-8'
            }
        );

        const url = URL.createObjectURL(blob);

        const enlace =
            document.createElement('a');

        enlace.href = url;

        enlace.download =
            `${nombreDocumento || 'documento'}.html`;

        document.body.appendChild(enlace);

        enlace.click();

        document.body.removeChild(enlace);

        URL.revokeObjectURL(url);
    };

    /* =========================================================
       IMAGEN DATA URL
    ========================================================= */

    const obtenerImagenDesdeDataURL = (dataURL) => {
        const partes = dataURL.split(',');

        if (partes.length !== 2) {
            return null;
        }

        const encabezado = partes[0];

        const base64 = partes[1];

        const tipoMatch =
            encabezado.match(/data:(.*?);base64/);

        const tipo =
            tipoMatch
                ? tipoMatch[1]
                : 'image/png';

        const binario =
            atob(base64);

        const bytes =
            new Uint8Array(
                binario.length
            );

        for (
            let i = 0;
            i < binario.length;
            i++
        ) {
            bytes[i] =
                binario.charCodeAt(i);
        }

        return {
            bytes,
            tipo
        };
    };

    /* =========================================================
       CONVERTIR HTML A CONTENIDO DOCX
    ========================================================= */

    const crearElementosDocx = async (nodo) => {
        const elementos = [];

        for (const child of nodo.childNodes) {

            /* -------------------------
               TEXTO
            ------------------------- */

            if (child.nodeType === Node.TEXT_NODE) {

                const texto =
                    child.textContent;

                if (texto.trim() !== '') {

                    elementos.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: texto
                                })
                            ]
                        })
                    );
                }

                continue;
            }

            if (child.nodeType !== Node.ELEMENT_NODE) {
                continue;
            }

            const tag =
                child.tagName.toLowerCase();

            /* -------------------------
               IMAGEN
            ------------------------- */

            if (tag === 'img') {

                const src =
                    child.getAttribute('src');

                if (
                    src &&
                    src.startsWith('data:image/')
                ) {

                    const imagen =
                        obtenerImagenDesdeDataURL(
                            src
                        );

                    if (imagen) {

                        elementos.push(
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: imagen.bytes,
                                        transformation: {
                                            width: 500,
                                            height: 300
                                        },
                                        type:
                                            imagen.tipo
                                                .replace(
                                                    'image/',
                                                    ''
                                                )
                                    })
                                ]
                            })
                        );
                    }
                }

                continue;
            }

            /* -------------------------
               TABLA
            ------------------------- */

            if (tag === 'table') {

                const filas =
                    Array.from(
                        child.querySelectorAll(
                            'tr'
                        )
                    );

                const filasDocx = [];

                for (const fila of filas) {

                    const celdas =
                        Array.from(
                            fila.children
                        );

                    const celdasDocx = [];

                    for (const celda of celdas) {

                        celdasDocx.push(
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text:
                                                    celda.textContent ||
                                                    ''
                                            })
                                        ]
                                    })
                                ]
                            })
                        );
                    }

                    filasDocx.push(
                        new TableRow({
                            children:
                                celdasDocx
                        })
                    );
                }

                if (filasDocx.length > 0) {

                    elementos.push(
                        new Table({
                            width: {
                                size: 100,
                                type:
                                    WidthType.PERCENTAGE
                            },
                            rows:
                                filasDocx
                        })
                    );
                }

                continue;
            }

            /* -------------------------
               ENCABEZADOS
            ------------------------- */

            if (
                tag === 'h1' ||
                tag === 'h2' ||
                tag === 'h3'
            ) {

                let nivel =
                    HeadingLevel.HEADING_1;

                if (tag === 'h2') {
                    nivel =
                        HeadingLevel.HEADING_2;
                }

                if (tag === 'h3') {
                    nivel =
                        HeadingLevel.HEADING_3;
                }

                elementos.push(
                    new Paragraph({
                        heading: nivel,
                        children: [
                            new TextRun({
                                text:
                                    child.textContent
                            })
                        ]
                    })
                );

                continue;
            }

            /* -------------------------
               LISTAS
            ------------------------- */

            if (
                tag === 'ul' ||
                tag === 'ol'
            ) {

                const items =
                    Array.from(
                        child.querySelectorAll(
                            ':scope > li'
                        )
                    );

                for (const item of items) {

                    elementos.push(
                        new Paragraph({
                            text:
                                item.textContent,
                            bullet:
                                tag === 'ul'
                                    ? {
                                          level: 0
                                      }
                                    : undefined,
                            numbering:
                                tag === 'ol'
                                    ? {
                                          reference:
                                              'listaNumerada',
                                          level: 0
                                      }
                                    : undefined
                        })
                    );
                }

                continue;
            }

            /* -------------------------
               PÁRRAFOS
            ------------------------- */

            if (
                tag === 'p' ||
                tag === 'div' ||
                tag === 'section'
            ) {

                const texto =
                    child.textContent || '';

                elementos.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: texto
                            })
                        ]
                    })
                );

                continue;
            }

            /* -------------------------
               OTROS ELEMENTOS
            ------------------------- */

            const texto =
                child.textContent || '';

            if (texto.trim() !== '') {

                elementos.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: texto
                            })
                        ]
                    })
                );
            }
        }

        return elementos;
    };

    /* =========================================================
       EXPORTAR DOCX
    ========================================================= */

    const descargarDOCX = async () => {

        try {

            const contenido =
                obtenerContenido();

            if (!contenido.trim()) {
                alert(
                    'El documento está vacío.'
                );
                return;
            }

            const parser =
                new DOMParser();

            const documentoHTML =
                parser.parseFromString(
                    contenido,
                    'text/html'
                );

            const elementos =
                await crearElementosDocx(
                    documentoHTML.body
                );

            const documento =
                new Document({
                    numbering: {
                        config: [
                            {
                                reference:
                                    'listaNumerada',
                                levels: [
                                    {
                                        level: 0,
                                        format: 'decimal',
                                        text: '%1.',
                                        alignment:
                                            AlignmentType.LEFT
                                    }
                                ]
                            }
                        ]
                    },
                    sections: [
                        {
                            properties: {},
                            children:
                                elementos.length > 0
                                    ? elementos
                                    : [
                                          new Paragraph(
                                              'Documento vacío'
                                          )
                                      ]
                        }
                    ]
                });

            const archivo =
                await Packer.toBlob(
                    documento
                );

            const url =
                URL.createObjectURL(
                    archivo
                );

            const enlace =
                document.createElement('a');

            enlace.href = url;

            enlace.download =
                `${nombreDocumento || 'documento'}.docx`;

            document.body.appendChild(
                enlace
            );

            enlace.click();

            document.body.removeChild(
                enlace
            );

            URL.revokeObjectURL(url);

        } catch (error) {

            console.error(
                'Error al crear DOCX:',
                error
            );

            alert(
                'No se pudo crear el archivo Word.'
            );
        }
    };

    /* =========================================================
       IMPRIMIR
    ========================================================= */

    const imprimirDocumento = () => {

        const contenido =
            obtenerContenido();

        const ventana =
            window.open(
                '',
                '_blank',
                'width=900,height=700'
            );

        if (!ventana) {
            alert(
                'El navegador bloqueó la ventana de impresión.'
            );
            return;
        }

        ventana.document.write(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<title>
${nombreDocumento}
</title>

<style>

body {
    font-family: Arial, sans-serif;
    max-width: 850px;
    margin: 0 auto;
    padding: 40px;
    line-height: 1.6;
}

img {
    max-width: 100%;
    height: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

td,
th {
    border: 1px solid #777;
    padding: 8px;
}

</style>

</head>

<body>

${contenido}

</body>

</html>
        `);

        ventana.document.close();

        ventana.focus();

        ventana.print();

        ventana.close();
    };

    /* =========================================================
       TECLAS DE ACCESO RÁPIDO
    ========================================================= */

    const manejarTeclas = (e) => {

        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === 's'
        ) {

            e.preventDefault();

            descargarHTML();
        }

        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === 'z'
        ) {

            e.preventDefault();

            if (e.shiftKey) {
                rehacer();
            } else {
                deshacer();
            }
        }

        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === 'y'
        ) {

            e.preventDefault();

            rehacer();
        }
    };

    /* =========================================================
       VISTA DEL EDITOR
    ========================================================= */

    if (herramienta === 'documentos') {

        return (
            <div
                className={styles.editorContainer}
                onKeyDown={manejarTeclas}
            >

                {/* =========================================
                    ENCABEZADO
                ========================================= */}

                <div className={styles.editorHeader}>

                    <div
                        className={
                            styles.editorHeaderLeft
                        }
                    >

                        <button
                            className={
                                styles.backButton
                            }
                            onClick={() =>
                                setHerramienta(null)
                            }
                        >
                            ← Herramientas
                        </button>

                        <input
                            className={
                                styles.documentName
                            }
                            value={
                                nombreDocumento
                            }
                            onChange={(e) =>
                                setNombreDocumento(
                                    e.target.value
                                )
                            }
                            placeholder="Nombre del documento"
                        />

                    </div>

                    <div
                        className={
                            styles.headerActions
                        }
                    >

                        <button
                            className={
                                styles.secondaryButton
                            }
                            onClick={
                                imprimirDocumento
                            }
                        >
                            🖨 Imprimir
                        </button>

                        <button
                            className={
                                styles.wordButton
                            }
                            onClick={
                                descargarDOCX
                            }
                        >
                            📄 Word
                        </button>

                        <button
                            className={
                                styles.downloadButton
                            }
                            onClick={
                                descargarHTML
                            }
                        >
                            ↓ HTML
                        </button>

                    </div>

                </div>

                {/* =========================================
                    BARRA DE HERRAMIENTAS
                ========================================= */}

                <div
                    className={
                        styles.toolbar
                    }
                >

                    {/* Deshacer / rehacer */}

                    <div
                        className={
                            styles.toolbarGroup
                        }
                    >

                        <button
                            title="Deshacer"
                            onClick={deshacer}
                        >
                            ↶
                        </button>

                        <button
                            title="Rehacer"
                            onClick={rehacer}
                        >
                            ↷
                        </button>

                    </div>

                    <span
                        className={
                            styles.toolbarSeparator
                        }
                    />

                    {/* Tipo de texto */}

                    <select
                        title="Tipo de texto"
                        defaultValue="p"
                        onChange={(e) =>
                            ejecutarFormato(
                                'formatBlock',
                                e.target.value
                            )
                        }
                    >
                        <option value="p">
                            Texto normal
                        </option>

                        <option value="h1">
                            Título 1
                        </option>

                        <option value="h2">
                            Título 2
                        </option>

                        <option value="h3">
                            Título 3
                        </option>
                    </select>

                    {/* Fuente */}

                    <select
                        title="Fuente"
                        defaultValue="Arial"
                        onChange={(e) =>
                            ejecutarFormato(
                                'fontName',
                                e.target.value
                            )
                        }
                    >

                        <option value="Arial">
                            Arial
                        </option>

                        <option value="Verdana">
                            Verdana
                        </option>

                        <option value="Georgia">
                            Georgia
                        </option>

                        <option value="Courier New">
                            Courier New
                        </option>

                        <option value="Times New Roman">
                            Times New Roman
                        </option>

                    </select>

                    {/* Tamaño */}

                    <select
                        title="Tamaño de letra"
                        defaultValue="3"
                        onChange={(e) =>
                            cambiarTamano(
                                e.target.value
                            )
                        }
                    >

                        <option value="1">
                            10
                        </option>

                        <option value="2">
                            12
                        </option>

                        <option value="3">
                            14
                        </option>

                        <option value="4">
                            16
                        </option>

                        <option value="5">
                            18
                        </option>

                        <option value="6">
                            24
                        </option>

                        <option value="7">
                            32
                        </option>

                    </select>

                    <span
                        className={
                            styles.toolbarSeparator
                        }
                    />

                    {/* Negrita */}

                    <button
                        title="Negrita"
                        onClick={() =>
                            ejecutarFormato(
                                'bold'
                            )
                        }
                    >
                        <b>B</b>
                    </button>

                    {/* Cursiva */}

                    <button
                        title="Cursiva"
                        onClick={() =>
                            ejecutarFormato(
                                'italic'
                            )
                        }
                    >
                        <i>I</i>
                    </button>

                    {/* Subrayado */}

                    <button
                        title="Subrayado"
                        onClick={() =>
                            ejecutarFormato(
                                'underline'
                            )
                        }
                    >
                        <u>U</u>
                    </button>

                    {/* Tachado */}

                    <button
                        title="Tachado"
                        onClick={() =>
                            ejecutarFormato(
                                'strikeThrough'
                            )
                        }
                    >
                        <s>S</s>
                    </button>

                    <span
                        className={
                            styles.toolbarSeparator
                        }
                    />

                    {/* Color */}

                    <label
                        className={
                            styles.colorControl
                        }
                        title="Color del texto"
                    >

                        <span>
                            A
                        </span>

                        <input
                            type="color"
                            defaultValue="#000000"
                            onChange={
                                cambiarColorTexto
                            }
                        />

                    </label>

                    {/* Resaltado */}

                    <label
                        className={
                            styles.colorControl
                        }
                        title="Color de resaltado"
                    >

                        <span>
                            🖍
                        </span>

                        <input
                            type="color"
                            defaultValue="#fff59d"
                            onChange={
                                cambiarResaltado
                            }
                        />

                    </label>

                    <span
                        className={
                            styles.toolbarSeparator
                        }
                    />

                    {/* Alineación */}

                    <button
                        title="Alinear izquierda"
                        onClick={() =>
                            ejecutarFormato(
                                'justifyLeft'
                            )
                        }
                    >
                        ☰
                    </button>

                    <button
                        title="Centrar"
                        onClick={() =>
                            ejecutarFormato(
                                'justifyCenter'
                            )
                        }
                    >
                        ≡
                    </button>

                    <button
                        title="Alinear derecha"
                        onClick={() =>
                            ejecutarFormato(
                                'justifyRight'
                            )
                        }
                    >
                        ☷
                    </button>

                    <button
                        title="Justificar"
                        onClick={() =>
                            ejecutarFormato(
                                'justifyFull'
                            )
                        }
                    >
                        ▤
                    </button>

                    <span
                        className={
                            styles.toolbarSeparator
                        }
                    />

                    {/* Listas */}

                    <button
                        title="Lista"
                        onClick={() =>
                            ejecutarFormato(
                                'insertUnorderedList'
                            )
                        }
                    >
                        • Lista
                    </button>

                    <button
                        title="Lista numerada"
                        onClick={() =>
                            ejecutarFormato(
                                'insertOrderedList'
                            )
                        }
                    >
                        1. Lista
                    </button>

                    <span
                        className={
                            styles.toolbarSeparator
                        }
                    />

                    {/* Tabla */}

                    <button
                        title="Insertar tabla"
                        onClick={insertarTabla}
                    >
                        ▦ Tabla
                    </button>

                    {/* Imagen */}

                    <button
                        title="Insertar imagen"
                        onClick={
                            abrirSelectorImagen
                        }
                    >
                        🖼 Imagen
                    </button>

                    <input
                        ref={
                            imagenInputRef
                        }
                        type="file"
                        accept="image/*"
                        style={{
                            display: 'none'
                        }}
                        onChange={
                            insertarImagenDesdeEquipo
                        }
                    />

                    {/* Quitar formato */}

                    <button
                        title="Quitar formato"
                        onClick={
                            limpiarFormato
                        }
                    >
                        ✨ Limpiar formato
                    </button>

                </div>

                {/* =========================================
                    ÁREA DEL DOCUMENTO
                ========================================= */}

                <div
                    className={
                        styles.paperWrapper
                    }
                >

                    <div
                        ref={editorRef}
                        className={
                            styles.paper
                        }
                        contentEditable
                        suppressContentEditableWarning
                    >

                        <h1>
                            Mi documento
                        </h1>

                        <p>
                            Escribe aquí tu tarea...
                        </p>

                    </div>

                </div>

                {/* =========================================
                    BARRA INFERIOR
                ========================================= */}

                <div
                    className={
                        styles.editorFooter
                    }
                >

                    <span>
                        💡 Los cambios se realizan
                        directamente en Blockids.
                    </span>

                    <button
                        onClick={
                            limpiarDocumento
                        }
                    >
                        🗑 Limpiar documento
                    </button>

                </div>

            </div>
        );
    }

    /* =========================================================
       MENÚ PRINCIPAL DE HERRAMIENTAS
    ========================================================= */

    return (
        <div
            className={
                styles.toolsContainer
            }
        >

            <div
                className={
                    styles.toolsHeader
                }
            >

                <div>

                    <h1>
                        🛠️ Herramientas
                    </h1>

                    <p>
                        Crea tus trabajos
                        directamente dentro
                        de Blockids.
                    </p>

                </div>

            </div>

            <div
                className={
                    styles.toolsGrid
                }
            >

                {/* DOCUMENTOS */}

                <button
                    className={`
                        ${styles.toolCard}
                        ${styles.documents}
                    `}
                    onClick={() =>
                        setHerramienta(
                            'documentos'
                        )
                    }
                >

                    <div
                        className={
                            styles.toolIcon
                        }
                    >
                        📝
                    </div>

                    <div>

                        <h2>
                            Documentos
                        </h2>

                        <p>
                            Escribe y da formato
                            a tus tareas y trabajos.
                        </p>

                    </div>

                    <span
                        className={
                            styles.openTool
                        }
                    >
                        Abrir →
                    </span>

                </button>

                {/* HOJAS */}

                <button
                    className={`
                        ${styles.toolCard}
                        ${styles.spreadsheets}
                    `}
                    disabled
                >

                    <div
                        className={
                            styles.toolIcon
                        }
                    >
                        📊
                    </div>

                    <div>

                        <h2>
                            Hojas de cálculo
                        </h2>

                        <p>
                            Trabaja con tablas,
                            operaciones y datos.
                        </p>

                    </div>

                    <span
                        className={
                            styles.comingSoon
                        }
                    >
                        Próximamente
                    </span>

                </button>

                {/* PRESENTACIONES */}

                <button
                    className={`
                        ${styles.toolCard}
                        ${styles.presentations}
                    `}
                    disabled
                >

                    <div
                        className={
                            styles.toolIcon
                        }
                    >
                        📽️
                    </div>

                    <div>

                        <h2>
                            Presentaciones
                        </h2>

                        <p>
                            Crea presentaciones
                            para tus proyectos.
                        </p>

                    </div>

                    <span
                        className={
                            styles.comingSoon
                        }
                    >
                        Próximamente
                    </span>

                </button>

                {/* DISEÑOS */}

                <button
                    className={`
                        ${styles.toolCard}
                        ${styles.designs}
                    `}
                    disabled
                >

                    <div
                        className={
                            styles.toolIcon
                        }
                    >
                        🎨
                    </div>

                    <div>

                        <h2>
                            Diseños
                        </h2>

                        <p>
                            Crea carteles,
                            portadas y diseños.
                        </p>

                    </div>

                    <span
                        className={
                            styles.comingSoon
                        }
                    >
                        Próximamente
                    </span>

                </button>

            </div>

            <div
                className={
                    styles.infoBox
                }
            >

                <span>
                    💡
                </span>

                <div>

                    <strong>
                        Herramientas para tus tareas
                    </strong>

                    <p>
                        Puedes crear tus trabajos
                        directamente en Blockids
                        sin salir de la plataforma.
                    </p>

                </div>

            </div>

        </div>
    );
};

export default VistaHerramientas;
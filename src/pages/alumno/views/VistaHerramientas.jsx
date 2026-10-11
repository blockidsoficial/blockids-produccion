import React, { useState, useRef, useEffect } from 'react';
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



/* =========================================================
   FUNCIONES DE HOJAS DE CÁLCULO
========================================================= */

const numeroAColumna = (numero) => {
    let resultado = '';
    while (numero > 0) {
        numero--;
        resultado = String.fromCharCode(65 + (numero % 26)) + resultado;
        numero = Math.floor(numero / 26);
    }
    return resultado;
};

const columnaANumero = (columna) => {
    let resultado = 0;
    for (const letra of columna.toUpperCase()) {
        resultado = resultado * 26 + letra.charCodeAt(0) - 64;
    }
    return resultado;
};

const obtenerCoordenadaCelda = (referencia) => {
    const coincidencia = referencia.match(/^([A-Z]+)([1-9]\d*)$/i);
    if (!coincidencia) return null;
    return {
        columna: columnaANumero(coincidencia[1]),
        fila: Number(coincidencia[2])
    };
};

const evaluarOperacionAritmetica = (expresion) => {
    const texto = expresion.replace(/\s/g, '');
    const tokens = texto.match(/\d+(?:\.\d+)?|[()+*/-]/g) || [];
    if (!texto || tokens.join('') !== texto) throw new Error('Fórmula no válida');

    let posicion = 0;
    const factor = () => {
        const token = tokens[posicion++];
        if (token === '+') return factor();
        if (token === '-') return -factor();
        if (token === '(') {
            const valor = suma();
            if (tokens[posicion++] !== ')') throw new Error('Paréntesis no válido');
            return valor;
        }
        const valor = Number(token);
        if (!Number.isFinite(valor)) throw new Error('Número no válido');
        return valor;
    };
    const producto = () => {
        let valor = factor();
        while (tokens[posicion] === '*' || tokens[posicion] === '/') {
            const operador = tokens[posicion++];
            const siguiente = factor();
            if (operador === '/' && siguiente === 0) throw new Error('División entre cero');
            valor = operador === '*' ? valor * siguiente : valor / siguiente;
        }
        return valor;
    };
    const suma = () => {
        let valor = producto();
        while (tokens[posicion] === '+' || tokens[posicion] === '-') {
            const operador = tokens[posicion++];
            const siguiente = producto();
            valor = operador === '+' ? valor + siguiente : valor - siguiente;
        }
        return valor;
    };

    const resultado = suma();
    if (posicion !== tokens.length || !Number.isFinite(resultado)) throw new Error('Resultado no válido');
    return resultado;
};

const VistaHerramientas = () => {
    const [herramienta, setHerramienta] = useState(null);
    const [nombreDocumento, setNombreDocumento] =
        useState('Mi documento');

    const editorRef = useRef(null);
    const imagenInputRef = useRef(null);

    const [hojaCalculo, setHojaCalculo] = useState(() => {
        try {
            const guardado = localStorage.getItem('blockids_hoja_calculo_v1');
            if (guardado) {
                const datos = JSON.parse(guardado);
                return {
                    nombre: datos.nombre || 'Mi hoja de cálculo',
                    celdas: datos.celdas || {},
                    filas: Math.max(12, Number(datos.filas) || 12),
                    columnas: Math.max(8, Number(datos.columnas) || 8),
                    estilos: datos.estilos || {}
                };
            }
        } catch (error) {
            console.warn('No se pudo recuperar la hoja guardada.', error);
        }
        return { nombre: 'Mi hoja de cálculo', celdas: {}, filas: 12, columnas: 8, estilos: {} };
    });
    const [celdaActiva, setCeldaActiva] = useState('A1');
    const [valorFormula, setValorFormula] = useState('');
    const [celdaEnEdicion, setCeldaEnEdicion] = useState(null);

    /* =========================================================
       ESTADO DE PRESENTACIONES
    ========================================================= */
    const [presentacion, setPresentacion] = useState(() => {
        try {
            const guardada = localStorage.getItem('blockids_presentacion_v1');
            if (guardada) {
                const datos = JSON.parse(guardada);
                return {
                    nombre: datos.nombre || 'Mi presentación',
                    tema: datos.tema || 'azul',
                    diapositivas: Array.isArray(datos.diapositivas) && datos.diapositivas.length
                        ? datos.diapositivas
                        : [{ id: 1, titulo: 'Mi primera diapositiva', contenido: 'Escribe aquí las ideas principales de tu presentación.' }]
                };
            }
        } catch (error) {
            console.warn('No se pudo recuperar la presentación guardada.', error);
        }
        return {
            nombre: 'Mi presentación',
            tema: 'azul',
            diapositivas: [{ id: 1, titulo: 'Mi primera diapositiva', contenido: 'Escribe aquí las ideas principales de tu presentación.' }]
        };
    });
    const [diapositivaActiva, setDiapositivaActiva] = useState(0);
    const [modoPresentacion, setModoPresentacion] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem('blockids_presentacion_v1', JSON.stringify(presentacion));
        } catch (error) {
            console.warn('No se pudo guardar la presentación en este navegador.', error);
        }
    }, [presentacion]);

    const actualizarDiapositiva = (campo, valor) => {
        setPresentacion(actual => ({
            ...actual,
            diapositivas: actual.diapositivas.map((diapositiva, indice) =>
                indice === diapositivaActiva
                    ? { ...diapositiva, [campo]: valor }
                    : diapositiva
            )
        }));
    };

    const agregarDiapositiva = () => {
        setPresentacion(actual => {
            const nuevas = [...actual.diapositivas, {
                id: Date.now(),
                titulo: `Diapositiva ${actual.diapositivas.length + 1}`,
                contenido: 'Agrega aquí el contenido de esta diapositiva.'
            }];
            return { ...actual, diapositivas: nuevas };
        });
        setDiapositivaActiva(presentacion.diapositivas.length);
        setModoPresentacion(false);
    };

    const eliminarDiapositiva = () => {
        if (presentacion.diapositivas.length <= 1) {
            alert('La presentación debe tener al menos una diapositiva.');
            return;
        }
        if (!window.confirm('¿Quieres eliminar esta diapositiva?')) return;
        const nuevas = presentacion.diapositivas.filter((_, indice) => indice !== diapositivaActiva);
        setPresentacion(actual => ({ ...actual, diapositivas: nuevas }));
        setDiapositivaActiva(Math.max(0, diapositivaActiva - 1));
    };

    const moverDiapositiva = (direccion) => {
        const destino = diapositivaActiva + direccion;
        if (destino < 0 || destino >= presentacion.diapositivas.length) return;
        setPresentacion(actual => {
            const nuevas = [...actual.diapositivas];
            [nuevas[diapositivaActiva], nuevas[destino]] = [nuevas[destino], nuevas[diapositivaActiva]];
            return { ...actual, diapositivas: nuevas };
        });
        setDiapositivaActiva(destino);
    };

    const descargarPresentacion = () => {
        const escapar = (texto) => String(texto || '').replace(/[&<>"']/g, caracter => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[caracter]));
        const temas = {
            azul: ['#173b73', '#eaf2ff', '#2563eb'],
            morado: ['#43246b', '#f3eaff', '#8b5cf6'],
            verde: ['#14532d', '#e8f8ed', '#16a34a'],
            oscuro: ['#111827', '#1f2937', '#60a5fa']
        };
        const colores = temas[presentacion.tema] || temas.azul;
        const diapositivasHTML = presentacion.diapositivas.map((diapositiva, indice) => `
            <section class="slide">
                <div class="number">${indice + 1} / ${presentacion.diapositivas.length}</div>
                <h1>${escapar(diapositiva.titulo)}</h1>
                <div class="content">${escapar(diapositiva.contenido).replace(/\n/g, '<br>')}</div>
            </section>`).join('');
        const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(presentacion.nombre)}</title><style>
            *{box-sizing:border-box}body{margin:0;background:${colores[1]};font-family:Arial,sans-serif;color:#172033}.toolbar{position:sticky;top:0;padding:12px;text-align:center;background:#fff;box-shadow:0 2px 8px #0001;z-index:2}.toolbar button{padding:10px 16px;border:0;border-radius:8px;background:${colores[2]};color:#fff;font-weight:bold;cursor:pointer}.slide{position:relative;width:min(1100px,94vw);min-height:620px;margin:28px auto;padding:70px 8%;background:white;border-radius:18px;box-shadow:0 10px 30px #0002;page-break-after:always;display:flex;flex-direction:column;justify-content:center;border-top:12px solid ${colores[2]}}h1{font-size:clamp(32px,5vw,58px);color:${colores[0]};margin:0 0 35px;white-space:pre-wrap}.content{font-size:clamp(20px,2.5vw,30px);line-height:1.6;white-space:normal;overflow-wrap:anywhere}.number{position:absolute;right:28px;bottom:20px;color:#64748b;font-size:14px}@media print{body{background:white}.toolbar{display:none}.slide{width:100%;height:100vh;min-height:0;margin:0;border-radius:0;box-shadow:none;break-after:page}}
            </style></head><body><div class="toolbar"><strong>${escapar(presentacion.nombre)}</strong> &nbsp; <button onclick="window.print()">Imprimir / Guardar como PDF</button></div>${diapositivasHTML}</body></html>`;
        const archivo = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `${(presentacion.nombre || 'presentacion').replace(/[\/:*?"<>|]/g, '_')}.html`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
    };

    const renderizarPresentaciones = () => {
        const diapositiva = presentacion.diapositivas[diapositivaActiva] || presentacion.diapositivas[0];

        // Estilos en línea: el tema no depende de clases CSS dinámicas.
        const temasPresentacion = {
            azul: { background: 'linear-gradient(135deg, #ffffff 0%, #eaf2ff 100%)', borderTopColor: '#2563eb', color: '#1e293b' },
            morado: { background: 'linear-gradient(135deg, #ffffff 0%, #f3eaff 100%)', borderTopColor: '#8b5cf6', color: '#312e3e' },
            verde: { background: 'linear-gradient(135deg, #ffffff 0%, #e8f8ed 100%)', borderTopColor: '#16a34a', color: '#173324' },
            oscuro: { background: 'linear-gradient(135deg, #111827 0%, #29364a 100%)', borderTopColor: '#60a5fa', color: '#f8fafc' }
        };
        const estiloTemaActual = temasPresentacion[presentacion.tema] || temasPresentacion.azul;

        return (
            <div className={styles.presentationContainer}>
                {modoPresentacion ? (
                    <div className={styles.presentationStage} style={estiloTemaActual}>
                        <button className={styles.presentationExit} onClick={() => setModoPresentacion(false)}>✕ Salir</button>
                        <div className={styles.presentationSlideNumber}>{diapositivaActiva + 1} / {presentacion.diapositivas.length}</div>
                        <h1>{diapositiva.titulo || 'Sin título'}</h1>
                        <div className={styles.presentationSlideContent}>{diapositiva.contenido}</div>
                        <div className={styles.presentationStageNav}>
                            <button onClick={() => setDiapositivaActiva(i => Math.max(0, i - 1))} disabled={diapositivaActiva === 0}>← Anterior</button>
                            <button onClick={() => setDiapositivaActiva(i => Math.min(presentacion.diapositivas.length - 1, i + 1))} disabled={diapositivaActiva === presentacion.diapositivas.length - 1}>Siguiente →</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <header className={styles.presentationHeader}>
                            <button className={styles.backButton} onClick={() => setHerramienta(null)}>← Herramientas</button>
                            <input className={styles.presentationName} value={presentacion.nombre} onChange={e => setPresentacion(actual => ({ ...actual, nombre: e.target.value }))} aria-label="Nombre de la presentación" />
                            <span className={styles.presentationSaved}>✓ Guardado automático</span>
                        </header>
                        <div className={styles.presentationToolbar}>
                            <label>Tema <select value={presentacion.tema} onChange={e => setPresentacion(actual => ({ ...actual, tema: e.target.value }))}><option value="azul">Azul</option><option value="morado">Morado</option><option value="verde">Verde</option><option value="oscuro">Oscuro</option></select></label>
                            <button onClick={agregarDiapositiva}>＋ Nueva diapositiva</button>
                            <button onClick={() => moverDiapositiva(-1)} disabled={diapositivaActiva === 0}>↑ Subir</button>
                            <button onClick={() => moverDiapositiva(1)} disabled={diapositivaActiva === presentacion.diapositivas.length - 1}>↓ Bajar</button>
                            <button onClick={eliminarDiapositiva}>🗑 Eliminar</button>
                            <button onClick={descargarPresentacion}>⇩ Exportar presentación</button>
                            <button className={styles.presentationPrimary} onClick={() => setModoPresentacion(true)}>▶ Presentar</button>
                        </div>
                        <div className={styles.presentationWorkspace}>
                            <aside className={styles.presentationSidebar}>
                                <h3>Diapositivas ({presentacion.diapositivas.length})</h3>
                                {presentacion.diapositivas.map((item, indice) => (
                                    <button key={item.id} className={`${styles.presentationThumbnail} ${indice === diapositivaActiva ? styles.presentationThumbnailActive : ''}`} onClick={() => setDiapositivaActiva(indice)}>
                                        <span>{indice + 1}</span><strong>{item.titulo || 'Sin título'}</strong><small>{item.contenido || 'Sin contenido'}</small>
                                    </button>
                                ))}
                            </aside>
                            <main className={styles.presentationEditorArea}>
                                <div className={styles.presentationCanvas} style={estiloTemaActual}>
                                    <input className={styles.presentationTitleInput} value={diapositiva.titulo} onChange={e => actualizarDiapositiva('titulo', e.target.value)} placeholder="Título de la diapositiva" aria-label="Título de la diapositiva" />
                                    <textarea className={styles.presentationContentInput} value={diapositiva.contenido} onChange={e => actualizarDiapositiva('contenido', e.target.value)} placeholder="Escribe el contenido aquí. Puedes separar ideas en distintas líneas." aria-label="Contenido de la diapositiva" />
                                    <span className={styles.presentationCanvasNumber}>{diapositivaActiva + 1}</span>
                                </div>
                                <p className={styles.presentationHint}>Consejo: usa una diapositiva por idea principal y frases breves para que tu exposición sea clara.</p>
                            </main>
                        </div>
                    </>
                )}
            </div>
        );
    };

    useEffect(() => {
        try {
            localStorage.setItem('blockids_hoja_calculo_v1', JSON.stringify(hojaCalculo));
        } catch (error) {
            console.warn('No se pudo guardar la hoja en este navegador.', error);
        }
    }, [hojaCalculo]);

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
       LÓGICA DE HOJAS DE CÁLCULO
    ========================================================= */

    const actualizarNombreHoja = (nombre) => {
        setHojaCalculo((anterior) => ({ ...anterior, nombre }));
    };

    const actualizarCelda = (referencia, valor) => {
        setHojaCalculo((anterior) => ({
            ...anterior,
            celdas: { ...anterior.celdas, [referencia]: valor }
        }));
        if (referencia === celdaActiva) setValorFormula(valor);
    };

    const obtenerRango = (inicio, fin) => {
        const a = obtenerCoordenadaCelda(inicio);
        const b = obtenerCoordenadaCelda(fin);
        if (!a || !b) throw new Error('Rango no válido');
        const resultado = [];
        const filaInicio = Math.min(a.fila, b.fila);
        const filaFin = Math.max(a.fila, b.fila);
        const colInicio = Math.min(a.columna, b.columna);
        const colFin = Math.max(a.columna, b.columna);
        if ((filaFin - filaInicio + 1) * (colFin - colInicio + 1) > 5000) {
            throw new Error('Rango demasiado grande');
        }
        for (let fila = filaInicio; fila <= filaFin; fila++) {
            for (let col = colInicio; col <= colFin; col++) {
                resultado.push(`${numeroAColumna(col)}${fila}`);
            }
        }
        return resultado;
    };

    const calcularCelda = (referencia, visitadas = []) => {
        if (visitadas.includes(referencia)) throw new Error('Referencia circular');
        const original = String(hojaCalculo.celdas[referencia] ?? '').trim();
        if (!original) return 0;
        if (!original.startsWith('=')) {
            const numero = Number(original);
            if (original !== '' && Number.isFinite(numero)) return numero;
            throw new Error('La celda no es numérica');
        }

        const nuevasVisitadas = [...visitadas, referencia];
        const formula = original.slice(1).trim();
        const funcion = formula.match(/^(SUMA|PROMEDIO|MAX|MIN)\(\s*([A-Z]+[1-9]\d*)\s*:\s*([A-Z]+[1-9]\d*)\s*\)$/i);

        if (funcion) {
            const nombre = funcion[1].toUpperCase();
            const referencias = obtenerRango(funcion[2].toUpperCase(), funcion[3].toUpperCase());
            const valores = referencias.map((ref) => {
                try { return calcularCelda(ref, nuevasVisitadas); }
                catch { return NaN; }
            }).filter(Number.isFinite);
            if (nombre === 'SUMA') return valores.reduce((total, valor) => total + valor, 0);
            if (!valores.length) throw new Error('No hay valores numéricos');
            if (nombre === 'PROMEDIO') return valores.reduce((total, valor) => total + valor, 0) / valores.length;
            if (nombre === 'MAX') return Math.max(...valores);
            return Math.min(...valores);
        }

        const expresion = formula.replace(/\b([A-Z]+[1-9]\d*)\b/gi, (ref) => {
            const valor = calcularCelda(ref.toUpperCase(), nuevasVisitadas);
            return `(${valor})`;
        });
        return evaluarOperacionAritmetica(expresion);
    };

    const mostrarValorCelda = (referencia) => {
        const original = String(hojaCalculo.celdas[referencia] ?? '');
        if (!original.startsWith('=')) return original;
        try {
            const resultado = calcularCelda(referencia);
            return Number.isInteger(resultado) ? String(resultado) : String(Number(resultado.toFixed(6)));
        } catch {
            return '#ERROR';
        }
    };

    const seleccionarCelda = (referencia) => {
        setCeldaActiva(referencia);
        setValorFormula(String(hojaCalculo.celdas[referencia] ?? ''));
        setCeldaEnEdicion(null);
    };

    const agregarFilaHoja = () => {
        setHojaCalculo((anterior) => ({ ...anterior, filas: anterior.filas + 1 }));
    };

    const agregarColumnaHoja = () => {
        setHojaCalculo((anterior) => ({ ...anterior, columnas: anterior.columnas + 1 }));
    };

    const cambiarEstiloCelda = (propiedad, valor) => {
        setHojaCalculo((anterior) => ({
            ...anterior,
            estilos: {
                ...anterior.estilos,
                [celdaActiva]: { ...(anterior.estilos[celdaActiva] || {}), [propiedad]: valor }
            }
        }));
    };

    const limpiarHojaCalculo = () => {
        if (!window.confirm('¿Seguro que quieres borrar todos los datos de esta hoja?')) return;
        setHojaCalculo((anterior) => ({ ...anterior, celdas: {}, estilos: {} }));
        setCeldaActiva('A1');
        setValorFormula('');
        setCeldaEnEdicion(null);
    };

    const descargarCSV = () => {
        const filasCSV = [];
        for (let fila = 1; fila <= hojaCalculo.filas; fila++) {
            const valores = [];
            for (let columna = 1; columna <= hojaCalculo.columnas; columna++) {
                const referencia = `${numeroAColumna(columna)}${fila}`;
                const valor = mostrarValorCelda(referencia);
                valores.push(`"${String(valor).replace(/"/g, '""')}"`);
            }
            filasCSV.push(valores.join(';'));
        }
        const contenido = '\uFEFF' + filasCSV.join('\r\n');
        const archivo = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `${(hojaCalculo.nombre || 'hoja-de-calculo').replace(/[\\\\/:*?"<>|]/g, '_')}.csv`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
    };

    const copiarCeldaHoja = async () => {
        try {
            await navigator.clipboard.writeText(String(hojaCalculo.celdas[celdaActiva] ?? ''));
        } catch {
            window.alert('No se pudo acceder al portapapeles. Puedes copiar el contenido desde la barra de fórmulas.');
        }
    };

    const pegarCeldaHoja = async () => {
        try {
            const texto = await navigator.clipboard.readText();
            actualizarCelda(celdaActiva, texto);
            setValorFormula(texto);
        } catch {
            window.alert('El navegador no permitió pegar automáticamente. Usa la barra de fórmulas.');
        }
    };

    const renderizarHojaCalculo = () => (
        <div className={styles.sheetContainer}>
            <header className={styles.sheetHeader}>
                <div className={styles.sheetHeaderTop}>
                    <button className={styles.backButton} onClick={() => setHerramienta(null)}>
                        ← Herramientas
                    </button>
                    <input
                        className={styles.sheetName}
                        value={hojaCalculo.nombre}
                        onChange={(e) => actualizarNombreHoja(e.target.value)}
                        aria-label="Nombre de la hoja"
                    />
                </div>
                <div className={styles.sheetActions}>
                    <button onClick={agregarFilaHoja}>＋ Fila</button>
                    <button onClick={agregarColumnaHoja}>＋ Columna</button>
                    <button onClick={copiarCeldaHoja}>Copiar celda</button>
                    <button onClick={pegarCeldaHoja}>Pegar celda</button>
                    <button className={styles.exportButton} onClick={descargarCSV}>↓ Descargar CSV</button>
                </div>
            </header>

            <div className={styles.formulaBar}>
                <strong className={styles.cellReference}>{celdaActiva}</strong>
                <span className={styles.fxLabel}>fx</span>
                <input
                    value={valorFormula}
                    onChange={(e) => {
                        setValorFormula(e.target.value);
                        actualizarCelda(celdaActiva, e.target.value);
                    }}
                    placeholder="Escribe un valor o fórmula, por ejemplo =SUMA(A1:A5)"
                    aria-label="Valor o fórmula de la celda seleccionada"
                />
            </div>

            <div className={styles.formatBar}>
                <label title="Color de fondo">
                    Fondo
                    <input
                        type="color"
                        value={(hojaCalculo.estilos[celdaActiva] || {}).fondo || '#ffffff'}
                        onChange={(e) => cambiarEstiloCelda('fondo', e.target.value)}
                    />
                </label>
                <button
                    className={(hojaCalculo.estilos[celdaActiva] || {}).negrita ? styles.activeFormat : ''}
                    onClick={() => cambiarEstiloCelda('negrita', !(hojaCalculo.estilos[celdaActiva] || {}).negrita)}
                    title="Negrita"
                ><strong>B</strong></button>
                <label>
                    Alinear
                    <select
                        value={(hojaCalculo.estilos[celdaActiva] || {}).alineacion || 'left'}
                        onChange={(e) => cambiarEstiloCelda('alineacion', e.target.value)}
                    >
                        <option value="left">Izquierda</option>
                        <option value="center">Centro</option>
                        <option value="right">Derecha</option>
                    </select>
                </label>
                <button className={styles.clearButton} onClick={limpiarHojaCalculo}>🗑 Limpiar hoja</button>
            </div>

            <div className={styles.gridWrapper}>
                <table className={styles.spreadsheet}>
                    <thead><tr>
                        <th className={styles.cornerCell}>#</th>
                        {Array.from({ length: hojaCalculo.columnas }, (_, indice) => (
                            <th key={indice}>{numeroAColumna(indice + 1)}</th>
                        ))}
                    </tr></thead>
                    <tbody>
                        {Array.from({ length: hojaCalculo.filas }, (_, indiceFila) => {
                            const fila = indiceFila + 1;
                            return <tr key={fila}>
                                <th className={styles.rowNumber}>{fila}</th>
                                {Array.from({ length: hojaCalculo.columnas }, (_, indiceColumna) => {
                                    const referencia = `${numeroAColumna(indiceColumna + 1)}${fila}`;
                                    const estilo = hojaCalculo.estilos[referencia] || {};
                                    const seleccionada = celdaActiva === referencia;
                                    const editando = celdaEnEdicion === referencia;
                                    return <td key={referencia} className={seleccionada ? styles.selectedCell : ''}>
                                        <input
                                            aria-label={`Celda ${referencia}`}
                                            value={editando ? String(hojaCalculo.celdas[referencia] ?? '') : mostrarValorCelda(referencia)}
                                            onFocus={(e) => {
                                                seleccionarCelda(referencia);
                                                setCeldaEnEdicion(referencia);
                                                e.target.select();
                                            }}
                                            onChange={(e) => actualizarCelda(referencia, e.target.value)}
                                            onBlur={() => setCeldaEnEdicion(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setCeldaEnEdicion(null);
                                                    const siguiente = `${numeroAColumna(indiceColumna + 1)}${Math.min(fila + 1, hojaCalculo.filas)}`;
                                                    const elemento = e.currentTarget.closest('table')?.querySelector(`[aria-label="Celda ${siguiente}"]`);
                                                    elemento?.focus();
                                                }
                                                if (e.key === 'Escape') {
                                                    setCeldaEnEdicion(null);
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            style={{
                                                backgroundColor: estilo.fondo || '#fff',
                                                fontWeight: estilo.negrita ? 'bold' : 'normal',
                                                textAlign: estilo.alineacion || 'left'
                                            }}
                                        />
                                    </td>;
                                })}
                            </tr>;
                        })}
                    </tbody>
                </table>
            </div>

            <footer className={styles.sheetFooter}>
                <span>📊 Hoja de cálculo de Blockids</span>
                <span>{hojaCalculo.filas} filas × {hojaCalculo.columnas} columnas</span>
                <span>Guardado automático en este navegador</span>
            </footer>
            <div className={styles.helpBox}>
                <strong>💡 Ejemplos de fórmulas</strong>
                <p><code>=A1+B1</code> Suma dos celdas.</p>
                <p><code>=A1*B1</code> Multiplica dos celdas.</p>
                <p><code>=SUMA(A1:A5)</code> Suma un rango de celdas.</p>
                <p><code>=PROMEDIO(A1:A5)</code> Calcula el promedio.</p>
                <p><code>=MAX(A1:A5)</code> y <code>=MIN(A1:A5)</code> encuentran el mayor y el menor valor.</p>
            </div>
        </div>
    );

    /* =========================================================
       VISTA DEL EDITOR
    ========================================================= */

    if (herramienta === 'hojas') {
        return renderizarHojaCalculo();
    }

    if (herramienta === 'presentaciones') {
        return renderizarPresentaciones();
    }

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
                    onClick={() => setHerramienta('hojas')}
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
                            styles.openTool
                        }
                    >
                        Abrir →
                    </span>

                </button>

                {/* PRESENTACIONES */}

                <button
                    className={`
                        ${styles.toolCard}
                        ${styles.presentations}
                    `}
                    onClick={() => setHerramienta('presentaciones')}
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
                            styles.openTool
                        }
                    >
                        Abrir →
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
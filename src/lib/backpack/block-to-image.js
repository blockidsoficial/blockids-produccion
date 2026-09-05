import computedStyleToInlineStyle from 'computed-style-to-inline-style';
import ScratchBlocks from 'scratch-blocks';

/**
 * Given a blockId, return a data-uri image that can be used to create a thumbnail.
 * @param {string} blockId the ID of the block to imagify
 * @return {Promise} resolves to a data-url of a picture of the blocks
 */
export default function (blockId) {
    // No estoy seguro de ninguna mejor manera para acceder al espacio de trabajo de scratch-blocks que esto...
    const block = ScratchBlocks.getMainWorkspace().getBlockById(blockId);
    const blockSvg = block.getSvgRoot().cloneNode(true /* deep */);

    // Una vez que tenemos el SVG clonado, haz el resto en un setTimeout para evitar
    // bloquear el final del arrastre desde terminar prontamente.
    return new Promise(resolve => {
        setTimeout(() => {
            // Quita entidades &nbsp; que no se pueden incrustar
            blockSvg.innerHTML = blockSvg.innerHTML.replace(/&nbsp;/g, ' ');

            // Crea un elemento <svg> para colocar el blockSvg clonado dentro
            const NS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(NS, 'svg');
            svg.appendChild(blockSvg);

            // Necesita estar en el DOM para obtener propiedades CSS y dimensionamiento correcto
            document.body.appendChild(svg);

            const padding = 10;
            const extraHatPadding = 16;
            const topPadding = padding + (blockSvg.getAttribute('data-shapes') === 'hat' ? extraHatPadding : 0);
            const leftPadding = padding;
            blockSvg.setAttribute('transform', `translate(${leftPadding} ${topPadding})`);

            const bounds = blockSvg.getBoundingClientRect();
            svg.setAttribute('width', bounds.width + (2 * padding));
            svg.setAttribute('height', bounds.height + (2 * padding));

            // Necesitamos incrustar los estilos configurados por las reglas de CSS porque
            // no todos los estilos se establecen directamente en el SVG. Esto hace que la
            // imagen se estile de la misma manera que el bloque realmente aparece.
            // TODO esto no maneja imágenes que son xlink:href en el SVG
            computedStyleToInlineStyle(svg, {
                recursive: true,
                // Enumera las propiedades específicas que necesitamos incrustar.
                // Específicamente propiedades que se establecen desde CSS en scratch-blocks
                properties: ['fill', 'font-family', 'font-size', 'font-weight']
            });

            const svgString = (new XMLSerializer()).serializeToString(svg);

            // Una vez que tenemos el svg como una cadena, quítalo del DOM
            svg.parentNode.removeChild(svg);

            resolve(`data:image/svg+xml;utf-8,${encodeURIComponent(svgString)}`);
        }, 10);
    });
}

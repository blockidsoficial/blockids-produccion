var ExampleExtension = function () {
};

/**
 * @return {object} This extension's metadata.
 */
ExampleExtension.prototype.getInfo = function () {
    return {
        // Requerido: el nombre legible por máquina de esta extensión.
        // Se usará como el espacio de nombres de la extensión. No debe contener un carácter '.'.
        id: 'someBlocks',

        // Opcional: el nombre legible por humanos de esta extensión como cadena.
        // Esta y cualquier otra cadena que se muestre en la interfaz de usuario de Scratch puede ser
        // una cadena o una llamada a `intlDefineMessage`; una cadena simple no será
        // traducida, mientras que una llamada a `intlDefineMessage` conectará la cadena
        // al mapa de traducción (ver abajo). La llamada `intlDefineMessage` es
        // similar a `defineMessages` de `react-intl` en forma, pero realmente
        // llamará a un código de soporte de extensión para hacer su magia. Por ejemplo, haremos
        // espacio de nombres interno de los mensajes de modo que dos extensiones podrían tener
        // mensajes con el mismo ID sin chocar.
        // Ver también: https://github.com/yahoo/react-intl/wiki/API#definemessages
        name: 'Some Blocks',

        // Opcional: URI para un ícono de esta extensión. URI de datos OK.
        // Si no está presente, use un ícono genérico.
        // TODO: ¿qué tipos de archivo están permitidos? ¿Todas las imágenes web? ¿Solo PNG?
        iconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DE' +
            'UIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

        // Opcional: Vínculo a contenido de documentación para esta extensión.
        // Si no está presente, no ofrezca ningún vínculo.
        docsURI: 'https://....',

        // Requerido: la lista de bloques implementados por esta extensión,
        // in the order intended for display.
        blocks: [
            {
                opcode: 'example-noop',
                blockType: Scratch.BlockType.COMMAND,
                blockAllThreads: false,
                text: 'do nothing',
                func: 'noop'
            },
            {
                opcode: 'example-conditional',
                blockType: Scratch.BlockType.CONDITIONAL,
                branchCount: 4,
                isTerminal: true,
                blockAllThreads: false,
                text: 'choose [BRANCH]',
                arguments: {
                    BRANCH: {
                        type: Scratch.ArgumentType.NUMBER,
                        defaultValue: 1
                    }
                },
                func: 'noop'
            },
            {
                // Requerido: el nombre legible por máquina de esta operación.
                // Esto aparecerá en el JSON del proyecto. No debe contener un carácter '.'.
                opcode: 'myReporter', // becomes 'someBlocks.myReporter'

                // Requerido: el tipo de bloque que definimos, de una lista predefinida:
                // 'command' - un bloque de comando normal, como "mover {} pasos"
                // 'reporter' - devuelve un valor, como "dirección"
                // 'Boolean' - igual que 'reporter' pero devuelve un valor booleano
                // 'hat' - inicia una pila si su valor es verdadero
                // 'conditional' - flujo de control, como "si {}" o "repetir {}"
                // Un bloque 'conditional' puede devolver el índice basado en uno de una rama
                // para ejecutar, o puede devolver cero/falso para no ejecutar ninguna rama. Cada vez que
                // la rama secundaria termina, el bloque se llama nuevamente. Esto es solo
                // un ligero cambio al modelo actual para bloques de flujo de control, y es
                // también compatible con devolver verdadero/falso para un bloque "if" o "repeat".
                // TODO: Considere atributos like Blockly nextStatement, previousStatement, y
                // salida como alternativa. Esos son más flexibles, pero
                // permiten malas combinaciones.
                blockType: Scratch.BlockType.REPORTER,

                // Requerido para bloques condicionales, ignorado para otros: el número de
                // ramas secundarias que controla este bloque. Un bloque "if" o "repeat" especificaría
                // un recuento de ramas de 1; un bloque "if-else" especificaría
                // un recuento de ramas de 2.
                // TODO: ¿deberemos soportar recuento de ramas dinámico para "switch"-likes?
                branchCount: 0,

                // Opcional, por defecto falso: si este bloque termina una pila o no.
                // Los bloques "forever" y "stop all" especificarían verdadero aquí.
                isTerminal: true,

                // Opcional, por defecto falso: si se debe bloquear todos los subprocesos mientras
                // este bloque está ocupado. Esto es para cosas como el bloque "tocando color"
                // en modo de compatibilidad, y solo se necesita si la VM se ejecuta en
                // un worker. Es posible que incluso consideremos omitirlo de la documentación de extensiones...
                blockAllThreads: false,

                // Requerido: el texto legible por humanos en este bloque, incluidos los argumentos
                // marcadores de posición. Los marcadores de posición de argumentos deben estar en [MACRO_CASE] y
                // deben estar [ENCLOSED_WITHIN_SQUARE_BRACKETS].
                text: 'letter [LETTER_NUM] of [TEXT]',

                // Requerido: describir cada argumento.
                // Ten en cuenta que esto es una matriz: el orden de los argumentos se usará
                arguments: {
                    // Requerido: la ID del argumento, que será el nombre en el
                    // objeto args pasado a la función de implementación.
                    LETTER_NUM: {
                        // Required: type of the argument / shape of the block input
                        type: Scratch.ArgumentType.NUMBER,

                        // Optional: the default value of the argument
                        defaultValue: 1
                    },

                    // Required: the ID of the argument, which will be the name in the
                    // args object passed to the implementation function.
                    TEXT: {
                        // Requerido: tipo del argumento / forma de la entrada del bloque
                        type: Scratch.ArgumentType.STRING,

                        // Opcional: el valor predeterminado del argumento
                        defaultValue: 'text'
                    }
                },

                // Opcional: una cadena que nombre la función que implementa este bloque.
                // Si se omite, use la cadena de código de operación.
                func: 'myReporter',

                // Opcional: lista de tipos de destino para los que debe aparecer este bloque.
                // Si está ausente, suponga que se aplica a todos los objetivos integrados -- es decir:
                // ['sprite', 'stage']
                filter: ['someBlocks.wedo2', 'sprite', 'stage']
            },
            {
                opcode: 'example-Boolean',
                blockType: Scratch.BlockType.BOOLEAN,
                text: 'return true',
                func: 'returnTrue'
            },
            {
                opcode: 'example-hat',
                blockType: Scratch.BlockType.HAT,
                text: 'after forever',
                func: 'returnFalse'
            },
            {
                // Another block...
            }
        ],

        // Opcional: define menús específicos de la extensión aquí.
        menus: {
            // Requerido: un identificador para este menú, único dentro de esta extensión.
            menuA: [
                // Menú estático: elementos de lista que deben aparecer en el menú.
                {
                    // Requerido: el valor del elemento del menú cuando se elige.
                    value: 'itemId1',

                    // Opcional: la etiqueta legible por humanos para este elemento.
                    // Use `value` como el texto si esté ausente.
                    text: 'Item One'
                },

                // La forma más simple de un elemento de lista es una cadena que se usará como
                // both value and text.
                'itemId2'
            ],

            // Menú dinámico: una cadena que nombra una función que devuelve una matriz como la anterior.
            // Llamado cada vez que se abre el menú.
            menuB: 'getItemsForMenuB'
        },

        // Opcional: traducciones
        translation_map: {
            de: {
                'extensionName': 'Einige Blöcke',
                'myReporter': 'Buchstabe [LETTER_NUM] von [TEXT]',
                'myReporter.TEXT_default': 'Text',
                'menuA_item1': 'Artikel eins',

                // Los menús dinámicos también pueden traducirse
                'menuB_example': 'Beispiel',

                // Este mensaje contiene marcadores de posición ICU (ver `myReporter()` a continuación)
                'myReporter.result': 'Buchstabe {LETTER_NUM} von {TEXT} ist {LETTER}.'
            },
            it: {
                // ...
            }
        },

        // Opcional: enumera nuevos tipos de destino proporcionados por esta extensión.
        targetTypes: [
            'wedo2', // automatically transformed to 'someBlocks.wedo2'
            'speech' // automatically transformed to 'someBlocks.speech'
        ]
    };
};

/**
 * Implement myReporter.
 * @param {object} args - the block's arguments.
 * @property {number} LETTER_NUM - the string value of the argument.
 * @property {string} TEXT - the string value of the argument.
 * @returns {string} a string which includes the block argument value.
 */
ExampleExtension.prototype.myReporter = function (args) {
    // Nota: esta implementación no es limpia en Unicode; simplemente está aquí como ejemplo.
    const result = args.TEXT.charAt(args.LETTER_NUM);

    return ['Letter ', args.LETTER_NUM, ' of ', args.TEXT, ' is ', result, '.'].join('');
};

ExampleExtension.prototype.noop = function () {
};

ExampleExtension.prototype.returnTrue = function () {
    return true;
};

ExampleExtension.prototype.returnFalse = function () {
    return false;
};

Scratch.extensions.register(new ExampleExtension());

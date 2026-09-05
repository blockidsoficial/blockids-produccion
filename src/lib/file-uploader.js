import {BitmapAdapter, sanitizeSvg} from 'scratch-svg-renderer';
import randomizeSpritePosition from './randomize-sprite-position.js';
import bmpConverter from './bmp-converter';
import gifDecoder from './gif-decoder';

/**
 * Extract the file name given a string of the form fileName + ext
 * @param {string} nameExt File name + extension (e.g. 'my_image.png')
 * @return {string} The name without the extension, or the full name if
 * there was no '.' in the string (e.g. 'my_image')
 */
const extractFileName = function (nameExt) {
    // There could be multiple dots, but get the stuff before the first .
    const nameParts = nameExt.split('.', 1); // we only care about the first .
    return nameParts[0];
};

/**
 * Handle a file upload given the input element that contains the file,
 * and a function to handle loading the file.
 * @param {Input} fileInput The <input/> element that contains the file being loaded
 * @param {Function} onload The function that handles loading the file
 * @param {Function} onerror The function that handles any error loading the file
 */
const handleFileUpload = function (fileInput, onload, onerror) {
    const readFile = (i, files) => {
        if (i === files.length) {
            // Reinicia el valor de entrada de archivo ahora que tenemos todo lo que necesitamos
            // para que el usuario pueda cargar el mismo sonido varias veces si
            // lo desean
            fileInput.value = null;
            return;
        }
        const file = files[i];
        const reader = new FileReader();
        reader.onload = () => {
            const fileType = file.type;
            const fileName = extractFileName(file.name);
            onload(reader.result, fileType, fileName, i, files.length);
            readFile(i + 1, files);
        };
        reader.onerror = onerror;
        reader.readAsArrayBuffer(file);
    };
    readFile(0, fileInput.files);
};

/**
 * @typedef VMAsset
 * @property {string} name The user-readable name of this asset - This will
 * automatically get translated to a fresh name if this one already exists in the
 * scope of this vm asset (e.g. if a sound already exists with the same name for
 * the same target)
 * @property {string} dataFormat The data format of this asset, typically
 * the extension to be used for that particular asset, e.g. 'svg' for vector images
 * @property {string} md5 The md5 hash of the asset data, followed by '.'' and dataFormat
 * @property {string} The md5 hash of the asset data // TODO remove duplication....
 */

/**
 * Create an asset (costume, sound) with storage and return an object representation
 * of the asset to track in the VM.
 * @param {ScratchStorage} storage The storage to cache the asset in
 * @param {AssetType} assetType A ScratchStorage AssetType indicating what kind of
 * asset this is.
 * @param {string} dataFormat The format of this data (typically the file extension)
 * @param {UInt8Array} data The asset data buffer
 * @return {VMAsset} An object representing this asset and relevant information
 * which can be used to look up the data in storage
 */
const createVMAsset = function (storage, assetType, dataFormat, data) {
    const asset = storage.createAsset(
        assetType,
        dataFormat,
        data,
        null,
        true // generate md5
    );

    return {
        name: null, // Needs to be set by caller
        dataFormat: dataFormat,
        asset: asset,
        md5: `${asset.assetId}.${dataFormat}`,
        assetId: asset.assetId
    };
};

/**
 * Handles loading a costume or a backdrop using the provided, context-relevant information.
 * @param {ArrayBuffer | string} fileData The costume data to load (this can be a base64 string
 * iff the image is a bitmap)
 * @param {string} fileType The MIME type of this file
 * @param {ScratchStorage} storage The ScratchStorage instance to cache the costume data
 * @param {Function} handleCostume The function to execute on the costume object returned after
 * caching this costume in storage - This function should be responsible for
 * adding the costume to the VM and handling other UI flow that should come after adding the costume
 * @param {Function} handleError The function to execute if there is an error parsing the costume
 */
const costumeUpload = function (fileData, fileType, storage, handleCostume, handleError = () => {}) {
    let costumeFormat = null;
    let assetType = null;
    switch (fileType) {
    case 'image/svg+xml': {
        // ejecuta bytes svg a través del código de sanitización del representante de scratch-svg
        fileData = sanitizeSvg.sanitizeByteStream(fileData);

        costumeFormat = storage.DataFormat.SVG;
        assetType = storage.AssetType.ImageVector;
        break;
    }
    case 'image/jpeg': {
        costumeFormat = storage.DataFormat.JPG;
        assetType = storage.AssetType.ImageBitmap;
        break;
    }
    case 'image/bmp': {
        // Convert .bmp files to .png to compress them. .bmps are completely uncompressed,
        // and would otherwise take up a lot of storage space and take much longer to upload and download.
        bmpConverter(fileData).then(dataUrl => {
            costumeUpload(dataUrl, 'image/png', storage, handleCostume);
        });
        return; // Return early because we're triggering another proper costumeUpload
    }
    case 'image/png': {
        costumeFormat = storage.DataFormat.PNG;
        assetType = storage.AssetType.ImageBitmap;
        break;
    }
    case 'image/gif': {
        let costumes = [];
        gifDecoder(fileData, (frameNumber, dataUrl, numFrames) => {
            costumeUpload(dataUrl, 'image/png', storage, costumes_ => {
                costumes = costumes.concat(costumes_);
                if (frameNumber === numFrames - 1) {
                    handleCostume(costumes);
                }
            }, handleError);
        });
        return; // Abandon this load, do not try to load gif itself
    }
    default:
        handleError(`Encountered unexpected file type: ${fileType}`);
        return;
    }

    const bitmapAdapter = new BitmapAdapter();
    const addCostumeFromBuffer = function (dataBuffer) {
        const vmCostume = createVMAsset(
            storage,
            assetType,
            costumeFormat,
            dataBuffer
        );
        handleCostume([vmCostume]);
    };

    if (costumeFormat === storage.DataFormat.SVG) {
        // Must pass in file data as a Uint8Array,
        // pasar una matriz de búferes hace que el sprite/disfraz
        // las miniaturas no se muestren porque el URI de datos para el disfraz
        // no es válido
        addCostumeFromBuffer(new Uint8Array(fileData));
    } else {
        // de lo contrario es un mapa de bits
        bitmapAdapter.importBitmap(fileData, fileType).then(addCostumeFromBuffer)
            .catch(handleError);
    }
};

/**
 * Handles loading a sound using the provided, context-relevant information.
 * @param {ArrayBuffer} fileData The sound data to load
 * @param {string} fileType The MIME type of this file; This function will exit
 * early if the fileType is unexpected.
 * @param {ScratchStorage} storage The ScratchStorage instance to cache the sound data
 * @param {Function} handleSound The function to execute on the sound object of type VMAsset
 * This function should be responsible for adding the sound to the VM
 * as well as handling other UI flow that should come after adding the sound
 * @param {Function} handleError The function to execute if there is an error parsing the sound
 */
const soundUpload = function (fileData, fileType, storage, handleSound, handleError) {
    let soundFormat;
    switch (fileType) {
    case 'audio/mp3':
    case 'audio/mpeg': {
        soundFormat = storage.DataFormat.MP3;
        break;
    }
    case 'audio/wav':
    case 'audio/wave':
    case 'audio/x-wav':
    case 'audio/x-pn-wav': {
        soundFormat = storage.DataFormat.WAV;
        break;
    }
    default:
        handleError(`Encountered unexpected file type: ${fileType}`);
        return;
    }

    const vmSound = createVMAsset(
        storage,
        storage.AssetType.Sound,
        soundFormat,
        new Uint8Array(fileData));

    handleSound(vmSound);
};

const spriteUpload = function (fileData, fileType, spriteName, storage, handleSprite, handleError = () => {}) {
    switch (fileType) {
    case '':
    case 'application/zip': { // We think this is a .sprite2 or .sprite3 file
        handleSprite(new Uint8Array(fileData));
        return;
    }
    case 'image/svg+xml':
    case 'image/png':
    case 'image/bmp':
    case 'image/jpeg':
    case 'image/gif': {
        // Haz un sprite a partir de una imagen convirtiendola en un disfraz primero
        costumeUpload(fileData, fileType, storage, vmCostumes => {
            vmCostumes.forEach((costume, i) => {
                costume.name = `${spriteName}${i ? i + 1 : ''}`;
            });
            const newSprite = {
                name: spriteName,
                isStage: false,
                x: 0, // x/y will be randomized below
                y: 0,
                visible: true,
                size: 100,
                rotationStyle: 'all around',
                direction: 90,
                draggable: false,
                currentCostume: 0,
                blocks: {},
                variables: {},
                costumes: vmCostumes,
                sounds: [] // TODO are all of these necessary?
            };
            randomizeSpritePosition(newSprite);
            // TODO probablemente solo quieres que la carga de sprite maneje este objeto directamente
            handleSprite(JSON.stringify(newSprite));
        }, handleError);
        return;
    }
    default: {
        handleError(`Encountered unexpected file type: ${fileType}`);
        return;
    }
    }
};

export {
    handleFileUpload,
    costumeUpload,
    soundUpload,
    spriteUpload
};

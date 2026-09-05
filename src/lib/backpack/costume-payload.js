import jpegThumbnail from './jpeg-thumbnail';
import getCostumeUrl from '../get-costume-url';

const costumePayload = costume => {
    // TODO ¿está bien codificar SVGs en base64? ¿Qué pasa con el texto unicode dentro de ellos?
    const assetDataUrl = costume.asset.encodeDataURI();
    const assetDataFormat = costume.dataFormat;
    const payload = {
        type: 'costume',
        name: costume.name,
        // Parámetros a rellenar a continuación
        mime: '',
        body: '',
        thumbnail: ''
    };

    switch (assetDataFormat) {
    case 'svg':
        payload.mime = 'image/svg+xml';
        payload.body = assetDataUrl.replace('data:image/svg+xml;base64,', '');
        break;
    case 'png':
        payload.mime = 'image/png';
        payload.body = assetDataUrl.replace('data:image/png;base64,', '');
        break;
    default:
        alert(`Cannot serialize for format: ${assetDataFormat}`); // eslint-disable-line
    }

    // No generes la miniatura del activo bruto. En su lugar, usa la utilidad getCostumeUrl
    // que incrusta las fuentes para asegurar que la miniatura muestre las fuentes correctas.
    const inlinedFontDataUrl = getCostumeUrl(costume.asset);
    return jpegThumbnail(inlinedFontDataUrl).then(thumbnail => {
        payload.thumbnail = thumbnail.replace('data:image/jpeg;base64,', '');
        return payload;
    });
};

export default costumePayload;

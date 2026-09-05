// eslint-disable-next-line import/no-unresolved
import soundThumbnail from '!base64-loader!./sound-thumbnail.jpg?';

const soundPayload = sound => {
    const assetDataUrl = sound.asset.encodeDataURI();
    const assetDataFormat = sound.dataFormat;
    const payload = {
        type: 'sound',
        name: sound.name,
        thumbnail: soundThumbnail,
        // Parámetros a rellenar a continuación
        mime: '',
        body: ''
    };

    switch (assetDataFormat) {
    case 'wav':
        payload.mime = 'audio/x-wav';
        payload.body = assetDataUrl.replace('data:audio/x-wav;base64,', '');
        break;
    case 'mp3':
        payload.mime = 'audio/mp3';
        // TODO scratch-storage debe ser reparado para que encodeDataURI no
        // siempre anteponga el encabezado de formato de onda; Una vez que se arregle, lo siguiente
        // la lía tendrá que cambiar.
        payload.body = assetDataUrl.replace('data:audio/x-wav;base64,', '');
        break;
    default:
        alert(`Cannot serialize for format: ${assetDataFormat}`); // eslint-disable-line
    }

    // Devuelve una promesa para hacerlo coherente con otros constructores de carga como costume-payload
    return new Promise(resolve => resolve(payload));
};

export default soundPayload;

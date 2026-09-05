import {ScratchStorage} from 'scratch-storage';

import defaultProject from './default-project';

const BLOCKIDS_ASSET_HOST = 'https://pvvqtqwjacgwwdsesymx.supabase.co/storage/v1/object/public/blockids-assets/';

class Storage extends ScratchStorage {
    constructor () {
        super();
        this.assetHost = BLOCKIDS_ASSET_HOST;
        this.cacheDefaultProject();
    }
    addOfficialScratchWebStores () {
        this.addWebStore(
            [this.AssetType.Project],
            this.getProjectGetConfig.bind(this),
            this.getProjectCreateConfig.bind(this),
            this.getProjectUpdateConfig.bind(this)
        );
        // Use a plain URL (no withCredentials) so the GET request is anonymous —
        // Supabase public buckets return Access-Control-Allow-Origin:* which is
        // incompatible with credentialed requests and causes the fetch to hang.
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap, this.AssetType.Sound],
            asset => `${BLOCKIDS_ASSET_HOST}${asset.assetId}.${asset.dataFormat}`
        );
        this.addWebStore(
            [this.AssetType.Sound],
            asset => `static/extension-assets/scratch3_music/${asset.assetId}.${asset.dataFormat}`
        );
    }
    setProjectHost (projectHost) {
        this.projectHost = projectHost;
    }
    setProjectToken (projectToken) {
        this.projectToken = projectToken;
    }
    getProjectGetConfig (projectAsset) {
        const path = `${this.projectHost}/${projectAsset.assetId}`;
        const qs = this.projectToken ? `?token=${this.projectToken}` : '';
        return path + qs;
    }
    getProjectCreateConfig () {
        return {
            url: `${this.projectHost}/`,
            withCredentials: true
        };
    }
    getProjectUpdateConfig (projectAsset) {
        return {
            url: `${this.projectHost}/${projectAsset.assetId}`,
            withCredentials: true
        };
    }
    setAssetHost (assetHost) {
        this.assetHost = assetHost;
    }
    getAssetGetConfig (asset) {
        return `${this.assetHost}${asset.assetId}.${asset.dataFormat}`;
    }
    getLibraryAssetUrl (md5ext) {
        return `${BLOCKIDS_ASSET_HOST}${md5ext}`;
    }
    getAssetCreateConfig (asset) {
        return {
            // There is no such thing as updating assets, but storage assumes it
            // should update if there is an assetId, and the asset store uses the
            // assetId as part of the create URI. So, force the method to POST.
            // Then when storage finds this config to use for the "update", still POSTs
            method: 'post',
            url: `${this.assetHost}/${asset.assetId}.${asset.dataFormat}`,
            withCredentials: true
        };
    }
    setTranslatorFunction (translator) {
        this.translator = translator;
        this.cacheDefaultProject();
    }
    cacheDefaultProject () {
        const defaultProjectAssets = defaultProject(this.translator);
        defaultProjectAssets.forEach(asset => this.builtinHelper._store(
            this.AssetType[asset.assetType],
            this.DataFormat[asset.dataFormat],
            asset.data,
            asset.id
        ));
    }
}

const storage = new Storage();

// The ProxyTool used internally by scratch-storage tries FetchWorkerTool (Web Worker) first.
// If the Worker initializes but silently fails to process requests, the fetch promise
// never resolves or rejects, causing storage.load to hang indefinitely.
// Fix: remove FetchWorkerTool from the proxy so only FetchTool (direct fetch) is used.
if (storage.webHelper && storage.webHelper.assetTool && storage.webHelper.assetTool.tools) {
    storage.webHelper.assetTool.tools = storage.webHelper.assetTool.tools.slice(1);
}

export default storage;

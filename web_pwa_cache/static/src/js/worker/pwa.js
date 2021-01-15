"use strict";
/* Copyright 2020 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl). */

PWA.include({
    _special_operations: ["create", "unlink", "write", "copy", "create_or_replace", "--call_button"],

    /**
     * @override
     */
    init: function (params) {
        this._isLoaded = false;
        this._super.apply(this, arguments);

        this._components = {};

        this._cache_name = params.cache_name;
        this._prefetched_urls = params.prefetched_urls;

        this._db = new DatabaseManager();
        this._rpc = new OdooRPC();
        this._cache = new CacheManager();

        this._odoodb = new OdooDatabase(this, this._db);
        this.config = new Config(this, this._db);

        this._whenLoaded();
    },

    _whenLoaded: function () {
        if (!this._loadPromise) {
            this._isLoaded = false;
            this._loadPromise = new Promise(async resolve => {
                await this._cache.initCache(this._cache_name);
                await this._db.initDatabase("webclient", this._onUpgradeWebClientDB);
                await this._initComponents();
                this.config.sendToClient();
                this._isLoaded = true;
                return resolve(true);
            });
        }

        return this._loadPromise;
    },

    _initComponents: function () {
        return Promise.all([
            this._addComponent("importer", ComponentImporter),
            this._addComponent("exporter", ComponentExporter),
            this._addComponent("sync", ComponentSync),
            this._addComponent("prefetch", ComponentPrefetch)
        ]);

    },

    _addComponent: function (name, Classref) {
        this._components[name] = new Classref(this);
        return this._components[name].start();
    },

    /**
     * @override
     */
    installWorker: function () {
        return Promise.all([this._super.apply(this, arguments), this._whenLoaded()])
            .then(() => {
                this._components.prefetch.prefetchDataGet(this._cache_name, this._prefetched_urls)
            });
    },

    /**
     * @override
     */
    activateWorker: function () {
        return Promise.all([this._super.apply(this, arguments), this._whenLoaded()]);
    },

    /**
     * Intercepts 'GET' and 'POST' request.
     * If doesn't run the PWA in standalone mode all request goes
     * through network and will be cached.
     * If run in standalone mode:
     *  - online:
     *      If is a CUD operation goes through network, if fails tries from cache.
     *      Other requests goes through cache directly, if fails tries network.
     *  - offline: Tries from cache
     * @override
     */
    processRequest: function (request) {
        return fetch(request);
        if (_.isEmpty(this._components)) {
            // PWA Not Actually Loaded
            console.warn("[ServiceWorker] The components are not currently loaded... Fallback to default browser behaviour.");
            return fetch(request);
        }
        if (request.method === 'GET') {
            return new Promise(async (resolve, reject) => {
                try {
                    const isOffline = await this.config.isOfflineMode();
                    const isStandalone = await this.config.isStandaloneMode();
                    // need redirect '/'?
                    const url = new URL(request.url);
                    if (url.pathname === '/' && (isOffline || isStandalone)) {
                        return resolve(ResponseRedirect('/web'));
                    }
                    // Strategy: Cache First
                    const response_cache = await this._cache.get(this._cache_name).match(request);
                    if (response_cache) {
                        return resolve(response_cache);
                    }
                    if (isStandalone && !this._prefetch_run) {
                        // Try from "dynamic" cache
                        try {
                            const request_cloned_cache = request.clone();
                            const response_cache = await this._tryGetFromCache(
                                request_cloned_cache
                            );
                            return resolve(response_cache);
                        } catch (err) {
                            console.log("[ServiceWorker] Can't process GET request '"+ url.pathname +"'. Fallback to browser behaviour...");
                            console.log(err);
                        }
                    }
                    // Fallback
                    if (!isOffline && request.cache !== 'only-if-cached') {
                        return resolve(fetch(request));
                    }
                    return reject();
                } catch (err) {
                    return reject(err);
                }
            });
        } else if (
            request.method === "POST" &&
            request.headers.get("Content-Type") === "application/json"
        ) {
            return new Promise(async (resolve, reject) => {
                try {
                    const isStandalone = await this.config.isStandaloneMode();
                    if (isStandalone) {
                        const isOffline = await this.config.isOfflineMode();
                        const request_cloned_cache = request.clone();
                        // Try CUD operations
                        // Methodology: Network first
                        if (!isOffline) {
                            const request_oper = this._getRequestOperation(request);
                            if (this._special_operations.indexOf(request_oper) !== -1) {
                                const response_net = await this._tryFromNetwork(
                                    request
                                );
                                if (response_net) {
                                    return resolve(response_net);
                                }
                            }
                        }

                        // Don try from cache if a prefetch tasks is running
                        if (!this._prefetch_run) {
                            // Other request (or network fails) go directly from cache
                            try {
                                const response_cache = await this._tryPostFromCache(
                                    request_cloned_cache
                                );
                                return resolve(response_cache);
                            } catch (err) {
                                const request_url = new URL(request.url);
                                console.log(
                                    `[ServiceWorker] The POST request can't be processed: '${request_url.pathname}' content cached not found! Fallback to default browser behaviour...`
                                );
                                console.log(err);
                                if (isOffline) {
                                    const request_url = new URL(request.url);
                                    this.postClientPageMessage({
                                        type: "PWA_CACHE_FAIL",
                                        error: err,
                                        url: request_url.pathname,
                                    });
                                }
                            }
                        }

                        // If all fails fallback to network (excepts in offline mode)
                        if (isOffline) {
                            // Avoid default browser behaviour
                            return reject();
                        }

                        const response_net = await this._tryFromNetwork(request);
                        return resolve(response_net);
                    }
                } catch (err) {
                    // do nothing
                }

                return resolve(fetch(request));
            });
        }
        return fetch(request);
    },

    /**
     * Try obtain the operation of the request.
     *
     * @private
     * @param {FetchRequest} request_cloned
     * @returns {String}
     */
    _getRequestOperation: function (request_cloned) {
        const url = new URL(request_cloned.url);
        if (
            url.pathname.startsWith("/web/dataset/call_kw/") ||
            url.pathname.startsWith("/web/dataset/call/")
        ) {
            const pathname_parts = url.pathname.split("/");
            const method_name = pathname_parts[5];
            return method_name;
        } else if (url.pathname.startsWith("/web/dataset/call_button")) {
            return "--call_button";
        }
        return "";
    },

    /**
     * Creates the schema of the used database:
     *  - views: Store views
     *  - actions: Store actions
     *  - records: Store model records
     *  - sync: Store transactions to synchronize
     *  - config: Store PWA configurations values
     *  - functions: Store function calls results
     *  - post: Store post calls results
     *  - userdata: Store user data configuration values
     *  - onchange: Store onchange values
     *  - template: Store templates
     *  - model: Store model information
     *  - model_data: Store ir.model.data records to improve
     *                search performance
     *
     * @private
     * @param {IDBDatabaseEvent} evt
     */
    _onUpgradeWebClientDB: function (evt) {
        const db = evt.target.result;
        if (evt.oldVersion < 1) { // New Database
            console.log("[ServiceWorker] Generating DB Schema...");
            db.createObjectStore("views", {keyPath: ["model", "view_id", "type"]});
            db.createObjectStore("actions", {keyPath: "id"});
            let objectStore = db.createObjectStore("records", {
                keyPath: ["__model", "id"],
                unique: true,
            });
            objectStore.createIndex("model", "__model", {unique: false});
            db.createObjectStore("sync", {autoIncrement: true});
            db.createObjectStore("config", {keyPath: "param", unique: true});
            db.createObjectStore("function", {
                keyPath: ["model", "method", "params"],
                unique: true,
            });
            db.createObjectStore("post", {
                keyPath: ["pathname", "params"],
                unique: true,
            });
            db.createObjectStore("userdata", {keyPath: "param", unique: true});
            objectStore = db.createObjectStore("onchange", {
                keyPath: "id",
                unique: true,
            });
            objectStore.createIndex("model", "model", {unique: false});
            objectStore.createIndex("model_field_value", ["model", "field", "field_value"], {unique: false});
            db.createObjectStore("template", {
                keyPath: "xml_ref",
                unique: true,
            });
            db.createObjectStore("model", {
                keyPath: "model",
                unique: true,
            });
            // Use a separated table instead of 'records' to improve search performance
            objectStore = db.createObjectStore("model_data", {
                keyPath: "id",
                unique: true,
            });
            objectStore.createIndex("module_name", ["module", "name"], {unique: true});
            objectStore = db.createObjectStore("defaults", {
                keyPath: "id",
                unique: true,
            });
            objectStore.createIndex("module", "module", {unique: false});
        } else { // Upgrade Database
            // switch (evt.oldVersion) {
            //     case 1: {
            //         console.log("[ServiceWorker] Updating Old DB Schema to v2...");
            //         ...
            //     }
            //     case 2: {
            //         console.log("[ServiceWorker] Updating Old DB Schema to v3...");
            //         ...
            //     }
            // }
        }
    },

    /**
     * @private
     * @param {Promise} request_cloned
     */
    _tryFromNetwork: function (request) {
        return new Promise(async (resolve, reject) => {
            const request_cloned_net = request.clone();
            try {
                const response_net = await fetch(request_cloned_net);
                if (response_net) {
                    const request_oper = this._getRequestOperation(request_cloned_net);
                    // Handle special operations
                    if (this._special_operations.indexOf(request_oper) !== -1) {
                        await this._components.prefetch.prefetchModelData();
                    } else {
                        const request_data = await request_cloned_net.json();
                        this._processResponse(response_net, request_data);
                    }
                    return resolve(response_net);
                }
            } catch (err) {
                return reject(err);
            }
            return reject();
        });
    },

    /**
     * @private
     * @returns {Promise[Response]}
     */
    _tryPostFromCache: function (request_cloned_cache) {
        return new Promise(async (resolve, reject) => {
            try {
                const request_data = await request_cloned_cache.json();
                const url = new URL(request_cloned_cache.url);
                for (let [key, fnct] of Object.entries(this._routes.post.out)) {
                    if (url.pathname.startsWith(key)) {
                        const result = await this[fnct].call(this, url, request_data);
                        this._components.sync.updateClientCount();
                        return resolve(result);
                    }
                }
                // Generic Post Cache
                return resolve(await this._routeOutGenericPost(url, request_data));
            } catch (err) {
                return reject(err);
            }
        });
    },

    /**
     * @private
     * @returns {Promise[Response]}
     */
    _tryGetFromCache: function (request_cloned_cache) {
        return new Promise(async (resolve, reject) => {
            const url = new URL(request_cloned_cache.url);
            for (let [key, fnct] of Object.entries(this._routes.get)) {
                if (url.pathname.startsWith(key)) {
                    try {
                        const result = await this[fnct].call(this, url);
                        return resolve(result);
                    } catch (err) {
                        return reject(err);
                    }
                }
            }
            return reject();
        });
    },

    /**
     * Process request response to cache the values
     *
     * @private
     * @param {FetchResponse} response
     * @param {Object} request_data
     * @return {Promise}
     */
    _processResponse: function (response, request_data) {
        console.log("[ServiceWorker] Processing Response...");
        if (!response) {
            return false;
        }
        const response_cloned = response.clone();
        return new Promise(async (resolve, reject) => {
            try {
                const response_data = await response_cloned.json();
                const url = new URL(response_cloned.url);
                for (let [key, fnct] of Object.entries(this._routes.post.in)) {
                    if (url.pathname.startsWith(key)) {
                        await this[fnct].call(this, url, response_data, request_data);
                        break;
                    }
                }
            } catch (err) {
                return reject(err);
            }

            return resolve();
        });
    },
});
